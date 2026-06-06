FROM node:20-slim

# Install Python and build tools required for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]