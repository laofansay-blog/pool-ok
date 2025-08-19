// 模拟前端查询第193期投注记录
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testFrontendQuery() {
    try {
        console.log('模拟前端查询第193期投注记录...')
        
        // 首先查询第193期轮次信息
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.193&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const rounds = await roundResponse.json()
        console.log('第193期轮次信息:', rounds[0])
        
        if (rounds.length === 0) {
            console.log('未找到第193期数据')
            return
        }
        
        const round = rounds[0]
        
        // 模拟前端查询投注记录（带用户认证）
        console.log('\n尝试查询投注记录...')
        
        // 方法1：查询所有投注记录（可能受RLS限制）
        const betsResponse1 = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const bets1 = await betsResponse1.json()
        console.log('方法1 - 直接查询结果:', bets1)
        
        // 方法2：查询投注记录并关联轮次信息
        const betsResponse2 = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*,rounds(*)`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const bets2 = await betsResponse2.json()
        console.log('方法2 - 关联查询结果:', bets2)
        
        // 检查是否有错误信息
        if (bets1.error || bets2.error) {
            console.log('查询错误信息:')
            console.log('方法1错误:', bets1.error)
            console.log('方法2错误:', bets2.error)
        }
        
        // 如果查询成功，分析数据
        if (Array.isArray(bets1) && bets1.length > 0) {
            console.log('\n✅ 成功获取投注记录:')
            bets1.forEach((bet, index) => {
                console.log(`\n投注记录 ${index + 1}:`)
                console.log(`  ID: ${bet.id}`)
                console.log(`  用户ID: ${bet.user_id}`)
                console.log(`  投注金额: ${bet.bet_amount}`)
                console.log(`  潜在赔付: ${bet.potential_payout}`)
                console.log(`  实际赔付: ${bet.actual_payout}`)
                console.log(`  是否中奖: ${bet.is_winner}`)
                console.log(`  状态: ${bet.status}`)
                console.log(`  投注时间: ${bet.placed_at}`)
                console.log(`  结算时间: ${bet.settled_at}`)
                
                // 检查actual_payout是否为0的问题
                if (bet.is_winner && bet.actual_payout === 0) {
                    console.log('  ⚠️ 问题发现: 中奖但actual_payout为0!')
                } else if (bet.is_winner && bet.actual_payout > 0) {
                    console.log(`  ✅ 正常: 中奖且actual_payout为${bet.actual_payout}`)
                } else if (!bet.is_winner && bet.actual_payout === 0) {
                    console.log('  ✅ 正常: 未中奖且actual_payout为0')
                }
            })
        } else {
            console.log('\n❌ 无法获取投注记录，可能原因:')
            console.log('  1. RLS权限限制 - 需要用户认证')
            console.log('  2. 数据不存在')
            console.log('  3. 查询参数错误')
        }
        
        // 总结
        console.log('\n📊 数据对比:')
        console.log(`  轮次总赔付: ${round.total_payout}`)
        console.log(`  轮次总投注: ${round.total_bet_amount}`)
        console.log(`  投注记录数: ${Array.isArray(bets1) ? bets1.length : '查询失败'}`)
        
        if (round.total_payout > 0 && (!Array.isArray(bets1) || bets1.length === 0)) {
            console.log('  ⚠️ 数据不一致: 轮次显示有赔付但查询不到投注记录')
            console.log('  💡 建议: 检查RLS权限设置或使用正确的用户认证')
        }
        
    } catch (error) {
        console.error('查询错误:', error)
    }
}

// 运行测试
testFrontendQuery()
