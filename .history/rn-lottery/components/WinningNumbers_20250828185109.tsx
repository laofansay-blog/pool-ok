import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// 开奖数字颜色配置（与首页和Web项目保持一致）
const numberColors = [
	{ bg: '#4A4A4A', text: '#FFFFFF' }, // 深灰色 - 第1位
	{ bg: '#DC143C', text: '#FFFFFF' }, // 红色 - 第2位
	{ bg: '#FF8C00', text: '#FFFFFF' }, // 橙色 - 第3位
	{ bg: '#1E90FF', text: '#FFFFFF' }, // 蓝色 - 第4位
	{ bg: '#32CD32', text: '#FFFFFF' }, // 绿色 - 第5位
	{ bg: '#8A2BE2', text: '#FFFFFF' }, // 紫色 - 第6位
	{ bg: '#C0C0C0', text: '#000000' }, // 浅灰色 - 第7位
	{ bg: '#FFD700', text: '#000000' }, // 黄色 - 第8位
	{ bg: '#00CED1', text: '#FFFFFF' }, // 青色 - 第9位
	{ bg: '#8B0000', text: '#FFFFFF' } // 深红色 - 第10位
]

// 获取位置对应的颜色
const getPositionColor = (position: number) => {
	if (position < 0 || position >= 10) {
		return { bg: '#CCCCCC', text: '#333333' }
	}
	return numberColors[position]
}

interface WinningNumbersProps {
	numbers: number[]
	size?: 'small' | 'medium' | 'large'
	showPosition?: boolean
	highlightNumbers?: number[] // 用于高亮匹配的号码
	style?: any
}

const WinningNumbers: React.FC<WinningNumbersProps> = ({
	numbers,
	size = 'medium',
	showPosition = true,
	highlightNumbers = [],
	style
}) => {
	if (!Array.isArray(numbers) || numbers.length === 0) {
		return (
			<View style={[styles.container, style]}>
				<Text style={styles.emptyText}>暂无开奖号码</Text>
			</View>
		)
	}

	const getSizeStyle = () => {
		switch (size) {
			case 'small':
				return {
					width: 24,
					height: 24,
					borderRadius: 12,
					fontSize: 10
				}
			case 'large':
				return {
					width: 40,
					height: 40,
					borderRadius: 20,
					fontSize: 16
				}
			default: // medium
				return {
					width: 32,
					height: 32,
					borderRadius: 16,
					fontSize: 12
				}
		}
	}

	const sizeStyle = getSizeStyle()

	return (
		<View style={styles.container}>
			{numbers.map((number, index) => (
				<View key={index} style={[styles.numberBall, sizeStyle]}>
					<Text style={[styles.numberText, { fontSize: sizeStyle.fontSize }]}>
						{number}
					</Text>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	},
	numberBall: {
		borderRadius: 50,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center'
	},
	numberText: {
		color: '#000000',
		fontWeight: '600'
	}
})

export default WinningNumbers
