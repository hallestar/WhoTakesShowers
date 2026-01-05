#!/bin/bash

echo "🔍 检查服务状态..."
echo ""

# 检查后端
echo "📦 检查后端服务 (端口 8080)..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 后端正在运行"
    # 测试API
    RESPONSE=$(curl -s http://localhost:8080/api/auth/me)
    if [[ $RESPONSE == *"未提供认证token"* ]]; then
        echo "   ✅ 后端API响应正常"
    else
        echo "   ⚠️  后端API响应异常: $RESPONSE"
    fi
else
    echo "   ❌ 后端未运行"
fi

echo ""

# 检查前端
echo "🎨 检查前端服务 (端口 5173)..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 前端正在运行"
    # 测试前端
    RESPONSE=$(curl -s http://localhost:5173)
    if [[ $RESPONSE == *"<!DOCTYPE html>"* ]] || [[ $RESPONSE == *"html"* ]]; then
        echo "   ✅ 前端页面响应正常"
    else
        echo "   ⚠️  前端页面响应异常"
    fi
else
    echo "   ❌ 前端未运行"
fi

echo ""

# 检查配置文件
echo "⚙️  检查配置文件..."
if [ -f "frontend/.env.development.local" ]; then
    echo "   ✅ 配置文件存在"
    API_URL=$(grep "VITE_API_BASE_URL" frontend/.env.development.local | cut -d'=' -f2)
    echo "   📍 API地址: $API_URL"
    
    if [[ $API_URL == http://* ]]; then
        echo "   ✅ URL格式正确（包含http://）"
    else
        echo "   ❌ URL格式错误（缺少http://协议）"
    fi
else
    echo "   ⚠️  配置文件不存在"
fi

echo ""

# 获取局域网IP
echo "📱 网络信息..."
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "未检测到")
if [ "$LOCAL_IP" != "未检测到" ]; then
    echo "   局域网IP: $LOCAL_IP"
    echo "   移动端访问: http://$LOCAL_IP:5173"
else
    echo "   ⚠️  无法获取局域网IP"
fi

echo ""
echo "🎯 测试建议："
echo "   1. 本地访问: http://localhost:5173"
echo "   2. 移动端访问: 使用 ./start.sh --lan 启动后访问显示的IP地址"
echo ""
