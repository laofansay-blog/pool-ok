import { atom } from 'recoil';

// 选中的数字
export const selectedNumbersState = atom<string[]>({
  key: 'selectedNumbersState',
  default: [],
});

// 单注金额
export const betAmountState = atom<number>({
  key: 'betAmountState',
  default: 2,
});

// 用户余额
export const balanceState = atom<number>({
  key: 'balanceState',
  default: 1000,
});

// 当前期数
export const currentRoundState = atom<string>({
  key: 'currentRoundState',
  default: '20241201001',
});

// 倒计时时间
export const countdownState = atom<number>({
  key: 'countdownState',
  default: 300, // 5分钟
});

// 最新开奖号码
export const winningNumbersState = atom<number[]>({
  key: 'winningNumbersState',
  default: [3, 8, 4, 2, 10, 6, 7, 1, 5, 9],
});

// 历史记录
export const historyState = atom<Array<{
  round: string;
  numbers: number[];
  time: string;
}>>({
  key: 'historyState',
  default: [
    { round: '20241201001', numbers: [3, 8, 4, 2, 10, 6, 7, 1, 5, 9], time: '15:00' },
    { round: '20241201002', numbers: [1, 5, 9, 3, 7, 2, 8, 4, 6, 10], time: '14:55' },
    { round: '20241201003', numbers: [7, 2, 6, 1, 9, 4, 3, 8, 10, 5], time: '14:50' },
    { round: '20241201004', numbers: [4, 9, 1, 7, 3, 8, 5, 2, 6, 10], time: '14:45' },
    { round: '20241201005', numbers: [8, 3, 10, 5, 1, 9, 2, 7, 4, 6], time: '14:40' },
  ],
});
