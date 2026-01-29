# Clawd Gateway

A production-ready backend API gateway server that integrates with Anthropic's Claude API and serves the Clawd Control Panel frontend.

## Features

- ✅ Express.js with TypeScript for type safety
- ✅ SQLite with `better-sqlite3` for fast, synchronous database operations
- ✅ Anthropic SDK integration for Claude API
- ✅ Bearer token authentication
- ✅ CORS enabled for frontend communication
- ✅ Comprehensive error handling and logging
- ✅ RESTful API design with 7 endpoints

## Prerequisites

- Node.js 18+
- npm 9+
- Anthropic API key

## Quick Start

1. **Install dependencies**

```bash
cd clawd-gateway
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Server
PORT=3001
NODE_ENV=development

# Security - Generate a strong random token
GATEWAY_TOKEN=your-secret-token-here

# Anthropic API - Get your key from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# CORS - Frontend URL(s), comma-separated
ALLOWED_ORIGINS=http://localhost:5173

# Database
DB_PATH=./clawd.db
```

3. **Run the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Documentation

### Authentication

The `/status` endpoint requires Bearer token authentication:

```
Authorization: Bearer YOUR_GATEWAY_TOKEN
```

### Endpoints

#### 1. GET `/status`

Get current gateway status (requires authentication).

**Response:**
```json
{
  "activeModel": "claude-3-5-sonnet-20241022",
  "activeAgent": "clawd-default",
  "lastResponseMs": 842,
  "lastError": null
}
```

#### 2. GET `/conversations`

List all conversations sorted by most recent.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "Morning planning",
      "updatedAt": "2026-01-28T14:22:11Z"
    }
  ]
}
```

#### 3. POST `/conversations`

Create a new conversation with optional settings.

**Request:**
```json
{
  "title": "New conversation",
  "settings": {
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "You are Clawd, a helpful automation assistant.",
    "temperature": 0.4
  }
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv_def456",
    "title": "New conversation",
    "updatedAt": "2026-01-28T14:25:00Z"
  }
}
```

#### 4. PATCH `/conversations/:conversationId`

Update a conversation's title.

**Request:**
```json
{
  "title": "Renamed conversation"
}
```

**Response:**
```json
{
  "success": true
}
```

#### 5. DELETE `/conversations/:conversationId`

Delete a conversation and all its messages.

**Response:**
```json
{
  "deleted": true
}
```

#### 6. GET `/conversations/:conversationId/messages`

Retrieve all messages in a conversation.

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2026-01-28T14:25:30Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Hi! How can I help today?",
      "createdAt": "2026-01-28T14:25:32Z"
    }
  ]
}
```

#### 7. POST `/conversations/:conversationId/messages`

Send a user message and get Claude's response.

**Request:**
```json
{
  "content": "Hello!",
  "settings": {
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "You are Clawd, a helpful automation assistant.",
    "temperature": 0.4
  }
}
```

**Response:**
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
    "activeModel": "claude-3-5-sonnet-20241022",
    "activeAgent": "clawd-default",
    "lastResponseMs": 842,
    "lastError": null
  }
}
```

## Database Schema

The gateway uses SQLite with the following schema:

### conversations
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

### settings
```sql
CREATE TABLE settings (
  conversation_id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  system_prompt TEXT,
  temperature REAL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

### status
```sql
CREATE TABLE status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_model TEXT,
  active_agent TEXT,
  last_response_ms INTEGER,
  last_error TEXT
);
```

## Connecting with Frontend

1. Start the gateway server (default: http://localhost:3001)
2. Configure the frontend's `.env` file:

```env
VITE_GATEWAY_URL=http://localhost:3001
VITE_GATEWAY_TOKEN=your-secret-token-here
```

3. Start the frontend:

```bash
cd clawd-control-panel
npm run dev
```

4. Open http://localhost:5173 and start chatting!

## Architecture

```
clawd-gateway/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── routes/               # API route handlers
│   │   ├── status.ts         # Status endpoint
│   │   ├── conversations.ts  # Conversation CRUD endpoints
│   │   └── messages.ts       # Message endpoints
│   ├── db/                   # Database layer
│   │   ├── database.ts       # Database setup and initialization
│   │   └── queries.ts        # SQL queries and data access
│   ├── services/             # External services
│   │   └── claude.ts         # Claude API integration
│   └── middleware/           # Express middleware
│       ├── auth.ts           # Bearer token authentication
│       └── errorHandler.ts   # Error handling
├── package.json
├── tsconfig.json
└── .env.example
```

## Development

### Running in development mode

```bash
npm run dev
```

This uses `tsx watch` for hot reloading during development.

### Building for production

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Running in production

```bash
npm start
```

## Error Handling

The gateway includes comprehensive error handling:

- Input validation for all endpoints
- Anthropic API error handling
- Database error handling
- Authentication errors
- Meaningful error messages in responses

## Performance Optimizations

- **better-sqlite3**: Synchronous, faster than async alternatives
- **Connection pooling**: Reuses Anthropic client instance
- **Efficient queries**: Optimized SQL queries with proper indexing
- **Foreign key constraints**: Ensures data integrity with cascading deletes

## Security

- Bearer token authentication for sensitive endpoints
- Environment variable configuration
- CORS configuration
- Input validation
- SQL injection prevention through parameterized queries

## Logging

All requests, responses, and errors are logged to the console with timestamps.

## License

MIT
