FROM node:21-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
RUN touch package-lock.json && npm cache clean --force

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:21-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3003/api/v1/health || exit 1

EXPOSE 3003

CMD ["node", "dist/main.js"]
