import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('开始执行定时开奖任务...')

    // 检查是否有需要开奖的轮次
    const now = new Date()
    const { data: pendingRounds, error: roundError } = await supabaseClient
      .from('rounds')
      .select('*')
      .eq('status', 'pending')
      .lte('end_time', now.toISOString())
      .order('end_time', { ascending: true })

    if (roundError) {
      throw new Error(`获取待开奖轮次失败: ${roundError.message}`)
    }

    console.log(`找到 ${pendingRounds?.length || 0} 个待开奖轮次`)

    if (!pendingRounds || pendingRounds.length === 0) {
      // 检查是否需要创建新轮次
      await ensureNextRoundExists(supabaseClient)

      return new Response(
        JSON.stringify({
          success: true,
          message: '没有待开奖的轮次，已检查下一轮次'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const results = []

    // 处理每个待开奖的轮次
    for (const round of pendingRounds) {
      try {
        console.log(`开始处理轮次 ${round.round_number}`)

        // 调用开奖函数
        const drawResult = await drawLottery(supabaseClient, round)
        results.push(drawResult)

        console.log(`轮次 ${round.round_number} 开奖完成`)

      } catch (error) {
        console.error(`处理轮次 ${round.round_number} 失败:`, error)
        results.push({
          roundId: round.id,
          roundNumber: round.round_number,
          success: false,
          error: error.message
        })
      }
    }

    // 确保下一轮次存在
    await ensureNextRoundExists(supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        message: '定时开奖任务完成',
        data: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('定时开奖任务失败:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '定时开奖任务失败'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// 执行开奖
async function drawLottery(supabaseClient: any, round: any) {
  // 更新轮次状态为开奖中
  await supabaseClient
    .from('rounds')
    .update({ status: 'drawing' })
    .eq('id', round.id)

  // 生成开奖数字
  const winningNumbers = generateWinningNumbers()
  const drawTime = new Date().toISOString()

  // 更新轮次开奖结果
  const { error: updateError } = await supabaseClient
    .from('rounds')
    .update({
      winning_numbers: winningNumbers,
      draw_time: drawTime,
      status: 'completed'
    })
    .eq('id', round.id)

  if (updateError) {
    throw new Error(`更新轮次失败: ${updateError.message}`)
  }

  // 获取该轮次的所有投注（移除status条件，因为可能已经被其他地方更新）
  console.log(`查询轮次 ${round.id} 的所有投注记录...`)
  const { data: bets, error: betsError } = await supabaseClient
    .from('bets')
    .select('*')
    .eq('round_id', round.id)

  console.log(`投注查询结果: 找到 ${bets?.length || 0} 笔投注`)

  if (betsError) {
    console.error(`投注查询错误:`, betsError)
    throw new Error(`获取投注记录失败: ${betsError.message}`)
  }

  // 详细输出查询到的投注记录
  if (bets && bets.length > 0) {
    console.log(`查询到的投注记录详情:`)
    bets.forEach((bet, index) => {
      console.log(`  投注${index + 1}: ${bet.id}`)
      console.log(`    用户ID: ${bet.user_id}`)
      console.log(`    轮次ID: ${bet.round_id}`)
      console.log(`    状态: ${bet.status}`)
      console.log(`    投注金额: ${bet.bet_amount}`)
      console.log(`    当前actual_payout: ${bet.actual_payout}`)
      console.log(`    当前is_winner: ${bet.is_winner}`)
      console.log(`    selected_numbers类型: ${typeof bet.selected_numbers}`)
      console.log(`    metadata类型: ${typeof bet.metadata}`)
    })
  } else {
    console.log(`❌ 没有查询到投注记录，轮次ID: ${round.id}`)
    console.log(`这就是为什么投注记录没有被更新的原因！`)
  }

  let totalPayout = 0
  let winningBetsCount = 0

  // 处理每个投注的结算
  if (bets && bets.length > 0) {
    console.log(`开始结算 ${bets.length} 笔投注...`)

    for (const bet of bets) {
      console.log(`结算投注 ${bet.id}...`)

      // 解析数据格式（如果是字符串则解析为对象）
      let selectedNumbers = bet.selected_numbers
      let metadata = bet.metadata

      if (typeof selectedNumbers === 'string') {
        try {
          selectedNumbers = JSON.parse(selectedNumbers)
          console.log(`投注 ${bet.id} selected_numbers 解析成功`)
        } catch (e) {
          console.error(`投注 ${bet.id} selected_numbers 解析失败:`, e)
        }
      }

      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata)
          console.log(`投注 ${bet.id} metadata 解析成功`)
        } catch (e) {
          console.error(`投注 ${bet.id} metadata 解析失败:`, e)
        }
      }

      // 第一步：判断是否中奖
      const isWinner = checkBetWinner(selectedNumbers, winningNumbers)
      console.log(`投注 ${bet.id} 中奖状态: ${isWinner}`)

      // 第二步：计算实际赔付金额
      let actualPayout = 0
      if (isWinner) {
        actualPayout = calculateActualPayout(selectedNumbers, winningNumbers, metadata)
        console.log(`投注 ${bet.id} 实际赔付: ${actualPayout}`)
        winningBetsCount++
        totalPayout += actualPayout
      } else {
        console.log(`投注 ${bet.id} 未中奖，赔付为0`)
      }

      // 第三步：获取匹配数字信息

      // 第四步：更新投注记录的核心字段
      console.log(`更新投注 ${bet.id} 的结算信息...`)
      const { error: betUpdateError } = await supabaseClient
        .from('bets')
        .update({
          is_winner: isWinner,           // 优先更新中奖状态
          actual_payout: actualPayout,   // 然后更新实际赔付
          matched_numbers: winningNumbers,
          status: 'settled',
          settled_at: drawTime
        })
        .eq('id', bet.id)

      if (betUpdateError) {
        console.error(`更新投注记录失败: ${betUpdateError.message}`)
        continue // 跳过余额更新，继续处理下一笔投注
      } else {
        console.log(`投注 ${bet.id} 结算信息更新成功`)
      }

      // 如果中奖，更新用户账户余额
      if (isWinner && actualPayout > 0) {
        try {
          // 获取当前用户余额
          const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(bet.user_id)

          if (userError) {
            console.error(`获取用户信息失败: ${userError.message}`)
          } else {
            const currentBalance = parseFloat(userData.user?.user_metadata?.balance || '0')
            const newBalance = currentBalance + actualPayout

            // 更新用户余额
            const { error: balanceUpdateError } = await supabaseClient.auth.admin.updateUserById(bet.user_id, {
              user_metadata: {
                ...userData.user?.user_metadata,
                balance: newBalance.toString()
              }
            })

            if (balanceUpdateError) {
              console.error(`更新用户余额失败: ${balanceUpdateError.message}`)
            } else {
              console.log(`用户 ${bet.user_id} 中奖 ${actualPayout} 元，余额从 ${currentBalance} 更新为 ${newBalance}`)
            }
          }
        } catch (error) {
          console.error(`处理用户余额更新时出错: ${error.message}`)
        }
      }
    }
  }

  // 更新轮次的总赔付金额
  await supabaseClient
    .from('rounds')
    .update({ total_payout: totalPayout })
    .eq('id', round.id)

  return {
    roundId: round.id,
    roundNumber: round.round_number,
    winningNumbers,
    totalBets: bets?.length || 0,
    winningBets: winningBetsCount,
    totalPayout,
    success: true
  }
}

// 确保下一轮次存在
async function ensureNextRoundExists(supabaseClient: any) {
  // 检查是否有未来的轮次
  const futureTime = new Date(Date.now() + 10 * 60 * 1000) // 10分钟后
  const { data: futureRounds, error: futureError } = await supabaseClient
    .from('rounds')
    .select('id')
    .eq('status', 'pending')
    .gte('start_time', new Date().toISOString())
    .limit(1)

  if (futureError) {
    console.error('检查未来轮次失败:', futureError)
    return
  }

  if (futureRounds && futureRounds.length > 0) {
    console.log('已存在未来轮次，无需创建')
    return
  }

  // 创建新轮次
  await createNextRound(supabaseClient)
}

// 创建下一轮次
async function createNextRound(supabaseClient: any) {
  try {
    // 获取最新的轮次号
    const { data: latestRound, error: latestError } = await supabaseClient
      .from('rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1)
      .single()

    if (latestError && latestError.code !== 'PGRST116') {
      throw new Error(`获取最新轮次失败: ${latestError.message}`)
    }

    const nextRoundNumber = latestRound ? latestRound.round_number + 1 : 1
    const now = new Date()
    const startTime = new Date(now.getTime() + 60000) // 1分钟后开始
    const endTime = new Date(startTime.getTime() + 5 * 60000) // 5分钟后结束

    // 创建新轮次
    const { error: createError } = await supabaseClient
      .from('rounds')
      .insert({
        round_number: nextRoundNumber,
        winning_numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 占位符
        status: 'pending',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      })

    if (createError) {
      throw new Error(`创建新轮次失败: ${createError.message}`)
    }

    console.log(`创建新轮次 ${nextRoundNumber} 成功`)

  } catch (error) {
    console.error('创建下一轮次失败:', error)
  }
}

// 生成随机开奖数字
function generateWinningNumbers(): number[] {
  const numbers: number[] = []
  for (let i = 0; i < 10; i++) {
    numbers.push(Math.floor(Math.random() * 10) + 1)
  }
  return numbers
}

// 检查投注是否中奖（新的JSONB格式）
function checkBetWinner(selectedNumbers: any, winningNumbers: number[]): boolean {
  // 如果是旧格式（数组），使用旧逻辑
  if (Array.isArray(selectedNumbers)) {
    return selectedNumbers.every(num => winningNumbers.includes(num))
  }

  // 新格式（JSONB对象）
  // 计算中奖组数和总投注组数
  let totalGroups = 0
  let winningGroups = 0

  for (let group = 1; group <= 10; group++) {
    const groupKey = group.toString()
    const groupNumbers = selectedNumbers[groupKey] || []

    if (groupNumbers.length > 0) {
      totalGroups++
      // 检查该组的开奖数字是否在用户选择的数字中
      const winningNumber = winningNumbers[group - 1] // 开奖数字数组索引从0开始
      if (groupNumbers.includes(winningNumber)) {
        winningGroups++
      }
    }
  }

  // 如果没有投注任何组，则不中奖
  if (totalGroups === 0) {
    return false
  }

  // 中奖条件：只要有一组中奖就算中奖
  return winningGroups >= 1
}

// 计算实际赔付金额（按单注计算）
function calculateActualPayout(selectedNumbers: any, winningNumbers: number[], metadata: any): number {
  // 新格式（JSONB对象）- 按单注计算
  if (metadata && metadata.original_bets) {
    let totalPayout = 0

    // 遍历每个原始投注
    metadata.original_bets.forEach((originalBet: any) => {
      const group = originalBet.group
      const number = originalBet.number
      const amount = originalBet.amount

      // 检查这一注是否中奖
      if (group >= 1 && group <= 10) {
        const winningNumber = winningNumbers[group - 1]
        if (number === winningNumber) {
          // 这一注中奖，赔付 = 投注金额 × 9.8
          totalPayout += amount * 9.8
        }
      }
    })

    return totalPayout
  }

  // 如果没有原始投注数据，按组计算
  let totalPayout = 0
  let totalBetAmount = 0
  let winningGroups = 0

  for (let group = 1; group <= 10; group++) {
    const groupKey = group.toString()
    const groupNumbers = selectedNumbers[groupKey] || []

    if (groupNumbers.length > 0) {
      // 假设每个数字投注2元
      const groupBetAmount = groupNumbers.length * 2
      totalBetAmount += groupBetAmount

      const winningNumber = winningNumbers[group - 1]
      if (groupNumbers.includes(winningNumber)) {
        winningGroups++
        // 这组中奖，赔付 = 2元 × 9.8
        totalPayout += 2 * 9.8
      }
    }
  }

  return totalPayout
}
