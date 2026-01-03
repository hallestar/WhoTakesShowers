#!/bin/bash

# 启动脚本 - 家庭争端解决器

echo "🚀 启动家庭争端解决器..."
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

# 启动后端
echo "📦 启动后端服务..."
cd backend
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务启动成功！"
echo "   后端: http://localhost:8080"
echo "   前端: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT

wait
