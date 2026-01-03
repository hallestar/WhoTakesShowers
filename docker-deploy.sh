#!/bin/bash
# Docker部署脚本
# 使用Docker容器部署到服务器

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 加载配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deploy-docker.config.sh"

show_banner() {
    echo ""
    echo "======================================"
    echo " WhoTakesShowers Docker 部署工具"
    echo "======================================"
    echo ""
}

check_docker() {
    log_info "检查Docker环境..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if [ "$USE_DOCKER_COMPOSE" = true ] && ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose未安装"
        exit 1
    fi

    log_success "Docker环境检查通过"
}

build_image() {
    log_info "========== 构建Docker镜像 =========="

    local image_name="${IMAGE_NAME}:${IMAGE_TAG}"
    local image_name_latest="${IMAGE_NAME}:latest"

    log_info "构建镜像: ${image_name}"

    docker build \
        -t "${image_name}" \
        -t "${image_name_latest}" \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
        .

    log_success "镜像构建完成"
}

save_image() {
    if [ "$SAVE_IMAGE" != true ]; then
        return
    fi

    log_info "========== 导出Docker镜像 =========="

    local image_name="${IMAGE_NAME}:${IMAGE_TAG}"
    local tar_file="${IMAGE_NAME}-${IMAGE_TAG}.tar"

    log_info "导出镜像到: ${tar_file}"
    docker save "${image_name}" -o "${tar_file}"

    log_success "镜像已导出"
    log_info "镜像大小: $(du -h "${tar_file}" | cut -f1)"
}

push_image() {
    if [ "$PUSH_TO_REGISTRY" = true ]; then
        log_info "========== 推送镜像到仓库 =========="

        local image_name="${IMAGE_NAME}:${IMAGE_TAG}"
        local image_name_latest="${IMAGE_NAME}:latest"

        log_info "推送镜像到: ${REGISTRY_URL}/${image_name}"

        docker tag "${image_name}" "${REGISTRY_URL}/${image_name}"
        docker tag "${image_name_latest}" "${REGISTRY_URL}/${image_name_latest}"

        docker push "${REGISTRY_URL}/${image_name}"
        docker push "${REGISTRY_URL}/${image_name_latest}"

        log_success "镜像推送完成"
    fi
}

deploy_container() {
    log_info "========== 部署容器到服务器 =========="

    local image_name="${IMAGE_NAME}:${IMAGE_TAG}"

    # 检查是否需要远程部署
    if [ -n "$DEPLOY_HOST" ]; then
        deploy_remote
    else
        deploy_local
    fi
}

deploy_local() {
    log_info "本地部署容器..."

    # 停止旧容器
    if docker ps -a -q -f name="${CONTAINER_NAME}" | grep -q .; then
        log_info "停止旧容器..."
        docker stop "${CONTAINER_NAME}"
        docker rm "${CONTAINER_NAME}"
    fi

    # 删除旧镜像（可选）
    if [ "$REMOVE_OLD_IMAGE" = true ]; then
        log_info "删除旧镜像..."
        docker rmi "${IMAGE_NAME}:old" 2>/dev/null || true
        docker tag "${image_name}" "${IMAGE_NAME}:old" 2>/dev/null || true
    fi

    # 运行新容器
    log_info "启动新容器..."
    docker run -d \
        --name "${CONTAINER_NAME}" \
        --restart unless-stopped \
        -p "${HOST_PORT}:8080" \
        -v "${PWD}/data:/app/data" \
        -v "${PWD}/uploads:/app/uploads" \
        -e GIN_MODE=release \
        -e TZ=Asia/Shanghai \
        "${image_name}"

    # 等待容器启动
    log_info "等待容器启动..."
    sleep 5

    # 检查容器状态
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        log_success "容器启动成功"
        docker ps -f --filter "name=${CONTAINER_NAME}"
    else
        log_error "容器启动失败"
        docker logs "${CONTAINER_NAME}"
        exit 1
    fi
}

deploy_remote() {
    log_info "远程部署到: ${DEPLOY_USER}@${DEPLOY_HOST}"

    # 保存镜像
    local tar_file="${IMAGE_NAME}-${IMAGE_TAG}.tar"
    if [ ! -f "$tar_file" ]; then
        save_image
    fi

    # 传输镜像到服务器
    log_info "传输镜像到服务器..."
    scp "${tar_file}" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/"

    # 在服务器上加载镜像
    log_info "在服务器上加载镜像..."
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << 'ENDSSH'
set -e

# 停止旧容器
if docker ps -a -q -f name="whotakesshowers" | grep -q .; then
    docker stop whotakesshowers
    docker rm whotakesshowers
fi

# 加载新镜像
docker load -i /tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar

# 运行新容器
docker run -d \
    --name whotakesshowers \
    --restart unless-stopped \
    -p 8080:8080 \
    -v /opt/whotakesshowers/data:/app/data \
    -v /opt/whotakesshowers/uploads:/app/uploads \
    -e GIN_MODE=release \
    -e TZ=Asia/Shanghai \
    ${IMAGE_NAME}:${IMAGE_TAG}

# 清理临时文件
rm -f /tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar

# 检查容器状态
sleep 3
if docker ps | grep -q whotakesshowers; then
    echo "容器部署成功"
    docker ps | grep whotakesshowers
else
    echo "容器部署失败"
    docker logs whotakesshowers
    exit 1
fi
ENDSSH

    log_success "远程部署完成"
}

show_logs() {
    log_info "查看容器日志..."
    if [ -n "$DEPLOY_HOST" ]; then
        ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker logs -f whotakesshowers"
    else
        docker logs -f "${CONTAINER_NAME}"
    fi
}

stop_container() {
    log_info "停止容器..."
    if [ -n "$DEPLOY_HOST" ]; then
        ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker stop whotakesshowers && docker rm whotakesshowers"
        log_success "远程容器已停止"
    else
        if docker ps -a -q -f name="${CONTAINER_NAME}" | grep -q .; then
            docker stop "${CONTAINER_NAME}"
            docker rm "${CONTAINER_NAME}"
            log_success "本地容器已停止"
        else
            log_warning "容器未运行"
        fi
    fi
}

restart_container() {
    log_info "重启容器..."
    if [ -n "$DEPLOY_HOST" ]; then
        ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker restart whotakesshowers"
    else
        docker restart "${CONTAINER_NAME}"
    fi
    log_success "容器已重启"
}

show_status() {
    log_info "容器状态:"
    echo ""
    if [ -n "$DEPLOY_HOST" ]; then
        ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker ps | grep whotakesshowers || echo '容器未运行'"
        echo ""
        ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker stats whotakesshowers --no-stream 2>/dev/null || echo '无法获取统计信息'"
    else
        docker ps -a | grep whotakesshowers || echo '容器未运行'
        echo ""
        docker stats "${CONTAINER_NAME}" --no-stream 2>/dev/null || echo '无法获取统计信息'
    fi
}

cleanup() {
    log_info "清理未使用的镜像和容器..."
    docker system prune -f
    log_success "清理完成"
}

# 主函数
main() {
    show_banner

    case "$1" in
        build)
            check_docker
            build_image
            save_image
            push_image
            ;;
        deploy)
            check_docker
            build_image
            deploy_container
            log_success "========== 部署完成！=========="
            echo ""
            echo "访问地址: http://localhost:${HOST_PORT}"
            if [ -n "$DEPLOY_HOST" ]; then
                echo "远程地址: http://${DEPLOY_HOST}"
            fi
            ;;
        local-deploy)
            check_docker
            build_image
            DEPLOY_HOST="" deploy_local
            log_success "========== 部署完成！=========="
            echo ""
            echo "访问地址: http://localhost:${HOST_PORT}"
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "用法: $0 {build|deploy|local-deploy|stop|restart|logs|status|cleanup}"
            echo ""
            echo "命令说明:"
            echo "  build         - 构建Docker镜像"
            echo "  deploy        - 部署容器（到服务器或本地）"
            echo "  local-deploy  - 仅本地部署"
            echo "  stop          - 停止容器"
            echo "  restart       - 重启容器"
            echo "  logs          - 查看日志"
            echo "  status        - 查看状态"
            echo "  cleanup       - 清理未使用的资源"
            echo ""
            echo "配置文件: deploy-docker.config.sh"
            exit 1
            ;;
    esac
}

main "$@"
