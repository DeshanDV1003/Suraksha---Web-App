import { Router, Request, Response } from 'express';
import { chat } from '../services/chatbotService';

const router = Router();

router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, history = [], lat, lng } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await chat(message.trim(), history, lat, lng);
    res.json({ reply });
  } catch (err: any) {
    console.error('[Chatbot] Error:', err.message, err.status, err.errorDetails);
    res.status(500).json({ error: err.message || 'Chatbot unavailable.' });
  }
});

export default router;
