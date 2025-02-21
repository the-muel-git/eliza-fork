import { AgentRuntime, IDatabaseAdapter, ModelProviderName, ICacheManager } from '@elizaos/core';
import { Character } from './types';
import { SupabaseDatabaseAdapter } from '@elizaos/adapter-supabase';
import { elizaLogger } from '../config/logging';
import { startHealthChecks } from './health';
import fs from 'fs';
import path from 'path';

async function logMemoryUsage(stage: string) {
  const used = process.memoryUsage();
  elizaLogger.debug(`Memory usage at ${stage}:`, {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
  });
}

async function main() {
  const startTime = Date.now();
  elizaLogger.info('Starting Eliza initialization...', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV
  });

  await logMemoryUsage('startup');

  try {
    // Load character configuration
    elizaLogger.debug('Loading character configuration...');
    const characterFile = process.env.CHARACTER_FILE || 'characters/production.character.json';
    const characterPath = path.resolve(process.cwd(), characterFile);
    
    if (!fs.existsSync(characterPath)) {
      throw new Error(`Character file not found: ${characterPath}`);
    }

    const character: Character = JSON.parse(fs.readFileSync(characterPath, 'utf-8'));
    elizaLogger.success(`Loaded character configuration: ${character.name}`, {
      plugins: character.plugins,
      clients: character.clients,
      modelProvider: character.modelProvider,
      databaseConfig: character.settings?.database || 'default'
    });

    await logMemoryUsage('after character load');

    // Initialize database connection
    elizaLogger.debug('Initializing database connection...', {
      url: process.env.SUPABASE_URL?.substring(0, 8) + '***',
      tables: character.settings?.database?.tables || 'default schema'
    });

    const db: IDatabaseAdapter = new SupabaseDatabaseAdapter(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Test database connection
    if ('testConnection' in db) {
      const dbStartTime = Date.now();
      await (db as any).testConnection();
      const dbConnectTime = Date.now() - dbStartTime;
      elizaLogger.success('Successfully connected to Supabase database', {
        connectionTimeMs: dbConnectTime
      });
    }

    await logMemoryUsage('after database init');

    // Initialize cache manager
    elizaLogger.debug('Initializing cache manager...');
    const cacheManager: ICacheManager = {
      get: async <T>(_key: string): Promise<T | undefined> => undefined,
      set: async <T>(_key: string, _value: T): Promise<void> => {},
      delete: async (_key: string): Promise<void> => {}
    };
    elizaLogger.success('Cache manager initialized');

    // Create agent runtime
    elizaLogger.debug('Creating agent runtime...', {
      modelProvider: character.modelProvider || ModelProviderName.OPENAI,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    const runtime = new AgentRuntime({
      character,
      databaseAdapter: db,
      token: process.env.OPENAI_API_KEY!,
      modelProvider: character.modelProvider || ModelProviderName.OPENAI,
      cacheManager
    });

    await runtime.initialize();
    elizaLogger.success(`Created agent runtime for ${character.name}`);

    await logMemoryUsage('after runtime init');

    // Start health checks
    const healthCheckInterval = process.env.HEALTH_CHECK_INTERVAL 
      ? parseInt(process.env.HEALTH_CHECK_INTERVAL, 10)
      : 60000; // Default: 1 minute
    
    startHealthChecks(runtime, healthCheckInterval);
    elizaLogger.info(`Started health checks with interval: ${healthCheckInterval}ms`);

    // Handle shutdown
    process.on('SIGTERM', async () => {
      elizaLogger.info('Received SIGTERM signal, initiating graceful shutdown...');
      try {
        await runtime.initialize();
        elizaLogger.success('Successfully shut down agent runtime');
        process.exit(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error : new Error(String(error));
        elizaLogger.error('Error during shutdown:', errorMessage);
        process.exit(1);
      }
    });

    // Log startup success with timing
    const totalStartupTime = Date.now() - startTime;
    elizaLogger.success(`${character.name} is now running!`, {
      startupTimeMs: totalStartupTime,
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      healthCheckInterval
    });

    await logMemoryUsage('final');
  } catch (error) {
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    elizaLogger.error('Failed to start agent:', errorMessage, {
      stack: errorMessage.stack,
      startupDurationMs: Date.now() - startTime
    });
    process.exit(1);
  }
}

main(); 