-- 检查 pg_cron 配置的 SQL 查询

-- 1. 检查 pg_cron 扩展是否安装
SELECT 
    extname as extension_name,
    extversion as version,
    extrelocatable as relocatable
FROM pg_extension 
WHERE extname = 'pg_cron';

-- 2. 检查 cron schema 是否存在
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'cron';

-- 3. 检查 cron.job 表是否存在
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'cron' 
    AND table_name = 'job'
) as cron_job_table_exists;

-- 4. 如果 cron.job 表存在，查询所有定时任务
-- (如果上面的查询返回 false，这个查询会失败)
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
ORDER BY jobid;

-- 5. 查询定时任务执行历史（最近10条）
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- 6. 查询特定的开奖相关任务
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname
FROM cron.job
WHERE command LIKE '%lottery%' 
   OR command LIKE '%draw%'
   OR jobname LIKE '%lottery%'
   OR jobname LIKE '%draw%';

-- 7. 检查是否有调用旧版函数的任务
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname,
    CASE 
        WHEN command LIKE '%scheduled-lottery-v2%' THEN '✅ 使用新版函数'
        WHEN command LIKE '%scheduled-lottery%' THEN '❌ 使用旧版函数'
        ELSE '❓ 其他命令'
    END as function_version
FROM cron.job
WHERE command LIKE '%scheduled-lottery%';
