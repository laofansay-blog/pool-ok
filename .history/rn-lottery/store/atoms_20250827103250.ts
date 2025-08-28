import { atom } from 'recoil'
import { User, Round, BetHistory } from '../lib/supabase'

// 认证状态
export const userState = atom<User | null>({
	key: 'userState',
	default: null
})

export const isAuthenticatedState = atom<boolean>({
	key: 'isAuthenticatedState',
	default: false
})

export const authLoadingState = atom<boolean>({
	key: 'authLoadingState',
	default: true
})

// 选中的数字
export const selectedNumbersState = atom<number[]>({
	key: 'selectedNumbersState',
	default: []
})

// 单注金额
export const betAmountState = atom<string>({
	key: 'betAmountState',
	default: '2'
})

// 用户余额
export const balanceState = atom<number>({
	key: 'balanceState',
	default: 0
})

// 当前轮次
export const currentRoundState = atom<Round | null>({
	key: 'currentRoundState',
	default: null
})

// 倒计时时间
export const countdownState = atom<number>({
	key: 'countdownState',
	default: 300 // 5分钟
})

// 最新开奖结果
export const latestResultState = atom<Round | null>({
	key: 'latestResultState',
	default: null
})

// 投注历史
export const betHistoryState = atom<BetHistory[]>({
	key: 'betHistoryState',
	default: []
})

// 开奖历史
export const drawHistoryState = atom<Round[]>({
	key: 'drawHistoryState',
	default: []
})

// 加载状态
export const loadingState = atom<boolean>({
	key: 'loadingState',
	default: false
})
