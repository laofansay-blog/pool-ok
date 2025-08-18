-- 快速修复轮次问题

-- 1. 检查当前轮次状态
DO $$
DECLARE
    current_round RECORD;
    round_count INTEGER;
BEGIN
    -- 统计轮次数量
    SELECT COUNT(*) INTO round_count FROM public.rounds;
    RAISE NOTICE '总轮次数量: %', round_count;
    
    -- 检查进行中的轮次
    SELECT COUNT(*) INTO round_count 
    FROM public.rounds 
    WHERE status = 'pending' AND end_time > NOW();
    RAISE NOTICE '进行中的轮次数量: %', round_count;
    
    -- 检查过期的轮次
    SELECT COUNT(*) INTO round_count 
    FROM public.rounds 
    WHERE status = 'pending' AND end_time <= NOW();
    RAISE NOTICE '过期待开奖的轮次数量: %', round_count;
    
    -- 显示最近的轮次
    FOR current_round IN 
        SELECT round_number, status, start_time, end_time, 
               CASE WHEN end_time > NOW() THEN '进行中' ELSE '已过期' END as round_status
        FROM public.rounds 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '轮次 %: 状态=%, 时间=% 到 %, %', 
            current_round.round_number, 
            current_round.status, 
            current_round.start_time, 
            current_round.end_time,
            current_round.round_status;
    END LOOP;
END $$;

-- 2. 自动修复：开奖过期轮次并创建新轮次
SELECT public.auto_manage_rounds() as auto_fix_result;

-- 3. 再次检查状态
SELECT public.get_current_round() as current_round_status;

-- 4. 如果还是没有进行中的轮次，强制创建一个
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.rounds 
        WHERE status = 'pending' 
        AND end_time > NOW()
    ) THEN
        PERFORM public.create_new_round();
        RAISE NOTICE '强制创建了新轮次';
    ELSE
        RAISE NOTICE '当前有进行中的轮次，无需创建';
    END IF;
END $$;

-- 5. 最终状态检查
SELECT 
    round_number,
    status,
    start_time,
    end_time,
    CASE 
        WHEN end_time > NOW() THEN EXTRACT(EPOCH FROM (end_time - NOW()))
        ELSE 0 
    END as seconds_remaining,
    total_bets_count,
    total_bet_amount
FROM public.rounds 
WHERE status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;

SELECT '轮次修复完成！' as message;
