#!/bin/bash

# 中世纪风格赌坊游戏 Supabase 设置脚本

set -e

echo "🎮 开始设置中世纪风格赌坊游戏 Supabase 项目..."

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装，请先安装："
    echo "npm install -g supabase"
    echo "或访问: https://supabase.com/docs/guides/cli"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "task.md" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 复制环境变量模板..."
        cp .env.example .env
        echo "⚠️  请编辑 .env 文件并填入正确的 Supabase 配置"
    else
        echo "❌ 未找到 .env.example 文件"
        exit 1
    fi
fi

# 部署数据库结构函数
deploy_database() {
    echo "📊 开始部署数据库结构..."

    # 检查数据库文件是否存在
    if [ ! -f "database/schema.sql" ]; then
        echo "❌ 未找到 database/schema.sql 文件"
        exit 1
    fi

    # 检查是否有本地 Supabase 实例运行
    if ! supabase status > /dev/null 2>&1; then
        echo "❌ 本地 Supabase 未运行，请先运行 'supabase start'"
        exit 1
    fi

    echo "1️⃣ 获取数据库连接信息..."
    DB_URL=$(supabase status | grep 'DB URL' | awk '{print $3}')

    if [ -z "$DB_URL" ]; then
        echo "❌ 无法获取数据库连接 URL"
        exit 1
    fi

    echo "2️⃣ 执行数据库脚本..."
    echo "执行 schema.sql..."
    psql "$DB_URL" -f database/schema.sql

    echo "执行 functions.sql..."
    psql "$DB_URL" -f database/functions.sql

    echo "执行 security.sql..."
    psql "$DB_URL" -f database/security.sql

    echo "✅ 数据库结构部署完成"
}

# 部署 Edge Functions 函数
deploy_functions() {
    echo "⚡ 开始部署 Edge Functions..."

    # 检查函数目录是否存在
    if [ ! -d "supabase/functions" ]; then
        echo "❌ 未找到 supabase/functions 目录"
        exit 1
    fi

    # 部署各个函数
    functions=("place-bet" "draw-lottery" "get-history" "manage-balance" "scheduled-lottery")

    for func in "${functions[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            echo "📦 部署函数: $func"
            supabase functions deploy $func
        else
            echo "⚠️  跳过不存在的函数: $func"
        fi
    done

    echo "✅ Edge Functions 部署完成"
}

# 完整设置函数
full_setup() {
    echo "🎯 开始完整设置..."

    # 1. 初始化或启动本地项目
    if [ ! -f "supabase/config.toml" ]; then
        echo "1️⃣ 初始化 Supabase 项目..."
        supabase init
    fi

    echo "2️⃣ 启动本地 Supabase..."
    supabase start

    # 3. 部署数据库
    echo "3️⃣ 部署数据库结构..."
    deploy_database

    # 4. 部署函数
    echo "4️⃣ 部署 Edge Functions..."
    deploy_functions

    # 5. 设置定时任务
    echo "5️⃣ 设置定时开奖任务..."
    setup_cron_job

    # 6. 显示配置信息
    echo ""
    echo "🎉 完整设置完成！"
    echo ""
    echo "📋 配置信息："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    supabase status
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔧 下一步操作："
    echo "1. 更新 .env 文件中的 Supabase 配置"
    echo "2. 更新 web/config.js 中的前端配置"
    echo "3. 启动前端应用: cd web && python -m http.server 3000"
    echo "4. 访问应用: http://localhost:3000"
    echo ""
    echo "📚 有用的命令："
    echo "- 查看日志: supabase functions logs"
    echo "- 重置数据库: supabase db reset"
    echo "- 停止服务: supabase stop"
    echo ""
}

# 设置定时任务
setup_cron_job() {
    echo "⏰ 设置定时开奖任务..."

    # 创建定时任务脚本
    cat > scripts/lottery-cron.sh << 'EOF'
#!/bin/bash
# 定时开奖脚本

# 获取 Supabase 配置
source .env

# 调用开奖函数
curl -X POST \
  "${SUPABASE_URL}/functions/v1/scheduled-lottery" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
EOF

    chmod +x scripts/lottery-cron.sh

    echo "📝 定时任务脚本已创建: scripts/lottery-cron.sh"
    echo "💡 要启用定时开奖，请添加以下 cron 任务："
    echo "   */5 * * * * /path/to/your/project/scripts/lottery-cron.sh"
    echo "   (每5分钟执行一次开奖)"
}

# 读取用户选择
echo ""
echo "请选择操作："
echo "1) 初始化本地 Supabase 项目"
echo "2) 连接到现有 Supabase 项目"
echo "3) 部署数据库结构"
echo "4) 部署 Edge Functions"
echo "5) 完整设置（推荐）"
echo ""
read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "🚀 初始化本地 Supabase 项目..."
        supabase init
        supabase start
        echo "✅ 本地 Supabase 项目已启动"
        echo "📊 Studio URL: http://localhost:54323"
        echo "🔗 API URL: http://localhost:54321"
        ;;
    2)
        echo "🔗 连接到现有 Supabase 项目..."
        read -p "请输入项目 ID: " project_id
        supabase link --project-ref $project_id
        echo "✅ 已连接到项目: $project_id"
        ;;
    3)
        echo "📊 部署数据库结构..."
        deploy_database
        ;;
    4)
        echo "⚡ 部署 Edge Functions..."
        deploy_functions
        ;;
    5)
        echo "🎯 开始完整设置..."
        full_setup
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac



echo ""
echo "🎮 Supabase 设置完成！"
