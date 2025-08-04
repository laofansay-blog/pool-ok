// 前端配置文件
const CONFIG = {
  SUPABASE_URL: 'https://deyugfnymgyxcfacxtjy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g', // 请在 Supabase Dashboard > Settings > API 中获取

  GAME: {
    LOTTERY_INTERVAL: 5 * 60 * 1000, // 5分钟
    WINNING_MULTIPLIER: 9.8,
    MAX_NUMBERS: 9,
    NUMBER_RANGE: [1, 10],
    MAX_BET: 10000,
    MIN_BET: 1
  },

  API: {
    ENDPOINTS: {
      PLACE_BET: 'place-bet',
      DRAW_LOTTERY: 'draw-lottery',
      GET_HISTORY: 'get-history'
    }
  }
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG
}