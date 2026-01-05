# 启动配置指南

本文档说明如何配置 `./start.sh` 启动脚本的自定义 IP 和端口。

## 快速开始

### 默认配置启动

使用默认配置启动（后端 8080 端口，前端 5173 端口）：

```bash
./start.sh
```

访问地址：
- 后端 API: http://localhost:8080
- 前端界面: http://localhost:5173

## 配置方式

### 方式一：命令行参数

#### 修改端口

```bash
# 只修改后端端口
./start.sh --backend 9090

# 只修改前端端口
./start.sh --frontend 3000

# 同时修改前后端端口
./start.sh --backend 9090 --frontend 3000
```

#### 修改 IP 和端口

```bash
# 完整格式：HOST:PORT
./start.sh --backend 192.168.1.100:8080
./start.sh --frontend 0.0.0.0:5173

# 只指定端口（IP 默认为 0.0.0.0）
./start.sh --backend 9090
```

#### 指定 API 地址

当前后端和前端不在同一台机器时使用：

```bash
./start.sh --api-url http://192.168.1.100:8080
```

#### 完整示例

```bash
# 后端监听所有网卡的 9090 端口
# 前端监听所有网卡的 3000 端口
# API 地址指向实际的后端地址
./start.sh --backend 0.0.0.0:9090 --frontend 0.0.0.0:3000 --api-url http://192.168.1.100:9090
```

### 方式二：环境变量

```bash
# 设置环境变量后启动
BACKEND_PORT=9090 FRONTEND_PORT=3000 ./start.sh

# 或导出环境变量
export BACKEND_PORT=9090
export FRONTEND_PORT=3000
export API_BASE_URL=http://192.168.1.100:9090
./start.sh
```

#### 环境变量列表

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `BACKEND_HOST` | 后端绑定地址 | `0.0.0.0` |
| `BACKEND_PORT` | 后端端口 | `8080` |
| `FRONTEND_HOST` | 前端绑定地址 | `0.0.0.0` |
| `FRONTEND_PORT` | 前端端口 | `5173` |
| `API_BASE_URL` | API 基础 URL | `http://localhost:8080` |

### 方式三：配置文件

创建 `frontend/.env.development.local` 文件：

```bash
# 前端服务器配置
VITE_HOST=0.0.0.0
VITE_PORT=3000

# API 地址配置
VITE_API_BASE_URL=http://localhost:9090
```

然后正常启动：

```bash
./start.sh --backend 9090
```

注意：配置文件方式的优先级低于命令行参数。

## 常见使用场景

### 场景一：端口冲突

如果默认端口已被占用：

```bash
# 后端改用 9090，前端改用 3000
./start.sh --backend 9090 --frontend 3000
```

### 场景二：局域网访问

让局域网内其他设备访问：

```bash
# 监听所有网卡（0.0.0.0）
./start.sh --backend 0.0.0.0:8080 --frontend 0.0.0.0:5173

# 然后在其他设备访问
# 后端: http://YOUR_IP:8080
# 前端: http://YOUR_IP:5173
```

获取本机 IP：

```bash
# Linux/macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

### 场景三：前后端分离部署

前端和后端部署在不同服务器：

```bash
# 前端服务器
./start.sh --frontend 0.0.0.0:3000 --api-url http://backend-server:8080

# 后端服务器（另一台机器）
cd backend
PORT=8080 go run cmd/server/main.go
```

### 场景四：多实例运行

同时运行多个实例（需要不同端口）：

```bash
# 实例 1
./start.sh --backend 8080 --frontend 5173

# 实例 2（另一个终端）
./start.sh --backend 9090 --frontend 3000 --api-url http://localhost:9090
```

### 场景五：生产环境

生产环境建议使用固定配置文件：

1. **前端配置**（`frontend/.env.production`）：

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

2. **构建前端**：

```bash
cd frontend
npm run build
```

3. **运行后端**：

```bash
cd backend
# 使用配置文件
PORT=8080 ./whotakesshowers

# 或使用 docker
docker-compose up -d
```

## 命令行参数详解

### --backend

格式：`HOST:PORT` 或 `PORT`

示例：
- `--backend 0.0.0.0:8080` - 指定 IP 和端口
- `--backend 8080` - 只指定端口（IP 默认 0.0.0.0）
- `--backend 192.168.1.100:9090` - 指定特定 IP

### --frontend

格式：`HOST:PORT` 或 `PORT`

示例：
- `--frontend 0.0.0.0:5173` - 指定 IP 和端口
- `--frontend 3000` - 只指定端口
- `--frontend 127.0.0.1:5173` - 只允许本机访问

### --api-url

指定前端请求的后端 API 地址。

示例：
- `--api-url http://localhost:8080` - 本地开发
- `--api-url http://192.168.1.100:8080` - 局域网访问
- `--api-url https://api.example.com` - 生产环境

### -h, --help

显示帮助信息。

## 故障排查

### 1. 端口已被占用

**错误信息**：
```
bind: address already in use
```

**解决方法**：
```bash
# 查找占用端口的进程
# Linux/macOS
lsof -i :8080

# Windows
netstat -ano | findstr :8080

# 使用其他端口
./start.sh --backend 9090
```

### 2. 无法访问前端

**可能原因**：
- 防火墙阻止了端口
- 绑定到了 127.0.0.1（只允许本机访问）

**解决方法**：
```bash
# 绑定到所有网卡
./start.sh --frontend 0.0.0.0:5173

# 检查防火墙
# Linux (ufw)
sudo ufw allow 5173

# Linux (firewalld)
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --reload
```

### 3. 前端无法连接后端

**可能原因**：
- API 地址配置错误
- 后端未启动
- CORS 问题

**解决方法**：
```bash
# 检查后端是否运行
curl http://localhost:8080/api/projects

# 确认 API 地址配置
./start.sh --api-url http://localhost:8080

# 查看浏览器控制台错误
# 打开浏览器开发者工具 -> Console
```

### 4. 环境变量不生效

**可能原因**：
- 环境变量名称错误
- 配置文件格式错误

**解决方法**：
```bash
# 检查环境变量
echo $BACKEND_PORT
echo $FRONTEND_PORT

# 确认环境变量名称正确
# 注意：前端环境变量必须以 VITE_ 开头
```

## 高级配置

### 使用 systemd 服务（Linux）

创建服务文件 `/etc/systemd/system/whotakesshowers.service`：

```ini
[Unit]
Description=WhoTakesShowers Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/WhoTakesShowers
Environment="BACKEND_PORT=8080"
Environment="FRONTEND_PORT=5173"
ExecStart=/path/to/WhoTakesShowers/start.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start whotakesshowers
sudo systemctl enable whotakesshowers
```

### 使用 Docker Compose

修改 `docker-compose.yml`：

```yaml
services:
  whotakesshowers:
    ports:
      - "${BACKEND_PORT:-8080}:8080"
      - "${FRONTEND_PORT:-3000}:80"
    environment:
      - BACKEND_PORT=${BACKEND_PORT:-8080}
```

使用环境变量启动：

```bash
BACKEND_PORT=9090 FRONTEND_PORT=3000 docker-compose up -d
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 安全建议

1. **生产环境**：
   - 不要使用 `0.0.0.0` 监听所有网卡
   - 使用防火墙限制访问
   - 使用 HTTPS
   - 修改默认端口

2. **开发环境**：
   - 可以使用 `0.0.0.0` 方便调试
   - 保持默认端口即可
   - 使用 `127.0.0.1` 限制本机访问

3. **配置文件**：
   - 不要将敏感配置提交到 Git
   - 使用 `.env.local` 存储本地配置
   - 使用 `.env.production` 存储生产配置

## 参考资料

- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [Axios 配置](https://axios-http.com/docs/config_defaults)
- [Node.js 环境变量](https://nodejs.org/api/process.html#processenv)

## 更新日志

- **2025-01-05**: 添加自定义 IP 和端口支持
