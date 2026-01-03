#!/bin/bash
# 服务器初始化脚本
# 在目标服务器上首次部署前运行此脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "======================================"
echo "WhoTakesShowers 服务器初始化"
echo "======================================"
echo ""

# 检查是否为root
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root权限运行此脚本"
    exit 1
fi

# 更新系统
log_info "更新系统软件包..."
apt update && apt upgrade -y

# 安装必要的软件
log_info "安装必要的软件..."
# apt install -y nginx rsync sqlite3

# 安装Go (如果需要)
if ! command -v go &> /dev/null; then
    log_info "安装Go语言环境..."
    wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
    rm -rf /usr/local/go && tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    export PATH=$PATH:/usr/local/go/bin
fi

# 创建应用用户
log_info "创建应用用户..."
useradd -r -s /bin/false whotakesshowers || true

# 创建目录
log_info "创建目录..."
mkdir -p /var/www/whotakesshowers
mkdir -p /opt/whotakesshowers
mkdir -p /opt/whotakesshowers/uploads
mkdir -p /opt/whotakesshowers/data

# 设置权限
log_info "设置权限..."
chown -R whotakesshowers:whotakesshowers /opt/whotakesshowers
chown -R www-data:www-data /var/www/whotakesshowers

# 配置Nginx
log_info "配置Nginx..."
cat > /etc/nginx/sites-available/whotakesshowers << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/whotakesshowers;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8080/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
EOF

ln -sf /etc/nginx/sites-available/whotakesshowers /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

log_success "服务器初始化完成！"
echo ""

log_info "接下来请："
echo "1. 配置免密登录: ssh-copy-id whotakesshowers@<服务器IP>"
echo "2. 修改 deploy.config.sh 中的服务器配置"
echo "3. 运行部署脚本: ./deploy-all.sh"
