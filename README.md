# SamBot - Discord Bot

This is a private repository for my personal Discord bot, based on the [Eliza](https://github.com/elizaos/eliza) project.

## Repository Structure

This repository is part of a two-repository setup:
1. **Public Fork** ([eliza-fork](https://github.com/the-muel-git/eliza-fork)): Used to track and pull updates from the upstream Eliza project
2. **Private Repository** (this repo): Contains my personal bot configuration and customizations

## Development Workflow

### Initial Setup
```bash
# Clone this repository
git clone https://github.com/the-muel-git/SamBot.git
cd SamBot

# Set up remotes
git remote add origin https://github.com/the-muel-git/SamBot.git
git remote add upstream-fork https://github.com/the-muel-git/eliza-fork.git
git remote add upstream https://github.com/elizaos/eliza.git
```

### Regular Development
```bash
# For new features/changes
git add .
git commit -m "Your commit message"
git push origin main  # Push to this private repo

# To get updates from upstream Eliza
git fetch upstream
git merge upstream/main
git push origin main  # Update private repo
git push upstream-fork main  # Update public fork
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure the following essential variables:
```env
# Discord Configuration
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_API_TOKEN=your_bot_token_here
DISCORD_VOICE_CHANNEL_ID=optional_voice_channel_id_here

# OpenAI Configuration (Required for language model functionality)
OPENAI_API_KEY=your_openai_api_key_here
```

## Deployment

This bot is deployed on Render.com with automatic deployments configured:
- Every push to the `main` branch triggers a new deployment
- Environment variables are configured in the Render dashboard
- The service runs in a Docker container

### Deployment Configuration
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Auto-Deploy**: Enabled for `main` branch

## Features

- Full Discord integration including voice, reactions, and attachments
- Natural language processing using OpenAI's GPT models
- Voice channel support (optional)
- Message attachments handling
- Reaction handling
- Media transcription capabilities

## Maintenance

### Regular Tasks
1. Check for upstream updates regularly
2. Review and update dependencies
3. Monitor bot performance and logs in Render dashboard
4. Backup environment variables and configuration

### Troubleshooting
- Check Render logs for deployment issues
- Verify Discord bot token and permissions
- Ensure all required environment variables are set
- Monitor API rate limits and usage
