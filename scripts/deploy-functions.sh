#!/bin/bash

# Edge Functions 部署脚本

echo "🚀 开始部署 Edge Functions..."

# 检查是否安装了 supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "请运行: npm install -g supabase"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -d "supabase/functions" ]; then
    echo "❌ 未找到 supabase/functions 目录"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 部署函数列表
functions=("get-history" "place-bet" "draw-lottery" "manage-balance" "scheduled-lottery")

echo "📦 准备部署以下函数:"
for func in "${functions[@]}"; do
    echo "  - $func"
done

echo ""

# 逐个部署函数
for func in "${functions[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "🔄 部署函数: $func"
        if supabase functions deploy $func; then
            echo "✅ $func 部署成功"
        else
            echo "❌ $func 部署失败"
        fi
    else
        echo "⚠️  跳过不存在的函数: $func"
    fi
    echo ""
done

echo "🎉 Edge Functions 部署完成！"
echo ""
echo "📋 下一步:"
echo "1. 在 Supabase Dashboard 中检查函数状态"
echo "2. 测试 API 连接: http://localhost:3000/api-test.html"
echo "3. 如有 CORS 问题，检查 Dashboard > Settings > API"
