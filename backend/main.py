# Simple FastAPI backend that matches the frontend ChatInputBar behavior.
# - POST /api/chat returns JSON {"reply": "..."}
# - If client requests Accept: text/event-stream the endpoint will stream SSE chunks.

import os
import asyncio
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Use the official genai client (from google-genai package)
from google import genai

# Load environment variables from .env (if present)
load_dotenv()

app = FastAPI()


class ChatRequest(BaseModel):
    message: str


# Initialize Gemini client
# Try a few common env var names so it's easier to configure
GENAI_API_KEY = (
    os.getenv("GOOGLE_API_KEY")
    or os.getenv("GEMINI_API_KEY")
    or os.getenv("GEMINI_APIKEY")
    or os.getenv("API_KEY")
)

if not GENAI_API_KEY:
    raise RuntimeError(
        "No Gemini API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY in your environment/.env"
    )

# Default model (change if you want a different one)
GENIE_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GENAI_API_KEY)


async def gemini_full(prompt: str) -> str:
    """
    Request a full (non-streaming) completion from Gemini using genai client.
    """
    def _call() -> str:
        resp = client.models.generate_content(
            model=GENIE_MODEL,
            contents=prompt,
        )
        # google-genai responses expose a .text attribute
        text = getattr(resp, "text", None)
        if text is None:
            text = str(resp)
        return text

    # Run the synchronous call in a separate thread so we don't block the event loop
    try:
        return await asyncio.to_thread(_call)
    except Exception as e:
        return f"[error] {e}"


async def gemini_stream_sim(prompt: str) -> AsyncIterator[str]:
    """
    Simple streaming implementation: get full reply and yield it in chunks.
    Replace with true streaming API if/when available in genai.
    """
    full = await gemini_full(prompt)

    # If the call returned an error prefix, yield it once and finish
    if full.startswith("[error]"):
        yield full
        return

    # Split into small chunks to simulate streaming
    words = full.split()
    for i in range(0, len(words), 6):
        chunk = " ".join(words[i: i + 6])
        await asyncio.sleep(0.07)
        yield chunk


@app.post("/api/chat")
async def chat_endpoint(req: Request, body: ChatRequest):
    """
    If client asks for text/event-stream via Accept header we stream SSE chunks.
    Otherwise return a single JSON reply object { "reply": "..." }.
    """
    accept = (req.headers.get("accept") or "").lower()
    prompt = body.message or ""

    # SSE streaming mode
    if "text/event-stream" in accept:

        async def event_stream():
            async for chunk in gemini_stream_sim(prompt):
                # SSE data line
                yield f"data: {chunk}\n\n"
            # final event to indicate completion
            yield "event: done\ndata: [DONE]\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    # Non-streaming JSON response
    reply = await gemini_full(prompt)
    return JSONResponse({"reply": reply})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
