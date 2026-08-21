# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# ---- Dependencies (for building native addons) ----
FROM base AS deps
# Install build tools needed for native modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter=api...

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/ ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
# Build shared package and API
RUN pnpm --filter=@metaverse/shared build \
  && pnpm --filter=api build

# ---- Runtime ----
# FIX: Changed from 'node:24-alpine' to 'base' so pnpm is available
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
# Copy only production dependencies and built assets
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
# Install production dependencies (no build tools needed)
RUN pnpm install --frozen-lockfile --filter=api... --prod

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/server.js"]
