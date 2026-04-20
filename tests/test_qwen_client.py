import os
import pytest

os.environ["MOCK_MODE"] = "true"
os.environ["OPENROUTER_API_KEY"] = "test-key"

from qwen_client import QwenClient, get_client, reset_client


def test_client_initialization():
    reset_client()
    client = QwenClient()
    assert client.mock_mode is True


def test_get_client_singleton():
    reset_client()
    c1 = get_client()
    c2 = get_client()
    assert c1 is c2


@pytest.mark.asyncio
async def test_stream_completion_mock():
    client = QwenClient()
    messages = [{"role": "user", "content": "Hello"}]
    chunks = []
    async for chunk in client.stream_completion(messages):
        chunks.append(chunk)
    assert len(chunks) > 0
    contents = [c.content for c in chunks if c.content]
    assert len(contents) > 0


@pytest.mark.asyncio
async def test_complete_mock():
    client = QwenClient()
    messages = [{"role": "user", "content": "Test"}]
    result = await client.complete(messages)
    assert "content" in result
    assert "thinking" in result
    assert result["error"] is None
    assert len(result["content"]) > 0


def test_thinking_parsing():
    client = QwenClient()
    text = "<think>step 1\nstep 2</think>Final answer here."
    visible, thinking = client._parse_thinking_content(text)
    assert "Final answer here" in visible
    assert "step 1" in thinking


def test_thinking_parsing_no_tags():
    client = QwenClient()
    text = "Plain response with no thinking tags."
    visible, thinking = client._parse_thinking_content(text)
    assert visible == text
    assert thinking == ""
