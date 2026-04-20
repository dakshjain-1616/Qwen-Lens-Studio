# Qwen Lens Studio

> 🤖 Built autonomously using **[NEO — Your Autonomous AI Engineering Agent](https://heyneo.com)**
>
> [![VS Code Extension](https://img.shields.io/badge/VS%20Code-Install%20NEO-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=NeoResearchInc.heyneo) [![Cursor Extension](https://img.shields.io/badge/Cursor-Install%20NEO-purple?logo=cursor)](https://marketplace.cursorapi.com/items/?itemName=NeoResearchInc.heyneo)

Multimodal AI Studio powered by **Qwen3.6** (`qwen/qwen3.6-plus`) — 5 unique tabs built around Qwen's strengths.

> Multimodal · Chain-of-thought reasoning · 78.8% SWE-Bench Verified · 11-language support

## Features

| Tab | What it does |
|-----|-------------|
| **Visual Reasoning** | Upload image + question, toggle chain-of-thought thinking trace |
| **Multilingual Describe** | Describe images in 11 languages (English, Chinese, Japanese, Arabic…) |
| **Document IQ** | Photo → structured JSON (invoices, receipts, forms, IDs) |
| **Code Lens** | Screenshot → React / Vue 3 / Svelte / HTML code |
| **Dual Compare** | Two images → Similarities / Differences / Verdict |

## Quick Start

```bash
git clone <repo>
cd qwen_lens_studio
pip install -r requirements.txt
cp .env.example .env   # add your OPENROUTER_API_KEY
uvicorn app:app --reload
```

Open http://localhost:8000

## Inference Backends

Set `INFERENCE_BACKEND` in `.env`:

| Value | Description |
|-------|-------------|
| `openrouter` | Cloud via OpenRouter (default, needs API key) |
| `ollama` | Local Ollama server |
| `llamacpp` | Local llama.cpp server |

### Running Locally — No API Key Needed

**Ollama:**
```bash
ollama pull qwen2.5-vl:7b        # vision-capable model
INFERENCE_BACKEND=ollama uvicorn app:app --reload
```

**llama.cpp:**
```bash
# Download a GGUF from HuggingFace, then:
./llama-server -m qwen3.6-35b-q4_k_m.gguf --port 8080
INFERENCE_BACKEND=llamacpp uvicorn app:app --reload
```

## Environment Variables

```env
OPENROUTER_API_KEY=sk-or-...       # required for openrouter backend
INFERENCE_BACKEND=openrouter       # openrouter | ollama | llamacpp
QWEN_MODEL=qwen/qwen3.6-35b-a3b   # model for openrouter
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.6:35b
LLAMACPP_BASE_URL=http://localhost:8080
MOCK_MODE=false                    # true = no API calls (for dev/testing)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Backend status + model info |
| POST | `/api/reasoning` | Visual Q&A with thinking trace |
| POST | `/api/multilingual` | Image description in chosen language |
| POST | `/api/document-iq` | Document → structured JSON |
| POST | `/api/code-lens` | Screenshot → framework code |
| POST | `/api/dual-compare` | Compare two images |
| GET | `/api/languages` | Available languages list |

## Running Tests

```bash
MOCK_MODE=true pytest tests/ -v
```

## Model

- **Qwen3.6-35B-A3B** via [OpenRouter](https://openrouter.ai/qwen/qwen3.6-35b-a3b)
- Released April 16, 2026 by Alibaba Qwen team
- MoE: 35B total / 3B active parameters
- Native context: 262,144 tokens
