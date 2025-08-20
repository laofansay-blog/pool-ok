// 检查第261期的状态
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkRound261() {
    try {
        console.log('🔍 检查第261期的状态...\n')
        
        // 1. 查询第261期
        console.log('📋 1. 查询第261期轮次信息...')
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.261&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (roundResponse.ok) {
            const rounds = await roundResponse.json()
            if (rounds && rounds.length > 0) {
                const round = rounds[0]
                console.log('✅ 找到第261期:')
                console.log(`   ID: ${round.id}`)
                console.log(`   状态: ${round.status}`)
                console.log(`   开始时间: ${round.start_time}`)
                console.log(`   结束时间: ${round.end_time}`)
                console.log(`   开奖时间: ${round.draw_time || '未开奖'}`)
                console.log(`   开奖数字: ${JSON.stringify(round.winning_numbers)}`)
                console.log(`   投注数: ${round.total_bets_count}`)
                console.log(`   投注金额: ${round.total_bet_amount}元`)
                console.log(`   总赔付: ${round.total_payout}元`)
                
                // 2. 检查第261期的投注记录
                console.log('\n📝 2. 检查第261期的投注记录...')
                const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })
                
                if (betsResponse.ok) {
                    const bets = await betsResponse.json()
                    console.log(`找到 ${bets.length} 笔投注记录:`)
                    
                    if (bets.length > 0) {
                        bets.forEach((bet, index) => {
                            console.log(`\n  投注${index + 1}: ${bet.id}`)
                            console.log(`    状态: ${bet.status}`)
                            console.log(`    是否中奖: ${bet.is_winner}`)
                            console.log(`    实际赔付: ${bet.actual_payout}元`)
                            console.log(`    匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                            console.log(`    结算时间: ${bet.settled_at}`)
                            
                            // 检查状态一致性
                            if (round.status === 'completed' && bet.status === 'pending') {
                                console.log(`    ❌ 问题: 轮次已完成但投注还是pending!`)
                            } else if (round.status === 'completed' && bet.status === 'settled') {
                                console.log(`    ✅ 正常: 轮次和投注都已完成`)
                            }
                        })
                        
                        // 统计
                        const settledBets = bets.filter(bet => bet.status === 'settled').length
                        const pendingBets = bets.filter(bet => bet.status === 'pending').length
                        const winnerBets = bets.filter(bet => bet.is_winner).length
                        const totalPayout = bets.reduce((sum, bet) => sum + parseFloat(bet.actual_payout || 0), 0)
                        
                        console.log('\n📊 统计信息:')
                        console.log(`   已结算投注: ${settledBets}/${bets.length}`)
                        console.log(`   待结算投注: ${pendingBets}/${bets.length}`)
                        console.log(`   中奖投注: ${winnerBets}`)
                        console.log(`   实际总赔付: ${totalPayout}元`)
                        console.log(`   轮次记录赔付: ${round.total_payout}元`)
                        
                        if (Math.abs(totalPayout - parseFloat(round.total_payout)) < 0.01) {
                            console.log(`   ✅ 赔付金额一致`)
                        } else {
                            console.log(`   ❌ 赔付金额不一致!`)
                        }
                        
                        if (pendingBets === 0) {
                            console.log(`   ✅ 所有投注都已正确结算`)
                        } else {
                            console.log(`   ❌ 还有${pendingBets}笔投注未结算`)
                        }
                        
                    } else {
                        console.log('ℹ️ 第261期没有投注记录')
                    }
                } else {
                    console.log('❌ 无法查询第261期的投注记录')
                }
                
            } else {
                console.log('❌ 找不到第261期')
            }
        } else {
            console.log('❌ 无法查询第261期')
        }
        
        // 3. 查询最近几期的状态
        console.log('\n📋 3. 查询最近几期的状态...')
        const recentResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?select=*&order=round_number.desc&limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (recentResponse.ok) {
            const recentRounds = await recentResponse.json()
            console.log('最近5期状态:')
            
            recentRounds.forEach(round => {
                console.log(`  第${round.round_number}期: ${round.status} (投注:${round.total_bets_count}, 赔付:${round.total_payout}元)`)
            })
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
    }
}

// 运行检查
checkRound261()
