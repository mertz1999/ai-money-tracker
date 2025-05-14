#!/bin/bash

# Start Nginx with our custom config
echo "Starting Nginx server..."
nginx -c $(pwd)/nginx.conf

# Function to handle script termination
cleanup() {
    echo "Stopping Nginx..."
    nginx -s stop
    exit 0
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

echo "Nginx is running on http://localhost:8080"
echo "Make sure to start the FastAPI server separately with: python main.py"
echo "Press Ctrl+C to stop Nginx."

# Keep the script running to allow for Ctrl+C handling
tail -f /dev/null 