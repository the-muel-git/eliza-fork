FROM node:18-alpine AS builder

# Install minimal build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm@8.6.12

# Set memory optimization flags for build
ENV NODE_OPTIONS="--max-old-space-size=256"
ENV PNPM_FLAGS="--prod --no-frozen-lockfile --shamefully-hoist"

WORKDIR /app

# Copy only necessary files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/client-discord/package.json ./packages/client-discord/

# Install only production dependencies
RUN pnpm install $PNPM_FLAGS \
    --filter=@elizaos/core \
    --filter=@elizaos/client-discord

# Copy source files for required packages only
COPY packages/core/src ./packages/core/src
COPY packages/core/types ./packages/core/types
COPY packages/client-discord/src ./packages/client-discord/src
COPY tsconfig.json ./

# Build packages sequentially
RUN pnpm build --filter=@elizaos/core && \
    pnpm build --filter=@elizaos/client-discord

# Start fresh for runtime
FROM node:18-alpine

WORKDIR /app

# Copy only what's needed for runtime
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/client-discord/package.json ./packages/client-discord/
COPY --from=builder /app/packages/client-discord/dist ./packages/client-discord/dist

# Install runtime dependencies only
RUN npm install -g pnpm@8.6.12 && \
    pnpm install --prod --no-frozen-lockfile

# Set runtime memory limit
ENV NODE_OPTIONS="--max-old-space-size=256"

# Start the application
CMD ["pnpm", "start"]
