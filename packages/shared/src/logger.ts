import pino from 'pino'

const isDev = process.env['NODE_ENV'] !== 'production'

/**
 * Structured JSON logger (pino).
 *
 * In development: pretty-prints with colors.
 * In production: JSON to stdout (shipped to Axiom/Better Stack by the log shipper).
 *
 * All application log calls should include at minimum: requestId, tenantId, userId.
 * Worker calls include: jobId, targetId.
 */
export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  // Redact sensitive fields that should never appear in logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.authHeader',
      'body.auth_header',
      '*.authHeaderEncrypted',
    ],
    censor: '[REDACTED]',
  },
})

/** Create a child logger with a fixed requestId for the duration of a request */
export function requestLogger(requestId: string, tenantId?: string, userId?: string) {
  return logger.child({ requestId, tenantId, userId })
}

/** Create a child logger for a worker job */
export function jobLogger(jobId: string, targetId: string, tenantId: string) {
  return logger.child({ jobId, targetId, tenantId })
}
