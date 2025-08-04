// 性能监控脚本
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 性能监控器
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiResponseTimes: [],
      databaseQueryTimes: [],
      functionExecutionTimes: [],
      errorRates: {},
      activeUsers: 0,
      totalRequests: 0,
      successfulRequests: 0
    }
  }

  // 测试 API 响应时间
  async testApiResponseTime(endpoint, payload = {}) {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      this.metrics.apiResponseTimes.push({
        endpoint,
        responseTime,
        success: !error,
        timestamp: new Date().toISOString()
      })
      
      this.metrics.totalRequests++
      if (!error) {
        this.metrics.successfulRequests++
      }
      
      return { responseTime, success: !error, data, error }
      
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      this.metrics.apiResponseTimes.push({
        endpoint,
        responseTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      this.metrics.totalRequests++
      
      return { responseTime, success: false, error }
    }
  }

  // 测试数据库查询性能
  async testDatabasePerformance() {
    const queries = [
      {
        name: 'select_users',
        query: () => supabase.from('users').select('id, balance').limit(10)
      },
      {
        name: 'select_rounds',
        query: () => supabase.from('rounds').select('*').eq('status', 'completed').limit(10)
      },
      {
        name: 'select_bets',
        query: () => supabase.from('bets').select('*').eq('status', 'settled').limit(10)
      },
      {
        name: 'count_users',
        query: () => supabase.from('users').select('*', { count: 'exact', head: true })
      }
    ]

    for (const { name, query } of queries) {
      const startTime = Date.now()
      
      try {
        const { data, error } = await query()
        const endTime = Date.now()
        const queryTime = endTime - startTime
        
        this.metrics.databaseQueryTimes.push({
          query: name,
          queryTime,
          success: !error,
          recordCount: data?.length || 0,
          timestamp: new Date().toISOString()
        })
        
      } catch (error) {
        const endTime = Date.now()
        const queryTime = endTime - startTime
        
        this.metrics.databaseQueryTimes.push({
          query: name,
          queryTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  // 测试 Edge Functions 性能
  async testFunctionPerformance() {
    const functions = [
      { name: 'get-history', payload: { type: 'rounds', limit: 5 } },
      { name: 'draw-lottery', payload: {} },
      { name: 'scheduled-lottery', payload: {} }
    ]

    for (const { name, payload } of functions) {
      const result = await this.testApiResponseTime(name, payload)
      
      this.metrics.functionExecutionTimes.push({
        function: name,
        executionTime: result.responseTime,
        success: result.success,
        timestamp: new Date().toISOString()
      })
    }
  }

  // 计算错误率
  calculateErrorRates() {
    const endpoints = {}
    
    this.metrics.apiResponseTimes.forEach(metric => {
      if (!endpoints[metric.endpoint]) {
        endpoints[metric.endpoint] = { total: 0, errors: 0 }
      }
      
      endpoints[metric.endpoint].total++
      if (!metric.success) {
        endpoints[metric.endpoint].errors++
      }
    })
    
    for (const [endpoint, stats] of Object.entries(endpoints)) {
      this.metrics.errorRates[endpoint] = {
        errorRate: (stats.errors / stats.total * 100).toFixed(2),
        totalRequests: stats.total,
        errors: stats.errors
      }
    }
  }

  // 获取系统统计信息
  async getSystemStats() {
    try {
      // 获取活跃用户数 (最近24小时登录的用户)
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('users')
        .select('id')
        .gte('last_login_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      if (!activeUsersError) {
        this.metrics.activeUsers = activeUsers?.length || 0
      }
      
      // 获取今日投注统计
      const today = new Date().toISOString().split('T')[0]
      const { data: todayBets, error: betsError } = await supabase
        .from('bets')
        .select('bet_amount, actual_payout')
        .gte('placed_at', today)
      
      if (!betsError && todayBets) {
        this.metrics.todayStats = {
          totalBets: todayBets.length,
          totalBetAmount: todayBets.reduce((sum, bet) => sum + bet.bet_amount, 0),
          totalPayout: todayBets.reduce((sum, bet) => sum + bet.actual_payout, 0)
        }
      }
      
    } catch (error) {
      console.error('获取系统统计失败:', error)
    }
  }

  // 生成性能报告
  generateReport() {
    this.calculateErrorRates()
    
    const avgApiResponseTime = this.metrics.apiResponseTimes.length > 0 
      ? this.metrics.apiResponseTimes.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.apiResponseTimes.length
      : 0
    
    const avgDbQueryTime = this.metrics.databaseQueryTimes.length > 0
      ? this.metrics.databaseQueryTimes.reduce((sum, m) => sum + m.queryTime, 0) / this.metrics.databaseQueryTimes.length
      : 0
    
    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0

    return {
      timestamp: new Date().toISOString(),
      summary: {
        avgApiResponseTime: Math.round(avgApiResponseTime),
        avgDbQueryTime: Math.round(avgDbQueryTime),
        successRate: `${successRate}%`,
        totalRequests: this.metrics.totalRequests,
        activeUsers: this.metrics.activeUsers
      },
      details: {
        apiResponseTimes: this.metrics.apiResponseTimes,
        databaseQueryTimes: this.metrics.databaseQueryTimes,
        functionExecutionTimes: this.metrics.functionExecutionTimes,
        errorRates: this.metrics.errorRates,
        todayStats: this.metrics.todayStats
      }
    }
  }

  // 运行完整的性能测试
  async runFullTest() {
    console.log('🚀 开始性能监控测试...\n')
    
    console.log('📊 测试 API 响应时间...')
    await this.testFunctionPerformance()
    
    console.log('🗄️ 测试数据库查询性能...')
    await this.testDatabasePerformance()
    
    console.log('📈 获取系统统计信息...')
    await this.getSystemStats()
    
    console.log('📋 生成性能报告...\n')
    return this.generateReport()
  }
}

// 主函数
async function main() {
  const monitor = new PerformanceMonitor()
  
  try {
    const report = await monitor.runFullTest()
    
    console.log('📊 性能监控报告')
    console.log('=' * 50)
    console.log(`⏱️  平均 API 响应时间: ${report.summary.avgApiResponseTime}ms`)
    console.log(`🗄️ 平均数据库查询时间: ${report.summary.avgDbQueryTime}ms`)
    console.log(`✅ 成功率: ${report.summary.successRate}`)
    console.log(`📊 总请求数: ${report.summary.totalRequests}`)
    console.log(`👥 活跃用户数: ${report.summary.activeUsers}`)
    
    if (report.details.todayStats) {
      console.log('\n📈 今日统计:')
      console.log(`  投注次数: ${report.details.todayStats.totalBets}`)
      console.log(`  投注金额: ${report.details.todayStats.totalBetAmount}`)
      console.log(`  赔付金额: ${report.details.todayStats.totalPayout}`)
    }
    
    console.log('\n🔍 详细指标:')
    
    // API 响应时间详情
    if (report.details.apiResponseTimes.length > 0) {
      console.log('\nAPI 响应时间:')
      report.details.apiResponseTimes.forEach(metric => {
        const status = metric.success ? '✅' : '❌'
        console.log(`  ${status} ${metric.endpoint}: ${metric.responseTime}ms`)
      })
    }
    
    // 数据库查询时间详情
    if (report.details.databaseQueryTimes.length > 0) {
      console.log('\n数据库查询时间:')
      report.details.databaseQueryTimes.forEach(metric => {
        const status = metric.success ? '✅' : '❌'
        console.log(`  ${status} ${metric.query}: ${metric.queryTime}ms`)
      })
    }
    
    // 错误率详情
    if (Object.keys(report.details.errorRates).length > 0) {
      console.log('\n错误率统计:')
      for (const [endpoint, stats] of Object.entries(report.details.errorRates)) {
        console.log(`  ${endpoint}: ${stats.errorRate}% (${stats.errors}/${stats.totalRequests})`)
      }
    }
    
    // 保存报告到文件
    const fs = require('fs')
    const reportPath = `performance-report-${Date.now()}.json`
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n💾 详细报告已保存到: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ 性能监控失败:', error)
    process.exit(1)
  }
}

// 运行监控
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { PerformanceMonitor }
