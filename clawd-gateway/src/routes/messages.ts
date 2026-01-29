import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  getConversationById,
  getMessagesByConversationId,
  createMessage,
  getSettingsByConversationId,
  updateConversationTimestamp,
  updateStatus
} from '../db/queries.js';
import { sendMessageToClaude } from '../services/claude.js';

const router = Router();

// GET /conversations/:conversationId/messages - Get all messages in a conversation
router.get('/conversations/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = getMessagesByConversationId(conversationId);
    
    res.json({
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /conversations/:conversationId/messages - Send message and get Claude response
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, settings } = req.body;
    
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const conversation = getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Get or use provided settings
    let conversationSettings = getSettingsByConversationId(conversationId);
    const model = settings?.model || conversationSettings?.model || 'claude-3-5-sonnet-20241022';
    const systemPrompt = settings?.systemPrompt !== undefined ? settings.systemPrompt : conversationSettings?.system_prompt;
    const temperature = settings?.temperature !== undefined ? settings.temperature : conversationSettings?.temperature;

    // Create user message
    const userMessageId = `msg_${nanoid(10)}`;
    const userCreatedAt = new Date().toISOString();
    const userMessage = createMessage(userMessageId, conversationId, 'user', content, userCreatedAt);

    // Get conversation history
    const allMessages = getMessagesByConversationId(conversationId);

    // Call Claude API
    let assistantContent: string;
    let responseTimeMs: number;
    let error: string | null = null;

    try {
      const response = await sendMessageToClaude(allMessages, {
        model,
        systemPrompt,
        temperature
      });
      assistantContent = response.content;
      responseTimeMs = response.responseTimeMs;
    } catch (err: any) {
      console.error('Claude API error:', err);
      error = err.message || 'Failed to get response from Claude';
      
      // Update status with error
      updateStatus(model, 'clawd-default', null, error);
      
      res.status(500).json({ 
        error: 'Failed to get response from Claude',
        details: error
      });
      return;
    }

    // Create assistant message
    const assistantMessageId = `msg_${nanoid(10)}`;
    const assistantCreatedAt = new Date().toISOString();
    const assistantMessage = createMessage(assistantMessageId, conversationId, 'assistant', assistantContent, assistantCreatedAt);

    // Update conversation timestamp
    updateConversationTimestamp(conversationId);

    // Update status
    updateStatus(model, 'clawd-default', responseTimeMs, null);

    // Get updated status
    const status = {
      activeModel: model,
      activeAgent: 'clawd-default',
      lastResponseMs: responseTimeMs,
      lastError: null
    };

    res.json({
      message: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.created_at
      },
      response: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.created_at
      },
      status
    });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

export default router;
