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
        limit: 1000 // Default limit
      }
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connection
    const startTime = Date.now();
    if ('testConnection' in runtime.databaseAdapter) {
      await (runtime.databaseAdapter as any).testConnection();
      result.components.database.latencyMs = Date.now() - startTime;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.components.database.status = 'unhealthy';
    result.components.database.error = errorMessage;
    result.status = 'degraded';
  }

  // Check memory usage
  try {
    const memoryUsage = process.memoryUsage().heapUsed;
    const memoryLimit = process.memoryUsage().heapTotal;
    result.components.memory.usage = memoryUsage;
    result.components.memory.limit = memoryLimit;
    if (memoryUsage > memoryLimit * 0.9) {
      result.components.memory.status = 'degraded';
      result.status = 'degraded';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.components.memory.status = 'unhealthy';
    result.status = 'degraded';
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
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      elizaLogger.error('Failed to perform health check', errorMessage);
    }
  }, intervalMs);
} 