-- 创建更新用户余额的函数
CREATE OR REPLACE FUNCTION update_user_balance(
  user_id UUID,
  amount DECIMAL,
  transaction_type TEXT,
  description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新用户余额
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'balance', 
      COALESCE((raw_user_meta_data->>'balance')::decimal, 0) + amount
    )
  WHERE id = user_id;
  
  -- 记录交易历史（如果有transactions表的话）
  -- INSERT INTO transactions (user_id, amount, type, description, created_at)
  -- VALUES (user_id, amount, transaction_type, description, NOW());
  
  -- 如果余额变为负数，抛出错误
  IF (SELECT COALESCE((raw_user_meta_data->>'balance')::decimal, 0) FROM auth.users WHERE id = user_id) < 0 THEN
    RAISE EXCEPTION '用户余额不足';
  END IF;
END;
$$;

-- 创建交易记录表（如果不存在）
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 更新update_user_balance函数以记录交易历史
CREATE OR REPLACE FUNCTION update_user_balance(
  user_id UUID,
  amount DECIMAL,
  transaction_type TEXT,
  description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新用户余额
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'balance', 
      COALESCE((raw_user_meta_data->>'balance')::decimal, 0) + amount
    )
  WHERE id = user_id;
  
  -- 记录交易历史
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (user_id, amount, transaction_type, description);
  
  -- 如果余额变为负数，抛出错误
  IF (SELECT COALESCE((raw_user_meta_data->>'balance')::decimal, 0) FROM auth.users WHERE id = user_id) < 0 THEN
    RAISE EXCEPTION '用户余额不足';
  END IF;
END;
$$;
