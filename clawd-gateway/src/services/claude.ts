import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../db/database.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeRequestSettings {
  model: string;
  systemPrompt?: string | null;
  temperature?: number | null;
}

export interface ClaudeResponse {
  content: string;
  responseTimeMs: number;
}

export async function sendMessageToClaude(
  messages: Message[],
  settings: ClaudeRequestSettings
): Promise<ClaudeResponse> {
  const startTime = Date.now();

  try {
    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await anthropic.messages.create({
      model: settings.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: settings.systemPrompt || undefined,
      temperature: settings.temperature !== null && settings.temperature !== undefined ? settings.temperature : 0.7,
      messages: anthropicMessages
    });

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Extract text content from response
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');

    return {
      content,
      responseTimeMs
    };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}
