-- 数据库函数和触发器

-- 1. 更新 updated_at 字段的通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 为所有表创建 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON public.bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharges_updated_at BEFORE UPDATE ON public.recharges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. 用户注册时自动创建用户记录的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 4. 创建用户注册触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 处理充值成功后更新用户余额的函数
CREATE OR REPLACE FUNCTION public.process_successful_recharge()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有当状态从非completed变为completed时才处理
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- 更新用户余额和总充值金额
        UPDATE public.users 
        SET 
            balance = balance + NEW.amount,
            total_deposited = total_deposited + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 记录审计日志
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (
            NEW.user_id,
            'recharge_completed',
            'recharges',
            NEW.id,
            jsonb_build_object('amount', NEW.amount, 'payment_method', NEW.payment_method)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 6. 创建充值状态更新触发器
CREATE TRIGGER on_recharge_status_updated
    AFTER UPDATE ON public.recharges
    FOR EACH ROW EXECUTE FUNCTION public.process_successful_recharge();

-- 7. 处理投注时扣除用户余额的函数
CREATE OR REPLACE FUNCTION public.process_bet_placement()
RETURNS TRIGGER AS $$
DECLARE
    user_balance DECIMAL(15,2);
BEGIN
    -- 检查用户余额是否足够
    SELECT balance INTO user_balance FROM public.users WHERE id = NEW.user_id;
    
    IF user_balance < NEW.bet_amount THEN
        RAISE EXCEPTION '余额不足，当前余额: %, 下注金额: %', user_balance, NEW.bet_amount;
    END IF;
    
    -- 扣除用户余额
    UPDATE public.users 
    SET 
        balance = balance - NEW.bet_amount,
        total_bet = total_bet + NEW.bet_amount,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- 记录审计日志
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
        NEW.user_id,
        'bet_placed',
        'bets',
        NEW.id,
        jsonb_build_object('bet_amount', NEW.bet_amount, 'selected_numbers', NEW.selected_numbers)
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 8. 创建投注触发器
CREATE TRIGGER on_bet_placed
    AFTER INSERT ON public.bets
    FOR EACH ROW EXECUTE FUNCTION public.process_bet_placement();

-- 9. 处理中奖结算的函数
CREATE OR REPLACE FUNCTION public.process_bet_settlement()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有当状态从pending变为settled且是中奖时才处理
    IF OLD.status = 'pending' AND NEW.status = 'settled' AND NEW.is_winner = true THEN
        -- 更新用户余额
        UPDATE public.users 
        SET 
            balance = balance + NEW.actual_payout,
            total_won = total_won + NEW.actual_payout,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 记录审计日志
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (
            NEW.user_id,
            'bet_won',
            'bets',
            NEW.id,
            jsonb_build_object('payout', NEW.actual_payout, 'matched_numbers', NEW.matched_numbers)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 10. 创建投注结算触发器
CREATE TRIGGER on_bet_settled
    AFTER UPDATE ON public.bets
    FOR EACH ROW EXECUTE FUNCTION public.process_bet_settlement();

-- 11. 生成随机开奖数字的函数
CREATE OR REPLACE FUNCTION public.generate_winning_numbers()
RETURNS INTEGER[] AS $$
DECLARE
    numbers INTEGER[] := '{}';
    random_num INTEGER;
    i INTEGER := 0;
BEGIN
    WHILE i < 10 LOOP
        random_num := floor(random() * 10 + 1)::INTEGER;
        numbers := array_append(numbers, random_num);
        i := i + 1;
    END LOOP;
    
    RETURN numbers;
END;
$$ language 'plpgsql';

-- 12. 检查投注是否中奖的函数
CREATE OR REPLACE FUNCTION public.check_bet_winner(
    selected_numbers INTEGER[],
    winning_numbers INTEGER[]
)
RETURNS BOOLEAN AS $$
DECLARE
    matched_count INTEGER := 0;
    num INTEGER;
BEGIN
    -- 检查选中的数字是否都在开奖数字中
    FOREACH num IN ARRAY selected_numbers
    LOOP
        IF num = ANY(winning_numbers) THEN
            matched_count := matched_count + 1;
        END IF;
    END LOOP;
    
    -- 如果所有9个数字都匹配，则中奖
    RETURN matched_count = 9;
END;
$$ language 'plpgsql';

-- 13. 获取匹配的数字列表的函数
CREATE OR REPLACE FUNCTION public.get_matched_numbers(
    selected_numbers INTEGER[],
    winning_numbers INTEGER[]
)
RETURNS INTEGER[] AS $$
DECLARE
    matched INTEGER[] := '{}';
    num INTEGER;
BEGIN
    FOREACH num IN ARRAY selected_numbers
    LOOP
        IF num = ANY(winning_numbers) THEN
            matched := array_append(matched, num);
        END IF;
    END LOOP;
    
    RETURN matched;
END;
$$ language 'plpgsql';
