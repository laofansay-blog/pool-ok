// 测试函数版本
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function testFunctionVersion() {
    try {
        // 发送GET请求来测试函数版本
        const response = await fetch(`${SUPABASE_URL}/functions/v1/place-bet`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const responseText = await response.text()
        console.log('GET请求响应状态:', response.status)
        console.log('GET请求响应内容:', responseText)
        
    } catch (error) {
        console.error('测试错误:', error)
    }
}

// 运行测试
testFunctionVersion()
