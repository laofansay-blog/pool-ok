import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { authAPI } from '@/lib/api'

// 统计信息类型
interface UserStats {
	userInfo: {
		id: string
		username: string
		email: string
		balance: number
		total_deposited: number
		total_withdrawn: number
		total_bet: number
		total_won: number
		created_at: string
		last_login_at: string
	}
	stats: {
		totalBets: number
		winningBets: number
		winRate: number
		profitLoss: number
	}
	recentBets: any[]
}

export default function StatsScreen() {
	const [stats, setStats] = useState<UserStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	// 加载统计信息
	const loadStats = async () => {
		try {
			const { user, error: userError } = await authAPI.getCurrentUser()
			if (userError || !user) {
				console.error('用户未登录:', userError)
				return
			}

			const { data, error } = await supabase.functions.invoke('get-history', {
				body: { type: 'user_stats', userId: user.id }
			})

			if (error) {
				console.error('加载统计信息失败:', error)
				return
			}

			console.log('统计数据:', data)
			setStats(data)
		} catch (error) {
			console.error('加载统计信息失败:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// 下拉刷新
	const onRefresh = () => {
		setRefreshing(true)
		loadStats()
	}

	// 格式化货币
	const formatCurrency = (amount: number) => {
		return `¥${amount.toFixed(2)}`
	}

	// 格式化日期
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
	}

	useEffect(() => {
		loadStats()
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

	if (!stats) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={48} color="#666666" />
					<Text style={styles.errorText}>加载统计信息失败</Text>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* 用户基本信息 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>账户信息</Text>
					<View style={styles.infoCard}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>用户名</Text>
							<Text style={styles.infoValue}>{stats.userInfo.username}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>当前余额</Text>
							<Text style={[styles.infoValue, styles.balanceText]}>
								{formatCurrency(stats.userInfo.balance)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>注册时间</Text>
							<Text style={styles.infoValue}>
								{formatDate(stats.userInfo.created_at)}
							</Text>
						</View>
					</View>
				</View>

				{/* 投注统计 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>投注统计</Text>
					<View style={styles.statsGrid}>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>{stats.stats.totalBets}</Text>
							<Text style={styles.statLabel}>总投注次数</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>{stats.stats.winningBets}</Text>
							<Text style={styles.statLabel}>中奖次数</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{stats.stats.winRate.toFixed(2)}%
							</Text>
							<Text style={styles.statLabel}>中奖率</Text>
						</View>
						<View style={styles.statCard}>
							<Text
								style={[
									styles.statValue,
									stats.stats.profitLoss >= 0
										? styles.positiveValue
										: styles.negativeValue
								]}
							>
								{formatCurrency(stats.stats.profitLoss)}
							</Text>
							<Text style={styles.statLabel}>盈亏</Text>
						</View>
					</View>
				</View>

				{/* 资金统计 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>资金统计</Text>
					<View style={styles.statsGrid}>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{formatCurrency(stats.userInfo.total_deposited)}
							</Text>
							<Text style={styles.statLabel}>总充值</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{formatCurrency(stats.userInfo.total_bet)}
							</Text>
							<Text style={styles.statLabel}>总投注</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{formatCurrency(stats.userInfo.total_won)}
							</Text>
							<Text style={styles.statLabel}>总中奖</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{formatCurrency(stats.userInfo.total_withdrawn)}
							</Text>
							<Text style={styles.statLabel}>总提现</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	scrollView: {
		flex: 1
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
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	errorText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666666'
	},
	section: {
		margin: 16,
		marginBottom: 0
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 12
	},
	infoCard: {
		backgroundColor: '#ffffff',
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
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8
	},
	infoLabel: {
		fontSize: 16,
		color: '#666666'
	},
	infoValue: {
		fontSize: 16,
		color: '#333333',
		fontWeight: '500'
	},
	balanceText: {
		color: '#e74c3c',
		fontWeight: 'bold'
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12
	},
	statCard: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
		width: '47%',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3
	},
	statValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 4
	},
	statLabel: {
		fontSize: 14,
		color: '#666666',
		textAlign: 'center'
	},
	positiveValue: {
		color: '#4caf50'
	},
	negativeValue: {
		color: '#f44336'
	}
})
