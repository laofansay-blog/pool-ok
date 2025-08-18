// 使用现有用户测试投注功能
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testBetWithExistingUser(userId) {
    if (!userId) {
        console.log('请提供用户ID作为参数')
        console.log('用法: node test-bet-existing-user.js <用户ID>')
        return
    }

    const testData = {
        bets: [
            { group: 1, number: 1, amount: 2 },
            { group: 1, number: 2, amount: 2 },
            { group: 2, number: 3, amount: 2 }
        ],
        totalAmount: 6,
        userId: userId
    }
    
    console.log('使用现有用户测试投注:', userId)
    console.log('发送投注数据:', JSON.stringify(testData, null, 2))
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/place-bet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(testData)
        })
        
        const responseText = await response.text()
        console.log('响应状态:', response.status)
        console.log('响应内容:', responseText)
        
        if (response.ok) {
            console.log('✅ 投注测试成功!')
            const result = JSON.parse(responseText)
            if (result.data) {
                console.log('投注ID:', result.data.betId)
                console.log('轮次:', result.data.roundNumber)
                console.log('总金额:', result.data.totalAmount)
                console.log('潜在赔付:', result.data.totalPotentialPayout)
            }
        } else {
            console.log('❌ 投注测试失败')
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
        console.error('测试错误:', error)
    }
}

// 从命令行参数获取用户ID
const userId = process.argv[2]
testBetWithExistingUser(userId)
