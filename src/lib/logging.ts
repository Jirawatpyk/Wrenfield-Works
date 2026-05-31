import pino from 'pino'

/**
 * Structured application logger (Constitution V, T016). Used by business-logic
 * modules that run outside a Payload request (retention job, email, API route)
 * where `req.payload.logger` is not in scope. JSON in production; pretty in dev.
 */
const isProd = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: { service: 'wrenfield-works' },
  // Never log secrets or full personal data.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.email'],
    censor: '[redacted]',
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        },
      }),
})

/** Child logger bound to a named subsystem (e.g., 'inquiry', 'retention'). */
export const childLogger = (component: string) => logger.child({ component })
