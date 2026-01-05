# 快速启动指南

## 问题：只能看到网页底图

**原因**：API配置缺少 `http://` 协议前缀，导致前端无法正确连接后端。

## 解决方案

### 方式1：使用 start.sh（推荐）

#### 本地开发（仅电脑访问）
```bash
./start.sh
```

#### 移动端访问（支持手机/平板）
```bash
./start.sh --lan
```

启动后会显示：
- 电脑访问地址：`http://localhost:5173`
- 移动端访问地址：`http://192.168.x.x:5173`（局域网IP）

### 方式2：手动启动

**后端：**
```bash
cd backend
go run cmd/server/main.go
```

**前端（本地访问）：**
```bash
cd frontend
npm run dev
```

**前端（移动端可访问）：**
```bash
cd frontend
npm run dev -- --host
```

## 配置说明

### 前端配置文件
文件：`frontend/.env.development.local`

**本地访问配置：**
```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

**局域网访问配置（移动端）：**
```bash
VITE_API_BASE_URL=http://192.168.10.247:8080/api
```

⚠️ **重要**：URL必须包含 `http://` 协议前缀！

## 获取局域网IP

### macOS
```bash
ipconfig getifaddr en0
```

### Linux
```bash
hostname -I | awk '{print $1}'
```

## 常见问题

### Q: 只能看到网页底图，看不到内容？
**A**: 检查前端配置文件 `.env.development.local`，确保 `VITE_API_BASE_URL` 包含完整的协议和端口：
```
VITE_API_BASE_URL=http://192.168.10.247:8080/api
```

### Q: 移动端显示"Network Error"？
**A**: 
1. 确保移动端和电脑在同一WiFi
2. 使用 `./start.sh --lan` 启动
3. 访问显示的局域网IP地址（如 `http://192.168.10.247:5173`）

### Q: 修改配置后不生效？
**A**: 
1. 停止服务（Ctrl+C）
2. 删除 `frontend/.env.development.local`
3. 重新运行 `./start.sh --lan`

### Q: IP地址变了怎么办？
**A**: 
1. 重新获取IP：`ipconfig getifaddr en0`
2. 重新运行：`./start.sh --lan`

## 验证服务

### 检查后端
```bash
curl http://localhost:8080/api/auth/me
# 预期返回：{"error":"未提供认证token"}
```

### 检查前端
```bash
curl http://localhost:5173
# 预期返回：HTML内容
```

### 检查局域网访问
```bash
curl http://192.168.10.247:8080/api/auth/me
# 预期返回：{"error":"未提供认证token"}
```

## 防火墙设置

如果移动端仍无法连接：

**macOS**：
- 系统偏好设置 → 安全性与隐私 → 防火墙
- 确保防火墙允许传入连接

**临时关闭防火墙测试**：
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**重新启用防火墙**：
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```
