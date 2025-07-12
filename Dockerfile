# Multi-stage build for Supabase MCP Server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/mcp-server-supabase/package.json ./packages/mcp-server-supabase/
COPY packages/mcp-utils/package.json ./packages/mcp-utils/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/mcp-server-supabase/package.json ./packages/mcp-server-supabase/
COPY packages/mcp-utils/package.json ./packages/mcp-utils/

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/packages/mcp-server-supabase/dist ./packages/mcp-server-supabase/dist
COPY --from=builder /app/packages/mcp-utils/dist ./packages/mcp-utils/dist

# Change ownership to non-root user
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port for health checks (optional)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Use dumb-init to handle signals properly and run the MCP server
ENTRYPOINT ["dumb-init", "--", "node", "packages/mcp-server-supabase/dist/transports/stdio.js"]