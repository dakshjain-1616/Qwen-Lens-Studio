"""Qwen Lens Studio — FastAPI application."""
import os
import base64
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
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

app = FastAPI(title="Qwen Lens Studio", version="1.0.0")

reasoning_proc = VisualReasoningProcessor()
multilingual_proc = MultilingualProcessor()
document_iq_proc = DocumentIQProcessor()
code_lens_proc = CodeLensProcessor()
dual_compare_proc = DualCompareProcessor()


def image_to_data_url(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{content_type};base64,{b64}"


def build_image_message(role: str, text: str, data_url: str) -> dict:
    return {
        "role": role,
        "content": [
            {"type": "image_url", "image_url": {"url": data_url}},
            {"type": "text", "text": text},
        ],
    }


async def sse_stream(generator):
    async for chunk in generator:
        if isinstance(chunk, StreamChunk):
            if chunk.error:
                yield f"event: error\ndata: {chunk.error}\n\n"
                return
            if chunk.is_complete:
                yield "event: done\ndata: [DONE]\n\n"
                return
            if chunk.is_thinking and chunk.thinking:
                yield f"event: thinking\ndata: {chunk.thinking}\n\n"
            elif chunk.content:
                yield f"event: answer\ndata: {chunk.content}\n\n"
        elif isinstance(chunk, dict):
            event = chunk.get("event", "answer")
            data = chunk.get("data", "")
            if data:
                yield f"event: {event}\ndata: {data}\n\n"


@app.get("/api/health")
async def health():
    backend = os.getenv("INFERENCE_BACKEND", "openrouter")
    model = os.getenv("QWEN_MODEL", "qwen/qwen3.6-35b-a3b")
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    return {"status": "ok", "model": model, "backend": backend, "mock_mode": mock_mode}


@app.post("/api/reasoning")
async def reasoning(
    image: UploadFile = File(...),
    question: str = Form(...),
    show_thinking: bool = Form(False),
):
    image_bytes = await image.read()
    data_url = image_to_data_url(image_bytes, image.content_type or "image/jpeg")
    system = reasoning_proc.get_system_prompt(show_thinking)
    messages = [
        {"role": "system", "content": system},
        build_image_message("user", question, data_url),
    ]
    client = get_client()

    async def generate():
        async for chunk in client.stream_completion(messages):
            yield chunk

    return StreamingResponse(sse_stream(generate()), media_type="text/event-stream")


@app.post("/api/multilingual")
async def multilingual(
    image: UploadFile = File(...),
    language: str = Form("en"),
):
    image_bytes = await image.read()
    data_url = image_to_data_url(image_bytes, image.content_type or "image/jpeg")
    system = multilingual_proc.get_system_prompt(language)
    lang_info = multilingual_proc.get_language_info(language)
    user_text = f"Describe this image in {lang_info['name']}."
    messages = [
        {"role": "system", "content": system},
        build_image_message("user", user_text, data_url),
    ]
    client = get_client()

    async def generate():
        async for chunk in client.stream_completion(messages):
            yield chunk

    return StreamingResponse(sse_stream(generate()), media_type="text/event-stream")


@app.post("/api/document-iq")
async def document_iq(image: UploadFile = File(...)):
    image_bytes = await image.read()
    data_url = image_to_data_url(image_bytes, image.content_type or "image/jpeg")
    system = document_iq_proc.get_system_prompt()
    messages = [
        {"role": "system", "content": system},
        build_image_message("user", "Extract all information from this document as JSON.", data_url),
    ]
    client = get_client()

    async def generate():
        async for chunk in client.stream_completion(messages):
            yield chunk

    return StreamingResponse(sse_stream(generate()), media_type="text/event-stream")


@app.post("/api/code-lens")
async def code_lens(
    image: UploadFile = File(...),
    framework: str = Form("html"),
):
    image_bytes = await image.read()
    data_url = image_to_data_url(image_bytes, image.content_type or "image/jpeg")
    system = code_lens_proc.get_system_prompt(framework)
    fw_info = code_lens_proc.get_framework_info(framework)
    messages = [
        {"role": "system", "content": system},
        build_image_message("user", f"Generate {fw_info['name']} code from this UI screenshot.", data_url),
    ]
    client = get_client()

    async def generate():
        async for chunk in client.stream_completion(messages):
            yield chunk

    return StreamingResponse(sse_stream(generate()), media_type="text/event-stream")


@app.post("/api/dual-compare")
async def dual_compare(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
    question: str = Form("What are the main differences between these two images?"),
):
    bytes1 = await image1.read()
    bytes2 = await image2.read()
    url1 = image_to_data_url(bytes1, image1.content_type or "image/jpeg")
    url2 = image_to_data_url(bytes2, image2.content_type or "image/jpeg")
    system = dual_compare_proc.get_system_prompt()
    messages = [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": url1}},
                {"type": "image_url", "image_url": {"url": url2}},
                {"type": "text", "text": question},
            ],
        },
    ]
    client = get_client()

    async def generate():
        async for chunk in client.stream_completion(messages):
            yield chunk

    return StreamingResponse(sse_stream(generate()), media_type="text/event-stream")


@app.get("/api/languages")
async def languages():
    return multilingual_proc.get_available_languages()


@app.get("/api/examples/compare")
async def compare_examples():
    return dual_compare_proc.get_example_questions()


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def index():
    with open("static/index.html", "r") as f:
        return f.read()
