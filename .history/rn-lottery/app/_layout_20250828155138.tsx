import React, { useEffect } from 'react'
import { Tabs, Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { RecoilRoot, useRecoilValue } from 'recoil'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { isAuthenticatedState, authLoadingState } from '../store/atoms'
import { useAuth } from '../hooks/useAuth'
import { Ionicons } from '@expo/vector-icons'

function AuthWrapper({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}

export default function RootLayout() {
	return (
		<RecoilRoot>
			<AuthWrapper>
				<StatusBar style="light" backgroundColor="#1a1a1a" />
				<Tabs
					screenOptions={{
						tabBarActiveTintColor: '#d4af37',
						tabBarInactiveTintColor: '#666666',
						tabBarStyle: {
							backgroundColor: '#1a1a1a',
							borderTopColor: '#333333',
							borderTopWidth: 1,
							height: 60,
							paddingBottom: 8,
							paddingTop: 8
						},
						tabBarLabelStyle: {
							fontSize: 12,
							fontWeight: '500'
						},
						headerShown: false
					}}
				>
					<Tabs.Screen
						name="index"
						options={{
							title: '投注',
							tabBarIcon: ({ color, size }) => (
								<Ionicons name="dice" size={size} color={color} />
							)
						}}
					/>
					<Tabs.Screen
						name="history"
						options={{
							title: '历史',
							tabBarIcon: ({ color, size }) => (
								<Ionicons name="time" size={size} color={color} />
							)
						}}
					/>
					<Tabs.Screen
						name="profile"
						options={{
							title: '我的',
							tabBarIcon: ({ color, size }) => (
								<Ionicons name="person" size={size} color={color} />
							)
						}}
					/>
					<Tabs.Screen
						name="auth"
						options={{
							href: null // 隐藏登录页面，不在tab中显示
						}}
					/>
				</Tabs>
			</AuthWrapper>
		</RecoilRoot>
	)
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000000'
	},
	loadingText: {
		color: '#ffffff',
		fontSize: 16,
		marginTop: 16
	}
})
