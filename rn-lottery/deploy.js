#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始部署到 Cloudflare Pages...\n');

try {
  // 检查是否已登录
  console.log('🔐 检查登录状态...');
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
    console.log('✅ 已登录 Cloudflare\n');
  } catch (error) {
    console.log('❌ 未登录，请先运行: wrangler login');
    process.exit(1);
  }

  // 构建项目
  console.log('📦 构建项目...');
  execSync('npm run build:cloudflare', { stdio: 'inherit' });
  console.log('✅ 构建完成\n');

  // 检查构建输出
  if (!fs.existsSync('dist')) {
    console.error('❌ 构建输出目录不存在');
    process.exit(1);
  }

  // 部署到 Cloudflare Pages
  console.log('🌐 部署到 Cloudflare Pages...');
  const deployResult = execSync('wrangler pages deploy dist --project-name rn-lottery-web', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // 提取部署URL
  const urlMatch = deployResult.match(/https:\/\/[a-zA-Z0-9.-]+\.pages\.dev/);
  const deployUrl = urlMatch ? urlMatch[0] : 'https://rn-lottery-web.pages.dev';

  console.log('✅ 部署成功！\n');
  console.log('🌍 访问地址:');
  console.log(`   ${deployUrl}\n`);

  // 显示项目信息
  console.log('📊 项目信息:');
  console.log('   项目名称: rn-lottery-web');
  console.log('   平台: Cloudflare Pages');
  console.log('   构建目录: dist/');
  console.log('   配置文件: wrangler.toml\n');

  console.log('🎉 部署完成！享受你的全球加速Web应用！');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
