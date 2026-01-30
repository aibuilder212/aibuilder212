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
