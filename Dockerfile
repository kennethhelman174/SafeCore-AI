# Multi-stage production-ready Dockerfile
# Stage 1: Build the application
FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# Stage 2: Runtime image
FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y netcat-openbsd openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what is strictly needed for running the application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

CMD ["./docker-entrypoint.sh"]
