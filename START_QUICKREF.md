# 启动配置快速参考

## 快速使用

```bash
# 默认配置启动（后端 8080，前端 5173）
./start.sh

# 查看帮助
./start.sh --help

# 修改端口
./start.sh --backend 9090 --frontend 3000

# 局域网访问
./start.sh --backend 0.0.0.0:8080 --frontend 0.0.0.0:5173

# 前后端分离（API 地址）
./start.sh --api-url http://192.168.1.100:8080
```

## 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--backend HOST:PORT` | 后端地址 | `--backend 0.0.0.0:9090` |
| `--frontend HOST:PORT` | 前端地址 | `--frontend 0.0.0.0:3000` |
| `--api-url URL` | API 地址 | `--api-url http://localhost:8080` |
| `-h, --help` | 帮助信息 | `--help` |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BACKEND_HOST` | 后端主机 | `0.0.0.0` |
| `BACKEND_PORT` | 后端端口 | `8080` |
| `FRONTEND_HOST` | 前端主机 | `0.0.0.0` |
| `FRONTEND_PORT` | 前端端口 | `5173` |
| `API_BASE_URL` | API 地址 | `http://localhost:8080` |

## 使用示例

### 环境变量方式

```bash
BACKEND_PORT=9090 FRONTEND_PORT=3000 ./start.sh
```

### 配置文件方式

创建 `frontend/.env.development.local`：

```env
VITE_HOST=0.0.0.0
VITE_PORT=3000
VITE_API_BASE_URL=http://localhost:9090
```

### 常见场景

```bash
# 端口冲突
./start.sh --backend 9090 --frontend 3000

# 局域网访问
./start.sh --backend 0.0.0.0:8080 --frontend 0.0.0.0:5173

# 前后端不同服务器
./start.sh --frontend 0.0.0.0:3000 --api-url http://backend-server:8080
```

## 默认地址

- 后端 API: `http://localhost:8080`
- 前端界面: `http://localhost:5173`

## 详细文档

查看完整文档：[START_CONFIG.md](./START_CONFIG.md)
