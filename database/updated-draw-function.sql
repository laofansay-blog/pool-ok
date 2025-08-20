-- 更新后的开奖函数 - 合并 scheduled-lottery-v2 的逻辑
CREATE OR REPLACE FUNCTION public.draw_current_round()
RETURNS JSONB AS $$
DECLARE
    current_round RECORD;
    winning_nums INTEGER[];
    total_winners INTEGER := 0;
    total_payout_amount DECIMAL(15,2) := 0;
    bet_record RECORD;
    selected_numbers_obj JSONB;
    metadata_obj JSONB;
    is_winner BOOLEAN;
    actual_payout DECIMAL(15,2);
    matched_numbers_array INTEGER[];
    result JSONB;
    draw_time TIMESTAMPTZ;
BEGIN
    -- 设置开奖时间
    draw_time := NOW();
    
    -- 获取当前进行中的轮次
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
        draw_time = draw_time,
        winning_numbers = winning_nums
    WHERE id = current_round.id;
    
    RAISE NOTICE '✅ 轮次状态更新成功';
    
    -- 查询该轮次的所有投注记录
    RAISE NOTICE '🔍 查询投注记录...';
    
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
            is_winner := false;
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
                            is_winner := true;
                            matched_numbers_array := matched_numbers_array || winning_number;
                        END IF;
                    END IF;
                END;
            END LOOP;
            
            RAISE NOTICE '  🎯 %', CASE WHEN is_winner THEN '✅ 中奖' ELSE '❌ 未中奖' END;
            
            -- 计算赔付金额（使用 scheduled-lottery-v2 的精确计算）
            actual_payout := 0;
            IF is_winner AND metadata_obj ? 'original_bets' THEN
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
                                actual_payout := actual_payout + (bet_amount * 9.8);
                            END IF;
                        END IF;
                    END LOOP;
                END;
            END IF;
            
            IF is_winner THEN
                RAISE NOTICE '  💰 赔付: %元', actual_payout;
                total_winners := total_winners + 1;
                total_payout_amount := total_payout_amount + actual_payout;
            END IF;
            
            -- 更新投注记录
            RAISE NOTICE '  🔄 更新投注记录...';
            UPDATE public.bets
            SET
                is_winner = is_winner,
                actual_payout = actual_payout,
                matched_numbers = winning_nums,  -- 存储所有开奖数字（与 v2 一致）
                status = 'settled',
                settled_at = draw_time
            WHERE id = bet_record.id;
            
            RAISE NOTICE '  ✅ 投注记录更新成功';
            
            -- 更新用户余额（如果中奖）
            IF is_winner AND actual_payout > 0 THEN
                RAISE NOTICE '  💳 更新用户余额: +%元', actual_payout;
                UPDATE public.users
                SET 
                    balance = balance + actual_payout,
                    total_won = total_won + actual_payout
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
