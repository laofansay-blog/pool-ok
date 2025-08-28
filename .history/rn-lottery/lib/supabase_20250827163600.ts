import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Supabase 配置
const supabaseUrl1 = 'https://deyugfnymgyxcfacxtjy.supabase.co'
const supabaseAnonKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl!, supabaseKey!, {
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
