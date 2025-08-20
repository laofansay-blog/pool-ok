// 测试更新后的 draw_current_round 函数
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testUpdatedDraw() {
    try {
        console.log('🧪 测试更新后的 draw_current_round 函数...\n')
        
        // 1. 首先检查是否有待开奖的轮次
        console.log('📋 1. 检查当前轮次状态...')
        const statusResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_current_round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (statusResponse.ok) {
            const status = await statusResponse.json()
            console.log('当前轮次状态:', status)
            
            if (status.success) {
                console.log(`✅ 找到进行中的轮次: 第${status.round_number}期`)
                console.log(`   剩余时间: ${Math.floor(status.time_remaining_seconds)}秒`)
                console.log(`   投注数量: ${status.total_bets_count}笔`)
                console.log(`   投注金额: ${status.total_bet_amount}元`)
            } else {
                console.log('ℹ️ 当前没有进行中的轮次')
            }
        } else {
            console.log('❌ 无法获取轮次状态')
        }
        
        // 2. 检查是否有过期的轮次需要开奖
        console.log('\n📊 2. 检查是否有过期轮次...')
        const roundsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.pending&end_time=lt.${new Date().toISOString()}&select=*&order=created_at.asc&limit=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (roundsResponse.ok) {
            const expiredRounds = await roundsResponse.json()
            if (expiredRounds && expiredRounds.length > 0) {
                const round = expiredRounds[0]
                console.log(`✅ 找到过期轮次: 第${round.round_number}期`)
                console.log(`   结束时间: ${round.end_time}`)
                console.log(`   投注数量: ${round.total_bets_count}笔`)
                console.log(`   投注金额: ${round.total_bet_amount}元`)
                
                // 3. 调用更新后的开奖函数
                console.log('\n🎲 3. 调用更新后的开奖函数...')
                const drawResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/draw_current_round`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
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
                        
                        // 4. 验证投注记录是否正确更新
                        console.log('\n🔍 4. 验证投注记录更新...')
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
                            console.log(`📝 找到 ${bets.length} 笔投注记录:`)
                            
                            bets.forEach((bet, index) => {
                                console.log(`\n   投注${index + 1}: ${bet.id}`)
                                console.log(`     状态: ${bet.status}`)
                                console.log(`     是否中奖: ${bet.is_winner}`)
                                console.log(`     实际赔付: ${bet.actual_payout}元`)
                                console.log(`     匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                                console.log(`     结算时间: ${bet.settled_at}`)
                            })
                            
                            // 验证数据一致性
                            const actualWinners = bets.filter(bet => bet.is_winner).length
                            const actualTotalPayout = bets.reduce((sum, bet) => sum + parseFloat(bet.actual_payout || 0), 0)
                            
                            console.log('\n✅ 数据一致性验证:')
                            console.log(`   报告中奖数: ${drawResult.total_winners}`)
                            console.log(`   实际中奖数: ${actualWinners}`)
                            console.log(`   报告总赔付: ${drawResult.total_payout}`)
                            console.log(`   实际总赔付: ${actualTotalPayout}`)
                            
                            if (drawResult.total_winners === actualWinners && 
                                Math.abs(parseFloat(drawResult.total_payout) - actualTotalPayout) < 0.01) {
                                console.log('🎊 数据完全一致，函数工作正常!')
                            } else {
                                console.log('⚠️ 数据不一致，需要检查')
                            }
                        }
                    } else {
                        console.log('❌ 开奖失败:', drawResult.message)
                    }
                } else {
                    const error = await drawResponse.text()
                    console.log('❌ 开奖请求失败:', error)
                }
            } else {
                console.log('ℹ️ 没有找到过期的轮次')
                
                // 如果没有过期轮次，创建一个测试轮次
                console.log('\n🔄 创建测试轮次...')
                const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_new_round`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                })
                
                if (createResponse.ok) {
                    const createResult = await createResponse.json()
                    console.log('✅ 测试轮次创建成功:', createResult)
                    console.log('💡 请等待5分钟后再次运行测试，或手动设置轮次为过期状态')
                } else {
                    console.log('❌ 创建测试轮次失败')
                }
            }
        } else {
            console.log('❌ 无法查询轮次信息')
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error)
    }
}

// 运行测试
console.log('🎯 更新后的 draw_current_round 函数测试工具')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
testUpdatedDraw()
