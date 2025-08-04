-- 快速修复脚本 - 解决常见的下注问题

-- 1. 确保 bets 表有正确的结构
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. 检查并创建测试轮次（如果不存在）
DO $$
BEGIN
    -- 检查是否有进行中的轮次
    IF NOT EXISTS (SELECT 1 FROM public.rounds WHERE status = 'pending') THEN
        -- 创建一个测试轮次
        INSERT INTO public.rounds (
            winning_numbers,
            status,
            start_time,
            end_time,
            total_bets_count,
            total_bet_amount
        ) VALUES (
            ARRAY[0,0,0,0,0,0,0,0,0,0], -- 占位符，开奖时会更新
            'pending',
            NOW(),
            NOW() + INTERVAL '2 hours',
            0,
            0.00
        );
        
        RAISE NOTICE '创建了新的测试轮次';
    END IF;
END $$;

-- 3. 创建测试用户（如果不存在）
DO $$
BEGIN
    -- 检查是否有测试用户
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@example.com') THEN
        -- 注意：这里只是为了测试，实际用户应该通过注册流程创建
        RAISE NOTICE '请通过前端注册测试用户: test@example.com / test123456';
    END IF;
END $$;

-- 4. 检查表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'rounds', 'bets')
ORDER BY table_name, ordinal_position;

-- 5. 检查当前数据状态
SELECT 'rounds' as table_name, count(*) as count FROM public.rounds
UNION ALL
SELECT 'users' as table_name, count(*) as count FROM public.users
UNION ALL
SELECT 'bets' as table_name, count(*) as count FROM public.bets;

-- 6. 显示当前进行中的轮次
SELECT 
    id,
    round_number,
    status,
    start_time,
    end_time,
    total_bets_count,
    total_bet_amount
FROM public.rounds 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- 7. 修复可能的约束问题
-- 移除可能导致问题的约束
ALTER TABLE public.rounds ALTER COLUMN winning_numbers DROP NOT NULL;
ALTER TABLE public.rounds ALTER COLUMN winning_numbers SET DEFAULT '{}';

-- 8. 确保 RLS 策略正确
-- 临时禁用 RLS 进行测试（仅开发环境）
-- ALTER TABLE public.bets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rounds DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

SELECT 'Quick fix script completed!' as status;
