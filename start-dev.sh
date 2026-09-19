#!/usr/bin/env zsh

SESSION="ai_agents_dev"
PROJECT="$HOME/projects/AI_AGENTS_PLATFORM"

# ============================================================
# CLEAN UP EXISTING SESSION
# ============================================================

tmux kill-session -t "$SESSION" 2>/dev/null

# ============================================================
# CREATE THE TMUX SESSION
# ============================================================

tmux new-session -d -s "$SESSION" -n "__placeholder"

# ============================================================
# SERVICES
# Uncomment/comment any combination of services.
# ============================================================

# Infrastructure — PostgreSQL, Redis, etc.
# tmux new-window -t "$SESSION" -n infra \
#   "cd $PROJECT && docker compose up -d; zsh"

# Backend — local FastAPI server
# tmux new-window -t "$SESSION" -n backend \
#   "cd $PROJECT/backend && uv run python main.py"

# Mobile — Expo React Native app
tmux new-window -t "$SESSION" -n mobile \
  "cd $PROJECT/mob_app && npx expo start --lan --port 8081"

# Web — Expo React Native Web
tmux new-window -t "$SESSION" -n web \
  "cd $PROJECT/mob_app && npx expo start --web --port 8082"

# Standalone Vite frontend — no longer needed
# tmux new-window -t "$SESSION" -n frontend \
#   "cd $PROJECT/frontend && npm run dev"

# ngrok — expose web externally
# tmux new-window -t "$SESSION" -n ngrok \
#   "ngrok http 8081"

# ============================================================
# REMOVE PLACEHOLDER
# ============================================================

tmux kill-window -t "$SESSION:__placeholder" 2>/dev/null

# ============================================================
# ATTACH
# ============================================================

tmux attach -t "$SESSION"


# ============================================================
# COMMANDS
# ============================================================
#
# Start development:
#   ./start-dev.sh
#
# Reattach:
#   tmux attach -t ai_agents_dev
#
# Kill session:
#   tmux kill-session -t ai_agents_dev
#
# Make executable:
#   chmod +x start-dev.sh
#
# Stop everything:
#   ./stop-dev.sh
#
# ============================================================