import express from 'express';
import {
  createSession,
  getSession,
  updateSession,
  getSessionByParticipant,
  getAllSessions,
} from '../controllers/experimentController.js';

const router = express.Router();

router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);
router.put('/sessions/:sessionId', updateSession);
router.get('/sessions/participant/:participantId', getSessionByParticipant);
router.get('/sessions', getAllSessions);

export default router;