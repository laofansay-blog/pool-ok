// 检查投注记录状态
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkBetStatus() {
    try {
        console.log('🔍 检查最近的投注记录状态...\n')
        
        // 1. 查询最近的轮次
        console.log('📋 1. 查询最近的轮次...')
        const roundsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?select=*&order=round_number.desc&limit=5`, {
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
                console.log(`  第${round.round_number}期: ${round.status}`)
                console.log(`    开始: ${round.start_time}`)
                console.log(`    结束: ${round.end_time}`)
                console.log(`    开奖: ${round.draw_time || '未开奖'}`)
                console.log(`    投注数: ${round.total_bets_count}`)
                console.log(`    赔付: ${round.total_payout}元`)
            })
            
            // 2. 检查最近几期的投注记录
            console.log('\n📝 2. 检查最近几期的投注记录...')
            for (const round of rounds.slice(0, 3)) {
                console.log(`\n--- 第${round.round_number}期投注记录 ---`)
                
                const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*&order=created_at.desc`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })
                
                if (betsResponse.ok) {
                    const bets = await betsResponse.json()
                    console.log(`找到 ${bets.length} 笔投注:`)
                    
                    bets.forEach((bet, index) => {
                        console.log(`  投注${index + 1}: ${bet.id}`)
                        console.log(`    状态: ${bet.status}`)
                        console.log(`    是否中奖: ${bet.is_winner}`)
                        console.log(`    实际赔付: ${bet.actual_payout}元`)
                        console.log(`    匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                        console.log(`    结算时间: ${bet.settled_at}`)
                        
                        // 检查问题
                        if (round.status === 'completed' && bet.status === 'pending') {
                            console.log(`    ❌ 问题: 轮次已完成但投注还是pending状态!`)
                        }
                        if (round.status === 'completed' && !bet.is_winner && bet.actual_payout === 0) {
                            console.log(`    ⚠️ 注意: 轮次已完成，投注未中奖`)
                        }
                        if (round.status === 'completed' && bet.is_winner && bet.actual_payout > 0) {
                            console.log(`    ✅ 正常: 轮次已完成，投注已正确结算`)
                        }
                    })
                } else {
                    console.log(`❌ 无法查询第${round.round_number}期的投注记录`)
                }
            }
            
            // 3. 统计问题投注
            console.log('\n📊 3. 统计问题投注...')
            const problemRounds = rounds.filter(r => r.status === 'completed')
            let totalProblemBets = 0
            
            for (const round of problemRounds) {
                const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&status=eq.pending&select=id`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })
                
                if (betsResponse.ok) {
                    const problemBets = await betsResponse.json()
                    if (problemBets.length > 0) {
                        console.log(`第${round.round_number}期: ${problemBets.length} 笔投注状态异常`)
                        totalProblemBets += problemBets.length
                    }
                }
            }
            
            if (totalProblemBets > 0) {
                console.log(`\n❌ 发现 ${totalProblemBets} 笔投注记录状态异常!`)
                console.log('这些投注的轮次已经开奖完成，但投注状态还是pending')
            } else {
                console.log(`\n✅ 所有投注记录状态正常`)
            }
            
        } else {
            console.log('❌ 无法查询轮次信息')
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
    }
}

// 运行检查
checkBetStatus()
