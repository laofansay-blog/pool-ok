// 直接测试数据库插入
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testDirectInsert() {
    try {
        // 先创建一个用户
        console.log('创建测试用户...')
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: '00000000-0000-0000-0000-000000000001',
                username: 'testuser',
                email: 'test@example.com',
                balance: 1000.00,
                total_bet: 0.00,
                total_won: 0.00,
                total_deposited: 1000.00,
                total_withdrawn: 0.00
            })
        })
        
        const userResult = await userResponse.text()
        console.log('创建用户响应:', userResponse.status, userResult)
        
        // 获取当前轮次
        const roundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?status=eq.pending&order=created_at.desc&limit=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const rounds = await roundResponse.json()
        console.log('当前轮次:', rounds)
        
        if (rounds.length === 0) {
            console.log('没有轮次，退出测试')
            return
        }
        
        const currentRound = rounds[0]
        
        // 尝试直接插入投注记录
        console.log('插入投注记录...')
        const betData = {
            user_id: '00000000-0000-0000-0000-000000000001',
            round_id: currentRound.id,
            selected_numbers: {
                "1": [1, 2],
                "2": [3],
                "3": [],
                "4": [],
                "5": [],
                "6": [],
                "7": [],
                "8": [],
                "9": [],
                "10": []
            },
            bet_amount: 6.00,
            potential_payout: 58.80,
            status: 'pending',
            metadata: {
                original_bets: [
                    { group: 1, number: 1, amount: 2 },
                    { group: 1, number: 2, amount: 2 },
                    { group: 2, number: 3, amount: 2 }
                ],
                bet_count: 3,
                groups_used: ["1", "2"]
            }
        }
        
        console.log('投注数据:', JSON.stringify(betData, null, 2))
        
        const betResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(betData)
        })
        
        const betResult = await betResponse.text()
        console.log('插入投注响应:', betResponse.status, betResult)
        
    } catch (error) {
        console.error('测试错误:', error)
    }
}

// 运行测试
testDirectInsert()
