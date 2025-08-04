import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BetRequest {
  bets: Array<{
    group: number
    number: number
    amount: number
  }>
  totalAmount: number
  userId: string
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

    // 解析请求体
    const requestBody = await req.json()
    console.log('收到的请求数据:', JSON.stringify(requestBody, null, 2))

    const { bets, totalAmount, userId }: BetRequest = requestBody

    // 验证输入参数
    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      throw new Error('下注信息不能为空')
    }

    if (!totalAmount || totalAmount <= 0) {
      throw new Error('下注金额必须大于0')
    }

    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    // 验证每个下注项
    for (const bet of bets) {
      if (!bet.group || bet.group < 1 || bet.group > 10) {
        throw new Error('组号必须在1-10之间')
      }
      if (!bet.number || bet.number < 1 || bet.number > 10) {
        throw new Error('数字必须在1-10之间')
      }
      if (!bet.amount || bet.amount <= 0) {
        throw new Error('单注金额必须大于0')
      }
    }

    // 验证总金额是否匹配
    const calculatedTotal = bets.reduce((sum, bet) => sum + bet.amount, 0)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      throw new Error('总金额计算不匹配')
    }

    // 获取当前进行中的轮次
    const { data: currentRound, error: roundError } = await supabaseClient
      .from('rounds')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError || !currentRound) {
      throw new Error('当前没有可投注的轮次')
    }

    // 检查是否还在投注时间内
    const now = new Date()
    const endTime = new Date(currentRound.end_time)
    if (now >= endTime) {
      throw new Error('当前轮次已结束投注')
    }

    // 检查用户余额
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('balance, total_bet')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('用户不存在')
    }

    if (user.balance < totalAmount) {
      throw new Error(`余额不足，当前余额: ${user.balance}，需要: ${totalAmount}`)
    }

    // 计算潜在赔付
    const winningMultiplier = 9.8

    // 为每个下注项创建记录
    const betRecords = bets.map(bet => ({
      user_id: userId,
      round_id: currentRound.id,
      selected_numbers: [bet.number], // 单个数字作为数组
      bet_amount: bet.amount,
      potential_payout: bet.amount * winningMultiplier,
      status: 'pending'
    }))

    // 批量创建投注记录
    const { data: betResults, error: betError } = await supabaseClient
      .from('bets')
      .insert(betRecords)
      .select()

    if (betError) {
      throw new Error(`创建投注记录失败: ${betError.message}`)
    }

    // 扣除用户余额
    const { error: balanceError } = await supabaseClient
      .from('users')
      .update({
        balance: user.balance - totalAmount,
        total_bet: (user.total_bet || 0) + totalAmount
      })
      .eq('id', userId)

    if (balanceError) {
      throw new Error(`扣除余额失败: ${balanceError.message}`)
    }

    // 更新轮次统计
    await supabaseClient
      .from('rounds')
      .update({
        total_bets_count: currentRound.total_bets_count + bets.length,
        total_bet_amount: currentRound.total_bet_amount + totalAmount
      })
      .eq('id', currentRound.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `下注成功！共 ${bets.length} 注，总金额 ${totalAmount} 元`,
        data: {
          betIds: betResults.map(b => b.id),
          roundNumber: currentRound.round_number,
          bets: bets,
          totalAmount: totalAmount,
          totalPotentialPayout: bets.reduce((sum, bet) => sum + bet.amount * winningMultiplier, 0)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('下注失败:', error)

    // 返回详细的错误信息用于调试
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '下注失败',
        details: {
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
