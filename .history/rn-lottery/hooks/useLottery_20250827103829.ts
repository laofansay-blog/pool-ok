import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { Alert } from 'react-native'
import {
	selectedNumbersState,
	betAmountState,
	balanceState,
	currentRoundState,
	latestResultState,
	betHistoryState,
	drawHistoryState,
	countdownState,
	userState,
	loadingState
} from '../store/atoms'
import {
	totalCostState,
	potentialPayoutState,
	canPlaceBetState,
	countdownDisplayState
} from '../store/selectors'
import { gameAPI, realtimeAPI, utils } from '../lib/api'

export const useLottery = () => {
	// State
	const [selectedNumbers, setSelectedNumbers] =
		useRecoilState(selectedNumbersState)
	const [betAmount, setBetAmount] = useRecoilState(betAmountState)
	const [balance, setBalance] = useRecoilState(balanceState)
	const [currentRound, setCurrentRound] = useRecoilState(currentRoundState)
	const [latestResult, setLatestResult] = useRecoilState(latestResultState)
	const [betHistory, setBetHistory] = useRecoilState(betHistoryState)
	const [drawHistory, setDrawHistory] = useRecoilState(drawHistoryState)
	const [countdown, setCountdown] = useRecoilState(countdownState)
	const [loading, setLoading] = useRecoilState(loadingState)

	const user = useRecoilValue(userState)

	// Computed values
	const totalCost = useRecoilValue(totalCostState)
	const potentialPayout = useRecoilValue(potentialPayoutState)
	const canPlaceBet = useRecoilValue(canPlaceBetState)
	const countdownDisplay = useRecoilValue(countdownDisplayState)

	// 初始化数据
	useEffect(() => {
		if (user) {
			loadGameData()
			setupRealtimeSubscriptions()
		}
	}, [user])

	// 倒计时逻辑
	useEffect(() => {
		if (!currentRound) return

		const updateCountdown = () => {
			const timeLeft = utils.calculateTimeLeft(currentRound.end_time)
			setCountdown(timeLeft)

			if (timeLeft <= 0) {
				// 轮次结束，重新加载数据
				setTimeout(() => {
					loadGameData()
				}, 1000)
			}
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 1000)

		return () => clearInterval(interval)
	}, [currentRound])

	// 加载游戏数据
	const loadGameData = async () => {
		if (!user) return

		try {
			setLoading(true)

			// 并行加载数据
			const [
				currentRoundResult,
				latestResultResult,
				balanceResult,
				betHistoryResult,
				drawHistoryResult
			] = await Promise.all([
				gameAPI.getCurrentRound(),
				gameAPI.getLatestResult(),
				gameAPI.getUserBalance(user.id),
				gameAPI.getBetHistory(user.id, 20),
				gameAPI.getDrawHistory(20)
			])

			if (currentRoundResult.data) {
				setCurrentRound(currentRoundResult.data)
			}

			if (latestResultResult.data) {
				setLatestResult(latestResultResult.data)
			}

			if (!balanceResult.error) {
				setBalance(balanceResult.data)
			}

			if (betHistoryResult.data) {
				setBetHistory(betHistoryResult.data)
			}

			if (drawHistoryResult.data) {
				setDrawHistory(drawHistoryResult.data)
			}
		} catch (error) {
			console.error('Load game data error:', error)
		} finally {
			setLoading(false)
		}
	}

	// 设置实时订阅
	const setupRealtimeSubscriptions = () => {
		if (!user) return

		// 订阅轮次更新
		const roundsSubscription = realtimeAPI.subscribeToRounds((payload) => {
			console.log('Rounds update:', payload)
			if (payload.new) {
				if (payload.new.status === 'pending') {
					setCurrentRound(payload.new)
				} else if (payload.new.status === 'completed') {
					setLatestResult(payload.new)
					// 重新加载投注历史
					loadBetHistory()
				}
			}
		})

		// 订阅用户余额更新
		const balanceSubscription = realtimeAPI.subscribeToUserBalance(
			user.id,
			(payload) => {
				console.log('Balance update:', payload)
				if (payload.new) {
					setBalance(payload.new.balance)
				}
			}
		)
	}

	// 重新加载投注历史
	const loadBetHistory = async () => {
		if (!user) return

		try {
			const { data, error } = await gameAPI.getBetHistory(user.id, 20)
			if (!error && data) {
				setBetHistory(data)
			}
		} catch (error) {
			console.error('Load bet history error:', error)
		}
	}

	// 数字选择
	const handleNumberSelect = (number: number) => {
		setSelectedNumbers((prev) => {
			if (prev.includes(number)) {
				return prev.filter((n) => n !== number)
			} else if (prev.length < 9) {
				return [...prev, number]
			} else {
				Alert.alert('提示', '最多只能选择9个数字')
				return prev
			}
		})
	}

	// 清空选择
	const clearSelection = () => {
		setSelectedNumbers([])
	}

	// 下注
	const placeBet = async () => {
		if (!canPlaceBet || !currentRound || !user) {
			Alert.alert('错误', '无法下注，请检查选择的数字和余额')
			return
		}

		try {
			setLoading(true)

			const { data, error } = await gameAPI.placeBet(
				currentRound.id,
				selectedNumbers,
				parseFloat(betAmount)
			)

			if (error) {
				Alert.alert('下注失败', error.message || '请重试')
				return
			}

			Alert.alert('下注成功', `已投注 ${betAmount} 金币`, [
				{
					text: '确定',
					onPress: () => {
						setSelectedNumbers([])
						loadGameData() // 重新加载数据
					}
				}
			])
		} catch (error) {
			console.error('Place bet error:', error)
			Alert.alert('下注失败', '网络错误，请重试')
		} finally {
			setLoading(false)
		}
	}

	return {
		// State
		selectedNumbers,
		betAmount,
		setBetAmount,
		balance,
		currentRound,
		latestResult,
		betHistory,
		drawHistory,
		countdown,
		countdownDisplay,
		loading,

		// Computed
		totalCost,
		potentialPayout,
		canPlaceBet,

		// Actions
		handleNumberSelect,
		clearSelection,
		placeBet,
		loadGameData,
		loadBetHistory
	}
}
