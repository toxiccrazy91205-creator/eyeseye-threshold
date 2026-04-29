import mongoose from 'mongoose';

const calibrationDataSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  participantId: String,
  type: {
    type: String,
    enum: ['visual', 'audio', 'microphone', 'loudspeaker'],
    required: true,
  },
  viewingDistanceCm: Number,
  calibrationResults: {
    type: mongoose.Schema.Types.Mixed,
  },
  microphoneResults: {
    type: mongoose.Schema.Types.Mixed,
  },
  loudspeakerResults: {
    type: mongoose.Schema.Types.Mixed,
  },
  deviceInfo: {
    browser: String,
    os: String,
    audioDevice: String,
    microphoneDevice: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

calibrationDataSchema.index({ participantId: 1, type: 1 });
calibrationDataSchema.index({ sessionId: 1, type: 1 });

const CalibrationData = mongoose.model('CalibrationData', calibrationDataSchema);

export default CalibrationData;