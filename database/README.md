# 中世纪风格赌坊游戏数据库设计

## 概述

本数据库设计基于 Supabase PostgreSQL，为中世纪风格赌坊游戏提供完整的数据存储和管理功能。

## 数据库表结构

### 1. users (用户表)
扩展 Supabase Auth 的用户信息，存储用户的游戏相关数据。

**主要字段：**
- `id`: UUID，关联 auth.users
- `email`: 用户邮箱
- `username`: 用户名
- `balance`: 用户余额
- `total_deposited`: 总充值金额
- `total_bet`: 总下注金额
- `total_won`: 总中奖金额

### 2. rounds (开奖轮次表)
存储每一轮开奖的信息。

**主要字段：**
- `id`: UUID 主键
- `round_number`: 轮次编号（自增）
- `winning_numbers`: 开奖数字数组（10个数字）
- `status`: 状态（pending/drawing/completed/cancelled）
- `start_time`: 开始时间
- `end_time`: 结束时间
- `draw_time`: 开奖时间

### 3. bets (投注表)
记录用户的投注信息。

**主要字段：**
- `id`: UUID 主键
- `user_id`: 用户ID
- `round_id`: 轮次ID
- `selected_numbers`: 用户选择的数字（9个）
- `bet_amount`: 下注金额
- `potential_payout`: 潜在赔付
- `actual_payout`: 实际赔付
- `is_winner`: 是否中奖
- `matched_numbers`: 匹配的数字

### 4. recharges (充值记录表)
记录用户的充值信息。

**主要字段：**
- `id`: UUID 主键
- `user_id`: 用户ID
- `amount`: 充值金额
- `payment_method`: 支付方式
- `payment_id`: 支付平台订单ID
- `status`: 状态（pending/processing/completed/failed）

### 5. withdrawals (提现记录表)
记录用户的提现申请。

**主要字段：**
- `id`: UUID 主键
- `user_id`: 用户ID
- `amount`: 提现金额
- `withdrawal_method`: 提现方式
- `account_info`: 账户信息（JSON）
- `status`: 状态

### 6. system_config (系统配置表)
存储系统配置参数。

### 7. audit_logs (审计日志表)
记录重要操作的审计日志。

## 核心功能函数

### 1. 自动触发器
- `update_updated_at_column()`: 自动更新 updated_at 字段
- `handle_new_user()`: 用户注册时自动创建用户记录
- `process_successful_recharge()`: 充值成功后自动更新余额
- `process_bet_placement()`: 下注时自动扣除余额
- `process_bet_settlement()`: 中奖结算时自动发放奖金

### 2. 游戏逻辑函数
- `generate_winning_numbers()`: 生成随机开奖数字
- `check_bet_winner()`: 检查投注是否中奖
- `get_matched_numbers()`: 获取匹配的数字列表

## 安全策略 (RLS)

### 数据访问控制
- 用户只能访问自己的数据（投注、充值、提现记录）
- 管理员可以访问所有数据
- 开奖轮次对所有认证用户可见
- 系统配置有分级访问控制

### 角色权限
- **普通用户**: 只能操作自己的数据
- **管理员**: 可以管理所有数据和系统配置
- **服务角色**: 用于后端服务的系统级操作

## 性能优化

### 索引策略
- 为所有外键创建索引
- 为常用查询字段创建索引
- 为时间字段创建索引以支持时间范围查询

### 视图优化
- `user_stats`: 用户统计信息视图
- `round_stats`: 轮次统计信息视图

## 部署说明

### 1. 初始化数据库
```bash
# 在 Supabase SQL 编辑器中按顺序执行：
1. schema.sql      # 创建表结构
2. functions.sql   # 创建函数和触发器
3. security.sql    # 设置安全策略
```

### 2. 环境变量配置
确保在 Supabase 项目中配置以下环境变量：
- JWT 密钥
- 数据库连接字符串
- 服务角色密钥

### 3. 权限设置
- 启用行级安全 (RLS)
- 配置 API 权限
- 设置 Edge Functions 权限

## 数据迁移

### 版本控制
- 使用 Supabase 的迁移功能
- 每次结构变更都创建迁移文件
- 保持向后兼容性

### 备份策略
- 定期备份数据库
- 在重要更新前创建快照
- 测试恢复流程

## 监控和维护

### 性能监控
- 监控查询性能
- 定期分析慢查询
- 优化索引使用

### 数据清理
- 定期清理过期的审计日志
- 归档历史数据
- 维护数据库统计信息

## 安全考虑

### 数据保护
- 敏感数据加密存储
- 使用 HTTPS 传输
- 定期安全审计

### 访问控制
- 最小权限原则
- 定期审查用户权限
- 监控异常访问

## 扩展性

### 水平扩展
- 支持读写分离
- 可配置连接池
- 支持分片策略

### 功能扩展
- 预留扩展字段
- 模块化设计
- 支持插件机制
