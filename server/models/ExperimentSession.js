import mongoose from 'mongoose';

const experimentSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  experimentName: {
    type: String,
    required: true,
    default: 'threshold',
  },
  participantId: {
    type: String,
    index: true,
  },
  prolificSessionId: String,
  prolificStudyId: String,
  easyEyesId: String,
  pavloviaSessionId: String,
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'abandoned'],
    default: 'started',
  },
  blockCount: {
    type: Number,
    default: 0,
  },
  trialCount: {
    type: Number,
    default: 0,
  },
  experimentData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    language: String,
    screenResolution: String,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

experimentSessionSchema.index({ participantId: 1, startTime: -1 });
experimentSessionSchema.index({ status: 1, createdAt: -1 });

const ExperimentSession = mongoose.model('ExperimentSession', experimentSessionSchema);

export default ExperimentSession;