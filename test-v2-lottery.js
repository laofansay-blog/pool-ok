// 测试新版自动开奖函数
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testV2Lottery() {
    try {
        console.log('🧪 测试新版自动开奖函数...')
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/scheduled-lottery-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        console.log('响应状态:', response.status)
        
        const result = await response.json()
        console.log('响应内容:', JSON.stringify(result, null, 2))
        
        if (response.ok) {
            console.log('✅ 新版自动开奖函数执行成功!')
            
            if (result.results && result.results.length > 0) {
                console.log('\n📊 开奖结果:')
                result.results.forEach(round => {
                    if (round.success) {
                        console.log(`  第${round.round_number}期:`)
                        console.log(`    开奖数字: [${round.winning_numbers.join(', ')}]`)
                        console.log(`    总投注: ${round.total_bets}笔`)
                        console.log(`    中奖: ${round.winning_bets}笔`)
                        console.log(`    总赔付: ¥${round.total_payout}`)
                        
                        if (round.updated_bets && round.updated_bets.length > 0) {
                            console.log(`    更新的投注记录: ${round.updated_bets.length}笔`)
                            round.updated_bets.forEach(bet => {
                                console.log(`      ${bet.id}: ${bet.is_winner ? '中奖' : '未中奖'}, 赔付: ¥${bet.actual_payout}`)
                            })
                        }
                    } else {
                        console.log(`  第${round.round_number}期: ❌ 失败 - ${round.error}`)
                    }
                })
            }
        } else {
            console.log('❌ 新版自动开奖函数执行失败!')
            console.log('错误信息:', result.error || '未知错误')
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error)
    }
}

// 运行测试
testV2Lottery()
