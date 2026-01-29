import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Settings {
  conversation_id: string;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
}

export interface Status {
  id: number;
  active_model: string | null;
  active_agent: string | null;
  last_response_ms: number | null;
  last_error: string | null;
}

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../clawd.db');
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase(): void {
  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      conversation_id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      system_prompt TEXT,
      temperature REAL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // Create status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_model TEXT,
      active_agent TEXT,
      last_response_ms INTEGER,
      last_error TEXT
    );
  `);

  // Insert default status row if not exists
  const statusRow = db.prepare('SELECT id FROM status WHERE id = 1').get();
  if (!statusRow) {
    db.prepare(`
      INSERT INTO status (id, active_model, active_agent, last_response_ms, last_error)
      VALUES (1, NULL, 'clawd-default', NULL, NULL)
    `).run();
  }

  console.log('Database initialized successfully');
}

export default db;
