// 检查第284期状态
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkRound284() {
    try {
        console.log('🔍 检查第284期状态...\n')
        
        const roundNumber = 284
        
        // 1. 查询第284期信息
        console.log('📋 1. 查询第284期轮次信息...')
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
                const now = new Date()
                const endTime = new Date(round.end_time)
                const isExpired = endTime <= now
                const timeRemaining = Math.floor((endTime - now) / 1000)
                
                console.log(`第${round.round_number}期信息:`)
                console.log(`  ID: ${round.id}`)
                console.log(`  状态: ${round.status}`)
                console.log(`  开始时间: ${round.start_time}`)
                console.log(`  结束时间: ${round.end_time}`)
                console.log(`  当前时间: ${now.toISOString()}`)
                console.log(`  是否过期: ${isExpired ? '✅ 是' : '❌ 否'}`)
                console.log(`  剩余时间: ${isExpired ? '已过期' : timeRemaining + '秒'}`)
                console.log(`  开奖数字: ${JSON.stringify(round.winning_numbers)}`)
                console.log(`  投注数: ${round.total_bets_count}`)
                console.log(`  投注金额: ${round.total_bet_amount}元`)
                console.log(`  总赔付: ${round.total_payout}元`)
                
                // 2. 查询第284期的投注记录
                console.log('\n📝 2. 查询第284期的投注记录...')
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
                    
                    bets.forEach((bet, index) => {
                        console.log(`\n  投注${index + 1}: ${bet.id}`)
                        console.log(`    用户ID: ${bet.user_id}`)
                        console.log(`    投注金额: ${bet.bet_amount}元`)
                        console.log(`    状态: ${bet.status}`)
                        console.log(`    是否中奖: ${bet.is_winner}`)
                        console.log(`    实际赔付: ${bet.actual_payout}元`)
                        console.log(`    匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                        console.log(`    结算时间: ${bet.settled_at}`)
                        console.log(`    投注时间: ${bet.placed_at}`)
                    })
                    
                    // 统计
                    const settledBets = bets.filter(bet => bet.status === 'settled').length
                    const pendingBets = bets.filter(bet => bet.status === 'pending').length
                    
                    console.log('\n📊 投注统计:')
                    console.log(`   已结算: ${settledBets}`)
                    console.log(`   待结算: ${pendingBets}`)
                    
                    if (isExpired && round.status === 'pending') {
                        console.log('\n⚠️ 问题发现:')
                        console.log('   第284期已过期但状态还是pending!')
                        console.log('   需要手动开奖')
                        
                        // 3. 手动开奖第284期
                        console.log('\n🎲 3. 手动开奖第284期...')
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
                        
                        if (drawResponse.ok) {
                            const drawResult = await drawResponse.json()
                            console.log('开奖结果:', JSON.stringify(drawResult, null, 2))
                            
                            if (drawResult.success) {
                                console.log('✅ 第284期手动开奖成功!')
                            } else {
                                console.log('❌ 第284期手动开奖失败:', drawResult.message)
                            }
                        } else {
                            const error = await drawResponse.text()
                            console.log('❌ 开奖请求失败:', error)
                        }
                    } else if (round.status === 'completed') {
                        console.log('\n✅ 第284期已正常开奖完成')
                    } else {
                        console.log('\n⏰ 第284期还未到开奖时间')
                    }
                }
            } else {
                console.log('❌ 找不到第284期')
            }
        } else {
            console.log('❌ 无法查询第284期')
        }
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error)
    }
}

// 运行检查
checkRound284()
