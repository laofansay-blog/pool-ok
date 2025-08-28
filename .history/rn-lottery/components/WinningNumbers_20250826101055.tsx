import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WinningNumbersProps {
  numbers: number[];
  size?: 'small' | 'medium' | 'large';
}

const WinningNumbers: React.FC<WinningNumbersProps> = ({ numbers, size = 'medium' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24, fontSize: 12 };
      case 'large':
        return { width: 40, height: 40, fontSize: 16 };
      default:
        return { width: 32, height: 32, fontSize: 14 };
    }
  };

  const sizeStyle = getSize();

  return (
    <View style={styles.container}>
      {numbers.map((number, index) => (
        <View
          key={index}
          style={[styles.numberBall, sizeStyle]}
        >
          <Text style={[styles.numberText, { fontSize: sizeStyle.fontSize }]}>{number}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numberBall: {
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#000000',
    fontWeight: '600',
  },
});

export default WinningNumbers;
