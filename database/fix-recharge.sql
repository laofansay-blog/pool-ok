-- 修复充值余额更新问题

-- 1. 创建处理充值成功的函数
CREATE OR REPLACE FUNCTION public.process_successful_recharge()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有当状态从非 completed 变为 completed 时才处理
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- 更新用户余额和总充值金额
        UPDATE public.users 
        SET 
            balance = balance + NEW.amount,
            total_deposited = total_deposited + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 记录审计日志
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            NEW.user_id,
            'recharge_completed',
            'recharges',
            NEW.id,
            jsonb_build_object(
                'amount', NEW.amount,
                'payment_method', NEW.payment_method,
                'payment_id', NEW.payment_id
            )
        );
        
        RAISE NOTICE '用户 % 充值成功，金额: %', NEW.user_id, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS trigger_process_successful_recharge ON public.recharges;
CREATE TRIGGER trigger_process_successful_recharge
    AFTER UPDATE ON public.recharges
    FOR EACH ROW
    EXECUTE FUNCTION public.process_successful_recharge();

-- 3. 创建处理提现的函数
CREATE OR REPLACE FUNCTION public.process_successful_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有当状态从非 completed 变为 completed 时才处理
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- 记录审计日志（余额已在申请时扣除）
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            NEW.user_id,
            'withdrawal_completed',
            'withdrawals',
            NEW.id,
            jsonb_build_object(
                'amount', NEW.amount,
                'withdrawal_method', NEW.withdrawal_method
            )
        );
        
        RAISE NOTICE '用户 % 提现完成，金额: %', NEW.user_id, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 4. 创建提现触发器
DROP TRIGGER IF EXISTS trigger_process_successful_withdrawal ON public.withdrawals;
CREATE TRIGGER trigger_process_successful_withdrawal
    AFTER UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.process_successful_withdrawal();

-- 5. 修复现有的未处理充值记录
DO $$
DECLARE
    recharge_record RECORD;
BEGIN
    -- 查找所有已完成但可能没有更新余额的充值记录
    FOR recharge_record IN 
        SELECT r.*, u.balance, u.total_deposited
        FROM public.recharges r
        JOIN public.users u ON r.user_id = u.id
        WHERE r.status = 'completed'
        AND r.processed_at IS NOT NULL
        ORDER BY r.created_at DESC
    LOOP
        -- 检查这笔充值是否已经处理过
        -- 简单检查：如果用户的 total_deposited 小于所有已完成充值的总和，说明有遗漏
        DECLARE
            total_completed_recharges DECIMAL(15,2);
        BEGIN
            SELECT COALESCE(SUM(amount), 0) 
            INTO total_completed_recharges
            FROM public.recharges 
            WHERE user_id = recharge_record.user_id 
            AND status = 'completed';
            
            -- 如果总充值金额不匹配，更新用户余额
            IF recharge_record.total_deposited < total_completed_recharges THEN
                UPDATE public.users 
                SET 
                    balance = balance + (total_completed_recharges - total_deposited),
                    total_deposited = total_completed_recharges,
                    updated_at = NOW()
                WHERE id = recharge_record.user_id;
                
                RAISE NOTICE '修复用户 % 的余额，增加: %', 
                    recharge_record.user_id, 
                    (total_completed_recharges - recharge_record.total_deposited);
            END IF;
        END;
    END LOOP;
END $$;

-- 6. 创建手动处理充值的函数（用于测试）
CREATE OR REPLACE FUNCTION public.manual_process_recharge(recharge_id UUID)
RETURNS JSONB AS $$
DECLARE
    recharge_record RECORD;
    user_record RECORD;
    result JSONB;
BEGIN
    -- 获取充值记录
    SELECT * INTO recharge_record
    FROM public.recharges
    WHERE id = recharge_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', '充值记录不存在');
    END IF;
    
    -- 获取用户记录
    SELECT * INTO user_record
    FROM public.users
    WHERE id = recharge_record.user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', '用户不存在');
    END IF;
    
    -- 更新充值状态为已完成
    UPDATE public.recharges
    SET 
        status = 'completed',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = recharge_id;
    
    -- 触发器会自动处理余额更新
    
    -- 返回结果
    SELECT * INTO user_record FROM public.users WHERE id = recharge_record.user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '充值处理成功',
        'recharge_amount', recharge_record.amount,
        'new_balance', user_record.balance,
        'total_deposited', user_record.total_deposited
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 7. 检查修复结果
SELECT 
    u.id,
    u.email,
    u.balance,
    u.total_deposited,
    COUNT(r.id) as recharge_count,
    COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.amount ELSE 0 END), 0) as completed_recharges
FROM public.users u
LEFT JOIN public.recharges r ON u.id = r.user_id
GROUP BY u.id, u.email, u.balance, u.total_deposited
ORDER BY u.created_at DESC;

SELECT 'Recharge fix completed!' as status;
