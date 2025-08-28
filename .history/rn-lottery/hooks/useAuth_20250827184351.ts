import { useEffect } from 'react'
import { useRecoilState, useSetRecoilState } from 'recoil'
import { router } from 'expo-router'
import {
	userState,
	isAuthenticatedState,
	authLoadingState,
	balanceState
} from '../store/atoms'
import { authAPI, gameAPI } from '../lib/api'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
	const [user, setUser] = useRecoilState(userState)
	const [isAuthenticated, setIsAuthenticated] =
		useRecoilState(isAuthenticatedState)
	const [authLoading, setAuthLoading] = useRecoilState(authLoadingState)
	const setBalance = useSetRecoilState(balanceState)

	// 初始化认证状态
	useEffect(() => {
		let mounted = true

		const initAuth = async () => {
			if (!mounted) return

			try {
				setAuthLoading(true)

				// 直接检查会话，不使用复杂的异步逻辑
				const {
					data: { session }
				} = await supabase.auth.getSession()

				if (!mounted) return

				if (session?.user) {
					// 有会话，用户已登录
					const basicUser = {
						id: session.user.id,
						email: session.user.email || '',
						username:
							session.user.user_metadata?.username || session.user.email || '',
						balance: 1000,
						created_at: session.user.created_at,
						updated_at: session.user.updated_at || ''
					}
					setUser(basicUser)
					setBalance(1000)
					setIsAuthenticated(true)
				} else {
					// 没有会话，用户未登录
					setIsAuthenticated(false)
					setUser(null)
				}
			} catch (error) {
				console.error('Init auth error:', error)
				setIsAuthenticated(false)
				setUser(null)
			} finally {
				if (mounted) {
					setAuthLoading(false)
				}
			}
		}

		initAuth()

		// 监听认证状态变化
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!mounted) return

			if (event === 'SIGNED_IN' && session?.user) {
				const basicUser = {
					id: session.user.id,
					email: session.user.email || '',
					username:
						session.user.user_metadata?.username || session.user.email || '',
					balance: 1000,
					created_at: session.user.created_at,
					updated_at: session.user.updated_at || ''
				}
				setUser(basicUser)
				setBalance(1000)
				setIsAuthenticated(true)
			} else if (event === 'SIGNED_OUT') {
				setUser(null)
				setIsAuthenticated(false)
				setBalance(0)
			}
		})

		return () => {
			mounted = false
			subscription.unsubscribe()
		}
	}, [])

	// 处理用户登出
	const handleUserSignedOut = () => {
		setUser(null)
		setIsAuthenticated(false)
		setBalance(0)
	}

	// 登录
	const signIn = async (email: string, password: string) => {
		try {
			const { data, error } = await authAPI.signIn(email, password)

			if (error) {
				throw new Error(error.message)
			}

			return { success: true, data }
		} catch (error) {
			console.error('Sign in error:', error)
			return {
				success: false,
				error: (error as Error).message || 'Sign in failed'
			}
		}
	}

	// 注册
	const signUp = async (email: string, password: string, username: string) => {
		try {
			const { data, error } = await authAPI.signUp(email, password, username)

			if (error) {
				throw new Error(error.message)
			}

			return { success: true, data }
		} catch (error) {
			console.error('Sign up error:', error)
			return {
				success: false,
				error: (error as Error).message || 'Sign up failed'
			}
		}
	}

	// 登出
	const signOut = async () => {
		try {
			const { error } = await authAPI.signOut()

			if (error) {
				throw new Error(error.message)
			}

			// 导航到认证页面
			router.replace('/auth')

			return { success: true }
		} catch (error) {
			console.error('Sign out error:', error)
			return {
				success: false,
				error: (error as Error).message || 'Sign out failed'
			}
		}
	}

	// 更新用户余额
	const updateBalance = async () => {
		if (!user) return

		try {
			const { data: balance, error } = await gameAPI.getUserBalance(user.id)

			if (error) {
				console.error('Update balance error:', error)
				return
			}

			setBalance(balance)
		} catch (error) {
			console.error('Update balance exception:', error)
		}
	}

	// 检查是否需要认证
	const requireAuth = () => {
		if (!isAuthenticated) {
			router.replace('/auth')
			return false
		}
		return true
	}

	return {
		user,
		isAuthenticated,
		authLoading,
		signIn,
		signUp,
		signOut,
		updateBalance,
		requireAuth
	}
}
