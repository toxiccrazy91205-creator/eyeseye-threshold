import mongoose from 'mongoose';

const responseDataSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  participantId: String,
  formType: {
    type: String,
    required: true,
    enum: ['consent', 'demographic', 'survey', 'feedback', 'custom'],
  },
  formName: String,
  responses: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  consentGiven: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

responseDataSchema.index({ sessionId: 1, formType: 1 });
responseDataSchema.index({ participantId: 1, createdAt: -1 });

const ResponseData = mongoose.model('ResponseData', responseDataSchema);

export default ResponseData;