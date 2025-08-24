import { selector } from 'recoil';
import { selectedNumbersState, betAmountState, balanceState } from './atoms';

// 计算选中的组数
export const selectedGroupsState = selector({
  key: 'selectedGroupsState',
  get: ({ get }) => {
    const selectedNumbers = get(selectedNumbersState);
    const groups = new Set();
    selectedNumbers.forEach(selection => {
      const [group] = selection.split('-');
      groups.add(group);
    });
    return groups.size;
  },
});

// 计算总投注成本
export const totalCostState = selector({
  key: 'totalCostState',
  get: ({ get }) => {
    const selectedNumbers = get(selectedNumbersState);
    const betAmount = get(betAmountState);
    return selectedNumbers.length * betAmount;
  },
});

// 计算潜在赔付
export const potentialPayoutState = selector({
  key: 'potentialPayoutState',
  get: ({ get }) => {
    const groupCount = get(selectedGroupsState);
    const betAmount = get(betAmountState);
    return groupCount * betAmount * 9.8;
  },
});

// 检查是否可以下注
export const canPlaceBetState = selector({
  key: 'canPlaceBetState',
  get: ({ get }) => {
    const selectedNumbers = get(selectedNumbersState);
    const totalCost = get(totalCostState);
    const balance = get(balanceState);
    return selectedNumbers.length > 0 && totalCost <= balance;
  },
});
