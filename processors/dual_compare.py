"""Dual Compare Processor - compares two images side-by-side."""
from typing import AsyncGenerator, Optional

from qwen_client import get_client, StreamChunk


class DualCompareProcessor:
    """Processor that compares two images."""

    def get_system_prompt(self) -> str:
        return (
            "Compare the two images carefully. Structure the response as "
            "markdown with three sections:\n\n"
            "## Similarities\n"
            "## Differences\n"
            "## Verdict\n\n"
            "Be specific and cite visual evidence. Ground every claim in what "
            "is actually visible in the images."
        )

    async def process(
        self,
        image1_b64: str,
        image2_b64: str,
        question: str = "",
        custom_system_prompt: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        backend: Optional[str] = None,
        **kwargs,
    ) -> AsyncGenerator[StreamChunk, None]:
        system_prompt = (
            custom_system_prompt
            if custom_system_prompt and custom_system_prompt.strip()
            else self.get_system_prompt()
        )
        user_text = question.strip() if question and question.strip() else "Compare these images."
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image1_b64}"},
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image2_b64}"},
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
