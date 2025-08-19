// 检查RLS策略和权限设置
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkRLSPolicies() {
    try {
        console.log('检查RLS策略和权限设置...')
        
        // 查询bets表的RLS策略
        const policiesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_policies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                table_name: 'bets'
            })
        })
        
        if (policiesResponse.ok) {
            const policies = await policiesResponse.json()
            console.log('Bets表RLS策略:', policies)
        } else {
            console.log('无法查询RLS策略，可能没有相关权限')
        }
        
        // 尝试查询表结构
        const tableInfoResponse = await fetch(`${SUPABASE_URL}/rest/v1/bets?limit=0`, {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        console.log('表访问状态码:', tableInfoResponse.status)
        console.log('表访问响应头:', Object.fromEntries(tableInfoResponse.headers.entries()))
        
        // 检查当前用户权限
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        if (userResponse.ok) {
            const user = await userResponse.json()
            console.log('当前用户信息:', user)
        } else {
            console.log('当前用户状态:', userResponse.status, userResponse.statusText)
        }
        
        // 建议解决方案
        console.log('\n💡 解决方案建议:')
        console.log('1. 确保用户已正确登录')
        console.log('2. 检查投注记录是否属于当前登录用户')
        console.log('3. 清除浏览器缓存并重新登录')
        console.log('4. 在前端使用正确的用户认证token查询')
        
        console.log('\n🔧 前端调试步骤:')
        console.log('1. 打开浏览器开发者工具')
        console.log('2. 查看Network标签页的API请求')
        console.log('3. 检查请求头是否包含正确的Authorization token')
        console.log('4. 查看响应是否返回空数组[]或错误信息')
        
    } catch (error) {
        console.error('检查过程中出错:', error)
    }
}

// 运行检查
checkRLSPolicies()
