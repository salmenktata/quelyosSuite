const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const appLogFile = path.join(logsDir, 'app.log');
const auditLogFile = process.env.AUDIT_LOG_PATH || path.join(logsDir, 'audit.log');

function writeJsonLine(file, payload) {
  const logString = JSON.stringify(payload) + '\n';
  fs.appendFileSync(file, logString);
}

function basePayload(level, message, data) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
}

function log(level, message, data = {}) {
  const payload = basePayload(level, message, data);
  writeJsonLine(appLogFile, payload);
  console.log(`[${level}] ${message}`, data);
}

function audit(event, data = {}) {
  const payload = basePayload('AUDIT', event, data);
  writeJsonLine(auditLogFile, payload);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUDIT]', payload);
  }
}

module.exports = {
  info: (msg, data) => log('INFO', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data),
  audit
};
