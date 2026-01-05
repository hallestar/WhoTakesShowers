# 问题修复总结

## 🐛 问题描述
运行 `start.sh` 后，访问前端 5173 端口只能看到网页底图，看不到实际内容。

## 🔍 根本原因

### 原因1：API配置缺少协议前缀
**问题文件**：`frontend/.env.development.local`

**错误配置**：
```bash
VITE_API_BASE_URL=192.168.10.247:8080/api
```

**正确配置**：
```bash
VITE_API_BASE_URL=http://192.168.10.247:8080/api
```

⚠️ **必须包含 `http://` 协议前缀，否则axios无法正确拼接URL！**

### 原因2：后端只监听localhost
后端默认监听 `127.0.0.1`，移动端无法访问。

已修改为监听 `0.0.0.0`，允许外部设备访问。

## ✅ 已完成的修复

### 1. 后端配置修改
- **文件**：`backend/cmd/server/main.go`
- **修改**：监听地址从 `:8080` 改为 `0.0.0.0:8080`
- **效果**：允许移动端访问

### 2. 前端配置修复
- **文件**：`frontend/.env.development.local`
- **修改**：添加 `http://` 协议前缀
- **效果**：axios可以正确连接后端API

### 3. start.sh 增强
- **新增参数**：`--lan` 自动使用局域网IP
- **自动检测**：自动获取本机局域网IP地址
- **友好提示**：显示移动端访问地址

### 4. 创建辅助脚本
- `test.sh` - 快速检测服务状态
- `QUICK_START.md` - 快速启动指南
- `NETWORK_SETUP.md` - 网络配置说明

## 🚀 使用方法

### 本地开发（仅电脑）
```bash
./start.sh
```
访问：`http://localhost:5173`

### 移动端访问（手机/平板）
```bash
./start.sh --lan
```
启动后会显示：
- 电脑访问：`http://localhost:5173`
- 移动端访问：`http://192.168.x.x:5173`（局域网IP）

### 手动启动

**后端：**
```bash
cd backend
go run cmd/server/main.go
```

**前端：**
```bash
cd frontend
npm run dev
```

## 🧪 测试检查

运行测试脚本检查所有服务：
```bash
./test.sh
```

检查项：
- ✅ 后端服务是否运行
- ✅ 前端服务是否运行
- ✅ API配置是否正确
- ✅ 后端API是否响应
- ✅ 局域网IP地址

## 📱 移动端访问步骤

1. **启动服务**
   ```bash
   ./start.sh --lan
   ```

2. **查看显示的IP地址**
   ```
   📱 移动端访问地址:
      前端: http://192.168.10.247:5173
      后端: http://192.168.10.247:8080
   ```

3. **确保移动端和电脑在同一WiFi**

4. **在移动端浏览器访问显示的IP地址**

5. **测试登录注册功能**
   - 注册新账户
   - 登录
   - 创建数据
   - 在其他设备登录验证数据同步

## ⚠️ 注意事项

### IP地址变化
局域网IP可能会变化（重启路由器后）：
1. 重新获取IP：`ipconfig getifaddr en0`
2. 重新运行：`./start.sh --lan`

### 防火墙设置
如果移动端无法连接：
- 检查防火墙设置
- 或临时关闭防火墙测试

### 配置文件
`frontend/.env.development.local` 会在每次运行 `start.sh` 时自动生成。

⚠️ **不要手动编辑此文件**，它会被自动覆盖。

## 🎯 验证修复

### 1. 检查配置文件
```bash
cat frontend/.env.development.local
```
应该看到：
```
VITE_API_BASE_URL=http://localhost:8080/api
```
或
```
VITE_API_BASE_URL=http://192.168.x.x:8080/api
```

### 2. 测试后端API
```bash
curl http://localhost:8080/api/auth/me
```
应该返回：
```json
{"error":"未提供认证token"}
```

### 3. 测试前端
```bash
curl http://localhost:5173
```
应该返回完整的HTML内容。

### 4. 测试局域网访问
```bash
curl http://192.168.10.247:8080/api/auth/me
```
应该返回：
```json
{"error":"未提供认证token"}
```

## 📚 相关文档

- `QUICK_START.md` - 快速启动指南
- `NETWORK_SETUP.md` - 网络配置详解
- `CLAUDE.md` - 项目开发文档

## 🆘 仍然有问题？

1. 运行 `./test.sh` 检查服务状态
2. 查看浏览器控制台的错误信息
3. 确认移动端和电脑在同一WiFi
4. 检查防火墙设置
5. 尝试重启所有服务

---

**修复日期**：2025-01-06  
**修复内容**：
- ✅ 后端监听 0.0.0.0
- ✅ 前端API URL添加协议前缀
- ✅ start.sh 支持 --lan 参数
- ✅ 自动检测局域网IP
- ✅ 创建测试和诊断脚本
