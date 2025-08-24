import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRecoilState } from 'recoil';
import { countdownState } from '../store/atoms';

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useRecoilState(countdownState);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Next Draw</Text>
        <Text style={styles.timer}>
          {formatTime(timeLeft)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#171717',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  timer: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});

export default CountdownTimer;
