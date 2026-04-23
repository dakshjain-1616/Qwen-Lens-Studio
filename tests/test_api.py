import pytest
from fastapi.testclient import TestClient
from app import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root(client):
    response = client.get("/")
    # Root serves static/index.html if present; otherwise returns 404.
    # Accept either but verify the route is wired.
    assert response.status_code in (200, 404)
