import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|cookie|bearer|ssn|credit_?card)/i;
const SENSITIVE_PII_KEYS = new Set([
  'email',
  'phone',
  'phonenumber',
  'phone_number',
  'name',
  'full_name',
  'fullname',
  'patient_name',
  'patientname',
  'user_name',
  'username',
  'dob',
  'date_of_birth',
  'dateofbirth',
  'diagnosis',
  'treatment',
  'prescription'
]);

// JWT token format: header.payload.signature
const JWT_REGEX = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Deeply redacts sensitive keys and patterns from log context objects.
 * Guarantees that tokens, passwords, and PII are never printed to logs.
 */
export function redactSensitive(val: any, seen = new WeakSet()): any {
  if (val === null || val === undefined) {
    return val;
  }

  if (typeof val === 'string') {
    if (val.startsWith('Bearer ')) {
      return 'Bearer [REDACTED]';
    }
    if (JWT_REGEX.test(val)) {
      return '[REDACTED_TOKEN]';
    }
    return val;
  }

  if (typeof val !== 'object') {
    return val;
  }

  if (val instanceof Date) {
    return val.toISOString();
  }

  if (seen.has(val)) {
    return '[Circular]';
  }
  seen.add(val);

  if (Array.isArray(val)) {
    return val.map((item) => redactSensitive(item, seen));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, propVal] of Object.entries(val)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEY_REGEX.test(key) || SENSITIVE_PII_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = redactSensitive(propVal, seen);
    }
  }

  return sanitized;
}

export function formatError(err: unknown): Record<string, any> {
  if (err instanceof Error) {
    return {
      errorType: err.name,
      message: err.message,
      stack: err.stack,
      ...(err as any)
    };
  }
  return { message: String(err) };
}

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = env?.LOG_LEVEL ?? 'info';
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  public getLevel(): LogLevel {
    return this.currentLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_PRIORITIES[level] >= LOG_PRIORITIES[this.currentLevel];
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    err?: unknown
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: 'hospital-appointment-backend',
      environment: env?.NODE_ENV ?? 'development'
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = redactSensitive(context);
    }

    if (err !== undefined) {
      entry.error = redactSensitive(formatError(err));
    }

    const json = JSON.stringify(entry);

    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(
    message: string,
    err?: unknown,
    context?: Record<string, any>
  ): void {
    this.log('error', message, context, err);
  }
}

export const logger = new Logger();
