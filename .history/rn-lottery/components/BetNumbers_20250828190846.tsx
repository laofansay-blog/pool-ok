import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// 开奖数字颜色配置（与Web项目保持一致）
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

interface BetNumbersProps {
	selectedNumbers: any // 可能是数组或JSONB对象
	size?: 'small' | 'medium' | 'large'
	winningNumbers?: number[] // 用于高亮中奖号码
	style?: any
}

export default function BetNumbers({
	selectedNumbers,
	size = 'small',
	winningNumbers = [],
	style
}: BetNumbersProps) {
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

	// 处理不同格式的投注数据
	const renderBetNumbers = () => {
		console.log('BetNumbers组件接收到的数据:', selectedNumbers)
		console.log('数据类型:', typeof selectedNumbers)
		console.log('是否为数组:', Array.isArray(selectedNumbers))

		// 如果是旧格式（数组），直接渲染
		if (Array.isArray(selectedNumbers)) {
			return (
				<View style={[styles.container, style]}>
					{selectedNumbers.map((number, index) => {
						const colors = { bg: '#e74c3c', text: '#ffffff' }
						const isWinning = winningNumbers.includes(number)

						return (
							<View
								key={index}
								style={[
									styles.numberBall,
									{
										width: sizeStyle.width,
										height: sizeStyle.height,
										borderRadius: sizeStyle.borderRadius,
										backgroundColor: colors.bg
									},
									isWinning && styles.winningBall
								]}
							>
								<Text
									style={[
										styles.numberText,
										{
											fontSize: sizeStyle.fontSize,
											color: colors.text
										},
										isWinning && styles.winningText
									]}
								>
									{String(number).padStart(2, '0')}
								</Text>
							</View>
						)
					})}
				</View>
			)
		}

		// 如果是JSONB格式（新格式）
		if (
			selectedNumbers &&
			typeof selectedNumbers === 'object' &&
			!Array.isArray(selectedNumbers)
		) {
			try {
				// 解析JSONB数据
				const betData = selectedNumbers
				console.log('解析JSONB数据:', betData)

				// 检查是否有original_bets字段（真实的投注数据）
				if (betData.original_bets && Array.isArray(betData.original_bets)) {
					console.log('找到original_bets:', betData.original_bets)
					const originalBets = betData.original_bets

					return (
						<View style={[styles.container, style]}>
							{originalBets.map((bet: any, index: number) => {
								console.log('处理投注项:', bet)
								const group = bet.group || bet.position || index + 1
								const number = bet.number || bet.value
								const colors = getPositionColor(group - 1)

								// 检查是否中奖
								let isWinning = false
								if (winningNumbers && winningNumbers.length >= group) {
									const winningNumber = winningNumbers[group - 1]
									isWinning = number === winningNumber
								}

								return (
									<View
										key={index}
										style={[
											styles.betNumberBadge,
											{
												backgroundColor: colors.bg
											},
											isWinning && styles.winningBall
										]}
									>
										<Text
											style={[
												styles.betNumberText,
												{
													color: colors.text,
													fontSize: sizeStyle.fontSize
												},
												isWinning && styles.winningText
											]}
										>
											{group}-{String(number).padStart(2, '0')}
											{isWinning && ' 🎯'}
										</Text>
									</View>
								)
							})}
						</View>
					)
				}

				// 检查是否有metadata字段
				if (betData.metadata) {
					console.log('找到metadata:', betData.metadata)
					const metadata = betData.metadata

					// 如果metadata中有bets或numbers字段
					if (metadata.bets && Array.isArray(metadata.bets)) {
						return (
							<View style={[styles.container, style]}>
								{metadata.bets.map((bet: any, index: number) => {
									const group = bet.group || bet.position || index + 1
									const number = bet.number || bet.value
									const colors = getPositionColor(group - 1)

									let isWinning = false
									if (winningNumbers && winningNumbers.length >= group) {
										const winningNumber = winningNumbers[group - 1]
										isWinning = number === winningNumber
									}

									return (
										<View
											key={index}
											style={[
												styles.betNumberBadge,
												{
													backgroundColor: colors.bg
												},
												isWinning && styles.winningBall
											]}
										>
											<Text
												style={[
													styles.betNumberText,
													{
														color: colors.text,
														fontSize: sizeStyle.fontSize
													},
													isWinning && styles.winningText
												]}
											>
												{group}-{String(number).padStart(2, '0')}
												{isWinning && ' 🎯'}
											</Text>
										</View>
									)
								})}
							</View>
						)
					}
				}

				// 检查是否有betNumbers字段（旧格式）
				if (betData.betNumbers && Array.isArray(betData.betNumbers)) {
					const betNumbers = betData.betNumbers

					return (
						<View style={[styles.container, style]}>
							{betNumbers.map((bet: any, index: number) => {
								const group = bet.group || index + 1
								const number = bet.number
								const colors = getPositionColor(group - 1)

								// 检查是否中奖
								let isWinning = false
								if (winningNumbers && winningNumbers.length >= group) {
									const winningNumber = winningNumbers[group - 1]
									isWinning = number === winningNumber
								}

								return (
									<View
										key={index}
										style={[
											styles.betNumberBadge,
											{
												backgroundColor: colors.bg
											},
											isWinning && styles.winningBall
										]}
									>
										<Text
											style={[
												styles.betNumberText,
												{
													color: colors.text,
													fontSize: sizeStyle.fontSize
												},
												isWinning && styles.winningText
											]}
										>
											{group}-{String(number).padStart(2, '0')}
											{isWinning && ' 🎯'}
										</Text>
									</View>
								)
							})}
						</View>
					)
				}

				// 如果是其他JSONB格式，尝试解析
				const keys = Object.keys(betData)
				if (keys.length > 0) {
					return (
						<View style={[styles.container, style]}>
							{keys.map((key, index) => {
								const value = betData[key]
								if (typeof value === 'number') {
									const colors = getPositionColor(index)
									const isWinning = winningNumbers.includes(value)

									return (
										<View
											key={index}
											style={[
												styles.betNumberBadge,
												{
													backgroundColor: colors.bg
												},
												isWinning && styles.winningBall
											]}
										>
											<Text
												style={[
													styles.betNumberText,
													{
														color: colors.text,
														fontSize: sizeStyle.fontSize
													},
													isWinning && styles.winningText
												]}
											>
												{key}-{String(value).padStart(2, '0')}
												{isWinning && ' 🎯'}
											</Text>
										</View>
									)
								}
								return null
							})}
						</View>
					)
				}
			} catch (error) {
				console.error('解析投注数据失败:', error)
			}
		}

		// 如果格式不正确或为空
		return (
			<View style={[styles.container, style]}>
				<Text style={styles.errorText}>数据格式错误</Text>
			</View>
		)
	}

	return renderBetNumbers()
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 6,
		flexWrap: 'wrap',
		alignItems: 'center'
	},
	numberBall: {
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 2
	},
	numberText: {
		fontWeight: 'bold'
	},
	betNumberBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginRight: 4,
		marginBottom: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 2
	},
	betNumberText: {
		fontWeight: 'bold',
		fontSize: 12
	},
	winningBall: {
		borderWidth: 2,
		borderColor: '#FFD700'
	},
	winningText: {
		// 中奖文字样式
	},
	errorText: {
		fontSize: 12,
		color: '#ff4444',
		fontStyle: 'italic'
	}
})
