# aibuilder212

This repository contains the Clawd Control Panel frontend and the Clawd Gateway backend.

## Local quick start (browser)

You need both the gateway API and the control panel UI running locally.

### 1) Start the gateway API

```bash
cd clawd-gateway
npm install
cp .env.example .env
```

Update `.env` with:

- `ANTHROPIC_API_KEY` (from Anthropic)
- `GATEWAY_TOKEN` (any strong token)

Then start the API server:

```bash
npm run dev
```

### 2) Start the control panel UI

```bash
cd clawd-control-panel
npm install
cp .env.example .env
```

Ensure `.env` contains:

- `VITE_GATEWAY_URL=http://localhost:3001`
- `VITE_GATEWAY_TOKEN` (same value as `GATEWAY_TOKEN`)

Then start the UI:

```bash
npm run dev
```

Open <http://localhost:5173>.

## Agent Zero (Docker)

The [`agent-zero`](./agent-zero) directory contains the configuration files needed to run [Agent Zero](https://github.com/agent0ai/agent-zero) in Docker with GPT-4, Gemini 3, and Groq.

### Quick start

```bash
cd agent-zero
cp .env.example .env
```

Open `.env` and fill in your three API keys:

| Key | Provider | Where to get it |
|-----|----------|-----------------|
| `API_KEY_OPENAI` | GPT-4o | <https://platform.openai.com/api-keys> |
| `API_KEY_GOOGLE` | Gemini 3 Flash | <https://aistudio.google.com/app/apikey> |
| `API_KEY_GROQ` | Llama 3.3 70B | <https://console.groq.com/keys> |

Also set `AUTH_LOGIN` and `AUTH_PASSWORD` to protect the web UI.

Then start the container:

```bash
docker compose up -d
```

Open <http://localhost:50001> to access Agent Zero.

### Model defaults

| Role | Provider | Model |
|------|----------|-------|
| Chat | OpenAI | `gpt-4o` |
| Utility | Google | `gemini-3-flash-preview` |
| Browser | OpenAI | `gpt-4o` (vision) |
| Embedding | HuggingFace | `all-MiniLM-L6-v2` (local) |

To switch the chat model to Groq (`llama-3.3-70b-versatile`), uncomment the three `A0_SET_chat_model_*` Groq lines in your `.env` and comment out the OpenAI ones.

---

## Clawd Control Panel

The production-ready React UI lives in [`clawd-control-panel`](./clawd-control-panel). It includes:

- Real-time chat UI with multiple conversations
- Conversation list with rename/delete controls
- Status indicator for model/agent info
- Settings modal persisted to local storage

### Get started

```bash
cd clawd-control-panel
npm install
cp .env.example .env
npm run dev
```

Then open <http://localhost:5173>.
