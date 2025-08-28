import { selector } from 'recoil'
import {
	selectedNumbersState,
	betAmountState,
	balanceState,
	userState,
	isAuthenticatedState,
	currentRoundState,
	countdownState
} from './atoms'
import { utils } from '../lib/api'

// 投注金额数值
export const betAmountNumberState = selector({
	key: 'betAmountNumberState',
	get: ({ get }) => {
		const betAmount = get(betAmountState)
		return parseFloat(betAmount) || 0
	}
})

// 总投注成本
export const totalCostState = selector({
	key: 'totalCostState',
	get: ({ get }) => {
		const selectedNumbers = get(selectedNumbersState)
		const betAmount = get(betAmountNumberState)
		return selectedNumbers.length > 0 ? betAmount : 0
	}
})

// 潜在收益
export const potentialPayoutState = selector({
	key: 'potentialPayoutState',
	get: ({ get }) => {
		const betAmount = get(betAmountNumberState)
		return utils.calculatePayout(betAmount)
	}
})

// 是否可以下注
export const canPlaceBetState = selector({
	key: 'canPlaceBetState',
	get: ({ get }) => {
		const selectedNumbers = get(selectedNumbersState)
		const betAmount = get(betAmountNumberState)
		const balance = get(balanceState)
		const isAuthenticated = get(isAuthenticatedState)
		const currentRound = get(currentRoundState)

		return (
			isAuthenticated &&
			currentRound &&
			currentRound.status === 'pending' &&
			utils.validateSelectedNumbers(selectedNumbers) &&
			utils.validateBetAmount(betAmount) &&
			betAmount <= balance
		)
	}
})

// 倒计时显示文本
export const countdownDisplayState = selector({
	key: 'countdownDisplayState',
	get: ({ get }) => {
		const countdown = get(countdownState)
		return utils.formatTime(countdown)
	}
})

// 用户显示名称
export const userDisplayNameState = selector({
	key: 'userDisplayNameState',
	get: ({ get }) => {
		const user = get(userState)
		return user?.username || user?.email || '游客'
	}
})

// 是否可以进行游戏
export const canPlayGameState = selector({
	key: 'canPlayGameState',
	get: ({ get }) => {
		const isAuthenticated = get(isAuthenticatedState)
		const currentRound = get(currentRoundState)
		const countdown = get(countdownState)

		return isAuthenticated && currentRound && countdown > 0
	}
})
