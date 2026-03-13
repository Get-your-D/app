# Multi-stage build for Next.js
FROM node:21-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
RUN touch package-lock.json

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM node:21-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json ./
RUN npm ci --only=production --legacy-peer-deps || npm install --only=production --legacy-peer-deps

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
