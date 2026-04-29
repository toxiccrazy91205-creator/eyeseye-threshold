import express from 'express';
import {
  saveTrialData,
  getTrialData,
  getTrialDataBySession,
  saveBulkTrialData,
  getExperimentResults,
} from '../controllers/dataController.js';

const router = express.Router();

router.post('/trial', saveTrialData);
router.get('/trial/:id', getTrialData);
router.get('/trials/session/:sessionId', getTrialDataBySession);
router.post('/trials/bulk', saveBulkTrialData);
router.get('/results', getExperimentResults);

export default router;