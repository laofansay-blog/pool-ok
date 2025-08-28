import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator,
	RefreshControl,
	Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../lib/api'
import { supabase } from '../lib/supabase'

// 投注记录类型
interface BetRecord {
	id: string
	round_number: number
	bet_type: string
	selected_numbers: number[]
	bet_amount: number
	potential_payout: number
	actual_payout?: number
	is_winner?: boolean
	status: 'pending' | 'won' | 'lost'
	created_at: string
	draw_time?: string
	winning_numbers?: number[]
}

// 开奖记录类型
interface DrawRecord {
	id: string
	round_number: number
	winning_numbers: number[]
	draw_time: string
	status: 'pending' | 'drawing' | 'completed'
	total_bets: number
	total_payout: number
}

export default function HistoryScreen() {
	const [activeTab, setActiveTab] = useState<'bet' | 'draw'>('bet')
	const [betHistory, setBetHistory] = useState<BetRecord[]>([])
	const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [user, setUser] = useState<any>(null)

	// 加载用户信息
	const loadUser = async () => {
		try {
			const { user: authUser } = await authAPI.getCurrentUser()
			setUser(authUser)
			return authUser
		} catch (error) {
			console.error('获取用户信息失败:', error)
			return null
		}
	}

	// 加载投注历史
	const loadBetHistory = async (userId?: string) => {
		try {
			if (!userId) return

			const { data, error } = await supabase
				.from('bets')
				.select(
					`
					*,
					rounds (
						round_number,
						winning_numbers,
						draw_time,
						status
					)
				`
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(50)

			if (error) {
				console.error('加载投注历史失败:', error)
				return
			}

			const formattedBets: BetRecord[] = data.map((bet: any) => ({
				id: bet.id,
				round_number: bet.rounds?.round_number || bet.round_id,
				bet_type: bet.bet_type,
				selected_numbers: bet.selected_numbers,
				bet_amount: bet.bet_amount,
				potential_payout: bet.potential_payout,
				actual_payout: bet.actual_payout,
				is_winner: bet.is_winner,
				status:
					bet.is_winner === null ? 'pending' : bet.is_winner ? 'won' : 'lost',
				created_at: bet.created_at,
				draw_time: bet.rounds?.draw_time,
				winning_numbers: bet.rounds?.winning_numbers
			}))

			setBetHistory(formattedBets)
		} catch (error) {
			console.error('加载投注历史失败:', error)
		}
	}

	// 加载开奖历史
	const loadDrawHistory = async () => {
		try {
			const { data, error } = await supabase
				.from('rounds')
				.select('*')
				.order('round_number', { ascending: false })
				.limit(30)

			if (error) {
				console.error('加载开奖历史失败:', error)
				return
			}

			const formattedDraws: DrawRecord[] = data.map((round: any) => ({
				id: round.id,
				round_number: round.round_number,
				winning_numbers: round.winning_numbers || [],
				draw_time: round.draw_time,
				status: round.status,
				total_bets: round.total_bets || 0,
				total_payout: round.total_payout || 0
			}))

			setDrawHistory(formattedDraws)
		} catch (error) {
			console.error('加载开奖历史失败:', error)
		}
	}

	// 初始化数据
	const initializeData = async () => {
		setLoading(true)
		const currentUser = await loadUser()

		if (currentUser) {
			await Promise.all([loadBetHistory(currentUser.id), loadDrawHistory()])
		} else {
			// 如果用户未登录，只加载开奖历史
			await loadDrawHistory()
		}

		setLoading(false)
	}

	// 下拉刷新
	const onRefresh = async () => {
		setRefreshing(true)
		await initializeData()
		setRefreshing(false)
	}

	// 组件挂载时加载数据
	useEffect(() => {
		initializeData()
	}, [])

	// 渲染投注记录
	const renderBetItem = ({ item }: { item: BetRecord }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<View style={styles.roundInfo}>
					<Text style={styles.roundText}>第 {item.round_number} 期</Text>
					<View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
						<Text style={styles.statusText}>{getStatusText(item.status)}</Text>
					</View>
				</View>
				<Text style={styles.timeText}>
					{new Date(item.created_at).toLocaleString('zh-CN')}
				</Text>
			</View>

			<View style={styles.betInfo}>
				<Text style={styles.betLabel}>投注类型: {item.bet_type}</Text>
				<Text style={styles.betLabel}>选择号码:</Text>
				<View style={styles.numbersContainer}>
					{item.selected_numbers.map((num: number, index: number) => (
						<View key={index} style={styles.numberBall}>
							<Text style={styles.numberText}>{num}</Text>
						</View>
					))}
				</View>
			</View>

			{item.winning_numbers && item.winning_numbers.length > 0 && (
				<View style={styles.betInfo}>
					<Text style={styles.betLabel}>开奖号码:</Text>
					<View style={styles.numbersContainer}>
						{item.winning_numbers.map((num: number, index: number) => {
							const isMatch = item.selected_numbers.includes(num)
							return (
								<View
									key={index}
									style={[
										styles.numberBall,
										isMatch && styles.winningNumberBall
									]}
								>
									<Text
										style={[
											styles.numberText,
											isMatch && styles.winningNumberText
										]}
									>
										{num}
									</Text>
								</View>
							)
						})}
					</View>
				</View>
			)}

			<View style={styles.betResult}>
				<View style={styles.betAmountContainer}>
					<Text style={styles.betAmount}>投注金额: ¥{item.bet_amount}</Text>
					<Text style={styles.potentialPayout}>
						预期奖金: ¥{item.potential_payout}
					</Text>
				</View>
				<View style={styles.resultContainer}>
					{item.status === 'pending' ? (
						<Text style={styles.pendingText}>等待开奖</Text>
					) : (
						<Text
							style={[
								styles.resultText,
								item.status === 'won' ? styles.winText : styles.loseText
							]}
						>
							{item.status === 'won'
								? `中奖 +¥${item.actual_payout}`
								: '未中奖'}
						</Text>
					)}
				</View>
			</View>
		</View>
	)

	const renderDrawItem = ({ item }: { item: any }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<Text style={styles.roundText}>🏆 第 {item.round_number} 期111</Text>
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
							<View key={index} style={styles.numberBall}>
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
		flex: 1,
		backgroundColor: '#000000'
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
	backButton: {
		paddingHorizontal: 8,
		paddingVertical: 4
	},
	backButtonText: {
		fontSize: 18,
		color: '#ffffff'
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#ffffff'
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
		color: '#ffffff',
		fontSize: 16,
		marginTop: 16
	},
	content: {
		flex: 1
	},
	tabContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333333',
		backgroundColor: '#111111'
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 8,
		marginHorizontal: 4
	},
	activeTab: {
		backgroundColor: '#ffffff'
	},
	tabText: {
		fontSize: 16,
		color: '#888888'
	},
	activeTabText: {
		color: '#000000',
		fontWeight: 'bold'
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center'
	},
	listContainer: {
		paddingHorizontal: 20,
		paddingBottom: 20
	},
	historyItem: {
		backgroundColor: '#111111',
		borderRadius: 8,
		padding: 16,
		marginVertical: 8,
		borderWidth: 1,
		borderColor: '#333333'
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
		color: '#ffffff'
	},
	timeText: {
		fontSize: 12,
		color: '#888888'
	},
	betInfo: {
		marginBottom: 12
	},
	betLabel: {
		fontSize: 14,
		color: '#888888',
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
		backgroundColor: '#333333',
		borderWidth: 1,
		borderColor: '#666666'
	},
	numberText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: 'bold'
	},
	betResult: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	betAmount: {
		fontSize: 14,
		color: '#ffffff'
	},
	resultText: {
		fontSize: 14,
		fontWeight: 'bold'
	},
	winText: {
		color: '#00ff00'
	},
	loseText: {
		color: '#ff0000'
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40
	},
	emptyText: {
		fontSize: 16,
		color: '#888888'
	},
	drawStats: {
		alignItems: 'center'
	},
	statsText: {
		fontSize: 14,
		color: '#888888'
	}
})
