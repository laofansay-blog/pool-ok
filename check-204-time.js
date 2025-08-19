// 检查第204期的时间设置
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function check204Time() {
    try {
        console.log('检查第213期的时间设置...')

        // 查询第213期的详细信息
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rounds?round_number=eq.213&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const rounds = await response.json()
        console.log('第204期详细信息:', rounds)

        if (rounds.length > 0) {
            const round = rounds[0]
            const now = new Date()
            const startTime = new Date(round.start_time)
            const endTime = new Date(round.end_time)

            console.log('\n📅 时间信息:')
            console.log(`当前时间: ${now.toISOString()}`)
            console.log(`开始时间: ${round.start_time}`)
            console.log(`结束时间: ${round.end_time}`)
            console.log(`状态: ${round.status}`)

            console.log('\n⏰ 时间对比:')
            console.log(`距离开始: ${startTime > now ? '未开始' : '已开始'} (${Math.abs(startTime - now) / 1000 / 60}分钟)`)
            console.log(`距离结束: ${endTime > now ? '未结束' : '已结束'} (${Math.abs(endTime - now) / 1000 / 60}分钟)`)

            if (endTime <= now && round.status === 'pending') {
                console.log('\n✅ 第204期应该可以开奖了！')
                console.log('💡 建议: 再次触发定时开奖或手动开奖')
            } else if (endTime > now) {
                console.log(`\n⏳ 第204期还需要等待 ${(endTime - now) / 1000 / 60} 分钟才能开奖`)
            } else {
                console.log('\n❓ 第204期状态异常，请检查')
            }

            // 检查投注信息
            console.log('\n💰 投注信息:')
            console.log(`总投注金额: ${round.total_bet_amount}`)
            console.log(`投注数量: ${round.total_bets_count}`)
            console.log(`总赔付金额: ${round.total_payout}`)
        } else {
            console.log('❌ 未找到第204期信息')
        }

    } catch (error) {
        console.error('检查失败:', error)
    }
}

// 运行检查
check204Time()
