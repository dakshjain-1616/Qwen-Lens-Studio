import pytest
from qwen_client import QwenClient

@pytest.mark.asyncio
async def test_mock_stream():
    client = QwenClient()
    client.mock_mode = True
    chunks = []
    async for chunk in client.stream_chat([{"role": "user", "content": "test"}]):
        chunks.append(chunk)
    assert len(chunks) > 0
    assert "simulated" in "".join(chunks)

@pytest.mark.asyncio
async def test_mock_thinking_stream():
    client = QwenClient()
    client.mock_mode = True
    chunks = []
    async for chunk in client.stream_chat([{"role": "user", "content": "test"}], enable_thinking=True):
        chunks.append(chunk)
    assert "<|im_start|>think" in "".join(chunks)
    assert "<|im_end|>" in "".join(chunks)
