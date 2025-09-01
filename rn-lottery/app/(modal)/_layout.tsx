import { Stack } from 'expo-router'

export default function ModalLayout() {
	return (
		<Stack
			screenOptions={{
				presentation: 'modal',
				headerShown: true,
				headerStyle: {
					backgroundColor: '#e74c3c'
				},
				headerTintColor: '#ffffff',
				headerTitleStyle: {
					fontWeight: 'bold'
				}
			}}
		>
			<Stack.Screen
				name="stats"
				options={{
					title: '统计信息',
					headerBackTitle: '返回'
				}}
			/>
			<Stack.Screen
				name="transactions"
				options={{
					title: '交易记录',
					headerBackTitle: '返回'
				}}
			/>
			<Stack.Screen
				name="recharge-history"
				options={{
					title: '充值记录',
					headerBackTitle: '返回'
				}}
			/>
			<Stack.Screen
				name="winnings"
				options={{
					title: '中奖明细',
					headerBackTitle: '返回'
				}}
			/>
			<Stack.Screen
				name="recharge"
				options={{
					title: '充值金币',
					headerBackTitle: '返回',
					headerShown: false
				}}
			/>
			<Stack.Screen
				name="winning-detail"
				options={{
					title: '中奖详情',
					headerBackTitle: '返回',
					headerShown: false
				}}
			/>
		</Stack>
	)
}
