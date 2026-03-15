# ── Stage 1: install + build everything ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY server/package.json            ./server/
COPY client/package.json            ./client/

RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build


# ── Stage 2: production server ────────────────────────────────────────────────
FROM node:22-alpine AS server
WORKDIR /app

# Install only production deps — no peer conflict without devDeps, no --legacy needed
COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY server/package.json            ./server/
COPY client/package.json            ./client/

RUN npm ci --omit=dev --legacy-peer-deps

# Drop client workspace files after install (not needed at runtime)
RUN rm -rf node_modules/vue node_modules/@vitejs

# Copy compiled artefacts — npm ci already created the @game/shared symlink,
# so we just need to fill packages/shared/dist and server/dist.
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/server/dist          ./server/dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/dist/index.js"]


# ── Stage 3: nginx serving the Vue SPA ───────────────────────────────────────
FROM nginx:alpine AS client
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY docker/nginx.conf               /etc/nginx/conf.d/default.conf
EXPOSE 80
