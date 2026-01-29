import db, { Conversation, Message, Settings, Status } from './database.js';

// Conversation queries
export function getAllConversations(): Conversation[] {
  return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all() as Conversation[];
}

export function getConversationById(id: string): Conversation | undefined {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
}

export function createConversation(id: string, title: string, createdAt: string): Conversation {
  db.prepare(`
    INSERT INTO conversations (id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(id, title, createdAt, createdAt);
  
  return getConversationById(id)!;
}

export function updateConversationTitle(id: string, title: string): void {
  const updatedAt = new Date().toISOString();
  db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(title, updatedAt, id);
}

export function updateConversationTimestamp(id: string): void {
  const updatedAt = new Date().toISOString();
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(updatedAt, id);
}

export function deleteConversation(id: string): void {
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

// Message queries
export function getMessagesByConversationId(conversationId: string): Message[] {
  return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId) as Message[];
}

export function createMessage(id: string, conversationId: string, role: 'user' | 'assistant', content: string, createdAt: string): Message {
  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, conversationId, role, content, createdAt);
  
  return {
    id,
    conversation_id: conversationId,
    role,
    content,
    created_at: createdAt
  };
}

// Settings queries
export function getSettingsByConversationId(conversationId: string): Settings | undefined {
  return db.prepare('SELECT * FROM settings WHERE conversation_id = ?').get(conversationId) as Settings | undefined;
}

export function createSettings(conversationId: string, model: string, systemPrompt: string | null, temperature: number | null): Settings {
  db.prepare(`
    INSERT INTO settings (conversation_id, model, system_prompt, temperature)
    VALUES (?, ?, ?, ?)
  `).run(conversationId, model, systemPrompt, temperature);
  
  return getSettingsByConversationId(conversationId)!;
}

export function updateSettings(conversationId: string, model: string, systemPrompt: string | null, temperature: number | null): void {
  db.prepare(`
    UPDATE settings 
    SET model = ?, system_prompt = ?, temperature = ?
    WHERE conversation_id = ?
  `).run(model, systemPrompt, temperature, conversationId);
}

// Status queries
export function getStatus(): Status {
  return db.prepare('SELECT * FROM status WHERE id = 1').get() as Status;
}

export function updateStatus(activeModel: string | null, activeAgent: string, lastResponseMs: number | null, lastError: string | null): void {
  db.prepare(`
    UPDATE status 
    SET active_model = ?, active_agent = ?, last_response_ms = ?, last_error = ?
    WHERE id = 1
  `).run(activeModel, activeAgent, lastResponseMs, lastError);
}
