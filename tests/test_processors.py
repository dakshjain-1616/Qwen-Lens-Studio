"""Tests for processor classes - get_system_prompt and custom prompt override."""
import pytest

from processors import (
    VisualReasoningProcessor,
    MultilingualProcessor,
    DocumentIQProcessor,
    CodeLensProcessor,
    DualCompareProcessor,
)
from processors.multilingual import SUPPORTED_LANGUAGES
from processors.code_lens import SUPPORTED_FRAMEWORKS


def _collect(gen):
    import asyncio

    async def run():
        chunks = []
        async for c in gen:
            chunks.append(c)
        return chunks

    return asyncio.run(run())


def test_reasoning_system_prompt_nonempty():
    proc = VisualReasoningProcessor()
    p_off = proc.get_system_prompt(False)
    p_on = proc.get_system_prompt(True)
    assert isinstance(p_off, str) and len(p_off) > 0
    assert isinstance(p_on, str) and len(p_on) > 0
    assert "<think>" in p_on
    # The off-variant may mention "<think> tags" in a negation; the key
    # contract is that it does NOT instruct wrapping reasoning in them.
    assert "wrap" not in p_off.lower() or "do not" in p_off.lower()


def test_multilingual_languages():
    assert "en" in SUPPORTED_LANGUAGES
    assert "zh" in SUPPORTED_LANGUAGES
    assert "ja" in SUPPORTED_LANGUAGES
    proc = MultilingualProcessor()
    prompt = proc.get_system_prompt("es")
    assert "Spanish" in prompt


def test_document_iq_system_prompt_mentions_json():
    proc = DocumentIQProcessor()
    prompt = proc.get_system_prompt()
    assert isinstance(prompt, str) and prompt
    assert "JSON" in prompt or "json" in prompt


def test_code_lens_frameworks_and_prompt():
    assert set(SUPPORTED_FRAMEWORKS.keys()) == {"html", "react", "vue", "svelte"}
    proc = CodeLensProcessor()
    prompt = proc.get_system_prompt("react")
    assert "React" in prompt


def test_dual_compare_system_prompt():
    proc = DualCompareProcessor()
    prompt = proc.get_system_prompt()
    assert "Similarities" in prompt
    assert "Differences" in prompt
    assert "Verdict" in prompt


def test_custom_system_prompt_override_reasoning():
    proc = VisualReasoningProcessor()
    gen = proc.process(
        image_b64="Zg==",
        question="q",
        show_thinking=False,
        custom_system_prompt="OVERRIDE SYS PROMPT",
    )
    chunks = _collect(gen)
    # In mock mode we still get chunks; at minimum it doesn't crash.
    assert len(chunks) > 0


def test_multilingual_process_smoke():
    proc = MultilingualProcessor()
    chunks = _collect(proc.process(image_b64="Zg==", language="en"))
    assert len(chunks) > 0


def test_document_iq_process_smoke():
    proc = DocumentIQProcessor()
    chunks = _collect(proc.process(image_b64="Zg=="))
    assert len(chunks) > 0


def test_code_lens_process_smoke():
    proc = CodeLensProcessor()
    chunks = _collect(proc.process(image_b64="Zg==", framework="html"))
    assert len(chunks) > 0


def test_dual_compare_process_smoke():
    proc = DualCompareProcessor()
    chunks = _collect(
        proc.process(image1_b64="Zg==", image2_b64="Zg==", question="")
    )
    assert len(chunks) > 0
