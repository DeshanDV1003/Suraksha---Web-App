import { Router, Request, Response } from 'express';
import { chat } from '../services/chatbotService';

const router = Router();

router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, history = [], lat, lng, lang } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await chat(message.trim(), history, lat, lng, lang);
    res.json({ reply });
  } catch (err: any) {
    console.error('[Chatbot] Error:', err.status, err?.error?.error ?? err.message);
    res.status(500).json({ error: 'Sorry, I could not connect right now. Please try again in a moment.' });
  }
});

export default router;
