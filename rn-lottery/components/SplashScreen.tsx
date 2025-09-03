import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SplashScreenProps {
	message?: string
}

export default function SplashScreen({
	message = '加载中...'
}: SplashScreenProps) {
	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Ionicons name="dice" size={64} color="#d4af37" />
				<Text style={styles.title}>PK10</Text>
				<Text style={styles.subtitle}>彩票应用</Text>
				<ActivityIndicator size="large" color="#d4af37" style={styles.loader} />
				<Text style={styles.message}>{message}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a1a',
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		alignItems: 'center'
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#d4af37',
		marginTop: 16,
		marginBottom: 4
	},
	subtitle: {
		fontSize: 16,
		color: '#cccccc',
		marginBottom: 32
	},
	loader: {
		marginBottom: 16
	},
	message: {
		fontSize: 14,
		color: '#999999',
		textAlign: 'center'
	}
})
