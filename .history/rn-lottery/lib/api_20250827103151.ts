import { supabase, User, Round, Bet, BetHistory, GAME_CONFIG } from './supabase';

// 认证相关 API
export const authAPI = {
  // 登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 注册
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username,
        },
      },
    });
    return { data, error };
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // 获取用户信息
  async getUserProfile(userId: string): Promise<{ data: User | null; error: any }> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },
};

// 游戏相关 API
export const gameAPI = {
  // 获取当前轮次
  async getCurrentRound(): Promise<{ data: Round | null; error: any }> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  },

  // 获取最新开奖结果
  async getLatestResult(): Promise<{ data: Round | null; error: any }> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'completed')
      .order('draw_time', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  },

  // 下注
  async placeBet(roundId: string, selectedNumbers: number[], betAmount: number) {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/place-bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          round_id: roundId,
          selected_numbers: selectedNumbers,
          bet_amount: betAmount,
        }),
      });

      const result = await response.json();
      return { data: result, error: response.ok ? null : result };
    } catch (error) {
      return { data: null, error };
    }
  },

  // 获取用户余额
  async getUserBalance(userId: string): Promise<{ data: number; error: any }> {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    return { data: data?.balance || 0, error };
  },

  // 获取投注历史
  async getBetHistory(userId: string, limit: number = 20): Promise<{ data: BetHistory[]; error: any }> {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          limit,
        }),
      });

      const result = await response.json();
      return { data: result.data || [], error: response.ok ? null : result };
    } catch (error) {
      return { data: [], error };
    }
  },

  // 获取开奖历史
  async getDrawHistory(limit: number = 20): Promise<{ data: Round[]; error: any }> {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'completed')
      .order('draw_time', { ascending: false })
      .limit(limit);
    return { data: data || [], error };
  },
};

// 实时订阅
export const realtimeAPI = {
  // 订阅轮次更新
  subscribeToRounds(callback: (payload: any) => void) {
    return supabase
      .channel('rounds')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rounds' }, 
        callback
      )
      .subscribe();
  },

  // 订阅用户余额更新
  subscribeToUserBalance(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_balance')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  },

  // 取消订阅
  unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  },
};

// 工具函数
export const utils = {
  // 计算潜在收益
  calculatePayout(betAmount: number): number {
    return betAmount * GAME_CONFIG.WINNING_MULTIPLIER;
  },

  // 验证选择的数字
  validateSelectedNumbers(numbers: number[]): boolean {
    if (numbers.length !== GAME_CONFIG.MAX_NUMBERS) return false;
    if (new Set(numbers).size !== numbers.length) return false; // 检查重复
    return numbers.every(num => 
      num >= GAME_CONFIG.NUMBER_RANGE[0] && 
      num <= GAME_CONFIG.NUMBER_RANGE[1]
    );
  },

  // 验证投注金额
  validateBetAmount(amount: number): boolean {
    return amount >= GAME_CONFIG.MIN_BET && amount <= GAME_CONFIG.MAX_BET;
  },

  // 检查是否中奖
  checkWinning(selectedNumbers: number[], winningNumbers: number[]): boolean {
    return selectedNumbers.every(num => winningNumbers.includes(num));
  },

  // 格式化时间
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 计算倒计时
  calculateTimeLeft(endTime: string): number {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  },
};
