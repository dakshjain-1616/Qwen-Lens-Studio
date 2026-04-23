"""Document IQ Processor - extracts structured JSON from document images."""
from typing import AsyncGenerator, Optional

from qwen_client import get_client, StreamChunk


class DocumentIQProcessor:
    """Processor for document/form/invoice structured extraction."""

    def get_system_prompt(self) -> str:
        return (
            "You are a precise document understanding assistant. Look at the "
            "provided document image (invoice, receipt, ID, form, etc.) and "
            "extract all structured data as JSON.\n\n"
            "Rules:\n"
            "- Output ONLY a single fenced JSON block: ```json ... ```. No prose "
            "outside the fence.\n"
            "- Use keys appropriate to the document type:\n"
            "  * invoices/receipts: invoice_number, date, vendor, line_items "
            "(list of {description, quantity, unit_price, amount}), subtotal, "
            "tax, total, currency, payment_terms\n"
            "  * IDs: document_type, full_name, date_of_birth, id_number, "
            "issue_date, expiry_date, issuing_authority, address\n"
            "  * forms: form_title, fields (object of field_name -> value)\n"
            "- Include a top-level \"document_type\" field.\n"
            "- If a field is not visible, use null. Do not invent values.\n"
            "- If the document doesn't match a known schema, fall back to a "
            "flat key-value extraction of every visible field."
        )

    async def process(
        self,
        image_b64: str,
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
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all structured data from this document as JSON.",
                    },
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
