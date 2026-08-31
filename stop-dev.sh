#!/usr/bin/env zsh

tmux kill-session -t ai_agents_dev 2>/dev/null

cd "$(dirname "$0")"
docker compose down
