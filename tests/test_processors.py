from processors import (
    VisualReasoningProcessor,
    MultilingualProcessor,
    DocumentIQProcessor,
    CodeLensProcessor,
    DualCompareProcessor
)

def test_reasoning_prompt():
    proc = VisualReasoningProcessor()
    assert "visual reasoning expert" in proc.get_system_prompt()
    assert "think" in proc.get_system_prompt(show_thinking=True)

def test_multilingual_prompt():
    proc = MultilingualProcessor()
    assert "Chinese" in proc.get_system_prompt("zh")
    assert "Japanese" in proc.get_system_prompt("ja")

def test_document_iq_json():
    proc = DocumentIQProcessor()
    sample = '```json\n{"document_type": "invoice", "confidence_score": 0.9}\n```'
    data = proc.extract_json(sample)
    assert data["document_type"] == "invoice"

def test_code_lens_clean():
    proc = CodeLensProcessor()
    sample = "```html\n<div>Test</div>\n```"
    cleaned = proc.clean_code_response(sample)
    assert cleaned == "<div>Test</div>"

def test_dual_compare_parse():
    proc = DualCompareProcessor()
    sample = "## Similarities\nBoth are cats.\n## Differences\nOne is black.\n## Verdict\nBoth are cute."
    parsed = proc.parse_comparison_response(sample)
    assert parsed["similarities"] == "Both are cats."
    assert parsed["verdict"] == "Both are cute."
