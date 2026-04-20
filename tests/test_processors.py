import os
import pytest

os.environ["MOCK_MODE"] = "true"
os.environ["OPENROUTER_API_KEY"] = "test-key"

from processors import (
    VisualReasoningProcessor,
    MultilingualProcessor,
    DocumentIQProcessor,
    CodeLensProcessor,
    DualCompareProcessor,
)


def test_visual_reasoning_processor():
    proc = VisualReasoningProcessor()
    prompt_with = proc.get_system_prompt(show_thinking=True)
    prompt_without = proc.get_system_prompt(show_thinking=False)
    assert "think" in prompt_with.lower()
    assert isinstance(prompt_without, str)


def test_reasoning_parse_thinking():
    proc = VisualReasoningProcessor()
    text = "<|im_start|>thinksome reasoning<|im_end|>The answer is 42."
    result = proc.parse_thinking_response(text)
    assert "some reasoning" in result["thinking"]
    assert "42" in result["answer"]


def test_multilingual_processor_translate():
    proc = MultilingualProcessor()
    prompt = proc.get_system_prompt("zh")
    assert "中文" in prompt or "Chinese" in prompt.lower() or "中文" in prompt
    lang_info = proc.get_language_info("ja")
    assert lang_info["flag"] == "🇯🇵"


def test_multilingual_available_languages():
    proc = MultilingualProcessor()
    langs = proc.get_available_languages()
    codes = [l["code"] for l in langs]
    assert "en" in codes
    assert "zh" in codes
    assert "ar" in codes
    assert len(langs) == 11


def test_document_iq_processor():
    proc = DocumentIQProcessor()
    prompt = proc.get_system_prompt()
    assert "JSON" in prompt
    json_str = '{"document_type": "invoice", "confidence_score": 0.95}'
    result = proc.extract_json(json_str)
    assert result is not None
    assert result["document_type"] == "invoice"


def test_document_iq_extract_json_with_fences():
    proc = DocumentIQProcessor()
    text = '```json\n{"document_type": "receipt"}\n```'
    result = proc.extract_json(text)
    assert result is not None
    assert result["document_type"] == "receipt"


def test_code_lens_processor():
    proc = CodeLensProcessor()
    for fw in ["html", "react", "vue", "svelte"]:
        prompt = proc.get_system_prompt(fw)
        assert isinstance(prompt, str)
        assert len(prompt) > 10
    info = proc.get_framework_info("react")
    assert "React" in info["name"]


def test_dual_compare_processor():
    proc = DualCompareProcessor()
    prompt = proc.get_system_prompt()
    assert "Similarities" in prompt
    assert "Differences" in prompt
    assert "Verdict" in prompt
    examples = proc.get_example_questions()
    assert len(examples) >= 3


def test_dual_compare_parse_response():
    proc = DualCompareProcessor()
    text = "## Similarities\nBoth are blue.\n## Differences\nOne is larger.\n## Verdict\nFirst is better."
    result = proc.parse_comparison_response(text)
    assert "blue" in result["similarities"]
    assert "larger" in result["differences"]
    assert "better" in result["verdict"]
