import React from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	TextInput,
	ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

// Hooks
import { useLottery } from '../hooks/useLottery'
import { useAuth } from '../hooks/useAuth'

export default function HomeScreen() {
	const {
		selectedNumbers,
		betAmount,
		setBetAmount,
		balance,
		currentRound,
		winningNumbers,
		selectedGroups,
		totalCost,
		potentialPayout,
		canPlaceBet,
		handleNumberSelect,
		clearSelection,
		placeBet
	} = useLottery()

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable style={styles.backButton}>
					<Text style={styles.backButtonText}>‹</Text>
				</Pressable>
				<Text style={styles.headerTitle}>玩法</Text>
				<View style={styles.headerCenter}>
					<Text style={styles.headerSubtitle}>定位胆-定位胆</Text>
					<Text style={styles.headerDropdown}>▼</Text>
				</View>
				<Text style={styles.twoSided}>两面</Text>
				<Pressable style={styles.settingsButton}>
					<Text style={styles.settingsText}>⚙</Text>
				</Pressable>
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
			>
				{/* Game Info */}
				<View style={styles.gameInfo}>
					<View style={styles.gameInfoLeft}>
						<Text style={styles.gameTitle}>五分PK拾</Text>
						<Text style={styles.gameRound}>2025082403{currentRound}期▼</Text>
					</View>
					<View style={styles.gameInfoRight}>
						<Text style={styles.balanceLabel}>
							余额: <Text style={styles.balanceAmount}>{balance}.00</Text>元
						</Text>
						<Text style={styles.countdown}>
							距2025082404{currentRound + 1}期截止
						</Text>
					</View>
				</View>

				{/* Winning Numbers */}
				<View style={styles.winningSection}>
					<View style={styles.winningNumbers}>
						{[7, 6, 9, 2, 3, 8, 10, 4, 5].map((num, index) => (
							<View
								key={index}
								style={[styles.numberBall, getNumberStyle(num)]}
							>
								<Text style={styles.numberText}>{num}</Text>
							</View>
						))}
					</View>
					<View style={styles.countdownNumbers}>
						<Text style={styles.countdownNumber}>0</Text>
						<Text style={styles.countdownNumber}>0</Text>
						<Text style={styles.countdownSeparator}>:</Text>
						<Text style={styles.countdownNumber}>0</Text>
						<Text style={styles.countdownNumber}>2</Text>
						<Text style={styles.countdownSeparator}>:</Text>
						<Text style={styles.countdownNumber}>4</Text>
						<Text style={styles.countdownNumber}>8</Text>
					</View>
				</View>

				{/* Betting Sections */}
				{['冠军', '亚军', '季军'].map((title, sectionIndex) => (
					<View key={title} style={styles.bettingSection}>
						<Text style={styles.sectionTitle}>{title}</Text>
						<View style={styles.betTypeRow}>
							{['全', '大', '小', '单', '双', '清'].map((type) => (
								<Pressable key={type} style={styles.betTypeButton}>
									<Text style={styles.betTypeText}>{type}</Text>
								</Pressable>
							))}
						</View>
						<View style={styles.numberGrid}>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<Pressable key={num} style={styles.numberButton}>
									<Text style={styles.numberButtonText}>
										{num.toString().padStart(2, '0')}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				))}

				{/* Fourth Section */}
				<View style={styles.bettingSection}>
					<Text style={styles.sectionTitle}>第四名</Text>
					<View style={styles.betTypeRow}>
						{['全', '大', '小', '单', '双', '清'].map((type) => (
							<Pressable key={type} style={styles.betTypeButton}>
								<Text style={styles.betTypeText}>{type}</Text>
							</Pressable>
						))}
					</View>

					{/* Amount Selection */}
					<View style={styles.amountSection}>
						{['100元', '500元', '1000元', '5000元', '10000元'].map((amount) => (
							<Pressable key={amount} style={styles.amountButton}>
								<Text style={styles.amountText}>{amount}</Text>
							</Pressable>
						))}
						<Pressable style={styles.editAmountButton}>
							<Text style={styles.editAmountText}>编辑金额</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			{/* Bottom Bar */}
			<View style={styles.bottomBar}>
				<Pressable style={styles.machineSelectButton}>
					<Text style={styles.machineSelectText}>机选</Text>
				</Pressable>
				<View style={styles.betInputContainer}>
					<Text style={styles.betLabel}>单注</Text>
					<TextInput
						style={styles.betInput}
						value={betAmount}
						onChangeText={setBetAmount}
						keyboardType="numeric"
					/>
					<Text style={styles.betUnit}>元</Text>
				</View>
				<Pressable style={styles.addToBetButton}>
					<Text style={styles.addToBetText}>添加注单</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	)
}

// Helper function for number ball colors
const getNumberStyle = (num: number) => {
	const colors = [
		'#FFD700', // 1 - yellow
		'#6B46C1', // 2 - purple
		'#DC2626', // 3 - red
		'#2563EB', // 4 - blue
		'#059669', // 5 - green
		'#DC2626', // 6 - red
		'#059669', // 7 - green
		'#EF4444', // 8 - red
		'#10B981', // 9 - green
		'#F59E0B' // 10 - orange
	]
	return { backgroundColor: colors[num - 1] || '#6B7280' }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	scrollView: {
		flex: 1
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#e53e3e',
		paddingHorizontal: 16,
		paddingVertical: 12,
		justifyContent: 'space-between'
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
		fontSize: 16,
		fontWeight: '500'
	},
	headerCenter: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.2)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4
	},
	headerSubtitle: {
		color: '#ffffff',
		fontSize: 14
	},
	headerDropdown: {
		color: '#ffffff',
		fontSize: 12,
		marginLeft: 4
	},
	twoSided: {
		color: '#ffffff',
		fontSize: 14,
		backgroundColor: 'rgba(255,255,255,0.2)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4
	},
	settingsButton: {
		padding: 8
	},
	settingsText: {
		color: '#ffffff',
		fontSize: 16
	},
	gameInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#e2e8f0'
	},
	gameInfoLeft: {
		alignItems: 'flex-start'
	},
	gameTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1a202c'
	},
	gameRound: {
		fontSize: 14,
		color: '#718096',
		marginTop: 2
	},
	gameInfoRight: {
		alignItems: 'flex-end'
	},
	balanceLabel: {
		fontSize: 14,
		color: '#718096'
	},
	balanceAmount: {
		color: '#e53e3e',
		fontWeight: '600'
	},
	countdown: {
		fontSize: 12,
		color: '#718096',
		marginTop: 2
	},
	winningSection: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#e2e8f0'
	},
	winningNumbers: {
		flexDirection: 'row',
		gap: 4
	},
	numberBall: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center'
	},
	numberText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '600'
	},
	countdownNumbers: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2
	},
	countdownNumber: {
		color: '#e53e3e',
		fontSize: 18,
		fontWeight: '600',
		fontFamily: 'monospace'
	},
	countdownSeparator: {
		color: '#e53e3e',
		fontSize: 18,
		fontWeight: '600'
	},
	bettingSection: {
		backgroundColor: '#ffffff',
		marginTop: 8,
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	sectionTitle: {
		fontSize: 14,
		color: '#718096',
		backgroundColor: '#f7fafc',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		alignSelf: 'flex-start',
		marginBottom: 12
	},
	betTypeRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12
	},
	betTypeButton: {
		backgroundColor: '#f7fafc',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#e2e8f0'
	},
	betTypeText: {
		color: '#4a5568',
		fontSize: 14
	},
	numberGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	numberButton: {
		width: 48,
		height: 32,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e2e8f0',
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center'
	},
	numberButtonText: {
		color: '#e53e3e',
		fontSize: 14,
		fontWeight: '500'
	},
	amountSection: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 12
	},
	amountButton: {
		backgroundColor: '#718096',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16
	},
	amountText: {
		color: '#ffffff',
		fontSize: 12
	},
	editAmountButton: {
		backgroundColor: '#718096',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16
	},
	editAmountText: {
		color: '#ffffff',
		fontSize: 12
	},
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: '#e2e8f0',
		gap: 12
	},
	machineSelectButton: {
		borderWidth: 1,
		borderColor: '#e53e3e',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4
	},
	machineSelectText: {
		color: '#e53e3e',
		fontSize: 14
	},
	betInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		gap: 8
	},
	betLabel: {
		color: '#4a5568',
		fontSize: 14
	},
	betInput: {
		borderWidth: 1,
		borderColor: '#e2e8f0',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		minWidth: 40,
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '600',
		color: '#e53e3e'
	},
	betUnit: {
		color: '#4a5568',
		fontSize: 14
	},
	addToBetButton: {
		backgroundColor: '#e53e3e',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4
	},
	addToBetText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '500'
	}
})
