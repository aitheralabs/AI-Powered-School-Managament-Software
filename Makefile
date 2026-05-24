# =============================================================================
# School Management System — Developer Makefile
# Usage: make <target>        (requires GNU make and Docker Compose v2)
# =============================================================================

.PHONY: help \
        dev-up dev-down dev-logs dev-restart setup-dev \
        staging-up staging-down staging-logs \
        up down restart build build-api build-frontend \
        logs logs-api logs-nginx logs-worker \
        migrate migrate-dev seed seed-dev seed-demo seed-demo-dev \
        shell-api shell-db shell-nginx shell-mailhog \
        test test-coverage test-e2e test-e2e-ui \
        ssl-cert \
        prod-up prod-down prod-logs prod-restart \
        clean clean-cache clean-volumes \
        audit typecheck lint

# Colours for output
CYAN  := \033[36m
RESET := \033[0m

# ── Help ─────────────────────────────────────────────────────────────────────
help: ## Show available targets
	@echo ""
	@echo "  $(CYAN)Development$(RESET)"
	@grep -E '^dev-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(CYAN)Staging$(RESET)"
	@grep -E '^staging-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(CYAN)Production$(RESET)"
	@grep -E '^(prod-|up|down)[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(CYAN)Database$(RESET)"
	@grep -E '^(migrate|seed)[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(CYAN)Testing$(RESET)"
	@grep -E '^test[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(CYAN)Quality$(RESET)"
	@grep -E '^(audit|typecheck|lint)[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ── Development ──────────────────────────────────────────────────────────────
dev-up: ## Start all services in DEV mode (hot reload, MailHog, exposed ports)
	docker compose \
	  -f docker-compose.yml \
	  -f docker-compose.dev.yml \
	  up -d
	@echo ""
	@echo "  API (hot-reload) : http://localhost:3000"
	@echo "  Health           : http://localhost:3000/health"
	@echo "  MailHog (SMTP UI): http://localhost:8025"
	@echo "  PostgreSQL       : localhost:5432"
	@echo "  Redis            : localhost:6379"
	@echo ""

dev-down: ## Stop all DEV services
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs: ## Tail DEV logs (all services)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f --tail=100

dev-restart: ## Restart only the API container (keep DB/Redis running)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml restart api

# ── Staging ──────────────────────────────────────────────────────────────────
staging-up: ## Build and start STAGING services (.env.staging required)
	@test -f .env.staging || (echo "❌ .env.staging not found. Copy .env.staging.example and fill in values." && exit 1)
	docker compose \
	  -f docker-compose.yml \
	  -f docker-compose.staging.yml \
	  --env-file .env.staging \
	  up -d --build

staging-down: ## Stop STAGING services
	docker compose \
	  -f docker-compose.yml \
	  -f docker-compose.staging.yml \
	  --env-file .env.staging \
	  down

staging-logs: ## Tail STAGING logs
	docker compose \
	  -f docker-compose.yml \
	  -f docker-compose.staging.yml \
	  --env-file .env.staging \
	  logs -f --tail=200

# ── Production ───────────────────────────────────────────────────────────────
up: ## Start all services in PRODUCTION mode
	docker compose up -d
	@echo "✅  Services started"
	@echo "    Frontend : https://localhost"
	@echo "    API      : https://localhost/api/v1"
	@echo "    Health   : https://localhost/health"

down: ## Stop all PRODUCTION services
	docker compose down

restart: ## Restart all PRODUCTION services
	docker compose restart

prod-up: ## Build and start all PRODUCTION services (no cache)
	docker compose up -d --build

prod-down: ## Stop production services and remove containers
	docker compose down

prod-restart: ## Zero-downtime API restart (pull + up --no-deps)
	docker compose pull api worker
	docker compose up -d --no-deps api worker

prod-logs: ## Tail production logs (last 200 lines)
	docker compose logs -f --tail=200

# ── Building ─────────────────────────────────────────────────────────────────
build: ## Rebuild all Docker images (no cache)
	docker compose build --no-cache

build-api: ## Rebuild only the backend API image
	docker compose build --no-cache api

build-frontend: ## Rebuild only the nginx + Angular image
	docker compose build --no-cache nginx

# ── Logs ─────────────────────────────────────────────────────────────────────
logs: ## Tail logs from all services
	docker compose logs -f --tail=100

logs-api: ## Tail API logs only
	docker compose logs -f --tail=100 api

logs-nginx: ## Tail nginx logs only
	docker compose logs -f --tail=100 nginx

logs-worker: ## Tail background worker logs
	docker compose logs -f --tail=100 worker

# ── Database ─────────────────────────────────────────────────────────────────
migrate: ## Run database migrations inside running API container (production)
	docker compose exec api node dist/database/migrate.js

migrate-dev: ## Run database migrations locally with ts-node (dev)
	npx ts-node -r tsconfig-paths/register src/database/migrate.ts

migrate-staging: ## Run database migrations on staging
	docker compose -f docker-compose.yml -f docker-compose.staging.yml \
	  --env-file .env.staging exec api node dist/database/migrate.js

seed: ## Seed super-admin user (requires SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD env vars)
	@test -n "$$SUPER_ADMIN_EMAIL"    || (echo "❌ SUPER_ADMIN_EMAIL not set"    && exit 1)
	@test -n "$$SUPER_ADMIN_PASSWORD" || (echo "❌ SUPER_ADMIN_PASSWORD not set" && exit 1)
	docker compose exec api node dist/seed-superadmin.js

seed-dev: ## Seed super-admin user locally (requires env vars)
	@test -n "$$SUPER_ADMIN_EMAIL"    || (echo "❌ SUPER_ADMIN_EMAIL not set"    && exit 1)
	@test -n "$$SUPER_ADMIN_PASSWORD" || (echo "❌ SUPER_ADMIN_PASSWORD not set" && exit 1)
	npx ts-node -r tsconfig-paths/register src/seed-superadmin.ts

seed-demo: ## Seed demo data (school, teachers, students) inside running API container
	docker compose exec api node dist/seed-demo-data.js

seed-demo-dev: ## Seed demo data locally with ts-node
	npx ts-node src/seed-demo-data.ts

setup-dev: ## Full dev setup: start containers + seed demo data
	$(MAKE) dev-up
	@echo "⏳ Waiting for API to be healthy..."
	@timeout=60; while [ $$timeout -gt 0 ]; do \
	  if docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api wget -qO- http://localhost:3000/health > /dev/null 2>&1; then \
	    break; \
	  fi; \
	  sleep 2; \
	  timeout=$$((timeout - 2)); \
	done
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api npx ts-node src/seed-demo-data.ts
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "  API:     http://localhost:3000"
	@echo "  MailHog: http://localhost:8025"
	@echo "  DB:      localhost:5432"
	@echo ""
	@echo "  Login:   admin@dps-demo.edu / Demo@12345678"
	@echo "  Run Angular frontend separately: cd school-management-frontend && ng serve"
	@echo ""

# ── Shells ───────────────────────────────────────────────────────────────────
shell-api: ## Open a shell inside the API container
	docker compose exec api sh

shell-db: ## Open psql shell inside the database container
	docker compose exec postgres psql -U $${DB_USER:-school_admin} -d $${DB_NAME:-school_management}

shell-nginx: ## Open a shell inside the nginx container
	docker compose exec nginx sh

shell-mailhog: ## Open MailHog web UI (dev only)
	@echo "MailHog UI: http://localhost:8025"

# ── Testing ──────────────────────────────────────────────────────────────────
test: ## Run backend unit tests
	npm test

test-coverage: ## Run tests with coverage report
	npm run test:coverage
	@echo "Coverage report: ./coverage/lcov-report/index.html"

test-e2e: ## Run Playwright E2E tests (headless)
	npm run e2e

test-e2e-ui: ## Run Playwright E2E tests with browser UI
	npm run e2e:ui

# ── Code Quality ─────────────────────────────────────────────────────────────
audit: ## Run npm audit for known vulnerabilities
	npm audit --audit-level=high

typecheck: ## TypeScript type check (no emit)
	npx tsc --noEmit

lint: ## Lint source code
	npm run lint

# ── SSL ──────────────────────────────────────────────────────────────────────
ssl-cert: ## Generate self-signed SSL cert for local HTTPS testing
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	  -keyout nginx/ssl/server.key \
	  -out    nginx/ssl/server.crt \
	  -subj "/C=IN/ST=Dev/L=Dev/O=SchoolMgmt/CN=localhost"
	@echo "✅  Self-signed cert created in nginx/ssl/"

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean: ## Remove containers, networks, and ALL volumes — DESTRUCTIVE
	@echo "⚠️  This will delete all volumes including the database. Ctrl+C to cancel."
	@sleep 3
	docker compose down -v --remove-orphans

clean-volumes: ## Remove only anonymous Docker volumes (keep named ones)
	docker volume prune -f

clean-cache: ## Prune Docker build cache
	docker builder prune -f
