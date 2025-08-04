-- 数据库初始化脚本
-- 按顺序执行所有数据库设置

-- 1. 首先执行基础表结构
\i schema.sql

-- 2. 然后创建函数和触发器
\i functions.sql

-- 3. 最后设置安全策略
\i security.sql

-- 4. 插入测试数据（仅在开发环境）
-- 注意：在生产环境中请注释掉这部分

-- 创建测试轮次
INSERT INTO public.rounds (
    round_number,
    winning_numbers,
    status,
    start_time,
    end_time,
    draw_time
) VALUES 
(1, ARRAY[1,2,3,4,5,6,7,8,9,10], 'completed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
(2, ARRAY[2,3,4,5,6,7,8,9,10,1], 'completed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
(3, ARRAY[3,4,5,6,7,8,9,10,1,2], 'completed', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes');

-- 创建当前进行中的轮次
INSERT INTO public.rounds (
    round_number,
    winning_numbers,
    status,
    start_time,
    end_time
) VALUES 
(4, ARRAY[0,0,0,0,0,0,0,0,0,0], 'pending', NOW(), NOW() + INTERVAL '5 minutes');

-- 验证数据库设置
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- 检查表数量
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- 检查函数数量
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';
    
    -- 检查触发器数量
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- 检查策略数量
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '数据库初始化完成:';
    RAISE NOTICE '- 表数量: %', table_count;
    RAISE NOTICE '- 函数数量: %', function_count;
    RAISE NOTICE '- 触发器数量: %', trigger_count;
    RAISE NOTICE '- 安全策略数量: %', policy_count;
    
    -- 验证关键表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION '用户表创建失败';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rounds' AND table_schema = 'public') THEN
        RAISE EXCEPTION '轮次表创建失败';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bets' AND table_schema = 'public') THEN
        RAISE EXCEPTION '投注表创建失败';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recharges' AND table_schema = 'public') THEN
        RAISE EXCEPTION '充值表创建失败';
    END IF;
    
    RAISE NOTICE '所有关键表验证通过！';
END $$;
