# 🚀 快速部署指南 - Cloudflare Pages

## ✅ 准备工作已完成

你的项目已经配置好了所有必要的文件：

- ✅ `cloudflare-build.js` - 自动化构建脚本
- ✅ `wrangler.toml` - Cloudflare配置
- ✅ `public/_redirects` - SPA路由重定向
- ✅ `public/_headers` - 缓存和安全头配置
- ✅ `package.json` - 构建脚本已添加

## 🎯 立即部署步骤

### 1. 推送代码到Git仓库

```bash
git add .
git commit -m "Add Cloudflare Pages deployment configuration"
git push origin main
```

### 2. 登录Cloudflare Dashboard

访问：https://dash.cloudflare.com/login

### 3. 创建Pages项目

1. 点击左侧菜单 **Pages**
2. 点击 **Create a project**
3. 选择 **Connect to Git**
4. 选择你的Git仓库：`pool-ok`

### 4. 配置构建设置

**项目设置**：
- **Project name**: `rn-lottery-web`
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: `npm run build:cloudflare`
- **Build output directory**: `dist`

**环境变量**：
```
NODE_VERSION=18
EXPO_PUBLIC_SUPABASE_URL=你的Supabase URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 5. 部署

点击 **Save and Deploy** 开始部署！

## 🌐 部署后访问

部署完成后，你将获得：

- **临时URL**: `https://rn-lottery-web.pages.dev`
- **构建日志**: 在Cloudflare Pages控制台查看
- **自动HTTPS**: 免费SSL证书

## 🔧 后续配置（可选）

### 自定义域名

1. 在Pages项目中点击 **Custom domains**
2. 添加你的域名
3. 按提示配置DNS记录

### 性能优化

已自动配置：
- ✅ 静态资源缓存（1年）
- ✅ HTML文件不缓存
- ✅ 安全头配置
- ✅ SPA路由支持

### 监控和分析

在Cloudflare Dashboard中查看：
- 访问统计
- 性能指标
- 错误日志
- 带宽使用

## 🎉 完成！

你的React Native Web应用现在已经部署到Cloudflare Pages，享受：

- 🌍 全球CDN加速
- 🔒 免费HTTPS
- 🛡️ DDoS防护
- 📊 实时分析
- 🚀 无限带宽

访问你的应用：https://rn-lottery-web.pages.dev
