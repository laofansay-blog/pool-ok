import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
	return (
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
		</Tabs>
	)
}
