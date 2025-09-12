#!/bin/sh
set -e

# Start Nginx with our custom config

echo "Starting Nginx server..."
nginx -c $(pwd)/nginx.conf &
NGINX_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping Nginx..."
    nginx -s stop
    exit 0
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

echo "Nginx is running on http://localhost:8080"

# Start FastAPI backend
uvicorn main:app --host 0.0.0.0 --port 9000 &
BACKEND_PID=$!

# Start Telegram bot (this will be the foreground process)
# python bot/telegram_bot.py &
# BOT_PID=$!

# Wait for any process to exit
wait -n $NGINX_PID $BACKEND_PID $BOT_PID

# If any process exits, kill all and exit
kill -TERM $NGINX_PID $BACKEND_PID $BOT_PID
exit 1 