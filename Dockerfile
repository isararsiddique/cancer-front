# Dockerfile — Next.js (standalone) production build, serves on port 3000

# --- Base image ---
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- Dependencies install stage ---
FROM base AS deps
# glibc compat for some native deps (optional but useful)
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# install exact deps
RUN npm ci --production=false

# --- Build stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# Build Next.js (produces .next/standalone when next.config.js output:'standalone')
RUN npm run build

# --- Runner (production) ---
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# copy public and standalone app files
# `.next/standalone` contains server.js + package.json for runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
# static assets
COPY --from=builder /app/.next/static ./.next/static

# chown to non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# run the built Next.js standalone server
CMD ["node", "server.js"]
