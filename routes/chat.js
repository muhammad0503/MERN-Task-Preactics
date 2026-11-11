import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateReply } from '../services/llm.js';

const router = express.Router();

// Protect all chat endpoints with session authentication
router.use(requireAuth);

/**
 * [POST] /api/chat
 * Takes a message string, calls Gemini via services/llm.js, and returns the AI reply.
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate user input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    // Call Gemini API (stateless: Phase 1 sends only the current message)
    const reply = await generateReply(message.trim());

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate response from AI model.',
    });
  }
});

export default router;

