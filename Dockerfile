FROM node:20-slim
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV="production"

# Command to run the application
CMD ["node", "lib/server.js"]
