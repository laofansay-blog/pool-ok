// 手动开奖第203期
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function manualDraw203() {
    try {
        console.log('手动开奖第204期...')

        const response = await fetch(`${SUPABASE_URL}/functions/v1/draw-lottery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                round_number: 204
            })
        })

        console.log('响应状态:', response.status)

        const result = await response.json()
        console.log('响应内容:', JSON.stringify(result, null, 2))

        if (result.success) {
            console.log('✅ 手动开奖成功!')
            console.log('📊 开奖结果:')
            console.log(`   轮次: 第${result.data.round_number}期`)
            console.log(`   开奖数字: [${result.data.winning_numbers.join(', ')}]`)
            console.log(`   投注数: ${result.data.total_bets}`)
            console.log(`   中奖数: ${result.data.winning_bets}`)
            console.log(`   总赔付: ¥${result.data.total_payout}`)

            if (result.data.updated_bets && result.data.updated_bets.length > 0) {
                console.log('\n📋 更新的投注记录:')
                result.data.updated_bets.forEach((bet, index) => {
                    console.log(`   投注${index + 1}: ${bet.id}`)
                    console.log(`     中奖状态: ${bet.is_winner}`)
                    console.log(`     实际赔付: ¥${bet.actual_payout}`)
                    console.log(`     匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
                })
            } else {
                console.log('\n⚠️ 没有返回更新的投注记录')
            }
        } else {
            console.log('❌ 手动开奖失败:', result.error || result.message)
        }

    } catch (error) {
        console.error('手动开奖失败:', error)
    }
}

// 运行手动开奖
manualDraw203()
