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
  // 检查每个组中选择的数字是否与对应位置的开奖数字匹配
  for (let group = 1; group <= 10; group++) {
    const groupKey = group.toString()
    const groupNumbers = selectedNumbers[groupKey] || []

    if (groupNumbers.length > 0) {
      // 检查该组的开奖数字是否在用户选择的数字中
      const winningNumber = winningNumbers[group - 1] // 开奖数字数组索引从0开始
      if (!groupNumbers.includes(winningNumber)) {
        return false // 如果任何一组没有匹配，则不中奖
      }
    }
  }

  return true // 所有有投注的组都匹配
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
          for (const bet of bets) {
            const isWinner = checkBetWinner(bet.selected_numbers, winningNumbers)
            const matchedNumbers = getMatchedNumbers(bet.selected_numbers, winningNumbers)
            const actualPayout = isWinner ? bet.potential_payout : 0

            if (isWinner) {
              winningBetsCount++
              totalPayout += actualPayout
            }

            // 更新投注记录
            const { error: betUpdateError } = await supabaseClient
              .from('bets')
              .update({
                is_winner: isWinner,
                matched_numbers: matchedNumbers,
                actual_payout: actualPayout,
                status: 'settled',
                settled_at: drawTime
              })
              .eq('id', bet.id)

            if (betUpdateError) {
              console.error(`更新投注记录失败: ${betUpdateError.message}`)
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
