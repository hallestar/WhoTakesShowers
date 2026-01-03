# 多阶段构建 - 构建阶段

# ========================================
# 阶段1: 构建前端
# ========================================
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# 复制package文件并安装依赖
COPY frontend/package*.json ./
RUN npm ci

# 复制源代码并构建
COPY frontend/ ./
RUN npm run build

# ========================================
# 阶段2: 构建后端
# ========================================
FROM golang:1.21-alpine AS backend-builder

WORKDIR /backend

# 复制go mod文件并下载依赖
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# 复制源代码并构建
COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o whotakesshowers cmd/server/main.go

# ========================================
# 阶段3: 运行阶段
# ========================================
FROM alpine:latest

# 安装必要的运行时依赖
RUN apk add --no-cache \
    sqlite \
    ca-certificates \
    tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建应用用户
RUN addgroup -g 1000 whotakesshowers && \
    adduser -D -u 1000 -G whotakesshowers whotakesshowers

# 创建必要的目录
RUN mkdir -p /app/uploads /app/data && \
    chown -R whotakesshowers:whotakesshowers /app

WORKDIR /app

# 从构建阶段复制文件
COPY --from=backend-builder /backend/whotakesshowers /app/
COPY --from=frontend-builder /frontend/dist /app/frontend/

# 切换到应用用户
USER whotakesshowers

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/projects || exit 1

# 启动应用
CMD ["/app/whotakesshowers"]
