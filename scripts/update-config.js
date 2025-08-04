#!/usr/bin/env node
// 自动更新前端配置脚本

const fs = require('fs')
const path = require('path')

// 读取 .env 文件
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ 未找到 .env 文件')
    process.exit(1)
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return env
}

// 更新前端配置文件
function updateConfig() {
  const env = loadEnv()
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('❌ .env 文件中缺少必要的 Supabase 配置')
    console.error('请确保设置了 SUPABASE_URL 和 SUPABASE_ANON_KEY')
    process.exit(1)
  }
  
  const configPath = path.join(__dirname, '..', 'web', 'config.js')
  let configContent = fs.readFileSync(configPath, 'utf8')
  
  // 替换 SUPABASE_URL
  configContent = configContent.replace(
    /SUPABASE_URL:\s*['"][^'"]*['"]/,
    `SUPABASE_URL: '${env.SUPABASE_URL}'`
  )
  
  // 替换 SUPABASE_ANON_KEY
  configContent = configContent.replace(
    /SUPABASE_ANON_KEY:\s*['"][^'"]*['"][^,]*/,
    `SUPABASE_ANON_KEY: '${env.SUPABASE_ANON_KEY}'`
  )
  
  fs.writeFileSync(configPath, configContent)
  
  console.log('✅ 前端配置已更新')
  console.log(`📍 SUPABASE_URL: ${env.SUPABASE_URL}`)
  console.log(`🔑 SUPABASE_ANON_KEY: ${env.SUPABASE_ANON_KEY.substring(0, 20)}...`)
}

// 运行更新
try {
  updateConfig()
} catch (error) {
  console.error('❌ 更新配置失败:', error.message)
  process.exit(1)
}
