"""Dual Compare Processor for two-image comparison."""

import re
from typing import Dict, List, Tuple


class DualCompareProcessor:
    """Processor for comparing two images side by side."""
    
    def __init__(self):
        self.system_prompt = (
            "You are an expert visual comparison analyst. Analyze both images and structure "
            "your response with exactly these markdown headers:\n"
            "## Similarities\n"
            "## Differences\n"
            "## Verdict\n\n"
            "Be detailed and objective in your analysis."
        )
    
    def get_system_prompt(self) -> str:
        """Get system prompt for dual comparison."""
        return self.system_prompt
    
    def parse_comparison_response(self, text: str) -> Dict[str, str]:
        """Parse response into Similarities, Differences, and Verdict sections."""
        sections = {
            "similarities": "",
            "differences": "",
            "verdict": "",
            "raw": text
        }
        
        # Parse sections using regex
        sim_match = re.search(r'##\s*Similarities\s*\n(.*?)(?=##\s*Differences|$)', text, re.DOTALL | re.IGNORECASE)
        diff_match = re.search(r'##\s*Differences\s*\n(.*?)(?=##\s*Verdict|$)', text, re.DOTALL | re.IGNORECASE)
        verdict_match = re.search(r'##\s*Verdict\s*\n(.*)$', text, re.DOTALL | re.IGNORECASE)
        
        if sim_match:
            sections["similarities"] = sim_match.group(1).strip()
        if diff_match:
            sections["differences"] = diff_match.group(1).strip()
        if verdict_match:
            sections["verdict"] = verdict_match.group(1).strip()
        
        return sections
    
    def get_example_questions(self) -> List[str]:
        """Get pre-filled example comparison questions."""
        return [
            "Which design is more user-friendly?",
            "What changed between these versions?",
            "Which product looks higher quality?",
            "Which image has better composition?",
            "What are the main visual differences?",
        ]
