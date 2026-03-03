# Voice of Care (ASHA) — Developer Makefile
#
# Dev workflow (two terminals):
#   Terminal 1:  make dev-backend
#   Terminal 2:  make dev-web
#
# Or everything at once (backend in background, web in foreground):
#   make dev
#
# Production:
#   make prod-build && make prod
#
# Seed data:
#   make seed           # safe to re-run, skips existing rows
#   make seed-reset     # wipe all tables and re-seed

.PHONY: help \
        dev dev-backend dev-web \
        prod prod-build prod-down \
        seed seed-reset \
        logs \
        down ps clean

BACKEND_CONTAINER := voice-of-care-backend


# ── Default ────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  Dev"
	@echo "    make dev            Start backend (bg) + web dev server (fg)"
	@echo "    make dev-backend    Start postgres + backend in Docker"
	@echo "    make dev-web        Start Vite dev server (npm run dev)"
	@echo ""
	@echo "  Production"
	@echo "    make prod-build     Build all production Docker images"
	@echo "    make prod           Start full production stack"
	@echo "    make prod-down      Stop production stack"
	@echo ""
	@echo "  Data"
	@echo "    make seed           Seed initial data (skips existing rows)"
	@echo "    make seed-reset     Wipe all tables and re-seed"
	@echo ""
	@echo "  Utils"
	@echo "    make logs           Tail backend container logs"
	@echo "    make down           Stop all running containers"
	@echo "    make ps             Show container status"
	@echo "    make clean          Clear Vite transform cache"
	@echo ""


# ── Dev ───────────────────────────────────────────────────────────────────

dev-backend:
	docker compose up -d postgres backend

dev-web: clean
	cd web && npm run dev

# Start backend in the background then hand over the terminal to the web dev server.
# Ctrl-C stops the web server; run `make down` separately to stop Docker containers.
dev: dev-backend
	@echo "Backend is up. Starting web dev server…"
	cd web && npm run dev


# ── Production ────────────────────────────────────────────────────────────

prod-build:
	docker compose --profile production build

prod:
	docker compose --profile production up -d

prod-down:
	docker compose --profile production down


# ── Data ─────────────────────────────────────────────────────────────────

seed:
	docker exec $(BACKEND_CONTAINER) python scripts/seed_data.py

seed-reset:
	docker exec $(BACKEND_CONTAINER) python scripts/seed_data.py --reset


# ── Utils ──────────────────────────────────────────────────────────────────

logs:
	docker compose logs -f backend

down:
	docker compose --profile production down

ps:
	docker compose ps

clean:
	rm -rf web/node_modules/.vite
