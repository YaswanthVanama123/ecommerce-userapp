# Build stage for React user webapp
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage - serve with lightweight HTTP server
FROM node:20-alpine

WORKDIR /app

# Install dumb-init and serve package
RUN apk add --no-cache dumb-init && \
    npm install -g serve

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run serve process
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]
