// 调试投注记录处理问题
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function debugBetProcessing() {
    try {
        console.log('🔍 调试投注记录处理问题...\n')
        
        // 1. 查找有投注但状态异常的轮次
        console.log('📋 1. 查找有投注但状态异常的轮次...')
        const roundsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.completed&total_bets_count=gt.0&select=*&order=round_number.desc&limit=3`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (roundsResponse.ok) {
            const rounds = await roundsResponse.json()
            console.log(`找到 ${rounds.length} 个已完成且有投注的轮次:`)
            
            for (const round of rounds) {
                console.log(`\n--- 第${round.round_number}期 ---`)
                console.log(`轮次ID: ${round.id}`)
                console.log(`状态: ${round.status}`)
                console.log(`开奖数字: ${JSON.stringify(round.winning_numbers)}`)
                console.log(`投注数: ${round.total_bets_count}`)
                console.log(`总赔付: ${round.total_payout}元`)
                
                // 查询该轮次的投注记录
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
                    console.log(`投注记录: ${bets.length}笔`)
                    
                    let pendingCount = 0
                    let settledCount = 0
                    
                    bets.forEach((bet, index) => {
                        console.log(`  投注${index + 1}: ${bet.id}`)
                        console.log(`    状态: ${bet.status}`)
                        console.log(`    是否中奖: ${bet.is_winner}`)
                        console.log(`    实际赔付: ${bet.actual_payout}元`)
                        console.log(`    匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                        
                        if (bet.status === 'pending') pendingCount++
                        if (bet.status === 'settled') settledCount++
                    })
                    
                    console.log(`状态统计: ${settledCount}已结算, ${pendingCount}待结算`)
                    
                    if (pendingCount > 0) {
                        console.log(`❌ 第${round.round_number}期有${pendingCount}笔投注未结算!`)
                        
                        // 测试手动开奖这一期
                        console.log(`\n🎲 测试手动开奖第${round.round_number}期...`)
                        const drawResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/draw_current_round`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                'apikey': SUPABASE_ANON_KEY
                            },
                            body: JSON.stringify({
                                target_round_number: round.round_number
                            })
                        })
                        
                        if (drawResponse.ok) {
                            const drawResult = await drawResponse.json()
                            console.log('开奖结果:', JSON.stringify(drawResult, null, 2))
                            
                            if (drawResult.success) {
                                console.log(`✅ 第${round.round_number}期重新开奖成功!`)
                                
                                // 验证投注记录是否更新
                                console.log('\n🔍 验证投注记录更新...')
                                await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒
                                
                                const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                        'apikey': SUPABASE_ANON_KEY
                                    }
                                })
                                
                                if (verifyResponse.ok) {
                                    const verifyBets = await verifyResponse.json()
                                    let newPendingCount = 0
                                    let newSettledCount = 0
                                    
                                    verifyBets.forEach(bet => {
                                        if (bet.status === 'pending') newPendingCount++
                                        if (bet.status === 'settled') newSettledCount++
                                    })
                                    
                                    console.log(`验证结果: ${newSettledCount}已结算, ${newPendingCount}待结算`)
                                    
                                    if (newPendingCount === 0) {
                                        console.log('🎊 所有投注都已正确结算!')
                                    } else {
                                        console.log('⚠️ 还有投注未结算，开奖函数有问题')
                                        
                                        // 显示未结算的投注详情
                                        const stillPending = verifyBets.filter(bet => bet.status === 'pending')
                                        console.log('\n未结算的投注:')
                                        stillPending.forEach((bet, index) => {
                                            console.log(`  投注${index + 1}: ${bet.id}`)
                                            console.log(`    轮次ID: ${bet.round_id}`)
                                            console.log(`    状态: ${bet.status}`)
                                            console.log(`    投注时间: ${bet.placed_at}`)
                                        })
                                    }
                                }
                            } else {
                                console.log(`❌ 第${round.round_number}期重新开奖失败:`, drawResult.message)
                                if (drawResult.error) {
                                    console.log('错误详情:', drawResult.error)
                                }
                            }
                        } else {
                            const error = await drawResponse.text()
                            console.log('❌ 开奖请求失败:', error)
                        }
                        
                        break // 只测试第一个有问题的轮次
                    } else {
                        console.log(`✅ 第${round.round_number}期所有投注都已正确结算`)
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error)
    }
}

// 运行调试
console.log('🎯 投注记录处理问题调试工具')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
debugBetProcessing()
