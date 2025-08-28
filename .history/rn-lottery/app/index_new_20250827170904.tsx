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
		clearSelection,
		placeBet
	} = useLottery()

	const { user, signOut, isAuthenticated, authLoading } = useAuth()

	// PK10 相关状态
	const [selectedBetType, setSelectedBetType] = useState<BetType>('冠军')
	const [selectedCategories, setSelectedCategories] = useState<{[key in BetType]: BetCategory[]}>({
		'冠军': [],
		'亚军': [],
		'季军': [],
		'第四名': []
	})
	const [pk10SelectedNumbers, setPk10SelectedNumbers] = useState<{[key in BetType]: number[]}>({
		'冠军': [],
		'亚军': [],
		'季军': [],
		'第四名': []
	})
	const [betAmounts, setBetAmounts] = useState<number[]>([10, 100, 1000, 5000, 10000])
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
			setSelectedCategories(prev => ({
				...prev,
				[selectedBetType]: []
			}))
			setPk10SelectedNumbers(prev => ({
				...prev,
				[selectedBetType]: []
			}))
		} else if (category === '全') {
			setPk10SelectedNumbers(prev => ({
				...prev,
				[selectedBetType]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			}))
		} else {
			const isSelected = currentCategories.includes(category)
			setSelectedCategories(prev => ({
				...prev,
				[selectedBetType]: isSelected 
					? currentCategories.filter(c => c !== category)
					: [...currentCategories, category]
			}))
		}
	}

	// 处理数字选择
	const handlePk10NumberSelect = (number: number) => {
		const currentNumbers = pk10SelectedNumbers[selectedBetType]
		const isSelected = currentNumbers.includes(number)
		setPk10SelectedNumbers(prev => ({
			...prev,
			[selectedBetType]: isSelected
				? currentNumbers.filter(n => n !== number)
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

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
							{(['全', '大', '小', '单', '双', '清'] as BetCategory[]).map((category) => (
								<Pressable
									key={category}
									style={[
										styles.categoryButton,
										selectedCategories[betType].includes(category) && styles.selectedCategory
									]}
									onPress={() => handleCategorySelect(category)}
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

						{/* Number Buttons */}
						<View style={styles.numberRow}>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
								<Pressable
									key={num}
									style={[
										styles.numberButton,
										pk10SelectedNumbers[betType].includes(num) && styles.selectedNumberButton
									]}
									onPress={() => handlePk10NumberSelect(num)}
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
									currentBetAmount === amount && styles.selectedBetAmount
								]}
								onPress={() => setCurrentBetAmount(amount)}
							>
								<Text style={[
									styles.betAmountText,
									currentBetAmount === amount && styles.selectedBetAmountText
								]}>
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
