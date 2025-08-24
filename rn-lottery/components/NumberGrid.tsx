import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface NumberGridProps {
  selectedNumbers: string[];
  onNumberSelect: (group: number, number: number) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ selectedNumbers, onNumberSelect }) => {
  const renderGroup = (group: number) => {
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
      <View key={group} className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400 text-sm font-medium">Group {group}</Text>
          <View className="flex-row flex-wrap gap-1">
            <Pressable
              onPress={() => {
                // Select all numbers in group
                numbers.forEach(num => onNumberSelect(group, num));
              }}
              className="px-2 py-1 bg-gray-800 rounded"
            >
              <Text className="text-gray-300 text-xs">All</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Select big numbers (6-10)
                [6, 7, 8, 9, 10].forEach(num => onNumberSelect(group, num));
              }}
              className="px-2 py-1 bg-gray-800 rounded"
            >
              <Text className="text-gray-300 text-xs">Big</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Select small numbers (1-5)
                [1, 2, 3, 4, 5].forEach(num => onNumberSelect(group, num));
              }}
              className="px-2 py-1 bg-gray-800 rounded"
            >
              <Text className="text-gray-300 text-xs">Small</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Select odd numbers
                [1, 3, 5, 7, 9].forEach(num => onNumberSelect(group, num));
              }}
              className="px-2 py-1 bg-gray-800 rounded"
            >
              <Text className="text-gray-300 text-xs">Odd</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Select even numbers
                [2, 4, 6, 8, 10].forEach(num => onNumberSelect(group, num));
              }}
              className="px-2 py-1 bg-gray-800 rounded"
            >
              <Text className="text-gray-300 text-xs">Even</Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {numbers.map(number => {
            const selection = `${group}-${number}`;
            const isSelected = selectedNumbers.includes(selection);

            return (
              <Pressable
                key={number}
                onPress={() => onNumberSelect(group, number)}
                className={`w-8 h-8 rounded-full items-center justify-center border ${isSelected
                    ? 'bg-white border-white'
                    : 'bg-transparent border-gray-600'
                  }`}
              >
                <Text className={`text-sm font-medium ${isSelected ? 'text-black' : 'text-gray-300'
                  }`}>
                  {number}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(group => renderGroup(group))}
    </View>
  );
};

export default NumberGrid;
