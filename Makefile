.PHONY: dev dev-docker up down reset migrate logs build help

# ─────────────────────────────────────────
# ローカル開発（Supabase CLI + Next.js）
# ─────────────────────────────────────────

dev: ## Supabase + Next.js をローカル起動
	@echo "→ Supabase を起動中..."
	npx supabase start
	@cp -n .env.docker .env.local 2>/dev/null || true
	@echo "→ Next.js を起動中..."
	npm run dev

dev-next: ## Next.js のみ起動（Supabase は既に起動済みの前提）
	npm run dev

# ─────────────────────────────────────────
# Docker Compose（フルスタック）
# ─────────────────────────────────────────

up: ## Docker Compose でフルスタック起動
	docker compose up --build -d
	@echo ""
	@echo "  App    → http://localhost:3000"
	@echo "  DB     → localhost:54322"
	@echo "  REST   → http://localhost:54321"
	@echo "  Mail   → http://localhost:54324"
	@echo ""

down: ## Docker Compose を停止
	docker compose down

down-v: ## Docker Compose を停止してボリューム削除（DBリセット）
	docker compose down -v

logs: ## ログをフォロー
	docker compose logs -f app

logs-db: ## DBログをフォロー
	docker compose logs -f db

# ─────────────────────────────────────────
# DB / Migration
# ─────────────────────────────────────────

migrate: ## マイグレーションを適用（Supabase CLI）
	npx supabase db push

migrate-new: ## 新しいマイグレーションファイルを作成
	@read -p "migration name: " name; \
	npx supabase migration new $$name

reset: ## DBをリセット（全データ削除 + migration再適用）
	npx supabase db reset

# ─────────────────────────────────────────
# ビルド
# ─────────────────────────────────────────

build: ## Next.js プロダクションビルド
	npm run build

docker-build: ## Docker イメージをビルド
	docker build -t vlogweb .

# ─────────────────────────────────────────

help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
