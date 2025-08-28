import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	TextInput,
	Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
	// 简化状态管理
	const [selectedBetType, setSelectedBetType] = useState<BetType>('冠军')

	// 轮次和倒计时相关状态
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
	const [currentBetAmount, setCurrentBetAmount] = useState<number>(10)
	const [betCount, setBetCount] = useState<number>(2)

	// 生成轮次号（基于web项目逻辑）
	const generateRoundNumber = (date: Date, sequence: number): string => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const seq = String(sequence).padStart(2, '0')
		return `${year}${month}${day}${seq}`
	}

	// 模拟加载当前轮次
	const loadCurrentRound = () => {
		const now = new Date()
		const endTime = new Date(now.getTime() + 5 * 60 * 1000) // 5分钟后结束

		const mockRound: Round = {
			id: '1',
			round_number: generateRoundNumber(now, 10),
			status: 'pending',
			end_time: endTime.toISOString(),
			created_at: now.toISOString()
		}

		setCurrentRound(mockRound)
	}

	// 模拟历史轮次数据
	const loadHistoryRounds = () => {
		const now = new Date()
		const history: Round[] = []

		for (let i = 1; i <= 5; i++) {
			const pastTime = new Date(now.getTime() - i * 5 * 60 * 1000)
			history.push({
				id: String(i + 1),
				round_number: generateRoundNumber(pastTime, 10 - i),
				status: 'completed',
				end_time: pastTime.toISOString(),
				created_at: pastTime.toISOString(),
				winning_numbers: Array.from(
					{ length: 10 },
					() => Math.floor(Math.random() * 10) + 1
				)
			})
		}

		setHistoryRounds(history)
	}

	// 更新倒计时
	const updateCountdown = () => {
		if (!currentRound) return

		const now = new Date()
		const endTime = new Date(currentRound.end_time)
		const timeLeft = Math.max(
			0,
			Math.floor((endTime.getTime() - now.getTime()) / 1000)
		)

		if (timeLeft <= 0) {
			setCountdown({ minutes: 0, seconds: 0 })
			// 轮次结束，重新加载
			setTimeout(() => {
				loadCurrentRound()
			}, 1000)
			return
		}

		const minutes = Math.floor(timeLeft / 60)
		const seconds = timeLeft % 60
		setCountdown({ minutes, seconds })
	}

	// 初始化和倒计时效果
	useEffect(() => {
		loadCurrentRound()
		loadHistoryRounds()
	}, [])

	useEffect(() => {
		const interval = setInterval(updateCountdown, 1000)
		return () => clearInterval(interval)
	}, [currentRound])

	// 处理快速选择
	const handleQuickSelect = (action: BetCategory, betType: BetType) => {
		console.log(`处理快速选择: ${action}, 组: ${betType}`)

		// 清除该组所有按钮的激活状态
		setSelectedCategories((prev) => ({
			...prev,
			[betType]: []
		}))

		// 先清除该组的所有选择
		setPk10SelectedNumbers((prev) => ({
			...prev,
			[betType]: []
		}))

		// 如果不是清除操作，则激活当前按钮并执行选择
		if (action !== '清') {
			// 激活当前按钮
			setSelectedCategories((prev) => ({
				...prev,
				[betType]: [action]
			}))
		}

		switch (action) {
			case '全':
				// 选择全部 (1-10)
				setPk10SelectedNumbers((prev) => ({
					...prev,
					[betType]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
				}))
				break

			case '大':
				// 选择大号 (6-10)
				setPk10SelectedNumbers((prev) => ({
					...prev,
					[betType]: [6, 7, 8, 9, 10]
				}))
				break

			case '小':
				// 选择小号 (1-5)
				setPk10SelectedNumbers((prev) => ({
					...prev,
					[betType]: [1, 2, 3, 4, 5]
				}))
				break

			case '单':
				// 选择单号 (1, 3, 5, 7, 9)
				setPk10SelectedNumbers((prev) => ({
					...prev,
					[betType]: [1, 3, 5, 7, 9]
				}))
				break

			case '双':
				// 选择双号 (2, 4, 6, 8, 10)
				setPk10SelectedNumbers((prev) => ({
					...prev,
					[betType]: [2, 4, 6, 8, 10]
				}))
				break

			case '清':
				// 清除该组选择 (已在上面处理)
				break
		}
	}

	// 处理数字选择
	const handlePk10NumberSelect = (number: number) => {
		const currentNumbers = pk10SelectedNumbers[selectedBetType]
		const isSelected = currentNumbers.includes(number)
		setPk10SelectedNumbers((prev) => ({
			...prev,
			[selectedBetType]: isSelected
				? currentNumbers.filter((n) => n !== number)
				: [...currentNumbers, number]
		}))
	}

	return (
		<SafeAreaView style={styles.container}>
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
					<Pressable style={styles.settingsButton}>
						<Text style={styles.settingsButtonText}>⚙</Text>
					</Pressable>
				</View>
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
			>
				{/* Game Info */}
				<View style={styles.gameInfo}>
					<View style={styles.roundSection}>
						<Text style={styles.roundNumber}>2025082710▼</Text>
						<Text style={styles.waitingText}>等待开奖</Text>
					</View>
					<View style={styles.countdownSection}>
						<Text style={styles.countdownLabel}>距2025082710期截止</Text>
						<View style={styles.countdownDisplay}>
							<Text style={styles.countdownNumber}>0</Text>
							<Text style={styles.countdownNumber}>0</Text>
							<Text style={styles.countdownSeparator}>:</Text>
							<Text style={styles.countdownNumber}>0</Text>
							<Text style={styles.countdownNumber}>4</Text>
							<Text style={styles.countdownSeparator}>:</Text>
							<Text style={styles.countdownNumber}>4</Text>
							<Text style={styles.countdownNumber}>0</Text>
						</View>
					</View>
				</View>

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					<Pressable style={styles.actionButton}>
						<Text style={styles.actionButtonText}>长龙</Text>
					</Pressable>
					<Pressable style={styles.actionButton}>
						<Text style={styles.actionButtonText}>路单</Text>
					</Pressable>
				</View>

				{/* Betting Sections */}
				{(
					[
						'冠军',
						'亚军',
						'季军',
						'第四名',
						'第五名',
						'第六名',
						'第七名',
						'第八名',
						'第九名',
						'第十名'
					] as BetType[]
				).map((betType) => (
					<View key={betType} style={styles.bettingSection}>
						{/* Title and Category Buttons in one row */}
						<View style={styles.titleAndCategoryRow}>
							<Text style={styles.betTypeTitle}>{betType}</Text>
							<View style={styles.categoryRow}>
								{(['全', '大', '小', '单', '双', '清'] as BetCategory[]).map(
									(category) => (
										<Pressable
											key={category}
											style={[
												styles.categoryButton,
												selectedCategories[betType].includes(category) &&
													styles.selectedCategory
											]}
											onPress={() => handleQuickSelect(category, betType)}
										>
											<Text
												style={[
													styles.categoryButtonText,
													selectedCategories[betType].includes(category) &&
														styles.selectedCategoryText
												]}
											>
												{category}
											</Text>
										</Pressable>
									)
								)}
							</View>
						</View>

						{/* Number Buttons */}
						<View style={styles.numberRow}>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
								<Pressable
									key={num}
									style={[
										styles.numberButton,
										pk10SelectedNumbers[betType].includes(num) &&
											styles.selectedNumberButton
									]}
									onPress={() => handlePk10NumberSelect(num)}
								>
									<Text
										style={[
											styles.numberButtonText,
											pk10SelectedNumbers[betType].includes(num) &&
												styles.selectedNumberButtonText
										]}
									>
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
									currentBetAmount === amount && styles.selectedBetAmount
								]}
								onPress={() => setCurrentBetAmount(amount)}
							>
								<Text
									style={[
										styles.betAmountText,
										currentBetAmount === amount && styles.selectedBetAmountText
									]}
								>
									{amount}元
								</Text>
							</Pressable>
						))}
						<Pressable style={styles.customAmountButton}>
							<Text style={styles.customAmountText}>编辑金额</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			{/* Bottom Actions */}
			<View style={styles.bottomActions}>
				<View style={styles.betControls}>
					<Pressable style={styles.randomButton}>
						<Text style={styles.randomButtonText}>机选</Text>
					</Pressable>
					<View style={styles.betCountContainer}>
						<Text style={styles.betCountLabel}>单注</Text>
						<TextInput
							style={styles.betCountInput}
							value={betCount.toString()}
							onChangeText={(text) => setBetCount(parseInt(text) || 1)}
							keyboardType="numeric"
						/>
						<Text style={styles.betCountUnit}>元</Text>
					</View>
				</View>
				<View style={styles.actionButtonsRow}>
					<Pressable style={styles.waitButton}>
						<Text style={styles.waitButtonText}>待投注</Text>
					</Pressable>
					<Pressable style={styles.submitButton}>
						<Text style={styles.submitButtonText}>一键下注</Text>
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
	settingsButton: {
		padding: 8
	},
	settingsButtonText: {
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
	actionButtons: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		paddingHorizontal: 15,
		paddingVertical: 10,
		marginBottom: 10,
		gap: 15
	},
	actionButton: {
		backgroundColor: '#e74c3c',
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 15
	},
	actionButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold'
	},
	bettingSection: {
		backgroundColor: '#ffffff',
		marginBottom: 10,
		paddingVertical: 15
	},
	titleAndCategoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f8f8f8',
		paddingHorizontal: 15,
		paddingVertical: 8,
		marginBottom: 15
	},
	betTypeTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333',
		minWidth: 60,
		marginRight: 10
	},
	categoryRow: {
		flexDirection: 'row',
		flex: 1,
		gap: 6
	},
	categoryButton: {
		flex: 1,
		backgroundColor: '#f0f0f0',
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 12,
		alignItems: 'center',
		minHeight: 32
	},
	selectedCategory: {
		backgroundColor: '#e74c3c'
	},
	categoryButtonText: {
		color: '#333333',
		fontSize: 12,
		fontWeight: 'bold'
	},
	selectedCategoryText: {
		color: '#ffffff'
	},
	numberRow: {
		flexDirection: 'row',
		paddingHorizontal: 15,
		gap: 8,
		flexWrap: 'wrap'
	},
	numberButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: '#f0f0f0',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
		borderWidth: 2,
		borderColor: '#e0e0e0'
	},
	selectedNumberButton: {
		backgroundColor: '#e74c3c',
		borderColor: '#c0392b'
	},
	numberButtonText: {
		color: '#333333',
		fontSize: 14,
		fontWeight: 'bold'
	},
	selectedNumberButtonText: {
		color: '#ffffff'
	},
	betAmountSection: {
		backgroundColor: '#ffffff',
		paddingVertical: 15
	},
	betAmountRow: {
		flexDirection: 'row',
		paddingHorizontal: 15,
		gap: 8,
		flexWrap: 'wrap'
	},
	betAmountButton: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	selectedBetAmount: {
		backgroundColor: '#e74c3c',
		borderColor: '#c0392b'
	},
	betAmountText: {
		color: '#333333',
		fontSize: 14,
		fontWeight: 'bold'
	},
	selectedBetAmountText: {
		color: '#ffffff'
	},
	customAmountButton: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	customAmountText: {
		color: '#666666',
		fontSize: 14
	},
	bottomActions: {
		backgroundColor: '#ffffff',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0'
	},
	betControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10
	},
	randomButton: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	randomButtonText: {
		color: '#333333',
		fontSize: 14,
		fontWeight: 'bold'
	},
	betCountContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	betCountLabel: {
		color: '#333333',
		fontSize: 14
	},
	betCountInput: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e0e0e0',
		minWidth: 50,
		textAlign: 'center',
		color: '#333333',
		fontSize: 14
	},
	betCountUnit: {
		color: '#333333',
		fontSize: 14
	},
	actionButtonsRow: {
		flexDirection: 'row',
		gap: 10
	},
	waitButton: {
		flex: 1,
		backgroundColor: '#f0f0f0',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	waitButtonText: {
		color: '#333333',
		fontSize: 16,
		fontWeight: 'bold'
	},
	submitButton: {
		flex: 2,
		backgroundColor: '#e74c3c',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center'
	},
	submitButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold'
	}
})
