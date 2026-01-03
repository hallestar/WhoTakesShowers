#!/bin/bash
# Docker服务器初始化脚本
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
echo "WhoTakesShowers Docker环境初始化"
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

# 安装Docker
if ! command -v docker &> /dev/null; then
    log_info "安装Docker..."

    # 安装依赖
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # 添加Docker官方GPG密钥
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # 设置Docker仓库
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # 安装Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io

    log_success "Docker安装完成"
else
    log_info "Docker已安装: $(docker --version)"
fi

# 安装Docker Compose（可选）
if ! command -v docker-compose &> /dev/null; then
    log_info "安装Docker Compose..."
    curl -SL https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-linux-x86_64 \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose安装完成"
else
    log_info "Docker Compose已安装: $(docker-compose --version)"
fi

# 启动Docker服务
log_info "启动Docker服务..."
systemctl start docker
systemctl enable docker

# 创建数据目录
log_info "创建数据目录..."
mkdir -p /opt/whotakesshowers/data
mkdir -p /opt/whotakesshowers/uploads
log_success "目录创建完成"

# 配置防火墙
log_info "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8080/tcp  # 应用端口
    ufw --force enable
    log_success "防火墙配置完成"
else
    log_warning "ufw未安装，跳过防火墙配置"
fi

# 安装Nginx（可选）
if ! command -v nginx &> /dev/null; then
    log_info "安装Nginx..."
    apt-get install -y nginx

    # 配置Nginx反向代理
    cat > /etc/nginx/sites-available/whotakesshowers << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

    # 测试配置
    nginx -t

    # 重启Nginx
    systemctl restart nginx
    systemctl enable nginx

    log_success "Nginx安装并配置完成"
else
    log_info "Nginx已安装，跳过"
fi

# 配置Docker用户（可选）
if ! id whotakesshowers &>/dev/null; then
    log_info "创建Docker应用用户..."
    useradd -r -s /bin/false whotakesshowers || true
    log_success "用户创建完成"
fi

log_success "========== 初始化完成！=========="
echo ""

log_info "接下来请："
echo "1. 配置免密登录: ssh-copy-id <user>@<server-ip>"
echo "2. 修改 deploy-docker.config.sh 配置文件"
echo "3. 运行部署脚本: ./docker-deploy.sh deploy"
echo ""
echo "Docker版本: $(docker --version)"
echo "Docker Compose版本: $(docker-compose --version 2>/dev/null || echo '未安装')"
