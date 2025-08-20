// 调试 auto_manage_rounds 返回的数据结构
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function debugAutoManage() {
    try {
        console.log('🔍 调试 auto_manage_rounds 返回数据...\n')
        
        // 调用 auto_manage_rounds
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/auto_manage_rounds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (response.ok) {
            const data = await response.json()
            console.log('📄 完整返回数据:')
            console.log(JSON.stringify(data, null, 2))
            
            console.log('\n🔍 数据结构分析:')
            console.log(`success: ${data.success}`)
            console.log(`message: ${data.message}`)
            console.log(`actions数组长度: ${data.actions?.length || 0}`)
            
            if (data.actions && data.actions.length > 0) {
                console.log('\n📋 Actions详情:')
                data.actions.forEach((action, index) => {
                    console.log(`\nAction ${index + 1}:`)
                    console.log(`  类型: ${Object.keys(action).join(', ')}`)
                    
                    if (action.draw) {
                        console.log(`  开奖结果:`)
                        console.log(`    success: ${action.draw.success}`)
                        console.log(`    round_number: ${action.draw.round_number}`)
                        console.log(`    winning_numbers: ${action.draw.winning_numbers}`)
                        console.log(`    total_winners: ${action.draw.total_winners}`)
                        console.log(`    total_payout: ${action.draw.total_payout}`)
                        console.log(`    message: ${action.draw.message}`)
                        
                        // 检查为什么 round_number 是 undefined
                        if (action.draw.round_number === undefined) {
                            console.log('    ❌ round_number 是 undefined!')
                            console.log('    🔍 完整 draw 对象:')
                            console.log(JSON.stringify(action.draw, null, 4))
                        }
                    }
                    
                    if (action.create) {
                        console.log(`  创建结果:`)
                        console.log(`    success: ${action.create.success}`)
                        console.log(`    round_number: ${action.create.round_number}`)
                        console.log(`    round_id: ${action.create.round_id}`)
                        console.log(`    message: ${action.create.message}`)
                    }
                })
            } else {
                console.log('ℹ️ 没有执行任何操作')
            }
            
            // 模拟前端处理逻辑
            console.log('\n🎭 模拟前端处理:')
            if (data.success && data.actions && data.actions.length > 0) {
                data.actions.forEach(action => {
                    if (action.draw) {
                        console.log(`🎉 自动开奖: 轮次 ${action.draw.round_number}`)
                        if (action.draw.round_number === undefined) {
                            console.log('❌ 这就是为什么显示 undefined 的原因!')
                        }
                    }
                    if (action.create) {
                        console.log(`✅ 自动创建: 轮次 ${action.create.round_number}`)
                    }
                })
            }
            
        } else {
            console.log('❌ 请求失败')
            console.log('状态:', response.status)
            const error = await response.text()
            console.log('错误:', error)
        }
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error)
    }
}

// 运行调试
debugAutoManage()
