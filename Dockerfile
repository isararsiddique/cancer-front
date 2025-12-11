# Dockerfile — Next.js (standalone) production build with JupyterLite, serves on port 3000
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Production API URL - AWS EC2 instance
ARG NEXT_PUBLIC_API_URL=http://98.92.253.206:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# --- Dependencies install stage ---
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 py3-pip
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# --- JupyterLite build stage ---
FROM python:3.11-alpine AS jupyter-builder
WORKDIR /jupyter

# Install JupyterLite and dependencies
RUN apk add --no-cache gcc musl-dev libffi-dev
RUN pip install --no-cache-dir jupyterlite[all]==0.4.0

# Copy JupyterLite configuration
COPY public/static/jupyterlite/jupyter-lite.json ./jupyter-lite.json

# Build JupyterLite
RUN jupyter lite build --config jupyter-lite.json --output-dir lite-build

# --- Build stage ---
FROM base AS builder
WORKDIR /app

# Install Python for JupyterLite build
RUN apk add --no-cache python3 py3-pip gcc musl-dev libffi-dev
RUN pip3 install --no-cache-dir jupyterlite[all]==0.4.0

# Ensure the build stage also has the env var available for Next to inline
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy pre-built JupyterLite from jupyter-builder stage
COPY --from=jupyter-builder /jupyter/lite-build ./public/static/jupyterlite/lite-build

ENV NODE_ENV=production

# Build JupyterLite first, then Next.js
RUN npm run build:jupyter || echo "JupyterLite build completed or skipped"
RUN npm run build

# --- Runner (production) ---
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built standalone app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
