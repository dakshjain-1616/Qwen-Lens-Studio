import os
import io
import pytest

os.environ["MOCK_MODE"] = "true"
os.environ["OPENROUTER_API_KEY"] = "test-key"

from httpx import AsyncClient, ASGITransport
from app import app

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def png_file():
    return ("test.png", io.BytesIO(TINY_PNG), "image/png")


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data
    assert "backend" in data
    assert "mock_mode" in data


@pytest.mark.asyncio
async def test_health_returns_backend_field():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    data = response.json()
    assert data["backend"] in ("openrouter", "ollama", "llamacpp")


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_reasoning_endpoint(png_file):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/reasoning",
            files={"image": png_file},
            data={"question": "What is in this image?", "show_thinking": "false"},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_multilingual_endpoint(png_file):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/multilingual",
            files={"image": png_file},
            data={"language": "zh"},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_document_iq_endpoint(png_file):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/document-iq",
            files={"image": png_file},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_code_lens_endpoint(png_file):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/code-lens",
            files={"image": png_file},
            data={"framework": "react"},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_dual_compare_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/dual-compare",
            files={
                "image1": ("a.png", io.BytesIO(TINY_PNG), "image/png"),
                "image2": ("b.png", io.BytesIO(TINY_PNG), "image/png"),
            },
            data={"question": "What changed?"},
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_languages_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/languages")
    assert response.status_code == 200
    langs = response.json()
    assert len(langs) == 11
