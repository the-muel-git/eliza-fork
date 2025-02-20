import { createAgent, Character } from '@elizaos/core';
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
    const db = new SupabaseDatabaseAdapter(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Test database connection
    await db.testConnection();
    elizaLogger.success('Successfully connected to Supabase database');

    // Initialize cache
    const cache = {
      get: async (key: string) => null,
      set: async (key: string, value: any) => {},
      delete: async (key: string) => {},
    };

    // Create agent runtime
    const runtime = await createAgent(character, db, cache, process.env.OPENAI_API_KEY!);
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
        await runtime.shutdown();
        elizaLogger.success('Successfully shut down agent runtime');
        process.exit(0);
      } catch (error) {
        elizaLogger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Log startup success
    elizaLogger.success(`${character.name} is now running!`);
  } catch (error) {
    elizaLogger.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main(); 