import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 自动开奖函数启动 v2.0')

    // 查找需要开奖的轮次
    const now = new Date()
    const { data: pendingRounds, error: roundsError } = await supabaseClient
      .from('rounds')
      .select('*')
      .eq('status', 'pending')
      .lte('end_time', now.toISOString())
      .order('end_time', { ascending: true })

    if (roundsError) {
      throw new Error(`查询待开奖轮次失败: ${roundsError.message}`)
    }

    if (!pendingRounds || pendingRounds.length === 0) {
      console.log('ℹ️ 没有待开奖的轮次')
      await ensureNextRoundExists(supabaseClient)
      return new Response(
        JSON.stringify({ success: true, message: '没有待开奖的轮次，已检查下一轮次' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 找到 ${pendingRounds.length} 期待开奖`)

    const results = []
    for (const round of pendingRounds) {
      try {
        const result = await processRoundDrawV2(supabaseClient, round)
        results.push(result)
      } catch (error) {
        console.error(`❌ 第${round.round_number}期开奖失败:`, error)
        results.push({
          round_number: round.round_number,
          success: false,
          error: error.message
        })
      }
    }

    await ensureNextRoundExists(supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        message: `处理了 ${pendingRounds.length} 期开奖`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 自动开奖函数执行失败:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 新版本的开奖处理函数
async function processRoundDrawV2(supabaseClient: any, round: any) {
  console.log(`\n🎯 开始处理第${round.round_number}期开奖...`)

  const drawTime = new Date().toISOString()
  
  // 1. 生成开奖数字
  const winningNumbers = generateWinningNumbers()
  console.log(`🎲 开奖数字: [${winningNumbers.join(', ')}]`)

  // 2. 更新轮次状态
  console.log(`🔄 更新轮次状态...`)
  const { error: roundUpdateError } = await supabaseClient
    .from('rounds')
    .update({
      status: 'completed',
      winning_numbers: winningNumbers,
      draw_time: drawTime
    })
    .eq('id', round.id)

  if (roundUpdateError) {
    throw new Error(`更新轮次状态失败: ${roundUpdateError.message}`)
  }
  console.log(`✅ 轮次状态更新成功`)

  // 3. 查询投注记录
  console.log(`🔍 查询投注记录...`)
  const { data: bets, error: betsError } = await supabaseClient
    .from('bets')
    .select('*')
    .eq('round_id', round.id)

  if (betsError) {
    throw new Error(`查询投注记录失败: ${betsError.message}`)
  }

  console.log(`📊 找到 ${bets?.length || 0} 笔投注`)

  if (!bets || bets.length === 0) {
    console.log(`ℹ️ 该期无投注，开奖完成`)
    return {
      round_number: round.round_number,
      winning_numbers: winningNumbers,
      total_bets: 0,
      winning_bets: 0,
      total_payout: 0,
      success: true
    }
  }

  // 4. 处理每笔投注
  let totalPayout = 0
  let winningBetsCount = 0
  const updatedBets = []

  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i]
    console.log(`\n📝 处理投注 ${i + 1}/${bets.length}: ${bet.id}`)

    try {
      // 解析数据
      let selectedNumbers = bet.selected_numbers
      let metadata = bet.metadata

      if (typeof selectedNumbers === 'string') {
        selectedNumbers = JSON.parse(selectedNumbers)
      }
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata)
      }

      // 判断中奖
      const isWinner = checkBetWinner(selectedNumbers, winningNumbers)
      console.log(`  🎯 ${isWinner ? '✅ 中奖' : '❌ 未中奖'}`)

      // 计算赔付
      let actualPayout = 0
      if (isWinner) {
        actualPayout = calculateActualPayout(selectedNumbers, winningNumbers, metadata)
        console.log(`  💰 赔付: ${actualPayout}元`)
        winningBetsCount++
        totalPayout += actualPayout
      }

      // 更新投注记录
      console.log(`  🔄 更新投注记录...`)
      const { error: updateError } = await supabaseClient
        .from('bets')
        .update({
          is_winner: isWinner,
          actual_payout: actualPayout,
          matched_numbers: winningNumbers,
          status: 'settled',
          settled_at: drawTime
        })
        .eq('id', bet.id)

      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError)
        throw new Error(`更新投注记录失败: ${updateError.message}`)
      }
      console.log(`  ✅ 投注记录更新成功`)

      // 更新用户余额
      if (isWinner && actualPayout > 0) {
        await updateUserBalance(supabaseClient, bet.user_id, actualPayout)
      }

      updatedBets.push({
        id: bet.id,
        is_winner: isWinner,
        actual_payout: actualPayout
      })

    } catch (error) {
      console.error(`  ❌ 处理投注失败:`, error)
      throw error // 重新抛出错误，确保整个流程失败
    }
  }

  // 5. 更新轮次总赔付
  console.log(`\n🔄 更新轮次总赔付: ${totalPayout}元`)
  const { error: payoutError } = await supabaseClient
    .from('rounds')
    .update({ total_payout: totalPayout })
    .eq('id', round.id)

  if (payoutError) {
    console.error(`❌ 更新总赔付失败:`, payoutError)
    throw new Error(`更新总赔付失败: ${payoutError.message}`)
  }

  console.log(`🎉 第${round.round_number}期开奖完成! ${winningBetsCount}/${bets.length} 中奖，总赔付 ${totalPayout}元`)

  return {
    round_number: round.round_number,
    winning_numbers: winningNumbers,
    total_bets: bets.length,
    winning_bets: winningBetsCount,
    total_payout: totalPayout,
    updated_bets: updatedBets,
    success: true
  }
}

// 更新用户余额
async function updateUserBalance(supabaseClient: any, userId: string, amount: number) {
  console.log(`  💳 更新用户余额: +${amount}元`)
  try {
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (userError) {
      console.error(`  ❌ 获取用户信息失败:`, userError)
      return
    }

    const currentBalance = parseFloat(userData.user?.user_metadata?.balance || '0')
    const newBalance = currentBalance + amount

    const { error: balanceError } = await supabaseClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user?.user_metadata,
        balance: newBalance.toString()
      }
    })

    if (balanceError) {
      console.error(`  ❌ 更新余额失败:`, balanceError)
    } else {
      console.log(`  ✅ 余额更新: ${currentBalance} -> ${newBalance}`)
    }
  } catch (error) {
    console.error(`  ❌ 余额更新异常:`, error)
  }
}

// 生成开奖数字
function generateWinningNumbers(): number[] {
  const numbers = []
  for (let i = 0; i < 10; i++) {
    numbers.push(Math.floor(Math.random() * 10) + 1)
  }
  return numbers
}

// 检查是否中奖
function checkBetWinner(selectedNumbers: any, winningNumbers: number[]): boolean {
  if (Array.isArray(selectedNumbers)) {
    return selectedNumbers.every(num => winningNumbers.includes(num))
  }

  let winningGroups = 0
  for (let group = 1; group <= 10; group++) {
    const groupKey = group.toString()
    const groupNumbers = selectedNumbers[groupKey] || []
    
    if (groupNumbers.length > 0) {
      const winningNumber = winningNumbers[group - 1]
      if (groupNumbers.includes(winningNumber)) {
        winningGroups++
      }
    }
  }

  return winningGroups >= 1
}

// 计算实际赔付
function calculateActualPayout(selectedNumbers: any, winningNumbers: number[], metadata: any): number {
  if (metadata && metadata.original_bets) {
    let totalPayout = 0
    metadata.original_bets.forEach((originalBet: any) => {
      const group = originalBet.group
      const number = originalBet.number
      const amount = originalBet.amount
      
      if (group >= 1 && group <= 10) {
        const winningNumber = winningNumbers[group - 1]
        if (number === winningNumber) {
          totalPayout += amount * 9.8
        }
      }
    })
    return totalPayout
  }
  return 0
}

// 确保下一轮次存在
async function ensureNextRoundExists(supabaseClient: any) {
  const { data: futureRounds, error: futureError } = await supabaseClient
    .from('rounds')
    .select('id')
    .eq('status', 'pending')
    .gt('start_time', new Date().toISOString())
    .limit(1)

  if (futureError) {
    console.error('检查未来轮次失败:', futureError)
    return
  }

  if (!futureRounds || futureRounds.length === 0) {
    console.log('创建下一轮次...')
    // 这里可以添加创建下一轮次的逻辑
  }
}
