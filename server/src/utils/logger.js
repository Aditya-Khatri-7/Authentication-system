import crypto from 'crypto';

class Logger {
  /**
   * Masks sensitive fields in objects/payloads recursively to prevent credential leaks
   */
  maskSensitive(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const masked = Array.isArray(obj) ? [...obj] : { ...obj };
    const sensitiveKeys = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'otp',
      'EMAIL_APP_PASSWORD',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    Object.keys(masked).forEach(key => {
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitive(masked[key]);
      } else if (sensitiveKeys.includes(key) || sensitiveKeys.some(sk => key.toUpperCase().includes(sk))) {
        masked[key] = '***';
      }
    });

    return masked;
  }

  /**
   * Internal structured log writer
   */
  writeLog(level, message, meta = {}) {
    const cleanMeta = this.maskSensitive(meta);
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...cleanMeta,
    };
    
    // Output JSON to standard stream channels
    const logString = JSON.stringify(logEntry);
    if (level === 'ERROR') {
      console.error(logString);
    } else {
      console.log(logString);
    }
  }

  info(message, meta) {
    this.writeLog('INFO', message, meta);
  }

  warn(message, meta) {
    this.writeLog('WARN', message, meta);
  }

  error(message, meta) {
    this.writeLog('ERROR', message, meta);
  }

  security(message, meta) {
    this.writeLog('SECURITY', message, meta);
  }
}

export default new Logger();
