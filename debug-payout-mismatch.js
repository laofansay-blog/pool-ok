// 调试赔付金额不一致的问题
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function debugPayoutMismatch() {
    try {
        console.log('🔍 调试第256期赔付金额不一致问题...\n')
        
        const roundNumber = 256
        
        // 1. 查询轮次信息
        console.log('📋 1. 查询轮次信息...')
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.${roundNumber}&select=*`, {
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
                console.log(`第${round.round_number}期轮次信息:`)
                console.log(`  ID: ${round.id}`)
                console.log(`  状态: ${round.status}`)
                console.log(`  开奖数字: ${JSON.stringify(round.winning_numbers)}`)
                console.log(`  轮次记录的总赔付: ${round.total_payout}元`)
                console.log(`  投注数量: ${round.total_bets_count}`)
                console.log(`  投注金额: ${round.total_bet_amount}元`)
                
                // 2. 查询投注记录
                console.log('\n📝 2. 查询投注记录详情...')
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
                    
                    let totalActualPayout = 0
                    let totalBetAmount = 0
                    
                    bets.forEach((bet, index) => {
                        console.log(`\n  投注${index + 1}: ${bet.id}`)
                        console.log(`    用户ID: ${bet.user_id}`)
                        console.log(`    投注金额: ${bet.bet_amount}元`)
                        console.log(`    状态: ${bet.status}`)
                        console.log(`    是否中奖: ${bet.is_winner}`)
                        console.log(`    实际赔付: ${bet.actual_payout}元`)
                        console.log(`    潜在赔付: ${bet.potential_payout}元`)
                        console.log(`    匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                        console.log(`    结算时间: ${bet.settled_at}`)
                        
                        totalActualPayout += parseFloat(bet.actual_payout || 0)
                        totalBetAmount += parseFloat(bet.bet_amount || 0)
                        
                        // 3. 手动计算这笔投注的应得赔付
                        if (bet.metadata && bet.selected_numbers) {
                            console.log(`    --- 手动验证赔付计算 ---`)
                            
                            let metadata, selectedNumbers
                            try {
                                if (typeof bet.metadata === 'string') {
                                    metadata = JSON.parse(bet.metadata)
                                } else {
                                    metadata = bet.metadata
                                }
                                
                                if (typeof bet.selected_numbers === 'string') {
                                    selectedNumbers = JSON.parse(bet.selected_numbers)
                                } else {
                                    selectedNumbers = bet.selected_numbers
                                }
                                
                                const winningNumbers = round.winning_numbers
                                let calculatedPayout = 0
                                let winningGroups = []
                                
                                // 检查每组中奖情况
                                for (let group = 1; group <= 10; group++) {
                                    const groupNumbers = selectedNumbers[group.toString()] || []
                                    const winningNumber = winningNumbers[group - 1]
                                    
                                    if (groupNumbers.includes(winningNumber)) {
                                        winningGroups.push(group)
                                        
                                        // 计算该组的赔付
                                        if (metadata.original_bets) {
                                            const groupBets = metadata.original_bets.filter(
                                                originalBet => originalBet.group === group && originalBet.number === winningNumber
                                            )
                                            const groupPayout = groupBets.reduce((sum, originalBet) => sum + originalBet.amount * 9.8, 0)
                                            calculatedPayout += groupPayout
                                            
                                            console.log(`      第${group}组: 投注[${groupNumbers.join(',')}] vs 开奖${winningNumber} ✅ 赔付${groupPayout}元`)
                                        }
                                    } else {
                                        console.log(`      第${group}组: 投注[${groupNumbers.join(',')}] vs 开奖${winningNumber} ❌`)
                                    }
                                }
                                
                                console.log(`    手动计算总赔付: ${calculatedPayout}元`)
                                console.log(`    数据库记录赔付: ${bet.actual_payout}元`)
                                console.log(`    中奖组数: ${winningGroups.length} (${winningGroups.join(',')})`)
                                
                                if (Math.abs(calculatedPayout - parseFloat(bet.actual_payout)) > 0.01) {
                                    console.log(`    ❌ 赔付计算不一致!`)
                                } else {
                                    console.log(`    ✅ 赔付计算正确`)
                                }
                                
                            } catch (error) {
                                console.log(`    ❌ 数据解析失败: ${error.message}`)
                            }
                        }
                    })
                    
                    console.log('\n📊 3. 汇总统计:')
                    console.log(`   投注记录总赔付: ${totalActualPayout}元`)
                    console.log(`   轮次记录总赔付: ${round.total_payout}元`)
                    console.log(`   投注记录总金额: ${totalBetAmount}元`)
                    console.log(`   轮次记录总金额: ${round.total_bet_amount}元`)
                    
                    const payoutDiff = Math.abs(totalActualPayout - parseFloat(round.total_payout))
                    const amountDiff = Math.abs(totalBetAmount - parseFloat(round.total_bet_amount))
                    
                    console.log(`\n🔍 4. 差异分析:`)
                    console.log(`   赔付差异: ${payoutDiff}元`)
                    console.log(`   投注差异: ${amountDiff}元`)
                    
                    if (payoutDiff < 0.01) {
                        console.log(`   ✅ 赔付金额一致`)
                    } else {
                        console.log(`   ❌ 赔付金额不一致!`)
                        console.log(`   可能原因:`)
                        console.log(`   1. 重复开奖导致累积`)
                        console.log(`   2. 开奖函数计算错误`)
                        console.log(`   3. 数据库更新异常`)
                    }
                    
                    if (amountDiff < 0.01) {
                        console.log(`   ✅ 投注金额一致`)
                    } else {
                        console.log(`   ❌ 投注金额不一致!`)
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error)
    }
}

// 运行调试
debugPayoutMismatch()
