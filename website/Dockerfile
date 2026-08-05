FROM node:22-alpine AS build

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY website/package.json website/package.json
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN corepack enable && pnpm install --filter @guxin/website --frozen-lockfile=false

COPY website website
COPY deploy/nginx/static-spa.conf /tmp/static-spa.conf
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter @guxin/website build

FROM nginx:1.27-alpine

COPY --from=build /app/website/dist /usr/share/nginx/html
COPY --from=build /tmp/static-spa.conf /etc/nginx/conf.d/default.conf
