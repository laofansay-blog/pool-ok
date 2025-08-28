# 🏰 中世纪风格赌坊游戏 (Medieval Casino)

一个基于 Supabase 的中世纪风格数字预言游戏，玩家从1-10中选择9个数字进行投注，每5分钟开奖一次。

## 🎮 游戏规则

- **选择数字**: 从1-10中选择9个不重复的数字
- **下注**: 设置投注金额（1-10000金币）
- **开奖**: 每5分钟开奖一次，系统随机生成10个数字
- **中奖条件**: 如果你选择的9个数字全部出现在开奖的10个数字中，即为中奖
- **赔率**: 9.8倍赔率

## 🛠 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Supabase (PostgreSQL + Edge Functions)
- **认证**: Supabase Auth
- **实时功能**: Supabase Realtime
- **支付**: Stripe (可选)

## 📁 项目结构

```
medieval-casino/
├── web/                    # 前端文件
│   ├── index.html         # 主游戏页面
│   ├── login.html         # 登录注册页面
│   ├── styles/            # 样式文件
│   │   ├── main.css       # 主样式
│   │   └── auth.css       # 认证页面样式
│   ├── scripts/           # JavaScript文件
│   │   ├── app.js         # 主应用逻辑
│   │   ├── auth.js        # 认证逻辑
│   │   ├── utils.js       # 工具函数
│   │   └── modals.js      # 模态框管理
│   └── config.js          # 前端配置
├── supabase/              # Supabase配置
│   ├── functions/         # Edge Functions
│   │   ├── place-bet/     # 下注功能
│   │   ├── draw-lottery/  # 开奖功能
│   │   ├── get-history/   # 历史记录
│   │   ├── manage-balance/# 余额管理
│   │   └── scheduled-lottery/ # 定时开奖
│   └── config.toml        # Supabase配置
├── database/              # 数据库设计
│   ├── schema.sql         # 表结构
│   ├── functions.sql      # 数据库函数
│   ├── security.sql       # 安全策略
│   ├── init.sql          # 初始化脚本
│   └── README.md         # 数据库文档
├── scripts/               # 脚本文件
│   ├── setup-supabase.sh # Supabase设置脚本
│   └── test-functions.js # 功能测试脚本
├── config/               # 配置文件
│   └── config.js         # 后端配置
└── task.md              # 任务清单
```

## 🚀 快速开始

### 1. 环境准备

确保你已安装以下工具：
- [Node.js](https://nodejs.org/) (v16+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Git

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd medieval-casino
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Supabase 配置：
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. 设置 Supabase

运行自动设置脚本：
```bash
npm run setup
```

或手动设置：
```bash
# 初始化本地 Supabase
supabase init
supabase start

# 部署数据库结构
npm run db:schema
npm run db:functions
npm run db:security

# 部署 Edge Functions
npm run supabase:deploy
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始游戏！

## 🔧 开发指南

### 数据库管理

```bash
# 重置数据库
npm run supabase:reset

# 查看数据库状态
supabase status

# 查看函数日志
supabase functions logs
```

### 测试

```bash
# 运行功能测试
npm test

# 测试特定功能
node scripts/test-functions.js
```

### 部署

```bash
# 构建项目
npm run build

# 部署到生产环境
npm run deploy
```

## 🎨 界面特色

- **中世纪风格设计**: 木纹背景、金色边框、烛光效果
- **响应式布局**: 支持桌面端和移动端
- **实时更新**: 倒计时、余额、开奖结果实时显示
- **流畅动画**: 按钮悬停、模态框弹出等交互效果

## 🔐 安全特性

- **行级安全 (RLS)**: 用户只能访问自己的数据
- **输入验证**: 前后端双重验证
- **SQL注入防护**: 使用参数化查询
- **认证保护**: 所有敏感操作需要登录

## 📊 功能特性

### 用户功能
- ✅ 用户注册/登录
- ✅ 余额管理（充值/提现）
- ✅ 数字选择和投注
- ✅ 实时倒计时
- ✅ 投注历史查看
- ✅ 个人统计信息

### 系统功能
- ✅ 自动开奖
- ✅ 中奖结算
- ✅ 数据统计
- ✅ 审计日志
- ✅ 系统配置

### 管理功能
- ✅ 用户管理
- ✅ 游戏配置
- ✅ 财务管理
- ✅ 数据分析

## 🐛 故障排除

### 常见问题

1. **无法连接到 Supabase**
   - 检查 `.env` 文件配置
   - 确认 Supabase 项目状态

2. **Edge Functions 调用失败**
   - 检查函数是否正确部署
   - 查看函数日志排查错误

3. **前端页面空白**
   - 检查浏览器控制台错误
   - 确认静态文件服务正常

### 调试技巧

```bash
# 查看 Supabase 日志
supabase logs

# 查看函数日志
supabase functions logs --function-name place-bet

# 重启本地服务
supabase stop && supabase start
```

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本游戏仅供娱乐和学习目的，请理性游戏，适度娱乐。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系我们

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/your-username/medieval-casino/issues)
- 发送邮件至: your-email@example.com





Local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907


test acc:  dvwhu11323@atminmail.com/dvwhu11323@