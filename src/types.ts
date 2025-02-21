import { IDatabaseAdapter, ModelProviderName, ICacheManager } from '@elizaos/core';

export interface DatabaseSettings {
  provider: string;
  tables: {
    accounts: string;
    rooms: string;
    participants: string;
    memories: string;
    relationships: string;
    goals: string;
    cache: string;
    knowledge: string;
    [key: string]: string;
  };
}

export interface CharacterSettings {
  database?: DatabaseSettings;
  secrets?: { [key: string]: string };
  intiface?: boolean;
  imageSettings?: {
    steps?: number;
    width?: number;
    height?: number;
    safeMode?: boolean;
  };
  ragKnowledge?: boolean;
}

export interface Character {
  name: string;
  plugins?: string[];
  clients?: string[];
  modelProvider?: ModelProviderName;
  settings?: CharacterSettings;
  bio?: string[];
  lore?: string[];
  messageExamples?: Array<Array<{
    user: string;
    content: { text: string };
  }>>;
  style?: {
    all?: string[];
    chat?: string[];
    post?: string[];
  };
  postExamples?: Array<{
    content: string;
    response: string;
  }>;
  topics?: string[];
  adjectives?: string[];
}

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