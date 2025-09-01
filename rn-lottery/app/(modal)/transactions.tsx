import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	RefreshControl,
	Pressable
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { authAPI } from '@/lib/api'

// 交易记录类型
interface Transaction {
	id: string
	type: 'recharge' | 'withdrawal' | 'bet' | 'win'
	amount: number
	status: string
	created_at: string
	description: string
	payment_method?: string
	payment_id?: string
	bet_id?: string
}

export default function TransactionsScreen() {
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [filter, setFilter] = useState<
		'all' | 'recharge' | 'withdrawal' | 'bet'
	>('all')

	// 加载交易记录
	const loadTransactions = async () => {
		try {
			const { user, error: userError } = await authAPI.getCurrentUser()
			if (userError || !user) {
				console.error('用户未登录:', userError)
				return
			}

			// 获取充值记录
			const { data: recharges, error: rechargeError } = await supabase
				.from('recharges')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })

			// 获取提现记录
			const { data: withdrawals, error: withdrawalError } = await supabase
				.from('withdrawals')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })

			// 获取投注记录
			const { data: bets, error: betError } = await supabase
				.from('bets')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.limit(50)

			const allTransactions: Transaction[] = []

			// 处理充值记录
			if (recharges && !rechargeError) {
				recharges.forEach((recharge) => {
					allTransactions.push({
						id: `recharge-${recharge.id}`,
						type: 'recharge',
						amount: recharge.amount,
						status: recharge.status,
						created_at: recharge.created_at,
						description: '账户充值',
						payment_method: recharge.payment_method,
						payment_id: recharge.payment_id
					})
				})
			}

			// 处理提现记录
			if (withdrawals && !withdrawalError) {
				withdrawals.forEach((withdrawal) => {
					allTransactions.push({
						id: `withdrawal-${withdrawal.id}`,
						type: 'withdrawal',
						amount: withdrawal.amount,
						status: withdrawal.status,
						created_at: withdrawal.created_at,
						description: '账户提现'
					})
				})
			}

			// 处理投注记录
			if (bets && !betError) {
				bets.forEach((bet) => {
					// 投注支出
					allTransactions.push({
						id: `bet-${bet.id}`,
						type: 'bet',
						amount: -bet.bet_amount,
						status: bet.status,
						created_at: bet.created_at,
						description: `第${bet.round_id}期投注`
					})

					// 中奖收入
					if (bet.is_winner && bet.actual_payout > 0) {
						allTransactions.push({
							id: `win-${bet.id}`,
							type: 'win',
							amount: bet.actual_payout,
							status: 'completed',
							created_at: bet.created_at,
							description: `第${bet.round_id}期中奖`
						})
					}
				})
			}

			// 按时间排序
			allTransactions.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			)

			setTransactions(allTransactions)
		} catch (error) {
			console.error('加载交易记录失败:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// 下拉刷新
	const onRefresh = () => {
		setRefreshing(true)
		loadTransactions()
	}

	// 过滤交易记录
	const filteredTransactions = transactions.filter((transaction) => {
		if (filter === 'all') return true
		return transaction.type === filter
	})

	// 格式化货币
	const formatCurrency = (amount: number) => {
		return `¥${Math.abs(amount).toFixed(2)}`
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

	// 获取交易图标
	const getTransactionIcon = (type: string) => {
		switch (type) {
			case 'recharge':
				return 'add-circle'
			case 'withdrawal':
				return 'remove-circle'
			case 'bet':
				return 'game-controller'
			case 'win':
				return 'trophy'
			default:
				return 'swap-horizontal'
		}
	}

	// 获取交易颜色
	const getTransactionColor = (type: string, amount: number) => {
		if (amount > 0) return '#4caf50'
		if (amount < 0) return '#f44336'
		return '#666666'
	}

	// 获取状态文本
	const getStatusText = (status: string) => {
		switch (status) {
			case 'pending':
				return '待处理'
			case 'processing':
				return '处理中'
			case 'completed':
				return '已完成'
			case 'failed':
				return '失败'
			case 'settled':
				return '已结算'
			default:
				return status
		}
	}

	// 渲染交易项
	const renderTransaction = ({ item }: { item: Transaction }) => {
		// 检查是否是中奖结算类型的交易
		const isWinningTransaction = item.type === 'win' && item.bet_id

		const TransactionComponent = isWinningTransaction ? Pressable : View
		const transactionProps = isWinningTransaction
			? {
					onPress: () =>
						router.push(`/(modal)/winning-detail?id=${item.bet_id}`)
			  }
			: {}

		return (
			<TransactionComponent
				style={styles.transactionItem}
				{...transactionProps}
			>
				<View style={styles.transactionLeft}>
					<Ionicons
						name={getTransactionIcon(item.type)}
						size={24}
						color={getTransactionColor(item.type, item.amount)}
					/>
					<View style={styles.transactionInfo}>
						<Text style={styles.transactionDescription}>
							{item.description}
						</Text>
						<Text style={styles.transactionDate}>
							{formatDate(item.created_at)}
						</Text>
					</View>
				</View>
				<View style={styles.transactionRight}>
					<Text
						style={[
							styles.transactionAmount,
							{ color: getTransactionColor(item.type, item.amount) }
						]}
					>
						{item.amount > 0 ? '+' : ''}
						{formatCurrency(item.amount)}
					</Text>
					<Text style={styles.transactionStatus}>
						{getStatusText(item.status)}
					</Text>
					{isWinningTransaction && (
						<Ionicons name="chevron-forward" size={16} color="#666666" />
					)}
				</View>
			</TransactionComponent>
		)
	}

	useEffect(() => {
		loadTransactions()
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
			{/* 筛选按钮 */}
			<View style={styles.filterContainer}>
				{[
					{ key: 'all', label: '全部' },
					{ key: 'recharge', label: '充值' },
					{ key: 'withdrawal', label: '提现' },
					{ key: 'bet', label: '投注' }
				].map((item) => (
					<Pressable
						key={item.key}
						style={[
							styles.filterButton,
							filter === item.key && styles.filterButtonActive
						]}
						onPress={() => setFilter(item.key as any)}
					>
						<Text
							style={[
								styles.filterButtonText,
								filter === item.key && styles.filterButtonTextActive
							]}
						>
							{item.label}
						</Text>
					</Pressable>
				))}
			</View>

			{/* 交易列表 */}
			<FlatList
				data={filteredTransactions}
				renderItem={renderTransaction}
				keyExtractor={(item) => item.id}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons name="receipt-outline" size={48} color="#666666" />
						<Text style={styles.emptyText}>暂无交易记录</Text>
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
	filterContainer: {
		flexDirection: 'row',
		padding: 16,
		gap: 8
	},
	filterButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e0e0e0'
	},
	filterButtonActive: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	filterButtonText: {
		fontSize: 14,
		color: '#666666'
	},
	filterButtonTextActive: {
		color: '#ffffff',
		fontWeight: 'bold'
	},
	listContainer: {
		paddingHorizontal: 16
	},
	transactionItem: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	transactionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	transactionInfo: {
		marginLeft: 12,
		flex: 1
	},
	transactionDescription: {
		fontSize: 16,
		color: '#333333',
		fontWeight: '500'
	},
	transactionDate: {
		fontSize: 12,
		color: '#666666',
		marginTop: 2
	},
	transactionRight: {
		alignItems: 'flex-end'
	},
	transactionAmount: {
		fontSize: 16,
		fontWeight: 'bold'
	},
	transactionStatus: {
		fontSize: 12,
		color: '#666666',
		marginTop: 2
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
	}
})
