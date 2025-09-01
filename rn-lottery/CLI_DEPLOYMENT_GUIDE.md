# 🚀 命令行部署指南 - Cloudflare Pages

## ✅ 部署成功！

你的React Native Web应用已经成功部署到Cloudflare Pages！

### 🌐 访问地址
- **生产URL**: https://f06e54e3.rn-lottery-web.pages.dev
- **项目名称**: `rn-lottery-web`
- **域名**: `rn-lottery-web.pages.dev`

## 🛠️ 命令行工具

### 已安装的工具
- ✅ **Wrangler CLI** - Cloudflare官方命令行工具
- ✅ **已登录** - Cloudflare账户认证完成

### 常用命令

#### 一键部署
```bash
# 使用自定义部署脚本（推荐）
npm run deploy

# 或者直接使用Wrangler
npm run deploy:cloudflare
```

#### 构建和部署分步操作
```bash
# 1. 构建项目
npm run build:cloudflare

# 2. 部署到Cloudflare Pages
wrangler pages deploy dist --project-name rn-lottery-web
```

#### 项目管理
```bash
# 查看所有Pages项目
wrangler pages project list

# 查看项目详情
wrangler pages project show rn-lottery-web

# 查看部署历史
wrangler pages deployment list --project-name rn-lottery-web
```

#### 域名管理
```bash
# 添加自定义域名
wrangler pages domain add <your-domain.com> --project-name rn-lottery-web

# 查看域名列表
wrangler pages domain list --project-name rn-lottery-web
```

## 🔧 配置文件

### wrangler.toml
```toml
name = "rn-lottery-web"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"
```

### 环境变量设置
```bash
# 设置生产环境变量
wrangler pages secret put EXPO_PUBLIC_SUPABASE_URL --project-name rn-lottery-web
wrangler pages secret put EXPO_PUBLIC_SUPABASE_ANON_KEY --project-name rn-lottery-web

# 查看环境变量
wrangler pages secret list --project-name rn-lottery-web
```

## 🚀 自动化部署

### 方法1: 使用自定义脚本
```bash
npm run deploy
```

这个命令会：
1. 检查登录状态
2. 构建项目
3. 部署到Cloudflare Pages
4. 显示访问URL

### 方法2: Git集成部署
```bash
# 连接Git仓库（在Cloudflare Dashboard中配置）
# 每次推送到main分支自动部署
git add .
git commit -m "Update application"
git push origin main
```

## 📊 部署监控

### 查看部署状态
```bash
# 查看最新部署
wrangler pages deployment list --project-name rn-lottery-web

# 查看特定部署详情
wrangler pages deployment show <deployment-id> --project-name rn-lottery-web
```

### 实时日志
```bash
# 查看实时访问日志（需要Workers Analytics）
wrangler tail --format pretty
```

## 🔄 更新和回滚

### 更新应用
```bash
# 修改代码后重新部署
npm run deploy
```

### 回滚部署
```bash
# 查看部署历史
wrangler pages deployment list --project-name rn-lottery-web

# 回滚到特定版本（在Dashboard中操作）
```

## 🌍 性能优化

### 已配置的优化
- ✅ **全球CDN** - 200+ 边缘节点
- ✅ **静态资源缓存** - 1年缓存期
- ✅ **HTML不缓存** - 确保更新及时
- ✅ **Gzip/Brotli压缩** - 自动压缩
- ✅ **HTTP/2** - 现代协议支持

### 缓存配置
文件 `_headers` 已配置：
```
/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

## 🔐 安全配置

### 已配置的安全头
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### HTTPS
- ✅ **自动HTTPS** - 免费SSL证书
- ✅ **HTTP重定向** - 自动跳转到HTTPS

## 📈 分析和监控

### Cloudflare Analytics
在Cloudflare Dashboard中查看：
- 访问量统计
- 性能指标
- 错误率
- 地理分布

### 自定义分析
```bash
# 添加Google Analytics或其他分析工具
# 在app.json中配置
```

## 🎯 下一步

### 推荐操作
1. **设置自定义域名** - 使用你自己的域名
2. **配置环境变量** - 添加生产环境配置
3. **设置监控** - 配置错误通知
4. **优化SEO** - 添加meta标签和sitemap

### 高级功能
- **A/B测试** - 使用Cloudflare Workers
- **边缘计算** - 添加服务端逻辑
- **API代理** - 通过Workers代理API请求

## 🎉 恭喜！

你的React Native Web应用现在已经：
- ✅ 部署到全球CDN
- ✅ 享受无限带宽
- ✅ 获得企业级安全
- ✅ 支持命令行管理

访问你的应用：https://f06e54e3.rn-lottery-web.pages.dev
