FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=https://api.xxx.com/api
ARG VITE_APP_BASE_PATH=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH
COPY package.json pnpm-workspace.yaml ./
COPY admin-web/package.json admin-web/package.json
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN corepack enable && pnpm install --filter @guxin/admin-web --frozen-lockfile=false
COPY admin-web admin-web
COPY deploy/nginx/static-spa.conf /tmp/static-spa.conf
RUN pnpm --filter @guxin/admin-web build

FROM nginx:1.27-alpine
COPY --from=build /app/admin-web/dist /usr/share/nginx/html
COPY --from=build /tmp/static-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
