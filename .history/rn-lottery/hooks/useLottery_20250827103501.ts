import { useEffect } from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
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
	const setHistory = useSetRecoilState(historyState)

	// Computed values
	const selectedGroups = useRecoilValue(selectedGroupsState)
	const totalCost = useRecoilValue(totalCostState)
	const potentialPayout = useRecoilValue(potentialPayoutState)
	const canPlaceBet = useRecoilValue(canPlaceBetState)
	const currentRound = useRecoilValue(currentRoundState)
	const winningNumbers = useRecoilValue(winningNumbersState)

	// Actions
	const handleNumberSelect = (group: number, number: number) => {
		const selection = `${group}-${number}`
		setSelectedNumbers((prev) =>
			prev.includes(selection)
				? prev.filter((s) => s !== selection)
				: [...prev, selection]
		)
	}

	const clearSelection = () => {
		setSelectedNumbers([])
	}

	const placeBet = () => {
		if (!canPlaceBet) {
			if (selectedNumbers.length === 0) {
				Alert.alert('Error', 'Please select at least one number')
			} else {
				Alert.alert('Error', 'Insufficient balance')
			}
			return
		}

		Alert.alert(
			'Confirm Bet',
			`Place bet of ${totalCost}G for ${selectedNumbers.length} numbers?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Confirm',
					onPress: () => {
						setBalance((prev) => prev - totalCost)
						setSelectedNumbers([])
						Alert.alert('Success', 'Bet placed successfully!')
					}
				}
			]
		)
	}

	const selectAllInGroup = (group: number) => {
		const numbers = Array.from({ length: 10 }, (_, i) => i + 1)
		numbers.forEach((num) => handleNumberSelect(group, num))
	}

	const selectBigNumbers = (group: number) => {
		;[6, 7, 8, 9, 10].forEach((num) => handleNumberSelect(group, num))
	}

	const selectSmallNumbers = (group: number) => {
		;[1, 2, 3, 4, 5].forEach((num) => handleNumberSelect(group, num))
	}

	const selectOddNumbers = (group: number) => {
		;[1, 3, 5, 7, 9].forEach((num) => handleNumberSelect(group, num))
	}

	const selectEvenNumbers = (group: number) => {
		;[2, 4, 6, 8, 10].forEach((num) => handleNumberSelect(group, num))
	}

	const clearGroup = (group: number) => {
		setSelectedNumbers((prev) =>
			prev.filter((selection) => !selection.startsWith(`${group}-`))
		)
	}

	return {
		// State
		selectedNumbers,
		betAmount,
		setBetAmount,
		balance,
		currentRound,
		winningNumbers,

		// Computed
		selectedGroups,
		totalCost,
		potentialPayout,
		canPlaceBet,

		// Actions
		handleNumberSelect,
		clearSelection,
		placeBet,
		selectAllInGroup,
		selectBigNumbers,
		selectSmallNumbers,
		selectOddNumbers,
		selectEvenNumbers,
		clearGroup
	}
}
