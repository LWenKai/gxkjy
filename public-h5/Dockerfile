FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=https://api.xxx.com/api
ARG VITE_CERT_PUBLIC_BASE_URL=https://cert.xxx.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CERT_PUBLIC_BASE_URL=$VITE_CERT_PUBLIC_BASE_URL
COPY package.json pnpm-workspace.yaml ./
COPY public-h5/package.json public-h5/package.json
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN corepack enable && pnpm install --filter @guxin/public-h5 --frozen-lockfile=false
COPY public-h5 public-h5
COPY deploy/nginx/static-spa.conf /tmp/static-spa.conf
RUN pnpm --filter @guxin/public-h5 build

FROM nginx:1.27-alpine
COPY --from=build /app/public-h5/dist /usr/share/nginx/html
COPY --from=build /tmp/static-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
