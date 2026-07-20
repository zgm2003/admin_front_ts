ARG NODE_IMAGE=node:24.18.0-alpine
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.3-alpine
ARG BUILD_REVISION=unknown

FROM ${NODE_IMAGE} AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_GO_API_BASE_URL=http://localhost:5173
ARG VITE_WEB_SOCKET_URL=ws://localhost:5173/api/admin/v1/realtime/ws
ARG VITE_PLATFORM=admin
ARG VITE_ADMIN_RUNTIME_MODE=production

ENV VITE_GO_API_BASE_URL=${VITE_GO_API_BASE_URL}
ENV VITE_WEB_SOCKET_URL=${VITE_WEB_SOCKET_URL}
ENV VITE_PLATFORM=${VITE_PLATFORM}
ENV VITE_ADMIN_RUNTIME_MODE=${VITE_ADMIN_RUNTIME_MODE}

RUN npm run build:check

FROM ${NGINX_IMAGE} AS runtime

ARG BUILD_REVISION

LABEL org.opencontainers.image.revision="${BUILD_REVISION}"

COPY --chown=101:101 deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
