// 测试新的投注函数
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testNewFunction() {
    const testData = {
        bets: [
            { group: 1, number: 1, amount: 2 },
            { group: 1, number: 2, amount: 2 },
            { group: 2, number: 3, amount: 2 }
        ],
        totalAmount: 6,
        userId: '00000000-0000-0000-0000-000000000001'
    }
    
    console.log('发送测试数据到新函数:', JSON.stringify(testData, null, 2))
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/test-bet`, {
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
            console.log('✅ 新函数测试成功!')
        } else {
            console.log('❌ 新函数测试失败')
        }
    } catch (error) {
        console.error('测试错误:', error)
    }
}

// 运行测试
testNewFunction()
