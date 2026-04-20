"""Multilingual Processor for image description in various languages."""

from typing import Dict, List


class MultilingualProcessor:
    """Processor for multilingual image description."""
    
    LANGUAGES = {
        "en": {"name": "English", "flag": "🇺🇸"},
        "zh": {"name": "中文", "flag": "🇨🇳"},
        "ja": {"name": "日本語", "flag": "🇯🇵"},
        "es": {"name": "Spanish", "flag": "🇪🇸"},
        "fr": {"name": "French", "flag": "🇫🇷"},
        "de": {"name": "German", "flag": "🇩🇪"},
        "ar": {"name": "Arabic", "flag": "🇸🇦"},
        "hi": {"name": "Hindi", "flag": "🇮🇳"},
        "ko": {"name": "Korean", "flag": "🇰🇷"},
        "pt": {"name": "Portuguese", "flag": "🇵🇹"},
        "ru": {"name": "Russian", "flag": "🇷🇺"},
    }
    
    def __init__(self):
        self.base_prompt = (
            "You are a multilingual visual description expert. "
            "Describe the image in detail in the requested language."
        )
    
    def get_system_prompt(self, language_code: str = "en") -> str:
        """Get system prompt for specific language."""
        lang_info = self.LANGUAGES.get(language_code, self.LANGUAGES["en"])
        lang_name = lang_info["name"]
        
        return (
            f"{self.base_prompt}\n\n"
            f"Respond ONLY in {lang_name}. Do not use any other language."
        )
    
    def get_language_info(self, language_code: str) -> Dict[str, str]:
        """Get language name and flag."""
        return self.LANGUAGES.get(language_code, self.LANGUAGES["en"])
    
    def get_available_languages(self) -> List[Dict[str, str]]:
        """Get list of available languages."""
        return [
            {"code": code, "name": info["name"], "flag": info["flag"]}
            for code, info in self.LANGUAGES.items()
        ]
