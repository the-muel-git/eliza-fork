import { IDatabaseAdapter, Character, ModelProviderName, ICacheManager } from '@elizaos/core';

export interface ICache {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface AgentRuntimeConfig {
  character?: Character;
  databaseAdapter: IDatabaseAdapter;
  token: string;
  modelProvider: ModelProviderName;
  cacheManager: ICacheManager;
  serverUrl?: string;
  conversationLength?: number;
  agentId?: string;
}

export interface IAgentRuntime {
  character: Character;
  databaseAdapter: IDatabaseAdapter;
  token: string;
  modelProvider: ModelProviderName;
  cacheManager: ICacheManager;
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
} 