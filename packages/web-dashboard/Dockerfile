FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/web-dashboard/package.json ./packages/web-dashboard/
COPY packages/web-shared/package.json ./packages/web-shared/
RUN npm ci

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY packages/web-shared/ ./packages/web-shared/
COPY packages/web-dashboard/ ./packages/web-dashboard/
RUN npm run build --workspace=packages/web-dashboard

FROM node:22-alpine AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/packages/web-dashboard/.next/standalone ./
COPY --from=build /app/packages/web-dashboard/.next/static ./packages/web-dashboard/.next/static/
COPY --from=build /app/packages/web-dashboard/public ./packages/web-dashboard/public/
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3001
CMD ["node", "packages/web-dashboard/server.js"]
