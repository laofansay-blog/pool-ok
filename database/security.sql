-- 行级安全策略 (Row Level Security)

-- 启用所有表的 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users 表策略
-- 用户只能查看和更新自己的记录
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 2. Rounds 表策略
-- 所有认证用户都可以查看已完成的开奖轮次
CREATE POLICY "Authenticated users can view completed rounds" ON public.rounds
    FOR SELECT USING (
        auth.role() = 'authenticated' AND status = 'completed'
    );

-- 管理员可以管理所有轮次
CREATE POLICY "Admins can manage all rounds" ON public.rounds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 3. Bets 表策略
-- 用户只能查看自己的投注记录
CREATE POLICY "Users can view own bets" ON public.bets
    FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建自己的投注
CREATE POLICY "Users can create own bets" ON public.bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有投注
CREATE POLICY "Admins can view all bets" ON public.bets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 系统可以更新投注状态（通过服务角色）
CREATE POLICY "Service role can update bets" ON public.bets
    FOR UPDATE USING (auth.role() = 'service_role');

-- 4. Recharges 表策略
-- 用户只能查看自己的充值记录
CREATE POLICY "Users can view own recharges" ON public.recharges
    FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建自己的充值记录
CREATE POLICY "Users can create own recharges" ON public.recharges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以管理所有充值记录
CREATE POLICY "Admins can manage all recharges" ON public.recharges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 系统可以更新充值状态
CREATE POLICY "Service role can update recharges" ON public.recharges
    FOR UPDATE USING (auth.role() = 'service_role');

-- 5. Withdrawals 表策略
-- 用户只能查看自己的提现记录
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建自己的提现申请
CREATE POLICY "Users can create own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以管理所有提现记录
CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 6. System Config 表策略
-- 只有管理员可以管理系统配置
CREATE POLICY "Only admins can manage system config" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 认证用户可以读取公开配置
CREATE POLICY "Authenticated users can read public config" ON public.system_config
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND key NOT LIKE 'secret_%' 
        AND key NOT LIKE 'admin_%'
    );

-- 7. Audit Logs 表策略
-- 用户只能查看自己的审计日志
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以查看所有审计日志
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin.%')
        )
    );

-- 系统可以创建审计日志
CREATE POLICY "Service role can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 创建一些有用的视图
-- 1. 用户统计视图
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.balance,
    u.total_deposited,
    u.total_withdrawn,
    u.total_bet,
    u.total_won,
    COALESCE(bet_stats.total_bets, 0) as total_bets,
    COALESCE(bet_stats.winning_bets, 0) as winning_bets,
    CASE 
        WHEN COALESCE(bet_stats.total_bets, 0) > 0 
        THEN ROUND((COALESCE(bet_stats.winning_bets, 0)::DECIMAL / bet_stats.total_bets) * 100, 2)
        ELSE 0 
    END as win_rate_percentage,
    u.created_at,
    u.last_login_at
FROM public.users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_bets,
        COUNT(*) FILTER (WHERE is_winner = true) as winning_bets
    FROM public.bets 
    WHERE status = 'settled'
    GROUP BY user_id
) bet_stats ON u.id = bet_stats.user_id;

-- 2. 轮次统计视图
CREATE OR REPLACE VIEW public.round_stats AS
SELECT 
    r.id,
    r.round_number,
    r.winning_numbers,
    r.status,
    r.start_time,
    r.end_time,
    r.draw_time,
    COALESCE(bet_stats.total_bets, 0) as total_bets,
    COALESCE(bet_stats.total_bet_amount, 0) as total_bet_amount,
    COALESCE(bet_stats.winning_bets, 0) as winning_bets,
    COALESCE(bet_stats.total_payout, 0) as total_payout,
    r.created_at
FROM public.rounds r
LEFT JOIN (
    SELECT 
        round_id,
        COUNT(*) as total_bets,
        SUM(bet_amount) as total_bet_amount,
        COUNT(*) FILTER (WHERE is_winner = true) as winning_bets,
        SUM(actual_payout) as total_payout
    FROM public.bets 
    GROUP BY round_id
) bet_stats ON r.id = bet_stats.round_id;

-- 插入默认系统配置
INSERT INTO public.system_config (key, value, description) VALUES
('game_settings', '{
    "lottery_interval_minutes": 5,
    "winning_multiplier": 9.8,
    "max_bet_amount": 10000,
    "min_bet_amount": 1,
    "max_numbers_to_select": 9,
    "number_range": [1, 10],
    "total_winning_numbers": 10
}', '游戏基本设置'),
('maintenance_mode', 'false', '维护模式开关'),
('registration_enabled', 'true', '是否允许新用户注册'),
('betting_enabled', 'true', '是否允许下注'),
('withdrawal_enabled', 'true', '是否允许提现'),
('min_withdrawal_amount', '100', '最小提现金额'),
('max_withdrawal_amount', '50000', '最大提现金额'),
('withdrawal_fee_percentage', '0.02', '提现手续费百分比'),
('daily_withdrawal_limit', '100000', '每日提现限额')
ON CONFLICT (key) DO NOTHING;
