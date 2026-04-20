"""
Qwen Client for OpenRouter API with SSE streaming support.
Handles thinking trace parsing and mock mode for testing.
"""
import os
import json
import asyncio
from typing import AsyncGenerator, Optional, Dict, Any
from dataclasses import dataclass
import httpx
from dotenv import load_dotenv

load_dotenv()


@dataclass
class StreamChunk:
    """Represents a chunk of streamed response."""
    content: str = ""
    thinking: str = ""
    is_thinking: bool = False
    is_complete: bool = False
    error: Optional[str] = None


class QwenClient:
    """Client for Qwen model via OpenRouter API."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        self.model = os.getenv("QWEN_MODEL", "openrouter/qwen/qwen3.6-35b-a3b")
        self.mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
        
        if not self.mock_mode and not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is required when MOCK_MODE is false")
    
    def _parse_thinking_content(self, content: str) -> tuple[str, str]:
        """
        Parse thinking content from response.
        Returns (visible_content, thinking_content)
        """
        thinking = ""
        visible = content
        
        # Look for <think> tags
        if "<think>" in content and "</think>" in content:
            start = content.find("<think>")
            end = content.find("</think>") + len("</think>")
            thinking = content[start + len("<think>"):end - len("</think>")]
            visible = content[:start] + content[end:]
        
        return visible.strip(), thinking.strip()
    
    async def _mock_stream(self, messages: list, **kwargs) -> AsyncGenerator[StreamChunk, None]:
        """Generate mock streaming responses for testing."""
        mock_thinking = "Let me analyze this step by step...\n\n1. First, I need to understand the context\n2. Then, I'll formulate a response\n3. Finally, I'll provide the answer"
        
        mock_response = "This is a mock response from the Qwen model. In production mode, this would be a real response from the OpenRouter API using the Qwen3.6-35B-A3B model."
        
        # Stream thinking first
        for line in mock_thinking.split('\n'):
            await asyncio.sleep(0.1)
            yield StreamChunk(thinking=line + '\n', is_thinking=True)
        
        # Stream response
        words = mock_response.split()
        for i, word in enumerate(words):
            await asyncio.sleep(0.05)
            content = word + (' ' if i < len(words) - 1 else '')
            yield StreamChunk(content=content)
        
        yield StreamChunk(is_complete=True)
    
    async def stream_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream completion from Qwen model.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Yields:
            StreamChunk objects containing content or thinking
        """
        if self.mock_mode:
            async for chunk in self._mock_stream(messages, **kwargs):
                yield chunk
            return
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://qwen-lens-studio.local",
            "X-Title": "Qwen Lens Studio"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            **kwargs
        }
        
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield StreamChunk(
                            error=f"API Error {response.status_code}: {error_text.decode()}"
                        )
                        return
                    
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        
                        data = line[6:]  # Remove "data: " prefix
                        
                        if data == "[DONE]":
                            yield StreamChunk(is_complete=True)
                            break
                        
                        try:
                            event = json.loads(data)
                            choices = event.get("choices", [])
                            if not choices:
                                continue
                            delta = choices[0].get("delta", {})

                            content = delta.get("content", "") or ""
                            reasoning = delta.get("reasoning", "") or ""

                            if reasoning:
                                yield StreamChunk(thinking=reasoning, is_thinking=True)

                            if content:
                                visible, thinking = self._parse_thinking_content(content)
                                if thinking:
                                    yield StreamChunk(thinking=thinking, is_thinking=True)
                                if visible:
                                    yield StreamChunk(content=visible)

                        except (json.JSONDecodeError, IndexError, KeyError):
                            continue
                            
        except httpx.TimeoutException:
            yield StreamChunk(error="Request timed out. Please try again.")
        except Exception as e:
            yield StreamChunk(error=f"Error: {str(e)}")
    
    async def complete(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Non-streaming completion.
        
        Returns:
            Dict with 'content', 'thinking', and 'error' keys
        """
        content_parts = []
        thinking_parts = []
        error = None
        
        async for chunk in self.stream_completion(messages, temperature, max_tokens, **kwargs):
            if chunk.error:
                error = chunk.error
                break
            if chunk.content:
                content_parts.append(chunk.content)
            if chunk.thinking:
                thinking_parts.append(chunk.thinking)
        
        return {
            "content": "".join(content_parts),
            "thinking": "".join(thinking_parts),
            "error": error
        }


# Singleton instance
_client: Optional[QwenClient] = None


def get_client() -> QwenClient:
    """Get or create singleton QwenClient instance."""
    global _client
    if _client is None:
        _client = QwenClient()
    return _client


def reset_client():
    """Reset the singleton client (useful for testing)."""
    global _client
    _client = None
