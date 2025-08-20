// 检查数据库中的 pg_cron 配置
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkPgCron() {
    try {
        console.log('🔍 检查数据库中的 pg_cron 配置...\n')
        
        // 1. 检查 pg_cron 扩展是否安装
        console.log('📦 1. 检查 pg_cron 扩展是否安装')
        const extensionQuery = `
            SELECT 
                extname as extension_name,
                extversion as version,
                extrelocatable as relocatable
            FROM pg_extension 
            WHERE extname = 'pg_cron'
        `
        
        const extensionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query: extensionQuery
            })
        })
        
        if (extensionResponse.ok) {
            const extensionResult = await extensionResponse.json()
            if (extensionResult && extensionResult.length > 0) {
                console.log('✅ pg_cron 扩展已安装')
                console.log(`   版本: ${extensionResult[0].version}`)
            } else {
                console.log('❌ pg_cron 扩展未安装')
                console.log('   需要先安装扩展: CREATE EXTENSION IF NOT EXISTS pg_cron;')
                return
            }
        } else {
            console.log('❌ 无法检查扩展状态')
        }
        
        // 2. 检查 cron.job 表是否存在
        console.log('\n📋 2. 检查 cron.job 表')
        const tableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'cron' 
                AND table_name = 'job'
            ) as table_exists
        `
        
        const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query: tableQuery
            })
        })
        
        if (tableResponse.ok) {
            const tableResult = await tableResponse.json()
            if (tableResult && tableResult[0]?.table_exists) {
                console.log('✅ cron.job 表存在')
            } else {
                console.log('❌ cron.job 表不存在')
                return
            }
        }
        
        // 3. 查询所有定时任务
        console.log('\n⏰ 3. 查询所有定时任务')
        const jobsQuery = `
            SELECT 
                jobid,
                schedule,
                command,
                nodename,
                nodeport,
                database,
                username,
                active,
                jobname
            FROM cron.job
            ORDER BY jobid
        `
        
        const jobsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query: jobsQuery
            })
        })
        
        if (jobsResponse.ok) {
            const jobs = await jobsResponse.json()
            if (jobs && jobs.length > 0) {
                console.log(`✅ 找到 ${jobs.length} 个定时任务:`)
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                
                jobs.forEach((job, index) => {
                    console.log(`\n📝 任务 ${index + 1}:`)
                    console.log(`   ID: ${job.jobid}`)
                    console.log(`   名称: ${job.jobname || '未命名'}`)
                    console.log(`   调度: ${job.schedule}`)
                    console.log(`   命令: ${job.command}`)
                    console.log(`   活跃: ${job.active ? '✅ 是' : '❌ 否'}`)
                    console.log(`   数据库: ${job.database}`)
                    console.log(`   用户: ${job.username}`)
                    
                    // 检查是否是开奖相关的任务
                    if (job.command && (
                        job.command.includes('scheduled-lottery') ||
                        job.command.includes('auto_manage_rounds') ||
                        job.command.includes('draw_lottery')
                    )) {
                        console.log('   🎯 这是开奖相关的任务!')
                        
                        if (job.command.includes('scheduled-lottery-v2')) {
                            console.log('   ✅ 已经使用新版函数')
                        } else if (job.command.includes('scheduled-lottery')) {
                            console.log('   ❌ 还在使用旧版函数，需要更新!')
                        }
                    }
                })
                
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            } else {
                console.log('ℹ️ 没有找到任何定时任务')
            }
        } else {
            console.log('❌ 无法查询定时任务')
        }
        
        // 4. 查询定时任务执行历史
        console.log('\n📊 4. 查询最近的执行历史')
        const historyQuery = `
            SELECT 
                jobid,
                runid,
                job_pid,
                database,
                username,
                command,
                status,
                return_message,
                start_time,
                end_time
            FROM cron.job_run_details 
            ORDER BY start_time DESC 
            LIMIT 10
        `
        
        const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query: historyQuery
            })
        })
        
        if (historyResponse.ok) {
            const history = await historyResponse.json()
            if (history && history.length > 0) {
                console.log(`✅ 找到 ${history.length} 条执行记录:`)
                
                history.forEach((record, index) => {
                    console.log(`\n📋 执行记录 ${index + 1}:`)
                    console.log(`   任务ID: ${record.jobid}`)
                    console.log(`   状态: ${record.status}`)
                    console.log(`   开始时间: ${record.start_time}`)
                    console.log(`   结束时间: ${record.end_time}`)
                    console.log(`   命令: ${record.command}`)
                    if (record.return_message) {
                        console.log(`   返回信息: ${record.return_message}`)
                    }
                })
            } else {
                console.log('ℹ️ 没有找到执行历史记录')
            }
        } else {
            console.log('❌ 无法查询执行历史')
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
        
        // 如果上面的方法都失败了，尝试直接查询
        console.log('\n🔄 尝试备用查询方法...')
        try {
            const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_cron_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            })
            
            if (directResponse.ok) {
                const result = await directResponse.json()
                console.log('备用查询结果:', result)
            } else {
                console.log('备用查询也失败了')
            }
        } catch (backupError) {
            console.log('备用查询出错:', backupError.message)
        }
    }
}

// 运行检查
checkPgCron()
