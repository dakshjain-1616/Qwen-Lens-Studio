import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Qwen Lens Studio" in response.text
