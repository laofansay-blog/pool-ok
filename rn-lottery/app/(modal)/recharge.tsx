import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	TextInput,
	Alert,
	ActivityIndicator,
	ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { authAPI } from '@/lib/api'

// 预设金额选项
const PRESET_AMOUNTS = [100, 500, 1000, 5000]

// 支付方式选项
const PAYMENT_METHODS = [
	{ value: 'stripe', label: '信用卡支付', icon: 'card' },
	{ value: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
	{ value: 'wechat', label: '微信支付', icon: 'chatbubble' },
	{ value: 'alipay', label: '支付宝', icon: 'wallet' }
]

export default function RechargeScreen() {
	const [amount, setAmount] = useState('')
	const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
	const [paymentMethod, setPaymentMethod] = useState('stripe')
	const [loading, setLoading] = useState(false)

	// 选择预设金额
	const selectPresetAmount = (presetAmount: number) => {
		setAmount(presetAmount.toString())
		setSelectedPreset(presetAmount)
	}

	// 自定义金额输入
	const handleAmountChange = (value: string) => {
		setAmount(value)
		setSelectedPreset(null)
	}

	// 格式化货币
	const formatCurrency = (amount: number) => {
		return `¥${amount.toFixed(2)}`
	}

	// 处理充值
	const handleRecharge = async () => {
		const rechargeAmount = parseFloat(amount)

		// 验证金额
		if (!rechargeAmount || rechargeAmount <= 0) {
			Alert.alert('错误', '请输入有效的充值金额')
			return
		}

		if (rechargeAmount < 10) {
			Alert.alert('错误', '充值金额不能少于10金币')
			return
		}

		if (rechargeAmount > 50000) {
			Alert.alert('错误', '单次充值金额不能超过50000金币')
			return
		}

		if (!paymentMethod) {
			Alert.alert('错误', '请选择支付方式')
			return
		}

		setLoading(true)

		try {
			const { user, error: userError } = await authAPI.getCurrentUser()
			if (userError || !user) {
				Alert.alert('错误', '用户未登录')
				return
			}

			// 调用充值API
			const { data, error } = await supabase.functions.invoke(
				'manage-balance',
				{
					body: {
						action: 'recharge',
						userId: user.id,
						amount: rechargeAmount,
						paymentMethod: paymentMethod,
						paymentId: `demo_${Date.now()}`
					}
				}
			)

			if (error) {
				throw error
			}

			Alert.alert('充值成功', `成功充值 ${formatCurrency(rechargeAmount)}`, [
				{
					text: '确定',
					onPress: () => {
						router.back()
					}
				}
			])
		} catch (error: any) {
			Alert.alert('充值失败', error.message || '充值过程中发生错误')
		} finally {
			setLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* 头部 */}
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={24} color="#ffffff" />
				</Pressable>
				<Text style={styles.headerTitle}>充值金币</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* 预设金额 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>选择金额</Text>
					<View style={styles.presetAmounts}>
						{PRESET_AMOUNTS.map((presetAmount) => (
							<Pressable
								key={presetAmount}
								style={[
									styles.presetButton,
									selectedPreset === presetAmount && styles.presetButtonActive
								]}
								onPress={() => selectPresetAmount(presetAmount)}
							>
								<Text
									style={[
										styles.presetButtonText,
										selectedPreset === presetAmount &&
											styles.presetButtonTextActive
									]}
								>
									{presetAmount} G
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* 自定义金额 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>自定义金额</Text>
					<View style={styles.inputContainer}>
						<Text style={styles.currencySymbol}>¥</Text>
						<TextInput
							style={styles.amountInput}
							value={amount}
							onChangeText={handleAmountChange}
							placeholder="输入充值金额"
							placeholderTextColor="#666666"
							keyboardType="numeric"
							maxLength={8}
						/>
					</View>
					<Text style={styles.inputHint}>最低充值10金币，最高50000金币</Text>
				</View>

				{/* 支付方式 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>支付方式</Text>
					<View style={styles.paymentMethods}>
						{PAYMENT_METHODS.map((method) => (
							<Pressable
								key={method.value}
								style={[
									styles.paymentMethod,
									paymentMethod === method.value && styles.paymentMethodActive
								]}
								onPress={() => setPaymentMethod(method.value)}
							>
								<View style={styles.paymentMethodLeft}>
									<Ionicons
										name={method.icon as any}
										size={24}
										color={
											paymentMethod === method.value ? '#d4af37' : '#666666'
										}
									/>
									<Text
										style={[
											styles.paymentMethodText,
											paymentMethod === method.value &&
												styles.paymentMethodTextActive
										]}
									>
										{method.label}
									</Text>
								</View>
								<View
									style={[
										styles.radioButton,
										paymentMethod === method.value && styles.radioButtonActive
									]}
								>
									{paymentMethod === method.value && (
										<View style={styles.radioButtonInner} />
									)}
								</View>
							</Pressable>
						))}
					</View>
				</View>

				{/* 充值说明 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>充值说明</Text>
					<View style={styles.noticeContainer}>
						<Text style={styles.noticeText}>• 充值金额将立即到账</Text>
						<Text style={styles.noticeText}>• 支持多种支付方式</Text>
						<Text style={styles.noticeText}>• 充值记录可在个人中心查看</Text>
						<Text style={styles.noticeText}>• 如有问题请联系客服</Text>
					</View>
				</View>
			</ScrollView>

			{/* 底部按钮 */}
			<View style={styles.footer}>
				<Pressable
					style={[
						styles.rechargeButton,
						(!amount || loading) && styles.rechargeButtonDisabled
					]}
					onPress={handleRecharge}
					disabled={!amount || loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="#000000" />
					) : (
						<Text style={styles.rechargeButtonText}>
							确认充值 {amount ? formatCurrency(parseFloat(amount)) : ''}
						</Text>
					)}
				</Pressable>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#e74c3c',
		paddingHorizontal: 16,
		paddingVertical: 12,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4
	},
	backButton: {
		padding: 8
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff'
	},
	placeholder: {
		width: 40
	},
	content: {
		flex: 1,
		padding: 16
	},
	section: {
		marginBottom: 24
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333',
		marginBottom: 12
	},
	presetAmounts: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12
	},
	presetButton: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		paddingHorizontal: 20,
		paddingVertical: 12,
		minWidth: 80,
		alignItems: 'center'
	},
	presetButtonActive: {
		backgroundColor: '#d4af37',
		borderColor: '#d4af37'
	},
	presetButtonText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#333333'
	},
	presetButtonTextActive: {
		color: '#000000',
		fontWeight: 'bold'
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	currencySymbol: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333333',
		marginRight: 8
	},
	amountInput: {
		flex: 1,
		fontSize: 16,
		color: '#333333'
	},
	inputHint: {
		fontSize: 12,
		color: '#666666',
		marginTop: 8
	},
	paymentMethods: {
		gap: 12
	},
	paymentMethod: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		padding: 16
	},
	paymentMethodActive: {
		borderColor: '#d4af37',
		backgroundColor: '#fefdf8'
	},
	paymentMethodLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	paymentMethodText: {
		fontSize: 14,
		color: '#333333',
		marginLeft: 12
	},
	paymentMethodTextActive: {
		color: '#d4af37',
		fontWeight: '500'
	},
	radioButton: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#e0e0e0',
		alignItems: 'center',
		justifyContent: 'center'
	},
	radioButtonActive: {
		borderColor: '#d4af37'
	},
	radioButtonInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#d4af37'
	},
	noticeContainer: {
		backgroundColor: '#ffffff',
		borderRadius: 8,
		padding: 16,
		borderLeftWidth: 4,
		borderLeftColor: '#d4af37'
	},
	noticeText: {
		fontSize: 14,
		color: '#666666',
		lineHeight: 20,
		marginBottom: 4
	},
	footer: {
		padding: 16,
		backgroundColor: '#ffffff',
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0'
	},
	rechargeButton: {
		backgroundColor: '#d4af37',
		borderRadius: 8,
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center'
	},
	rechargeButtonDisabled: {
		backgroundColor: '#cccccc'
	},
	rechargeButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000000'
	}
})
