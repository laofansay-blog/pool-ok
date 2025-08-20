// 检查当前轮次状态
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkCurrentRound() {
    try {
        console.log('🔍 检查当前轮次状态...\n')
        
        const now = new Date()
        console.log(`当前时间: ${now.toISOString()}`)
        
        // 1. 查询所有pending状态的轮次
        console.log('\n📋 1. 查询所有pending状态的轮次...')
        const pendingResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.pending&select=*&order=round_number.desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (pendingResponse.ok) {
            const pendingRounds = await pendingResponse.json()
            console.log(`找到 ${pendingRounds.length} 个pending轮次:`)
            
            pendingRounds.forEach(round => {
                const endTime = new Date(round.end_time)
                const isExpired = endTime <= now
                const timeRemaining = Math.floor((endTime - now) / 1000)
                
                console.log(`  第${round.round_number}期:`)
                console.log(`    ID: ${round.id}`)
                console.log(`    结束时间: ${round.end_time}`)
                console.log(`    是否过期: ${isExpired ? '✅ 是' : '❌ 否'}`)
                console.log(`    剩余时间: ${isExpired ? '已过期' : timeRemaining + '秒'}`)
                console.log(`    投注数: ${round.total_bets_count}`)
                
                if (isExpired) {
                    console.log(`    🚨 这个轮次应该开奖了!`)
                }
            })
        } else {
            console.log('❌ 无法查询pending轮次')
        }
        
        // 2. 查询过期但还是pending的轮次
        console.log('\n⏰ 2. 查询过期但还是pending的轮次...')
        const expiredResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.pending&end_time=lt.${now.toISOString()}&select=*&order=round_number.desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (expiredResponse.ok) {
            const expiredRounds = await expiredResponse.json()
            console.log(`找到 ${expiredRounds.length} 个过期的pending轮次:`)
            
            if (expiredRounds.length > 0) {
                console.log('🚨 这些轮次应该被auto_manage_rounds处理!')
                
                expiredRounds.forEach(round => {
                    const endTime = new Date(round.end_time)
                    const expiredMinutes = Math.floor((now - endTime) / 60000)
                    
                    console.log(`  第${round.round_number}期:`)
                    console.log(`    ID: ${round.id}`)
                    console.log(`    结束时间: ${round.end_time}`)
                    console.log(`    过期时间: ${expiredMinutes}分钟前`)
                    console.log(`    投注数: ${round.total_bets_count}`)
                })
                
                // 3. 手动调用开奖函数测试
                console.log('\n🎲 3. 手动调用开奖函数测试...')
                const firstExpired = expiredRounds[0]
                console.log(`测试开奖第${firstExpired.round_number}期...`)
                
                const drawResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/draw_current_round`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })
                
                if (drawResponse.ok) {
                    const drawResult = await drawResponse.json()
                    console.log('开奖结果:', JSON.stringify(drawResult, null, 2))
                    
                    if (drawResult.success) {
                        console.log('✅ 手动开奖成功!')
                        console.log(`第${drawResult.round_number}期开奖完成`)
                    } else {
                        console.log('❌ 手动开奖失败:', drawResult.message)
                    }
                } else {
                    const error = await drawResponse.text()
                    console.log('❌ 开奖请求失败:', error)
                }
                
            } else {
                console.log('ℹ️ 没有过期的pending轮次')
            }
        } else {
            console.log('❌ 无法查询过期轮次')
        }
        
        // 4. 检查auto_manage_rounds的查询逻辑
        console.log('\n🔍 4. 检查auto_manage_rounds的查询逻辑...')
        console.log('auto_manage_rounds查询条件:')
        console.log(`  status = 'pending'`)
        console.log(`  end_time <= '${now.toISOString()}'`)
        
        const autoQuery = `status=eq.pending&end_time=lte.${now.toISOString()}`
        console.log(`实际查询: ${autoQuery}`)
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
    }
}

// 运行检查
checkCurrentRound()
