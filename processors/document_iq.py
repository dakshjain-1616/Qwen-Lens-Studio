"""Document IQ Processor for structured document extraction."""

import json
import re
from typing import Dict, Any, Optional


class DocumentIQProcessor:
    """Processor for extracting structured data from document images."""
    
    def __init__(self):
        self.system_prompt = (
            "You are a document intelligence system. Analyze this document image and extract all "
            "information as valid JSON. Include: document_type, extracted_fields (key-value pairs), "
            "tables (if any), dates, monetary_amounts, and confidence_score (0-1). "
            "Respond ONLY with valid JSON, no markdown wrapping."
        )
    
    def get_system_prompt(self) -> str:
        """Get system prompt for document extraction."""
        return self.system_prompt
    
    def extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from response, handling markdown fences."""
        # Try to find JSON in markdown fences
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        
        # Try to find JSON directly
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None
    
    def format_response(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format the extracted document data."""
        document_type = extracted_data.get("document_type", "unknown")
        confidence = extracted_data.get("confidence_score", 0.0)
        
        return {
            "document_type": document_type,
            "confidence_score": confidence,
            "extracted_data": extracted_data,
            "badge_color": self._get_badge_color(document_type),
        }
    
    def _get_badge_color(self, doc_type: str) -> str:
        """Get color for document type badge."""
        colors = {
            "invoice": "#10b981",  # green
            "receipt": "#3b82f6",  # blue
            "business_card": "#8b5cf6",  # purple
            "form": "#f59e0b",  # amber
            "id_card": "#ef4444",  # red
            "contract": "#6366f1",  # indigo
            "resume": "#14b8a6",  # teal
        }
        return colors.get(doc_type.lower(), "#6b7280")  # gray default
