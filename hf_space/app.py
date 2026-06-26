"""
VOID Core — Hugging Face CPU Basic Space
Runs Phi-3-mini-4k-instruct (Q4_K_M GGUF) via llama-cpp-python.
Exposes OpenAI-compatible REST API at /v1/chat/completions.
Always on, free, no GPU needed.
"""

import gradio as gr
from fastapi import Request
from fastapi.responses import JSONResponse
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

print("Downloading Phi-3-mini GGUF model...")
model_path = hf_hub_download(
    repo_id="bartowski/Phi-3-mini-4k-instruct-GGUF",
    filename="Phi-3-mini-4k-instruct-Q4_K_M.gguf",
)
print("Loading model...")
llm = Llama(
    model_path=model_path,
    n_ctx=4096,
    n_threads=2,
    n_batch=512,
    verbose=False,
)
print("VOID Core ready.")


# Minimal Gradio UI (required for the Space to run)
with gr.Blocks(title="VOID Core", theme=gr.themes.Monochrome()) as demo:
    gr.Markdown("## VOID Core\n`Phi-3-mini-4k-instruct` — API at `/v1/chat/completions`")


@demo.app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    max_tokens = min(int(body.get("max_tokens", 512)), 1024)

    if not messages:
        return JSONResponse({"error": {"message": "No messages"}}, status_code=400)

    try:
        result = llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
            stop=["<|end|>", "<|user|>"],
        )
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": {"message": str(e)}}, status_code=500)


@demo.app.get("/health")
def health():
    return {"status": "online", "model": "Phi-3-mini-4k-instruct-Q4_K_M"}


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
