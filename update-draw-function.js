// 通过API更新 draw_current_round 函数
const fs = require('fs')
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function updateDrawFunction() {
    try {
        console.log('🔄 更新 draw_current_round 函数...')
        
        // 读取SQL文件
        const sqlContent = fs.readFileSync('database/updated-draw-function.sql', 'utf8')
        
        // 通过RPC执行SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                sql: sqlContent
            })
        })
        
        if (response.ok) {
            const result = await response.json()
            console.log('✅ 函数更新成功!')
            console.log('结果:', result)
        } else {
            console.log('❌ 函数更新失败')
            console.log('状态:', response.status)
            const error = await response.text()
            console.log('错误:', error)
            
            // 尝试直接替换原文件中的函数
            console.log('\n🔄 尝试直接更新原文件...')
            await updateOriginalFile()
        }
        
    } catch (error) {
        console.error('❌ 更新过程中出错:', error)
        
        // 尝试直接替换原文件中的函数
        console.log('\n🔄 尝试直接更新原文件...')
        await updateOriginalFile()
    }
}

async function updateOriginalFile() {
    try {
        // 读取原文件
        const originalContent = fs.readFileSync('database/round-management.sql', 'utf8')
        
        // 读取新函数
        const newFunctionContent = fs.readFileSync('database/updated-draw-function.sql', 'utf8')
        
        // 提取新函数的内容（去掉开头的注释）
        const functionStart = newFunctionContent.indexOf('CREATE OR REPLACE FUNCTION public.draw_current_round()')
        const newFunction = newFunctionContent.substring(functionStart)
        
        // 在原文件中找到旧函数的位置
        const oldFunctionStart = originalContent.indexOf('CREATE OR REPLACE FUNCTION public.draw_current_round()')
        const oldFunctionEnd = originalContent.indexOf('$$ LANGUAGE plpgsql SECURITY DEFINER;', oldFunctionStart) + '$$ LANGUAGE plpgsql SECURITY DEFINER;'.length
        
        if (oldFunctionStart === -1) {
            console.log('❌ 在原文件中找不到旧函数')
            return
        }
        
        // 替换函数
        const updatedContent = originalContent.substring(0, oldFunctionStart) + 
                              newFunction + 
                              originalContent.substring(oldFunctionEnd)
        
        // 写回文件
        fs.writeFileSync('database/round-management.sql', updatedContent)
        
        console.log('✅ 原文件已更新!')
        console.log('📝 请手动执行以下命令来应用更改:')
        console.log('   1. 登录 Supabase Dashboard')
        console.log('   2. 进入 SQL Editor')
        console.log('   3. 执行 database/round-management.sql 文件')
        console.log('   或者复制新函数内容手动执行')
        
    } catch (error) {
        console.error('❌ 更新原文件失败:', error)
    }
}

// 运行更新
updateDrawFunction()
