// 简单调试投注记录
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function simpleDebug() {
    try {
        const betId = '3a2e9511-2cc5-442c-988f-09917894759b'
        
        console.log('查询投注记录...')
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}&select=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const result = await response.json()
        console.log('查询结果:', JSON.stringify(result, null, 2))
        
        if (Array.isArray(result) && result.length > 0) {
            const bet = result[0]
            console.log('\n投注记录详情:')
            console.log(`ID: ${bet.id}`)
            console.log(`轮次ID: ${bet.round_id}`)
            console.log(`状态: ${bet.status}`)
            console.log(`是否中奖: ${bet.is_winner}`)
            console.log(`实际赔付: ${bet.actual_payout}`)
            console.log(`匹配数字: ${JSON.stringify(bet.matched_numbers)}`)
        } else {
            console.log('❌ 查询失败或无结果')
        }
        
    } catch (error) {
        console.error('调试失败:', error)
    }
}

simpleDebug()
