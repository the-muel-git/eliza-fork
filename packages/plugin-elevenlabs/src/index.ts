import { Plugin } from '@elizaos/core';
import axios from 'axios';

export interface ElevenLabsConfig {
  apiKey: string;
}

export class ElevenLabsPlugin implements Plugin {
  name = 'elevenlabs';
  description = 'ElevenLabs text-to-speech plugin for ElizaOS';
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
  }

  async init(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
  }

  async textToSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        { text },
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to convert text to speech: ${error.message}`);
    }
  }
}

export default ElevenLabsPlugin; 