import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { authAPI } from '../lib/api'
import WinningNumbers from '../components/WinningNumbers'
import BetNumbers from '../components/BetNumbers'

// 中奖记录类型
interface WinningRecord {
	id: string
	round_number: number
	selected_numbers: any
	winning_numbers: number[]
	bet_amount: number
	actual_payout: number
	profit: number
	matched_numbers: number[]
	created_at: string
	draw_time: string
}

export default function WinningsScreen() {
	const [winnings, setWinnings] = useState<WinningRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [totalWinnings, setTotalWinnings] = useState(0)
	const [totalProfit, setTotalProfit] = useState(0)

	// 加载中奖记录
	const loadWinnings = async () => {
		try {
			const user = await authAPI.getCurrentUser()
			if (!user) {
				console.error('用户未登录')
				return
			}

			const { data, error } = await supabase
				.from('bets')
				.select(`
					*,
					rounds (
						round_number,
						winning_numbers,
						draw_time
					)
				`)
				.eq('user_id', user.id)
				.eq('is_winner', true)
				.eq('status', 'settled')
				.order('created_at', { ascending: false })

			if (error) {
				console.error('加载中奖记录失败:', error)
				return
			}

			const formattedWinnings: WinningRecord[] = (data || []).map((bet: any) => ({
				id: bet.id,
				round_number: bet.rounds?.round_number || bet.round_id,
				selected_numbers: bet.selected_numbers,
				winning_numbers: bet.rounds?.winning_numbers || [],
				bet_amount: bet.bet_amount,
				actual_payout: bet.actual_payout,
				profit: bet.actual_payout - bet.bet_amount,
				matched_numbers: bet.matched_numbers || [],
				created_at: bet.created_at,
				draw_time: bet.rounds?.draw_time || bet.created_at
			}))

			setWinnings(formattedWinnings)

			// 计算总中奖金额和总盈利
			const totalWin = formattedWinnings.reduce((sum, win) => sum + win.actual_payout, 0)
			const totalProf = formattedWinnings.reduce((sum, win) => sum + win.profit, 0)
			setTotalWinnings(totalWin)
			setTotalProfit(totalProf)

		} catch (error) {
			console.error('加载中奖记录失败:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// 下拉刷新
	const onRefresh = () => {
		setRefreshing(true)
		loadWinnings()
	}

	// 格式化货币
	const formatCurrency = (amount: number) => {
		return `¥${amount.toFixed(2)}`
	}

	// 格式化日期
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	// 渲染中奖记录项
	const renderWinning = ({ item }: { item: WinningRecord }) => (
		<View style={styles.winningItem}>
			{/* 头部信息 */}
			<View style={styles.winningHeader}>
				<View style={styles.winningLeft}>
					<Ionicons name="trophy" size={24} color="#ffc107" />
					<View style={styles.winningInfo}>
						<Text style={styles.roundNumber}>第{item.round_number}期</Text>
						<Text style={styles.winningDate}>{formatDate(item.draw_time)}</Text>
					</View>
				</View>
				<View style={styles.winningRight}>
					<Text style={styles.winningAmount}>
						{formatCurrency(item.actual_payout)}
					</Text>
					<Text style={styles.profitAmount}>
						净赚 {formatCurrency(item.profit)}
					</Text>
				</View>
			</View>

			{/* 投注号码 */}
			<View style={styles.numbersSection}>
				<Text style={styles.numbersLabel}>投注号码:</Text>
				<BetNumbers
					selectedNumbers={item.selected_numbers}
					size="small"
					winningNumbers={item.winning_numbers}
					style={styles.numbersContainer}
				/>
			</View>

			{/* 开奖号码 */}
			<View style={styles.numbersSection}>
				<Text style={styles.numbersLabel}>开奖号码:</Text>
				<WinningNumbers
					numbers={item.winning_numbers}
					size="small"
					showPosition={true}
					style={styles.numbersContainer}
				/>
			</View>

			{/* 投注详情 */}
			<View style={styles.detailsSection}>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>投注金额:</Text>
					<Text style={styles.detailValue}>{formatCurrency(item.bet_amount)}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>中奖金额:</Text>
					<Text style={[styles.detailValue, styles.winningText]}>
						{formatCurrency(item.actual_payout)}
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>盈利:</Text>
					<Text style={[styles.detailValue, styles.profitText]}>
						{formatCurrency(item.profit)}
					</Text>
				</View>
				{item.matched_numbers && item.matched_numbers.length > 0 && (
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>匹配号码:</Text>
						<Text style={styles.detailValue}>
							{item.matched_numbers.length}个
						</Text>
					</View>
				)}
			</View>
		</View>
	)

	useEffect(() => {
		loadWinnings()
	}, [])

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#e74c3c" />
					<Text style={styles.loadingText}>加载中...</Text>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* 统计信息 */}
			{winnings.length > 0 && (
				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>{winnings.length}</Text>
						<Text style={styles.statLabel}>中奖次数</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={[styles.statValue, styles.winningText]}>
							{formatCurrency(totalWinnings)}
						</Text>
						<Text style={styles.statLabel}>总中奖金额</Text>
					</View>
					<View style={styles.statItem}>
						<Text style={[styles.statValue, styles.profitText]}>
							{formatCurrency(totalProfit)}
						</Text>
						<Text style={styles.statLabel}>总盈利</Text>
					</View>
				</View>
			)}

			{/* 中奖记录列表 */}
			<FlatList
				data={winnings}
				renderItem={renderWinning}
				keyExtractor={item => item.id}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons name="trophy-outline" size={48} color="#666666" />
						<Text style={styles.emptyText}>暂无中奖记录</Text>
						<Text style={styles.emptySubText}>快去投注试试手气吧！</Text>
					</View>
				}
				contentContainerStyle={styles.listContainer}
			/>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666666'
	},
	statsContainer: {
		flexDirection: 'row',
		backgroundColor: '#ffffff',
		margin: 16,
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3
	},
	statItem: {
		flex: 1,
		alignItems: 'center'
	},
	statValue: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333333'
	},
	statLabel: {
		fontSize: 12,
		color: '#666666',
		marginTop: 4
	},
	listContainer: {
		paddingHorizontal: 16
	},
	winningItem: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3
	},
	winningHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12
	},
	winningLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	winningInfo: {
		marginLeft: 12
	},
	roundNumber: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333'
	},
	winningDate: {
		fontSize: 12,
		color: '#666666',
		marginTop: 2
	},
	winningRight: {
		alignItems: 'flex-end'
	},
	winningAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#4caf50'
	},
	profitAmount: {
		fontSize: 12,
		color: '#4caf50',
		marginTop: 2
	},
	numbersSection: {
		marginBottom: 12
	},
	numbersLabel: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 6
	},
	numbersContainer: {
		marginLeft: 0
	},
	detailsSection: {
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
		paddingTop: 12
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4
	},
	detailLabel: {
		fontSize: 14,
		color: '#666666'
	},
	detailValue: {
		fontSize: 14,
		color: '#333333',
		fontWeight: '500'
	},
	winningText: {
		color: '#4caf50'
	},
	profitText: {
		color: '#4caf50',
		fontWeight: 'bold'
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 100
	},
	emptyText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666666'
	},
	emptySubText: {
		marginTop: 8,
		fontSize: 14,
		color: '#999999'
	}
})
