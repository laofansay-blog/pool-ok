-- 清理脚本 - 删除所有现有的表和策略
-- ⚠️ 警告：这会删除所有数据！只在开发环境使用

-- 删除所有 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view rounds" ON public.rounds;
DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can view own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can insert own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;
DROP POLICY IF EXISTS "Service role can access system config" ON public.system_config;
DROP POLICY IF EXISTS "Service role can access audit logs" ON public.audit_logs;

-- 删除触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_rounds_updated_at ON public.rounds;
DROP TRIGGER IF EXISTS update_bets_updated_at ON public.bets;
DROP TRIGGER IF EXISTS update_recharges_updated_at ON public.recharges;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;

-- 删除函数
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 删除表（按依赖关系顺序）
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.recharges CASCADE;
DROP TABLE IF EXISTS public.rounds CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 删除序列
DROP SEQUENCE IF EXISTS public.rounds_round_number_seq CASCADE;

SELECT 'Database cleanup completed!' as status;
