// 调试投注记录查询
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function debugBetQuery() {
    try {
        console.log('调试投注记录查询...')

        const roundId = '9fe825ba-e45a-4c29-80e8-b0cdd4d6bac9'
        // 需要找到第216期的投注ID
        console.log('检查投注记录的当前状态...')

        console.log(`目标轮次ID: ${roundId}`)

        // 方法1：按轮次ID查询
        console.log('\n=== 方法1：按轮次ID查询 ===')
        const response1 = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${roundId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const bets1 = await response1.json()
        console.log('查询结果1:', bets1)

        // 方法2：查询第216期的投注记录
        console.log('\n=== 方法2：查询第216期投注记录 ===')
        let betId = null
        if (bets1 && bets1.length > 0) {
            betId = bets1[0].id
            console.log(`找到投注ID: ${betId}`)
        }

        const response2 = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const bets2 = await response2.json()
        console.log('查询结果2:', bets2)

        // 方法3：查询所有投注记录
        console.log('\n=== 方法3：查询最近的投注记录 ===')
        const response3 = await fetch(`${SUPABASE_URL}/rest/v1/bets?select=*&order=created_at.desc&limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const bets3 = await response3.json()
        console.log('查询结果3:', bets3)

        // 分析结果
        console.log('\n=== 分析结果 ===')
        if (Array.isArray(bets1) && bets1.length > 0) {
            console.log('✅ 按轮次ID查询成功')
            bets1.forEach(bet => {
                console.log(`  投注ID: ${bet.id}`)
                console.log(`  轮次ID: ${bet.round_id}`)
                console.log(`  状态: ${bet.status}`)
                console.log(`  实际赔付: ${bet.actual_payout}`)
            })
        } else {
            console.log('❌ 按轮次ID查询失败或无结果')
        }

        if (Array.isArray(bets2) && bets2.length > 0) {
            console.log('✅ 按投注ID查询成功')
            const bet = bets2[0]
            console.log(`  轮次ID: ${bet.round_id}`)
            console.log(`  状态: ${bet.status}`)
            console.log(`  实际赔付: ${bet.actual_payout}`)
            console.log(`  是否中奖: ${bet.is_winner}`)
        } else {
            console.log('❌ 按投注ID查询失败或无结果')
        }

        // 测试更新操作
        if (Array.isArray(bets2) && bets2.length > 0) {
            console.log('\n=== 测试更新操作 ===')
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    is_winner: true,
                    actual_payout: 117.6,
                    matched_numbers: [2, 4, 1, 3, 3, 3, 8, 5, 1, 6],
                    status: 'settled',
                    settled_at: new Date().toISOString()
                })
            })

            console.log('更新响应状态:', updateResponse.status)
            if (updateResponse.ok) {
                console.log('✅ 更新操作成功')
            } else {
                const error = await updateResponse.text()
                console.log('❌ 更新操作失败:', error)
            }
        }

    } catch (error) {
        console.error('调试过程中出错:', error)
    }
}

// 运行调试
debugBetQuery()
