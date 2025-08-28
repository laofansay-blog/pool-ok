import React, { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { RecoilRoot, useRecoilValue } from 'recoil'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { isAuthenticatedState, authLoadingState } from '../store/atoms'
import { useAuth } from '../hooks/useAuth'

function AuthWrapper({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useRecoilValue(isAuthenticatedState)
	const authLoading = useRecoilValue(authLoadingState)
	const { checkAuthStatus } = useAuth()

	useEffect(() => {
		checkAuthStatus()
	}, [])

	if (authLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#ffffff" />
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		)
	}

	return <>{children}</>
}

export default function RootLayout() {
	return (
		<RecoilRoot>
			<AuthWrapper>
				<StatusBar style="light" backgroundColor="#1a1a1a" />
				<Stack
					screenOptions={{
						headerStyle: {
							backgroundColor: '#1a1a1a'
						},
						headerTintColor: '#d4af37',
						headerTitleStyle: {
							fontWeight: '600'
						},
						headerShadowVisible: false
					}}
				>
					<Stack.Screen
						name="index"
						options={{
							title: '中世纪彩票',
							headerShown: false
						}}
					/>
					<Stack.Screen
						name="auth"
						options={{
							title: '登录注册',
							headerShown: false
						}}
					/>
					<Stack.Screen
						name="history"
						options={{
							title: '历史记录',
							presentation: 'modal'
						}}
					/>
				</Stack>
			</AuthWrapper>
		</RecoilRoot>
	)
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1a1a1a'
	},
	loadingText: {
		color: '#d4af37',
		fontSize: 16,
		marginTop: 16
	}
})
