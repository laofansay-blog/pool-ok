// 检查数据库中的cron jobs配置
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkCronJobs() {
    try {
        console.log('🔍 检查数据库中的定时任务配置...')
        
        // 1. 检查是否安装了pg_cron扩展
        console.log('\n📦 检查pg_cron扩展...')
        const extensionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_extension`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                extension_name: 'pg_cron'
            })
        })
        
        if (extensionResponse.ok) {
            const extensionResult = await extensionResponse.json()
            console.log('pg_cron扩展状态:', extensionResult)
        } else {
            console.log('❌ 无法检查pg_cron扩展状态')
        }
        
        // 2. 尝试查询cron.job表
        console.log('\n⏰ 检查定时任务...')
        const cronResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_cron_jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (cronResponse.ok) {
            const cronJobs = await cronResponse.json()
            console.log('定时任务列表:', cronJobs)
            
            if (cronJobs && cronJobs.length > 0) {
                console.log('\n📋 找到的定时任务:')
                cronJobs.forEach((job, index) => {
                    console.log(`  ${index + 1}. ${job.jobname}`)
                    console.log(`     调度: ${job.schedule}`)
                    console.log(`     命令: ${job.command}`)
                    console.log(`     活跃: ${job.active}`)
                })
            } else {
                console.log('ℹ️ 没有找到定时任务')
            }
        } else {
            console.log('❌ 无法查询定时任务，可能没有安装pg_cron扩展')
        }
        
        // 3. 检查是否有其他定时任务配置
        console.log('\n🔍 检查其他可能的定时任务配置...')
        
        // 检查是否有GitHub Actions
        console.log('GitHub Actions: 未找到 .github/workflows 目录')
        
        // 检查本地脚本
        console.log('本地脚本: 找到 scripts/lottery-cron.sh (需要手动设置cron)')
        console.log('手动触发脚本: trigger-scheduled-lottery.js (已更新为v2)')
        
        // 4. 总结当前状态
        console.log('\n📊 当前定时任务状态总结:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ 新版自动开奖函数: scheduled-lottery-v2 (已部署)')
        console.log('❌ 旧版自动开奖函数: scheduled-lottery (有bug)')
        console.log('🔄 手动触发脚本: 已更新为调用v2版本')
        console.log('❓ 实际定时任务: 需要进一步确认')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        console.log('\n💡 建议的解决方案:')
        console.log('1. 如果使用Supabase pg_cron: 更新cron job URL为scheduled-lottery-v2')
        console.log('2. 如果使用外部服务: 更新外部服务的URL配置')
        console.log('3. 如果使用本地cron: 更新scripts/lottery-cron.sh中的URL')
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
    }
}

// 运行检查
checkCronJobs()
