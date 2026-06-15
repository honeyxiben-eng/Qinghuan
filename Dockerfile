# ============================================
# TreeNB - Production Dockerfile
# 腾讯云 / 任意 Linux 服务器适用
# ============================================

# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx next build
RUN npm prune --omit=dev

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3456
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chown -R appuser:appgroup /app/prisma /app/.next

USER appuser
EXPOSE 3456

HEALTHCHECK --interval=30s --timeout=8s --start-period=15s --retries=3 CMD wget -T 3 -q -O - http://127.0.0.1:3456/ > /dev/null

CMD ["node", "server.js"]
