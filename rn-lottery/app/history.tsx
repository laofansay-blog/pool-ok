import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRecoilValue } from 'recoil';
import WinningNumbers from '../components/WinningNumbers';
import { historyState } from '../store/atoms';

export default function HistoryScreen() {
  const history = useRecoilValue(historyState);
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 py-3 border-b border-gray-800 flex-row justify-between items-center">
        <Text className="text-white text-lg font-semibold">Draw History</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-gray-400">Close</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {history.map((item, index) => (
          <View key={item.round} className="py-4 border-b border-gray-800">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm">Round {item.round}</Text>
              <Text className="text-gray-500 text-xs">{item.time}</Text>
            </View>
            <WinningNumbers numbers={item.numbers} size="small" />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
