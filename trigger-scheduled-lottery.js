// 手动触发定时开奖函数
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function triggerScheduledLottery() {
    try {
        console.log('手动触发定时开奖函数...')

        const response = await fetch(`${SUPABASE_URL}/functions/v1/scheduled-lottery-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({})
        })

        console.log('响应状态:', response.status)

        const result = await response.json()
        console.log('响应内容:', JSON.stringify(result, null, 2))

        if (result.success) {
            console.log('✅ 定时开奖执行成功!')
            if (result.data && result.data.length > 0) {
                console.log('📊 开奖结果:')
                result.data.forEach(round => {
                    console.log(`   轮次: 第${round.roundNumber}期`)
                    console.log(`   开奖数字: ${round.winningNumbers?.join(', ') || '未知'}`)
                    console.log(`   投注数: ${round.totalBets || 0}`)
                    console.log(`   中奖数: ${round.winningBets || 0}`)
                    console.log(`   总赔付: ¥${round.totalPayout || 0}`)
                })
            } else {
                console.log('ℹ️ 没有待开奖的轮次')
            }
        } else {
            console.log('❌ 定时开奖执行失败:', result.error || result.message)
        }

    } catch (error) {
        console.error('触发定时开奖失败:', error)
    }
}

// 运行触发
triggerScheduledLottery()
