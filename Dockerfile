# ─────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Capture git SHA at build time for the /health endpoint
ARG GIT_COMMIT_SHA=unknown
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Install Chromium for Puppeteer PDF invoice generation
# Using system Chromium instead of the bundled one avoids the 300 MB download
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      font-noto \
      font-noto-emoji

# Tell Puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy migrations to match compiled path (__dirname = dist/database in the JS output)
COPY src/database/migrations ./dist/database/migrations

# Write the git SHA as dist/VERSION so the /health endpoint can report it
RUN echo "${GIT_COMMIT_SHA}" > dist/VERSION

# Create directories and set ownership before switching user
RUN mkdir -p uploads/exports uploads/invoices logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check — start-period gives migrations time to run
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
