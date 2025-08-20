// 调试 create_new_round 函数失败问题
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function debugCreateRound() {
    try {
        console.log('🔍 调试 create_new_round 函数失败问题...\n')
        
        // 1. 直接调用 create_new_round 函数
        console.log('📋 1. 调用 create_new_round 函数...')
        const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_new_round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        console.log(`📡 响应状态: ${createResponse.status}`)
        
        if (createResponse.ok) {
            const createResult = await createResponse.json()
            console.log('\n📄 完整响应数据:')
            console.log(JSON.stringify(createResult, null, 2))
            
            if (createResult.success) {
                console.log('\n✅ 创建轮次成功!')
                console.log(`   新轮次: 第${createResult.round_number}期`)
                console.log(`   轮次ID: ${createResult.round_id}`)
                console.log(`   开始时间: ${createResult.start_time}`)
                console.log(`   结束时间: ${createResult.end_time}`)
                
                if (createResult.previous_round_draw) {
                    console.log('\n🎲 上一轮次开奖结果:')
                    console.log(JSON.stringify(createResult.previous_round_draw, null, 2))
                }
            } else {
                console.log('\n❌ 创建轮次失败!')
                console.log(`   错误信息: ${createResult.message}`)
                if (createResult.error) {
                    console.log(`   详细错误: ${createResult.error}`)
                }
            }
        } else {
            const error = await createResponse.text()
            console.log('\n❌ 请求失败:')
            console.log(error)
        }
        
        // 2. 检查当前轮次状态
        console.log('\n📊 2. 检查当前轮次状态...')
        const roundsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?select=*&order=round_number.desc&limit=3`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (roundsResponse.ok) {
            const rounds = await roundsResponse.json()
            console.log(`找到 ${rounds.length} 个最近轮次:`)
            
            rounds.forEach(round => {
                const now = new Date()
                const endTime = new Date(round.end_time)
                const isExpired = endTime <= now
                
                console.log(`\n  第${round.round_number}期:`)
                console.log(`    ID: ${round.id}`)
                console.log(`    状态: ${round.status}`)
                console.log(`    结束时间: ${round.end_time}`)
                console.log(`    是否过期: ${isExpired ? '✅ 是' : '❌ 否'}`)
                console.log(`    投注数: ${round.total_bets_count}`)
            })
            
            // 检查是否有pending且未过期的轮次
            const activePendingRounds = rounds.filter(round => {
                const endTime = new Date(round.end_time)
                return round.status === 'pending' && endTime > new Date()
            })
            
            const expiredPendingRounds = rounds.filter(round => {
                const endTime = new Date(round.end_time)
                return round.status === 'pending' && endTime <= new Date()
            })
            
            console.log(`\n📊 轮次统计:`)
            console.log(`   进行中轮次: ${activePendingRounds.length}`)
            console.log(`   过期待开奖轮次: ${expiredPendingRounds.length}`)
            
            if (activePendingRounds.length > 0) {
                console.log(`   ℹ️ 有进行中轮次，不需要创建新轮次`)
            }
            
            if (expiredPendingRounds.length > 0) {
                console.log(`   ⚠️ 有过期轮次需要开奖`)
                expiredPendingRounds.forEach(round => {
                    console.log(`     第${round.round_number}期需要开奖`)
                })
            }
        }
        
        // 3. 测试 auto_manage_rounds
        console.log('\n🔄 3. 测试 auto_manage_rounds...')
        const autoResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/auto_manage_rounds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (autoResponse.ok) {
            const autoResult = await autoResponse.json()
            console.log('auto_manage_rounds 结果:')
            console.log(JSON.stringify(autoResult, null, 2))
        } else {
            const error = await autoResponse.text()
            console.log('auto_manage_rounds 失败:', error)
        }
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error)
    }
}

// 运行调试
console.log('🎯 create_new_round 函数调试工具')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
debugCreateRound()
