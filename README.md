# Qwen Lens Studio ✦

Multimodal AI Studio powered by Qwen3.6-35B-A3B.

## Features
- **Visual Reasoning**: Chain-of-thought analysis with "Show Thinking" toggle.
- **Multilingual Describe**: Image descriptions in 11 languages.
- **Document IQ**: Structured JSON extraction from documents.
- **Code Lens**: UI screenshot to React/Vue/Svelte/HTML code.
- **Dual Compare**: Side-by-side analysis of two images.

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   # Add your OPENROUTER_API_KEY
   ```
4. Run the application:
   ```bash
   uvicorn app:app --reload
   ```

## Model Info
- **Model**: Qwen 3.6 35B A3B
- **Architecture**: 35B MoE (3B active parameters)
- **Context**: 262K tokens
- **Performance**: 73.4% SWE-bench Verified

### Model IDs by Backend
| Backend | Model ID |
|---------|----------|
| OpenRouter (default) | `qwen/qwen3.6-35b-a3b` |
| Ollama | `qwen3.6:35b` |
| llama.cpp | `qwen3.6-35b` |

Configure via environment variables `MODEL_ID` and `BACKEND` (or `INFERENCE_BACKEND`).
