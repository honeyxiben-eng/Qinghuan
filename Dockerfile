# ============================================
# 智慧盐湖平台 - 生产环境 Dockerfile
# 腾讯云 / 阿里云 / 任意 Linux 服务器适用
# ============================================

# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# 安装依赖（先复制 prisma 让 postinstall 的 prisma generate 能跑）
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# 复制源码
COPY . .

# 构建 Next.js (standalone 模式)
RUN npx next build

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3456

# 创建非 root 用户
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

# 复制 standalone 构建产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# 复制 node_modules (Prisma 运行时需要)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 修复权限：数据库目录需要可写
RUN chown -R appuser:appgroup /app/prisma /app/.next

USER appuser
EXPOSE 3456

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3456/ || exit 1

CMD ["node", "server.js"]
