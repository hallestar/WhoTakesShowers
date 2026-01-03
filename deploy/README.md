# 部署文件目录

本目录包含用于部署WhoTakesShowers应用的配置和模板文件。

## 文件说明

### 配置文件

- `whotakesshowers.service` - systemd服务配置模板
  - 用于配置后端Go服务的自动启动和管理
  - 需要复制到服务器的 `/etc/systemd/system/` 目录

- `nginx.conf` - Nginx配置模板
  - 用于配置Web服务器和反向代理
  - 需要复制到服务器的 `/etc/nginx/sites-available/` 目录

### 脚本文件（位于项目根目录）

- `deploy.config.sh` - 部署配置
  - 定义服务器地址、路径、选项等

- `build-production.sh` - 构建脚本
  - 构建前端和后端

- `deploy.sh` - 部署脚本
  - 使用rsync同步文件到服务器

- `deploy-all.sh` - 一键部署脚本
  - 组合构建和部署

- `init-server.sh` - 服务器初始化脚本
  - 在新服务器上首次运行

## 快速开始

### 1. 首次部署到新服务器

```bash
# 步骤1: 在服务器上初始化
scp deploy/init-server.sh root@<服务器IP>:/root/
ssh root@<服务器IP> "bash /root/init-server.sh"

# 步骤2: 配置免密登录
ssh-copy-id whotakesshowers@<服务器IP>

# 步骤3: 修改部署配置
vim deploy.config.sh
# 修改 FRONTEND_REMOTE_HOST 和 BACKEND_REMOTE_HOST

# 步骤4: 一键部署
./deploy-all.sh
```

### 2. 日常更新部署

```bash
# 快速部署（已配置好）
./deploy-all.sh

# 或分步执行
./build-production.sh  # 构建
./deploy.sh            # 部署
```

## 配置说明

### deploy.config.sh 主要配置项

```bash
# 前端配置
FRONTEND_REMOTE_USER="用户名"
FRONTEND_REMOTE_HOST="服务器IP"
FRONTEND_REMOTE_PATH="/var/www/whotakesshowers"

# 后端配置
BACKEND_REMOTE_USER="用户名"
BACKEND_REMOTE_HOST="服务器IP"
BACKEND_REMOTE_PATH="/opt/whotakesshowers"
BACKEND_SERVICE_NAME="whotakesshowers"

# 部署选项
DEPLOY_FRONTEND=true          # 是否部署前端
DEPLOY_BACKEND=true           # 是否部署后端
BACKUP_BEFORE_DEPLOY=true     # 是否备份
RESTART_BACKEND=true          # 是否重启服务
```

## 手动配置服务（可选）

如果init-server.sh自动配置不适用，可以手动配置：

### 配置systemd服务

```bash
# 在服务器上
sudo cp deploy/whotakesshowers.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable whotakesshowers
```

### 配置Nginx

```bash
# 在服务器上
sudo cp deploy/nginx.conf /etc/nginx/sites-available/whotakesshowers
sudo ln -s /etc/nginx/sites-available/whotakesshowers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 故障排查

### 连接问题

```bash
# 测试SSH连接
ssh whotakesshowers@<服务器IP>

# 测试rsync
rsync -avz --dry-run /tmp/test whotakesshowers@<服务器IP>:/tmp/
```

### 服务问题

```bash
# 在服务器上检查服务状态
sudo systemctl status whotakesshowers

# 查看日志
sudo journalctl -u whotakesshowers -n 50

# 重启服务
sudo systemctl restart whotakesshowers
```

### Nginx问题

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx
```

## 更多信息

详细的部署指南请参考项目根目录的 `DEPLOYMENT.md`
