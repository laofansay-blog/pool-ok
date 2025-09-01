import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { RecoilRoot } from 'recoil'

function AuthWrapper({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}

export default function RootLayout() {
	return (
		<RecoilRoot>
			<AuthWrapper>
				<StatusBar style="light" backgroundColor="#1a1a1a" />
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
	)
}
