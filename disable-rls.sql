-- 关闭所有表的RLS（行级安全）
-- 注意：这会移除所有数据访问限制，请谨慎使用

-- 关闭 bets 表的 RLS
ALTER TABLE bets DISABLE ROW LEVEL SECURITY;

-- 关闭 rounds 表的 RLS
ALTER TABLE rounds DISABLE ROW LEVEL SECURITY;

-- 关闭 users 表的 RLS（如果存在）
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 删除现有的 RLS 策略（可选）
-- DROP POLICY IF EXISTS "Users can view their own bets" ON bets;
-- DROP POLICY IF EXISTS "Users can insert their own bets" ON bets;
-- DROP POLICY IF EXISTS "Users can update their own bets" ON bets;

-- 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('bets', 'rounds')
ORDER BY tablename;
