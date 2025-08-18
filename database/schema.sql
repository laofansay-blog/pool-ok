-- 中世纪风格赌坊游戏数据库设计
-- 使用 Supabase PostgreSQL

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
    winning_numbers INTEGER[] NOT NULL CHECK (array_length(winning_numbers, 1) = 10),
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
    selected_numbers JSONB NOT NULL DEFAULT '{}',  -- 改为JSONB格式存储分组投注
    bet_amount DECIMAL(15,2) NOT NULL CHECK (bet_amount > 0),
    potential_payout DECIMAL(15,2) NOT NULL,
    actual_payout DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    is_winner BOOLEAN DEFAULT false NOT NULL,
    matched_numbers INTEGER[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'settled', 'cancelled')),
    metadata JSONB DEFAULT '{}',  -- 保留元数据字段存储其他信息
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_balance ON public.users(balance);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_rounds_round_number ON public.rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON public.rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_start_time ON public.rounds(start_time);
CREATE INDEX IF NOT EXISTS idx_rounds_end_time ON public.rounds(end_time);

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_round_id ON public.bets(round_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_is_winner ON public.bets(is_winner);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON public.bets(placed_at);

CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON public.recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_status ON public.recharges(status);
CREATE INDEX IF NOT EXISTS idx_recharges_payment_id ON public.recharges(payment_id);
CREATE INDEX IF NOT EXISTS idx_recharges_created_at ON public.recharges(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
