# Clawd Control Panel

A polished control panel UI for your Clawd/Moltbot gateway. This single-page app lets you create and manage conversations, chat in real time, and configure model settings that persist in local storage.

## Prerequisites

- Node.js 18+
- npm 9+

## Quick start

```bash
cd clawd-control-panel
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173> and start chatting.

## Environment configuration

Create a `.env` file with your gateway settings:

```bash
VITE_GATEWAY_URL=https://your-clawd-gateway.example.com
VITE_GATEWAY_TOKEN=replace-with-your-token
```

## Gateway API contract

The UI expects the gateway to support the following JSON endpoints. Replace the paths if your gateway differs.

### GET `/status`

**Headers**

```
Authorization: Bearer $VITE_GATEWAY_TOKEN
```

**Response**

```json
{
  "activeModel": "gpt-4o-mini",
  "activeAgent": "clawd-default",
  "lastResponseMs": 842,
  "lastError": null
}
```

### GET `/conversations`

**Response**

```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": "Morning planning",
      "updatedAt": "2026-01-28T14:22:11Z"
    }
  ]
}
```

### POST `/conversations`

**Body**

```json
{
  "title": "New conversation",
  "settings": {
    "model": "gpt-4o-mini",
    "systemPrompt": "You are Clawd, a helpful automation assistant.",
    "temperature": 0.4
  }
}
```

**Response**

```json
{
  "conversation": {
    "id": "conv_456",
    "title": "New conversation",
    "updatedAt": "2026-01-28T14:25:00Z"
  }
}
```

### PATCH `/conversations/:conversationId`

**Body**

```json
{
  "title": "Renamed conversation"
}
```

### DELETE `/conversations/:conversationId`

**Response**

```json
{ "deleted": true }
```

### GET `/conversations/:conversationId/messages`

**Response**

```json
{
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2026-01-28T14:25:30Z"
    }
  ]
}
```

### POST `/conversations/:conversationId/messages`

**Body**

```json
{
  "content": "Hello!",
  "settings": {
    "model": "gpt-4o-mini",
    "systemPrompt": "You are Clawd, a helpful automation assistant.",
    "temperature": 0.4
  }
}
```

**Response**

```json
{
  "message": {
    "id": "msg_1",
    "role": "user",
    "content": "Hello!",
    "createdAt": "2026-01-28T14:25:30Z"
  },
  "response": {
    "id": "msg_2",
    "role": "assistant",
    "content": "Hi! How can I help today?",
    "createdAt": "2026-01-28T14:25:32Z"
  },
  "status": {
    "activeModel": "gpt-4o-mini",
    "activeAgent": "clawd-default",
    "lastResponseMs": 842,
    "lastError": null
  }
}
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - build for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint
