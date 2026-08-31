#!/usr/bin/env zsh
SESSION="ai_agents_dev"

tmux kill-session -t $SESSION 2>/dev/null

tmux new-session -d -s $SESSION -n infra "docker compose up -d; zsh"
tmux new-window -t $SESSION -n backend "cd backend && uv run python main.py"
tmux new-window -t $SESSION -n frontend "cd frontend && npm run dev"
tmux new-window -t $SESSION -n ngrok "ngrok http 5173"
tmux new-window -t $SESSION -n mobile "cd mob_app && npx expo start --lan"

tmux attach -t $SESSION

# Starting tmux:                 chmod +x start-dev.sh
#                                ./start-dev.sh

# Getting it back
# it wasn't removed:                tmux attach -t ai_agents_dev

# Shutting everything down:       chmod +x stop-dev.sh

#Killing sessions manually:       tmux kill-session -t session_name
