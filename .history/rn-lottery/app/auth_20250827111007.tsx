import React, { useState } from 'react'
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { authAPI } from '../lib/api'

export default function AuthScreen() {
	const [isLogin, setIsLogin] = useState(true)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [username, setUsername] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const handleAuth = async () => {
		if (loading) return

		// 基本验证
		if (!email || !password) {
			Alert.alert('错误', '请填写完整信息')
			return
		}

		if (!isLogin) {
			if (!username) {
				Alert.alert('错误', '请输入用户名')
				return
			}
			if (password !== confirmPassword) {
				Alert.alert('错误', '两次输入的密码不一致')
				return
			}
			if (password.length < 6) {
				Alert.alert('错误', '密码长度至少6位')
				return
			}
		}

		setLoading(true)

		try {
			if (isLogin) {
				// 登录
				const { data, error } = await authAPI.signIn(email, password)
				if (error) {
					Alert.alert('登录失败', error.message)
				} else {
					Alert.alert('登录成功', '欢迎回来！', [
						{ text: '确定', onPress: () => router.replace('/') }
					])
				}
			} else {
				// 注册
				const { data, error } = await authAPI.signUp(email, password, username)
				if (error) {
					Alert.alert('注册失败', error.message)
				} else {
					Alert.alert('注册成功', '请检查邮箱验证链接', [
						{ text: '确定', onPress: () => setIsLogin(true) }
					])
				}
			}
		} catch (error) {
			Alert.alert('错误', '网络连接失败，请重试')
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setEmail('')
		setPassword('')
		setUsername('')
		setConfirmPassword('')
	}

	const switchMode = () => {
		setIsLogin(!isLogin)
		resetForm()
	}

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Lottery</Text>
						<Text style={styles.subtitle}>
							{isLogin ? 'Welcome back' : 'Create your account'}
						</Text>
					</View>

					{/* Form */}
					<View style={styles.form}>
						<View style={styles.tabs}>
							<Pressable
								style={[styles.tab, isLogin && styles.activeTab]}
								onPress={() => setIsLogin(true)}
							>
								<Text style={[styles.tabText, isLogin && styles.activeTabText]}>
									Login
								</Text>
							</Pressable>
							<Pressable
								style={[styles.tab, !isLogin && styles.activeTab]}
								onPress={() => setIsLogin(false)}
							>
								<Text
									style={[styles.tabText, !isLogin && styles.activeTabText]}
								>
									Sign Up
								</Text>
							</Pressable>
						</View>

						<View style={styles.inputContainer}>
							{!isLogin && (
								<TextInput
									style={styles.input}
									placeholder="Username"
									value={username}
									onChangeText={setUsername}
									autoCapitalize="none"
								/>
							)}

							<TextInput
								style={styles.input}
								placeholder="Email"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
							/>

							<TextInput
								style={styles.input}
								placeholder="Password"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
							/>

							{!isLogin && (
								<TextInput
									style={styles.input}
									placeholder="Confirm Password"
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									secureTextEntry
								/>
							)}
						</View>

						<Pressable
							style={[styles.authButton, loading && styles.disabledButton]}
							onPress={handleAuth}
							disabled={loading}
						>
							<Text style={styles.authButtonText}>
								{loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
							</Text>
						</Pressable>

						<Pressable style={styles.switchButton} onPress={switchMode}>
							<Text style={styles.switchText}>
								{isLogin
									? "Don't have an account? Sign up"
									: 'Already have an account? Login'}
							</Text>
						</Pressable>
					</View>

					{/* Footer */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>🎮 仅供娱乐，请理性游戏</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a1a'
	},
	keyboardView: {
		flex: 1
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 20
	},
	header: {
		alignItems: 'center',
		marginBottom: 40
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#d4af37',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 16,
		color: '#888',
		textAlign: 'center'
	},
	form: {
		backgroundColor: '#2a2a2a',
		borderRadius: 16,
		padding: 24,
		marginBottom: 20
	},
	tabs: {
		flexDirection: 'row',
		marginBottom: 24,
		backgroundColor: '#1a1a1a',
		borderRadius: 8,
		padding: 4
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 6
	},
	activeTab: {
		backgroundColor: '#d4af37'
	},
	tabText: {
		fontSize: 16,
		color: '#888',
		fontWeight: '500'
	},
	activeTabText: {
		color: '#1a1a1a'
	},
	inputContainer: {
		gap: 16,
		marginBottom: 24
	},
	input: {
		backgroundColor: '#1a1a1a',
		borderRadius: 8,
		padding: 16,
		fontSize: 16,
		color: '#fff',
		borderWidth: 1,
		borderColor: '#444'
	},
	authButton: {
		backgroundColor: '#d4af37',
		borderRadius: 8,
		padding: 16,
		alignItems: 'center',
		marginBottom: 16
	},
	disabledButton: {
		opacity: 0.6
	},
	authButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1a1a1a'
	},
	switchButton: {
		alignItems: 'center'
	},
	switchText: {
		fontSize: 14,
		color: '#d4af37'
	},
	footer: {
		alignItems: 'center'
	},
	footerText: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center'
	}
})
