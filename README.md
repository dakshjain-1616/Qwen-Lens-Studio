# Qwen Lens Studio

A multimodal AI studio built around a single Qwen vision-language model, exposed through five focused tools plus a batch runner and a persistent session log. Ship a screenshot → get code. Ship an invoice → get structured JSON. Ship two images → get a structured diff.

## What's in the box

Five vision tools, all streaming:

| Tool | Input | Output |
|---|---|---|
| **Visual Reasoning** | image + question | chain-of-thought answer, optional thinking trace |
| **Multilingual Describe** | image + target language | vivid description in the requested language |
| **Document IQ** | invoice / receipt / ID / form image | structured JSON extraction |
| **Code Lens** | UI screenshot + framework | HTML / React / Vue / Svelte implementation |
| **Dual Compare** | two images + question | markdown diff with Similarities / Differences / Verdict |

Plus:

- **Batch runner** — drop many images, pick a tool, drain a 3-worker queue, export results as CSV or JSON (Document IQ CSV auto-flattens JSON keys into columns).
- **Session history** — every run is stored (localStorage, up to 100 per tool), searchable, restorable, exportable.
- **Prompt template library** — save reusable system prompts per tool; sent as a one-call override.
- **Export menu** on every result — Markdown, JSON, or PDF (via `html2pdf.js`).
- **In-UI API key** — paste your OpenRouter key into Settings; stored in `localStorage`, attached as `X-OpenRouter-Key` on each request. No `.env` edit required for non-developers.
- **Monaco read-only code viewer** for Code Lens output and the Document IQ Raw tab.
- **Live preview** button on Code Lens results opens the generated UI in a new browser tab.
- **Markdown rendering** for all natural-language answers (bullets, headings, tables, code fences).

## Architecture

```
React + Vite + TypeScript SPA  ──►  FastAPI backend  ──►  Qwen via OpenRouter / Ollama / llama.cpp
       :5173 (dev)                       :8001                    (pluggable)
                   proxies /api/*
```

- **Backend:** FastAPI, `app.py` + 5 processor classes in `processors/`. One `QwenClient` in `qwen_client.py` handles streaming, thinking-trace parsing, and per-call API key / model / backend overrides.
- **Frontend:** React 18 + Vite + TypeScript. State: local `useState` per tool + one Zustand store for history and UI flags. Styling: Tailwind, dark glass theme. Markdown rendered via `react-markdown` + `remark-gfm`. Code rendered via `@monaco-editor/react` (read-only).
- **SSE:** Each tool endpoint returns `text/event-stream`. Per-chunk JSON: `{content, thinking, is_thinking, is_complete, error}`. The client distinguishes thinking from answer deltas and drives two independent panes.
- **No database.** History is browser-side localStorage (`qls.history.v1`, quota-aware with oldest-drop fallback). Config lives in `qls.config.v1`. Prompts in `qls.prompts.v1`.

## Getting started

### Prerequisites
- Python 3.10+
- Node 18+
- An OpenRouter API key (or Ollama / llama.cpp running locally)

### Backend

```bash
cd qwen_lens_studio_1025
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt

cp .env.example .env
# edit .env: OPENROUTER_API_KEY=...; QWEN_MODEL=qwen/qwen3.6-plus; MOCK_MODE=false

uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

For demos without an API key, set `MOCK_MODE=true` and the backend will stream a canned response.

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
# open http://localhost:5173/
```

The Vite proxy forwards `/api/*` to `http://127.0.0.1:8001` (see `vite.config.ts`).

### Production build

```bash
cd frontend && npm run build         # emits frontend/dist
# then serve dist/ behind any static host, and run uvicorn behind that
```

## Configuration

### Per-install (.env)

| Variable | Purpose | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | your key | *(required in non-mock mode)* |
| `QWEN_MODEL` | model ID on the chosen backend | `qwen/qwen3.6-35b-a3b` |
| `INFERENCE_BACKEND` | `openrouter` / `ollama` / `llamacpp` | `openrouter` |
| `OPENROUTER_BASE_URL` | override if using a proxy | `https://openrouter.ai/api/v1` |
| `MOCK_MODE` | return canned text without calling any model | `false` |

### Per-user (in-UI)

Click the gear icon in the top-right. Set:
- OpenRouter key (masked, stored in `localStorage`)
- Model ID (leave blank to use the server default from `.env`)
- Backend (openrouter / ollama / llamacpp)

Attached per-request as `X-OpenRouter-Key`, `X-Model-Id`, `X-Backend` headers; these override the server defaults for that request only.

### Per-run (prompt templates)

Each tool page has an "Edit system prompt" expandable. Save named templates in the Prompt Library modal (`qls.prompts.v1`). Sent to the backend as the optional `custom_system_prompt` form field — the processor uses it in place of its default prompt when present.

## Endpoints

Every tool endpoint takes multipart form-data and returns SSE.

| Method | Path | Fields |
|---|---|---|
| GET | `/api/health` | — |
| POST | `/api/reasoning` | `image`, `question`, `show_thinking`, `custom_system_prompt?` |
| POST | `/api/multilingual` | `image`, `language`, `custom_system_prompt?` |
| POST | `/api/document-iq` | `image`, `custom_system_prompt?` |
| POST | `/api/code-lens` | `image`, `framework` (`html`\|`react`\|`vue`\|`svelte`), `custom_system_prompt?` |
| POST | `/api/dual-compare` | `image1`, `image2`, `question`, `custom_system_prompt?` |

Optional headers on every tool endpoint: `X-OpenRouter-Key`, `X-Model-Id`, `X-Backend`.

## Project layout

```
qwen_lens_studio_1025/
├── app.py                        # FastAPI routes + SSE helpers
├── qwen_client.py                # QwenClient (stream + non-stream)
├── processors/
│   ├── reasoning.py
│   ├── multilingual.py
│   ├── document_iq.py
│   ├── code_lens.py
│   └── dual_compare.py
├── tests/                        # pytest suite
├── .env.example
├── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── index.css             # Tailwind + custom utility classes
    │   ├── pages/                # Reasoning / Multilingual / Document / Code / Dual / Batch / Home
    │   ├── components/           # Layout, Sidebar, HistoryPanel, SettingsModal,
    │   │                         # PromptLibraryModal, ExportMenu, ReadOnlyEditor,
    │   │                         # CodePreview, JsonTree, DiffCompare, Markdown,
    │   │                         # ImageDropzone, MultiImageDropzone, ...
    │   ├── lib/
    │   │   ├── api.ts            # SSE client, streamForm, compressImage, makeThumbnail
    │   │   ├── useToolRun.ts     # streaming state machine
    │   │   ├── history.ts        # localStorage store, search, export, cap=100/tool
    │   │   ├── config.ts         # API key + model + backend localStorage
    │   │   ├── prompts.ts        # prompt template localStorage CRUD
    │   │   ├── export.ts         # Markdown / JSON / PDF / CSV helpers
    │   │   └── types.ts
    │   └── store/useAppStore.ts  # zustand (history, UI flags, restore queue)
    ├── package.json
    ├── vite.config.ts            # /api proxy → 127.0.0.1:8001
    └── tailwind.config.js
```

## Testing

```bash
# backend
python3 -m pytest tests/

# frontend typecheck + build
cd frontend && npm run build
```

## Notes

- The frontend's localStorage keys (`qls.history.v1`, `qls.config.v1`, `qls.prompts.v1`) are versioned — bump the `.v1` suffix when introducing a breaking schema change.
- `MOCK_MODE` does not invoke any model; it only streams canned text and is useful for offline demos or CI.
- API keys pasted into the Settings modal live in browser localStorage and are visible to any script running on the page origin. Don't paste keys on a host you don't trust.
- For large batch runs, keep the browser tab in focus — some browsers throttle fetches in background tabs.

## License

Internal / unlicensed unless otherwise noted.
