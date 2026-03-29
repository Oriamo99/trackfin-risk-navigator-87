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

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "server/proxy.js"]
