import React, { useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { useRecoilValue } from 'recoil'
import { betHistoryState, drawHistoryState, loadingState } from '../store/atoms'
import { useLottery } from '../hooks/useLottery'

export default function HistoryScreen() {
	const betHistory = useRecoilValue(betHistoryState)
	const drawHistory = useRecoilValue(drawHistoryState)
	const loading = useRecoilValue(loadingState)
	const { loadBetHistory } = useLottery()
	const [activeTab, setActiveTab] = React.useState<'bet' | 'draw'>('bet')

	useEffect(() => {
		loadBetHistory()
	}, [])

	const renderBetItem = ({ item }: { item: any }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<Text style={styles.roundText}>Round {item.round_number}</Text>
				<Text style={styles.timeText}>
					{new Date(item.created_at).toLocaleString()}
				</Text>
			</View>

			<View style={styles.betInfo}>
				<Text style={styles.betLabel}>Selected Numbers:</Text>
				<View style={styles.numbersContainer}>
					{item.selected_numbers.map((num: number, index: number) => (
						<View key={index} style={[styles.numberBall, getNumberStyle(num)]}>
							<Text style={styles.numberText}>{num}</Text>
						</View>
					))}
				</View>
			</View>

			{item.winning_numbers && (
				<View style={styles.betInfo}>
					<Text style={styles.betLabel}>Winning Numbers:</Text>
					<View style={styles.numbersContainer}>
						{item.winning_numbers.map((num: number, index: number) => (
							<View
								key={index}
								style={[styles.numberBall, getNumberStyle(num)]}
							>
								<Text style={styles.numberText}>{num}</Text>
							</View>
						))}
					</View>
				</View>
			)}

			<View style={styles.betResult}>
				<Text style={styles.betAmount}>Bet: {item.bet_amount}G</Text>
				<Text
					style={[
						styles.resultText,
						item.is_winner ? styles.winText : styles.loseText
					]}
				>
					{item.is_winner ? `Won +${item.actual_payout}G` : 'Lost'}
				</Text>
			</View>
		</View>
	)

	const renderDrawItem = ({ item }: { item: any }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<Text style={styles.roundText}>🏆 第 {item.round_number} 期</Text>
				<Text style={styles.timeText}>
					{item.draw_time
						? new Date(item.draw_time).toLocaleString()
						: '待开奖'}
				</Text>
			</View>

			{item.winning_numbers && (
				<View style={styles.betInfo}>
					<Text style={styles.betLabel}>开奖数字:</Text>
					<View style={styles.numbersContainer}>
						{item.winning_numbers.map((num: number, index: number) => (
							<View
								key={index}
								style={[styles.numberBall, getNumberStyle(num)]}
							>
								<Text style={styles.numberText}>{num}</Text>
							</View>
						))}
					</View>
				</View>
			)}

			<View style={styles.drawStats}>
				<Text style={styles.statsText}>
					Status: {getStatusText(item.status)}
				</Text>
			</View>
		</View>
	)

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<Text style={styles.backButtonText}>‹ Back</Text>
				</Pressable>
				<Text style={styles.title}>History</Text>
				<View style={styles.placeholder} />
			</View>

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#d4af37" />
					<Text style={styles.loadingText}>加载中...</Text>
				</View>
			) : (
				<View style={styles.content}>
					{/* Tab Navigation */}
					<View style={styles.tabContainer}>
						<Pressable
							style={[styles.tab, activeTab === 'bet' && styles.activeTab]}
							onPress={() => setActiveTab('bet')}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'bet' && styles.activeTabText
								]}
							>
								My Bets
							</Text>
						</Pressable>
						<Pressable
							style={[styles.tab, activeTab === 'draw' && styles.activeTab]}
							onPress={() => setActiveTab('draw')}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === 'draw' && styles.activeTabText
								]}
							>
								Draw History
							</Text>
						</Pressable>
					</View>

					{/* Content */}
					<FlatList
						data={activeTab === 'bet' ? betHistory : drawHistory}
						renderItem={activeTab === 'bet' ? renderBetItem : renderDrawItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContainer}
						showsVerticalScrollIndicator={false}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									{activeTab === 'bet' ? 'No bet history' : 'No draw history'}
								</Text>
							</View>
						}
					/>
				</View>
			)}
		</SafeAreaView>
	)
}

const getStatusText = (status: string) => {
	switch (status) {
		case 'pending':
			return 'Pending'
		case 'drawing':
			return 'Drawing'
		case 'completed':
			return 'Completed'
		default:
			return 'Unknown'
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	safeArea: {
		flex: 1
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
	backButton: {
		paddingHorizontal: 8,
		paddingVertical: 4
	},
	backButtonText: {
		fontSize: 18,
		color: '#d4af37',
		fontFamily: 'serif'
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#d4af37',
		fontFamily: 'serif'
	},
	placeholder: {
		width: 40
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loadingText: {
		color: '#d4af37',
		fontSize: 16,
		marginTop: 16,
		fontFamily: 'serif'
	},
	content: {
		flex: 1
	},
	tabContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
		backgroundColor: 'rgba(26, 26, 26, 0.9)'
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 8,
		marginHorizontal: 4
	},
	activeTab: {
		backgroundColor: '#d4af37'
	},
	tabText: {
		fontSize: 16,
		color: '#888',
		fontFamily: 'serif'
	},
	activeTabText: {
		color: '#1a1a1a',
		fontWeight: 'bold'
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#d4af37',
		textAlign: 'center',
		fontFamily: 'serif'
	},
	listContainer: {
		paddingHorizontal: 20,
		paddingBottom: 20
	},
	historyItem: {
		backgroundColor: 'rgba(42, 42, 42, 0.8)',
		borderRadius: 12,
		padding: 16,
		marginVertical: 8,
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	historyHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12
	},
	roundText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#d4af37',
		fontFamily: 'serif'
	},
	timeText: {
		fontSize: 12,
		color: '#888'
	},
	betInfo: {
		marginBottom: 12
	},
	betLabel: {
		fontSize: 14,
		color: '#888',
		marginBottom: 8
	},
	numbersContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	numberBall: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#d4af37'
	},
	numberText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
		fontFamily: 'serif'
	},
	betResult: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	betAmount: {
		fontSize: 14,
		color: '#d4af37',
		fontFamily: 'serif'
	},
	resultText: {
		fontSize: 14,
		fontWeight: 'bold'
	},
	winText: {
		color: '#228b22'
	},
	loseText: {
		color: '#dc143c'
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40
	},
	emptyText: {
		fontSize: 16,
		color: '#888',
		fontFamily: 'serif'
	},
	drawStats: {
		alignItems: 'center'
	},
	statsText: {
		fontSize: 14,
		color: '#888',
		fontFamily: 'serif'
	}
})
