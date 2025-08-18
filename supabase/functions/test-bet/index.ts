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
    console.log('=== 测试投注函数开始 ===')
    
    // 创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 验证请求方法
    if (req.method !== 'POST') {
      throw new Error('只支持 POST 请求 - 测试函数版本')
    }

    // 解析请求体
    const requestBody = await req.json()
    console.log('收到的请求数据:', JSON.stringify(requestBody, null, 2))

    const { bets, totalAmount, userId }: BetRequest = requestBody
    console.log('解析后的数据:', { bets, totalAmount, userId })

    // 验证输入参数
    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      console.log('投注验证失败: bets =', bets)
      throw new Error('下注信息不能为空 - 测试函数')
    }

    if (!totalAmount || totalAmount <= 0) {
      throw new Error('下注金额必须大于0 - 测试函数')
    }

    if (!userId) {
      throw new Error('用户ID不能为空 - 测试函数')
    }

    // 验证每个下注项
    for (const bet of bets) {
      if (!bet.group || bet.group < 1 || bet.group > 10) {
        throw new Error('组号必须在1-10之间 - 测试函数')
      }
      if (!bet.number || bet.number < 1 || bet.number > 10) {
        throw new Error('数字必须在1-10之间 - 测试函数')
      }
      if (!bet.amount || bet.amount <= 0) {
        throw new Error('单注金额必须大于0 - 测试函数')
      }
    }

    // 验证总金额是否匹配
    const calculatedTotal = bets.reduce((sum, bet) => sum + bet.amount, 0)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      throw new Error('总金额计算不匹配 - 测试函数')
    }

    console.log('所有验证通过，准备创建投注记录')

    // 将投注数据按组分类
    const groupedBets: { [key: string]: number[] } = {}
    const originalBets: Array<{group: number, number: number, amount: number}> = []
    
    // 初始化所有组（1-10）
    for (let i = 1; i <= 10; i++) {
      groupedBets[i.toString()] = []
    }
    
    // 按组分类投注数据
    for (const bet of bets) {
      groupedBets[bet.group.toString()].push(bet.number)
      originalBets.push({
        group: bet.group,
        number: bet.number,
        amount: bet.amount
      })
    }

    console.log('分组后的投注数据:', groupedBets)

    return new Response(
      JSON.stringify({
        success: true,
        message: `测试成功！数据验证通过`,
        data: {
          bets: bets,
          totalAmount: totalAmount,
          groupedBets: groupedBets,
          originalBets: originalBets
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('测试失败:', error)

    // 返回详细的错误信息用于调试
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '测试失败',
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
