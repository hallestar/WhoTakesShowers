# Docker部署指南

本指南介绍如何使用Docker容器部署WhoTakesShowers应用。

## 📦 部署架构

### 单容器方案（推荐）

将前端和后端打包在一个Docker镜像中：

```
┌─────────────────────────────────┐
│     Docker Container           │
│  ┌────────────────────────────┐ │
│  │  Nginx (可选)              │ │
│  │  ┌──────────────────────┐  │ │
│  │  │  Go Backend (8080)   │  │ │
│  │  │  ┌────────────────┐   │  │ │
│  │  │  │ Frontend files │   │  │ │
│  │  │  └────────────────┘   │  │ │
│  │  └──────────────────────┘  │ │
│  │  ┌──────────────────────┐  │ │
│  │  │ SQLite DB           │  │ │
│  │  └──────────────────────┘  │ │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐ │
│  │  Volumes:                 │ │
│  │  - /app/data              │ │
│  │  - /app/uploads          │ │
│  └────────────────────────────┘  │
└─────────────────────────────────┘
```

### 优势

- **简单**: 一个容器包含所有功能
- **轻量**: 基于 Alpine Linux，镜像体积小
- **快速**: 容器启动仅需秒级
- **自包含**: 包含运行时环境，不依赖宿主机

---

## 🚀 快速开始

### 方式一：本地Docker部署（最简单）

#### 1. 构建镜像

```bash
# 构建Docker镜像
docker build -t whotakesshowers:latest .
```

#### 2. 运行容器

```bash
# 创建数据目录
mkdir -p data uploads

# 运行容器
docker run -d \
  --name whotakesshowers \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  whotakesshowers:latest
```

#### 3. 访问应用

```bash
# 前端+后端
open http://localhost:8080

# 查看日志
docker logs -f whotakesshowers
```

### 方式二：使用Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

### 方式三：远程服务器部署

#### 1. 初始化服务器

```bash
# 在服务器上运行
scp docker/init-docker-server.sh root@<服务器IP>:/root/
ssh root@<服务器IP> "bash /root/init-docker-server.sh"
```

#### 2. 配置部署文件

编辑 `deploy-docker.config.sh`:

```bash
IMAGE_NAME="whotakesshowers"
IMAGE_TAG="latest"
DEPLOY_USER="your-username"
DEPLOY_HOST="192.168.1.100"
```

#### 3. 一键部署

```bash
# 在开发机上运行
chmod +x docker-deploy-all.sh
./docker-deploy-all.sh
```

---

## 📋 Docker文件说明

### Dockerfile

多阶段构建文件：

1. **阶段1: 构建前端**
   - 使用Node.js镜像
   - 安装依赖并构建前端
   - 生成dist目录

2. **阶段2: 构建后端**
   - 使用Go镜像
   - 编译Go程序
   - 生成可执行文件

3. **阶段3: 运行阶段**
   - 使用Alpine Linux
   - 安装SQLite和CA证书
   - 复制前后端构建产物
   - 配置用户和权限

**镜像大小**: 约100-150MB

### docker-compose.yml

服务编排配置，包含：
- whotakesshowers服务
- 可选的Nginx反向代理
- 网络配置
- 卷挂载配置
- 健康检查

---

## 🔧 配置说明

### 环境变量

容器支持以下环境变量：

```bash
GIN_MODE=release         # 运行模式: debug/release
TZ=Asia/Shanghai        # 时区设置
```

在docker run或docker-compose.yml中设置：

```yaml
environment:
  - GIN_MODE=release
  - TZ=Asia/Shanghai
```

### 卷挂载

```bash
# 数据库
-v $(pwd)/data:/app/data

# 上传文件
-v $(pwd)/uploads:/app/uploads
```

### 端口映射

```bash
# 容器端口8080映射到宿主机8080
-p 8080:8080

# 或映射到其他端口
-p 3000:8080
```

---

## 🛠️ 管理命令

### 使用部署脚本

```bash
# 赋予执行权限
chmod +x docker-deploy.sh docker-deploy-all.sh

# 构建
./docker-deploy.sh build

# 部署
./docker-deploy.sh deploy

# 仅本地部署
./docker-deploy.sh local-deploy

# 查看日志
./docker-deploy.sh logs

# 查看状态
./docker-deploy.sh status

# 重启容器
./docker-deploy.sh restart

# 停止容器
./docker-deploy.sh stop

# 清理资源
./docker-deploy.sh cleanup
```

### 使用Docker命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 查看日志
docker logs whotakesshowers
docker logs -f whotakesshowers  # 实时日志

# 进入容器
docker exec -it whotakesshowers sh

# 重启容器
docker restart whotakesshowers

# 停止容器
docker stop whotakesshowers

# 删除容器
docker rm whotakesshowers

# 查看资源使用
docker stats whotakesshowers
```

### 使用Docker Compose

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f whotakesshowers

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

---

## 📊 镜像优化

### 当前镜像组成

```
Alpine Linux        ~5MB
+ SQLite             ~1MB
+ CA Certificates    ~2MB
+ Go Backend         ~15MB
+ Frontend files     ~30MB
+ Runtime libs       ~5MB
───────────────────────────
总计                 ~58-100MB
```

### 进一步优化建议

1. **使用多阶段构建**（已实现）
   - 减少最终镜像大小
   - 不包含构建工具

2. **.dockerignore**
   - 排除不必要的文件
   - 加快构建速度

3. **使用Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   docker build -t whotakesshowers:latest .
   ```

4. **使用BuildCache**
   - 缓存依赖层
   - 加快重复构建

---

## 🔒 安全配置

### 1. 运行非root用户

Dockerfile中已创建专用用户：

```dockerfile
RUN addgroup -g 1000 whotakesshowers && \
    adduser -D -u 1000 -G whotakesshowers whotakesshowers
USER whotakesshowers
```

### 2. 只读文件系统

```bash
docker run --read-only --tmpfs=/tmp whotakesshowers:latest
```

### 3. 资源限制

```bash
docker run -d \
  --name whotakesshowers \
  --memory="512m" \
  --cpus="0.5" \
  whotakesshowers:latest
```

### 4. 健康检查

已配置健康检查：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:8080/api/projects || exit 1
```

查看健康状态：

```bash
docker inspect --format='{{.State.Health.Status}}' whotakesshowers
```

---

## 🔄 CI/CD集成

### GitHub Actions示例

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1

    - name: Login to Docker Hub
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push
      uses: docker/build-push-action@v2
      with:
        context: .
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/whotakesshowers:latest
```

---

## 🐳 容器Registry

### 公共Registry

```bash
# Docker Hub
docker tag whotakesshowers:latest yourusername/whotakesshowers:latest
docker push yourusername/whotakesshowers:latest

# 拉取
docker pull yourusername/whotakesshowers:latest
```

### 私有Registry

```bash
# 阿里云容器镜像
docker tag whotakesshowers:latest registry.cn-hangzhou.aliyuncs.com/yournamespace/whotakesshowers:latest
docker push registry.cn-hangzhou.aliyuncs.com/yournamespace/whotakesshowers:latest
```

---

## 📝 部署脚本详解

### docker-deploy.sh

核心部署脚本，支持多种操作：

| 命令 | 说明 |
|------|------|
| `build` | 构建Docker镜像 |
| `deploy` | 部署容器（本地或远程） |
| `local-deploy` | 仅本地部署 |
| `stop` | 停止容器 |
| `restart` | 重启容器 |
| `logs` | 查看日志 |
| `status` | 查看状态 |
| `cleanup` | 清理资源 |

### docker-deploy-all.sh

一键部署脚本：
1. 构建镜像
2. 部署容器
3. 显示访问信息

---

## 🚨 故障排查

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs whotakesshowers

# 检查容器状态
docker ps -a | grep whotakesshowers

# 交互式调试
docker run -it --rm whotakesshowers:latest sh
```

### 2. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :8080

# 更改端口映射
docker run -d -p 3000:8080 whotakesshowers:latest
```

### 3. 数据持久化问题

```bash
# 检查卷挂载
docker inspect whotakesshowers | grep Mounts

# 进入容器检查数据
docker exec -it whotakesshowers ls -la /app/data
```

### 4. 内存不足

```bash
# 查看资源使用
docker stats whotakesshowers

# 限制内存
docker run -d --memory="512m" whotakesshowers:latest
```

### 5. 镜像拉取失败

```bash
# 手动拉取
docker pull whotakesshowers:latest

# 或使用国内镜像加速
sudo systemctl restart docker
sudo systemctl enable docker
```

---

## 🎯 生产环境建议

### 1. 使用Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: whotakesshowers:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - app-data:/app/data
      - app-uploads:/app/uploads
    environment:
      - GIN_MODE=release
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  app-data:
  app-uploads:
```

### 2. 配置自动重启

```bash
docker run -d --restart unless-stopped whotakesshowers:latest
```

重启策略：
- `no` - 不自动重启
- `on-failure` - 仅失败时重启
- `always` - 总是重启（推荐）
- `unless-stopped` - 除非手动停止（推荐）

### 3. 日志管理

```bash
# 限制日志大小
docker run -d \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  whotakesshowers:latest
```

### 4. 监控

```bash
# 实时监控
docker stats whotakesshowers

# 导出指标
docker stats --no-stream whotakesshowers --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 📚 相关文件

- **Dockerfile** - Docker镜像构建文件
- **docker-compose.yml** - Docker Compose配置
- **.dockerignore** - Docker构建排除文件
- **deploy-docker.config.sh** - Docker部署配置
- **docker-deploy.sh** - Docker部署脚本
- **docker-deploy-all.sh** - Docker一键部署脚本
- **docker/init-docker-server.sh** - 服务器初始化脚本

---

## 🔗 与rsync部署方案对比

| 特性 | Docker部署 | rsync部署 |
|------|-----------|-----------|
| 复杂度 | 简单 | 中等 |
| 环境一致性 | ✅ 完全一致 | ⚠️ 需要配置服务器环境 |
| 部署速度 | 快（秒级） | 中等（分钟级） |
| 回滚 | 快速（切换镜像） | 较快（备份恢复） |
| 资源占用 | 稍高（容器运行时） | 低 |
| 可移植性 | ✅ 高 | ⚠️ 依赖环境 |
| 扩展性 | ✅ 容易（容器编排） | 一般 |

---

## 💡 最佳实践

1. **使用镜像标签**
   - 不要使用 `latest`
   - 使用版本号或Git commit hash
   - 例如: `whotakesshowers:v1.0.0`

2. **数据持久化**
   - 始终挂载volumes
   - 定期备份数据目录
   - 不要在容器内存储重要数据

3. **安全加固**
   - 使用非root用户运行
   - 限制容器资源
   - 定期更新基础镜像

4. **监控和日志**
   - 配置日志轮转
   - 设置资源限制
   - 监控容器健康状态

5. **测试部署**
   - 在staging环境测试
   - 验证备份恢复
   - 准备回滚方案

---

## 📖 参考资源

- [Docker官方文档](https://docs.docker.com/)
- [Dockerfile最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Alpine Linux](https://alpinelinux.org/)
