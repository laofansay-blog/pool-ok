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
import { supabase } from '../lib/supabase'
import { authAPI } from '../lib/api'

// 充值记录类型
interface RechargeRecord {
	id: string
	amount: number
	payment_method: string
	payment_id: string
	status: 'pending' | 'processing' | 'completed' | 'failed'
	created_at: string
	completed_at?: string
	failure_reason?: string
}

export default function RechargeHistoryScreen() {
	const [recharges, setRecharges] = useState<RechargeRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')

	// 加载充值记录
	const loadRecharges = async () => {
		try {
			const user = await authAPI.getCurrentUser()
			if (!user) {
				console.error('用户未登录')
				return
			}

			const { data, error } = await supabase
				.from('recharges')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })

			if (error) {
				console.error('加载充值记录失败:', error)
				return
			}

			setRecharges(data || [])
		} catch (error) {
			console.error('加载充值记录失败:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// 下拉刷新
	const onRefresh = () => {
		setRefreshing(true)
		loadRecharges()
	}

	// 过滤充值记录
	const filteredRecharges = recharges.filter(recharge => {
		if (filter === 'all') return true
		return recharge.status === filter
	})

	// 格式化货币
	const formatCurrency = (amount: number) => {
		return `¥${amount.toFixed(2)}`
	}

	// 格式化日期
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
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
			default:
				return status
		}
	}

	// 获取状态颜色
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return '#ffc107'
			case 'processing':
				return '#2196f3'
			case 'completed':
				return '#4caf50'
			case 'failed':
				return '#f44336'
			default:
				return '#666666'
		}
	}

	// 获取支付方式文本
	const getPaymentMethodText = (method: string) => {
		switch (method) {
			case 'alipay':
				return '支付宝'
			case 'wechat':
				return '微信支付'
			case 'bank':
				return '银行卡'
			case 'usdt':
				return 'USDT'
			default:
				return method
		}
	}

	// 渲染充值记录项
	const renderRecharge = ({ item }: { item: RechargeRecord }) => (
		<View style={styles.rechargeItem}>
			<View style={styles.rechargeHeader}>
				<View style={styles.rechargeLeft}>
					<Ionicons name="add-circle" size={24} color="#4caf50" />
					<View style={styles.rechargeInfo}>
						<Text style={styles.rechargeAmount}>
							{formatCurrency(item.amount)}
						</Text>
						<Text style={styles.paymentMethod}>
							{getPaymentMethodText(item.payment_method)}
						</Text>
					</View>
				</View>
				<View style={styles.rechargeRight}>
					<View style={[
						styles.statusBadge,
						{ backgroundColor: getStatusColor(item.status) }
					]}>
						<Text style={styles.statusText}>
							{getStatusText(item.status)}
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.rechargeDetails}>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>订单号:</Text>
					<Text style={styles.detailValue}>{item.payment_id}</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>创建时间:</Text>
					<Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
				</View>
				{item.completed_at && (
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>完成时间:</Text>
						<Text style={styles.detailValue}>{formatDate(item.completed_at)}</Text>
					</View>
				)}
				{item.failure_reason && (
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>失败原因:</Text>
						<Text style={[styles.detailValue, styles.errorText]}>
							{item.failure_reason}
						</Text>
					</View>
				)}
			</View>
		</View>
	)

	useEffect(() => {
		loadRecharges()
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
					{ key: 'pending', label: '待处理' },
					{ key: 'completed', label: '已完成' },
					{ key: 'failed', label: '失败' }
				].map(item => (
					<Pressable
						key={item.key}
						style={[
							styles.filterButton,
							filter === item.key && styles.filterButtonActive
						]}
						onPress={() => setFilter(item.key as any)}
					>
						<Text style={[
							styles.filterButtonText,
							filter === item.key && styles.filterButtonTextActive
						]}>
							{item.label}
						</Text>
					</Pressable>
				))}
			</View>

			{/* 充值记录列表 */}
			<FlatList
				data={filteredRecharges}
				renderItem={renderRecharge}
				keyExtractor={item => item.id}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons name="card-outline" size={48} color="#666666" />
						<Text style={styles.emptyText}>暂无充值记录</Text>
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
	rechargeItem: {
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
	rechargeHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12
	},
	rechargeLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	rechargeInfo: {
		marginLeft: 12
	},
	rechargeAmount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#4caf50'
	},
	paymentMethod: {
		fontSize: 14,
		color: '#666666',
		marginTop: 2
	},
	rechargeRight: {
		alignItems: 'flex-end'
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12
	},
	statusText: {
		fontSize: 12,
		color: '#ffffff',
		fontWeight: 'bold'
	},
	rechargeDetails: {
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
		flex: 1,
		textAlign: 'right'
	},
	errorText: {
		color: '#f44336'
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
