FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/web-shared/package.json ./packages/web-shared/
RUN npm ci

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY packages/web-shared/ ./packages/web-shared/
COPY packages/web/ ./packages/web/
RUN npm run build --workspace=packages/web

FROM node:22-alpine AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/packages/web/.next/standalone ./
COPY --from=build /app/packages/web/.next/static ./packages/web/.next/static/
COPY --from=build /app/packages/web/public ./packages/web/public/
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "packages/web/server.js"]
