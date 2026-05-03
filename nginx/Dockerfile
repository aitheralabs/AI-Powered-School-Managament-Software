# =============================================================================
# Nginx image: builds the Angular SPA and serves it alongside the API proxy
# Build context must be the project ROOT (not the nginx/ subdirectory):
#   docker build -f nginx/Dockerfile -t school-nginx .
# =============================================================================

# ── Stage 1: Build Angular application ───────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Install deps with layer caching
COPY school-management-frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build production bundle
COPY school-management-frontend/ ./
RUN npm run build -- --configuration=production

# ── Stage 2: Production nginx image ──────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built Angular SPA (browser bundle output path for Angular 19)
COPY --from=frontend-builder /frontend/dist/school-management-frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf        /etc/nginx/nginx.conf
COPY nginx/conf.d/school.conf /etc/nginx/conf.d/school.conf

# Create SSL directory (certs are volume-mounted at runtime)
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
