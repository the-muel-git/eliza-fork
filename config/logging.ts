import { createLogger, format, transports } from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const productionFormat = format.combine(
  format.timestamp(),
  format.json(),
  format.errors({ stack: true }),
  format.metadata()
);

const developmentFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ timestamp, level, message, metadata }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}`;
  })
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      // Add production-specific transports
      new LoggingWinston({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        logName: 'eliza-production',
        labels: {
          service: 'eliza-worker',
          environment: 'production'
        },
      }),
    ] : []),
  ],
});

// Create specialized loggers for different components
export const databaseLogger = logger.child({ component: 'database' });
export const memoryLogger = logger.child({ component: 'memory' });
export const clientLogger = logger.child({ component: 'client' });
export const agentLogger = logger.child({ component: 'agent' });

// Add custom logging methods
export const elizaLogger = {
  ...logger,
  success: (message: string, metadata = {}) => {
    logger.info(`✅ ${message}`, metadata);
  },
  warning: (message: string, metadata = {}) => {
    logger.warn(`⚠️ ${message}`, metadata);
  },
  error: (message: string, error?: Error, metadata = {}) => {
    logger.error(`❌ ${message}`, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
    });
  },
  debug: (message: string, metadata = {}) => {
    logger.debug(`🔍 ${message}`, metadata);
  },
  // Add performance monitoring
  performance: (operation: string, durationMs: number, metadata = {}) => {
    logger.info(`⚡ Performance: ${operation}`, {
      ...metadata,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  },
  // Add security monitoring
  security: (event: string, metadata = {}) => {
    logger.warn(`🔒 Security: ${event}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  },
  // Add health check monitoring
  health: (status: 'healthy' | 'degraded' | 'unhealthy', metadata = {}) => {
    logger.info(`💓 Health Check: ${status}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }
}; 