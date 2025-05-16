# Build stage
FROM node:20.19.2-slim AS builder

# Install pnpm globally (as root)
RUN npm install -g pnpm

# Create non-root user and group, and set up directories
RUN groupadd -r nodejs --gid 1001 && \
    useradd -r -g nodejs --uid 1001 --create-home nodejs && \
    mkdir /app && \
    chown nodejs:nodejs /app

# Set working directory
WORKDIR /app

# Switch to non-root user
USER nodejs

# Configure pnpm to enable build scripts
RUN pnpm config set enable-pre-post-scripts true

# Copy all source files with correct ownership
COPY --chown=nodejs:nodejs . .

# Install all dependencies and build
RUN pnpm install --frozen-lockfile && pnpm run build

# Final stage
FROM gcr.io/distroless/nodejs20-debian12:nonroot

# Set environment variables
ENV NODE_ENV="production" \
    PORT=8080 \
    # Security headers
    SECURE_HEADERS="true" \
    # Disable debugger and set module type
    NODE_OPTIONS="--no-deprecation --no-warnings --disallow-code-generation-from-strings" \
    # Explicitly set the Node.js module type
    NODE_NO_WARNINGS=1

# Create app directory
WORKDIR /app

# Copy production files from builder
COPY --from=builder --chown=nonroot:nonroot /app/lib ./lib
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/app/lib/server.js", "--health-check"]

# Command to run the application
CMD ["/app/lib/server.js"]
