FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.6.12

# Set memory limits for build and runtime
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV PNPM_FLAGS="--no-frozen-lockfile --shamefully-hoist"

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/adapter-redis/package.json ./packages/adapter-redis/
COPY packages/client-discord/package.json ./packages/client-discord/
COPY packages/client-telegram/package.json ./packages/client-telegram/

# Install dependencies with optimized settings
RUN pnpm install $PNPM_FLAGS

# Copy source files
COPY . .

# Build packages
RUN pnpm run build

# Start the application
CMD ["pnpm", "start"]
