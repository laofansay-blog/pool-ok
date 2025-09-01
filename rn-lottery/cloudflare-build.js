const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 Cloudflare Pages...');

try {
  // 清理之前的构建
  if (fs.existsSync('dist')) {
    console.log('🧹 清理之前的构建文件...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 构建Web版本
  console.log('📦 构建Web应用...');
  execSync('expo export --platform web --output-dir dist', { stdio: 'inherit' });

  // 创建_redirects文件用于SPA路由
  console.log('🔄 配置SPA路由重定向...');
  const redirectsContent = `# SPA路由重定向
/*    /index.html   200

# 强制HTTPS
http://rn-lottery.pages.dev/*  https://rn-lottery.pages.dev/:splat  301!
`;
  fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent);

  // 创建_headers文件用于缓存优化
  console.log('⚡ 配置缓存优化...');
  const headersContent = `# 静态资源缓存
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

# 图片文件
/*.png
  Cache-Control: public, max-age=31536000, immutable
/*.jpg
  Cache-Control: public, max-age=31536000, immutable
/*.svg
  Cache-Control: public, max-age=31536000, immutable

# 安全头
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;
  fs.writeFileSync(path.join('dist', '_headers'), headersContent);

  // 检查构建结果
  console.log('🔍 检查构建结果...');
  const distFiles = fs.readdirSync('dist');
  console.log('构建文件:', distFiles);

  // 检查关键文件
  const requiredFiles = ['index.html', '_redirects', '_headers'];
  const missingFiles = requiredFiles.filter(file => !distFiles.includes(file));
  
  if (missingFiles.length > 0) {
    console.warn('⚠️  缺少文件:', missingFiles);
  }

  console.log('✅ 构建完成！');
  console.log('📁 构建输出目录: dist/');
  console.log('🌐 准备部署到 Cloudflare Pages');

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
