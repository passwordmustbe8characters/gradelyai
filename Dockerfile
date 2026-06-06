FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]