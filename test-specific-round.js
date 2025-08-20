// 测试指定轮次的自动开奖函数
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

// 从命令行参数获取轮次ID，如果没有则使用默认值
const roundId = process.argv[2] || '9fe825ba-e45a-4c29-80e8-b0cdd4d6bac9' // 第216期

async function testSpecificRound() {
    try {
        console.log('🧪 测试指定轮次的自动开奖函数...')
        console.log(`🎯 目标轮次ID: ${roundId}`)
        
        // 1. 首先查询轮次信息
        console.log('\n📋 查询轮次信息...')
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?id=eq.${roundId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const rounds = await roundResponse.json()
        if (!rounds || rounds.length === 0) {
            console.log('❌ 未找到指定轮次')
            return
        }
        
        const round = rounds[0]
        console.log(`✅ 找到轮次: 第${round.round_number}期`)
        console.log(`   状态: ${round.status}`)
        console.log(`   开始时间: ${round.start_time}`)
        console.log(`   结束时间: ${round.end_time}`)
        console.log(`   开奖时间: ${round.draw_time || '未开奖'}`)
        console.log(`   总投注: ${round.total_bet_amount}元`)
        console.log(`   总赔付: ${round.total_payout}元`)
        
        // 2. 查询该轮次的投注记录
        console.log('\n📊 查询投注记录...')
        const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${roundId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const bets = await betsResponse.json()
        console.log(`📝 找到 ${bets?.length || 0} 笔投注记录`)
        
        if (bets && bets.length > 0) {
            bets.forEach((bet, index) => {
                console.log(`   投注${index + 1}: ${bet.id}`)
                console.log(`     用户: ${bet.user_id}`)
                console.log(`     金额: ${bet.bet_amount}元`)
                console.log(`     状态: ${bet.status}`)
                console.log(`     是否中奖: ${bet.is_winner}`)
                console.log(`     实际赔付: ${bet.actual_payout}元`)
                console.log(`     匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
            })
        }
        
        // 3. 如果轮次还没开奖，先将其设置为待开奖状态
        if (round.status === 'completed') {
            console.log('\n🔄 轮次已开奖，重置为待开奖状态进行测试...')
            const resetResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?id=eq.${roundId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'pending',
                    winning_numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    draw_time: null,
                    total_payout: 0,
                    end_time: new Date(Date.now() - 60000).toISOString() // 设置为1分钟前结束
                })
            })
            
            if (resetResponse.ok) {
                console.log('✅ 轮次状态重置成功')
            } else {
                console.log('❌ 轮次状态重置失败')
                return
            }
            
            // 重置投注记录状态
            if (bets && bets.length > 0) {
                console.log('🔄 重置投注记录状态...')
                for (const bet of bets) {
                    const resetBetResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${bet.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'apikey': SUPABASE_ANON_KEY,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            is_winner: false,
                            actual_payout: 0,
                            matched_numbers: [],
                            status: 'pending',
                            settled_at: null
                        })
                    })
                    
                    if (resetBetResponse.ok) {
                        console.log(`  ✅ 投注 ${bet.id} 状态重置成功`)
                    } else {
                        console.log(`  ❌ 投注 ${bet.id} 状态重置失败`)
                    }
                }
            }
        }
        
        // 4. 调用新版自动开奖函数
        console.log('\n🚀 调用新版自动开奖函数...')
        const lotteryResponse = await fetch(`${SUPABASE_URL}/functions/v1/scheduled-lottery-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        console.log(`📡 响应状态: ${lotteryResponse.status}`)
        
        const lotteryResult = await lotteryResponse.json()
        console.log('📄 响应内容:')
        console.log(JSON.stringify(lotteryResult, null, 2))
        
        // 5. 验证结果
        if (lotteryResponse.ok && lotteryResult.success) {
            console.log('\n✅ 自动开奖执行成功!')
            
            if (lotteryResult.results && lotteryResult.results.length > 0) {
                console.log('\n🎉 开奖结果详情:')
                lotteryResult.results.forEach(result => {
                    if (result.success) {
                        console.log(`  第${result.round_number}期:`)
                        console.log(`    🎲 开奖数字: [${result.winning_numbers.join(', ')}]`)
                        console.log(`    📊 总投注: ${result.total_bets}笔`)
                        console.log(`    🎯 中奖: ${result.winning_bets}笔`)
                        console.log(`    💰 总赔付: ¥${result.total_payout}`)
                        
                        if (result.updated_bets && result.updated_bets.length > 0) {
                            console.log(`    📝 更新的投注记录:`)
                            result.updated_bets.forEach(bet => {
                                console.log(`      ${bet.id}: ${bet.is_winner ? '✅ 中奖' : '❌ 未中奖'}, 赔付: ¥${bet.actual_payout}`)
                            })
                        }
                    } else {
                        console.log(`  第${result.round_number}期: ❌ 失败 - ${result.error}`)
                    }
                })
            }
            
            // 6. 再次查询验证投注记录是否正确更新
            console.log('\n🔍 验证投注记录更新结果...')
            const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${roundId}&select=*`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            })
            
            const updatedBets = await verifyResponse.json()
            if (updatedBets && updatedBets.length > 0) {
                console.log('📋 更新后的投注记录:')
                updatedBets.forEach((bet, index) => {
                    console.log(`   投注${index + 1}: ${bet.id}`)
                    console.log(`     状态: ${bet.status}`)
                    console.log(`     是否中奖: ${bet.is_winner}`)
                    console.log(`     实际赔付: ${bet.actual_payout}元`)
                    console.log(`     匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                    console.log(`     结算时间: ${bet.settled_at}`)
                })
            }
            
        } else {
            console.log('❌ 自动开奖执行失败!')
            console.log('错误信息:', lotteryResult.error || '未知错误')
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error)
    }
}

// 显示使用说明
console.log('🎯 指定轮次自动开奖测试工具')
console.log('用法: node test-specific-round.js [轮次ID]')
console.log('示例: node test-specific-round.js 9fe825ba-e45a-4c29-80e8-b0cdd4d6bac9')
console.log('')

// 运行测试
testSpecificRound()
