// 测试用户是否存在
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkUser() {
    try {
        // 检查用户是否存在
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.00000000-0000-0000-0000-000000000001`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })

        const users = await response.json()
        console.log('用户查询结果:', users)

        if (users.length === 0) {
            console.log('用户不存在，创建测试用户...')

            // 创建测试用户
            const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
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

            const createResult = await createResponse.text()
            console.log('创建用户响应:', createResponse.status, createResult)
        } else {
            console.log('用户已存在:', users[0])
        }

        // 检查当前轮次
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
            console.log('没有进行中的轮次，创建测试轮次...')

            const now = new Date()
            const startTime = new Date(now.getTime() - 60000) // 1分钟前开始
            const endTime = new Date(now.getTime() + 5 * 60000) // 5分钟后结束

            const createRoundResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    round_number: 1,
                    winning_numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    status: 'pending',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    total_bets_count: 0,
                    total_bet_amount: 0.00,
                    total_payout: 0.00
                })
            })

            const createRoundResult = await createRoundResponse.text()
            console.log('创建轮次响应:', createRoundResponse.status, createRoundResult)
        }

    } catch (error) {
        console.error('检查用户错误:', error)
    }
}

// 运行检查
checkUser()
