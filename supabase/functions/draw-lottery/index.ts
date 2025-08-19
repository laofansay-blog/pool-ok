import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 验证请求方法
    if (req.method !== 'POST') {
      throw new Error('只支持 POST 请求')
    }

    // 获取当前待开奖的轮次
    const { data: pendingRounds, error: roundError } = await supabaseClient
      .from('rounds')
      .select('*')
      .eq('status', 'pending')
      .lte('end_time', new Date().toISOString())
      .order('end_time', { ascending: true })

    if (roundError) {
      throw new Error(`获取待开奖轮次失败: ${roundError.message}`)
    }

    if (!pendingRounds || pendingRounds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '没有待开奖的轮次'
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

        // 获取该轮次的所有投注
        const { data: bets, error: betsError } = await supabaseClient
          .from('bets')
          .select('*')
          .eq('round_id', round.id)
          .eq('status', 'pending')

        if (betsError) {
          throw new Error(`获取投注记录失败: ${betsError.message}`)
        }

        let totalPayout = 0
        let winningBetsCount = 0

        // 处理每个投注的结算
        if (bets && bets.length > 0) {
          console.log(`开始结算 ${bets.length} 笔投注...`)

          for (const bet of bets) {
            console.log(`结算投注 ${bet.id}...`)

            // 第一步：判断是否中奖
            const isWinner = checkBetWinner(bet.selected_numbers, winningNumbers)
            console.log(`投注 ${bet.id} 中奖状态: ${isWinner}`)

            // 第二步：计算实际赔付金额
            let actualPayout = 0
            if (isWinner) {
              actualPayout = calculateActualPayout(bet.selected_numbers, winningNumbers, bet.metadata)
              console.log(`投注 ${bet.id} 实际赔付: ${actualPayout}`)
              winningBetsCount++
              totalPayout += actualPayout
            } else {
              console.log(`投注 ${bet.id} 未中奖，赔付为0`)
            }

            // 第三步：获取匹配数字信息
            const matchedNumbers = getMatchedNumbers(bet.selected_numbers, winningNumbers)

            // 第四步：更新投注记录的核心字段
            console.log(`更新投注 ${bet.id} 的结算信息...`)
            const { error: betUpdateError } = await supabaseClient
              .from('bets')
              .update({
                is_winner: isWinner,           // 优先更新中奖状态
                actual_payout: actualPayout,   // 然后更新实际赔付
                matched_numbers: matchedNumbers,
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

        results.push({
          roundId: round.id,
          roundNumber: round.round_number,
          winningNumbers,
          totalBets: bets?.length || 0,
          winningBets: winningBetsCount,
          totalPayout
        })

        console.log(`轮次 ${round.round_number} 开奖完成:`, {
          winningNumbers,
          totalBets: bets?.length || 0,
          winningBets: winningBetsCount,
          totalPayout
        })

      } catch (error) {
        console.error(`处理轮次 ${round.round_number} 失败:`, error)

        // 回滚轮次状态
        await supabaseClient
          .from('rounds')
          .update({ status: 'pending' })
          .eq('id', round.id)
      }
    }

    // 创建下一轮次
    await createNextRound(supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        message: '开奖完成',
        data: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('开奖失败:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '开奖失败'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

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
