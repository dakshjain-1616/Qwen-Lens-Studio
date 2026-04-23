import pytest
from qwen_client import QwenClient, StreamChunk


@pytest.mark.asyncio
async def test_mock_stream():
    """stream_completion in mock mode yields chunks and a final done signal."""
    client = QwenClient()
    client.mock_mode = True
    chunks = []
    async for chunk in client.stream_completion([{"role": "user", "content": "test"}]):
        chunks.append(chunk)
    assert len(chunks) > 0
    # Final chunk signals completion
    assert any(c.is_complete for c in chunks)
    # Non-empty content streamed
    combined = "".join(c.content for c in chunks)
    assert len(combined) > 0


@pytest.mark.asyncio
async def test_mock_thinking_stream():
    """Mock stream emits thinking chunks before content."""
    client = QwenClient()
    client.mock_mode = True
    chunks = []
    async for chunk in client.stream_completion([{"role": "user", "content": "test"}]):
        chunks.append(chunk)
    thinking_chunks = [c for c in chunks if c.is_thinking or c.thinking]
    assert len(thinking_chunks) > 0
    combined_thinking = "".join(c.thinking for c in chunks)
    assert len(combined_thinking) > 0


@pytest.mark.asyncio
async def test_parse_thinking_content():
    """Client parses <think>...</think> segments out of content."""
    client = QwenClient()
    visible, thinking = client._parse_thinking_content(
        "<think>inner reasoning</think>final answer"
    )
    assert visible == "final answer"
    assert thinking == "inner reasoning"
