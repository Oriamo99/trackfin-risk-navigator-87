# ── Stage 1: Build React app ─────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production server ───────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy built React files
COPY --from=build /app/dist ./dist

# Copy server files and install server deps
COPY server/package.json server/proxy.js ./server/
RUN cd server && npm install --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server/proxy.js"]
