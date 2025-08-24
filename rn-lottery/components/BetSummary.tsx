import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

interface BetSummaryProps {
  selectedCount: number;
  groupCount: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  totalCost: number;
  potentialPayout: number;
  onPlaceBet: () => void;
  onClear: () => void;
  disabled: boolean;
}

const BetSummary: React.FC<BetSummaryProps> = ({
  selectedCount,
  groupCount,
  betAmount,
  setBetAmount,
  totalCost,
  potentialPayout,
  onPlaceBet,
  onClear,
  disabled
}) => {
  return (
    <View className="px-4 py-4 bg-gray-900 border-t border-gray-800">
      {/* Stats */}
      <View className="flex-row justify-between mb-3">
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">Selected</Text>
          <Text className="text-white text-sm font-medium">{selectedCount} numbers</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">Groups</Text>
          <Text className="text-white text-sm font-medium">{groupCount} groups</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">Per Bet</Text>
          <View className="flex-row items-center">
            <TextInput
              value={betAmount.toString()}
              onChangeText={(text) => setBetAmount(parseInt(text) || 1)}
              className="text-white text-sm font-medium bg-gray-800 px-2 py-1 rounded w-12 text-center"
              keyboardType="numeric"
            />
            <Text className="text-gray-400 text-sm ml-1">G</Text>
          </View>
        </View>
      </View>

      {/* Totals */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">Total Cost</Text>
          <Text className="text-white text-base font-semibold">{totalCost}G</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">Max Payout</Text>
          <Text className="text-green-400 text-base font-semibold">{potentialPayout.toFixed(1)}G</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row space-x-3">
        <Pressable
          onPress={onClear}
          disabled={selectedCount === 0}
          className={`flex-1 py-3 rounded-lg border ${
            selectedCount === 0 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-600 bg-gray-800'
          }`}
        >
          <Text className={`text-center font-medium ${
            selectedCount === 0 ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Clear
          </Text>
        </Pressable>
        
        <Pressable
          onPress={onPlaceBet}
          disabled={disabled}
          className={`flex-2 py-3 rounded-lg ${
            disabled 
              ? 'bg-gray-700' 
              : 'bg-white'
          }`}
        >
          <Text className={`text-center font-semibold ${
            disabled ? 'text-gray-500' : 'text-black'
          }`}>
            Place Bet
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BetSummary;
