import os
import json
import httpx
import asyncio
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class QwenClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("MODEL_ID") or os.getenv("QWEN_MODEL") or "qwen/qwen3.6-plus"
        self.mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
        self.backend = os.getenv("BACKEND", "openrouter").lower() # openrouter, ollama, llamacpp
        
        self.base_urls = {
            "openrouter": "https://openrouter.ai/api/v1",
            "ollama": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
            "llamacpp": os.getenv("LLAMACPP_BASE_URL", "http://localhost:8080/v1")
        }
        
    async def stream_chat(
        self, 
        messages: List[Dict[str, Any]], 
        enable_thinking: bool = False
    ) -> AsyncGenerator[str, None]:
        if self.mock_mode:
            async for chunk in self._mock_stream(enable_thinking):
                yield chunk
            return

        url = f"{self.base_urls.get(self.backend, self.base_urls['openrouter'])}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True
        }
        
        if enable_thinking and self.backend == "openrouter":
            payload["provider"] = {"require_parameters": True}
            payload["enable_thinking"] = True

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise Exception(f"API Error ({response.status_code}): {error_text.decode()}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices") or []
                            if not choices:
                                continue
                            delta = choices[0].get("delta") or {}
                            chunk = delta.get("content") or ""
                            if chunk:
                                yield chunk
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    async def _mock_stream(self, enable_thinking: bool) -> AsyncGenerator[str, None]:
        if enable_thinking:
            yield "<|im_start|>think\n"
            await asyncio.sleep(0.1)
            yield "Analyzing the visual elements of the image...\n"
            await asyncio.sleep(0.1)
            yield "Identifying key objects and their spatial relationships.\n"
            await asyncio.sleep(0.1)
            yield "<|im_end|>\n"
        
        text = "This is a simulated response from Qwen3.6 in mock mode. It demonstrates the streaming capability of the studio."
        for word in text.split():
            yield word + " "
            await asyncio.sleep(0.05)
