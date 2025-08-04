// 环境变量配置管理
const config = {
  supabase: {
    url: process.env.SUPABASE_URL || 'your_supabase_url_here',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your_anon_key_here',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'
  },
  
  app: {
    env: process.env.APP_ENV || 'development',
    port: process.env.APP_PORT || 3000,
    domain: process.env.APP_DOMAIN || 'localhost:3000'
  },
  
  game: {
    lotteryIntervalMinutes: parseInt(process.env.LOTTERY_INTERVAL_MINUTES) || 5,
    winningMultiplier: parseFloat(process.env.WINNING_MULTIPLIER) || 9.8,
    maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT) || 10000,
    minBetAmount: parseFloat(process.env.MIN_BET_AMOUNT) || 1
  },
  
  payment: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || ''
    }
  }
}

module.exports = config