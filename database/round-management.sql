-- 轮次管理系统 - 5分钟一轮自动创建

-- 1. 创建新轮次的函数
CREATE OR REPLACE FUNCTION public.create_new_round()
RETURNS JSONB AS $$
DECLARE
    new_round_id UUID;
    new_round_number BIGINT;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    result JSONB;
BEGIN
    -- 设置轮次时间（5分钟一轮）
    start_time := NOW();
    end_time := start_time + INTERVAL '5 minutes';
    
    -- 创建新轮次
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
    
    -- 返回结果
    result := jsonb_build_object(
        'success', true,
        'round_id', new_round_id,
        'round_number', new_round_number,
        'start_time', start_time,
        'end_time', end_time,
        'message', '新轮次创建成功'
    );
    
    RAISE NOTICE '创建新轮次: %, 开始时间: %, 结束时间: %', 
        new_round_number, start_time, end_time;
    
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
CREATE OR REPLACE FUNCTION public.draw_current_round()
RETURNS JSONB AS $$
DECLARE
    current_round RECORD;
    winning_nums INTEGER[];
    total_winners INTEGER := 0;
    total_payout_amount DECIMAL(15,2) := 0;
    bet_record RECORD;
    matched_count INTEGER;
    matched_numbers_array INTEGER[];
    bet_group INTEGER;
    payout_amount DECIMAL(15,2);
    result JSONB;
BEGIN
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
    
    -- 生成随机中奖号码 (每组随机一个1-10的数字，共10组)
    SELECT ARRAY(
        SELECT (random() * 9 + 1)::INTEGER
        FROM generate_series(1, 10)
    ) INTO winning_nums;
    
    -- 更新轮次状态为开奖中
    UPDATE public.rounds
    SET 
        status = 'drawing',
        draw_time = NOW(),
        winning_numbers = winning_nums
    WHERE id = current_round.id;
    
    -- 处理所有该轮次的投注
    FOR bet_record IN 
        SELECT * FROM public.bets 
        WHERE round_id = current_round.id 
        AND status = 'pending'
    LOOP
        -- 计算每组的中奖情况（使用新的JSON格式）
        payout_amount := 0;
        matched_numbers_array := ARRAY[]::INTEGER[];
        matched_count := 0;

        -- 遍历每组检查中奖情况
        FOR bet_group IN 1..10 LOOP
            -- 检查该组是否有投注（selected_numbers中该组不为空）
            IF bet_record.selected_numbers ? bet_group::TEXT AND
               jsonb_array_length(bet_record.selected_numbers->bet_group::TEXT) > 0 THEN

                DECLARE
                    group_numbers INTEGER[];
                    group_bet_amount DECIMAL(15,2) := 0;
                BEGIN
                    -- 从selected_numbers中获取该组的数字
                    SELECT ARRAY(
                        SELECT jsonb_array_elements_text(bet_record.selected_numbers->bet_group::TEXT)::INTEGER
                    ) INTO group_numbers;

                    -- 计算该组的投注金额
                    SELECT COALESCE(SUM((bet_info->>'amount')::DECIMAL), 0)
                    FROM jsonb_array_elements(bet_record.metadata->'original_bets') AS bet_info
                    WHERE (bet_info->>'group')::INTEGER = bet_group
                    INTO group_bet_amount;

                    -- 检查该组是否中奖
                    IF winning_nums[bet_group] = ANY(group_numbers) THEN
                        matched_numbers_array := matched_numbers_array || winning_nums[bet_group];
                        matched_count := matched_count + 1;
                        payout_amount := payout_amount + (group_bet_amount * 9.8);
                    END IF;
                END;
            END IF;
        END LOOP;

        -- 如果有中奖，标记为中奖用户
        IF matched_count > 0 THEN
            total_winners := total_winners + 1;
        END IF;
        
        total_payout_amount := total_payout_amount + payout_amount;
        
        -- 更新投注记录
        UPDATE public.bets
        SET
            actual_payout = payout_amount,
            is_winner = (matched_count > 0),
            matched_numbers = matched_numbers_array,
            status = 'settled',
            settled_at = NOW()
        WHERE id = bet_record.id;
        
        -- 如果中奖，更新用户余额
        IF payout_amount > 0 THEN
            UPDATE public.users
            SET 
                balance = balance + payout_amount,
                total_won = total_won + payout_amount
            WHERE id = bet_record.user_id;
        END IF;
    END LOOP;
    
    -- 更新轮次最终状态
    UPDATE public.rounds
    SET 
        status = 'completed',
        total_payout = total_payout_amount
    WHERE id = current_round.id;
    
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
    
    RAISE NOTICE '轮次 % 开奖完成，中奖号码: %, 中奖人数: %, 总派奖: %', 
        current_round.round_number, winning_nums, total_winners, total_payout_amount;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', '开奖失败'
    );
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
    
    -- 如果有过期轮次，先开奖
    IF FOUND THEN
        SELECT public.draw_current_round() INTO draw_result;
        final_result := jsonb_set(
            final_result, 
            '{actions}', 
            final_result->'actions' || jsonb_build_object('draw', draw_result)
        );
    END IF;
    
    -- 检查是否需要创建新轮次
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
