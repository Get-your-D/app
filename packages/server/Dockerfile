FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/
RUN npm ci

FROM deps AS build
COPY packages/server/ ./packages/server/
#
# Prisma generate only needs a valid URL format (not a real connection). Use same
# DB name as vitd-db (app) so config is consistent. At runtime, pass DATABASE_URL
# when running the container (e.g. postgresql://postgres:postgres@vitd-db:5432/app).
#
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
RUN npm run db:generate --workspace=packages/server
RUN npm run build --workspace=packages/server

FROM base AS production
ENV NODE_ENV=production
ENV PORT=3003
COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/
#
# The repo root `prepare` script runs `husky`, which is a devDependency.
# In production we intentionally omit devDependencies, so we must skip install scripts.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
# Prisma client codegen artifacts are generated in the build stage.
# Copy them into production because we intentionally skip scripts during
# `npm ci` (and we omit devDependencies, which contains the prisma CLI).
COPY --from=build /app/node_modules/.prisma ./node_modules/@prisma/client/.prisma
COPY --from=build /app/packages/server/dist ./packages/server/dist
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app/packages/server
EXPOSE 3003
# Pass DATABASE_URL at run time to point at your DB (e.g. -e DATABASE_URL=postgresql://postgres:postgres@vitd-db:5432/app).
CMD ["node", "dist/src/main.js"]
