import React, { useState } from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	TextInput,
	ActivityIndicator,
	Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

// Hooks
import { useLottery } from '../hooks/useLottery'
import { useAuth } from '../hooks/useAuth'

// 投注类型定义
type BetType = '冠军' | '亚军' | '季军' | '第四名'
type BetCategory = '全' | '大' | '小' | '单' | '双' | '清'

export default function HomeScreen() {
	const {
		selectedNumbers,
		betAmount,
		setBetAmount,
		balance,
		currentRound,
		latestResult,
		countdown,
		countdownDisplay,
		totalCost,
		potentialPayout,
		canPlaceBet,
		loading,
		handleNumberSelect,
		clearSelection,
		placeBet
	} = useLottery()

	const { user, signOut, isAuthenticated, authLoading } = useAuth()

	// PK10 相关状态
	const [selectedBetType, setSelectedBetType] = useState<BetType>('冠军')
	const [selectedCategories, setSelectedCategories] = useState<{
		[key in BetType]: BetCategory[]
	}>({
		冠军: [],
		亚军: [],
		季军: [],
		第四名: []
	})
	const [selectedNumbers, setSelectedNumbers] = useState<{
		[key in BetType]: number[]
	}>({
		冠军: [],
		亚军: [],
		季军: [],
		第四名: []
	})
	const [betAmounts, setBetAmounts] = useState<number[]>([
		10, 100, 1000, 5000, 10000
	])
	const [currentBetAmount, setCurrentBetAmount] = useState<number>(10)
	const [betCount, setBetCount] = useState<number>(2)

	// 如果认证状态正在加载，显示加载页面
	if (authLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#ffffff" />
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		)
	}

	// 如果用户未认证，显示认证页面
	if (!isAuthenticated) {
		const AuthScreen = require('./auth').default
		return <AuthScreen />
	}

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#ffffff" />
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		)
	}

	// 处理投注类型选择
	const handleBetTypeSelect = (betType: BetType) => {
		setSelectedBetType(betType)
	}

	// 处理分类选择
	const handleCategorySelect = (category: BetCategory) => {
		const currentCategories = selectedCategories[selectedBetType]
		if (category === '清') {
			setSelectedCategories((prev) => ({
				...prev,
				[selectedBetType]: []
			}))
			setSelectedNumbers((prev) => ({
				...prev,
				[selectedBetType]: []
			}))
		} else if (category === '全') {
			setSelectedNumbers((prev) => ({
				...prev,
				[selectedBetType]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			}))
		} else {
			const isSelected = currentCategories.includes(category)
			setSelectedCategories((prev) => ({
				...prev,
				[selectedBetType]: isSelected
					? currentCategories.filter((c) => c !== category)
					: [...currentCategories, category]
			}))
		}
	}

	// 处理数字选择
	const handleNumberSelect = (number: number) => {
		const currentNumbers = selectedNumbers[selectedBetType]
		const isSelected = currentNumbers.includes(number)
		setSelectedNumbers((prev) => ({
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
						<Text style={styles.roundNumber}>
							{currentRound?.round_number || '2025082710'}▼
						</Text>
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
				{(['冠军', '亚军', '季军', '第四名'] as BetType[]).map((betType) => (
					<View key={betType} style={styles.bettingSection}>
						<Text style={styles.betTypeTitle}>{betType}</Text>

						{/* Category Buttons */}
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
										onPress={() => handleCategorySelect(category)}
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

						{/* Number Buttons */}
						<View style={styles.numberRow}>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
								<Pressable
									key={num}
									style={[
										styles.numberButton,
										selectedNumbers[betType].includes(num) &&
											styles.selectedNumberButton
									]}
									onPress={() => handleNumberSelect(num)}
								>
									<Text
										style={[
											styles.numberButtonText,
											selectedNumbers[betType].includes(num) &&
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

				{/* Bet Amount */}
				<View style={styles.betSection}>
					<Text style={styles.sectionTitle}>Bet Amount</Text>
					<View style={styles.betInputContainer}>
						<TextInput
							style={styles.betInput}
							value={betAmount}
							onChangeText={setBetAmount}
							keyboardType="numeric"
							placeholder="Enter amount"
							placeholderTextColor="#666"
						/>
						<Text style={styles.betUnit}>G</Text>
					</View>

					<View style={styles.quickAmounts}>
						{[2, 5, 10, 20, 50].map((amount) => (
							<Pressable
								key={amount}
								style={styles.quickAmountButton}
								onPress={() => setBetAmount(amount.toString())}
							>
								<Text style={styles.quickAmountText}>{amount}</Text>
							</Pressable>
						))}
					</View>

					<View style={styles.betInfo}>
						<Text style={styles.betInfoText}>Bet Amount: {betAmount}G</Text>
						<Text style={styles.betInfoText}>
							Potential Payout: {potentialPayout.toFixed(1)}G
						</Text>
					</View>
				</View>
			</ScrollView>

			{/* Bottom Actions */}
			<View style={styles.bottomActions}>
				<Pressable
					style={styles.historyButton}
					onPress={() => router.push('/history')}
				>
					<Text style={styles.historyButtonText}>History</Text>
				</Pressable>

				<Pressable
					style={[styles.betButton, !canPlaceBet && styles.disabledBetButton]}
					onPress={placeBet}
					disabled={!canPlaceBet || loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text style={styles.betButtonText}>Place Bet</Text>
					)}
				</Pressable>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000000'
	},
	loadingText: {
		color: '#ffffff',
		fontSize: 16,
		marginTop: 16
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333333'
	},
	headerLeft: {
		flex: 1
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	headerRight: {
		alignItems: 'flex-end'
	},
	balanceLabel: {
		fontSize: 12,
		color: '#888888'
	},
	balanceAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	logoutButton: {
		marginTop: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#666666'
	},
	logoutText: {
		fontSize: 12,
		color: '#888888'
	},
	scrollView: {
		flex: 1,
		paddingHorizontal: 20
	},
	gameInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#111111',
		borderRadius: 8,
		padding: 16,
		marginVertical: 16,
		borderWidth: 1,
		borderColor: '#333333'
	},
	roundInfo: {
		alignItems: 'center'
	},
	roundTitle: {
		fontSize: 14,
		color: '#888888',
		marginBottom: 4
	},
	roundNumber: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	countdownInfo: {
		alignItems: 'center'
	},
	countdownLabel: {
		fontSize: 14,
		color: '#888888',
		marginBottom: 4
	},
	countdownTime: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#ffffff',
		fontFamily: 'monospace'
	},
	latestResult: {
		backgroundColor: '#111111',
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#333333'
	},
	resultTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 12,
		textAlign: 'center'
	},
	winningNumbers: {
		flexDirection: 'row',
		justifyContent: 'center',
		flexWrap: 'wrap',
		gap: 8
	},
	numberBall: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#333333',
		borderWidth: 1,
		borderColor: '#666666'
	},
	numberText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold'
	},
	selectionSection: {
		backgroundColor: '#111111',
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#333333'
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 8,
		textAlign: 'center'
	},
	sectionSubtitle: {
		fontSize: 14,
		color: '#888888',
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 20
	},
	numberGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
		marginBottom: 16
	},
	numberButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#222222',
		borderWidth: 1,
		borderColor: '#666666'
	},
	selectedNumber: {
		backgroundColor: '#ffffff',
		borderColor: '#ffffff'
	},
	numberButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#888888'
	},
	selectedNumberText: {
		color: '#000000'
	},
	selectionInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	selectionText: {
		fontSize: 14,
		color: '#ffffff'
	},
	clearButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#666666'
	},
	clearButtonText: {
		fontSize: 12,
		color: '#888888'
	},
	betSection: {
		backgroundColor: '#111111',
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#333333'
	},
	betInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16
	},
	betInput: {
		backgroundColor: '#222222',
		borderRadius: 8,
		padding: 12,
		fontSize: 18,
		color: '#ffffff',
		textAlign: 'center',
		minWidth: 100,
		borderWidth: 1,
		borderColor: '#666666'
	},
	betUnit: {
		fontSize: 16,
		color: '#888888',
		marginLeft: 8
	},
	quickAmounts: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 16
	},
	quickAmountButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
		backgroundColor: '#222222',
		borderWidth: 1,
		borderColor: '#666666'
	},
	quickAmountText: {
		fontSize: 14,
		color: '#ffffff'
	},
	betInfo: {
		alignItems: 'center'
	},
	betInfoText: {
		fontSize: 14,
		color: '#888888',
		marginBottom: 4
	},
	bottomActions: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: '#333333',
		backgroundColor: '#000000'
	},
	historyButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		backgroundColor: '#222222',
		borderWidth: 1,
		borderColor: '#666666'
	},
	historyButtonText: {
		fontSize: 16,
		color: '#888888'
	},
	betButton: {
		flex: 2,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff'
	},
	disabledBetButton: {
		opacity: 0.5,
		backgroundColor: '#333333'
	},
	betButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#000000'
	}
})
