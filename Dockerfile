# Use official Python Alpine image
FROM python:3.12-alpine

# Install build dependencies and nginx
RUN apk add --no-cache build-base libffi-dev openssl-dev nginx

# Set work directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Make sure start_servers.sh is executable
RUN chmod +x start_servers.sh

# Expose backend and frontend ports
EXPOSE 9000 8080

# Start all services: Nginx (via start_servers.sh), FastAPI backend, and Telegram bot
CMD sh -c './start_servers.sh & NGINX_PID=$!; \
           uvicorn main:app --host 0.0.0.0 --port 9000 & BACKEND_PID=$!; \
           python bot/telegram_bot.py & BOT_PID=$!; \
           wait -n $NGINX_PID $BACKEND_PID $BOT_PID; \
           kill -TERM $NGINX_PID $BACKEND_PID $BOT_PID; \
           exit 1' 