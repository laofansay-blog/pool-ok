import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Pressable
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { authAPI } from '@/lib/api'
import WinningNumbers from '@/components/WinningNumbers'
import BetNumbers from '@/components/BetNumbers'

// 中奖详情类型
interface WinningDetail {
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
	bet_type: string
	odds: number
	status: string
}

export default function WinningDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const [detail, setDetail] = useState<WinningDetail | null>(null)
	const [loading, setLoading] = useState(true)

	// 加载中奖详情
	const loadWinningDetail = async () => {
		if (!id) return

		try {
			const { user, error: userError } = await authAPI.getCurrentUser()
			if (userError || !user) {
				console.error('用户未登录:', userError)
				return
			}

			const { data, error } = await supabase
				.from('bets')
				.select(
					`
					*,
					rounds (
						round_number,
						winning_numbers,
						draw_time
					)
				`
				)
				.eq('id', id)
				.eq('user_id', user.id)
				.eq('is_winner', true)
				.single()

			if (error) {
				console.error('加载中奖详情失败:', error)
				return
			}

			if (data) {
				const winningDetail: WinningDetail = {
					id: data.id,
					round_number: data.rounds?.round_number || data.round_id,
					selected_numbers: data.selected_numbers,
					winning_numbers: data.rounds?.winning_numbers || [],
					bet_amount: data.bet_amount,
					actual_payout: data.actual_payout,
					profit: data.actual_payout - data.bet_amount,
					matched_numbers: data.matched_numbers || [],
					created_at: data.created_at,
					draw_time: data.rounds?.draw_time || data.created_at,
					bet_type: data.bet_type || '标准投注',
					odds: data.odds || 1,
					status: data.status
				}
				setDetail(winningDetail)
			}
		} catch (error) {
			console.error('加载中奖详情失败:', error)
		} finally {
			setLoading(false)
		}
	}

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

	// 获取中奖等级
	const getWinLevel = (matchedCount: number) => {
		switch (matchedCount) {
			case 6:
				return '一等奖'
			case 5:
				return '二等奖'
			case 4:
				return '三等奖'
			case 3:
				return '四等奖'
			case 2:
				return '五等奖'
			default:
				return '参与奖'
		}
	}

	useEffect(() => {
		loadWinningDetail()
	}, [id])

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

	if (!detail) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={48} color="#f44336" />
					<Text style={styles.errorText}>未找到中奖记录</Text>
					<Pressable style={styles.backButton} onPress={() => router.back()}>
						<Text style={styles.backButtonText}>返回</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* 头部 */}
			<View style={styles.header}>
				<Pressable
					onPress={() => router.back()}
					style={styles.headerBackButton}
				>
					<Ionicons name="arrow-back" size={24} color="#ffffff" />
				</Pressable>
				<Text style={styles.headerTitle}>中奖详情</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* 中奖信息卡片 */}
				<View style={styles.winningCard}>
					<View style={styles.winningHeader}>
						<Ionicons name="trophy" size={32} color="#ffc107" />
						<View style={styles.winningInfo}>
							<Text style={styles.winningTitle}>恭喜中奖！</Text>
							<Text style={styles.winningLevel}>
								{getWinLevel(detail.matched_numbers.length)}
							</Text>
						</View>
						<View style={styles.winningAmount}>
							<Text style={styles.winningAmountText}>
								{formatCurrency(detail.actual_payout)}
							</Text>
							<Text style={styles.profitText}>
								净赚 {formatCurrency(detail.profit)}
							</Text>
						</View>
					</View>
				</View>

				{/* 期号信息 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>期号信息</Text>
					<View style={styles.infoCard}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>期号:</Text>
							<Text style={styles.infoValue}>第{detail.round_number}期</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>开奖时间:</Text>
							<Text style={styles.infoValue}>
								{formatDate(detail.draw_time)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>投注时间:</Text>
							<Text style={styles.infoValue}>
								{formatDate(detail.created_at)}
							</Text>
						</View>
					</View>
				</View>

				{/* 号码信息 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>号码信息</Text>
					<View style={styles.numbersCard}>
						<View style={styles.numbersSection}>
							<Text style={styles.numbersLabel}>我的号码:</Text>
							<BetNumbers
								selectedNumbers={detail.selected_numbers}
								size="medium"
								winningNumbers={detail.winning_numbers}
								style={styles.numbersContainer}
							/>
						</View>
						<View style={styles.numbersSection}>
							<Text style={styles.numbersLabel}>开奖号码:</Text>
							<WinningNumbers
								numbers={detail.winning_numbers}
								size="medium"
								showPosition={true}
								style={styles.numbersContainer}
							/>
						</View>
						<View style={styles.matchedSection}>
							<Text style={styles.matchedLabel}>
								匹配号码: {detail.matched_numbers.length}个
							</Text>
							<View style={styles.matchedNumbers}>
								{detail.matched_numbers.map((num, index) => (
									<View key={index} style={styles.matchedNumber}>
										<Text style={styles.matchedNumberText}>{num}</Text>
									</View>
								))}
							</View>
						</View>
					</View>
				</View>

				{/* 投注详情 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>投注详情</Text>
					<View style={styles.infoCard}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>投注类型:</Text>
							<Text style={styles.infoValue}>{detail.bet_type}</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>投注金额:</Text>
							<Text style={styles.infoValue}>
								{formatCurrency(detail.bet_amount)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>赔率:</Text>
							<Text style={styles.infoValue}>{detail.odds}倍</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>中奖金额:</Text>
							<Text style={[styles.infoValue, styles.winningText]}>
								{formatCurrency(detail.actual_payout)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>净盈利:</Text>
							<Text style={[styles.infoValue, styles.profitText]}>
								{formatCurrency(detail.profit)}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>状态:</Text>
							<Text style={[styles.infoValue, styles.statusText]}>
								{detail.status === 'settled' ? '已结算' : '待结算'}
							</Text>
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
		alignItems: 'center',
		padding: 32
	},
	errorText: {
		fontSize: 16,
		color: '#666666',
		marginTop: 16,
		marginBottom: 24
	},
	backButton: {
		backgroundColor: '#e74c3c',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8
	},
	backButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold'
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#e74c3c',
		paddingHorizontal: 16,
		paddingVertical: 12,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4
	},
	headerBackButton: {
		padding: 8
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	placeholder: {
		width: 40
	},
	content: {
		flex: 1,
		padding: 16
	},
	winningCard: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderLeftWidth: 4,
		borderLeftColor: '#ffc107'
	},
	winningHeader: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	winningInfo: {
		flex: 1,
		marginLeft: 16
	},
	winningTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333333'
	},
	winningLevel: {
		fontSize: 14,
		color: '#ffc107',
		marginTop: 4
	},
	winningAmount: {
		alignItems: 'flex-end'
	},
	winningAmountText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#4caf50'
	},
	profitText: {
		fontSize: 12,
		color: '#4caf50',
		marginTop: 4
	},
	section: {
		marginBottom: 16
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 12
	},
	infoCard: {
		backgroundColor: '#ffffff',
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0'
	},
	infoLabel: {
		fontSize: 14,
		color: '#666666'
	},
	infoValue: {
		fontSize: 14,
		color: '#333333',
		fontWeight: '500'
	},
	numbersCard: {
		backgroundColor: '#ffffff',
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	numbersSection: {
		marginBottom: 16
	},
	numbersLabel: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 8
	},
	numbersContainer: {
		marginLeft: 0
	},
	matchedSection: {
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
		paddingTop: 16
	},
	matchedLabel: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 8
	},
	matchedNumbers: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	matchedNumber: {
		backgroundColor: '#4caf50',
		borderRadius: 16,
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center'
	},
	matchedNumberText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold'
	},
	winningText: {
		color: '#4caf50',
		fontWeight: 'bold'
	},
	statusText: {
		color: '#4caf50'
	}
})
