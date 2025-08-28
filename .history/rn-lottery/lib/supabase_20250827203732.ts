import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Supabase 配置
const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	'https://deyugfnymgyxcfacxtjy.supabase.co'
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false
	}
})

// 数据库类型定义
export interface User {
	id: string
	email: string
	username: string
	balance: number
	created_at: string
	updated_at: string
}

export interface Round {
	id: string
	round_number: string
	start_time: string
	end_time: string
	draw_time?: string
	winning_numbers?: number[]
	status: 'pending' | 'drawing' | 'completed'
	created_at: string
}

export interface Bet {
	id: string
	user_id: string
	round_id: string
	selected_numbers: number[]
	bet_amount: number
	potential_payout: number
	actual_payout?: number
	is_winner: boolean
	status: 'pending' | 'won' | 'lost'
	created_at: string
}

export interface BetHistory {
	id: string
	round_number: string
	selected_numbers: number[]
	winning_numbers?: number[]
	bet_amount: number
	actual_payout?: number
	is_winner: boolean
	draw_time?: string
	created_at: string
}

// 游戏配置
export const GAME_CONFIG = {
	LOTTERY_INTERVAL: 5 * 60 * 1000, // 5分钟
	WINNING_MULTIPLIER: 9.8,
	MAX_NUMBERS: 9,
	NUMBER_RANGE: [1, 10],
	MAX_BET: 10000,
	MIN_BET: 1,
	TOTAL_NUMBERS: 10
}

// API端点
export const API_ENDPOINTS = {
	PLACE_BET: 'place-bet',
	DRAW_LOTTERY: 'draw-lottery',
	GET_HISTORY: 'get-history'
}

// 投注数据类型
export interface BetData {
	group: number
	number: number
	amount: number
}

export interface BetRequest {
	bets: BetData[]
	totalAmount: number
	potentialPayout: number
}

// 投注API调用
export const placeBet = async (betRequest: BetRequest) => {
	try {
		console.log('发送投注请求:', betRequest)

		const { data, error } = await supabase.functions.invoke(
			API_ENDPOINTS.PLACE_BET,
			{
				body: betRequest
			}
		)

		console.log('API响应:', { data, error })

		if (error) {
			console.error('API调用错误:', error)
			// 提供更详细的错误信息
			throw new Error(`API调用失败: ${error.message || error.toString()}`)
		}

		// 检查data是否存在
		if (!data) {
			throw new Error('API返回空数据')
		}

		// 如果data是字符串，尝试解析
		let responseData = data
		if (typeof data === 'string') {
			try {
				responseData = JSON.parse(data)
			} catch (parseError) {
				console.error('JSON解析失败:', parseError)
				throw new Error(`响应解析失败: ${data}`)
			}
		}

		if (!responseData.success) {
			console.error('投注失败:', responseData.error)
			throw new Error(responseData.error || '投注失败')
		}

		console.log('投注成功:', responseData)
		return responseData
	} catch (error) {
		console.error('投注异常:', error)
		throw error
	}
}

// 测试Edge Function连接
export const testEdgeFunction = async () => {
	try {
		console.log('测试Edge Function连接...')

		// 发送一个有效的测试请求
		const testRequest: BetRequest = {
			bets: [{ group: 1, number: 1, amount: 1 }],
			totalAmount: 1,
			potentialPayout: 9.8
		}

		const { data, error } = await supabase.functions.invoke('place-bet', {
			body: testRequest
		})

		console.log('测试响应:', { data, error })
		return { data, error }
	} catch (error) {
		console.error('测试失败:', error)
		return { error }
	}
}

// 创建测试轮次
export const createTestRound = async () => {
	try {
		console.log('创建测试轮次...')

		const now = new Date()
		const endTime = new Date(now.getTime() + 5 * 60 * 1000) // 5分钟后结束

		const { data, error } = await supabase
			.from('rounds')
			.insert({
				status: 'pending',
				end_time: endTime.toISOString(),
				total_bets: 0,
				total_amount: 0
			})
			.select()
			.single()

		if (error) {
			console.error('创建轮次失败:', error)
			throw new Error(error.message)
		}

		console.log('测试轮次创建成功:', data)
		return data
	} catch (error) {
		console.error('创建测试轮次异常:', error)
		throw error
	}
}

// 创建测试用户
export const createTestUser = async () => {
	try {
		console.log('创建测试用户...')

		const { data, error } = await supabase
			.from('users')
			.upsert({
				id: 'test-user-id',
				balance: 10000,
				total_bet: 0,
				total_win: 0
			})
			.select()
			.single()

		if (error) {
			console.error('创建用户失败:', error)
			throw new Error(error.message)
		}

		console.log('测试用户创建成功:', data)
		return data
	} catch (error) {
		console.error('创建测试用户异常:', error)
		throw error
	}
}
