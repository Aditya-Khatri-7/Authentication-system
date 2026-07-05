import AuditLog from '../models/auditLogModel.js';

class AuditLogRepository {
  async create(logData) {
    const auditLog = new AuditLog(logData);
    return await auditLog.save();
  }
}

export default new AuditLogRepository();
