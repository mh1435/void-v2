"""
VOID Core — Hugging Face Space
Runs microsoft/Phi-3-mini-4k-instruct with ZeroGPU (free A10G GPU).
Exposes an OpenAI-compatible REST API at /v1/chat/completions.
"""

import gradio as gr
from fastapi import Request
from fastapi.responses import JSONResponse

MODEL_ID = "microsoft/Phi-3-mini-4k-instruct"
_pipe = None


def get_pipe():
    global _pipe
    if _pipe is None:
        from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
        import torch
        tok = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
        mdl = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype="auto",
            device_map="auto",
            trust_remote_code=True,
        )
        _pipe = pipeline("text-generation", model=mdl, tokenizer=tok)
    return _pipe


# ZeroGPU decorator — allocates a free A10G GPU for each request
try:
    import spaces

    @spaces.GPU(duration=120)
    def infer(messages, max_tokens):
        out = get_pipe()(
            messages,
            max_new_tokens=max_tokens,
            return_full_text=False,
            do_sample=False,
        )
        return out[0]["generated_text"]

except ImportError:
    # Local dev / CPU fallback
    def infer(messages, max_tokens):
        out = get_pipe()(
            messages,
            max_new_tokens=max_tokens,
            return_full_text=False,
            do_sample=False,
        )
        return out[0]["generated_text"]


# ── Gradio UI (required for ZeroGPU + gives the Space a web page) ──────────
with gr.Blocks(title="VOID Core", theme=gr.themes.Monochrome()) as demo:
    gr.Markdown("# VOID Core\n`microsoft/Phi-3-mini-4k-instruct` — REST API at `/v1/chat/completions`")


# ── REST API mounted on Gradio's internal FastAPI ───────────────────────────
@demo.app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    max_tokens = min(int(body.get("max_tokens", 1024)), 2048)

    if not messages:
        return JSONResponse({"error": {"message": "No messages provided"}}, status_code=400)

    try:
        content = infer(messages, max_tokens)
        return JSONResponse({
            "choices": [{"message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
            "model": MODEL_ID,
        })
    except Exception as e:
        return JSONResponse({"error": {"message": str(e)}}, status_code=500)


@demo.app.get("/health")
def health():
    return {"status": "online", "model": MODEL_ID}


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
