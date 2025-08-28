import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Alert } from 'react-native';
import {
  selectedNumbersState,
  betAmountState,
  balanceState,
  currentRoundState,
  latestResultState,
  betHistoryState,
  drawHistoryState,
  countdownState,
  userState,
  loadingState,
} from '../store/atoms';
import {
  totalCostState,
  potentialPayoutState,
  canPlaceBetState,
  countdownDisplayState,
} from '../store/selectors';
import { gameAPI, realtimeAPI, utils } from '../lib/api';

export const useLottery = () => {
  // State
  const [selectedNumbers, setSelectedNumbers] = useRecoilState(selectedNumbersState);
  const [betAmount, setBetAmount] = useRecoilState(betAmountState);
  const [balance, setBalance] = useRecoilState(balanceState);
  const [currentRound, setCurrentRound] = useRecoilState(currentRoundState);
  const [latestResult, setLatestResult] = useRecoilState(latestResultState);
  const [betHistory, setBetHistory] = useRecoilState(betHistoryState);
  const [drawHistory, setDrawHistory] = useRecoilState(drawHistoryState);
  const [countdown, setCountdown] = useRecoilState(countdownState);
  const [loading, setLoading] = useRecoilState(loadingState);

  const user = useRecoilValue(userState);

  // Computed values
  const totalCost = useRecoilValue(totalCostState);
  const potentialPayout = useRecoilValue(potentialPayoutState);
  const canPlaceBet = useRecoilValue(canPlaceBetState);
  const countdownDisplay = useRecoilValue(countdownDisplayState);

  // 初始化数据
  useEffect(() => {
    if (user) {
      loadGameData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // 倒计时逻辑
  useEffect(() => {
    if (!currentRound) return;

    const updateCountdown = () => {
      const timeLeft = utils.calculateTimeLeft(currentRound.end_time);
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        // 轮次结束，重新加载数据
        setTimeout(() => {
          loadGameData();
        }, 1000);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentRound]);

  // 加载游戏数据
  const loadGameData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 并行加载数据
      const [
        currentRoundResult,
        latestResultResult,
        balanceResult,
        betHistoryResult,
        drawHistoryResult
      ] = await Promise.all([
        gameAPI.getCurrentRound(),
        gameAPI.getLatestResult(),
        gameAPI.getUserBalance(user.id),
        gameAPI.getBetHistory(user.id, 20),
        gameAPI.getDrawHistory(20)
      ]);

      if (currentRoundResult.data) {
        setCurrentRound(currentRoundResult.data);
      }

      if (latestResultResult.data) {
        setLatestResult(latestResultResult.data);
      }

      if (!balanceResult.error) {
        setBalance(balanceResult.data);
      }

      if (betHistoryResult.data) {
        setBetHistory(betHistoryResult.data);
      }

      if (drawHistoryResult.data) {
        setDrawHistory(drawHistoryResult.data);
      }
    } catch (error) {
      console.error('Load game data error:', error);
    } finally {
      setLoading(false);
    }
  };