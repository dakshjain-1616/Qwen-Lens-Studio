"""Tests for the FastAPI app endpoints (health, SSE shape, header propagation)."""
import io

import pytest
from fastapi.testclient import TestClient

from app import app


# Minimal valid 1x1 PNG
_PNG_1x1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d49444154789c63f8cfc0f01f0005000103002ecae76a0000000049"
    "454e44ae426082"
)


@pytest.fixture
def client():
    return TestClient(app)


def _img(name="image", filename="test.png"):
    return (name, (filename, io.BytesIO(_PNG_1x1), "image/png"))


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    for key in ("status", "model", "has_env_key", "mock_mode", "backend"):
        assert key in body, f"missing {key} in {body}"
    assert body["status"] == "healthy"
    assert body["mock_mode"] is True


def test_cors_preflight(client):
    r = client.options(
        "/api/health",
        headers={
            "Origin": "http://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.status_code == 200
    assert "access-control-allow-origin" in {k.lower() for k in r.headers.keys()}


def test_reasoning_streams(client):
    r = client.post(
        "/api/reasoning",
        files=[_img()],
        data={"question": "What is this?", "show_thinking": "true"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    assert "data:" in r.text


def test_reasoning_missing_image(client):
    r = client.post("/api/reasoning", data={"question": "hi"})
    assert r.status_code in (400, 422)


def test_multilingual_streams(client):
    r = client.post("/api/multilingual", files=[_img()], data={"language": "es"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    assert "data:" in r.text


def test_multilingual_missing_image(client):
    r = client.post("/api/multilingual", data={"language": "en"})
    assert r.status_code in (400, 422)


def test_document_iq_streams(client):
    r = client.post("/api/document-iq", files=[_img()])
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    assert "data:" in r.text


def test_document_iq_missing_image(client):
    r = client.post("/api/document-iq")
    assert r.status_code in (400, 422)


def test_code_lens_streams(client):
    r = client.post("/api/code-lens", files=[_img()], data={"framework": "react"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    assert "data:" in r.text


def test_code_lens_missing_image(client):
    r = client.post("/api/code-lens", data={"framework": "html"})
    assert r.status_code in (400, 422)


def test_dual_compare_streams(client):
    r = client.post(
        "/api/dual-compare",
        files=[_img("image1", "a.png"), _img("image2", "b.png")],
        data={"question": "Compare"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")
    assert "data:" in r.text


def test_dual_compare_missing_images(client):
    r = client.post("/api/dual-compare", data={"question": "Compare"})
    assert r.status_code in (400, 422)


def test_custom_headers_accepted(client):
    r = client.post(
        "/api/reasoning",
        files=[_img()],
        data={"question": "hi", "show_thinking": "false"},
        headers={
            "X-OpenRouter-Key": "sk-test-override",
            "X-Model-Id": "qwen/qwen-vl-plus",
            "X-Backend": "openrouter",
        },
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/event-stream")


def test_custom_system_prompt_accepted(client):
    r = client.post(
        "/api/reasoning",
        files=[_img()],
        data={"question": "hi", "custom_system_prompt": "Custom prompt test"},
    )
    assert r.status_code == 200
