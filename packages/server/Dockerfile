FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/
RUN npm ci

FROM deps AS build
COPY packages/server/ ./packages/server/
RUN npm run build --workspace=packages/server

FROM base AS production
ENV NODE_ENV=production
ENV PORT=3003
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/packages/server/dist ./packages/server/dist
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app/packages/server
EXPOSE 3003
CMD ["node", "dist/main"]
