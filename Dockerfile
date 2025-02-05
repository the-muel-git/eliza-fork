FROM node:18-alpine

# Install required build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm@8.6.12

# Set memory limit for build and runtime
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml turbo.json ./

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/adapter-redis/package.json ./packages/adapter-redis/
COPY packages/client-discord/package.json ./packages/client-discord/
COPY packages/client-telegram/package.json ./packages/client-telegram/

# Install dependencies with optimized flags
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

# Copy source files
COPY . .

# Build only required packages
RUN pnpm build --filter=@elizaos/core --filter=@elizaos/client-discord --filter=@elizaos/adapter-redis

# Start the application
CMD ["pnpm", "start"]
