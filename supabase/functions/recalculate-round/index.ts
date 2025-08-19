import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// 获取匹配的数字（新的JSONB格式）
function getMatchedNumbers(selectedNumbers: any, winningNumbers: number[]): any {
  // 如果是旧格式（数组），使用旧逻辑
  if (Array.isArray(selectedNumbers)) {
    return selectedNumbers.filter(num => winningNumbers.includes(num))
  }

  // 新格式（JSONB对象）
  const matchedGroups: { [key: string]: number[] } = {}

  for (let group = 1; group <= 10; group++) {
    const groupKey = group.toString()
    const groupNumbers = selectedNumbers[groupKey] || []

    if (groupNumbers.length > 0) {
      const winningNumber = winningNumbers[group - 1]
      if (groupNumbers.includes(winningNumber)) {
        matchedGroups[groupKey] = [winningNumber]
      } else {
        matchedGroups[groupKey] = []
      }
    } else {
      matchedGroups[groupKey] = []
    }
  }

  return matchedGroups
}

// 计算实际赔付金额（按单注计算）
function calculateActualPayout(selectedNumbers: any, winningNumbers: number[], metadata: any): number {
  // 如果是旧格式（数组），使用固定倍数
  if (Array.isArray(selectedNumbers)) {
    const matches = selectedNumbers.filter(num => winningNumbers.includes(num))
    return matches.length * 2 * 9.8 // 假设每注2元，9.8倍赔率
  }

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

    // 获取请求参数
    const url = new URL(req.url)
    const roundNumber = url.searchParams.get('round') || '175'

    console.log(`重新计算第${roundNumber}期的中奖情况`)

    // 获取指定轮次
    const { data: round, error: roundError } = await supabaseClient
      .from('rounds')
      .select('*')
      .eq('round_number', parseInt(roundNumber))
      .single()

    if (roundError || !round) {
      throw new Error(`未找到第${roundNumber}期轮次`)
    }

    if (!round.winning_numbers || round.winning_numbers.length === 0) {
      throw new Error(`第${roundNumber}期还未开奖`)
    }

    console.log(`第${roundNumber}期开奖数字:`, round.winning_numbers)

    // 获取该轮次的所有投注
    console.log(`查询轮次ID: ${round.id} 的投注记录...`)
    let { data: bets, error: betsError } = await supabaseClient
      .from('bets')
      .select('*')
      .eq('round_id', round.id)

    console.log(`投注查询结果:`, { bets: bets?.length || 0, error: betsError })

    // 详细输出查询到的投注记录
    if (bets && bets.length > 0) {
      console.log(`查询到的投注记录详情:`)
      bets.forEach((bet, index) => {
        console.log(`  投注${index + 1}: ${bet.id}`)
        console.log(`    用户ID: ${bet.user_id}`)
        console.log(`    轮次ID: ${bet.round_id}`)
        console.log(`    状态: ${bet.status}`)
        console.log(`    投注金额: ${bet.bet_amount}`)
        console.log(`    selected_numbers类型: ${typeof bet.selected_numbers}`)
        console.log(`    metadata类型: ${typeof bet.metadata}`)
      })
    } else {
      console.log(`没有查询到投注记录，轮次ID: ${round.id}`)
    }

    if (betsError) {
      console.error(`投注查询错误:`, betsError)
      throw new Error(`获取投注记录失败: ${betsError.message}`)
    }

    if (!bets || bets.length === 0) {
      console.log(`第${roundNumber}期没有找到投注记录，轮次ID: ${round.id}`)

      // 尝试不同的查询方式
      console.log(`尝试使用轮次号查询...`)
      const { data: betsAlt, error: betsAltError } = await supabaseClient
        .from('bets')
        .select('*, rounds!inner(round_number)')
        .eq('rounds.round_number', parseInt(roundNumber))

      console.log(`备用查询结果:`, { bets: betsAlt?.length || 0, error: betsAltError })

      if (betsAlt && betsAlt.length > 0) {
        console.log(`通过轮次号找到 ${betsAlt.length} 笔投注记录`)
        // 使用备用查询结果
        bets = betsAlt
      } else {
        return new Response(
          JSON.stringify({
            success: true,
            message: `第${roundNumber}期没有投注记录`,
            data: { round_number: roundNumber, bets_count: 0, round_id: round.id }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    let totalPayout = 0
    let winningBetsCount = 0
    let updatedBets = []

    // 重新计算每个投注的中奖情况
    console.log(`开始重新结算 ${bets.length} 笔投注...`)

    for (const bet of bets) {
      console.log(`重新结算投注 ${bet.id}...`)

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
      const isWinner = checkBetWinner(selectedNumbers, round.winning_numbers)
      console.log(`投注 ${bet.id} 中奖状态: ${isWinner}`)

      // 第二步：计算实际赔付金额
      let actualPayout = 0
      if (isWinner) {
        actualPayout = calculateActualPayout(selectedNumbers, round.winning_numbers, metadata)
        console.log(`投注 ${bet.id} 实际赔付: ${actualPayout}`)
        winningBetsCount++
        totalPayout += actualPayout
      } else {
        console.log(`投注 ${bet.id} 未中奖，赔付为0`)
      }

      // 第三步：获取匹配数字信息
      const matchedNumbers = getMatchedNumbers(selectedNumbers, round.winning_numbers)

      // 第四步：更新投注记录的核心字段
      console.log(`更新投注 ${bet.id} 的结算信息...`)
      const { error: betUpdateError } = await supabaseClient
        .from('bets')
        .update({
          is_winner: isWinner,           // 优先更新中奖状态
          actual_payout: actualPayout,   // 然后更新实际赔付
          matched_numbers: matchedNumbers,
          status: 'settled',
          settled_at: new Date().toISOString()
        })
        .eq('id', bet.id)

      if (betUpdateError) {
        console.error(`更新投注记录失败: ${betUpdateError.message}`)
        continue // 跳过余额更新，继续处理下一笔投注
      } else {
        console.log(`投注 ${bet.id} 结算信息更新成功`)

        const oldPayout = bet.actual_payout || 0
        // 如果中奖且赔付金额有变化，更新用户账户余额
        if (isWinner && actualPayout > 0 && actualPayout !== bet.actual_payout) {
          const balanceDifference = actualPayout - (bet.actual_payout || 0)

          if (balanceDifference !== 0) {
            try {
              // 获取当前用户余额
              const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(bet.user_id)

              if (userError) {
                console.error(`获取用户信息失败: ${userError.message}`)
              } else {
                const currentBalance = parseFloat(userData.user?.user_metadata?.balance || '0')
                const newBalance = currentBalance + balanceDifference

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
                  console.log(`用户 ${bet.user_id} 余额调整 ${balanceDifference.toFixed(2)} 元，从 ${currentBalance} 更新为 ${newBalance}`)
                }
              }
            } catch (error) {
              console.error(`处理用户余额更新时出错: ${error.message}`)
            }
          }
        }
        updatedBets.push({
          id: bet.id,
          user_id: bet.user_id,
          selected_numbers: bet.selected_numbers,
          bet_amount: bet.bet_amount,
          old_payout: bet.actual_payout,
          new_payout: actualPayout,
          is_winner: isWinner,
          matched_numbers: matchedNumbers
        })
      }
    }

    // 更新轮次的总赔付金额
    await supabaseClient
      .from('rounds')
      .update({ total_payout: totalPayout })
      .eq('id', round.id)

    console.log(`第${roundNumber}期重新结算完成: ${winningBetsCount}/${bets.length} 中奖，总赔付 ${totalPayout}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `第${roundNumber}期重新结算完成`,
        data: {
          round_number: roundNumber,
          winning_numbers: round.winning_numbers,
          total_bets: bets.length,
          winning_bets: winningBetsCount,
          total_payout: totalPayout,
          updated_bets: updatedBets
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('重新结算失败:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '重新结算失败',
        details: {
          name: error.name,
          stack: error.stack
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
