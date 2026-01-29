import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  createSettings
} from '../db/queries.js';

const router = Router();

// GET /conversations - List all conversations
router.get('/conversations', (_req, res) => {
  try {
    const conversations = getAllConversations();
    
    res.json({
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// POST /conversations - Create new conversation
router.post('/conversations', (req, res) => {
  try {
    const { title, settings } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const conversationId = `conv_${nanoid(10)}`;
    const createdAt = new Date().toISOString();
    
    const conversation = createConversation(conversationId, title, createdAt);
    
    // Create settings if provided
    if (settings) {
      const model = settings.model || 'claude-3-5-sonnet-20241022';
      const systemPrompt = settings.systemPrompt || null;
      const temperature = settings.temperature !== undefined ? settings.temperature : 0.7;
      
      createSettings(conversationId, model, systemPrompt, temperature);
    } else {
      // Create default settings
      createSettings(conversationId, 'claude-3-5-sonnet-20241022', null, 0.7);
    }
    
    res.status(201).json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// PATCH /conversations/:conversationId - Update conversation title
router.patch('/conversations/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const conversation = getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    updateConversationTitle(conversationId, title);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// DELETE /conversations/:conversationId - Delete conversation
router.delete('/conversations/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    deleteConversation(conversationId);
    
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
