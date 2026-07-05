import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required for audit logs'],
    trim: true,
    index: true,
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['SUCCESS', 'FAILED'],
    trim: true,
  },
  ip: {
    type: String,
    default: '',
  },
  browser: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
