import React from 'react'
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

	const { user, signOut } = useAuth()

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#ffffff" />
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={styles.title}>Lottery</Text>
				</View>
				<View style={styles.headerRight}>
					<Text style={styles.balanceLabel}>Balance</Text>
					<Text style={styles.balanceAmount}>{balance}G</Text>
					<Pressable style={styles.logoutButton} onPress={signOut}>
						<Text style={styles.logoutText}>Logout</Text>
					</Pressable>
				</View>
			</View>

				<ScrollView
					style={styles.scrollView}
					showsVerticalScrollIndicator={false}
				>
					{/* Game Info */}
					<View style={styles.gameInfo}>
						<View style={styles.roundInfo}>
							<Text style={styles.roundTitle}>Current Round</Text>
							<Text style={styles.roundNumber}>
								{currentRound?.round_number || 'Loading...'}
							</Text>
						</View>
						<View style={styles.countdownInfo}>
							<Text style={styles.countdownLabel}>Next Draw</Text>
							<Text style={styles.countdownTime}>{countdownDisplay}</Text>
						</View>
					</View>

					{/* Latest Result */}
					{latestResult && latestResult.winning_numbers && (
						<View style={styles.latestResult}>
							<Text style={styles.resultTitle}>Latest Result</Text>
							<View style={styles.winningNumbers}>
								{latestResult.winning_numbers.map((num, index) => (
									<View key={index} style={styles.numberBall}>
										<Text style={styles.numberText}>{num}</Text>
									</View>
								))}
							</View>
						</View>
					)}

					{/* Number Selection */}
					<View style={styles.selectionSection}>
						<Text style={styles.sectionTitle}>Select Your Numbers</Text>
						<Text style={styles.sectionSubtitle}>
							Choose 9 numbers from 1-10. Match all to win{' '}
							{(parseFloat(betAmount) * 9.8).toFixed(1)}G
						</Text>

						<View style={styles.numberGrid}>
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
								<Pressable
									key={num}
									style={[
										styles.numberButton,
										selectedNumbers.includes(num) && styles.selectedNumber
									]}
									onPress={() => handleNumberSelect(num)}
								>
									<Text
										style={[
											styles.numberButtonText,
											selectedNumbers.includes(num) && styles.selectedNumberText
										]}
									>
										{num}
									</Text>
								</Pressable>
							))}
						</View>

						<View style={styles.selectionInfo}>
							<Text style={styles.selectionText}>
								Selected: {selectedNumbers.length}/9
							</Text>
							{selectedNumbers.length > 0 && (
								<Pressable style={styles.clearButton} onPress={clearSelection}>
									<Text style={styles.clearButtonText}>Clear</Text>
								</Pressable>
							)}
						</View>
					</View>

					{/* Bet Amount */}
					<View style={styles.betSection}>
						<Text style={styles.sectionTitle}>💰 投注金额</Text>
						<View style={styles.betInputContainer}>
							<TextInput
								style={styles.betInput}
								value={betAmount}
								onChangeText={setBetAmount}
								keyboardType="numeric"
								placeholder="输入金额"
								placeholderTextColor="#666"
							/>
							<Text style={styles.betUnit}>金币</Text>
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
							<Text style={styles.betInfoText}>投注金额: {betAmount} 金币</Text>
							<Text style={styles.betInfoText}>
								潜在收益: {potentialPayout.toFixed(1)} 金币
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
						<Text style={styles.historyButtonText}>📜 历史</Text>
					</Pressable>

					<Pressable
						style={[styles.betButton, !canPlaceBet && styles.disabledBetButton]}
						onPress={placeBet}
						disabled={!canPlaceBet || loading}
					>
						<LinearGradient
							colors={canPlaceBet ? ['#d4af37', '#b8941f'] : ['#666', '#444']}
							style={styles.betButtonGradient}
						>
							{loading ? (
								<ActivityIndicator size="small" color="#1a1a1a" />
							) : (
								<Text style={styles.betButtonText}>🎲 下注</Text>
							)}
						</LinearGradient>
					</Pressable>
				</View>
			</SafeAreaView>
		</LinearGradient>
	)
}

// Helper function for number ball colors
const getNumberStyle = (num: number) => {
	const colors = [
		'#d4af37', // 1 - gold
		'#8b4513', // 2 - brown
		'#dc143c', // 3 - crimson
		'#4169e1', // 4 - royal blue
		'#228b22', // 5 - forest green
		'#ff6347', // 6 - tomato
		'#9932cc', // 7 - dark orchid
		'#ff8c00', // 8 - dark orange
		'#2e8b57', // 9 - sea green
		'#b22222' // 10 - fire brick
	]
	return { backgroundColor: colors[num - 1] || '#666' }
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	safeArea: {
		flex: 1
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1a1a1a'
	},
	loadingText: {
		color: '#d4af37',
		fontSize: 16,
		marginTop: 16,
		fontFamily: 'serif'
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 2,
		borderBottomColor: '#d4af37',
		backgroundColor: 'rgba(212, 175, 55, 0.1)'
	},
	headerLeft: {
		flex: 1
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#d4af37',
		fontFamily: 'serif'
	},
	subtitle: {
		fontSize: 12,
		color: '#888',
		fontStyle: 'italic',
		marginTop: 2
	},
	headerRight: {
		alignItems: 'flex-end'
	},
	balanceLabel: {
		fontSize: 12,
		color: '#888'
	},
	balanceAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#d4af37',
		fontFamily: 'serif'
	},
	logoutButton: {
		marginTop: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#666'
	},
	logoutText: {
		fontSize: 12,
		color: '#666'
	},
	scrollView: {
		flex: 1,
		paddingHorizontal: 20
	},
	gameInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderRadius: 12,
		padding: 16,
		marginVertical: 16,
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	roundInfo: {
		alignItems: 'center'
	},
	roundTitle: {
		fontSize: 14,
		color: '#888',
		marginBottom: 4
	},
	roundNumber: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#d4af37',
		fontFamily: 'serif'
	},
	countdownInfo: {
		alignItems: 'center'
	},
	countdownLabel: {
		fontSize: 14,
		color: '#888',
		marginBottom: 4
	},
	countdownTime: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#dc143c',
		fontFamily: 'monospace'
	},
	latestResult: {
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	resultTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#d4af37',
		marginBottom: 12,
		textAlign: 'center',
		fontFamily: 'serif'
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
		borderWidth: 2,
		borderColor: '#d4af37'
	},
	numberText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
		fontFamily: 'serif'
	},
	selectionSection: {
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#d4af37',
		marginBottom: 8,
		textAlign: 'center',
		fontFamily: 'serif'
	},
	sectionSubtitle: {
		fontSize: 14,
		color: '#888',
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
		backgroundColor: 'rgba(26, 26, 26, 0.8)',
		borderWidth: 2,
		borderColor: '#666'
	},
	selectedNumber: {
		backgroundColor: '#d4af37',
		borderColor: '#d4af37',
		shadowColor: '#d4af37',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 8,
		elevation: 8
	},
	numberButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#888',
		fontFamily: 'serif'
	},
	selectedNumberText: {
		color: '#1a1a1a'
	},
	selectionInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	selectionText: {
		fontSize: 14,
		color: '#d4af37',
		fontFamily: 'serif'
	},
	clearButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#dc143c'
	},
	clearButtonText: {
		fontSize: 12,
		color: '#dc143c'
	},
	betSection: {
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	betInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16
	},
	betInput: {
		backgroundColor: 'rgba(26, 26, 26, 0.8)',
		borderRadius: 8,
		padding: 12,
		fontSize: 18,
		color: '#d4af37',
		textAlign: 'center',
		minWidth: 100,
		borderWidth: 1,
		borderColor: '#666',
		fontFamily: 'serif'
	},
	betUnit: {
		fontSize: 16,
		color: '#888',
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
		backgroundColor: 'rgba(26, 26, 26, 0.8)',
		borderWidth: 1,
		borderColor: '#666'
	},
	quickAmountText: {
		fontSize: 14,
		color: '#d4af37',
		fontFamily: 'serif'
	},
	betInfo: {
		alignItems: 'center'
	},
	betInfoText: {
		fontSize: 14,
		color: '#888',
		marginBottom: 4
	},
	bottomActions: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: '#333',
		backgroundColor: 'rgba(26, 26, 26, 0.9)'
	},
	historyButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderWidth: 1,
		borderColor: '#666'
	},
	historyButtonText: {
		fontSize: 16,
		color: '#888',
		fontFamily: 'serif'
	},
	betButton: {
		flex: 2,
		borderRadius: 8,
		overflow: 'hidden'
	},
	disabledBetButton: {
		opacity: 0.5
	},
	betButtonGradient: {
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center'
	},
	betButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1a1a1a',
		fontFamily: 'serif'
	}
})
