import mongoose from 'mongoose';

const trialDataSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  blockNumber: {
    type: Number,
    required: true,
  },
  trialNumber: {
    type: Number,
    required: true,
  },
  condition: {
    type: mongoose.Schema.Types.Mixed,
  },
  targetKind: String,
  targetTask: String,
  response: {
    type: mongoose.Schema.Types.Mixed,
  },
  correct: Boolean,
  reactionTime: Number,
  targetEccentricityDeg: {
    x: Number,
    y: Number,
  },
  targetSizeDeg: Number,
  targetDurationSec: Number,
  viewingDistanceCm: Number,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  extraData: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

trialDataSchema.index({ sessionId: 1, blockNumber: 1, trialNumber: 1 });
trialDataSchema.index({ targetKind: 1, createdAt: -1 });

const TrialData = mongoose.model('TrialData', trialDataSchema);

export default TrialData;