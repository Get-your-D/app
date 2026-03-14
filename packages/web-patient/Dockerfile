FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/web-patient/package.json ./packages/web-patient/
COPY packages/web-shared/package.json ./packages/web-shared/
RUN npm ci

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY packages/web-shared/ ./packages/web-shared/
COPY packages/web-patient/ ./packages/web-patient/
RUN npm run build --workspace=packages/web-patient

FROM node:22-alpine AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/packages/web-patient/.next/standalone ./
COPY --from=build /app/packages/web-patient/.next/static ./packages/web-patient/.next/static/
COPY --from=build /app/packages/web-patient/public ./packages/web-patient/public/
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3002
CMD ["node", "packages/web-patient/server.js"]
