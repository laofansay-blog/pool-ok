-- 完整数据库设置脚本 - 可直接在 Supabase Dashboard 中执行
-- 这个文件合并了所有必要的数据库设置

-- ==========================================
-- 第一部分：基础表结构 (schema.sql)
-- ==========================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表 (users) - 扩展 Supabase Auth 的用户信息
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
    total_deposited DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_withdrawn DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_bet DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_won DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 开奖轮次表 (rounds)
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    round_number BIGSERIAL UNIQUE NOT NULL,
    winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'drawing', 'completed', 'cancelled')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    draw_time TIMESTAMPTZ,
    total_bets_count INTEGER DEFAULT 0 NOT NULL,
    total_bet_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_payout DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. 投注表 (bets)
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE NOT NULL,
    selected_numbers INTEGER[] NOT NULL DEFAULT '{}',
    bet_amount DECIMAL(15,2) NOT NULL CHECK (bet_amount > 0),
    potential_payout DECIMAL(15,2) NOT NULL,
    actual_payout DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    is_winner BOOLEAN DEFAULT false NOT NULL,
    matched_numbers INTEGER[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'settled', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    placed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. 充值记录表 (recharges)
CREATE TABLE IF NOT EXISTS public.recharges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'wechat', 'alipay', 'bank_transfer')),
    payment_id TEXT UNIQUE,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. 提现记录表 (withdrawals)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    withdrawal_method TEXT NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'paypal', 'crypto')),
    account_info JSONB NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. 系统配置表 (system_config)
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. 审计日志表 (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON public.rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_start_time ON public.rounds(start_time);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_round_id ON public.bets(round_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);

-- ==========================================
-- 第二部分：函数和触发器 (functions.sql)
-- ==========================================

-- 更新 updated_at 字段的通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表创建 updated_at 触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rounds_updated_at ON public.rounds;
CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bets_updated_at ON public.bets;
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON public.bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户注册时自动创建用户记录的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 创建用户注册触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 第三部分：安全策略 (security.sql)
-- ==========================================

-- 启用行级安全
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view rounds" ON public.rounds;
DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can view own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can insert own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Service role can access system config" ON public.system_config;
DROP POLICY IF EXISTS "Service role can access audit logs" ON public.audit_logs;

-- 用户表策略
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 轮次表策略（所有人可查看）
CREATE POLICY "Anyone can view rounds" ON public.rounds
    FOR SELECT USING (true);

-- 投注表策略
CREATE POLICY "Users can view own bets" ON public.bets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON public.bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 充值记录策略
CREATE POLICY "Users can view own recharges" ON public.recharges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recharges" ON public.recharges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 提现记录策略
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 系统配置策略（只读）
CREATE POLICY "Anyone can view system config" ON public.system_config
    FOR SELECT USING (true);

-- 审计日志策略（只有服务角色可以访问）
CREATE POLICY "Service role can access audit logs" ON public.audit_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ==========================================
-- 第四部分：初始数据和测试数据
-- ==========================================

-- 插入系统配置
INSERT INTO public.system_config (key, value, description) VALUES
('game_settings', '{
    "lottery_interval_minutes": 5,
    "winning_multiplier": 9.8,
    "min_bet_amount": 1,
    "max_bet_amount": 10000,
    "number_range": [1, 10],
    "numbers_to_select": 9,
    "winning_numbers_count": 10
}', '游戏基本设置'),
('maintenance_mode', 'false', '维护模式开关')
ON CONFLICT (key) DO NOTHING;

-- 创建测试轮次（开发环境）
INSERT INTO public.rounds (
    winning_numbers,
    status,
    start_time,
    end_time,
    draw_time
) VALUES 
(ARRAY[1,2,3,4,5,6,7,8,9,10], 'completed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
(ARRAY[2,3,4,5,6,7,8,9,10,1], 'completed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes')
ON CONFLICT (round_number) DO NOTHING;

-- 创建当前进行中的轮次
INSERT INTO public.rounds (
    winning_numbers,
    status,
    start_time,
    end_time
) VALUES 
(ARRAY[0,0,0,0,0,0,0,0,0,0], 'pending', NOW(), NOW() + INTERVAL '5 minutes')
ON CONFLICT (round_number) DO NOTHING;

-- 验证设置
SELECT 'Database setup completed successfully!' as status;
