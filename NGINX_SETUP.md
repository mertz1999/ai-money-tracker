# Running AI Money Tracker UI with Nginx

This guide explains how to run the AI Money Tracker with Nginx serving the UI and FastAPI handling the backend API requests.

## Prerequisites

- Nginx should be installed on your system
- Python environment with required dependencies installed

## Setup Overview

The setup consists of two separate services:

1. **FastAPI Backend**: Handles API requests only, running on port 9000
2. **Nginx Frontend**: Serves static files (HTML, CSS, JS) and proxies API requests to the FastAPI backend, running on port 8080

## Running the Services

You need to run both the FastAPI server and Nginx separately:

### Step 1: Start the FastAPI server
```bash
python main.py
```
This will start the FastAPI server on port 9000.

### Step 2: Start Nginx with the custom configuration
Either run the convenience script:
```bash
./start_servers.sh
```
Or start Nginx manually:
```bash
nginx -c $(pwd)/nginx.conf
```

To stop Nginx:
```bash
nginx -s stop
```

## Accessing the Application

- Frontend UI: http://localhost:8080
- API Endpoints: http://localhost:9000/api/
- API Documentation: http://localhost:8080/docs or http://localhost:9000/docs
- Health Check: http://localhost:8080/health or http://localhost:9000/health

## Configuration Details

### nginx.conf

The Nginx configuration file:
- Serves static files from the `public` directory
- Proxies API requests to the FastAPI backend
- Handles error pages

You may need to adjust the absolute paths in the configuration file if you're running this on a different system, including:
1. The path to `mime.types` - currently set to `/opt/homebrew/etc/nginx/mime.types`
2. The path to your project directory - currently set to `/Users/applestation/Project/archive/ai-money-tracker/public`

### Troubleshooting

If you encounter permission issues with Nginx:
- Ensure Nginx has read permissions for the `public` directory
- Check if the port 8080 is already in use

If you encounter issues with the API proxy:
- Verify that the FastAPI server is running
- Check that the proxy_pass URL matches your FastAPI server address and port 