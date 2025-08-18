// 查看现有用户列表
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function listUsers() {
    try {
        console.log('查询现有用户...')
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,username,email,balance&limit=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (response.ok) {
            const users = await response.json()
            console.log('找到的用户:')
            users.forEach((user, index) => {
                console.log(`${index + 1}. ID: ${user.id}`)
                console.log(`   用户名: ${user.username || '未设置'}`)
                console.log(`   邮箱: ${user.email || '未设置'}`)
                console.log(`   余额: ${user.balance || 0}`)
                console.log('---')
            })
            
            if (users.length === 0) {
                console.log('没有找到用户')
            }
        } else {
            const errorText = await response.text()
            console.log('查询失败:', response.status, errorText)
        }
        
    } catch (error) {
        console.error('查询错误:', error)
    }
}

// 运行查询
listUsers()
