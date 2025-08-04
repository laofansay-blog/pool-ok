# 🚀 幸运锅屋游戏部署指南

本文档详细说明如何部署中世纪风格赌坊游戏到生产环境。

## 📋 部署前准备

### 1. 环境要求
- Node.js 16+ 
- Supabase CLI
- Git
- 域名（可选）

### 2. 账户准备
- [Supabase](https://supabase.com) 账户
- [Vercel](https://vercel.com) 或其他静态托管服务账户（可选）

## 🔧 Supabase 项目设置

### 1. 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 选择组织和填写项目信息：
   - Name: `medieval-casino`
   - Database Password: 设置强密码
   - Region: 选择离用户最近的区域

### 2. 获取项目配置

项目创建完成后，在 Settings > API 页面获取：
- Project URL
- Project API keys (anon public 和 service_role)

### 3. 配置环境变量

创建 `.env` 文件：
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

## 🗄️ 数据库部署

### 1. 连接到项目
```bash
supabase link --project-ref your-project-id
```

### 2. 部署数据库结构
```bash
# 方法1: 使用 SQL 编辑器
# 在 Supabase Dashboard > SQL Editor 中依次执行：
# 1. database/schema.sql
# 2. database/functions.sql  
# 3. database/security.sql

# 方法2: 使用命令行
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/functions.sql
psql $DATABASE_URL -f database/security.sql
```

### 3. 验证数据库
在 Supabase Dashboard > Table Editor 中确认表已创建：
- users
- rounds
- bets
- recharges
- withdrawals
- system_config
- audit_logs

## ⚡ Edge Functions 部署

### 1. 部署所有函数
```bash
supabase functions deploy place-bet
supabase functions deploy draw-lottery
supabase functions deploy get-history
supabase functions deploy manage-balance
supabase functions deploy scheduled-lottery
```

### 2. 设置环境变量
在 Supabase Dashboard > Edge Functions > Settings 中设置：
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 测试函数
```bash
# 测试获取历史记录
curl -X POST 'https://your-project-id.supabase.co/functions/v1/get-history' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"type": "rounds", "limit": 5}'
```

## 🌐 前端部署

### 1. 更新前端配置

编辑 `web/config.js`：
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  // ... 其他配置
}
```

### 2. 部署到 Vercel

#### 方法1: 通过 Git 连接
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置构建配置：
   - Build Command: `npm run build`
   - Output Directory: `web`
   - Install Command: `npm install`

#### 方法2: 使用 Vercel CLI
```bash
npm install -g vercel
cd web
vercel --prod
```

### 3. 部署到其他平台

#### Netlify
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
cd web
netlify deploy --prod --dir .
```

#### GitHub Pages
```bash
# 创建 gh-pages 分支
git checkout -b gh-pages
git add web/*
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

## ⏰ 定时任务设置

### 1. 使用 Supabase Cron (推荐)

在 Supabase Dashboard > Database > Extensions 中启用 `pg_cron`，然后执行：

```sql
-- 每5分钟执行一次开奖
SELECT cron.schedule(
  'lottery-draw',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/scheduled-lottery',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### 2. 使用外部 Cron 服务

#### GitHub Actions
创建 `.github/workflows/lottery.yml`：
```yaml
name: Lottery Draw
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  draw:
    runs-on: ubuntu-latest
    steps:
      - name: Call lottery function
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/scheduled-lottery' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}'
```

#### Vercel Cron
创建 `vercel.json`：
```json
{
  "crons": [{
    "path": "/api/lottery",
    "schedule": "*/5 * * * *"
  }]
}
```

## 🔒 安全配置

### 1. 设置 RLS 策略
确保在 Supabase Dashboard > Authentication > Policies 中启用了所有表的 RLS。

### 2. 配置 CORS
在 Supabase Dashboard > Settings > API 中设置允许的域名。

### 3. 设置认证提供商
在 Supabase Dashboard > Authentication > Providers 中配置：
- Email (已默认启用)
- Google OAuth (可选)
- GitHub OAuth (可选)

## 📊 监控和维护

### 1. 设置监控
- 在 Supabase Dashboard > Logs 中查看实时日志
- 设置 Uptime 监控服务
- 配置错误报告

### 2. 备份策略
- Supabase 自动备份数据库
- 定期导出重要数据
- 版本控制代码

### 3. 性能优化
- 启用 CDN
- 压缩静态资源
- 优化数据库查询

## 🧪 生产环境测试

### 1. 功能测试
```bash
# 运行测试脚本
npm test
```

### 2. 压力测试
- 模拟多用户同时下注
- 测试开奖时的并发处理
- 验证数据一致性

### 3. 安全测试
- SQL 注入测试
- XSS 攻击测试
- 认证绕过测试

## 🚨 故障排除

### 常见问题

1. **Edge Functions 调用失败**
   - 检查函数是否正确部署
   - 验证环境变量设置
   - 查看函数日志

2. **数据库连接问题**
   - 确认数据库 URL 正确
   - 检查网络连接
   - 验证认证信息

3. **前端页面空白**
   - 检查浏览器控制台错误
   - 验证 Supabase 配置
   - 确认静态文件路径

### 日志查看
```bash
# 查看 Supabase 日志
supabase logs

# 查看特定函数日志
supabase functions logs --function-name place-bet
```

## 📞 技术支持

如遇到部署问题，可以：
1. 查看 [Supabase 文档](https://supabase.com/docs)
2. 搜索相关 GitHub Issues
3. 联系技术支持团队

---

🎉 恭喜！你的幸运锅屋游戏现在已经成功部署到生产环境了！
