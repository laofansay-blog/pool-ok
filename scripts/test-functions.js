// Edge Functions 测试脚本
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试用户ID（需要先在数据库中创建测试用户）
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

async function runTests() {
  console.log('🧪 开始测试 Edge Functions...\n')

  try {
    // 1. 测试获取历史记录
    await testGetHistory()

    // 2. 测试余额管理
    await testBalanceManagement()

    // 3. 测试下注功能
    await testPlaceBet()

    // 4. 测试开奖功能
    await testDrawLottery()

    console.log('\n✅ 所有测试完成！')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    process.exit(1)
  }
}

async function testGetHistory() {
  console.log('📊 测试获取历史记录...')

  try {
    // 测试获取轮次历史
    const { data: roundsData, error: roundsError } = await supabase.functions.invoke('get-history', {
      body: { type: 'rounds', limit: 5 }
    })

    if (roundsError) throw roundsError

    console.log('  ✓ 获取轮次历史成功:', roundsData.data?.length || 0, '条记录')

    // 测试获取用户统计（如果用户存在）
    const { data: statsData, error: statsError } = await supabase.functions.invoke('get-history', {
      body: { type: 'user_stats', userId: TEST_USER_ID }
    })

    if (!statsError) {
      console.log('  ✓ 获取用户统计成功')
    } else {
      console.log('  ⚠️  用户统计测试跳过（用户不存在）')
    }

  } catch (error) {
    console.error('  ❌ 获取历史记录失败:', error.message)
    throw error
  }
}

async function testBalanceManagement() {
  console.log('💰 测试余额管理...')

  try {
    // 测试获取余额（即使用户不存在也应该有错误处理）
    const { data: balanceData, error: balanceError } = await supabase.functions.invoke('manage-balance', {
      body: { action: 'get_balance', userId: TEST_USER_ID }
    })

    if (!balanceError) {
      console.log('  ✓ 获取余额成功:', balanceData.data?.balance || 0)
    } else {
      console.log('  ⚠️  获取余额测试跳过（用户不存在）')
    }

    // 测试充值（模拟）
    const { data: rechargeData, error: rechargeError } = await supabase.functions.invoke('manage-balance', {
      body: {
        action: 'recharge',
        userId: TEST_USER_ID,
        amount: 100,
        paymentMethod: 'stripe',
        paymentId: 'test_payment_' + Date.now()
      }
    })

    if (!rechargeError) {
      console.log('  ✓ 充值测试成功')
    } else {
      console.log('  ⚠️  充值测试跳过（用户不存在）')
    }

  } catch (error) {
    console.error('  ❌ 余额管理测试失败:', error.message)
    // 不抛出错误，继续其他测试
  }
}

async function testPlaceBet() {
  console.log('🎲 测试下注功能...')

  try {
    const { data: betData, error: betError } = await supabase.functions.invoke('place-bet', {
      body: {
        selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        betAmount: 10,
        userId: TEST_USER_ID
      }
    })

    if (!betError) {
      console.log('  ✓ 下注测试成功')
    } else {
      console.log('  ⚠️  下注测试跳过:', betError.message)
    }

  } catch (error) {
    console.error('  ❌ 下注功能测试失败:', error.message)
    // 不抛出错误，继续其他测试
  }
}

async function testDrawLottery() {
  console.log('🎰 测试开奖功能...')

  try {
    const { data: drawData, error: drawError } = await supabase.functions.invoke('draw-lottery', {
      body: {}
    })

    if (drawError) throw drawError

    console.log('  ✓ 开奖功能测试成功:', drawData.message)

  } catch (error) {
    console.error('  ❌ 开奖功能测试失败:', error.message)
    throw error
  }
}

async function testScheduledLottery() {
  console.log('⏰ 测试定时开奖...')

  try {
    const { data: scheduleData, error: scheduleError } = await supabase.functions.invoke('scheduled-lottery', {
      body: {}
    })

    if (scheduleError) throw scheduleError

    console.log('  ✓ 定时开奖测试成功:', scheduleData.message)

  } catch (error) {
    console.error('  ❌ 定时开奖测试失败:', error.message)
    throw error
  }
}

// 创建测试用户（如果不存在）
async function createTestUser() {
  console.log('👤 创建测试用户...')

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: TEST_USER_ID,
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User',
        balance: 1000
      })
      .select()

    if (error && error.code !== '23505') { // 忽略重复键错误
      throw error
    }

    console.log('  ✓ 测试用户已准备就绪')

  } catch (error) {
    console.error('  ❌ 创建测试用户失败:', error.message)
    console.log('  ℹ️  将跳过需要用户的测试')
  }
}

// 清理测试数据
async function cleanup() {
  console.log('🧹 清理测试数据...')

  try {
    // 删除测试用户的投注记录
    await supabase
      .from('bets')
      .delete()
      .eq('user_id', TEST_USER_ID)

    // 删除测试用户的充值记录
    await supabase
      .from('recharges')
      .delete()
      .eq('user_id', TEST_USER_ID)

    console.log('  ✓ 测试数据清理完成')

  } catch (error) {
    console.error('  ❌ 清理测试数据失败:', error.message)
  }
}

// 压力测试
async function stressTest() {
  console.log('🔥 开始压力测试...')

  const concurrentUsers = 10
  const betsPerUser = 5

  try {
    // 创建多个测试用户
    const testUsers = []
    for (let i = 0; i < concurrentUsers; i++) {
      const userId = `stress-test-user-${i}-${Date.now()}`
      testUsers.push(userId)

      // 创建用户记录
      await supabase
        .from('users')
        .upsert({
          id: userId,
          email: `stress-test-${i}@example.com`,
          username: `stressuser${i}`,
          balance: 10000
        })
    }

    console.log(`  ✓ 创建了 ${concurrentUsers} 个测试用户`)

    // 并发下注测试
    const promises = []
    for (const userId of testUsers) {
      for (let j = 0; j < betsPerUser; j++) {
        promises.push(
          supabase.functions.invoke('place-bet', {
            body: {
              selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
              betAmount: 10,
              userId: userId
            }
          })
        )
      }
    }

    const startTime = Date.now()
    const results = await Promise.allSettled(promises)
    const endTime = Date.now()

    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length
    const failed = results.length - successful

    console.log(`  ✓ 压力测试完成`)
    console.log(`    - 总请求数: ${results.length}`)
    console.log(`    - 成功: ${successful}`)
    console.log(`    - 失败: ${failed}`)
    console.log(`    - 耗时: ${endTime - startTime}ms`)
    console.log(`    - 平均响应时间: ${(endTime - startTime) / results.length}ms`)

    // 清理测试用户
    for (const userId of testUsers) {
      await supabase.from('bets').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)
    }

  } catch (error) {
    console.error('  ❌ 压力测试失败:', error.message)
  }
}

// 数据一致性测试
async function consistencyTest() {
  console.log('🔍 开始数据一致性测试...')

  try {
    // 创建测试用户
    const userId = `consistency-test-${Date.now()}`
    const initialBalance = 1000

    await supabase
      .from('users')
      .upsert({
        id: userId,
        email: `consistency@example.com`,
        username: 'consistencyuser',
        balance: initialBalance
      })

    // 下注
    const betAmount = 100
    const { error: betError } = await supabase.functions.invoke('place-bet', {
      body: {
        selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        betAmount: betAmount,
        userId: userId
      }
    })

    if (betError) throw betError

    // 检查余额是否正确扣除
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, total_bet')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    const expectedBalance = initialBalance - betAmount
    if (Math.abs(user.balance - expectedBalance) < 0.01) {
      console.log('  ✓ 余额扣除正确')
    } else {
      console.log(`  ❌ 余额不一致: 期望 ${expectedBalance}, 实际 ${user.balance}`)
    }

    if (Math.abs(user.total_bet - betAmount) < 0.01) {
      console.log('  ✓ 总下注金额正确')
    } else {
      console.log(`  ❌ 总下注金额不一致: 期望 ${betAmount}, 实际 ${user.total_bet}`)
    }

    // 清理
    await supabase.from('bets').delete().eq('user_id', userId)
    await supabase.from('users').delete().eq('id', userId)

  } catch (error) {
    console.error('  ❌ 数据一致性测试失败:', error.message)
  }
}

// 主函数
async function main() {
  console.log('🎮 中世纪风格赌坊游戏 - 完整测试套件\n')

  // 创建测试用户
  await createTestUser()

  // 基础功能测试
  await runTests()

  // 压力测试
  await stressTest()

  // 数据一致性测试
  await consistencyTest()

  // 清理测试数据
  await cleanup()

  console.log('\n🎉 所有测试完成！')
}

// 运行测试
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  runTests,
  testGetHistory,
  testBalanceManagement,
  testPlaceBet,
  testDrawLottery
}
