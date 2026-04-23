"""Multilingual Processor - describes images in various languages."""
from typing import AsyncGenerator, Optional

from qwen_client import get_client, StreamChunk


SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "pt": "Portuguese",
    "ru": "Russian",
}


class MultilingualProcessor:
    """Processor that describes an image in a target language."""

    def get_system_prompt(self, language_code: str) -> str:
        language_name = SUPPORTED_LANGUAGES.get(language_code, language_code)
        return (
            f"Describe this image in detail in {language_name}. "
            f"Be vivid, accurate, and natural in the target language. "
            f"Write the entire response in {language_name} only. "
            f"Do not translate back to English and do not add any preamble."
        )

    async def process(
        self,
        image_b64: str,
        language: str,
        custom_system_prompt: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        backend: Optional[str] = None,
        **kwargs,
    ) -> AsyncGenerator[StreamChunk, None]:
        system_prompt = (
            custom_system_prompt
            if custom_system_prompt and custom_system_prompt.strip()
            else self.get_system_prompt(language)
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this image in detail."},
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
