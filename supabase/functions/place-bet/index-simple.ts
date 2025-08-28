import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface BetRequest {
	bets: Array<{
		group: number
		number: number
		amount: number
	}>
	totalAmount: number
	potentialPayout: number
}

serve(async (req) => {
	// 处理 CORS 预检请求
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}

	try {
		console.log('=== 简化版投注函数启动 ===')
		
		// 创建 Supabase 客户端
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
		)

		// 验证请求方法
		if (req.method !== 'POST') {
			throw new Error('只支持 POST 请求')
		}

		// 使用固定的测试用户ID
		const userId = 'test-user-id'
		console.log('使用测试用户ID:', userId)

		// 解析请求体
		const requestBody = await req.json()
		console.log('收到投注请求:', requestBody)

		const { bets, totalAmount, potentialPayout }: BetRequest = requestBody

		// 基本验证
		if (!bets || bets.length === 0) {
			throw new Error('投注数据不能为空')
		}

		if (!totalAmount || totalAmount <= 0) {
			throw new Error('投注金额必须大于0')
		}

		// 确保测试用户存在
		const { data: existingUser, error: userError } = await supabaseClient
			.from('users')
			.select('*')
			.eq('id', userId)
			.single()

		if (userError || !existingUser) {
			console.log('创建测试用户...')
			const { error: createUserError } = await supabaseClient
				.from('users')
				.upsert({
					id: userId,
					balance: 10000,
					total_bet: 0,
					total_win: 0
				})
			
			if (createUserError) {
				console.error('创建用户失败:', createUserError)
				throw new Error('用户创建失败')
			}
		}

		// 获取当前轮次
		const { data: currentRound, error: roundError } = await supabaseClient
			.from('rounds')
			.select('*')
			.eq('status', 'pending')
			.order('created_at', { ascending: false })
			.limit(1)
			.single()

		if (roundError || !currentRound) {
			console.log('创建新轮次...')
			const now = new Date()
			const endTime = new Date(now.getTime() + 5 * 60 * 1000) // 5分钟后

			const { data: newRound, error: createRoundError } = await supabaseClient
				.from('rounds')
				.insert({
					status: 'pending',
					end_time: endTime.toISOString(),
					total_bets: 0,
					total_amount: 0
				})
				.select()
				.single()

			if (createRoundError || !newRound) {
				throw new Error('创建轮次失败')
			}

			console.log('新轮次创建成功:', newRound.id)
		}

		const roundId = currentRound?.id || 'new-round'

		// 创建投注记录
		const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		
		const { error: betError } = await supabaseClient
			.from('bets')
			.insert({
				id: betId,
				user_id: userId,
				round_id: roundId,
				selected_numbers: bets.reduce((acc, bet) => {
					acc[bet.group] = bet.number
					return acc
				}, {} as Record<number, number>),
				bet_amount: totalAmount,
				potential_payout: potentialPayout,
				status: 'pending',
				metadata: {
					bets_count: bets.length,
					individual_bets: bets
				}
			})

		if (betError) {
			console.error('创建投注记录失败:', betError)
			throw new Error('投注失败')
		}

		// 更新用户余额
		const { error: balanceError } = await supabaseClient
			.from('users')
			.update({
				balance: existingUser ? existingUser.balance - totalAmount : 10000 - totalAmount,
				total_bet: existingUser ? existingUser.total_bet + totalAmount : totalAmount
			})
			.eq('id', userId)

		if (balanceError) {
			console.error('更新余额失败:', balanceError)
			// 不抛出错误，因为投注已经创建
		}

		// 更新轮次统计
		if (currentRound) {
			const { error: updateRoundError } = await supabaseClient
				.from('rounds')
				.update({
					total_bets: (currentRound.total_bets || 0) + bets.length,
					total_amount: (currentRound.total_amount || 0) + totalAmount
				})
				.eq('id', currentRound.id)

			if (updateRoundError) {
				console.error('更新轮次统计失败:', updateRoundError)
			}
		}

		console.log('投注成功:', betId)

		// 返回成功响应
		const response = {
			success: true,
			data: {
				betId,
				userId,
				roundId,
				totalAmount,
				potentialPayout,
				betsCount: bets.length,
				timestamp: new Date().toISOString()
			},
			message: '投注成功'
		}

		return new Response(JSON.stringify(response), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200
		})

	} catch (error) {
		console.error('投注处理错误:', error)
		
		const errorResponse = {
			success: false,
			error: error.message || '投注失败',
			details: {
				name: error.name,
				message: error.message,
				timestamp: new Date().toISOString()
			}
		}

		return new Response(JSON.stringify(errorResponse), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 400
		})
	}
})
