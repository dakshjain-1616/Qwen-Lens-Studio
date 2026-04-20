"""Processors for Qwen Lens Studio."""

from .reasoning import VisualReasoningProcessor
from .multilingual import MultilingualProcessor
from .document_iq import DocumentIQProcessor
from .code_lens import CodeLensProcessor
from .dual_compare import DualCompareProcessor

__all__ = [
    "VisualReasoningProcessor",
    "MultilingualProcessor",
    "DocumentIQProcessor",
    "CodeLensProcessor",
    "DualCompareProcessor",
]
