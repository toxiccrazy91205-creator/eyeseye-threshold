import ExperimentSession from '../models/ExperimentSession.js';

export const createSession = async (req, res) => {
  try {
    const {
      sessionId,
      participantId,
      prolificSessionId,
      prolificStudyId,
      easyEyesId,
      pavloviaSessionId,
      experimentName,
      deviceInfo,
    } = req.body;

    const existingSession = await ExperimentSession.findOne({ sessionId });
    if (existingSession) {
      return res.status(200).json(existingSession);
    }

    const session = new ExperimentSession({
      sessionId,
      participantId,
      prolificSessionId,
      prolificStudyId,
      easyEyesId,
      pavloviaSessionId,
      experimentName: experimentName || 'threshold',
      deviceInfo,
      status: 'started',
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ExperimentSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    
    const session = await ExperimentSession.findOneAndUpdate(
      { sessionId },
      { $set: { ...updates, lastActive: new Date() } },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const getSessionByParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;
    const sessions = await ExperimentSession.find({ participantId })
      .sort({ startTime: -1 })
      .limit(10);
    
    res.json(sessions);
  } catch (error) {
    console.error('Error getting session by participant:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    const sessions = await ExperimentSession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await ExperimentSession.countDocuments(query);
    
    res.json({ sessions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};