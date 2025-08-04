import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BalanceRequest {
  action: 'recharge' | 'withdraw' | 'get_balance'
  userId: string
  amount?: number
  paymentMethod?: string
  paymentId?: string
  withdrawalMethod?: string
  accountInfo?: any
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

    const { action, userId, amount, paymentMethod, paymentId, withdrawalMethod, accountInfo }: BalanceRequest = await req.json()

    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    switch (action) {
      case 'get_balance':
        return await getBalance(supabaseClient, userId)
      
      case 'recharge':
        return await processRecharge(supabaseClient, userId, amount!, paymentMethod!, paymentId)
      
      case 'withdraw':
        return await processWithdrawal(supabaseClient, userId, amount!, withdrawalMethod!, accountInfo)
      
      default:
        throw new Error('不支持的操作类型')
    }

  } catch (error) {
    console.error('余额管理失败:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '余额管理失败'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// 获取用户余额
async function getBalance(supabaseClient: any, userId: string) {
  const { data: user, error } = await supabaseClient
    .from('users')
    .select('balance, total_deposited, total_withdrawn, total_bet, total_won')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`获取余额失败: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        balance: user.balance,
        totalDeposited: user.total_deposited,
        totalWithdrawn: user.total_withdrawn,
        totalBet: user.total_bet,
        totalWon: user.total_won,
        profitLoss: user.total_won - user.total_bet
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

// 处理充值
async function processRecharge(supabaseClient: any, userId: string, amount: number, paymentMethod: string, paymentId?: string) {
  if (!amount || amount <= 0) {
    throw new Error('充值金额必须大于0')
  }

  if (!paymentMethod) {
    throw new Error('支付方式不能为空')
  }

  // 验证支付方式
  const validPaymentMethods = ['stripe', 'paypal', 'wechat', 'alipay', 'bank_transfer']
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new Error('不支持的支付方式')
  }

  // 创建充值记录
  const { data: recharge, error: rechargeError } = await supabaseClient
    .from('recharges')
    .insert({
      user_id: userId,
      amount: amount,
      payment_method: paymentMethod,
      payment_id: paymentId || `manual_${Date.now()}`,
      status: 'pending'
    })
    .select()
    .single()

  if (rechargeError) {
    throw new Error(`创建充值记录失败: ${rechargeError.message}`)
  }

  // 在实际应用中，这里应该调用支付接口
  // 为了演示，我们直接标记为成功
  const { error: updateError } = await supabaseClient
    .from('recharges')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString()
    })
    .eq('id', recharge.id)

  if (updateError) {
    throw new Error(`更新充值状态失败: ${updateError.message}`)
  }

  // 获取更新后的用户余额
  const { data: updatedUser, error: userError } = await supabaseClient
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single()

  if (userError) {
    throw new Error(`获取更新后余额失败: ${userError.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: '充值成功',
      data: {
        rechargeId: recharge.id,
        amount: amount,
        newBalance: updatedUser.balance,
        paymentMethod: paymentMethod
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

// 处理提现
async function processWithdrawal(supabaseClient: any, userId: string, amount: number, withdrawalMethod: string, accountInfo: any) {
  if (!amount || amount <= 0) {
    throw new Error('提现金额必须大于0')
  }

  if (!withdrawalMethod) {
    throw new Error('提现方式不能为空')
  }

  if (!accountInfo) {
    throw new Error('账户信息不能为空')
  }

  // 验证提现方式
  const validWithdrawalMethods = ['bank_transfer', 'paypal', 'crypto']
  if (!validWithdrawalMethods.includes(withdrawalMethod)) {
    throw new Error('不支持的提现方式')
  }

  // 检查用户余额
  const { data: user, error: userError } = await supabaseClient
    .from('users')
    .select('balance, total_withdrawn')
    .eq('id', userId)
    .single()

  if (userError) {
    throw new Error(`获取用户信息失败: ${userError.message}`)
  }

  if (user.balance < amount) {
    throw new Error(`余额不足，当前余额: ${user.balance}`)
  }

  // 检查最小提现金额
  const minWithdrawalAmount = 100
  if (amount < minWithdrawalAmount) {
    throw new Error(`提现金额不能少于 ${minWithdrawalAmount}`)
  }

  // 创建提现记录
  const { data: withdrawal, error: withdrawalError } = await supabaseClient
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount: amount,
      withdrawal_method: withdrawalMethod,
      account_info: accountInfo,
      status: 'pending'
    })
    .select()
    .single()

  if (withdrawalError) {
    throw new Error(`创建提现记录失败: ${withdrawalError.message}`)
  }

  // 扣除用户余额
  const { error: balanceError } = await supabaseClient
    .from('users')
    .update({
      balance: user.balance - amount,
      total_withdrawn: (user.total_withdrawn || 0) + amount
    })
    .eq('id', userId)

  if (balanceError) {
    // 如果扣除余额失败，删除提现记录
    await supabaseClient
      .from('withdrawals')
      .delete()
      .eq('id', withdrawal.id)
    
    throw new Error(`扣除余额失败: ${balanceError.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: '提现申请已提交，请等待审核',
      data: {
        withdrawalId: withdrawal.id,
        amount: amount,
        withdrawalMethod: withdrawalMethod,
        status: 'pending'
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}
