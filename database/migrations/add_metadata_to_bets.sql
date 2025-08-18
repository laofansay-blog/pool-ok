-- 修改 bets 表结构，将 selected_numbers 改为 JSONB 格式
-- 执行时间：2024-12-01
-- 注意：历史数据已清理，此脚本为新投注数据结构做准备

-- 1. 删除旧的 selected_numbers 列（如果存在）
ALTER TABLE public.bets
DROP COLUMN IF EXISTS selected_numbers CASCADE;

-- 2. 添加新的 selected_numbers 列（JSONB 格式）
ALTER TABLE public.bets
ADD COLUMN selected_numbers JSONB NOT NULL DEFAULT '{}';

-- 3. 添加 metadata 字段（如果不存在）
ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. 为 selected_numbers 字段添加索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_bets_selected_numbers
ON public.bets USING GIN (selected_numbers);

-- 5. 为 metadata 字段添加索引
CREATE INDEX IF NOT EXISTS idx_bets_metadata
ON public.bets USING GIN (metadata);

-- 6. 验证表结构
\d public.bets;

-- 7. 确认表为空（历史数据已清理）
SELECT COUNT(*) as total_bets FROM public.bets;

-- 8. 测试插入新格式数据
INSERT INTO public.bets (
    user_id,
    round_id,
    selected_numbers,
    bet_amount,
    potential_payout,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,  -- 测试用户ID
    '00000000-0000-0000-0000-000000000001'::uuid,  -- 测试轮次ID
    '{"1": [1,2,3], "2": [4,5], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": []}'::jsonb,
    15.00,
    147.00,
    '{"original_bets": [{"group": 1, "number": 1, "amount": 3}, {"group": 1, "number": 2, "amount": 3}, {"group": 1, "number": 3, "amount": 3}, {"group": 2, "number": 4, "amount": 3}, {"group": 2, "number": 5, "amount": 3}]}'::jsonb
) ON CONFLICT DO NOTHING;

-- 9. 验证新格式数据
SELECT
    id,
    selected_numbers,
    selected_numbers->'1' as group_1_numbers,
    selected_numbers->'2' as group_2_numbers,
    metadata->'original_bets' as original_bets,
    bet_amount,
    created_at
FROM public.bets
WHERE selected_numbers != '{}';

-- 10. 测试查询特定组的投注
SELECT
    id,
    jsonb_array_length(selected_numbers->'1') as group_1_count,
    jsonb_array_length(selected_numbers->'2') as group_2_count
FROM public.bets
WHERE selected_numbers->'1' != '[]'::jsonb OR selected_numbers->'2' != '[]'::jsonb;

-- 11. 清理测试数据
DELETE FROM public.bets WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
