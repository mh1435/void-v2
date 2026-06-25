import http.server
import socketserver
import threading
import json
import os
import urllib.request
import urllib.parse
import urllib.error

PORT = 8080

SETTINGS_FILE = "settings.json"
MEMORY_FILE = "memory.json"
TASKS_FILE = "tasks.json"
COMMANDS_FILE = "commands.json"
WIDGETS_FILE = "widgets.json"
MAX_HISTORY = 40

DEFAULT_SETTINGS = {
    "theme": "frost",
    "apiKey": "",
    "geminiKey": "",
    "groqKey": "",
    "model": "meta-llama/llama-3.2-3b-instruct:free",
    "groqModel": "llama-3.3-70b-versatile",
    "geminiModel": "gemini-2.5-flash",
    "providerOrder": ["gemini", "groq", "openrouter"],
    "activeProvider": "",
    "activeModel": "",
    "mapProvider": "google",
    "lang": "auto",
    "reducedMotion": False,
    "responseMode": "standard",
    "voiceEnabled": True,
    "voiceRate": 1.0,
    "voicePitch": 1.0,
    "voiceName": "",
    "floatingAssistantEnabled": False
}

SYSTEM_PROMPT_BASE = """
You are Void.

Identity:
- Name: Void
- You are the AI core of the Void Control System.
- You are not ChatGPT and you do not refer to yourself as one.

Personality:
- Intelligent, calm, direct, helpful, technical.
- You don't pad answers with filler or over-apologize.

Behavior:
- Remember previous conversation context.
- Answer naturally and concisely unless depth is asked for.
- Help with coding, engineering, learning, research, navigation, and weather questions.
- When fixing code, provide complete working code whenever possible.

App opening:
- You can open a small fixed set of apps on the user's phone: YouTube, Maps,
  Spotify, WhatsApp, Instagram, Gmail, and the phone's camera.
- To do this, end your reply with a tag on its own line in exactly this form:
  [[OPEN:app_id:optional search or query text]]
  Valid app_id values: youtube, maps, spotify, whatsapp, instagram, gmail, camera
  Examples:
  [[OPEN:youtube:lofi hip hop radio]]
  [[OPEN:maps:Eiffel Tower]]
  [[OPEN:camera:]]
- Only output this tag when the user actually asked you to open, play, search
  in, or launch one of these apps. Never include it otherwise.
- You cannot open any app outside this fixed list — if asked for one not on
  the list, say plainly that you can't open that one yet and name which
  apps you can open instead.
- Write your normal reply text first, then the tag on its own line after.
"""


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, data):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save error:", path, e)


app_settings = {**DEFAULT_SETTINGS, **load_json(SETTINGS_FILE, {})}
conversation_history = load_json(MEMORY_FILE, [])
tasks_list = load_json(TASKS_FILE, [])
custom_commands = load_json(COMMANDS_FILE, [])
canvas_widgets_layout = load_json(WIDGETS_FILE, {})

# Flat catalog of every selectable model across providers.
# The front end uses this to render one unified model picker.
MODEL_CATALOG = [
    {"id": "gemini-2.5-flash", "provider": "gemini", "label": "Gemini 2.5 Flash"},
    {"id": "gemini-2.5-flash-lite", "provider": "gemini", "label": "Gemini 2.5 Flash-Lite"},
    {"id": "llama-3.3-70b-versatile", "provider": "groq", "label": "Llama 3.3 70B"},
    {"id": "llama-3.1-8b-instant", "provider": "groq", "label": "Llama 3.1 8B"},
    {"id": "meta-llama/llama-3.2-3b-instruct:free", "provider": "openrouter", "label": "Llama 3.2 3B"},
    {"id": "qwen/qwen3-next-80b-a3b-instruct:free", "provider": "openrouter", "label": "Qwen3 Next 80B"},
    {"id": "google/gemma-4-26b-a4b-it:free", "provider": "openrouter", "label": "Gemma 4 26B"},
]


WEATHER_KEYWORDS = (
    "weather", "forecast", "rain", "raining", "temperature outside", "how hot", "how cold",
    "sunny", "snow", "snowing", "humidity", "wind speed",
    "الطقس", "الجو", "حرارة", "مطر", "الرطوبة"
)


def message_wants_weather(message):
    lower = message.lower()
    return any(kw in lower for kw in WEATHER_KEYWORDS)


def build_system_prompt(lang, location, response_mode="standard", weather_block=None):
    prompt = SYSTEM_PROMPT_BASE

    if response_mode == "concise":
        prompt += "\nKeep replies short — a few sentences at most unless the user explicitly asks for more detail.\n"
    elif response_mode == "detailed":
        prompt += "\nGive thorough, detailed replies with explanation and context, not just the short answer.\n"

    if lang == "ar":
        prompt += "\n\nRespond only in Arabic (العربية), regardless of what language the user writes in.\n"
    elif lang == "en":
        prompt += "\n\nRespond only in English, regardless of what language the user writes in.\n"
    else:
        prompt += "\n\nRespond in the same language the user writes in. If they write in Arabic, reply in Arabic.\n"

    if location:
        prompt += (
            f"\nThe user's current approximate location is: {location.get('label', 'unknown')} "
            f"(latitude {location.get('lat')}, longitude {location.get('lon')}). "
            "If the user asks for directions, navigation, or to be guided somewhere, "
            "tell them you can open directions for them and ask for the destination if they "
            "haven't given one, since you cannot browse or navigate directly yourself.\n"
        )

    if weather_block:
        prompt += (
            f"\nLive weather data for the user's location, just fetched:\n{weather_block}\n"
            "Use these exact figures when answering weather questions — don't ask the user "
            "for a location or say you can't access live data, you already have it above. "
            "If they ask about a day beyond what's listed, say you only have a short-range forecast.\n"
        )
    elif location is None:
        prompt += (
            "\nIf the user asks about weather and you don't have live weather data above, "
            "ask them to allow location access in Settings → Location & GPS, or to name a city.\n"
        )

    return prompt


class ProviderError(Exception):
    pass


def fetch_weather_data(lat, lon):
    """Fetch current conditions + a few days of daily forecast from Open-Meteo.
    Returns a dict with 'current' and 'daily' (list of day dicts), or raises on failure.
    """
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,"
        "wind_speed_10m,weather_code,surface_pressure,is_day"
        "&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max"
        "&timezone=auto&forecast_days=3"
    )
    with urllib.request.urlopen(url, timeout=15) as response:
        data = json.loads(response.read().decode("utf-8"))

    current = data.get("current", {})
    daily_raw = data.get("daily", {})
    days = []
    dates = daily_raw.get("time", [])
    for i, date in enumerate(dates):
        days.append({
            "date": date,
            "temp_max": round(daily_raw.get("temperature_2m_max", [0])[i], 1),
            "temp_min": round(daily_raw.get("temperature_2m_min", [0])[i], 1),
            "description": weather_code_to_text(daily_raw.get("weather_code", [0])[i]),
            "precip_chance": daily_raw.get("precipitation_probability_max", [0])[i],
        })

    return {
        "current": {
            "temp": round(current.get("temperature_2m", 0), 1),
            "feels_like": round(current.get("apparent_temperature", 0), 1),
            "humidity": round(current.get("relative_humidity_2m", 0)),
            "wind_speed": round(current.get("wind_speed_10m", 0), 1),
            "pressure": round(current.get("surface_pressure", 0)),
            "description": weather_code_to_text(current.get("weather_code", 0)),
            "weather_code": current.get("weather_code", 0),
            "is_day": bool(current.get("is_day", 1))
        },
        "daily": days
    }


def weather_context_block(weather):
    """Turn fetched weather data into a short factual block the model can quote from."""
    c = weather["current"]
    lines = [
        f"Right now: {c['temp']}°C, {c['description']}, feels like {c['feels_like']}°C, "
        f"humidity {c['humidity']}%, wind {c['wind_speed']} m/s."
    ]
    day_labels = ["Today", "Tomorrow", "Day after tomorrow"]
    for i, day in enumerate(weather.get("daily", [])):
        label = day_labels[i] if i < len(day_labels) else day["date"]
        lines.append(
            f"{label} ({day['date']}): {day['description']}, high {day['temp_max']}°C, "
            f"low {day['temp_min']}°C, {day['precip_chance']}% chance of precipitation."
        )
    return "\n".join(lines)


def call_openai_compatible(url, api_key, model, system_prompt, history, extra_headers=None):
    """Used for Groq and OpenRouter — both speak the OpenAI chat/completions format.
    Neither is wired for vision here, so any image-attached entries are flattened
    to their text portion only.
    """
    flat_history = []
    for msg in history:
        content = msg["content"]
        if isinstance(content, dict):
            text = content.get("text") or "[image attached — not supported by this provider]"
            flat_history.append({"role": msg["role"], "content": text})
        else:
            flat_history.append(msg)

    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + flat_history
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST"
    )
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Content-Type", "application/json")
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)

    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"]

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise ProviderError(f"HTTP {e.code}: {body[:300]}")
    except urllib.error.URLError as e:
        raise ProviderError(f"network error: {e.reason}")
    except TimeoutError:
        raise ProviderError("request timed out")
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise ProviderError(f"unexpected response shape: {e}")


def call_gemini(api_key, model, system_prompt, history):
    """Gemini uses a different request/response shape: contents/parts instead of messages.
    History entries may have a plain string 'content', or a dict with
    {'text': ..., 'image_base64': ..., 'image_mime': ...} for image attachments.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    contents = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        content = msg["content"]

        if isinstance(content, dict):
            parts = []
            if content.get("text"):
                parts.append({"text": content["text"]})
            if content.get("image_base64"):
                parts.append({
                    "inline_data": {
                        "mime_type": content.get("image_mime", "image/jpeg"),
                        "data": content["image_base64"]
                    }
                })
        else:
            parts = [{"text": content}]

        contents.append({"role": role, "parts": parts})

    payload = {
        "contents": contents,
        "system_instruction": {"parts": [{"text": system_prompt}]}
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST"
    )
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["candidates"][0]["content"]["parts"][0]["text"]

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise ProviderError(f"HTTP {e.code}: {body[:300]}")
    except urllib.error.URLError as e:
        raise ProviderError(f"network error: {e.reason}")
    except TimeoutError:
        raise ProviderError("request timed out")
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise ProviderError(f"unexpected response shape: {e}")


class ThreadedVoidServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


class VoidRequestHandler(http.server.SimpleHTTPRequestHandler):

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8")) if raw else {}

    # ---------------- GET ----------------

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.end_headers()
            with open("index.html", "rb") as file:
                self.wfile.write(file.read())

        elif path == "/api/settings":
            self._send_json(200, app_settings)

        elif path == "/api/models":
            self._send_json(200, {"models": MODEL_CATALOG})

        elif path == "/api/tasks":
            self._send_json(200, {"tasks": tasks_list})

        elif path == "/api/commands":
            self._send_json(200, {"commands": custom_commands})

        elif path == "/api/widgets":
            self._send_json(200, canvas_widgets_layout)

        elif path == "/api/weather":
            self._handle_weather(query)

        elif path == "/api/reverse-geocode":
            self._handle_reverse_geocode(query)

        else:
            super().do_GET()

    # ---------------- POST ----------------

    def do_POST(self):
        if self.path == "/api/chat":
            self._handle_chat()
        elif self.path == "/api/clear":
            self._handle_clear()
        elif self.path == "/api/settings":
            self._handle_save_settings()
        elif self.path == "/api/tasks":
            self._handle_save_tasks()
        elif self.path == "/api/commands":
            self._handle_save_commands()
        elif self.path == "/api/widgets":
            self._handle_save_widgets()
        else:
            self.send_error(404)

    # ---------------- Handlers ----------------

    def _handle_save_tasks(self):
        global tasks_list
        try:
            data = self._read_json_body()
            tasks_list = data.get("tasks", [])
            save_json(TASKS_FILE, tasks_list)
            self._send_json(200, {"status": "success", "tasks": tasks_list})
        except Exception as e:
            self._send_json(500, {"status": "error", "message": str(e)})

    def _handle_save_commands(self):
        global custom_commands
        try:
            data = self._read_json_body()
            custom_commands = data.get("commands", [])
            save_json(COMMANDS_FILE, custom_commands)
            self._send_json(200, {"status": "success", "commands": custom_commands})
        except Exception as e:
            self._send_json(500, {"status": "error", "message": str(e)})

    def _handle_save_widgets(self):
        global canvas_widgets_layout
        try:
            data = self._read_json_body()
            canvas_widgets_layout = data
            save_json(WIDGETS_FILE, canvas_widgets_layout)
            self._send_json(200, {"status": "success"})
        except Exception as e:
            self._send_json(500, {"status": "error", "message": str(e)})

    def _handle_save_settings(self):
        global app_settings
        try:
            data = self._read_json_body()
            app_settings = {**app_settings, **data}
            save_json(SETTINGS_FILE, app_settings)
            self._send_json(200, {"status": "success"})
        except Exception as e:
            self._send_json(500, {"status": "error", "message": str(e)})

    def _handle_clear(self):
        global conversation_history
        conversation_history = []
        save_json(MEMORY_FILE, conversation_history)
        self._send_json(200, {"status": "success"})

    def _handle_weather(self, query):
        try:
            lat = query.get("lat", [None])[0]
            lon = query.get("lon", [None])[0]
            if lat is None or lon is None:
                self._send_json(400, {"error": "lat and lon required"})
                return

            weather = fetch_weather_data(lat, lon)
            result = dict(weather["current"])
            if weather.get("daily"):
                today = weather["daily"][0]
                result["temp_max"] = today["temp_max"]
                result["temp_min"] = today["temp_min"]
            self._send_json(200, result)

        except Exception as e:
            print("Weather error:", e)
            self._send_json(500, {"error": str(e)})

    def _handle_reverse_geocode(self, query):
        try:
            lat = query.get("lat", [None])[0]
            lon = query.get("lon", [None])[0]
            if lat is None or lon is None:
                self._send_json(400, {"error": "lat and lon required"})
                return

            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=14"
            req = urllib.request.Request(url, headers={
                "User-Agent": "VoidLocalAssistant/1.0 (personal use)"
            })
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))

            address = data.get("address", {})
            label_parts = [
                address.get("suburb") or address.get("neighbourhood") or address.get("city_district"),
                address.get("city") or address.get("town") or address.get("village"),
                address.get("country")
            ]
            label = ", ".join([p for p in label_parts if p]) or data.get("display_name", "Unknown location")

            self._send_json(200, {"label": label})

        except Exception as e:
            print("Reverse geocode error:", e)
            self._send_json(500, {"error": str(e)})

    def _handle_chat(self):
        try:
            data = self._read_json_body()
            user_msg = (data.get("message") or "").strip()
            image_base64 = data.get("image_base64")
            image_mime = data.get("image_mime")

            if not user_msg and not image_base64:
                self._send_json(200, {"status": "success", "reply": ""})
                return

            providers = {
                "openrouter": {
                    "key": data.get("openrouter_key") or app_settings.get("apiKey"),
                    "model": data.get("model") or app_settings.get("model"),
                },
                "gemini": {
                    "key": data.get("gemini_key") or app_settings.get("geminiKey"),
                    "model": data.get("gemini_model") or app_settings.get("geminiModel"),
                },
                "groq": {
                    "key": data.get("groq_key") or app_settings.get("groqKey"),
                    "model": data.get("groq_model") or app_settings.get("groqModel"),
                },
            }
            provider_order = data.get("provider_order") or app_settings.get("providerOrder", ["gemini", "groq", "openrouter"])

            # If the user picked a specific model via the unified model picker,
            # force that provider/model to the front of the chain and use that exact model.
            active_provider = data.get("active_provider") or app_settings.get("activeProvider")
            active_model = data.get("active_model") or app_settings.get("activeModel")
            if active_provider and active_provider in providers:
                if active_model:
                    providers[active_provider]["model"] = active_model
                provider_order = [active_provider] + [p for p in provider_order if p != active_provider]

            # Only Gemini is wired for vision here — if an image came in, make sure
            # Gemini is tried first regardless of the user's normal provider order.
            if image_base64 and "gemini" in provider_order:
                provider_order = ["gemini"] + [p for p in provider_order if p != "gemini"]

            lang = data.get("lang") or app_settings.get("lang", "auto")
            location = data.get("location")
            response_mode = data.get("response_mode") or app_settings.get("responseMode", "standard")

            print(f"[USER] {user_msg}{' [+image]' if image_base64 else ''}")
            reply = self.call_ai(
                user_msg, providers, provider_order, lang, location, response_mode,
                image_base64=image_base64, image_mime=image_mime
            )
            self._send_json(200, {"status": "success", "reply": reply})

        except Exception as e:
            print("POST ERROR:", e)
            self._send_json(500, {"status": "error", "reply": str(e)})

    def call_ai(self, message, providers, provider_order, lang, location, response_mode="standard",
                image_base64=None, image_mime=None):
        global conversation_history

        configured = [p for p in provider_order if providers.get(p, {}).get("key")]

        if not configured:
            return ("No API key set for any provider. Go to Settings → API keys and add a key "
                    "for Gemini, Groq, or OpenRouter (all have free tiers).")

        if image_base64:
            conversation_history.append({
                "role": "user",
                "content": {
                    "text": message or "What's in this image?",
                    "image_base64": image_base64,
                    "image_mime": image_mime or "image/jpeg"
                }
            })
        else:
            conversation_history.append({"role": "user", "content": message})

        if len(conversation_history) > MAX_HISTORY:
            conversation_history = conversation_history[-MAX_HISTORY:]


        weather_block = None
        if location and message_wants_weather(message):
            try:
                weather = fetch_weather_data(location.get("lat"), location.get("lon"))
                weather_block = weather_context_block(weather)
            except Exception as e:
                print("Weather fetch for chat failed:", e)
                # fall through with weather_block=None — the prompt still tells the model
                # it has a location, just not fresh numbers, rather than silently lying

        system_prompt = build_system_prompt(lang, location, response_mode, weather_block)
        errors = []

        for provider_name in configured:
            cfg = providers[provider_name]
            try:
                if provider_name == "gemini":
                    reply = call_gemini(cfg["key"], cfg["model"], system_prompt, conversation_history)
                elif provider_name == "groq":
                    reply = call_openai_compatible(
                        "https://api.groq.com/openai/v1/chat/completions",
                        cfg["key"], cfg["model"], system_prompt, conversation_history
                    )
                else:  # openrouter
                    reply = call_openai_compatible(
                        "https://openrouter.ai/api/v1/chat/completions",
                        cfg["key"], cfg["model"], system_prompt, conversation_history,
                        extra_headers={"HTTP-Referer": "http://localhost:8080", "X-Title": "Void AI"}
                    )

                conversation_history.append({"role": "assistant", "content": reply})
                save_json(MEMORY_FILE, conversation_history)
                print(f"[VOID via {provider_name}] {reply[:120]}")
                return reply

            except ProviderError as e:
                print(f"[{provider_name} failed] {e}")
                errors.append(f"{provider_name}: {e}")
                continue

        # every configured provider failed — drop the user message we appended
        # since nothing answered it, so history doesn't desync
        if conversation_history and conversation_history[-1]["role"] == "user":
            conversation_history.pop()

        return "All configured providers failed:\n" + "\n".join(errors)


WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast clouds",
    45: "Fog", 48: "Freezing fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Slight rain showers", 81: "Rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail"
}


def weather_code_to_text(code):
    return WEATHER_CODES.get(code, "Unknown conditions")


if __name__ == "__main__":
    if not os.path.exists("index.html"):
        print("[!] ERROR: index.html missing.")
        exit(1)

    with ThreadedVoidServer(("0.0.0.0", PORT), VoidRequestHandler) as httpd:
        print("\n==============================================")
        print("VOID AI CORE ONLINE")
        print(f"Port: {PORT}")
        print(f"Memory Entries: {len(conversation_history)}")
        print(f"Local Link: http://127.0.0.1:{PORT}")
        print("==============================================\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nVoid Core Shutdown")
            httpd.server_close()


