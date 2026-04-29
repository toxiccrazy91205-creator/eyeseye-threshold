import express from 'express';
import ResponseData from '../models/ResponseData.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const response = new ResponseData(req.body);
    await response.save();
    res.status(201).json(response);
  } catch (error) {
    console.error('Error saving form response:', error);
    res.status(500).json({ error: 'Failed to save form response' });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const responses = await ResponseData.find({ sessionId })
      .sort({ timestamp: -1 });
    res.json(responses);
  } catch (error) {
    console.error('Error getting form responses:', error);
    res.status(500).json({ error: 'Failed to get form responses' });
  }
});

router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const responses = await ResponseData.find({ participantId })
      .sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    console.error('Error getting participant form responses:', error);
    res.status(500).json({ error: 'Failed to get form responses' });
  }
});

export default router;