// 检查当前轮次
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkRounds() {
    try {
        console.log('检查当前轮次...')
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.pending&order=created_at.desc&limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (response.ok) {
            const rounds = await response.json()
            console.log('进行中的轮次:')
            rounds.forEach((round, index) => {
                console.log(`${index + 1}. 轮次 ${round.round_number}`)
                console.log(`   ID: ${round.id}`)
                console.log(`   状态: ${round.status}`)
                console.log(`   开始时间: ${round.start_time}`)
                console.log(`   结束时间: ${round.end_time}`)
                console.log(`   投注数量: ${round.total_bets_count}`)
                console.log(`   投注金额: ${round.total_bet_amount}`)
                console.log('---')
            })
            
            if (rounds.length === 0) {
                console.log('没有进行中的轮次')
            } else {
                const currentRound = rounds[0]
                const now = new Date()
                const endTime = new Date(currentRound.end_time)
                const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000))
                
                console.log(`当前轮次还有 ${timeLeft} 秒结束`)
                
                if (timeLeft > 0) {
                    console.log('✅ 可以进行投注')
                } else {
                    console.log('⚠️ 当前轮次已结束，无法投注')
                }
            }
        } else {
            const errorText = await response.text()
            console.log('查询失败:', response.status, errorText)
        }
        
    } catch (error) {
        console.error('查询错误:', error)
    }
}

// 运行检查
checkRounds()
