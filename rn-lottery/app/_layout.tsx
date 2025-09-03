import React, { useState, useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'
import { RecoilRoot } from 'recoil'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import SplashScreen from '@/components/SplashScreen'
import IOSCompatibility from '@/components/IOSCompatibility'

function AuthWrapper({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// 模拟初始化过程
		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 2000)

		return () => clearTimeout(timer)
	}, [])

	if (isLoading) {
		return <SplashScreen message="初始化应用..." />
	}

	return <>{children}</>
}

export default function RootLayout() {
	return (
		<ErrorBoundary>
			<IOSCompatibility>
				<RecoilRoot>
					<AuthWrapper>
						<StatusBar
							style="light"
							backgroundColor={
								Platform.OS === 'android' ? '#1a1a1a' : undefined
							}
						/>
						<Stack
							screenOptions={{
								headerShown: false
							}}
						>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen
								name="(modal)"
								options={{
									presentation: 'modal',
									headerShown: false
								}}
							/>
							<Stack.Screen name="auth" options={{ headerShown: false }} />
						</Stack>
					</AuthWrapper>
				</RecoilRoot>
			</IOSCompatibility>
		</ErrorBoundary>
	)
}
