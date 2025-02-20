import { elizaLogger } from '../config/logging';
import { AgentRuntime } from '@elizaos/core';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage: number;
      limit: number;
    };
    clients: {
      discord?: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        error?: string;
      };
      telegram?: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        error?: string;
      };
    };
  };
  timestamp: string;
}

export async function performHealthCheck(runtime: AgentRuntime): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    components: {
      database: {
        status: 'healthy'
      },
      memory: {
        status: 'healthy',
        usage: 0,
        limit: runtime.settings.memory.limit
      },
      clients: {}
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connection
    const startTime = Date.now();
    await runtime.databaseAdapter.testConnection();
    result.components.database.latencyMs = Date.now() - startTime;
  } catch (error) {
    result.components.database.status = 'unhealthy';
    result.components.database.error = error.message;
    result.status = 'degraded';
  }

  // Check memory usage
  try {
    const memoryUsage = await runtime.memoryManager.getMemoryCount();
    result.components.memory.usage = memoryUsage;
    if (memoryUsage > runtime.settings.memory.limit * 0.9) {
      result.components.memory.status = 'degraded';
      result.status = 'degraded';
    }
  } catch (error) {
    result.components.memory.status = 'unhealthy';
    result.status = 'degraded';
  }

  // Check Discord client if enabled
  if (runtime.settings.clients.includes('discord')) {
    try {
      const discordClient = runtime.getClient('discord');
      if (discordClient && discordClient.isConnected()) {
        result.components.clients.discord = { status: 'healthy' };
      } else {
        result.components.clients.discord = {
          status: 'degraded',
          error: 'Client disconnected'
        };
        result.status = 'degraded';
      }
    } catch (error) {
      result.components.clients.discord = {
        status: 'unhealthy',
        error: error.message
      };
      result.status = 'degraded';
    }
  }

  // Check Telegram client if enabled
  if (runtime.settings.clients.includes('telegram')) {
    try {
      const telegramClient = runtime.getClient('telegram');
      if (telegramClient && telegramClient.isConnected()) {
        result.components.clients.telegram = { status: 'healthy' };
      } else {
        result.components.clients.telegram = {
          status: 'degraded',
          error: 'Client disconnected'
        };
        result.status = 'degraded';
      }
    } catch (error) {
      result.components.clients.telegram = {
        status: 'unhealthy',
        error: error.message
      };
      result.status = 'degraded';
    }
  }

  // Log health check result
  elizaLogger.health(result.status, {
    components: result.components,
    timestamp: result.timestamp
  });

  return result;
}

// Schedule regular health checks
export function startHealthChecks(runtime: AgentRuntime, intervalMs = 60000) {
  return setInterval(async () => {
    try {
      await performHealthCheck(runtime);
    } catch (error) {
      elizaLogger.error('Failed to perform health check', error);
    }
  }, intervalMs);
} 