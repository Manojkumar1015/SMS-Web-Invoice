type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  action?: string;
  [key: string]: any;
}

function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'service_role'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitizeData(context) : {};
    console.log(JSON.stringify({ level: 'info', timestamp, message, ...payload }));
  },

  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitizeData(context) : {};
    console.warn(JSON.stringify({ level: 'warn', timestamp, message, ...payload }));
  },

  error(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitizeData(context) : {};
    console.error(JSON.stringify({ level: 'error', timestamp, message, ...payload }));
  },
};
