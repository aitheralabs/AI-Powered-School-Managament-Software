# =============================================================================
# School Management System — Developer Makefile
# Usage: make <target>        (requires GNU make and Docker Compose v2)
# =============================================================================

.PHONY: help up down restart build build-api build-frontend \
        logs logs-api logs-nginx \
        migrate migrate-dev seed seed-dev \
        shell-api shell-db shell-nginx \
        test test-e2e test-e2e-ui \
        ssl-cert prod-up prod-down prod-logs clean clean-cache

# ── Help ─────────────────────────────────────────────────────────────────────
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Development ──────────────────────────────────────────────────────────────
up: ## Start all services (builds images if needed)
	docker compose up -d
	@echo "✅  Services started"
	@echo "    Frontend : http://localhost"
	@echo "    API      : http://localhost/api/v1"
	@echo "    Health   : http://localhost/health"

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

build: ## Rebuild all Docker images (no cache)
	docker compose build --no-cache

build-api: ## Rebuild only the backend API image
	docker compose build --no-cache api

build-frontend: ## Rebuild only the nginx + Angular image
	docker compose build --no-cache nginx

logs: ## Tail logs from all services
	docker compose logs -f --tail=100

logs-api: ## Tail API logs only
	docker compose logs -f --tail=100 api

logs-nginx: ## Tail nginx logs only
	docker compose logs -f --tail=100 nginx

# ── Database ─────────────────────────────────────────────────────────────────
migrate: ## Run database migrations inside running API container
	docker compose exec api node dist/database/migrate.js

migrate-dev: ## Run database migrations locally with ts-node (dev only)
	npx ts-node src/database/migrate.ts

seed: ## Seed super-admin user (production container)
	docker compose exec api node dist/seed-superadmin.js

seed-dev: ## Seed super-admin user locally (dev only)
	npx ts-node src/seed-superadmin.ts

shell-db: ## Open a psql shell inside the database container
	docker compose exec postgres psql -U $${DB_USER:-school_admin} -d $${DB_NAME:-school_management}

# ── Shells ───────────────────────────────────────────────────────────────────
shell-api: ## Open a shell inside the API container
	docker compose exec api sh

shell-nginx: ## Open a shell inside the nginx container
	docker compose exec nginx sh

# ── Testing ──────────────────────────────────────────────────────────────────
test: ## Run backend unit tests
	npm test

test-e2e: ## Run Playwright E2E tests (headless)
	npm run e2e

test-e2e-ui: ## Run Playwright E2E tests with browser UI
	npm run e2e:ui

# ── SSL ──────────────────────────────────────────────────────────────────────
ssl-cert: ## Generate self-signed SSL cert for local HTTPS testing
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	  -keyout nginx/ssl/server.key \
	  -out    nginx/ssl/server.crt \
	  -subj "/C=IN/ST=Dev/L=Dev/O=SchoolMgmt/CN=localhost"
	@echo "✅  Self-signed cert created in nginx/ssl/"
	@echo "    Mount into the nginx container:"
	@echo "      volumes:"
	@echo "        - ./nginx/ssl:/etc/nginx/ssl:ro"

# ── Production ───────────────────────────────────────────────────────────────
prod-up: ## Build and start all services in production mode
	docker compose up -d --build

prod-down: ## Stop production services
	docker compose down

prod-logs: ## Tail production logs (last 200 lines)
	docker compose logs -f --tail=200

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean: ## Remove containers, networks, and ALL volumes — DESTRUCTIVE
	@echo "⚠️  This will delete all volumes including the database. Ctrl+C to cancel."
	@sleep 3
	docker compose down -v --remove-orphans

clean-cache: ## Prune Docker build cache
	docker builder prune -f
