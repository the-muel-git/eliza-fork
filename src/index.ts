import { AgentRuntime, Character, IDatabaseAdapter, ModelProviderName, ICacheManager } from '@elizaos/core';
import { SupabaseDatabaseAdapter } from '@elizaos/adapter-supabase';
import { elizaLogger } from '../config/logging';
import { startHealthChecks } from './health';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Load character configuration
    const characterFile = process.env.CHARACTER_FILE || 'characters/production.character.json';
    const characterPath = path.resolve(process.cwd(), characterFile);
    
    if (!fs.existsSync(characterPath)) {
      throw new Error(`Character file not found: ${characterPath}`);
    }

    const character: Character = JSON.parse(fs.readFileSync(characterPath, 'utf-8'));
    elizaLogger.info(`Loaded character configuration: ${character.name}`);

    // Initialize database connection
    const db: IDatabaseAdapter = new SupabaseDatabaseAdapter(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Test database connection
    if ('testConnection' in db) {
      await (db as any).testConnection();
      elizaLogger.success('Successfully connected to Supabase database');
    }

    // Initialize cache manager
    const cacheManager: ICacheManager = {
      get: async <T>(key: string): Promise<T | undefined> => undefined,
      set: async <T>(key: string, value: T): Promise<void> => {},
      delete: async (key: string): Promise<void> => {}
    };

    // Create agent runtime
    const runtime = new AgentRuntime({
      character,
      databaseAdapter: db,
      token: process.env.OPENAI_API_KEY!,
      modelProvider: character.modelProvider || ModelProviderName.OPENAI,
      cacheManager
    });

    await runtime.initialize();
    elizaLogger.success(`Created agent runtime for ${character.name}`);

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

    // Log startup success
    elizaLogger.success(`${character.name} is now running!`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    elizaLogger.error('Failed to start agent:', errorMessage);
    process.exit(1);
  }
}

main(); 