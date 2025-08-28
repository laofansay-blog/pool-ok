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
				// 直接检查会话，不使用复杂的异步逻辑
				const {
					data: { session }
				} = await supabase.auth.getSession()

				if (session?.user) {
					// 有会话，用户已登录
					const basicUser = {
						id: session.user.id,
						email: session.user.email,
						username:
							session.user.user_metadata?.username || session.user.email,
						balance: 1000,
						created_at: session.user.created_at,
						updated_at: session.user.updated_at
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
					email: session.user.email,
					username: session.user.user_metadata?.username || session.user.email,
					balance: 1000,
					created_at: session.user.created_at,
					updated_at: session.user.updated_at
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

	// 检查当前认证状态
	const checkAuthStatus = async () => {
		try {
			setAuthLoading(true)

			// 简化的会话检查
			const {
				data: { session },
				error: sessionError
			} = await supabase.auth.getSession()

			if (sessionError || !session) {
				// 没有会话或有错误，用户未登录
				setIsAuthenticated(false)
				setUser(null)
				setAuthLoading(false)
				return
			}

			// 有会话，直接使用会话中的用户信息
			const authUser = session.user

			// 创建基本用户对象
			const basicUser = {
				id: authUser.id,
				email: authUser.email,
				username: authUser.user_metadata?.username || authUser.email,
				balance: 1000,
				created_at: authUser.created_at,
				updated_at: authUser.updated_at
			}

			setUser(basicUser)
			setBalance(1000)
			setIsAuthenticated(true)
			setAuthLoading(false)
		} catch (error) {
			console.error('Check auth status exception:', error)
			setIsAuthenticated(false)
			setUser(null)
			setAuthLoading(false)
		}
	}

	// 处理用户登录
	const handleUserSignedIn = async (authUser: any) => {
		try {
			console.log('Handling user sign in for:', authUser.id)

			// 先设置基本认证状态
			setIsAuthenticated(true)

			// 创建基本用户对象
			const basicUser = {
				id: authUser.id,
				email: authUser.email,
				username: authUser.user_metadata?.username || authUser.email,
				balance: 1000, // 默认余额
				created_at: authUser.created_at,
				updated_at: authUser.updated_at
			}
			setUser(basicUser)
			setBalance(1000)

			// 尝试获取用户详细信息（非阻塞）
			try {
				const { data: userProfile, error } = await authAPI.getUserProfile(
					authUser.id
				)

				if (!error && userProfile) {
					console.log('User profile loaded successfully')
					setUser(userProfile)
					setBalance(userProfile.balance)
				} else {
					console.log('Using basic user profile')
				}
			} catch (profileError) {
				console.log('Profile fetch failed, using basic user:', profileError)
			}
		} catch (error) {
			console.error('Handle user signed in error:', error)
			// 即使出错，也设置基本认证状态
			setIsAuthenticated(true)
		}
	}

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
			return { success: false, error: error.message }
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
			return { success: false, error: error.message }
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
			return { success: false, error: error.message }
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
		requireAuth,
		checkAuthStatus
	}
}
