#!/bin/sh
set -e

# Start Nginx (frontend)
./start_servers.sh &
NGINX_PID=$!

# Start FastAPI backend
uvicorn main:app --host 0.0.0.0 --port 9000 &
BACKEND_PID=$!

# Start Telegram bot (this will be the foreground process)
python bot/telegram_bot.py &
BOT_PID=$!

# Wait for any process to exit
wait -n $NGINX_PID $BACKEND_PID $BOT_PID

# If any process exits, kill all and exit
kill -TERM $NGINX_PID $BACKEND_PID $BOT_PID
exit 1 