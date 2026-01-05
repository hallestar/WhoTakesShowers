#!/bin/bash

# 启动脚本 - 家庭争端解决器
# 支持通过环境变量或命令行参数配置 IP 和端口

# 默认配置
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_BASE_URL="${API_BASE_URL:-http://localhost:${BACKEND_PORT}}"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-host)
            BACKEND_HOST="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-host)
            FRONTEND_HOST="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --api-url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --backend HOST:PORT      后端绑定地址和端口 (默认: 0.0.0.0:8080)"
            echo "  --frontend HOST:PORT     前端绑定地址和端口 (默认: 0.0.0.0:5173)"
            echo "  --api-url URL            API 基础 URL (默认: http://localhost:8080)"
            echo "  -h, --help               显示此帮助信息"
            echo ""
            echo "环境变量:"
            echo "  BACKEND_HOST             后端主机地址 (默认: 0.0.0.0)"
            echo "  BACKEND_PORT             后端端口 (默认: 8080)"
            echo "  FRONTEND_HOST            前端主机地址 (默认: 0.0.0.0)"
            echo "  FRONTEND_PORT            前端端口 (默认: 5173)"
            echo "  API_BASE_URL             API 基础 URL"
            echo ""
            echo "示例:"
            echo "  $0                                    # 使用默认配置"
            echo "  $0 --backend 0.0.0.0:9090             # 后端使用 9090 端口"
            echo "  $0 --frontend 0.0.0.0:3000            # 前端使用 3000 端口"
            echo "  BACKEND_PORT=9090 $0                  # 通过环境变量设置"
            echo "  $0 --backend 0.0.0.0:9090 --frontend 0.0.0.0:3000"
            exit 0
            ;;
        --backend)
            if [[ $2 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$ ]]; then
                BACKEND_HOST=$(echo $2 | cut -d: -f1)
                BACKEND_PORT=$(echo $2 | cut -d: -f2)
            elif [[ $2 =~ ^[0-9]+$ ]]; then
                BACKEND_PORT=$2
            else
                echo "❌ 错误：无效的后端地址格式: $2"
                echo "   格式应为: HOST:PORT 或 PORT"
                exit 1
            fi
            shift 2
            ;;
        --frontend)
            if [[ $2 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$ ]]; then
                FRONTEND_HOST=$(echo $2 | cut -d: -f1)
                FRONTEND_PORT=$(echo $2 | cut -d: -f2)
            elif [[ $2 =~ ^[0-9]+$ ]]; then
                FRONTEND_PORT=$2
            else
                echo "❌ 错误：无效的前端地址格式: $2"
                echo "   格式应为: HOST:PORT 或 PORT"
                exit 1
            fi
            shift 2
            ;;
        *)
            echo "❌ 错误：未知参数 $1"
            echo "使用 -h 或 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

echo "🚀 启动家庭争端解决器..."
echo ""
echo "配置信息:"
echo "  后端: ${BACKEND_HOST}:${BACKEND_PORT}"
echo "  前端: ${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "  API: ${API_BASE_URL}"
echo ""

# 检查后端
if [ ! -d "backend" ]; then
    echo "❌ 错误：找不到 backend 目录"
    exit 1
fi

# 检查前端
if [ ! -d "frontend" ]; then
    echo "❌ 错误：找不到 frontend 目录"
    exit 1
fi

# 清理函数
cleanup() {
    echo ""
    echo "🛑 停止服务..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # 清理临时文件
    rm -f frontend/.env.development.local
    exit 0
}

# 注册清理函数
trap cleanup INT TERM

# 创建前端临时环境变量文件
cat > frontend/.env.development.local << EOF
# 自动生成的配置文件 - 请勿手动编辑
VITE_API_BASE_URL=${API_BASE_URL}
EOF

# 启动后端
echo "📦 启动后端服务..."
cd backend
PORT=$BACKEND_PORT go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 3

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 错误：后端启动失败"
    cleanup
fi

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
VITE_HOST=$FRONTEND_HOST VITE_PORT=$FRONTEND_PORT npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 2

# 检查前端是否启动成功
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ 错误：前端启动失败"
    cleanup
fi

echo ""
echo "✅ 服务启动成功！"
echo ""
echo "访问地址:"
if [ "$BACKEND_HOST" = "0.0.0.0" ]; then
    echo "   后端 API: http://localhost:${BACKEND_PORT}"
else
    echo "   后端 API: http://${BACKEND_HOST}:${BACKEND_PORT}"
fi

if [ "$FRONTEND_HOST" = "0.0.0.0" ]; then
    echo "   前端界面: http://localhost:${FRONTEND_PORT}"
else
    echo "   前端界面: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
fi
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
