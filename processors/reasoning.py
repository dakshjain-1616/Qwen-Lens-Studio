"""Visual Reasoning Processor - analyzes images with optional thinking traces."""
from typing import AsyncGenerator, Optional

from qwen_client import get_client, StreamChunk


class VisualReasoningProcessor:
    """Processor for visual reasoning over uploaded images."""

    def get_system_prompt(self, show_thinking: bool = False) -> str:
        base = (
            "You are a careful visual reasoning assistant. "
            "Examine the provided image closely and answer the user's question "
            "with specific, grounded observations. Cite visual evidence you see. "
            "If something is ambiguous, say so."
        )
        if show_thinking:
            return (
                base
                + "\n\nBefore giving your final answer, wrap your step-by-step "
                "reasoning inside <think>...</think> tags. After the closing "
                "</think> tag, write your final answer in plain prose. Do not "
                "include any reasoning outside the think tags."
            )
        return (
            base
            + "\n\nProvide only the final answer. Do NOT include any <think> tags "
            "or meta-commentary about your reasoning process."
        )

    async def process(
        self,
        image_b64: str,
        question: str,
        show_thinking: bool = False,
        custom_system_prompt: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        backend: Optional[str] = None,
        **kwargs,
    ) -> AsyncGenerator[StreamChunk, None]:
        system_prompt = (
            custom_system_prompt
            if custom_system_prompt and custom_system_prompt.strip()
            else self.get_system_prompt(show_thinking)
        )
        user_text = question or "Describe this image in detail."
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ],
            },
        ]
        client = get_client()
        async for chunk in client.stream_completion(
            messages,
            api_key=api_key,
            model=model,
            backend=backend,
        ):
            yield chunk
