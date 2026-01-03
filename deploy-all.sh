#!/bin/bash
# 一键部署脚本 - 构建 + 部署
# 用于快速部署到内网服务器

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "======================================"
echo "WhoTakesShowers 一键部署"
echo "======================================"
echo ""

# 步骤1: 构建
log_step "步骤 1/3: 构建项目"

log_info "构建前端和后端..."
bash "${SCRIPT_DIR}/build-production.sh"

log_success "构建完成"

# 步骤2: 确认部署
log_step "步骤 2/3: 确认部署配置"

# 显示配置
source "${SCRIPT_DIR}/deploy.config.sh"

echo "部署配置:"
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "  ✓ 前端: ${FRONTEND_REMOTE_USER}@${FRONTEND_REMOTE_HOST} -> ${FRONTEND_REMOTE_PATH}"
else
    echo "  ✗ 前端: 跳过"
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    echo "  ✓ 后端: ${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST} -> ${BACKEND_REMOTE_PATH}"
else
    echo "  ✗ 后端: 跳过"
fi

echo ""

read -p "确认部署？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}部署已取消${NC}"
    exit 0
fi

# 步骤3: 部署
log_step "步骤 3/3: 部署到服务器"

bash "${SCRIPT_DIR}/deploy.sh"

log_success "========== 部署成功！=========="
echo ""

# 显示访问信息
echo "访问地址:"
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "  前端: http://${FRONTEND_REMOTE_HOST}"
fi
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "  后端: http://${BACKEND_REMOTE_HOST}:8080"
fi
echo ""
echo "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
