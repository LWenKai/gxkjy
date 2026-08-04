FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN corepack enable && pnpm install --filter @guxin/backend --frozen-lockfile=false

FROM deps AS build
COPY backend backend
ENV DATABASE_URL=mysql://guxin:change-me@mysql:3306/guxin_quick_test
RUN pnpm --filter @guxin/backend prisma:generate
RUN pnpm --filter @guxin/backend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/assets ./backend/assets
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
