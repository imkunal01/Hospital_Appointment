import winston from 'winston';
import chalk from 'chalk';
import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'pretty' | 'json';

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

/**
 * Keys representing request/response headers or request/response payloads
 * that must NEVER be visible in backend logs to protect sensitive transport
 * metadata, auth tokens, cookies, and patient request bodies.
 */
const EXCLUDED_LOG_KEYS = new Set([
  'headers',
  'header',
  'req_headers',
  'request_headers',
  'res_headers',
  'response_headers',
  'payload',
  'payloads',
  'request_payload',
  'req_payload',
  'response_payload',
  'res_payload',
  'body',
  'req_body',
  'request_body',
  'res_body',
  'response_body',
  'request',
  'response',
  'req',
  'res'
]);

// JWT token format: header.payload.signature
const JWT_REGEX = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Deeply redacts sensitive keys and patterns from log context objects.
 * Guarantees that tokens, passwords, and PII are never printed to logs,
 * and completely excludes HTTP headers and request/response payloads.
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

    // 1. Strictly exclude headers and request/response payloads from log visibility
    if (EXCLUDED_LOG_KEYS.has(lowerKey)) {
      continue;
    }

    // 2. Redact sensitive credentials and PII
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
    const { name, message, stack, ...rest } = err as any;

    // Explicitly delete headers, payload, and body from error objects
    delete rest.headers;
    delete rest.header;
    delete rest.body;
    delete rest.payload;
    delete rest.payloads;
    delete rest.request;
    delete rest.response;
    delete rest.config;
    delete rest.req;
    delete rest.res;

    return {
      errorType: name || err.name,
      message: message || err.message,
      stack: err.stack,
      ...redactSensitive(rest)
    };
  }
  return { message: String(err) };
}

/**
 * Chalk terminal formatting tokens for clean CLI and developer experience.
 */
export const chalkTokens = {
  debug: chalk.bgMagenta.white.bold(' DEBUG ') + ' ',
  info: chalk.bgCyan.black.bold(' INFO  ') + ' ',
  warn: chalk.bgYellow.black.bold(' WARN  ') + ' ',
  error: chalk.bgRed.white.bold(' ERROR ') + ' ',
  http: chalk.bgBlue.white.bold(' HTTP  ') + ' ',
  timestamp: (ts: string) => chalk.gray(`[${ts}]`),
  method: (m: string) => {
    const padded = m.toUpperCase().padEnd(6);
    switch (m.toUpperCase()) {
      case 'GET': return chalk.green.bold(padded);
      case 'POST': return chalk.blue.bold(padded);
      case 'PUT': return chalk.yellow.bold(padded);
      case 'PATCH': return chalk.magenta.bold(padded);
      case 'DELETE': return chalk.red.bold(padded);
      default: return chalk.white.bold(padded);
    }
  },
  status: (code: number) => {
    if (code >= 500) return chalk.bgRed.white.bold(` ${code} `);
    if (code >= 400) return chalk.yellow.bold(code.toString());
    if (code >= 300) return chalk.cyan(code.toString());
    if (code >= 200) return chalk.green.bold(code.toString());
    return chalk.white(code.toString());
  }
};

/**
 * Beautiful human-readable terminal formatter using Chalk.
 * Pixel-aligned timestamps, styled level badges, compact metadata, and colored stack traces.
 */
const prettyConsoleFormat = winston.format.printf((info) => {
  const rawDate = info.timestamp ? new Date(String(info.timestamp)) : new Date();
  const timeFormatted = rawDate.toTimeString().split(' ')[0] + '.' + String(rawDate.getMilliseconds()).padStart(3, '0');
  const timestamp = chalk.gray(`[${timeFormatted}]`);

  let badge: string;
  let messageColor: (str: string) => string = chalk.white;
  const levelStr = String(info.level || '').toLowerCase();

  switch (levelStr) {
    case 'error':
      badge = chalkTokens.error;
      messageColor = chalk.redBright.bold;
      break;
    case 'warn':
      badge = chalkTokens.warn;
      messageColor = chalk.yellowBright;
      break;
    case 'info':
      badge = chalkTokens.info;
      messageColor = chalk.whiteBright;
      break;
    case 'debug':
      badge = chalkTokens.debug;
      messageColor = chalk.gray;
      break;
    default:
      badge = chalk.bgWhite.black.bold(` ${levelStr.toUpperCase().padEnd(5)} `) + ' ';
      break;
  }

  // 1. Structured single-line format for HTTP requests (No redundant context dump)
  const ctx = info.context as Record<string, any> | undefined;
  if (ctx && ctx.method && ctx.statusCode !== undefined && ctx.durationMs !== undefined) {
    const methodStr = chalkTokens.method(String(ctx.method));
    const statusStr = chalkTokens.status(Number(ctx.statusCode));
    const duration = typeof ctx.durationMs === 'number' ? ctx.durationMs : parseFloat(String(ctx.durationMs));
    const durationStr = duration >= 1000 ? chalk.red.bold(`${duration}ms`) : duration >= 250 ? chalk.yellow(`${duration}ms`) : chalk.cyan(`${duration}ms`);
    const pathStr = chalk.whiteBright(ctx.path || info.message);
    const userStr = ctx.userId ? chalk.gray(`(user: ${String(ctx.userId).slice(0, 8)}...)`) : '';
    const reqIdStr = ctx.requestId ? chalk.gray(`(id: ${ctx.requestId})`) : '';

    const parts = [
      timestamp,
      badge,
      methodStr,
      pathStr,
      statusStr,
      durationStr,
      userStr,
      reqIdStr
    ].filter((p) => p && p.length > 0);

    return parts.join(' ');
  }

  let line = `${timestamp} ${badge}${messageColor(String(info.message))}`;

  if (info.context && Object.keys(info.context).length > 0) {
    const cleanContext = redactSensitive(info.context);
    const entries = Object.entries(cleanContext);
    const isFlat = entries.every(([_, v]) => typeof v !== 'object' || v === null);

    if (isFlat) {
      const items = entries.map(([k, v]) => `${chalk.cyan(k)}=${chalk.white(String(v))}`).join('  ');
      line += `\n        ${chalk.gray('↳')} ${items}`;
    } else {
      const jsonStr = JSON.stringify(cleanContext, null, 2)
        .split('\n')
        .map((l) => '        ' + chalk.gray(l))
        .join('\n');
      line += `\n        ${chalk.gray('↳ context:')}\n${jsonStr}`;
    }
  }

  if (info.error) {
    const cleanError = redactSensitive(info.error);
    const errMsg = cleanError.message || String(cleanError);
    const errType = cleanError.errorType || 'Error';
    line += `\n        ${chalk.red.bold('✖ ' + errType + ':')} ${chalk.red(errMsg)}`;
    if (cleanError.stack) {
      const stackLines = String(cleanError.stack)
        .split('\n')
        .slice(1, 4)
        .map((l) => '          ' + chalk.gray(l.trim()))
        .join('\n');
      line += `\n${stackLines}`;
    }
  }

  return line;
});

/**
 * Standard structured JSON Formatter with uppercase level for ingestion & tests.
 */
const jsonOutputFormat = winston.format.combine(
  winston.format((info) => {
    info.level = info.level.toUpperCase();
    info.service = 'hospital-appointment-backend';
    info.environment = env?.NODE_ENV ?? 'development';

    if (info.context) {
      info.context = redactSensitive(info.context);
    }
    if (info.error) {
      info.error = redactSensitive(info.error);
    }

    return info;
  })(),
  winston.format.timestamp(),
  winston.format.json()
);

/**
 * Custom Winston Transport directing logs through standard console methods.
 */
class ConsoleOutputTransport extends winston.transports.Console {
  log(info: any, callback: () => void) {
    const message = info[Symbol.for('message')] || JSON.stringify(info);
    const levelStr = String(info.level || '').toLowerCase();

    if (levelStr === 'error') {
      console.error(message);
    } else if (levelStr === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }

    callback();
  }
}

class Logger {
  private currentLevel: LogLevel;
  private currentFormat: LogFormat;
  public winston: winston.Logger;

  constructor() {
    this.currentLevel = env?.LOG_LEVEL ?? 'info';
    this.currentFormat = env?.LOG_FORMAT ?? (env?.NODE_ENV === 'test' ? 'json' : 'pretty');

    this.winston = this.buildWinstonLogger();
  }

  private buildWinstonLogger(): winston.Logger {
    const format = this.currentFormat === 'pretty'
      ? winston.format.combine(winston.format.timestamp(), prettyConsoleFormat)
      : jsonOutputFormat;

    return winston.createLogger({
      levels: { error: 0, warn: 1, info: 2, debug: 3 },
      level: this.currentLevel,
      format,
      transports: [new ConsoleOutputTransport()]
    });
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.winston.level = level;
  }

  public getLevel(): LogLevel {
    return this.currentLevel;
  }

  public setFormat(format: LogFormat): void {
    this.currentFormat = format;
    this.winston = this.buildWinstonLogger();
  }

  public getFormat(): LogFormat {
    return this.currentFormat;
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.winston.log('debug', message, context && Object.keys(context).length > 0 ? { context } : undefined);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.winston.log('info', message, context && Object.keys(context).length > 0 ? { context } : undefined);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.winston.log('warn', message, context && Object.keys(context).length > 0 ? { context } : undefined);
  }

  public error(
    message: string,
    err?: unknown,
    context?: Record<string, any>
  ): void {
    const meta: Record<string, any> = {};
    if (context && Object.keys(context).length > 0) {
      meta.context = context;
    }
    if (err !== undefined) {
      meta.error = formatError(err);
    }
    this.winston.log('error', message, meta);
  }

  /**
   * Morgan stream adapter forwarding HTTP access logs through Winston.
   */
  public get stream() {
    return {
      write: (message: string) => {
        this.info(message.trim());
      }
    };
  }
}

export const logger = new Logger();
