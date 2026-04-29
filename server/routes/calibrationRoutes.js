import express from 'express';
import CalibrationData from '../models/CalibrationData.js';

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const { sessionId, type, ...calibrationFields } = req.body;
    
    const existing = await CalibrationData.findOne({ sessionId, type });
    
    if (existing) {
      Object.assign(existing, calibrationFields, { completed: true });
      await existing.save();
      return res.json(existing);
    }
    
    const calibration = new CalibrationData({
      sessionId,
      type,
      ...calibrationFields,
      completed: true,
    });
    
    await calibration.save();
    res.status(201).json(calibration);
  } catch (error) {
    console.error('Error saving calibration data:', error);
    res.status(500).json({ error: 'Failed to save calibration data' });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const calibrations = await CalibrationData.find({ sessionId });
    res.json(calibrations);
  } catch (error) {
    console.error('Error getting calibration data:', error);
    res.status(500).json({ error: 'Failed to get calibration data' });
  }
});

router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const calibrations = await CalibrationData.find({ participantId })
      .sort({ createdAt: -1 });
    res.json(calibrations);
  } catch (error) {
    console.error('Error getting calibration data:', error);
    res.status(500).json({ error: 'Failed to get calibration data' });
  }
});

export default router;