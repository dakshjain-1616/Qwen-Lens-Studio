import os
import pytest

os.environ["MOCK_MODE"] = "true"
os.environ["OPENROUTER_API_KEY"] = "test-key"
os.environ["INFERENCE_BACKEND"] = "openrouter"

from qwen_client import reset_client


@pytest.fixture(autouse=True)
def reset_qwen_client():
    reset_client()
    yield
    reset_client()
