import os
import json
import base64
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from qwen_client import QwenClient
from processors import (
    VisualReasoningProcessor,
    MultilingualProcessor,
    DocumentIQProcessor,
    CodeLensProcessor,
    DualCompareProcessor
)

load_dotenv()

app = FastAPI(title="Qwen Lens Studio")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Client and Processors
client = QwenClient()
reasoning_proc = VisualReasoningProcessor()
multilingual_proc = MultilingualProcessor()
document_proc = DocumentIQProcessor()
code_proc = CodeLensProcessor()
dual_proc = DualCompareProcessor()

# Static files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r") as f:
        return f.read()

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model": client.model,
        "mock_mode": client.mock_mode
    }

async def to_base64(file: UploadFile) -> str:
    content = await file.read()
    encoded = base64.b64encode(content).decode("utf-8")
    return f"data:{file.content_type};base64,{encoded}"

@app.post("/api/reasoning")
async def reasoning(
    image: UploadFile = File(...),
    question: str = Form(...),
    show_thinking: bool = Form(False)
):
    image_url = await to_base64(image)
    system_prompt = reasoning_proc.get_system_prompt(show_thinking)
    
    async def event_generator():
        stream = client.stream_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]}
            ],
            enable_thinking=show_thinking
        )
        
        async for chunk in reasoning_proc.stream_with_events(stream, show_thinking):
            yield f"event: {chunk['event']}\ndata: {json.dumps(chunk['data'])}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/multilingual")
async def multilingual(
    image: UploadFile = File(...),
    language: str = Form("en")
):
    image_url = await to_base64(image)
    system_prompt = multilingual_proc.get_system_prompt(language)
    
    async def event_generator():
        stream = client.stream_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": "Describe this image in detail."},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]}
            ]
        )
        async for chunk in stream:
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/document-iq")
async def document_iq(image: UploadFile = File(...)):
    image_url = await to_base64(image)
    system_prompt = document_proc.get_system_prompt()
    
    async def event_generator():
        stream = client.stream_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]}
            ]
        )
        async for chunk in stream:
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/code-lens")
async def code_lens(
    image: UploadFile = File(...),
    framework: str = Form("html")
):
    image_url = await to_base64(image)
    system_prompt = code_proc.get_system_prompt(framework)
    
    async def event_generator():
        stream = client.stream_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]}
            ]
        )
        async for chunk in stream:
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/dual-compare")
async def dual_compare(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
    question: str = Form(...)
):
    img1_url = await to_base64(image1)
    img2_url = await to_base64(image2)
    system_prompt = dual_proc.get_system_prompt()
    
    async def event_generator():
        stream = client.stream_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": img1_url}},
                    {"type": "image_url", "image_url": {"url": img2_url}}
                ]}
            ]
        )
        async for chunk in stream:
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
