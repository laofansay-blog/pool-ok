import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	TextInput,
	Modal,
	Alert,
	Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import IOSDebugInfo from '@/components/IOSDebugInfo'
import {
	placeBet,
	supabase,
	GAME_CONFIG,
	type BetRequest,
	type BetData
} from '@/lib/supabase'

// 投注类型定义
type BetType =
	| '冠军'
	| '亚军'
	| '季军'
	| '第四名'
	| '第五名'
	| '第六名'
	| '第七名'
	| '第八名'
	| '第九名'
	| '第十名'
type BetCategory = '全' | '大' | '小' | '单' | '双' | '清'

// 轮次类型定义
type Round = {
	id: string
	round_number: string
	status: 'pending' | 'completed'
	end_time: string
	created_at: string
	winning_numbers?: number[]
}

export default function HomeScreen() {
	// 状态管理
	const [selectedBetType, setSelectedBetType] = useState<BetType>('冠军')
	const [currentRound, setCurrentRound] = useState<Round | null>(null)
	const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 })
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [historyRounds, setHistoryRounds] = useState<Round[]>([])
	const [selectedCategories, setSelectedCategories] = useState<{
		[key in BetType]: BetCategory[]
	}>({
		冠军: [],
		亚军: [],
		季军: [],
		第四名: [],
		第五名: [],
		第六名: [],
		第七名: [],
		第八名: [],
		第九名: [],
		第十名: []
	})
	const [pk10SelectedNumbers, setPk10SelectedNumbers] = useState<{
		[key in BetType]: number[]
	}>({
		冠军: [],
		亚军: [],
		季军: [],
		第四名: [],
		第五名: [],
		第六名: [],
		第七名: [],
		第八名: [],
		第九名: [],
		第十名: []
	})
	const [betAmounts] = useState<number[]>([10, 100, 1000, 5000, 10000])
	const [selectedNumbers, setSelectedNumbers] = useState<string[]>([])
	const [singleBetAmount, setSingleBetAmount] = useState<number>(2)

	// 开奖数字颜色配置
	const numberColors = [
		{ bg: '#4A4A4A', text: '#FFFFFF' }, // 深灰色 - 第1位
		{ bg: '#DC143C', text: '#FFFFFF' }, // 红色 - 第2位
		{ bg: '#FF8C00', text: '#FFFFFF' }, // 橙色 - 第3位
		{ bg: '#1E90FF', text: '#FFFFFF' }, // 蓝色 - 第4位
		{ bg: '#32CD32', text: '#FFFFFF' }, // 绿色 - 第5位
		{ bg: '#8A2BE2', text: '#FFFFFF' }, // 紫色 - 第6位
		{ bg: '#C0C0C0', text: '#000000' }, // 浅灰色 - 第7位
		{ bg: '#FFD700', text: '#000000' }, // 黄色 - 第8位
		{ bg: '#00CED1', text: '#FFFFFF' }, // 青色 - 第9位
		{ bg: '#8B0000', text: '#FFFFFF' } // 深红色 - 第10位
	]

	const getPositionColor = (position: number) => {
		if (position < 0 || position >= 10) {
			return { bg: '#CCCCCC', text: '#333333' }
		}
		return numberColors[position]
	}

	// 投注计算函数
	const calculateBetSummary = () => {
		const totalBets = selectedNumbers.length
		const totalAmount = totalBets * singleBetAmount
		const groupsUsed = new Set()
		selectedNumbers.forEach((selection) => {
			const [group] = selection.split('-')
			groupsUsed.add(group)
		})
		const potentialPayout = groupsUsed.size * singleBetAmount * GAME_CONFIG.WINNING_MULTIPLIER

		return {
			totalBets,
			totalAmount,
			groupsUsed: groupsUsed.size,
			potentialPayout
		}
	}

	// 处理数字选择
	const handleNumberSelect = (betType: BetType, number: number) => {
		const betTypeIndex = [
			'冠军', '亚军', '季军', '第四名', '第五名',
			'第六名', '第七名', '第八名', '第九名', '第十名'
		].indexOf(betType) + 1

		const selection = `${betTypeIndex}-${number}`

		setSelectedNumbers((prev) => {
			const isSelected = prev.includes(selection)
			if (isSelected) {
				return prev.filter((s) => s !== selection)
			} else {
				return [...prev, selection]
			}
		})

		setPk10SelectedNumbers((prev) => ({
			...prev,
			[betType]: prev[betType].includes(number)
				? prev[betType].filter((n) => n !== number)
				: [...prev[betType], number]
		}))
	}

	// 处理快速选择
	const handleQuickSelect = (action: BetCategory, betType: BetType) => {
		const betTypeIndex = [
			'冠军', '亚军', '季军', '第四名', '第五名',
			'第六名', '第七名', '第八名', '第九名', '第十名'
		].indexOf(betType) + 1

		setSelectedCategories((prev) => ({
			...prev,
			[betType]: []
		}))

		setSelectedNumbers((prev) => {
			return prev.filter((selection) => {
				const [group] = selection.split('-')
				return parseInt(group) !== betTypeIndex
			})
		})

		setPk10SelectedNumbers((prev) => ({
			...prev,
			[betType]: []
		}))

		if (action !== '清') {
			setSelectedCategories((prev) => ({
				...prev,
				[betType]: [action]
			}))
		}

		let numbersToSelect: number[] = []

		switch (action) {
			case '全':
				numbersToSelect = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
				break
			case '大':
				numbersToSelect = [6, 7, 8, 9, 10]
				break
			case '小':
				numbersToSelect = [1, 2, 3, 4, 5]
				break
			case '单':
				numbersToSelect = [1, 3, 5, 7, 9]
				break
			case '双':
				numbersToSelect = [2, 4, 6, 8, 10]
				break
			case '清':
				numbersToSelect = []
				break
		}

		setPk10SelectedNumbers((prev) => ({
			...prev,
			[betType]: numbersToSelect
		}))

		if (numbersToSelect.length > 0) {
			const newSelections = numbersToSelect.map(
				(number) => `${betTypeIndex}-${number}`
			)
			setSelectedNumbers((prev) => [...prev, ...newSelections])
		}
	}

	// 一键下注
	const handlePlaceBet = async () => {
		const summary = calculateBetSummary()

		if (summary.totalBets === 0) {
			Alert.alert('提示', '请至少选择一个数字')
			return
		}

		try {
			const betData: BetData[] = selectedNumbers.map((selection) => {
				const [group, number] = selection.split('-')
				return {
					group: parseInt(group),
					number: parseInt(number),
					amount: singleBetAmount
				}
			})

			const apiData: BetRequest = {
				bets: betData,
				totalAmount: summary.totalAmount,
				potentialPayout: summary.potentialPayout
			}

			const result = await placeBet(apiData)

			Alert.alert(
				'下注成功！',
				`共 ${summary.totalBets} 注\n` +
					`总金额 ${summary.totalAmount} 元\n` +
					`预计收益 ${summary.potentialPayout.toFixed(1)} 元`
			)

			// 重置状态
			setSelectedNumbers([])
			setPk10SelectedNumbers({
				冠军: [], 亚军: [], 季军: [], 第四名: [], 第五名: [],
				第六名: [], 第七名: [], 第八名: [], 第九名: [], 第十名: []
			})
			setSelectedCategories({
				冠军: [], 亚军: [], 季军: [], 第四名: [], 第五名: [],
				第六名: [], 第七名: [], 第八名: [], 第九名: [], 第十名: []
			})
		} catch (error) {
			Alert.alert('下注失败', error instanceof Error ? error.message : '请重试')
		}
	}

	// 机选功能
	const handleRandomSelect = () => {
		// 重置状态
		setSelectedNumbers([])
		setPk10SelectedNumbers({
			冠军: [], 亚军: [], 季军: [], 第四名: [], 第五名: [],
			第六名: [], 第七名: [], 第八名: [], 第九名: [], 第十名: []
		})

		const betTypes: BetType[] = [
			'冠军', '亚军', '季军', '第四名', '第五名',
			'第六名', '第七名', '第八名', '第九名', '第十名'
		]

		const randomBetTypeCount = Math.floor(Math.random() * 3) + 1
		const selectedBetTypes = []

		for (let i = 0; i < randomBetTypeCount; i++) {
			const randomIndex = Math.floor(Math.random() * betTypes.length)
			const betType = betTypes[randomIndex]
			if (!selectedBetTypes.includes(betType)) {
				selectedBetTypes.push(betType)
			}
		}

		selectedBetTypes.forEach((betType) => {
			const randomNumberCount = Math.floor(Math.random() * 3) + 1
			const selectedNums = []

			for (let i = 0; i < randomNumberCount; i++) {
				const randomNumber = Math.floor(Math.random() * 10) + 1
				if (!selectedNums.includes(randomNumber)) {
					selectedNums.push(randomNumber)
					handleNumberSelect(betType, randomNumber)
				}
			}
		})
	}

	// 加载当前轮次
	const loadCurrentRound = async () => {
		try {
			const { data, error } = await supabase.rpc('get_current_round')
			if (error) throw error

			if (data) {
				setCurrentRound({
					id: data.id,
					round_number: data.round_number,
					status: data.status,
					end_time: data.end_time,
					created_at: data.created_at,
					winning_numbers: data.winning_numbers
				})

				if (data.end_time && data.status === 'pending') {
					const endTime = new Date(data.end_time).getTime()
					const now = Date.now()
					const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
					const minutes = Math.floor(remaining / 60)
					const seconds = remaining % 60
					setCountdown({ minutes, seconds })
				}
			}
		} catch (error) {
			console.error('加载当前轮次失败:', error)
		}
	}

	useEffect(() => {
		loadCurrentRound()
	}, [])

	return (
		<SafeAreaView style={styles.container}>
			{Platform.OS === 'ios' && __DEV__ && <IOSDebugInfo />}

			{/* Header */}
			<View style={styles.header}>
				<Pressable style={styles.backButton}>
					<Text style={styles.backButtonText}>‹</Text>
				</Pressable>
				<Text style={styles.headerTitle}>五分PK拾</Text>
				<View style={styles.headerRight}>
					<Pressable style={styles.menuButton}>
						<Text style={styles.menuButtonText}>☰</Text>
					</Pressable>
				</View>
			</View>

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Game Info */}
				<View style={styles.gameInfo}>
					<View style={styles.roundSection}>
						<Text style={styles.roundNumber}>
							{currentRound?.round_number || '加载中...'}
						</Text>
						<Text style={styles.waitingText}>{currentRound?.status}</Text>
					</View>
					<View style={styles.countdownSection}>
						<Text style={styles.countdownLabel}>
							距{currentRound?.round_number || ''}期截止
						</Text>
						<View style={styles.countdownDisplay}>
							<Text style={styles.countdownNumber}>
								{String(Math.floor(countdown.minutes / 10))}
							</Text>
							<Text style={styles.countdownNumber}>
								{String(countdown.minutes % 10)}
							</Text>
							<Text style={styles.countdownSeparator}>:</Text>
							<Text style={styles.countdownNumber}>
								{String(Math.floor(countdown.seconds / 10))}
							</Text>
							<Text style={styles.countdownNumber}>
								{String(countdown.seconds % 10)}
							</Text>
						</View>
					</View>
				</View>

				{/* Betting Sections */}
				{(['冠军', '亚军', '季军', '第四名', '第五名', '第六名', '第七名', '第八名', '第九名', '第十名'] as BetType[]).map((betType) => (
					<View key={betType} style={styles.bettingSection}>
						<View style={styles.titleAndCategoryRow}>
							<Text style={styles.betTypeTitle}>{betType}</Text>
							<View style={styles.categoryRow}>
								{(['全', '大', '小', '单', '双', '清'] as BetCategory[]).map((category) => (
									<Pressable
										key={category}
										style={[
											styles.categoryButton,
											selectedCategories[betType].includes(category) && styles.selectedCategory
										]}
										onPress={() => handleQuickSelect(category, betType)}
									>
										<Text style={[
											styles.categoryButtonText,
											selectedCategories[betType].includes(category) && styles.selectedCategoryText
										]}>
											{category}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						<View style={styles.numberRow}>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
								<Pressable
									key={num}
									style={[
										styles.numberButton,
										pk10SelectedNumbers[betType].includes(num) && styles.selectedNumberButton
									]}
									onPress={() => handleNumberSelect(betType, num)}
								>
									<Text style={[
										styles.numberButtonText,
										pk10SelectedNumbers[betType].includes(num) && styles.selectedNumberButtonText
									]}>
										{num.toString().padStart(2, '0')}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				))}

				{/* Bet Amount Selection */}
				<View style={styles.betAmountSection}>
					<View style={styles.betAmountRow}>
						{betAmounts.map((amount) => (
							<Pressable
								key={amount}
								style={[
									styles.betAmountButton,
									singleBetAmount === amount && styles.selectedBetAmount
								]}
								onPress={() => setSingleBetAmount(amount)}
							>
								<Text style={[
									styles.betAmountText,
									singleBetAmount === amount && styles.selectedBetAmountText
								]}>
									{amount}元
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* Bet Summary */}
				{selectedNumbers.length > 0 && (
					<View style={styles.betSummarySection}>
						<Text style={styles.betSummaryTitle}>投注信息</Text>
						<View style={styles.betSummaryContent}>
							<View style={styles.betSummaryRow}>
								<Text style={styles.betSummaryLabel}>下注数:</Text>
								<Text style={styles.betSummaryValue}>{calculateBetSummary().totalBets} 注</Text>
							</View>
							<View style={styles.betSummaryRow}>
								<Text style={styles.betSummaryLabel}>单注金额:</Text>
								<Text style={styles.betSummaryValue}>{singleBetAmount} 元</Text>
							</View>
							<View style={styles.betSummaryRow}>
								<Text style={styles.betSummaryLabel}>总金额:</Text>
								<Text style={styles.betSummaryValue}>{calculateBetSummary().totalAmount} 元</Text>
							</View>
							<View style={styles.betSummaryRow}>
								<Text style={styles.betSummaryLabel}>预计收益:</Text>
								<Text style={[styles.betSummaryValue, styles.potentialPayout]}>
									{calculateBetSummary().potentialPayout.toFixed(1)} 元
								</Text>
							</View>
						</View>
					</View>
				)}
			</ScrollView>

			{/* Bottom Actions */}
			<View style={styles.bottomActions}>
				<View style={styles.betControls}>
					<Pressable style={styles.randomButton} onPress={handleRandomSelect}>
						<Text style={styles.randomButtonText}>机选</Text>
					</Pressable>
					<View style={styles.betCountContainer}>
						<Text style={styles.betCountLabel}>单注</Text>
						<TextInput
							style={styles.betCountInput}
							value={singleBetAmount.toString()}
							onChangeText={(text) => setSingleBetAmount(parseInt(text) || 1)}
							keyboardType="numeric"
						/>
						<Text style={styles.betCountUnit}>元</Text>
					</View>
				</View>
				<View style={styles.actionButtonsRow}>
					<Pressable style={[
						styles.waitButton,
						selectedNumbers.length > 0 && styles.waitButtonActive
					]}>
						<Text style={[
							styles.waitButtonText,
							selectedNumbers.length > 0 && styles.waitButtonActiveText
						]}>
							已选 {selectedNumbers.length} 注
						</Text>
					</Pressable>
					<Pressable
						style={[
							styles.submitButton,
							selectedNumbers.length === 0 && styles.submitButtonDisabled
						]}
						onPress={handlePlaceBet}
						disabled={selectedNumbers.length === 0}
					>
						<Text style={[
							styles.submitButtonText,
							selectedNumbers.length === 0 && styles.submitButtonDisabledText
						]}>
							一键下注
						</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15,
		paddingVertical: 12,
		backgroundColor: '#e74c3c',
		borderBottomWidth: 1,
		borderBottomColor: '#c0392b'
	},
	backButton: {
		padding: 8
	},
	backButtonText: {
		color: '#ffffff',
		fontSize: 20,
		fontWeight: 'bold'
	},
	headerTitle: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: 'bold'
	},
	headerRight: {
		flexDirection: 'row',
		gap: 10
	},
	menuButton: {
		padding: 8
	},
	menuButtonText: {
		color: '#ffffff',
		fontSize: 16
	},
	scrollView: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	gameInfo: {
		backgroundColor: '#ffffff',
		padding: 15,
		marginBottom: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	roundSection: {
		alignItems: 'flex-start'
	},
	roundNumber: {
		fontSize: 16,
		color: '#333333',
		fontWeight: 'bold'
	},
	waitingText: {
		fontSize: 14,
		color: '#e74c3c',
		marginTop: 4
	},
	countdownSection: {
		alignItems: 'flex-end'
	},
	countdownLabel: {
		fontSize: 12,
		color: '#666666',
		marginBottom: 4
	},
	countdownDisplay: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	countdownNumber: {
		backgroundColor: '#333333',
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold',
		paddingHorizontal: 6,
		paddingVertical: 2,
		marginHorizontal: 1,
		borderRadius: 2
	},
	countdownSeparator: {
		color: '#333333',
		fontSize: 16,
		fontWeight: 'bold',
		marginHorizontal: 2
	},
	bettingSection: {
		backgroundColor: '#ffffff',
		padding: 15,
		marginBottom: 2
	},
	titleAndCategoryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12
	},
	betTypeTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333'
	},
	categoryRow: {
		flexDirection: 'row',
		gap: 6
	},
	categoryButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
		backgroundColor: '#f8f8f8',
		borderWidth: 1,
		borderColor: '#ddd'
	},
	selectedCategory: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	categoryButtonText: {
		fontSize: 12,
		color: '#666666',
		fontWeight: '500'
	},
	selectedCategoryText: {
		color: '#ffffff'
	},
	numberRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	numberButton: {
		width: 40,
		height: 40,
		borderRadius: 4,
		backgroundColor: '#f8f8f8',
		borderWidth: 1,
		borderColor: '#ddd',
		justifyContent: 'center',
		alignItems: 'center'
	},
	selectedNumberButton: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	numberButtonText: {
		fontSize: 14,
		color: '#333333',
		fontWeight: 'bold'
	},
	selectedNumberButtonText: {
		color: '#ffffff'
	},
	betAmountSection: {
		backgroundColor: '#ffffff',
		padding: 15,
		marginBottom: 10
	},
	betAmountRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	betAmountButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4,
		backgroundColor: '#f8f8f8',
		borderWidth: 1,
		borderColor: '#ddd'
	},
	selectedBetAmount: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	betAmountText: {
		fontSize: 14,
		color: '#333333',
		fontWeight: '500'
	},
	selectedBetAmountText: {
		color: '#ffffff'
	},
	betSummarySection: {
		backgroundColor: '#ffffff',
		padding: 15,
		marginBottom: 10
	},
	betSummaryTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 12
	},
	betSummaryContent: {
		gap: 8
	},
	betSummaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	betSummaryLabel: {
		fontSize: 14,
		color: '#666666'
	},
	betSummaryValue: {
		fontSize: 14,
		color: '#333333',
		fontWeight: '500'
	},
	potentialPayout: {
		color: '#27ae60',
		fontWeight: 'bold'
	},
	bottomActions: {
		backgroundColor: '#ffffff',
		padding: 15,
		borderTopWidth: 1,
		borderTopColor: '#eee'
	},
	betControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12
	},
	randomButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 6,
		backgroundColor: '#3498db',
		borderWidth: 1,
		borderColor: '#3498db'
	},
	randomButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold'
	},
	betCountContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	betCountLabel: {
		fontSize: 14,
		color: '#666666'
	},
	betCountInput: {
		width: 60,
		height: 36,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		paddingHorizontal: 8,
		textAlign: 'center',
		fontSize: 14,
		backgroundColor: '#fff'
	},
	betCountUnit: {
		fontSize: 14,
		color: '#666666'
	},
	actionButtonsRow: {
		flexDirection: 'row',
		gap: 12
	},
	waitButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 6,
		backgroundColor: '#f8f8f8',
		borderWidth: 1,
		borderColor: '#ddd',
		alignItems: 'center'
	},
	waitButtonActive: {
		backgroundColor: '#3498db',
		borderColor: '#3498db'
	},
	waitButtonText: {
		fontSize: 14,
		color: '#666666',
		fontWeight: '500'
	},
	waitButtonActiveText: {
		color: '#ffffff'
	},
	submitButton: {
		flex: 2,
		paddingVertical: 12,
		borderRadius: 6,
		backgroundColor: '#e74c3c',
		alignItems: 'center'
	},
	submitButtonDisabled: {
		backgroundColor: '#cccccc'
	},
	submitButtonText: {
		fontSize: 16,
		color: '#ffffff',
		fontWeight: 'bold'
	},
	submitButtonDisabledText: {
		color: '#999999'
	}
})