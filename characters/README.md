# Eliza Character System

This directory contains character files that define the personality and behavior of the Eliza agent.

## Directory Structure

```
characters/
├── eternalai.character.json    # Default character (TrollDetective.Exe)
├── examples/                   # Example character implementations
│   ├── c3po.character.json    # Star Wars C3PO example
│   ├── dobby.character.json   # Harry Potter Dobby example
│   └── ...                    # Other example characters
└── private/                   # Your private characters (gitignored)
```

## Default Character

The default character is `eternalai.character.json`, which implements the original TrollDetective.Exe persona.

## Using Characters

You can start Eliza with a specific character file using:

```bash
pnpm start --character="characters/eternalai.character.json"
```

## Character File Structure

Character files should be JSON files with the following structure:

### Required Fields
- `name`: The character's name
- `plugins`: Array of plugins the character can use
- `clients`: Array of supported client types (discord, telegram, etc)
- `modelProvider`: The AI model provider to use

### Settings Object
```json
{
  "settings": {
    "voice": {
      "provider": "elevenlabs",
      "voiceId": "voice-id-here"
    },
    "model": "gpt-4",
    "embeddingModel": "text-embedding-3-small",
    "database": {
      "provider": "supabase",
      "tables": {
        "memories": "memories",
        "relationships": "relationships",
        // ... other tables
      }
    }
  }
}
```

### Personality Definition
- `bio`: Array of character background descriptions
- `lore`: Array of character backstory elements
- `messageExamples`: Array of example conversations
- `style`: Object defining communication style
  ```json
  {
    "all": ["Witty", "Professional"],
    "chat": ["Engaging", "Supportive"],
    "post": ["Informative", "Concise"]
  }
  ```

## Adding New Characters

1. Create a new JSON file in this directory
2. Follow the structure of `eternalai.character.json`
3. Make sure to include all required fields
4. Test your character using the command line parameter

## Private Characters

Private character files should:
- Use the `.private.json` extension
- Be stored in the `private/` directory
- Not be committed to the repository (automatically gitignored)

## Remote Characters

You can load characters from remote URLs by setting the `REMOTE_CHARACTER_URLS` environment variable with comma-separated URLs.

## Character Features

### Voice Configuration
Characters can specify voice settings for speech synthesis:
```json
"voice": {
  "provider": "elevenlabs",
  "voiceId": "voice-id",
  "stability": 0.5,
  "similarityBoost": 0.8
}
```

### Database Integration
Characters can specify their database preferences:
```json
"database": {
  "provider": "supabase",
  "tables": {
    "memories": "memories",
    "relationships": "relationships"
  }
}
```

### Client-Specific Behavior
Define different behaviors for different platforms:
```json
"discord": {
  "messageHandlerTemplate": "...",
  "presence": {
    "status": "online",
    "activities": [{"type": "PLAYING", "name": "with humans"}]
  }
},
"telegram": {
  "messageHandlerTemplate": "..."
}
``` 