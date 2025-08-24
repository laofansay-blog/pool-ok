# RN Lottery App

A minimalist React Native lottery application built with Expo Router and Tailwind CSS.

## Features

- **Clean Design**: Black, white, and gray color scheme
- **Compact Layout**: Optimized for mobile screens
- **Number Selection**: 10 groups with 10 numbers each
- **Quick Actions**: All, Big, Small number selection
- **Real-time Calculations**: Automatic cost and payout calculations
- **Countdown Timer**: 5-minute draw intervals
- **History View**: Previous draw results

## Tech Stack

- React Native (Expo)
- Expo Router
- NativeWind (Tailwind CSS)
- TypeScript
- Recoil (State Management)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device:
```bash
npm run ios     # iOS
npm run android # Android
```

## Project Structure

```
rn-lottery/
├── app/
│   ├── _layout.tsx    # Root layout with RecoilRoot
│   ├── index.tsx      # Home screen
│   └── history.tsx    # History modal
├── components/
│   ├── NumberGrid.tsx     # Number selection grid
│   ├── BetSummary.tsx     # Bet summary and actions
│   ├── CountdownTimer.tsx # Draw countdown
│   └── WinningNumbers.tsx # Winning numbers display
├── store/
│   ├── atoms.ts       # Recoil atoms
│   └── selectors.ts   # Recoil selectors
├── hooks/
│   └── useLottery.ts  # Custom lottery hook
└── ...
```

## Design Principles

- **Minimalist**: Clean, uncluttered interface
- **Monochrome**: Black/white/gray color palette
- **Compact**: Efficient use of screen space
- **Accessible**: High contrast and readable text
- **Responsive**: Adapts to different screen sizes
