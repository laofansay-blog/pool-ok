import React, { useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useRecoilValue } from 'recoil'
import { betHistoryState, drawHistoryState, loadingState } from '../store/atoms'
import { useLottery } from '../hooks/useLottery'

export default function HistoryScreen() {
	const betHistory = useRecoilValue(betHistoryState)
	const drawHistory = useRecoilValue(drawHistoryState)
	const loading = useRecoilValue(loadingState)
	const { loadBetHistory } = useLottery()

	useEffect(() => {
		loadBetHistory()
	}, [])

	const renderBetItem = ({ item }: { item: any }) => (
		<View style={styles.historyItem}>
			<View style={styles.historyHeader}>
				<Text style={styles.roundText}>🎯 第 {item.round_number} 期</Text>
				<Text style={styles.timeText}>
					{new Date(item.created_at).toLocaleString()}
				</Text>
			</View>

			<View style={styles.betInfo}>
				<Text style={styles.betLabel}>选择的数字:</Text>
				<View style={styles.numbersContainer}>
					{item.selected_numbers.map((num: number, index: number) => (
						<View key={index} style={[styles.numberBall, getNumberStyle(num)]}>
							<Text style={styles.numberText}>{num}</Text>
						</View>
					))}
				</View>
			</View>

			{item.winning_numbers && (
				<View style={styles.betInfo}>
					<Text style={styles.betLabel}>开奖数字:</Text>
					<View style={styles.numbersContainer}>
						{item.winning_numbers.map((num: number, index: number) => (
							<View
								key={index}
								style={[styles.numberBall, getNumberStyle(num)]}
							>
								<Text style={styles.numberText}>{num}</Text>
							</View>
						))}
					</View>
				</View>
			)}

			<View style={styles.betResult}>
				<Text style={styles.betAmount}>投注: {item.bet_amount} 金币</Text>
				<Text
					style={[
						styles.resultText,
						item.is_winner ? styles.winText : styles.loseText
					]}
				>
					{item.is_winner ? `🎉 中奖 +${item.actual_payout}` : '❌ 未中奖'}
				</Text>
			</View>
		</View>
	)

	return (
		<LinearGradient
			colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
			style={styles.container}
		>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.header}>
					<Pressable style={styles.backButton} onPress={() => router.back()}>
						<Text style={styles.backButtonText}>‹ 返回</Text>
					</Pressable>
					<Text style={styles.title}>📜 历史记录</Text>
					<View style={styles.placeholder} />
				</View>

				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#d4af37" />
						<Text style={styles.loadingText}>加载中...</Text>
					</View>
				) : (
					<View style={styles.content}>
						<View style={styles.tabContainer}>
							<Text style={styles.sectionTitle}>我的投注记录</Text>
						</View>

						<FlatList
							data={betHistory}
							renderItem={renderBetItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.listContainer}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={
								<View style={styles.emptyContainer}>
									<Text style={styles.emptyText}>暂无投注记录</Text>
								</View>
							}
						/>
					</View>
				)}
			</SafeAreaView>
		</LinearGradient>
	)
}
