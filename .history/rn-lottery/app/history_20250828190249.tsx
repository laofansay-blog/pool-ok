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
import WinningNumbers from '../components/WinningNumbers'
import BetNumbers from '../components/BetNumbers'

// 投注记录类型
interface BetRecord {
	id: string
	round_number: number
	bet_type: string
	selected_numbers: any // JSONB格式或数组格式
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
					<View style={[styles.statusBadge, getBetStatusStyle(item.status)]}>
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
				<BetNumbers
					selectedNumbers={item.selected_numbers}
					size="small"
					winningNumbers={item.winning_numbers}
					style={styles.numbersContainer}
				/>
			</View>

			{item.winning_numbers &&
				Array.isArray(item.winning_numbers) &&
				item.winning_numbers.length > 0 && (
					<View style={styles.betInfo}>
						<Text style={styles.betLabel}>开奖号码:</Text>
						<WinningNumbers
							numbers={item.winning_numbers}
							size="small"
							showPosition={true}
							highlightNumbers={
								Array.isArray(item.selected_numbers)
									? item.selected_numbers
									: []
							}
							style={styles.numbersContainer}
						/>
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

	// 渲染开奖记录
	const renderDrawItem = ({ item }: { item: DrawRecord }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<View style={styles.drawHeaderInfo}>
					<Text style={styles.roundText}>🏆 第 {item.round_number} 期</Text>
					<View style={[styles.statusBadge, getDrawStatusStyle(item.status)]}>
						<Text style={styles.statusText}>
							{getDrawStatusText(item.status)}
						</Text>
					</View>
				</View>
				<Text style={styles.timeText}>
					{item.draw_time
						? new Date(item.draw_time).toLocaleString('zh-CN')
						: '待开奖'}
				</Text>
			</View>

			{item.winning_numbers &&
				Array.isArray(item.winning_numbers) &&
				item.winning_numbers.length > 0 && (
					<View style={styles.betInfo}>
						<Text style={styles.betLabel}>开奖号码:</Text>
						<WinningNumbers
							numbers={item.winning_numbers}
							size="medium"
							showPosition={true}
							style={styles.numbersContainer}
						/>
					</View>
				)}

			<View style={styles.drawStats}>
				<View style={styles.statsRow}>
					<Text style={styles.statsText}>总投注: ¥{item.total_bets}</Text>
					<Text style={styles.statsText}>总奖金: ¥{item.total_payout}</Text>
				</View>
			</View>
		</View>
	)

	// 辅助函数
	const getStatusText = (status: string) => {
		switch (status) {
			case 'pending':
				return '等待开奖'
			case 'won':
				return '已中奖'
			case 'lost':
				return '未中奖'
			default:
				return '未知'
		}
	}

	const getDrawStatusText = (status: string) => {
		switch (status) {
			case 'pending':
				return '待开奖'
			case 'drawing':
				return '开奖中'
			case 'completed':
				return '已完成'
			default:
				return '未知'
		}
	}

	const getDrawStatusStyle = (status: string) => {
		switch (status) {
			case 'pending':
				return { backgroundColor: '#ffa500' }
			case 'drawing':
				return { backgroundColor: '#00bfff' }
			case 'completed':
				return { backgroundColor: '#32cd32' }
			default:
				return { backgroundColor: '#666666' }
		}
	}

	const getBetStatusStyle = (status: string) => {
		switch (status) {
			case 'pending':
				return { backgroundColor: '#ffa500' }
			case 'won':
				return { backgroundColor: '#32cd32' }
			case 'lost':
				return { backgroundColor: '#ff4444' }
			default:
				return { backgroundColor: '#666666' }
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>投注历史</Text>
				<Pressable onPress={onRefresh} disabled={loading}>
					<Ionicons
						name="refresh"
						size={24}
						color={loading ? '#666666' : '#d4af37'}
					/>
				</Pressable>
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
								我的投注
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
								开奖历史
							</Text>
						</Pressable>
					</View>

					{/* Content */}
					{activeTab === 'bet' ? (
						<FlatList
							data={betHistory}
							renderItem={renderBetItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.listContainer}
							showsVerticalScrollIndicator={false}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									tintColor="#d4af37"
								/>
							}
							ListEmptyComponent={
								<View style={styles.emptyContainer}>
									<Ionicons name="receipt-outline" size={48} color="#666666" />
									<Text style={styles.emptyText}>
										{user ? '暂无投注记录' : '请先登录查看投注记录'}
									</Text>
									{!user && (
										<Pressable
											style={styles.loginPrompt}
											onPress={() => {
												/* 跳转到登录页 */
											}}
										>
											<Text style={styles.loginPromptText}>立即登录</Text>
										</Pressable>
									)}
								</View>
							}
						/>
					) : (
						<FlatList
							data={drawHistory}
							renderItem={renderDrawItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.listContainer}
							showsVerticalScrollIndicator={false}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
									tintColor="#d4af37"
								/>
							}
							ListEmptyComponent={
								<View style={styles.emptyContainer}>
									<Ionicons name="trophy-outline" size={48} color="#666666" />
									<Text style={styles.emptyText}>暂无开奖记录</Text>
								</View>
							}
						/>
					)}
				</View>
			)}
		</SafeAreaView>
	)
}

// 移除重复的函数，已在组件内部定义

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
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	// 新增样式
	roundInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	drawHeaderInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		backgroundColor: '#666666'
	},
	statusText: {
		fontSize: 10,
		color: '#ffffff',
		fontWeight: 'bold'
	},
	betAmountContainer: {
		flex: 1
	},
	potentialPayout: {
		fontSize: 12,
		color: '#666666',
		marginTop: 2
	},
	resultContainer: {
		alignItems: 'flex-end'
	},
	pendingText: {
		fontSize: 14,
		color: '#f39c12',
		fontWeight: 'bold'
	},
	winningNumberBall: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	winningNumberText: {
		color: '#ffffff'
	},
	winningBall: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	loginPrompt: {
		backgroundColor: '#e74c3c',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 15,
		marginTop: 12
	},
	loginPromptText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5'
	},
	loadingText: {
		color: '#333333',
		fontSize: 16,
		marginTop: 16
	},
	content: {
		flex: 1
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		paddingHorizontal: 15,
		paddingVertical: 10,
		marginBottom: 10
	},
	tab: {
		flex: 1,
		paddingVertical: 8,
		alignItems: 'center',
		borderRadius: 15,
		marginHorizontal: 4,
		backgroundColor: '#f0f0f0'
	},
	activeTab: {
		backgroundColor: '#e74c3c'
	},
	tabText: {
		fontSize: 14,
		color: '#666666',
		fontWeight: 'bold'
	},
	activeTabText: {
		color: '#ffffff',
		fontWeight: 'bold'
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center'
	},
	listContainer: {
		paddingHorizontal: 15,
		paddingBottom: 20
	},
	historyItem: {
		backgroundColor: '#ffffff',
		borderRadius: 8,
		padding: 15,
		marginVertical: 5,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
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
		color: '#333333'
	},
	timeText: {
		fontSize: 12,
		color: '#666666'
	},
	betInfo: {
		marginBottom: 12
	},
	betLabel: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 8
	},
	numbersContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6
	},
	numberBall: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f0f0f0',
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	numberText: {
		color: '#333333',
		fontSize: 14,
		fontWeight: 'bold'
	},
	betResult: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	betAmount: {
		fontSize: 14,
		color: '#333333'
	},
	resultText: {
		fontSize: 14,
		fontWeight: 'bold'
	},
	winText: {
		color: '#27ae60'
	},
	loseText: {
		color: '#e74c3c'
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
		backgroundColor: '#ffffff',
		margin: 15,
		borderRadius: 8
	},
	emptyText: {
		fontSize: 16,
		color: '#666666',
		marginTop: 16,
		textAlign: 'center'
	},
	drawStats: {
		alignItems: 'center'
	},
	statsText: {
		fontSize: 14,
		color: '#666666'
	}
})
