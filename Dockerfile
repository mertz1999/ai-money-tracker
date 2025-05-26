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

# Copy entrypoint script and set permissions
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh start_servers.sh

# Expose backend and frontend ports
EXPOSE 9000 8080

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"] 