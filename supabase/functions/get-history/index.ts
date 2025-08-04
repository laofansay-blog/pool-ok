import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HistoryRequest {
  type: 'rounds' | 'bets' | 'user_stats'
  userId?: string
  limit?: number
  offset?: number
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
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error('只支持 GET 和 POST 请求')
    }

    let params: HistoryRequest

    if (req.method === 'GET') {
      const url = new URL(req.url)
      params = {
        type: (url.searchParams.get('type') as 'rounds' | 'bets' | 'user_stats') || 'rounds',
        userId: url.searchParams.get('userId') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '10'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      }
    } else {
      params = await req.json()
    }

    const { type, userId, limit = 10, offset = 0 } = params

    let data, error

    switch (type) {
      case 'rounds':
        // 获取开奖历史
        ({ data, error } = await supabaseClient
          .from('rounds')
          .select(`
            id,
            round_number,
            winning_numbers,
            status,
            start_time,
            end_time,
            draw_time,
            total_bets_count,
            total_bet_amount,
            total_payout,
            created_at
          `)
          .eq('status', 'completed')
          .order('round_number', { ascending: false })
          .range(offset, offset + limit - 1))
        break

      case 'bets':
        // 获取用户投注历史
        if (!userId) {
          throw new Error('获取投注历史需要提供用户ID')
        }

        ({ data, error } = await supabaseClient
          .from('bets')
          .select(`
            id,
            round_id,
            selected_numbers,
            bet_amount,
            potential_payout,
            actual_payout,
            is_winner,
            matched_numbers,
            status,
            placed_at,
            settled_at,
            rounds (
              round_number,
              winning_numbers,
              draw_time
            )
          `)
          .eq('user_id', userId)
          .order('placed_at', { ascending: false })
          .range(offset, offset + limit - 1))
        break

      case 'user_stats':
        // 获取用户统计信息
        if (!userId) {
          throw new Error('获取用户统计需要提供用户ID')
        }

        // 获取用户基本信息
        const { data: userInfo, error: userError } = await supabaseClient
          .from('users')
          .select(`
            id,
            username,
            email,
            balance,
            total_deposited,
            total_withdrawn,
            total_bet,
            total_won,
            created_at,
            last_login_at
          `)
          .eq('id', userId)
          .single()

        if (userError) {
          throw new Error(`获取用户信息失败: ${userError.message}`)
        }

        // 获取投注统计
        const { data: betStats, error: betStatsError } = await supabaseClient
          .from('bets')
          .select('is_winner, status')
          .eq('user_id', userId)
          .eq('status', 'settled')

        if (betStatsError) {
          throw new Error(`获取投注统计失败: ${betStatsError.message}`)
        }

        const totalBets = betStats?.length || 0
        const winningBets = betStats?.filter(bet => bet.is_winner).length || 0
        const winRate = totalBets > 0 ? (winningBets / totalBets * 100).toFixed(2) : '0.00'

        // 获取最近的投注记录
        const { data: recentBets, error: recentBetsError } = await supabaseClient
          .from('bets')
          .select(`
            id,
            selected_numbers,
            bet_amount,
            actual_payout,
            is_winner,
            placed_at,
            rounds (round_number, winning_numbers)
          `)
          .eq('user_id', userId)
          .order('placed_at', { ascending: false })
          .limit(5)

        if (recentBetsError) {
          console.error('获取最近投注失败:', recentBetsError)
        }

        data = {
          userInfo,
          stats: {
            totalBets,
            winningBets,
            winRate: parseFloat(winRate),
            profitLoss: userInfo.total_won - userInfo.total_bet
          },
          recentBets: recentBets || []
        }
        error = null
        break

      default:
        throw new Error('不支持的查询类型')
    }

    if (error) {
      throw new Error(`查询失败: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        pagination: {
          limit,
          offset,
          total: data?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('获取历史记录失败:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '获取历史记录失败'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
