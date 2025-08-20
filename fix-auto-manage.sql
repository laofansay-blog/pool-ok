-- 修复 auto_manage_rounds 函数调用问题
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
        SELECT public.draw_current_round(NULL) INTO draw_result;
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

SELECT 'auto_manage_rounds function fixed!' as status;
