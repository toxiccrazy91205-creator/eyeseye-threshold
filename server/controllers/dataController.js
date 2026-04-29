import TrialData from '../models/TrialData.js';

export const saveTrialData = async (req, res) => {
  try {
    const trial = new TrialData(req.body);
    await trial.save();
    res.status(201).json(trial);
  } catch (error) {
    console.error('Error saving trial data:', error);
    res.status(500).json({ error: 'Failed to save trial data' });
  }
};

export const getTrialData = async (req, res) => {
  try {
    const { id } = req.params;
    const trial = await TrialData.findById(id);
    
    if (!trial) {
      return res.status(404).json({ error: 'Trial data not found' });
    }
    
    res.json(trial);
  } catch (error) {
    console.error('Error getting trial data:', error);
    res.status(500).json({ error: 'Failed to get trial data' });
  }
};

export const getTrialDataBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const trials = await TrialData.find({ sessionId })
      .sort({ blockNumber: 1, trialNumber: 1 });
    
    res.json(trials);
  } catch (error) {
    console.error('Error getting trial data by session:', error);
    res.status(500).json({ error: 'Failed to get trial data' });
  }
};

export const saveBulkTrialData = async (req, res) => {
  try {
    const { trials } = req.body;
    
    if (!Array.isArray(trials) || trials.length === 0) {
      return res.status(400).json({ error: 'No trial data provided' });
    }
    
    const savedTrials = await TrialData.insertMany(trials);
    res.status(201).json({ count: savedTrials.length, trials: savedTrials });
  } catch (error) {
    console.error('Error saving bulk trial data:', error);
    res.status(500).json({ error: 'Failed to save trial data' });
  }
};

export const getExperimentResults = async (req, res) => {
  try {
    const { sessionId, targetKind, limit = 100, offset = 0 } = req.query;
    const query = {};
    
    if (sessionId) query.sessionId = sessionId;
    if (targetKind) query.targetKind = targetKind;
    
    const trials = await TrialData.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await TrialData.countDocuments(query);
    
    res.json({ trials, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error getting experiment results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
};