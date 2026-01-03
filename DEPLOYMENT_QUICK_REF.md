# 部署快速参考卡片

## 🚀 快速命令

### 一键部署
```bash
./deploy-all.sh
```

### 分步部署
```bash
./build-production.sh && ./deploy.sh
```

---

## ⚙️ 配置文件

### 1. 修改 `deploy.config.sh`

```bash
# 必须修改的配置
FRONTEND_REMOTE_HOST="192.168.1.100"  # 你的服务器IP
BACKEND_REMOTE_HOST="192.168.1.100"   # 你的服务器IP

# 可选配置
FRONTEND_REMOTE_USER="whotakesshowers"  # 用户名
BACKEND_REMOTE_USER="whotakesshowers"
BACKUP_BEFORE_DEPLOY=true               # 是否备份
RESTART_BACKEND=true                    # 是否重启服务
```

---

## 📋 首次部署流程

### 在开发机上执行

```bash
# 1. 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 2. 复制公钥到服务器
ssh-copy-id whotakesshowers@<服务器IP>

# 3. 修改部署配置
vim deploy.config.sh
```

### 在服务器上执行

```bash
# 4. 初始化服务器环境
sudo bash init-server.sh
```

### 在开发机上执行

```bash
# 5. 一键部署
./deploy-all.sh
```

---

## 🔧 故障排查

### 连接失败
```bash
# 测试SSH连接
ssh whotakesshowers@<服务器IP>

# 检查密钥
ls -la ~/.ssh/id_rsa.pub
```

### 权限问题
```bash
# 在服务器上检查权限
ls -la /var/www/whotakesshowers
ls -la /opt/whotakesshowers

# 修复权限
sudo chown -R whotakesshowers:whotakesshowers /opt/whotakesshowers
sudo chown -R www-data:www-data /var/www/whotakesshowers
```

### 服务未运行
```bash
# 在服务器上检查服务
sudo systemctl status whotakesshowers

# 查看日志
sudo journalctl -u whotakesshowers -f

# 重启服务
sudo systemctl restart whotakesshowers
```

### Nginx 502错误
```bash
# 测试后端API
curl http://localhost:8080/api/projects

# 检查Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

## 📊 监控命令

```bash
# 服务状态
sudo systemctl status whotakesshowers
sudo systemctl status nginx

# 实时日志
sudo journalctl -u whotakesshowers -f
sudo tail -f /var/log/nginx/access.log

# 磁盘使用
df -h
du -sh /opt/whotakesshowers/*
```

---

## 🔄 更新部署

### 代码更新后
```bash
# 简单三步
git pull
./deploy-all.sh
curl http://<服务器IP>/api/projects  # 验证
```

### 回滚部署
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

## 📞 获取帮助

详细文档：`DEPLOYMENT.md`
deploy目录：`deploy/README.md`

---

## ✅ 部署检查清单

部署前检查：
- [ ] 服务器IP已配置
- [ ] SSH免密登录已配置
- [ ] 前端已构建 (dist/目录存在)
- [ ] 后端已构建 (whotakesshowers文件存在)
- [ ] 服务器已初始化（首次）

部署后验证：
- [ ] 前端可访问: http://<服务器IP>/
- [ ] 后端API正常: curl http://<服务器IP>/api/projects
- [ ] 上传功能正常
- [ ] 服务开机自启已启用

---

## 💡 提示

- **快速开发**: 设置 `BACKUP_BEFORE_DEPLOY=false`
- **生产部署**: 保持 `BACKUP_BEFORE_DEPLOY=true`
- **测试部署**: 只部署前端 `DEPLOY_BACKEND=false`
- **批量部署**: 创建多个配置文件（如 `deploy.config.staging.sh`）

---

部署时间: 约2-3分钟（取决于网络速度）
