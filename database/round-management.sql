-- 轮次管理系统 - 5分钟一轮自动创建

-- 1. 创建新轮次的函数
CREATE OR REPLACE FUNCTION public.create_new_round()
RETURNS JSONB AS $$
DECLARE
    new_round_id UUID;
    new_round_number BIGINT;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    previous_round RECORD;
    draw_result JSONB;
    result JSONB;
BEGIN
    -- 1. 先查询是否有需要开奖的上一轮次
    SELECT * INTO previous_round
    FROM public.rounds
    WHERE status = 'pending'
    AND rounds.end_time <= NOW()
    ORDER BY created_at ASC
    LIMIT 1;

    -- 2. 设置新轮次时间（5分钟一轮）
    start_time := NOW();
    end_time := start_time + INTERVAL '5 minutes';

    -- 4. 创建新轮次
    INSERT INTO public.rounds (
        winning_numbers,
        status,
        start_time,
        end_time,
        total_bets_count,
        total_bet_amount,
        total_payout
    ) VALUES (
        ARRAY[0,0,0,0,0,0,0,0,0,0], -- 占位符，开奖时更新
        'pending',
        start_time,
        end_time,
        0,
        0.00,
        0.00
    ) RETURNING id, round_number INTO new_round_id, new_round_number;

    RAISE NOTICE '✅ 创建新轮次: 第%, 开始时间: %, 结束时间: %',
        new_round_number, start_time, end_time;

    -- 3. 创建新轮次后，如果有过期轮次，立即开奖
    IF previous_round.round_number IS NOT NULL THEN
        RAISE NOTICE '🎲 新轮次创建完成，现在开奖第%期...', previous_round.round_number;
        SELECT public.draw_current_round(previous_round.round_number) INTO draw_result;

        IF draw_result->>'success' = 'true' THEN
            RAISE NOTICE '✅ 第%期开奖完成', previous_round.round_number;
        ELSE
            RAISE NOTICE '❌ 第%期开奖失败: %', previous_round.round_number, draw_result->>'message';
        END IF;
    END IF;

    -- 4. 返回结果
    result := jsonb_build_object(
        'success', true,
        'round_id', new_round_id,
        'round_number', new_round_number,
        'start_time', start_time,
        'end_time', end_time,
        'message', '新轮次创建成功',
        'previous_round_draw', draw_result
    );

    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', '创建轮次失败'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 结束当前轮次并开奖的函数
CREATE OR REPLACE FUNCTION public.draw_current_round(target_round_number BIGINT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    current_round RECORD;
    winning_nums INTEGER[];
    total_winners INTEGER := 0;
    total_payout_amount DECIMAL(15,2) := 0;
    bet_record RECORD;
    selected_numbers_obj JSONB;
    metadata_obj JSONB;
    bet_is_winner BOOLEAN;
    bet_actual_payout DECIMAL(15,2);
    matched_numbers_array INTEGER[];
    result JSONB;
    current_draw_time TIMESTAMPTZ;
BEGIN
    -- 设置开奖时间
    current_draw_time := NOW();
    
    -- 获取要开奖的轮次
    IF target_round_number IS NOT NULL THEN
        -- 指定期数开奖：查询指定期数的轮次
        RAISE NOTICE '🎯 指定开奖第%期...', target_round_number;
        SELECT * INTO current_round
        FROM public.rounds
        WHERE round_number = target_round_number
        AND status IN ('pending', 'completed')  -- 允许重新开奖已完成的轮次
        LIMIT 1;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', '找不到第' || target_round_number || '期轮次'
            );
        END IF;

        -- 如果轮次已完成，重置状态为pending以便重新开奖
        IF current_round.status = 'completed' THEN
            RAISE NOTICE '🔄 重置第%期状态为pending以便重新开奖...', target_round_number;
            UPDATE public.rounds
            SET status = 'pending'
            WHERE id = current_round.id;
            current_round.status := 'pending';
        END IF;
    ELSE
        -- 自动开奖：查询过期的pending轮次
        RAISE NOTICE '🎯 自动开奖过期轮次...';
        SELECT * INTO current_round
        FROM public.rounds
        WHERE status = 'pending'
        AND end_time <= NOW()
        ORDER BY created_at ASC
        LIMIT 1;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', '没有需要开奖的轮次'
            );
        END IF;
    END IF;

    RAISE NOTICE '🎯 开始处理第%期开奖...', current_round.round_number;
    
    -- 生成随机中奖号码 (每组随机一个1-10的数字，共10组)
    SELECT ARRAY(
        SELECT (random() * 9 + 1)::INTEGER
        FROM generate_series(1, 10)
    ) INTO winning_nums;
    
    RAISE NOTICE '🎲 开奖数字: [%]', array_to_string(winning_nums, ', ');
    
    -- 更新轮次状态
    RAISE NOTICE '🔄 更新轮次状态...';
    UPDATE public.rounds
    SET
        status = 'completed',
        draw_time = current_draw_time,
        winning_numbers = winning_nums
    WHERE id = current_round.id;
    
    RAISE NOTICE '✅ 轮次状态更新成功';
    
    -- 查询该轮次的所有投注记录
    RAISE NOTICE '🔍 查询投注记录...';
    RAISE NOTICE '🔍 轮次ID: %', current_round.id;

    -- 先查询该轮次的所有投注记录（不限状态）
    DECLARE
        total_bets_count INTEGER := 0;
        pending_bets_count INTEGER := 0;
    BEGIN
        SELECT COUNT(*) INTO total_bets_count
        FROM public.bets
        WHERE round_id = current_round.id;

        SELECT COUNT(*) INTO pending_bets_count
        FROM public.bets
        WHERE round_id = current_round.id
        AND status = 'pending';

        RAISE NOTICE '🔍 该轮次总投注数: %', total_bets_count;
        RAISE NOTICE '🔍 待结算投注数: %', pending_bets_count;
    END;

    -- 处理每个投注的结算
    FOR bet_record IN
        SELECT * FROM public.bets
        WHERE round_id = current_round.id
        AND status = 'pending'
    LOOP
        RAISE NOTICE '📝 处理投注: %', bet_record.id;
        
        BEGIN
            -- 解析投注数据（处理字符串格式）
            IF pg_typeof(bet_record.selected_numbers) = 'text'::regtype THEN
                selected_numbers_obj := bet_record.selected_numbers::JSONB;
            ELSE
                selected_numbers_obj := bet_record.selected_numbers;
            END IF;
            
            IF pg_typeof(bet_record.metadata) = 'text'::regtype THEN
                metadata_obj := bet_record.metadata::JSONB;
            ELSE
                metadata_obj := bet_record.metadata;
            END IF;
            
            RAISE NOTICE '  📋 投注金额: %', bet_record.bet_amount;
            RAISE NOTICE '  📋 投注组数: %', COALESCE(metadata_obj->>'bet_count', 'unknown');
            
            -- 判断是否中奖（使用 scheduled-lottery-v2 的逻辑）
            bet_is_winner := false;
            matched_numbers_array := ARRAY[]::INTEGER[];
            
            -- 检查每组是否中奖
            FOR i IN 1..10 LOOP
                DECLARE
                    group_key TEXT := i::TEXT;
                    group_numbers INTEGER[];
                    winning_number INTEGER;
                BEGIN
                    -- 检查该组是否有投注
                    IF selected_numbers_obj ? group_key AND
                       jsonb_array_length(selected_numbers_obj->group_key) > 0 THEN
                        
                        -- 获取该组的投注数字
                        SELECT ARRAY(
                            SELECT jsonb_array_elements_text(selected_numbers_obj->group_key)::INTEGER
                        ) INTO group_numbers;
                        
                        -- 获取该组的开奖数字
                        winning_number := winning_nums[i];
                        
                        -- 检查是否中奖
                        IF winning_number = ANY(group_numbers) THEN
                            bet_is_winner := true;
                            matched_numbers_array := matched_numbers_array || winning_number;
                        END IF;
                    END IF;
                END;
            END LOOP;
            
            RAISE NOTICE '  🎯 %', CASE WHEN bet_is_winner THEN '✅ 中奖' ELSE '❌ 未中奖' END;

            -- 计算赔付金额（使用 scheduled-lottery-v2 的精确计算）
            bet_actual_payout := 0;
            IF bet_is_winner AND metadata_obj ? 'original_bets' THEN
                DECLARE
                    original_bet JSONB;
                    bet_group INTEGER;
                    bet_number INTEGER;
                    bet_amount DECIMAL(15,2);
                    winning_number INTEGER;
                BEGIN
                    -- 遍历每一注投注
                    FOR original_bet IN SELECT * FROM jsonb_array_elements(metadata_obj->'original_bets')
                    LOOP
                        bet_group := (original_bet->>'group')::INTEGER;
                        bet_number := (original_bet->>'number')::INTEGER;
                        bet_amount := (original_bet->>'amount')::DECIMAL;
                        
                        -- 检查这一注是否中奖
                        IF bet_group >= 1 AND bet_group <= 10 THEN
                            winning_number := winning_nums[bet_group];
                            IF bet_number = winning_number THEN
                                bet_actual_payout := bet_actual_payout + (bet_amount * 9.8);
                            END IF;
                        END IF;
                    END LOOP;
                END;
            END IF;
            
            IF bet_is_winner THEN
                RAISE NOTICE '  💰 赔付: %元', bet_actual_payout;
                total_winners := total_winners + 1;
                total_payout_amount := total_payout_amount + bet_actual_payout;
            END IF;
            
            -- 更新投注记录
            RAISE NOTICE '  🔄 更新投注记录...';
            RAISE NOTICE '  📝 投注ID: %, 中奖: %, 赔付: %元', bet_record.id, bet_is_winner, bet_actual_payout;
            UPDATE public.bets
            SET
                is_winner = bet_is_winner,
                actual_payout = bet_actual_payout,
                matched_numbers = winning_nums,
                status = 'settled',
                settled_at = current_draw_time
            WHERE id = bet_record.id;
            
            RAISE NOTICE '  ✅ 投注记录更新成功';
            
            -- 更新用户余额（如果中奖）
            IF bet_is_winner AND bet_actual_payout > 0 THEN
                RAISE NOTICE '  💳 更新用户余额: +%元', bet_actual_payout;
                UPDATE public.users
                SET
                    balance = balance + bet_actual_payout,
                    total_won = total_won + bet_actual_payout
                WHERE id = bet_record.user_id;
                RAISE NOTICE '  ✅ 用户余额更新成功';
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '  ❌ 处理投注 % 时出错: %', bet_record.id, SQLERRM;
            -- 继续处理下一笔投注，不中断整个流程
        END;
    END LOOP;
    
    -- 更新轮次总赔付
    RAISE NOTICE '🔄 更新轮次总赔付: %元', total_payout_amount;
    UPDATE public.rounds
    SET total_payout = total_payout_amount
    WHERE id = current_round.id;
    RAISE NOTICE '✅ 轮次总赔付更新成功';
    
    -- 返回开奖结果
    result := jsonb_build_object(
        'success', true,
        'round_number', current_round.round_number,
        'winning_numbers', winning_nums,
        'total_bets', current_round.total_bets_count,
        'total_bet_amount', current_round.total_bet_amount,
        'total_winners', total_winners,
        'total_payout', total_payout_amount,
        'message', '开奖完成'
    );
    
    RAISE NOTICE '🎉 第%期开奖完成! %/% 中奖，总赔付 %元', 
        current_round.round_number, total_winners, current_round.total_bets_count, total_payout_amount;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ 开奖过程中出错: %', SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', '开奖失败'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.1. 指定期数开奖的函数
CREATE OR REPLACE FUNCTION public.draw_specific_round(target_round_number BIGINT)
RETURNS JSONB AS $$
BEGIN
    -- 调用主开奖函数，传入指定期数
    RETURN public.draw_current_round(target_round_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 自动轮次管理函数（检查并创建新轮次）
CREATE OR REPLACE FUNCTION public.auto_manage_rounds()
RETURNS JSONB AS $$
DECLARE
    current_round RECORD;
    draw_result JSONB;
    create_result JSONB;
    final_result JSONB := jsonb_build_object('actions', jsonb_build_array());
BEGIN
    -- 检查是否有需要开奖的轮次
    SELECT * INTO current_round
    FROM public.rounds
    WHERE status = 'pending'
    AND end_time <= NOW()
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- 检查是否需要创建新轮次（创建时会自动开奖上一轮次）
    IF NOT EXISTS (
        SELECT 1 FROM public.rounds
        WHERE status = 'pending'
        AND end_time > NOW()
    ) THEN
        SELECT public.create_new_round() INTO create_result;
        final_result := jsonb_set(
            final_result,
            '{actions}',
            final_result->'actions' || jsonb_build_object('create', create_result)
        );
    END IF;
    
    -- 如果没有任何操作
    IF jsonb_array_length(final_result->'actions') = 0 THEN
        final_result := jsonb_build_object(
            'success', true,
            'message', '当前轮次正常运行中',
            'actions', jsonb_build_array()
        );
    ELSE
        final_result := jsonb_set(final_result, '{success}', 'true');
    END IF;
    
    RETURN final_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', '自动管理轮次失败'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 获取当前轮次信息的函数
CREATE OR REPLACE FUNCTION public.get_current_round()
RETURNS JSONB AS $$
DECLARE
    current_round RECORD;
    time_remaining INTERVAL;
    result JSONB;
BEGIN
    -- 获取当前进行中的轮次
    SELECT * INTO current_round
    FROM public.rounds
    WHERE status = 'pending'
    AND start_time <= NOW()
    AND end_time > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '当前没有进行中的轮次'
        );
    END IF;
    
    -- 计算剩余时间
    time_remaining := current_round.end_time - NOW();
    
    result := jsonb_build_object(
        'success', true,
        'round_id', current_round.id,
        'round_number', current_round.round_number,
        'status', current_round.status,
        'start_time', current_round.start_time,
        'end_time', current_round.end_time,
        'time_remaining_seconds', EXTRACT(EPOCH FROM time_remaining),
        'total_bets_count', current_round.total_bets_count,
        'total_bet_amount', current_round.total_bet_amount
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建定时任务（需要pg_cron扩展，如果没有可以用应用层定时器）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('auto-round-management', '*/1 * * * *', 'SELECT public.auto_manage_rounds();');

SELECT 'Round management functions created successfully!' as status;
