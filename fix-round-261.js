// 修复第261期投注记录
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function fixRound261() {
    try {
        console.log('🔧 修复第261期投注记录...\n')
        
        // 第261期数据
        const betId = 'aae2544a-e582-44e8-b71c-a36992b19a42'
        const winningNumbers = [5,2,8,9,3,4,7,8,7,7]
        
        // 投注数据
        const selectedNumbers = {
            "1": [1, 2, 3, 4, 5],
            "2": [1, 3, 5, 7, 9], 
            "3": [6, 7, 8, 9, 10],
            "4": [1, 2, 3, 4, 5],
            "5": [1, 2, 3, 4, 5],
            "6": [1, 2, 3, 4, 5],
            "7": [1, 3, 5, 7, 9],
            "8": [6, 7, 8, 9, 10],
            "9": [2, 4, 6, 8, 10],
            "10": [1, 3, 5, 7, 9]
        }
        
        const originalBets = [
            {"group": 5, "amount": 2, "number": 1}, {"group": 5, "amount": 2, "number": 2}, {"group": 5, "amount": 2, "number": 3}, {"group": 5, "amount": 2, "number": 4}, {"group": 5, "amount": 2, "number": 5},
            {"group": 6, "amount": 2, "number": 1}, {"group": 6, "amount": 2, "number": 2}, {"group": 6, "amount": 2, "number": 3}, {"group": 6, "amount": 2, "number": 4}, {"group": 6, "amount": 2, "number": 5},
            {"group": 8, "amount": 2, "number": 6}, {"group": 8, "amount": 2, "number": 7}, {"group": 8, "amount": 2, "number": 8}, {"group": 8, "amount": 2, "number": 9}, {"group": 8, "amount": 2, "number": 10},
            {"group": 7, "amount": 2, "number": 1}, {"group": 7, "amount": 2, "number": 3}, {"group": 7, "amount": 2, "number": 5}, {"group": 7, "amount": 2, "number": 7}, {"group": 7, "amount": 2, "number": 9},
            {"group": 9, "amount": 2, "number": 2}, {"group": 9, "amount": 2, "number": 4}, {"group": 9, "amount": 2, "number": 6}, {"group": 9, "amount": 2, "number": 8}, {"group": 9, "amount": 2, "number": 10},
            {"group": 10, "amount": 2, "number": 1}, {"group": 10, "amount": 2, "number": 3}, {"group": 10, "amount": 2, "number": 5}, {"group": 10, "amount": 2, "number": 7}, {"group": 10, "amount": 2, "number": 9},
            {"group": 4, "amount": 2, "number": 1}, {"group": 4, "amount": 2, "number": 2}, {"group": 4, "amount": 2, "number": 3}, {"group": 4, "amount": 2, "number": 4}, {"group": 4, "amount": 2, "number": 5},
            {"group": 3, "amount": 2, "number": 6}, {"group": 3, "amount": 2, "number": 7}, {"group": 3, "amount": 2, "number": 8}, {"group": 3, "amount": 2, "number": 9}, {"group": 3, "amount": 2, "number": 10},
            {"group": 1, "amount": 2, "number": 1}, {"group": 1, "amount": 2, "number": 2}, {"group": 1, "amount": 2, "number": 3}, {"group": 1, "amount": 2, "number": 4}, {"group": 1, "amount": 2, "number": 5},
            {"group": 2, "amount": 2, "number": 1}, {"group": 2, "amount": 2, "number": 3}, {"group": 2, "amount": 2, "number": 5}, {"group": 2, "amount": 2, "number": 7}, {"group": 2, "amount": 2, "number": 9}
        ]
        
        console.log('📊 分析中奖情况...')
        
        // 计算中奖情况
        let isWinner = false
        let actualPayout = 0
        let matchedNumbers = []
        
        for (let group = 1; group <= 10; group++) {
            const groupNumbers = selectedNumbers[group.toString()]
            const winningNumber = winningNumbers[group - 1]
            
            console.log(`第${group}组: 投注[${groupNumbers.join(',')}] vs 开奖${winningNumber}`)
            
            if (groupNumbers.includes(winningNumber)) {
                console.log(`  ✅ 第${group}组中奖!`)
                isWinner = true
                matchedNumbers.push(winningNumber)
                
                // 计算该组的赔付
                const groupBets = originalBets.filter(bet => bet.group === group && bet.number === winningNumber)
                const groupPayout = groupBets.reduce((sum, bet) => sum + bet.amount * 9.8, 0)
                actualPayout += groupPayout
                
                console.log(`  💰 第${group}组赔付: ${groupPayout}元`)
            } else {
                console.log(`  ❌ 第${group}组未中奖`)
            }
        }
        
        console.log(`\n📊 最终结果:`)
        console.log(`   是否中奖: ${isWinner}`)
        console.log(`   中奖数字: [${matchedNumbers.join(',')}]`)
        console.log(`   总赔付: ${actualPayout}元`)
        
        // 更新投注记录
        console.log('\n🔄 更新投注记录...')
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                is_winner: isWinner,
                actual_payout: actualPayout,
                matched_numbers: winningNumbers, // 存储所有开奖数字
                status: 'settled',
                settled_at: new Date().toISOString()
            })
        })
        
        if (updateResponse.ok) {
            console.log('✅ 投注记录更新成功!')
            
            // 更新用户余额
            console.log('\n💳 更新用户余额...')
            const userId = '313d8626-3194-4384-b6cd-0fa84f0e2db6'
            
            // 先获取当前余额
            const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=balance,total_won`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            })
            
            if (userResponse.ok) {
                const users = await userResponse.json()
                if (users && users.length > 0) {
                    const user = users[0]
                    const newBalance = parseFloat(user.balance) + actualPayout
                    const newTotalWon = parseFloat(user.total_won) + actualPayout
                    
                    console.log(`当前余额: ${user.balance}元`)
                    console.log(`当前总赢: ${user.total_won}元`)
                    console.log(`新余额: ${newBalance}元`)
                    console.log(`新总赢: ${newTotalWon}元`)
                    
                    const balanceResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'apikey': SUPABASE_ANON_KEY,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            balance: newBalance,
                            total_won: newTotalWon
                        })
                    })
                    
                    if (balanceResponse.ok) {
                        console.log('✅ 用户余额更新成功!')
                    } else {
                        console.log('❌ 用户余额更新失败')
                    }
                }
            }
            
        } else {
            const error = await updateResponse.text()
            console.log('❌ 投注记录更新失败:', error)
        }
        
        // 验证修复结果
        console.log('\n🔍 验证修复结果...')
        const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (verifyResponse.ok) {
            const bets = await verifyResponse.json()
            if (bets && bets.length > 0) {
                const bet = bets[0]
                console.log('修复后的投注记录:')
                console.log(`  状态: ${bet.status}`)
                console.log(`  是否中奖: ${bet.is_winner}`)
                console.log(`  实际赔付: ${bet.actual_payout}元`)
                console.log(`  匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                console.log(`  结算时间: ${bet.settled_at}`)
                
                if (bet.status === 'settled' && bet.is_winner && parseFloat(bet.actual_payout) === actualPayout) {
                    console.log('🎉 第261期投注记录修复成功!')
                } else {
                    console.log('⚠️ 修复可能不完整，请检查')
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 修复过程中出错:', error)
    }
}

// 运行修复
fixRound261()
