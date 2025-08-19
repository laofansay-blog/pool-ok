// 检查最近几期的数据一致性
const SUPABASE_URL = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

async function checkRecentRounds() {
    try {
        console.log('检查最近几期的数据一致性...')
        
        // 查询最近10期的轮次信息
        const roundsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rounds?select=*&order=round_number.desc&limit=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        })
        
        const rounds = await roundsResponse.json()
        console.log(`\n找到 ${rounds.length} 期最近的轮次数据`)
        
        // 分析每期的数据
        for (const round of rounds) {
            console.log(`\n=== 第${round.round_number}期 ===`)
            console.log(`状态: ${round.status}`)
            console.log(`总投注金额: ${round.total_bet_amount}`)
            console.log(`总赔付金额: ${round.total_payout}`)
            console.log(`投注数量: ${round.total_bets_count}`)
            console.log(`开奖时间: ${round.draw_time}`)
            
            // 检查数据一致性
            if (round.status === 'completed') {
                if (round.total_bet_amount > 0 && round.total_payout === 0) {
                    console.log(`⚠️ 可能问题: 有投注但赔付为0`)
                } else if (round.total_bet_amount > 0 && round.total_payout > 0) {
                    console.log(`✅ 正常: 有投注且有赔付`)
                } else if (round.total_bet_amount === 0) {
                    console.log(`ℹ️ 无投注: 该期无人投注`)
                }
                
                // 计算赔付率
                if (round.total_bet_amount > 0) {
                    const payoutRate = (round.total_payout / round.total_bet_amount * 100).toFixed(2)
                    console.log(`赔付率: ${payoutRate}%`)
                }
            } else {
                console.log(`ℹ️ 状态: ${round.status}`)
            }
        }
        
        // 重点检查第193期
        const round193 = rounds.find(r => r.round_number === 193)
        if (round193) {
            console.log(`\n🔍 第193期详细分析:`)
            console.log(`轮次ID: ${round193.id}`)
            console.log(`开奖数字: [${round193.winning_numbers.join(', ')}]`)
            console.log(`更新时间: ${round193.updated_at}`)
            
            // 尝试通过服务端函数重新验证
            console.log(`\n🔄 建议操作:`)
            console.log(`1. 重新计算第193期: node recalculate-175.js`)
            console.log(`2. 检查前端登录状态`)
            console.log(`3. 清除浏览器缓存`)
            console.log(`4. 在个人中心查看投注记录`)
        }
        
        // 检查是否有其他期次存在类似问题
        const problematicRounds = rounds.filter(r => 
            r.status === 'completed' && 
            r.total_bet_amount > 0 && 
            r.total_payout === 0
        )
        
        if (problematicRounds.length > 0) {
            console.log(`\n⚠️ 发现 ${problematicRounds.length} 期可能存在赔付问题:`)
            problematicRounds.forEach(r => {
                console.log(`  第${r.round_number}期: 投注${r.total_bet_amount}元，赔付${r.total_payout}元`)
            })
        } else {
            console.log(`\n✅ 其他期次数据看起来正常`)
        }
        
    } catch (error) {
        console.error('检查过程中出错:', error)
    }
}

// 运行检查
checkRecentRounds()
