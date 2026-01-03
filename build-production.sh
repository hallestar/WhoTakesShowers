#!/bin/bash
# 生产环境构建脚本
# 在部署前运行此脚本构建前端和后端

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo "======================================"
echo "WhoTakesShowers 生产构建"
echo "======================================"
echo ""

# 构建前端
log_info "========== 开始构建前端 =========="
cd frontend
log_info "安装依赖..."
npm install
log_info "构建生产版本..."
npm run build
cd ..
log_success "前端构建完成！"
echo ""

# 构建后端
log_info "========== 开始构建后端 =========="
cd backend
log_info "下载依赖..."
go mod download
log_info "构建可执行文件..."
go build -o whotakesshowers cmd/server/main.go
cd ..
log_success "后端构建完成！"
echo ""

log_success "========== 构建完成！=========="
echo ""
echo "构建产物:"
echo "  前端: frontend/dist/"
echo "  后端: backend/whotakesshowers"
echo ""
echo "现在可以运行部署脚本:"
echo "  ./deploy.sh"
