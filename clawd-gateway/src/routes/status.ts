import { Router } from 'express';
import { getStatus } from '../db/queries.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /status - Get current status with authentication
router.get('/status', authenticateToken, (_req, res) => {
  try {
    const status = getStatus();
    
    res.json({
      activeModel: status.active_model,
      activeAgent: status.active_agent,
      lastResponseMs: status.last_response_ms,
      lastError: status.last_error
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
