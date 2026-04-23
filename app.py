"""
Qwen Lens Studio - FastAPI Application
5-tab vision-language interface: Visual Reasoning, Multilingual, Document IQ,
Code Lens, Dual Compare.
"""
import os
import json
import base64
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from qwen_client import get_client, reset_client, StreamChunk
from processors import (
    VisualReasoningProcessor,
    MultilingualProcessor,
    DocumentIQProcessor,
    CodeLensProcessor,
    DualCompareProcessor,
)

load_dotenv()


# Global processor instances
processors = {
    "reasoning": VisualReasoningProcessor(),
    "multilingual": MultilingualProcessor(),
    "document_iq": DocumentIQProcessor(),
    "code_lens": CodeLensProcessor(),
    "dual_compare": DualCompareProcessor(),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Processors initialized")
    yield
    reset_client()
    print("Client reset")


app = FastAPI(
    title="Qwen Lens Studio",
    description="Interactive Qwen vision-language playground",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/api/health")
async def health_check():
    has_env_key = bool(os.getenv("OPENROUTER_API_KEY", ""))
    client = get_client()
    backend = getattr(client, "backend", os.getenv("INFERENCE_BACKEND", "openrouter"))
    return {
        "status": "healthy",
        "mock_mode": os.getenv("MOCK_MODE", "false").lower() == "true",
        "has_env_key": has_env_key,
        "model": client.model,
        "backend": backend,
    }


# ---------- helpers ----------

async def _read_image_b64(upload) -> str:
    """Read a Starlette UploadFile-like object and return base64 string."""
    if upload is None:
        raise HTTPException(status_code=400, detail="image is required")
    # UploadFile has .read(); plain string form field does not.
    if not hasattr(upload, "read"):
        raise HTTPException(status_code=400, detail="image must be a file upload")
    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail="image is empty")
    return base64.b64encode(data).decode("ascii")


async def sse_stream(generator):
    """Convert an async generator of StreamChunks into SSE-formatted lines."""
    async for chunk in generator:
        if isinstance(chunk, StreamChunk):
            data = {
                "content": chunk.content,
                "thinking": chunk.thinking,
                "is_thinking": chunk.is_thinking,
                "is_complete": chunk.is_complete,
                "error": chunk.error,
            }
        else:
            data = {
                "content": str(chunk),
                "thinking": "",
                "is_thinking": False,
                "is_complete": False,
                "error": None,
            }

        yield f"data: {json.dumps(data)}\n\n"

        if isinstance(chunk, StreamChunk) and (chunk.is_complete or chunk.error):
            break

    yield "data: [DONE]\n\n"


# ---------- endpoints ----------

@app.post("/api/reasoning")
async def reasoning_endpoint(
    request: Request,
    x_openrouter_key: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None),
    x_backend: Optional[str] = Header(None),
):
    form = await request.form()
    image = form.get("image")
    question = form.get("question", "") or ""
    show_thinking = (form.get("show_thinking", "false") or "false").lower() == "true"
    custom_system_prompt = form.get("custom_system_prompt") or None

    b64 = await _read_image_b64(image)

    gen = processors["reasoning"].process(
        image_b64=b64,
        question=question,
        show_thinking=show_thinking,
        custom_system_prompt=custom_system_prompt,
        api_key=x_openrouter_key,
        model=x_model_id,
        backend=x_backend,
    )
    return StreamingResponse(sse_stream(gen), media_type="text/event-stream")


@app.post("/api/multilingual")
async def multilingual_endpoint(
    request: Request,
    x_openrouter_key: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None),
    x_backend: Optional[str] = Header(None),
):
    form = await request.form()
    image = form.get("image")
    language = form.get("language", "en") or "en"
    custom_system_prompt = form.get("custom_system_prompt") or None

    b64 = await _read_image_b64(image)

    gen = processors["multilingual"].process(
        image_b64=b64,
        language=language,
        custom_system_prompt=custom_system_prompt,
        api_key=x_openrouter_key,
        model=x_model_id,
        backend=x_backend,
    )
    return StreamingResponse(sse_stream(gen), media_type="text/event-stream")


@app.post("/api/document-iq")
async def document_iq_endpoint(
    request: Request,
    x_openrouter_key: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None),
    x_backend: Optional[str] = Header(None),
):
    form = await request.form()
    image = form.get("image")
    custom_system_prompt = form.get("custom_system_prompt") or None

    b64 = await _read_image_b64(image)

    gen = processors["document_iq"].process(
        image_b64=b64,
        custom_system_prompt=custom_system_prompt,
        api_key=x_openrouter_key,
        model=x_model_id,
        backend=x_backend,
    )
    return StreamingResponse(sse_stream(gen), media_type="text/event-stream")


@app.post("/api/code-lens")
async def code_lens_endpoint(
    request: Request,
    x_openrouter_key: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None),
    x_backend: Optional[str] = Header(None),
):
    form = await request.form()
    image = form.get("image")
    framework = form.get("framework", "html") or "html"
    custom_system_prompt = form.get("custom_system_prompt") or None

    b64 = await _read_image_b64(image)

    gen = processors["code_lens"].process(
        image_b64=b64,
        framework=framework,
        custom_system_prompt=custom_system_prompt,
        api_key=x_openrouter_key,
        model=x_model_id,
        backend=x_backend,
    )
    return StreamingResponse(sse_stream(gen), media_type="text/event-stream")


@app.post("/api/dual-compare")
async def dual_compare_endpoint(
    request: Request,
    x_openrouter_key: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None),
    x_backend: Optional[str] = Header(None),
):
    form = await request.form()
    image1 = form.get("image1")
    image2 = form.get("image2")
    question = form.get("question", "") or ""
    custom_system_prompt = form.get("custom_system_prompt") or None

    if image1 is None or image2 is None:
        raise HTTPException(status_code=400, detail="image1 and image2 are required")

    b64_1 = await _read_image_b64(image1)
    b64_2 = await _read_image_b64(image2)

    gen = processors["dual_compare"].process(
        image1_b64=b64_1,
        image2_b64=b64_2,
        question=question,
        custom_system_prompt=custom_system_prompt,
        api_key=x_openrouter_key,
        model=x_model_id,
        backend=x_backend,
    )
    return StreamingResponse(sse_stream(gen), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", "8000"))

    uvicorn.run(app, host=host, port=port, reload=True)
