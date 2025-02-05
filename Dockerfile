FROM node:18-alpine AS builder

# Install minimal build dependencies
RUN apk add --no-cache python3 make g++ git

# Install pnpm
RUN npm install -g pnpm@8.6.12

# Set memory optimization flags for build
ENV NODE_OPTIONS="--max-old-space-size=256"
ENV PNPM_FLAGS="--prod --no-frozen-lockfile --shamefully-hoist"

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy all package.json files
COPY packages/core/package.json ./packages/core/
COPY packages/client-discord/package.json ./packages/client-discord/
COPY packages/plugin-node/package.json ./packages/plugin-node/
COPY packages/adapter-supabase/package.json ./packages/adapter-supabase/
COPY packages/client-telegram/package.json ./packages/client-telegram/
COPY agent/package.json ./agent/

# Copy character and agent configurations
COPY characters ./characters
COPY agent/tsconfig.json ./agent/
COPY agent/jest.config.js ./agent/

# Create necessary directories
RUN mkdir -p agent/data agent/content_cache

# Install dependencies for all packages
RUN pnpm install $PNPM_FLAGS \
    --filter=@elizaos/core \
    --filter=@elizaos/plugin-node \
    --filter=@elizaos/client-discord \
    --filter=@elizaos/client-telegram \
    --filter=@elizaos/adapter-supabase \
    --filter=@elizaos/agent

# Copy source files
COPY packages/core/src ./packages/core/src
COPY packages/core/types ./packages/core/types
COPY packages/client-discord/src ./packages/client-discord/src
COPY packages/plugin-node/src ./packages/plugin-node/src
COPY packages/adapter-supabase/src ./packages/adapter-supabase/src
COPY packages/client-telegram/src ./packages/client-telegram/src
COPY agent/src ./agent/src

# Build packages in correct order
RUN pnpm build --filter=@elizaos/core && \
    pnpm build --filter=@elizaos/plugin-node && \
    pnpm build --filter=@elizaos/adapter-supabase && \
    pnpm build --filter=@elizaos/client-discord && \
    pnpm build --filter=@elizaos/client-telegram && \
    pnpm build --filter=@elizaos/agent

# Start fresh for runtime
FROM node:18-alpine

WORKDIR /app

# Copy workspace configuration
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./

# Copy character and agent configurations
COPY --from=builder /app/characters ./characters
COPY --from=builder /app/agent/tsconfig.json ./agent/
COPY --from=builder /app/agent/jest.config.js ./agent/

# Create and set permissions for data directories
RUN mkdir -p agent/data agent/content_cache && \
    chmod -R 777 agent/data agent/content_cache

# Copy all built packages
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/plugin-node/package.json ./packages/plugin-node/
COPY --from=builder /app/packages/plugin-node/dist ./packages/plugin-node/dist
COPY --from=builder /app/packages/client-discord/package.json ./packages/client-discord/
COPY --from=builder /app/packages/client-discord/dist ./packages/client-discord/dist
COPY --from=builder /app/packages/adapter-supabase/package.json ./packages/adapter-supabase/
COPY --from=builder /app/packages/adapter-supabase/dist ./packages/adapter-supabase/dist
COPY --from=builder /app/packages/client-telegram/package.json ./packages/client-telegram/
COPY --from=builder /app/packages/client-telegram/dist ./packages/client-telegram/dist
COPY --from=builder /app/agent/package.json ./agent/
COPY --from=builder /app/agent/dist ./agent/dist

# Install runtime dependencies only
RUN apk add --no-cache git && \
    npm install -g pnpm@8.6.12 && \
    pnpm install --prod --no-frozen-lockfile

# Set runtime memory limit and configuration
ENV NODE_OPTIONS="--max-old-space-size=256"
ENV CHARACTER_FILE="eternalai.character.json"
ENV MODEL_PROVIDER="openai"
ENV TOKENIZER_MODEL="gpt-4"
ENV TOKENIZER_TYPE="tiktoken"
ENV ENABLED_CLIENTS="discord"

# Start the application
CMD ["pnpm", "--filter=@elizaos/agent", "start", "--isRoot"]
