import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks
import { useLottery } from '../hooks/useLottery';
import { useAuth } from '../hooks/useAuth';

export default function HomeScreen() {
  const {
    selectedNumbers,
    betAmount,
    setBetAmount,
    balance,
    currentRound,
    latestResult,
    countdown,
    countdownDisplay,
    totalCost,
    potentialPayout,
    canPlaceBet,
    loading,
    handleNumberSelect,
    clearSelection,
    placeBet,
  } = useLottery();

  const { user, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>🏰 中世纪彩票</Text>
            <Text style={styles.subtitle}>Medieval Lottery</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.balanceLabel}>余额</Text>
            <Text style={styles.balanceAmount}>{balance} 金币</Text>
            <Pressable style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutText}>登出</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Game Info */}
          <View style={styles.gameInfo}>
            <View style={styles.roundInfo}>
              <Text style={styles.roundTitle}>当前轮次</Text>
              <Text style={styles.roundNumber}>
                {currentRound?.round_number || '加载中...'}
              </Text>
            </View>
            <View style={styles.countdownInfo}>
              <Text style={styles.countdownLabel}>倒计时</Text>
              <Text style={styles.countdownTime}>{countdownDisplay}</Text>
            </View>
          </View>

          {/* Latest Result */}
          {latestResult && latestResult.winning_numbers && (
            <View style={styles.latestResult}>
              <Text style={styles.resultTitle}>🎯 最新开奖</Text>
              <View style={styles.winningNumbers}>
                {latestResult.winning_numbers.map((num, index) => (
                  <View key={index} style={[styles.numberBall, getNumberStyle(num)]}>
                    <Text style={styles.numberText}>{num}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Number Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>⚔️ 选择你的幸运数字</Text>
            <Text style={styles.sectionSubtitle}>
              从 1-10 中选择 9 个数字，全中即可获得 {(parseFloat(betAmount) * 9.8).toFixed(1)} 金币
            </Text>
            
            <View style={styles.numberGrid}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.numberButton,
                    selectedNumbers.includes(num) && styles.selectedNumber,
                  ]}
                  onPress={() => handleNumberSelect(num)}
                >
                  <Text
                    style={[
                      styles.numberButtonText,
                      selectedNumbers.includes(num) && styles.selectedNumberText,
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                已选择: {selectedNumbers.length}/9
              </Text>
              {selectedNumbers.length > 0 && (
                <Pressable style={styles.clearButton} onPress={clearSelection}>
                  <Text style={styles.clearButtonText}>清空</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Bet Amount */}
          <View style={styles.betSection}>
            <Text style={styles.sectionTitle}>💰 投注金额</Text>
            <View style={styles.betInputContainer}>
              <TextInput
                style={styles.betInput}
                value={betAmount}
                onChangeText={setBetAmount}
                keyboardType="numeric"
                placeholder="输入金额"
                placeholderTextColor="#666"
              />
              <Text style={styles.betUnit}>金币</Text>
            </View>
            
            <View style={styles.quickAmounts}>
              {[2, 5, 10, 20, 50].map((amount) => (
                <Pressable
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setBetAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>{amount}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.betInfo}>
              <Text style={styles.betInfoText}>
                投注金额: {betAmount} 金币
              </Text>
              <Text style={styles.betInfoText}>
                潜在收益: {potentialPayout.toFixed(1)} 金币
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable
            style={styles.historyButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.historyButtonText}>📜 历史</Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.betButton,
              !canPlaceBet && styles.disabledBetButton,
            ]}
            onPress={placeBet}
            disabled={!canPlaceBet || loading}
          >
            <LinearGradient
              colors={canPlaceBet ? ['#d4af37', '#b8941f'] : ['#666', '#444']}
              style={styles.betButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Text style={styles.betButtonText}>🎲 下注</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Helper function for number ball colors
const getNumberStyle = (num: number) => {
  const colors = [
    '#d4af37', // 1 - gold
    '#8b4513', // 2 - brown
    '#dc143c', // 3 - crimson
    '#4169e1', // 4 - royal blue
    '#228b22', // 5 - forest green
    '#ff6347', // 6 - tomato
    '#9932cc', // 7 - dark orchid
    '#ff8c00', // 8 - dark orange
    '#2e8b57', // 9 - sea green
    '#b22222', // 10 - fire brick
  ];
  return { backgroundColor: colors[num - 1] || '#666' };
};
