import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	Alert,
	RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../lib/api'
import { supabase } from '../lib/supabase'

interface UserProfile {
	id: string
	email: string
	username: string
	balance: number
	created_at: string
}

export default function ProfileScreen() {
	const [user, setUser] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	// 加载用户信息
	const loadUserProfile = async () => {
		try {
			const { user: authUser } = await authAPI.getCurrentUser()
			if (authUser) {
				// 获取用户详细信息
				const { data: profile, error } = await supabase
					.from('users')
					.select('*')
					.eq('id', authUser.id)
					.single()

				if (profile) {
					setUser({
						id: profile.id,
						email: authUser.email || '',
						username: profile.username || authUser.user_metadata?.username || '用户',
						balance: profile.balance || 0,
						created_at: profile.created_at
					})
				} else {
					// 如果没有profile，使用auth用户信息
					setUser({
						id: authUser.id,
						email: authUser.email || '',
						username: authUser.user_metadata?.username || '用户',
						balance: 0,
						created_at: authUser.created_at || ''
					})
				}
			}
		} catch (error) {
			console.error('加载用户信息失败:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// 下拉刷新
	const onRefresh = () => {
		setRefreshing(true)
		loadUserProfile()
	}

	// 登出
	const handleLogout = async () => {
		Alert.alert('确认登出', '您确定要退出登录吗？', [
			{ text: '取消', style: 'cancel' },
			{
				text: '确定',
				style: 'destructive',
				onPress: async () => {
					try {
						await authAPI.signOut()
						router.replace('/auth')
					} catch (error) {
						Alert.alert('登出失败', '请重试')
					}
				}
			}
		])
	}

	// 跳转到登录页
	const goToLogin = () => {
		router.push('/auth')
	}

	useEffect(() => {
		loadUserProfile()
	}, [])

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>加载中...</Text>
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
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>我的账户</Text>
				</View>

				{user ? (
					<>
						{/* 用户信息卡片 */}
						<View style={styles.userCard}>
							<View style={styles.avatar}>
								<Ionicons name="person" size={40} color="#d4af37" />
							</View>
							<View style={styles.userInfo}>
								<Text style={styles.username}>{user.username}</Text>
								<Text style={styles.email}>{user.email}</Text>
							</View>
						</View>

						{/* 余额卡片 */}
						<View style={styles.balanceCard}>
							<Text style={styles.balanceLabel}>账户余额</Text>
							<Text style={styles.balanceAmount}>¥{user.balance.toFixed(2)}</Text>
							<Pressable style={styles.rechargeButton}>
								<Text style={styles.rechargeButtonText}>充值</Text>
							</Pressable>
						</View>

						{/* 菜单项 */}
						<View style={styles.menuSection}>
							<Pressable style={styles.menuItem} onPress={() => router.push('/history')}>
								<Ionicons name="time" size={24} color="#d4af37" />
								<Text style={styles.menuText}>投注历史</Text>
								<Ionicons name="chevron-forward" size={20} color="#666666" />
							</Pressable>

							<Pressable style={styles.menuItem}>
								<Ionicons name="wallet" size={24} color="#d4af37" />
								<Text style={styles.menuText}>交易记录</Text>
								<Ionicons name="chevron-forward" size={20} color="#666666" />
							</Pressable>

							<Pressable style={styles.menuItem}>
								<Ionicons name="settings" size={24} color="#d4af37" />
								<Text style={styles.menuText}>设置</Text>
								<Ionicons name="chevron-forward" size={20} color="#666666" />
							</Pressable>

							<Pressable style={styles.menuItem}>
								<Ionicons name="help-circle" size={24} color="#d4af37" />
								<Text style={styles.menuText}>帮助中心</Text>
								<Ionicons name="chevron-forward" size={20} color="#666666" />
							</Pressable>
						</View>

						{/* 登出按钮 */}
						<Pressable style={styles.logoutButton} onPress={handleLogout}>
							<Text style={styles.logoutButtonText}>退出登录</Text>
						</Pressable>
					</>
				) : (
					/* 未登录状态 */
					<View style={styles.notLoggedIn}>
						<Ionicons name="person-circle" size={80} color="#666666" />
						<Text style={styles.notLoggedInText}>您还未登录</Text>
						<Text style={styles.notLoggedInSubtext}>登录后可查看个人信息和投注记录</Text>
						<Pressable style={styles.loginButton} onPress={goToLogin}>
							<Text style={styles.loginButtonText}>立即登录</Text>
						</Pressable>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000'
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
		color: '#ffffff',
		fontSize: 16
	},
	header: {
		padding: 20,
		alignItems: 'center'
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	userCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1a1a1a',
		margin: 20,
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333333'
	},
	avatar: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: '#333333',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16
	},
	userInfo: {
		flex: 1
	},
	username: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 4
	},
	email: {
		fontSize: 14,
		color: '#888888'
	},
	balanceCard: {
		backgroundColor: '#1a1a1a',
		margin: 20,
		marginTop: 0,
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center'
	},
	balanceLabel: {
		fontSize: 14,
		color: '#888888',
		marginBottom: 8
	},
	balanceAmount: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#d4af37',
		marginBottom: 16
	},
	rechargeButton: {
		backgroundColor: '#d4af37',
		paddingHorizontal: 24,
		paddingVertical: 8,
		borderRadius: 20
	},
	rechargeButtonText: {
		color: '#000000',
		fontSize: 14,
		fontWeight: 'bold'
	},
	menuSection: {
		backgroundColor: '#1a1a1a',
		margin: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333333'
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333333'
	},
	menuText: {
		flex: 1,
		fontSize: 16,
		color: '#ffffff',
		marginLeft: 12
	},
	logoutButton: {
		backgroundColor: '#ff4444',
		margin: 20,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center'
	},
	logoutButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: 'bold'
	},
	notLoggedIn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 40
	},
	notLoggedInText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#ffffff',
		marginTop: 16,
		marginBottom: 8
	},
	notLoggedInSubtext: {
		fontSize: 14,
		color: '#888888',
		textAlign: 'center',
		marginBottom: 24
	},
	loginButton: {
		backgroundColor: '#d4af37',
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 8
	},
	loginButtonText: {
		color: '#000000',
		fontSize: 16,
		fontWeight: 'bold'
	}
})
