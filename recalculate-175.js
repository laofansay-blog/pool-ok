// 重新计算第175期的中奖情况
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function recalculateRound175() {
    try {
        console.log('开始重新计算第216期的中奖情况...')

        const response = await fetch(`${SUPABASE_URL}/functions/v1/recalculate-round?round=216`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const responseText = await response.text()
        console.log('响应状态:', response.status)
        console.log('响应内容:', responseText)

        if (response.ok) {
            const result = JSON.parse(responseText)
            console.log('✅ 重新计算成功!')
            console.log('📊 结算结果:')
            console.log(`   轮次: 第${result.data.round_number}期`)
            console.log(`   开奖数字: ${result.data.winning_numbers.join(', ')}`)
            console.log(`   总投注数: ${result.data.total_bets}`)
            console.log(`   中奖投注数: ${result.data.winning_bets}`)
            console.log(`   总赔付金额: ¥${result.data.total_payout.toFixed(2)}`)

            if (result.data.updated_bets && result.data.updated_bets.length > 0) {
                console.log('\n📋 更新的投注记录:')
                result.data.updated_bets.forEach((bet, index) => {
                    console.log(`   ${index + 1}. 投注ID: ${bet.id.slice(0, 8)}...`)
                    console.log(`      用户ID: ${bet.user_id.slice(0, 8)}...`)
                    console.log(`      投注金额: ¥${bet.bet_amount}`)
                    console.log(`      原赔付: ¥${bet.old_payout}`)
                    console.log(`      新赔付: ¥${bet.new_payout}`)
                    console.log(`      是否中奖: ${bet.is_winner ? '✅ 是' : '❌ 否'}`)

                    // 显示投注内容
                    if (typeof bet.selected_numbers === 'object' && !Array.isArray(bet.selected_numbers)) {
                        const groups = []
                        for (let group = 1; group <= 10; group++) {
                            const groupNumbers = bet.selected_numbers[group.toString()] || []
                            if (groupNumbers.length > 0) {
                                groups.push(`第${group}组: ${groupNumbers.join(',')}`)
                            }
                        }
                        console.log(`      投注内容: ${groups.join(' | ')}`)
                    }

                    // 显示匹配情况
                    if (bet.matched_numbers && typeof bet.matched_numbers === 'object') {
                        const matches = []
                        for (let group = 1; group <= 10; group++) {
                            const groupMatches = bet.matched_numbers[group.toString()] || []
                            if (groupMatches.length > 0) {
                                matches.push(`第${group}组: ${groupMatches.join(',')}`)
                            }
                        }
                        if (matches.length > 0) {
                            console.log(`      中奖组: ${matches.join(' | ')}`)
                        }
                    }
                    console.log('')
                })
            }
        } else {
            console.log('❌ 重新计算失败')
            try {
                const errorData = JSON.parse(responseText)
                console.log('错误详情:', errorData.error)
                if (errorData.details) {
                    console.log('详细信息:', errorData.details)
                }
            } catch (e) {
                console.log('无法解析错误响应')
            }
        }
    } catch (error) {
        console.error('请求错误:', error)
    }
}

// 运行重新计算
recalculateRound175()
