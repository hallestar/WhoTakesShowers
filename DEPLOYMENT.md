# WhoTakesShowers 部署指南

## 部署方案概述

本项目使用 **rsync** 通过内网进行部署，支持快速、安全的文件同步和服务更新。

### 部署架构

```
开发机 (本地)                          内网服务器
├── frontend/dist/     ──rsync──>     /var/www/whotakesshowers/ (前端静态文件)
├── backend/whotakesshowers ──rsync──>  /opt/whotakesshowers/ (后端服务)
└── backend/uploads/    ──rsync──>     /opt/whotakesshowers/uploads/ (上传文件)
```

### 技术栈

- **前端**: React + Vite (静态文件)
- **后端**: Go (systemd服务)
- **Web服务器**: Nginx (反向代理)
- **数据库**: SQLite (文件数据库)

---

## 第一次部署：服务器初始化

### 1. 准备服务器

确保你的内网服务器满足以下要求：
- Ubuntu 20.04+ 或 Debian 11+
- 至少 512MB RAM
- 10GB 可用磁盘空间

### 2. 初始化服务器环境

**将 `deploy/init-server.sh` 复制到服务器并运行**：

```bash
# 在服务器上运行
sudo bash init-server.sh
```

此脚本会自动：
- 更新系统
- 安装 Nginx、rsync、Go
- 创建应用用户和目录
- 配置 Nginx 反向代理
- 启动 Nginx 服务

### 3. 配置免密登录

在开发机上执行：

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
ssh-copy-id whotakesshowers@<服务器IP>
```

或者手动配置：

```bash
# 在开发机上
cat ~/.ssh/id_rsa.pub

# 在服务器上
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "<复制的公钥内容>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 配置部署

### 1. 修改部署配置

编辑 `deploy.config.sh`，修改以下配置：

```bash
# 前端部署配置
FRONTEND_REMOTE_USER="whotakesshowers"     # 服务器用户名
FRONTEND_REMOTE_HOST="192.168.1.100"      # 服务器IP
FRONTEND_REMOTE_PATH="/var/www/whotakesshowers"

# 后端部署配置
BACKEND_REMOTE_USER="whotakesshowers"
BACKEND_REMOTE_HOST="192.168.1.100"
BACKEND_REMOTE_PATH="/opt/whotakesshowers"
BACKEND_SERVICE_NAME="whotakesshowers"

# 部署选项
DEPLOY_FRONTEND=true                     # 是否部署前端
DEPLOY_BACKEND=true                      # 是否部署后端
BACKUP_BEFORE_DEPLOY=true                # 部署前备份
RESTART_BACKEND=true                     # 重启后端服务
```

### 2. 配置systemd服务（可选）

如果需要自定义后端服务配置：

```bash
# 在服务器上创建systemd服务文件
sudo cp deploy/whotakesshowers.service /etc/systemd/system/

# 重载systemd配置
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable whotakesshowers
```

---

## 部署步骤

### 方式一：一键部署（推荐）

构建并部署所有内容：

```bash
# 在开发机上运行
chmod +x deploy-all.sh
./deploy-all.sh
```

### 方式二：分步部署

#### 1. 构建项目

```bash
chmod +x build-production.sh
./build-production.sh
```

这会：
- 安装前端依赖并构建
- 构建后端可执行文件

#### 2. 部署到服务器

```bash
chmod +x deploy.sh
./deploy.sh
```

这会：
- 备份远程文件（可选）
- 使用rsync同步文件
- 重启后端服务（可选）

---

## 部署脚本说明

### deploy.config.sh - 部署配置文件

包含所有部署相关的配置项：
- 服务器连接信息
- 部署路径
- rsync选项
- 备份和重启选项

### deploy.sh - 部署脚本

核心部署逻辑：
- 检查配置
- 备份远程文件
- rsync同步前端和后端
- 重启后端服务

### build-production.sh - 构建脚本

构建前端和后端：
- 前端: `npm run build`
- 后端: `go build`

### deploy-all.sh - 一键部署脚本

组合构建和部署：
- 运行构建脚本
- 确认配置
- 运行部署脚本

### init-server.sh - 服务器初始化脚本

在服务器上首次运行：
- 安装依赖
- 配置环境
- 设置权限

---

## Rsync 同步规则

### 默认排除的文件/目录

- `.git/` - Git仓库
- `node_modules/` - Node.js依赖
- `data/` - 本地开发数据库
- `.DS_Store` - macOS系统文件
- `dist/` - 前端构建目录（后端不需要）

### Rsync 选项

```bash
-a  # 归档模式，保留文件属性
-v  # 详细输出
-z  # 压缩传输
--delete  # 删除目标目录中源目录没有的文件
--progress  # 显示进度
```

---

## 验证部署

### 1. 检查前端

```bash
# 在浏览器中访问
http://<服务器IP>/
```

应该看到应用首页。

### 2. 检查后端

```bash
# 在服务器上检查服务状态
sudo systemctl status whotakesshowers

# 查看日志
sudo journalctl -u whotakesshowers -f

# 测试API
curl http://localhost:8080/api/projects
```

### 3. 检查Nginx

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 常见问题

### 1. SSH连接被拒绝

**问题**: `Permission denied (publickey)`

**解决**:
- 检查公钥是否已添加到服务器
- 确认服务器SSH配置允许公钥登录
- 检查用户名是否正确

### 2. 权限不足

**问题**: rsync同步时提示权限错误

**解决**:
- 确保用户有写入目标目录的权限
- 检查目录所有者: `ls -la /var/www/whotakesshowers`
- 必要时调整权限: `sudo chown -R whotakesshowers:whotakesshowers /opt/whotakesshowers`

### 3. 端口被占用

**问题**: 后端无法启动，提示端口8080被占用

**解决**:
```bash
# 查找占用端口的进程
sudo lsof -i :8080

# 杀死进程
sudo kill -9 <PID>

# 或修改后端代码使用其他端口
```

### 4. Nginx 502 Bad Gateway

**问题**: API请求失败

**解决**:
- 检查后端服务是否运行: `sudo systemctl status whotakesshowers`
- 检查后端端口是否正确: `netstat -tlnp | grep 8080`
- 检查Nginx配置: `sudo nginx -t`

### 5. 静态文件404

**问题**: 前端页面无法加载

**解决**:
- 确认前端文件已同步: `ls -la /var/www/whotakesshowers`
- 检查Nginx配置中的root路径
- 确认Nginx有读取权限: `namei -l /var/www/whotakesshowers`

---

## 高级配置

### 1. 多环境部署

创建多个配置文件：

```bash
deploy.config.sh          # 开发环境
deploy.config.prod.sh     # 生产环境
deploy.config.staging.sh  # 测试环境
```

使用时指定配置：

```bash
source deploy.config.prod.sh
./deploy.sh
```

### 2. 数据库迁移

如果需要迁移SQLite数据库：

```bash
# 在服务器上备份
cp /opt/whotakesshowers/data/whotakesshowers.db \
   /opt/whotakesshowers/data/whotakesshowers.db.backup

# 从开发机复制
scp backend/data/whotakesshowers.db \
   whotakesshowers@<服务器IP>:/opt/whotakesshowers/data/
```

### 3. 环境变量配置

在服务器上创建环境文件：

```bash
# /opt/whotakesshowers/.env
GIN_MODE=release
PORT=8080
DB_PATH=/opt/whotakesshowers/data/whotakesshowers.db
```

修改systemd服务使用环境文件：

```ini
[Service]
EnvironmentFile=/opt/whotakesshowers/.env
ExecStart=/opt/whotakesshowers/whotakesshowers
```

### 4. 日志管理

配置日志轮转：

```bash
# /etc/logrotate.d/whotakesshowers
/opt/whotakesshowers/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 whotakesshowers whotakesshowers
}
```

---

## 性能优化

### 1. 前端优化

已启用：
- 代码分割 (Vite自动)
- 静态资源缓存 (Nginx配置)
- Gzip压缩 (Nginx配置)

### 2. 后端优化

建议：
- 使用Gzip中间件
- 启用HTTP/2 (Nginx配置)
- 配置适当的缓存头

### 3. 网络优化

- rsync使用压缩传输 (`-z` 选项)
- 启用Nginx的sendfile
- 配置合理的keepalive超时

---

## 安全建议

### 1. 服务器安全

```bash
# 配置防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 禁用root登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2. 应用安全

- 使用专用用户运行应用（非root）
- 限制文件权限
- 定期更新系统和依赖
- 使用HTTPS (配置SSL证书)

### 3. 数据备份

定期备份：

```bash
# 在服务器上创建备份脚本
cat > /opt/backup-whotakesshowers.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/whotakesshowers"
mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/whotakesshowers/data/whotakesshowers.db \
   $BACKUP_DIR/whotakesshowers_$DATE.db

# 备份上传文件
rsync -av /opt/whotakesshowers/uploads/ \
   $BACKUP_DIR/uploads_$DATE/

# 保留最近7天的备份
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/backup-whotakesshowers.sh

# 添加到crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-whotakesshowers.sh") | crontab -
```

---

## 监控和维护

### 1. 服务状态监控

```bash
# 检查服务状态
sudo systemctl status whotakesshowers
sudo systemctl status nginx

# 设置开机自启
sudo systemctl enable whotakesshowers
sudo systemctl enable nginx
```

### 2. 日志查看

```bash
# 应用日志
sudo journalctl -u whotakesshowers -f

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 3. 磁盘空间监控

```bash
# 检查磁盘使用
df -h

# 查找大文件
du -sh /opt/whotakesshowers/* | sort -hr
```

---

## 更新部署

### 代码更新流程

1. 在本地修改代码
2. 运行测试: `npm test` (如果有)
3. 构建并部署: `./deploy-all.sh`
4. 验证更新

### 回滚部署

如果新版本有问题：

```bash
# 方式1: 从备份恢复
cd /opt/whotakesshowers
cp -r ../whotakesshowers_backup_<timestamp>/* .
sudo systemctl restart whotakesshowers

# 方式2: 重新部署旧版本
git checkout <旧版本commit>
./deploy-all.sh
```

---

## 故障排查清单

部署问题检查：

- [ ] SSH密钥已配置且可登录
- [ ] 服务器防火墙允许必要端口
- [ ] 部署配置文件中的IP和路径正确
- [ ] 前端已构建 (dist目录存在)
- [ ] 后端已构建 (可执行文件存在)
- [ ] Nginx配置已启用
- [ ] 后端服务正在运行
- [ ] 文件权限正确
- [ ] 端口未被占用
- [ ] 数据库文件可访问

---

## 附录：完整部署示例

### 典型部署流程示例

```bash
# 1. 初始化服务器（首次）
ssh root@192.168.1.100
# 上传并运行 init-server.sh
sudo bash init-server.sh
exit

# 2. 配置免密登录
ssh-copy-id whotakesshowers@192.168.1.100

# 3. 修改部署配置
vim deploy.config.sh
# 设置 FRONTEND_REMOTE_HOST=192.168.1.100
# 设置 BACKEND_REMOTE_HOST=192.168.1.100

# 4. 一键部署
./deploy-all.sh

# 5. 验证
curl http://192.168.1.100/api/projects
```

### 开发环境部署示例

```bash
# 开发环境部署（不备份，快速部署）
# 修改 deploy.config.sh
BACKUP_BEFORE_DEPLOY=false

# 部署
./deploy.sh
```

### 生产环境部署示例

```bash
# 生产环境部署（备份+重启）
# 修改 deploy.config.sh
BACKUP_BEFORE_DEPLOY=true
RESTART_BACKEND=true

# 部署
./deploy.sh

# 验证服务状态
ssh whotakesshowers@192.168.1.100 'sudo systemctl status whotakesshowers'
```
