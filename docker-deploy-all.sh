#!/bin/bash
# Docker一键部署脚本 - 构建 + 部署

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "======================================"
echo "WhoTakesShowers Docker 一键部署"
echo "======================================"
echo ""

# 加载配置
source "${SCRIPT_DIR}/deploy-docker.config.sh"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker未安装，请先安装Docker"
    echo ""
    echo "安装Docker:"
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 步骤1: 构建
log_info "========== 步骤 1/2: 构建镜像 =========="
bash "${SCRIPT_DIR}/docker-deploy.sh" build

# 步骤2: 部署
log_info "========== 步骤 2/2: 部署容器 =========="
bash "${SCRIPT_DIR}/docker-deploy.sh" deploy

log_success "========== 部署成功！=========="
echo ""

# 显示访问信息
echo "访问地址:"
if [ -n "$DEPLOY_HOST" ]; then
    echo "  远程: http://${DEPLOY_HOST}"
    echo "  本地: http://${DEPLOY_HOST}:8080"
else
    echo "  本地: http://localhost:${HOST_PORT}"
fi

if command -v docker-compose &> /dev/null; then
    echo ""
    echo "使用Docker Compose:"
    echo "  启动: docker-compose up -d"
    echo "  停止: docker-compose down"
    echo "  日志: docker-compose logs -f"
fi

echo ""
echo "管理命令:"
echo "  查看日志: ./docker-deploy.sh logs"
echo "  查看状态: ./docker-deploy.sh status"
echo "  重启容器: ./docker-deploy.sh restart"
echo "  停止容器: ./docker-deploy.sh stop"
