-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.bets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  round_id uuid NOT NULL,
  bet_amount numeric NOT NULL CHECK (bet_amount > 0::numeric),
  potential_payout numeric NOT NULL,
  actual_payout numeric NOT NULL DEFAULT 0.00,
  is_winner boolean NOT NULL DEFAULT false,
  matched_numbers ARRAY DEFAULT '{}'::integer[],
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'settled'::text, 'cancelled'::text])),
  placed_at timestamp with time zone NOT NULL DEFAULT now(),
  settled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  selected_numbers jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT bets_pkey PRIMARY KEY (id),
  CONSTRAINT bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT bets_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id)
);
CREATE TABLE public.recharges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['stripe'::text, 'paypal'::text, 'wechat'::text, 'alipay'::text, 'bank_transfer'::text])),
  payment_id text UNIQUE,
  transaction_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'refunded'::text])),
  payment_data jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recharges_pkey PRIMARY KEY (id),
  CONSTRAINT recharges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.rounds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  round_number bigint NOT NULL DEFAULT nextval('rounds_round_number_seq'::regclass) UNIQUE,
  winning_numbers ARRAY DEFAULT '{}'::integer[],
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'drawing'::text, 'completed'::text, 'cancelled'::text])),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  draw_time timestamp with time zone,
  total_bets_count integer NOT NULL DEFAULT 0,
  total_bet_amount numeric NOT NULL DEFAULT 0.00,
  total_payout numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rounds_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_config (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT system_config_pkey PRIMARY KEY (key)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  balance numeric NOT NULL DEFAULT 0.00 CHECK (balance >= 0::numeric),
  total_deposited numeric NOT NULL DEFAULT 0.00,
  total_withdrawn numeric NOT NULL DEFAULT 0.00,
  total_bet numeric NOT NULL DEFAULT 0.00,
  total_won numeric NOT NULL DEFAULT 0.00,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.withdrawals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  withdrawal_method text NOT NULL CHECK (withdrawal_method = ANY (ARRAY['bank_transfer'::text, 'paypal'::text, 'crypto'::text])),
  account_info jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  admin_notes text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);