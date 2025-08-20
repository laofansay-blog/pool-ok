// 测试指定期数开奖功能
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testDrawSpecific() {
    try {
        console.log('🧪 测试指定期数开奖功能...\n')

        // 测试第256期（有问题的轮次）
        const roundNumber = 261

        console.log(`🎯 测试第${roundNumber}期指定开奖...`)

        // 1. 查询开奖前状态
        console.log('\n📊 1. 查询开奖前状态...')
        const beforeResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.${roundNumber}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        if (beforeResponse.ok) {
            const rounds = await beforeResponse.json()
            if (rounds && rounds.length > 0) {
                const round = rounds[0]
                console.log(`第${round.round_number}期当前状态:`)
                console.log(`  状态: ${round.status}`)
                console.log(`  投注数: ${round.total_bets_count}`)
                console.log(`  总赔付: ${round.total_payout}元`)

                // 查询投注记录状态
                const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=id,status,is_winner,actual_payout`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })

                if (betsResponse.ok) {
                    const bets = await betsResponse.json()
                    const pendingBets = bets.filter(bet => bet.status === 'pending')
                    const settledBets = bets.filter(bet => bet.status === 'settled')

                    console.log(`  投注记录: ${bets.length}笔 (${settledBets.length}已结算, ${pendingBets.length}待结算)`)

                    if (pendingBets.length > 0) {
                        console.log(`  ❌ 有${pendingBets.length}笔投注需要重新结算`)
                    } else {
                        console.log(`  ✅ 所有投注都已结算`)
                    }
                }
            }
        }

        // 2. 调用指定期数开奖函数
        console.log(`\n🎲 2. 调用指定期数开奖函数...`)
        const drawResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/draw_current_round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                target_round_number: roundNumber
            })
        })

        console.log(`📡 响应状态: ${drawResponse.status}`)

        if (drawResponse.ok) {
            const drawResult = await drawResponse.json()
            console.log('\n🎉 开奖结果:')
            console.log(JSON.stringify(drawResult, null, 2))

            if (drawResult.success) {
                console.log('\n📊 开奖统计:')
                console.log(`   轮次: 第${drawResult.round_number}期`)
                console.log(`   开奖数字: [${drawResult.winning_numbers.join(', ')}]`)
                console.log(`   总投注: ${drawResult.total_bets}笔`)
                console.log(`   中奖: ${drawResult.total_winners}笔`)
                console.log(`   总赔付: ¥${drawResult.total_payout}`)

                // 3. 验证开奖后状态
                console.log('\n🔍 3. 验证开奖后状态...')
                await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒

                const afterResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.${roundNumber}&select=*`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })

                if (afterResponse.ok) {
                    const rounds = await afterResponse.json()
                    if (rounds && rounds.length > 0) {
                        const round = rounds[0]

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
                            console.log(`📝 开奖后投注记录状态:`)

                            let settledCount = 0
                            let pendingCount = 0
                            let winnerCount = 0
                            let totalPayout = 0

                            bets.forEach((bet, index) => {
                                console.log(`\n  投注${index + 1}: ${bet.id}`)
                                console.log(`    状态: ${bet.status}`)
                                console.log(`    是否中奖: ${bet.is_winner}`)
                                console.log(`    实际赔付: ${bet.actual_payout}元`)
                                console.log(`    结算时间: ${bet.settled_at}`)

                                if (bet.status === 'settled') settledCount++
                                if (bet.status === 'pending') pendingCount++
                                if (bet.is_winner) winnerCount++
                                totalPayout += parseFloat(bet.actual_payout || 0)
                            })

                            console.log('\n✅ 最终验证结果:')
                            console.log(`   已结算投注: ${settledCount}/${bets.length}`)
                            console.log(`   待结算投注: ${pendingCount}/${bets.length}`)
                            console.log(`   中奖投注: ${winnerCount}`)
                            console.log(`   实际总赔付: ${totalPayout}元`)
                            console.log(`   报告总赔付: ${drawResult.total_payout}元`)

                            if (pendingCount === 0) {
                                console.log('🎊 指定期数开奖功能正常工作!')
                            } else {
                                console.log('⚠️ 还有投注未结算，开奖函数可能有问题')
                            }

                            if (Math.abs(totalPayout - parseFloat(drawResult.total_payout)) < 0.01) {
                                console.log('🎊 赔付金额完全一致!')
                            } else {
                                console.log('⚠️ 赔付金额不一致')
                            }
                        }
                    }
                }

            } else {
                console.log('❌ 指定期数开奖失败:', drawResult.message)
                if (drawResult.error) {
                    console.log('错误详情:', drawResult.error)
                }
            }
        } else {
            const error = await drawResponse.text()
            console.log('❌ 开奖请求失败:', error)
        }

    } catch (error) {
        console.error('❌ 测试过程中出错:', error)
    }
}

// 运行测试
console.log('🎯 指定期数开奖功能测试工具')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
testDrawSpecific()
