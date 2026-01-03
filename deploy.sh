#!/bin/bash
# WhoTakesShowers 部署脚本
# 使用rsync通过内网部署到服务器

set -e  # 遇到错误立即退出

# 加载配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deploy.config.sh"

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查配置
check_config() {
    log_info "检查部署配置..."

    if [ "$DEPLOY_FRONTEND" = true ] && [ -z "$FRONTEND_REMOTE_HOST" ]; then
        log_error "前端部署未配置服务器IP"
        exit 1
    fi

    if [ "$DEPLOY_BACKEND" = true ] && [ -z "$BACKEND_REMOTE_HOST" ]; then
        log_error "后端部署未配置服务器IP"
        exit 1
    fi

    log_success "配置检查通过"
}

# 备份远程文件
backup_remote() {
    local remote_user=$1
    local remote_host=$2
    local remote_path=$3
    local service_name=$4

    if [ "$BACKUP_BEFORE_DEPLOY" != true ]; then
        return
    fi

    log_info "备份远程文件..."

    local backup_dir="${remote_path}_backup_$(date +%Y%m%d_%H%M%S)"
    ssh "${remote_user}@${remote_host}" "mkdir -p ${backup_dir} && cp -r ${remote_path}/* ${backup_dir}/ 2>/dev/null || true"

    if [ -n "$service_name" ]; then
        log_info "备份已完成: ${backup_dir}"
    fi
}

# 部署前端
deploy_frontend() {
    if [ "$DEPLOY_FRONTEND" != true ]; then
        log_warning "跳过前端部署"
        return
    fi

    log_info "========== 开始部署前端 =========="

    # 检查构建目录
    if [ ! -d "$FRONTEND_BUILD_DIR" ]; then
        log_error "前端构建目录不存在: $FRONTEND_BUILD_DIR"
        log_info "请先运行: ./build-production.sh"
        exit 1
    fi

    # 备份
    backup_remote "$FRONTEND_REMOTE_USER" "$FRONTEND_REMOTE_HOST" "$FRONTEND_REMOTE_PATH" ""

    # 创建远程目录
    log_info "创建远程目录..."
    ssh "${FRONTEND_REMOTE_USER}@${FRONTEND_REMOTE_HOST}" "mkdir -p ${FRONTEND_REMOTE_PATH}"

    # 使用rsync同步文件
    log_info "同步前端文件到 ${FRONTEND_REMOTE_USER}@${FRONTEND_REMOTE_HOST}:${FRONTEND_REMOTE_PATH}"
    rsync $RSYNC_OPTIONS $EXCLUDE_FILES \
        "${FRONTEND_BUILD_DIR}/" \
        "${FRONTEND_REMOTE_USER}@${FRONTEND_REMOTE_HOST}:${FRONTEND_REMOTE_PATH}/"

    log_success "前端部署完成！"
}

# 部署后端
deploy_backend() {
    if [ "$DEPLOY_BACKEND" != true ]; then
        log_warning "跳过后端部署"
        return
    fi

    log_info "========== 开始部署后端 =========="

    # 构建后端
    log_info "构建后端可执行文件..."
    cd backend
    go build -o whotakesshowers cmd/server/main.go
    cd ..

    if [ ! -f "backend/whotakesshowers" ]; then
        log_error "后端构建失败"
        exit 1
    fi

    # 备份
    backup_remote "$BACKEND_REMOTE_USER" "$BACKEND_REMOTE_HOST" "$BACKEND_REMOTE_PATH" "$BACKEND_SERVICE_NAME"

    # 创建远程目录
    log_info "创建远程目录..."
    ssh "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}" "mkdir -p ${BACKEND_REMOTE_PATH}"

    # 同步可执行文件
    log_info "同步后端可执行文件..."
    rsync -avz --progress \
        "backend/whotakesshowers" \
        "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}:${BACKEND_REMOTE_PATH}/"

    # 同步上传目录（如果存在）
    if [ -d "backend/uploads" ]; then
        log_info "同步上传文件目录..."
        ssh "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}" "mkdir -p ${BACKEND_REMOTE_PATH}/uploads"
        rsync -avz --progress \
            "backend/uploads/" \
            "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}:${BACKEND_REMOTE_PATH}/uploads/"
    fi

    # 设置执行权限
    log_info "设置执行权限..."
    ssh "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}" "chmod +x ${BACKEND_REMOTE_PATH}/whotakesshowers"

    # 重启服务
    if [ "$RESTART_BACKEND" = true ]; then
        log_info "重启后端服务..."
        ssh "${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}" "sudo systemctl restart ${BACKEND_SERVICE_NAME}"
        log_success "后端服务已重启"
    else
        log_warning "未自动重启服务，请手动重启: ssh ${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST} 'sudo systemctl restart ${BACKEND_SERVICE_NAME}'"
    fi

    log_success "后端部署完成！"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "======================================"
    echo "部署信息"
    echo "======================================"
    if [ "$DEPLOY_FRONTEND" = true ]; then
        echo "前端: ${FRONTEND_REMOTE_USER}@${FRONTEND_REMOTE_HOST}:${FRONTEND_REMOTE_PATH}"
    fi
    if [ "$DEPLOY_BACKEND" = true ]; then
        echo "后端: ${BACKEND_REMOTE_USER}@${BACKEND_REMOTE_HOST}:${BACKEND_REMOTE_PATH}"
    fi
    echo "======================================"
    echo ""
}

# 主函数
main() {
    echo "======================================"
    echo "WhoTakesShowers 部署脚本"
    echo "======================================"
    echo ""

    # 检查配置
    check_config

    # 显示部署信息
    show_deployment_info

    # 确认部署
    read -p "确认部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "部署已取消"
        exit 0
    fi

    # 部署
    deploy_frontend
    echo ""
    deploy_backend

    echo ""
    log_success "========== 部署完成！=========="
    echo ""

    # 显示访问信息
    if [ "$DEPLOY_FRONTEND" = true ]; then
        echo "前端访问地址: http://${FRONTEND_REMOTE_HOST}"
    fi
    if [ "$DEPLOY_BACKEND" = true ]; then
        echo "后端API地址: http://${BACKEND_REMOTE_HOST}:8080"
    fi
}

# 运行主函数
main "$@"
