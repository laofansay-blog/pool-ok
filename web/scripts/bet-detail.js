// 投注详情页面逻辑
class BetDetailPage {
    constructor() {
        this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        this.betId = null
        this.betData = null
        this.init()
    }

    init() {
        // 从URL参数获取投注ID
        const urlParams = new URLSearchParams(window.location.search)
        this.betId = urlParams.get('id')
        
        if (!this.betId) {
            this.showError('未找到投注ID')
            return
        }

        this.loadBetDetail()
    }

    async loadBetDetail() {
        try {
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

    renderBetDetail() {
        const bet = this.betData
        const round = bet.rounds
        
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
