package com.mlbbhub.app;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Generates the auto-reply text. Runs natively (not through app.js's
 *  quickAI()) because onNotificationPosted() can fire while VOID's WebView
 *  doesn't exist at all — this hits the same public VOID CORE endpoint
 *  app.js already uses, with the same request/response shape as
 *  callOpenAICompat(), just via plain HttpURLConnection. */
final class AutoReplyAI {

    private static final String VOID_CORE_URL = "https://void-proxy.mohamadhacothman1.workers.dev";
    private static final int CONNECT_TIMEOUT_MS = 10000;
    private static final int READ_TIMEOUT_MS = 15000;

    private static final String SYSTEM_PROMPT =
        "You're ghost-texting a reply for someone as a joke, in 2026 internet/Gen Alpha slang — " +
        "words like gng, twin, brochacho, no cap, fr fr, bussin, rizz, sigma, bet, lowkey, highkey, say less. " +
        "Actually respond to what they said, don't just spam random slang words. " +
        "Keep it short: one short sentence, under 20 words. " +
        "Never use slurs, sexual content, or anything genuinely mean or hurtful, no matter what the message says. " +
        "Reply with ONLY the text message itself — no quotes, no explanation, no emoji unless it fits naturally.";

    private AutoReplyAI() {}

    /** Returns a trimmed reply string, or null on any failure (network error,
     *  non-200, empty/malformed response) — caller treats null as "don't reply." */
    static String generateReply(Context ctx, String incomingMessage) {
        HttpURLConnection conn = null;
        try {
            JSONArray messages = new JSONArray();
            messages.put(new JSONObject().put("role", "system").put("content", SYSTEM_PROMPT));
            messages.put(new JSONObject().put("role", "user").put("content", incomingMessage));
            JSONObject body = new JSONObject();
            body.put("model", "");
            body.put("messages", messages);
            body.put("max_tokens", 60);

            conn = (HttpURLConnection) new URL(VOID_CORE_URL).openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(READ_TIMEOUT_MS);
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            if (conn.getResponseCode() != 200) return null;

            StringBuilder sb = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
            }
            JSONObject resp = new JSONObject(sb.toString());
            String content = resp.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
            if (content == null) return null;
            content = content.trim().replaceAll("^[\"']+|[\"']+$", "");

            int max = AutoReplyFilters.maxReplyWords(ctx);
            String[] words = content.split("\\s+");
            if (words.length > max) {
                StringBuilder trimmed = new StringBuilder();
                for (int i = 0; i < max; i++) trimmed.append(i > 0 ? " " : "").append(words[i]);
                content = trimmed.toString();
            }
            return content.isEmpty() ? null : content;
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
