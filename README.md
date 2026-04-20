# Qwen Lens Studio ✦

Multimodal AI Studio powered by Qwen3.6-35B-A3B.

![Qwen Lens Studio home](Screenshots/home.png)

## Features
- **Visual Reasoning**: Chain-of-thought analysis with "Show Thinking" toggle.
- **Multilingual Describe**: Image descriptions in 11 languages.
- **Document IQ**: Structured JSON extraction from documents.
- **Code Lens**: UI screenshot to React/Vue/Svelte/HTML code.
- **Dual Compare**: Side-by-side analysis of two images.

### Visual Reasoning
![Visual Reasoning](Screenshots/reasoning.png)

### Code Lens
![Code Lens](Screenshots/code-lens.png)

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
4. Build the frontend (React + Vite SPA):
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
5. Run the application:
   ```bash
   uvicorn app:app --reload
   ```
   Open http://localhost:8000 to use the new Qwen Lens Studio UI.

### Frontend dev mode
For hot-reloading while editing the UI:
```bash
# terminal 1 — backend
uvicorn app:app --reload --port 8000
# terminal 2 — frontend (proxies /api → :8000)
cd frontend && npm run dev
```
Then visit http://localhost:5173.

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
