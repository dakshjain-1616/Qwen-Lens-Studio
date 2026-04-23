"""Code Lens Processor - generates front-end code from a UI screenshot."""
from typing import AsyncGenerator, Optional

from qwen_client import get_client, StreamChunk


SUPPORTED_FRAMEWORKS = {
    "html": "plain HTML + inline CSS",
    "react": "React with Tailwind classes",
    "vue": "Vue 3 SFC with Tailwind classes",
    "svelte": "Svelte with Tailwind classes",
}


class CodeLensProcessor:
    """Processor that turns UI screenshots into front-end code."""

    def get_system_prompt(self, framework: str) -> str:
        framework_description = SUPPORTED_FRAMEWORKS.get(
            framework, SUPPORTED_FRAMEWORKS["html"]
        )
        return (
            "You are a front-end engineer. Look at this UI screenshot and "
            f"produce a faithful implementation in {framework_description}. "
            "Output ONLY the code in a single fenced code block. No commentary, "
            "no explanation, no setup instructions. Just the code."
        )

    async def process(
        self,
        image_b64: str,
        framework: str,
        custom_system_prompt: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        backend: Optional[str] = None,
        **kwargs,
    ) -> AsyncGenerator[StreamChunk, None]:
        system_prompt = (
            custom_system_prompt
            if custom_system_prompt and custom_system_prompt.strip()
            else self.get_system_prompt(framework)
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Implement this UI."},
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
