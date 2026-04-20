"""Code Lens Processor for UI screenshot to code generation."""

from typing import Dict


class CodeLensProcessor:
    """Processor for generating code from UI screenshots."""
    
    FRAMEWORKS = {
        "html": {
            "name": "HTML/CSS",
            "prompt": "Generate clean semantic HTML5 + CSS. Use CSS variables for theming.",
            "language": "html",
        },
        "react": {
            "name": "React + Tailwind",
            "prompt": "Generate a React functional component with Tailwind CSS classes. Use TypeScript types.",
            "language": "jsx",
        },
        "vue": {
            "name": "Vue 3",
            "prompt": "Generate a Vue 3 component using Composition API and <script setup>.",
            "language": "javascript",
        },
        "svelte": {
            "name": "Svelte",
            "prompt": "Generate a Svelte component with scoped styles.",
            "language": "javascript",
        },
    }
    
    def get_system_prompt(self, framework: str = "html") -> str:
        fw_info = self.FRAMEWORKS.get(framework, self.FRAMEWORKS["html"])
        return f"You are an expert frontend developer. {fw_info['prompt']} Output only the code, no explanations."
    
    def get_framework_info(self, framework: str) -> Dict[str, str]:
        fw_info = self.FRAMEWORKS.get(framework, self.FRAMEWORKS["html"])
        return {"name": fw_info["name"], "language": fw_info["language"]}
    
    def clean_code_response(self, text: str) -> str:
        import re
        text = re.sub(r'^```[\w]*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
        return text.strip()
