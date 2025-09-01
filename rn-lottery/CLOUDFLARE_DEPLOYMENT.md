# 🌐 Cloudflare Pages 部署指南

本指南将帮你将React Native Web应用部署到Cloudflare Pages，实现全球CDN加速和高可用性。

## 📋 前置条件

- ✅ 已有Cloudflare账户
- ✅ 项目代码已推送到Git仓库（GitHub/GitLab/Bitbucket）
- ✅ 本地项目可以正常运行Web版本

## 🚀 部署步骤

### 1. 准备项目配置

#### 1.1 添加构建脚本

更新 `package.json` 添加Web构建脚本：

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "web-dev": "expo start --web --dev-client",
    "build:web": "expo export --platform web",
    "build:web-prod": "expo export --platform web --output-dir dist"
  }
}
```

#### 1.2 创建构建配置文件

创建 `cloudflare-build.js` 文件：

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 Cloudflare Pages...');

try {
  // 清理之前的构建
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 构建Web版本
  console.log('📦 构建Web应用...');
  execSync('expo export --platform web --output-dir dist', { stdio: 'inherit' });

  // 创建_redirects文件用于SPA路由
  const redirectsContent = '/*    /index.html   200';
  fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent);

  console.log('✅ 构建完成！');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
```

#### 1.3 更新环境变量配置

确保 `app.json` 包含正确的Web配置：

```json
{
  "expo": {
    "name": "RN Lottery",
    "slug": "rn-lottery",
    "version": "1.0.0",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 2. Cloudflare Pages 设置

#### 2.1 登录Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 登录你的账户
3. 在左侧菜单选择 **Pages**

#### 2.2 创建新项目

1. 点击 **Create a project**
2. 选择 **Connect to Git**
3. 授权Cloudflare访问你的Git仓库
4. 选择包含React Native项目的仓库

#### 2.3 配置构建设置

在项目设置页面配置以下参数：

**基本设置**：
- **Project name**: `rn-lottery-web`
- **Production branch**: `main` 或 `master`
- **Build command**: `npm run build:web-prod`
- **Build output directory**: `dist`

**环境变量**：
```
NODE_VERSION=18
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 高级配置

#### 3.1 创建 `wrangler.toml` 配置文件

```toml
name = "rn-lottery-web"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]

[[env.production.rules]]
action = "rewrite"
expression = "http.request.uri.path matches \"^/(?!api/).*$\" and not http.request.uri.path matches \"\\.[a-zA-Z0-9]+$\""
value = "/index.html"
```

#### 3.2 添加自定义域名

1. 在Cloudflare Pages项目中点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如：`lottery.yourdomain.com`）
4. 按照提示配置DNS记录

#### 3.3 配置重定向规则

创建 `public/_redirects` 文件：

```
# SPA路由重定向
/*    /index.html   200

# API代理（如果需要）
/api/*  https://your-api-domain.com/api/:splat  200

# 强制HTTPS
http://your-domain.com/*  https://your-domain.com/:splat  301!
```

### 4. 性能优化

#### 4.1 启用缓存优化

在Cloudflare Dashboard中：

1. 进入 **Speed** → **Optimization**
2. 启用以下选项：
   - Auto Minify (HTML, CSS, JS)
   - Brotli Compression
   - Early Hints

#### 4.2 配置缓存规则

创建 `public/_headers` 文件：

```
# 静态资源缓存
/static/*
  Cache-Control: public, max-age=31536000, immutable

# HTML文件
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Service Worker
/sw.js
  Cache-Control: public, max-age=0, must-revalidate

# 字体文件
/*.woff2
  Cache-Control: public, max-age=31536000, immutable
```

### 5. 部署和监控

#### 5.1 触发部署

1. **自动部署**：推送代码到主分支自动触发
2. **手动部署**：在Cloudflare Pages控制台点击 **Create deployment**

#### 5.2 监控部署状态

- 在 **Deployments** 页面查看构建日志
- 检查部署状态和错误信息
- 查看实时访问统计

#### 5.3 设置通知

1. 进入 **Settings** → **Notifications**
2. 配置部署成功/失败通知
3. 设置Webhook或邮件通知

### 6. 故障排除

#### 6.1 常见问题

**构建失败**：
```bash
# 检查Node.js版本
echo "NODE_VERSION=18" >> .env

# 清理缓存
npm cache clean --force
```

**路由问题**：
- 确保 `_redirects` 文件正确配置
- 检查SPA路由设置

**环境变量问题**：
- 在Cloudflare Pages设置中添加所有必需的环境变量
- 确保变量名以 `EXPO_PUBLIC_` 开头

#### 6.2 调试技巧

1. **本地测试**：
```bash
npm run build:web-prod
npx serve dist
```

2. **检查构建输出**：
```bash
ls -la dist/
```

3. **查看构建日志**：
在Cloudflare Pages控制台查看详细日志

### 7. 安全配置

#### 7.1 设置安全头

在 `public/_headers` 中添加：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### 7.2 配置CSP

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-supabase-url.supabase.co
```

## 🎉 部署完成

部署成功后，你的应用将在以下地址可用：

- **Cloudflare Pages URL**: `https://rn-lottery-web.pages.dev`
- **自定义域名**: `https://your-domain.com`

### 📊 性能优势

- **全球CDN**: 200+ 边缘节点
- **自动HTTPS**: 免费SSL证书
- **DDoS防护**: 企业级安全
- **无限带宽**: 不限流量
- **实时分析**: 详细访问统计

恭喜！你的React Native Web应用现在已经部署到Cloudflare Pages，享受全球加速和高可用性！
