// 查看第175期的详细投注数据
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function check175Details() {
    try {
        console.log('查询第175期的详细数据...')
        
        // 查询第175期轮次信息
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.175&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const rounds = await roundResponse.json()
        console.log('第175期轮次信息:', rounds)
        
        if (rounds.length === 0) {
            console.log('未找到第175期数据')
            return
        }
        
        const round = rounds[0]
        console.log('开奖数字:', round.winning_numbers)
        
        // 查询该轮次的投注记录
        const betsResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?round_id=eq.${round.id}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const bets = await betsResponse.json()
        console.log('投注记录数量:', bets.length)
        
        bets.forEach((bet, index) => {
            console.log(`\n=== 投注记录 ${index + 1} ===`)
            console.log('投注ID:', bet.id)
            console.log('用户ID:', bet.user_id)
            console.log('投注金额:', bet.bet_amount)
            console.log('潜在赔付:', bet.potential_payout)
            console.log('实际赔付:', bet.actual_payout)
            console.log('是否中奖:', bet.is_winner)
            console.log('投注状态:', bet.status)
            console.log('投注时间:', bet.placed_at)
            console.log('结算时间:', bet.settled_at)
            
            // 分析投注内容
            console.log('\n投注内容分析:')
            if (typeof bet.selected_numbers === 'object' && !Array.isArray(bet.selected_numbers)) {
                let totalGroups = 0
                let winningGroups = 0
                const groupDetails = []
                
                for (let group = 1; group <= 10; group++) {
                    const groupNumbers = bet.selected_numbers[group.toString()] || []
                    if (groupNumbers.length > 0) {
                        totalGroups++
                        const winningNumber = round.winning_numbers[group - 1]
                        const isWinning = groupNumbers.includes(winningNumber)
                        if (isWinning) winningGroups++
                        
                        groupDetails.push({
                            group: group,
                            numbers: groupNumbers,
                            winningNumber: winningNumber,
                            isWinning: isWinning
                        })
                        
                        console.log(`第${group}组: [${groupNumbers.join(',')}] → 开奖${winningNumber} ${isWinning ? '✅中奖' : '❌未中奖'}`)
                    }
                }
                
                console.log(`\n统计: ${totalGroups}组投注，${winningGroups}组中奖，中奖率${((winningGroups/totalGroups)*100).toFixed(1)}%`)
                
                // 按照你的计算方式
                if (bet.metadata && bet.metadata.original_bets) {
                    console.log('\n原始投注明细:')
                    let totalWinningBets = 0
                    let totalBetAmount = 0
                    
                    bet.metadata.original_bets.forEach(originalBet => {
                        const group = originalBet.group
                        const number = originalBet.number
                        const amount = originalBet.amount
                        const winningNumber = round.winning_numbers[group - 1]
                        const isWinning = number === winningNumber
                        
                        if (isWinning) totalWinningBets++
                        totalBetAmount += amount
                        
                        console.log(`  第${group}组-${number}: ${amount}元 → 开奖${winningNumber} ${isWinning ? '✅中奖' : '❌未中奖'}`)
                    })
                    
                    console.log(`\n按单注计算:`)
                    console.log(`总投注: ${bet.metadata.original_bets.length}注`)
                    console.log(`中奖注数: ${totalWinningBets}注`)
                    console.log(`总投注金额: ${totalBetAmount}元`)
                    console.log(`按你的计算方式: ${totalWinningBets} × 2 × 9.8 = ${totalWinningBets * 2 * 9.8}元`)
                    console.log(`实际赔付: ${bet.actual_payout}元`)
                    console.log(`差异: ${bet.actual_payout - (totalWinningBets * 2 * 9.8)}元`)
                }
            }
            
            console.log('匹配数字:', bet.matched_numbers)
            console.log('元数据:', bet.metadata)
        })
        
    } catch (error) {
        console.error('查询错误:', error)
    }
}

// 运行查询
check175Details()
