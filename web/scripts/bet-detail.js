// 投注详情页面逻辑
class BetDetailPage {
    constructor() {
        // 使用配置文件中的常量
        const SUPABASE_URL = CONFIG?.SUPABASE_URL || 'https://deyugfnymgyxcfacxtjy.supabase.co'
        const SUPABASE_ANON_KEY = CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXVnZm55bWd5eGNmYWN4dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzY1OTcsImV4cCI6MjA2OTcxMjU5N30.9-hEjAjJEU3RP-Jbv2MeLv-56MXmXEdZDTNYhfqVX1g'

        this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.betId = null
        this.betData = null
        this.init()
    }

    init() {
        console.log('BetDetailPage 初始化开始')

        // 从URL参数获取投注ID
        const urlParams = new URLSearchParams(window.location.search)
        this.betId = urlParams.get('id')

        console.log('获取到的投注ID:', this.betId)

        if (!this.betId) {
            console.log('未找到投注ID，显示错误')
            this.showError('未找到投注ID')
            return
        }

        console.log('开始加载投注详情')
        this.loadBetDetail()
    }

    async loadBetDetail() {
        try {
            // 检查是否是测试数据
            if (this.betId.startsWith('test-bet-')) {
                console.log('使用测试数据，ID:', this.betId)
                this.betData = this.getTestData(this.betId)
                console.log('获取到的测试数据:', this.betData)

                if (!this.betData) {
                    this.showError('未找到测试数据: ' + this.betId)
                    return
                }

                this.renderBetDetail()
                return
            }

            const { data, error } = await this.supabaseClient
                .from('bets')
                .select(`
                    *,
                    rounds (
                        round_number,
                        winning_numbers,
                        status as round_status,
                        start_time,
                        end_time,
                        draw_time
                    ),
                    users (
                        username,
                        email
                    )
                `)
                .eq('id', this.betId)
                .single()

            if (error) throw error

            this.betData = data
            this.renderBetDetail()

        } catch (error) {
            console.error('加载投注详情失败:', error)
            this.showError('加载投注详情失败: ' + error.message)
        }
    }

    getTestData(betId) {
        const testData = {
            'test-bet-1': {
                id: 'test-bet-1',
                user_id: 'test-user',
                round_id: 'test-round-138',
                selected_numbers: {
                    "1": [1, 2],
                    "2": [3],
                    "3": [],
                    "4": [],
                    "5": [7],
                    "6": [],
                    "7": [],
                    "8": [],
                    "9": [],
                    "10": []
                },
                bet_amount: 15.00,
                potential_payout: 147.00,
                actual_payout: 147.00,
                is_winner: true,
                matched_numbers: [1, 3, 7],
                status: 'settled',
                placed_at: '2024-12-01T14:35:00Z',
                settled_at: '2024-12-01T15:00:00Z',
                metadata: {
                    original_bets: [
                        { group: 1, number: 1, amount: 3 },
                        { group: 1, number: 2, amount: 3 },
                        { group: 2, number: 3, amount: 3 },
                        { group: 5, number: 7, amount: 6 }
                    ],
                    bet_count: 4,
                    groups_used: ["1", "2", "5"]
                },
                rounds: {
                    round_number: 138,
                    winning_numbers: [1, 5, 3, 8, 2, 9, 4, 6, 10, 7],
                    status: 'completed',
                    start_time: '2024-12-01T14:30:00Z',
                    end_time: '2024-12-01T14:59:00Z',
                    draw_time: '2024-12-01T15:00:00Z'
                }
            },
            'test-bet-2': {
                id: 'test-bet-2',
                user_id: 'test-user',
                round_id: 'test-round-137',
                selected_numbers: {
                    "1": [5],
                    "2": [],
                    "3": [8],
                    "4": [],
                    "5": [],
                    "6": [],
                    "7": [],
                    "8": [],
                    "9": [],
                    "10": [2]
                },
                bet_amount: 9.00,
                potential_payout: 88.20,
                actual_payout: 0.00,
                is_winner: false,
                matched_numbers: [],
                status: 'settled',
                placed_at: '2024-12-01T13:35:00Z',
                settled_at: '2024-12-01T14:00:00Z',
                metadata: {
                    original_bets: [
                        { group: 1, number: 5, amount: 3 },
                        { group: 3, number: 8, amount: 3 },
                        { group: 10, number: 2, amount: 3 }
                    ],
                    bet_count: 3,
                    groups_used: ["1", "3", "10"]
                },
                rounds: {
                    round_number: 137,
                    winning_numbers: [2, 7, 1, 4, 9, 6, 3, 5, 8, 10],
                    status: 'completed',
                    start_time: '2024-12-01T13:30:00Z',
                    end_time: '2024-12-01T13:59:00Z',
                    draw_time: '2024-12-01T14:00:00Z'
                }
            },
            'test-bet-3': {
                id: 'test-bet-3',
                user_id: 'test-user',
                round_id: 'test-round-136',
                selected_numbers: {
                    "1": [1],
                    "2": [4],
                    "3": [],
                    "4": [],
                    "5": [],
                    "6": [],
                    "7": [],
                    "8": [],
                    "9": [],
                    "10": []
                },
                bet_amount: 6.00,
                potential_payout: 58.80,
                actual_payout: 0.00,
                is_winner: false,
                matched_numbers: [],
                status: 'pending',
                placed_at: '2024-12-01T12:35:00Z',
                settled_at: null,
                metadata: {
                    original_bets: [
                        { group: 1, number: 1, amount: 3 },
                        { group: 2, number: 4, amount: 3 }
                    ],
                    bet_count: 2,
                    groups_used: ["1", "2"]
                },
                rounds: {
                    round_number: 136,
                    winning_numbers: [],
                    status: 'pending',
                    start_time: '2024-12-01T12:30:00Z',
                    end_time: '2024-12-01T12:59:00Z',
                    draw_time: null
                }
            }
        }

        const result = testData[betId] || null
        console.log('getTestData 返回结果:', result)
        return result
    }

    renderBetDetail() {
        console.log('开始渲染投注详情，数据:', this.betData)

        if (!this.betData) {
            console.error('投注数据为空')
            this.showError('投注数据为空')
            return
        }

        const bet = this.betData
        const round = bet.rounds

        console.log('投注数据:', bet)
        console.log('轮次数据:', round)

        // 计算盈亏
        const profitLoss = bet.actual_payout - bet.bet_amount
        const profitLossClass = profitLoss > 0 ? 'positive' : profitLoss < 0 ? 'negative' : 'neutral'
        const profitLossText = profitLoss > 0 ? `+${formatCurrency(profitLoss)}` : formatCurrency(profitLoss)

        // 计算投注分析
        const analysis = this.analyzeBet(bet)

        const html = `
            <div class="detail-header">
                <h1 class="detail-title">
                    投注详情 #${bet.id.slice(0, 8)}
                    ${bet.is_winner ? '<span class="winner-badge">🏆 中奖</span>' : ''}
                </h1>
                <p class="detail-subtitle">
                    第${round?.round_number || '-'}期 • ${formatTime(bet.placed_at)}
                </p>
            </div>

            <!-- 基本信息 -->
            <div class="detail-section">
                <h2 class="section-title">
                    <span class="section-icon">📋</span>
                    基本信息
                </h2>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">投注ID</div>
                        <div class="detail-value">${bet.id}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">轮次</div>
                        <div class="detail-value">第${round?.round_number || '-'}期</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">投注时间</div>
                        <div class="detail-value">${formatTime(bet.placed_at)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">状态</div>
                        <div class="detail-value">
                            <span class="status-badge status-${bet.status}">
                                ${bet.status === 'settled' ? (bet.is_winner ? '已中奖' : '未中奖') : '待开奖'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 投注内容 -->
            <div class="detail-section">
                <h2 class="section-title">
                    <span class="section-icon">🎯</span>
                    投注内容
                </h2>
                <div class="detail-item">
                    <div class="detail-label">选择的数字</div>
                    <div class="detail-value">
                        ${WinningNumbers.renderBetNumbers(bet.selected_numbers, { size: 'medium' })}
                    </div>
                    <div style="margin-top: 10px; color: rgba(255,255,255,0.7); font-size: 14px;">
                        ${WinningNumbers.formatBetNumbersText(bet.selected_numbers)}
                    </div>
                </div>
                ${analysis.html}
            </div>

            <!-- 开奖结果 -->
            ${round?.winning_numbers && round.winning_numbers.length > 0 ? `
                <div class="detail-section">
                    <h2 class="section-title">
                        <span class="section-icon">🎲</span>
                        开奖结果
                    </h2>
                    <div class="detail-item">
                        <div class="detail-label">开奖数字</div>
                        <div class="detail-value">
                            ${WinningNumbers.renderDetailed(round.winning_numbers)}
                        </div>
                        <div style="margin-top: 10px; color: rgba(255,255,255,0.7); font-size: 14px;">
                            开奖时间: ${formatTime(round.draw_time)}
                        </div>
                    </div>
                    ${bet.matched_numbers && bet.matched_numbers.length > 0 ? `
                        <div class="detail-item" style="margin-top: 15px;">
                            <div class="detail-label">匹配情况</div>
                            <div class="detail-value">
                                ${this.renderMatchedNumbers(bet.matched_numbers, round.winning_numbers)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <!-- 财务信息 -->
            <div class="detail-section">
                <h2 class="section-title">
                    <span class="section-icon">💰</span>
                    财务信息
                </h2>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">投注金额</div>
                        <div class="detail-value">${formatCurrency(bet.bet_amount)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">潜在赔付</div>
                        <div class="detail-value">${formatCurrency(bet.potential_payout)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">实际赔付</div>
                        <div class="detail-value">${formatCurrency(bet.actual_payout)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">盈亏</div>
                        <div class="detail-value profit-loss ${profitLossClass}">
                            ${profitLossText}
                        </div>
                    </div>
                </div>
                
                <div class="bet-analysis">
                    <div class="analysis-item">
                        <span>赔率:</span>
                        <span>${(bet.potential_payout / bet.bet_amount).toFixed(2)}x</span>
                    </div>
                    <div class="analysis-item">
                        <span>投资回报率:</span>
                        <span class="${profitLossClass}">
                            ${((profitLoss / bet.bet_amount) * 100).toFixed(2)}%
                        </span>
                    </div>
                    ${bet.status === 'settled' ? `
                        <div class="analysis-item">
                            <span>结算时间:</span>
                            <span>${formatTime(bet.settled_at)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 元数据信息 -->
            ${bet.metadata && Object.keys(bet.metadata).length > 0 ? `
                <div class="detail-section">
                    <h2 class="section-title">
                        <span class="section-icon">📊</span>
                        详细信息
                    </h2>
                    ${this.renderMetadata(bet.metadata)}
                </div>
            ` : ''}
        `

        document.getElementById('detailContent').innerHTML = html
    }

    analyzeBet(bet) {
        if (!bet.metadata || !bet.metadata.original_bets) {
            return { html: '' }
        }

        const originalBets = bet.metadata.original_bets
        const groupStats = {}

        // 统计每组的投注
        originalBets.forEach(originalBet => {
            const group = originalBet.group
            if (!groupStats[group]) {
                groupStats[group] = { count: 0, amount: 0, numbers: [] }
            }
            groupStats[group].count++
            groupStats[group].amount += originalBet.amount
            groupStats[group].numbers.push(originalBet.number)
        })

        const groupsUsed = Object.keys(groupStats).length
        const totalBets = originalBets.length

        const html = `
            <div class="bet-analysis" style="margin-top: 15px;">
                <div class="analysis-item">
                    <span>投注组数:</span>
                    <span>${groupsUsed} 组</span>
                </div>
                <div class="analysis-item">
                    <span>总投注数:</span>
                    <span>${totalBets} 注</span>
                </div>
                <div class="analysis-item">
                    <span>平均每注:</span>
                    <span>${formatCurrency(bet.bet_amount / totalBets)}</span>
                </div>
            </div>
        `

        return { html }
    }

    renderMatchedNumbers(matchedNumbers, winningNumbers) {
        // 这里可以根据新的JSONB格式来显示匹配情况
        if (Array.isArray(matchedNumbers)) {
            return matchedNumbers.map(num =>
                `<span class="number-badge" style="background: #4caf50; color: white;">${num}</span>`
            ).join(' ')
        }
        return '暂无匹配信息'
    }

    renderMetadata(metadata) {
        let html = '<div class="detail-grid">'

        if (metadata.original_bets) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">原始投注记录</div>
                    <div class="detail-value">
                        ${metadata.original_bets.map(bet =>
                `第${bet.group}组-${bet.number}: ${formatCurrency(bet.amount)}`
            ).join('<br>')}
                    </div>
                </div>
            `
        }

        if (metadata.bet_count) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">投注笔数</div>
                    <div class="detail-value">${metadata.bet_count}</div>
                </div>
            `
        }

        if (metadata.groups_used) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">使用的组</div>
                    <div class="detail-value">${metadata.groups_used.join(', ')}</div>
                </div>
            `
        }

        html += '</div>'
        return html
    }

    showError(message) {
        document.getElementById('detailContent').innerHTML = `
            <div class="error">
                ❌ ${message}
            </div>
        `
    }
}

// 返回按钮功能
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back()
    } else {
        window.location.href = 'index.html'
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new BetDetailPage()
})
