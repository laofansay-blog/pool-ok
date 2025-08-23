// 模态框管理脚本

// 模态框管理器
const ModalManager = {
    // 当前打开的模态框
    currentModal: null,

    // 打开模态框
    open(modalId) {
        const modal = document.getElementById(modalId)
        if (!modal) {
            console.error(`模态框 ${modalId} 不存在`)
            return
        }

        // 关闭当前模态框
        if (this.currentModal) {
            this.close(this.currentModal.id)
        }

        // 显示模态框
        modal.classList.add('active')
        this.currentModal = modal

        // 禁用背景滚动
        document.body.style.overflow = 'hidden'

        // 添加键盘事件监听
        document.addEventListener('keydown', this.handleKeydown.bind(this))

        // 添加点击背景关闭功能
        modal.addEventListener('click', this.handleBackdropClick.bind(this))

        // 触发打开事件
        this.triggerEvent(modal, 'modal:open')
    },

    // 关闭模态框
    close(modalId) {
        const modal = typeof modalId === 'string' ?
            document.getElementById(modalId) : modalId

        if (!modal) return

        // 隐藏模态框
        modal.classList.remove('active')

        // 如果是当前模态框，清除引用
        if (this.currentModal === modal) {
            this.currentModal = null

            // 恢复背景滚动
            document.body.style.overflow = ''

            // 移除事件监听
            document.removeEventListener('keydown', this.handleKeydown.bind(this))
        }

        // 触发关闭事件
        this.triggerEvent(modal, 'modal:close')
    },

    // 处理键盘事件
    handleKeydown(event) {
        if (event.key === 'Escape' && this.currentModal) {
            this.close(this.currentModal.id)
        }
    },

    // 处理背景点击
    handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.close(event.currentTarget.id)
        }
    },

    // 触发自定义事件
    triggerEvent(modal, eventName) {
        const event = new CustomEvent(eventName, {
            detail: { modal }
        })
        modal.dispatchEvent(event)
    }
}

// 全局函数
function showModal(modalId) {
    ModalManager.open(modalId)
}

function closeModal(modalId) {
    ModalManager.close(modalId)
}

// 具体模态框函数
function showRechargeModal() {
    showModal('rechargeModal')
    initRechargeModal()
}

function showProfileModal() {
    showModal('profileModal')
    initProfileModal()
}

function showHistoryModal() {
    showModal('historyModal')
    initHistoryModal()
}

function showRulesModal() {
    showModal('rulesModal')
}

function showForgotPassword() {
    showModal('forgotPasswordModal')
}

function showTerms() {
    showModal('termsModal')
}

function showPrivacy() {
    showModal('privacyModal')
}

// 充值模态框初始化
function initRechargeModal() {
    // 预设金额按钮事件
    const presetBtns = document.querySelectorAll('.preset-btn')
    const amountInput = document.getElementById('rechargeAmount')

    presetBtns.forEach(btn => {
        btn.onclick = () => {
            const amount = btn.dataset.amount
            amountInput.value = amount

            // 更新按钮状态
            presetBtns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
        }
    })

    // 自定义金额输入事件
    if (amountInput) {
        amountInput.oninput = () => {
            presetBtns.forEach(b => b.classList.remove('active'))
        }
    }
}

// 个人中心模态框初始化
function initProfileModal() {
    // 选项卡切换
    const tabBtns = document.querySelectorAll('.profile-tabs .tab-btn')
    const tabPanes = document.querySelectorAll('.tab-pane')

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab

            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')

            // 更新内容显示
            tabPanes.forEach(pane => {
                pane.classList.remove('active')
            })

            const targetPane = document.getElementById(tabId + 'Tab')
            if (targetPane) {
                targetPane.classList.add('active')
                loadTabContent(tabId)
            }
        }
    })

    // 加载默认选项卡内容
    loadTabContent('stats')
}

// 历史记录模态框初始化
function initHistoryModal() {
    loadHistoryData()
}

// 加载选项卡内容
async function loadTabContent(tabId) {
    const tabPane = document.getElementById(tabId + 'Tab')
    if (!tabPane) return

    try {
        switch (tabId) {
            case 'stats':
                await loadUserStats(tabPane)
                break
            case 'bets':
                await loadUserBets(tabPane)
                break
            case 'transactions':
                await loadUserTransactions(tabPane)
                break
        }
    } catch (error) {
        console.error(`加载 ${tabId} 内容失败:`, error)
        tabPane.innerHTML = `<p class="error-message">加载失败: ${error.message}</p>`
    }
}

// 加载用户统计
async function loadUserStats(container) {
    if (!currentUser) return

    container.innerHTML = '<div class="loading">加载中...</div>'

    try {
        const { data, error } = await supabaseClient.functions.invoke('get-history', {
            body: { type: 'user_stats', userId: currentUser.id }
        })

        if (error) throw error

        const stats = data.data
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(stats.userInfo.balance)}</div>
                    <div class="stat-label">当前余额</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.stats.totalBets}</div>
                    <div class="stat-label">总投注次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.stats.winningBets}</div>
                    <div class="stat-label">中奖次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.stats.winRate.toFixed(1)}%</div>
                    <div class="stat-label">胜率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(stats.userInfo.total_bet)}</div>
                    <div class="stat-label">总投注金额</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(stats.userInfo.total_won)}</div>
                    <div class="stat-label">总中奖金额</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value ${stats.stats.profitLoss >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(stats.stats.profitLoss)}
                    </div>
                    <div class="stat-label">盈亏</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(stats.userInfo.total_deposited)}</div>
                    <div class="stat-label">总充值</div>
                </div>
            </div>
        `
    } catch (error) {
        container.innerHTML = `<p class="error-message">加载统计信息失败: ${error.message}</p>`
    }
}

// 加载用户投注记录
async function loadUserBets(container) {
    if (!currentUser) return

    container.innerHTML = '<div class="loading">加载中...</div>'

    try {
        const { data, error } = await supabaseClient.functions.invoke('get-history', {
            body: { type: 'bets', userId: currentUser.id, limit: 20 }
        })

        if (error) throw error

        let bets = data.data

        // 如果没有真实数据，添加一些测试数据用于演示
        if (!bets || bets.length === 0) {
            bets = [
                {
                    id: 'test-bet-1',
                    selected_numbers: {
                        "1": [1, 2],
                        "2": [3],
                        "5": [7]
                    },
                    bet_amount: 15.00,
                    potential_payout: 147.00,
                    actual_payout: 147.00,
                    is_winner: true,
                    status: 'settled',
                    placed_at: '2024-12-01T14:35:00Z',
                    rounds: {
                        round_number: 138,
                        winning_numbers: [1, 5, 3, 8, 2, 9, 4, 6, 10, 7]
                    }
                },
                {
                    id: 'test-bet-2',
                    selected_numbers: {
                        "1": [5],
                        "3": [8],
                        "10": [2]
                    },
                    bet_amount: 9.00,
                    potential_payout: 88.20,
                    actual_payout: 0.00,
                    is_winner: false,
                    status: 'settled',
                    placed_at: '2024-12-01T13:35:00Z',
                    rounds: {
                        round_number: 137,
                        winning_numbers: [2, 7, 1, 4, 9, 6, 3, 5, 8, 10]
                    }
                }
            ]
        }

        if (bets.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无投注记录</p>'
            return
        }

        const tableHTML = `
            <div class="bet-history-container">
                <!-- 投注记录列表 -->
                <div class="bet-list-section" id="betListSection">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>轮次</th>
                                    <th>选择数字</th>
                                    <th>投注金额</th>
                                    <th>状态</th>
                                    <th>收益</th>
                                    <th>时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bets.map(bet => {
            // 实时计算是否中奖
            let isActualWinner = false
            if (bet.rounds?.winning_numbers && bet.rounds.winning_numbers.length > 0) {
                const stats = WinningNumbers.calculateWinningStats(bet.selected_numbers, bet.rounds.winning_numbers)
                isActualWinner = stats.winningGroups >= 1 // 只要有一组中奖就算中奖
            } else {
                isActualWinner = bet.is_winner // 如果没有开奖数字，使用数据库中的值
            }

            return `
                                        <tr class="${isActualWinner ? 'winner' : ''}">
                                            <td>第${bet.rounds?.round_number || '-'}期</td>
                                            <td>${WinningNumbers.renderBetNumbers(bet.selected_numbers)}</td>
                                            <td>${formatCurrency(bet.bet_amount)}</td>
                                            <td>
                                                <span class="status ${bet.status}">
                                                    ${bet.status === 'settled' ? (isActualWinner ? '中奖' : '未中奖') : '待开奖'}
                                                </span>
                                            </td>
                                            <td class="${bet.actual_payout > 0 ? 'positive' : ''}">
                                                ${formatCurrency(bet.actual_payout)}
                                            </td>
                                            <td>${formatTime(bet.placed_at)}</td>
                                            <td>
                                                <button class="detail-btn" onclick="showBetDetailInModal('${bet.id}')" title="查看详情">
                                                    📋 详情
                                                </button>
                                            </td>
                                        </tr>
                                    `
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 投注详情显示区域 -->
                <div class="bet-detail-section" id="betDetailSection" style="display: none;">
                    <div class="detail-header">
                        <button class="back-to-list-btn" onclick="backToBetList()">
                            ← 返回投注记录
                        </button>
                        <h3 class="detail-title">投注详情</h3>
                    </div>
                    <div class="detail-content" id="betDetailContent">
                        <!-- 详情内容将在这里显示 -->
                    </div>
                </div>
            </div>
        `

        container.innerHTML = tableHTML
    } catch (error) {
        container.innerHTML = `<p class="error-message">加载投注记录失败: ${error.message}</p>`
    }
}

// 加载用户交易记录
async function loadUserTransactions(container) {
    container.innerHTML = '<div class="loading">加载中...</div>'

    // 这里可以加载充值和提现记录
    // 暂时显示占位内容
    container.innerHTML = `
        <div class="transaction-list">
            <p class="empty-message">交易记录功能开发中...</p>
        </div>
    `
}

// 加载历史记录数据
async function loadHistoryData() {
    const container = document.querySelector('#historyModal .modal-body')
    if (!container) return

    container.innerHTML = '<div class="loading">加载中...</div>'

    try {
        const { data, error } = await supabaseClient.functions.invoke('get-history', {
            body: { type: 'rounds', limit: 50 }
        })

        if (error) throw error

        const rounds = data.data
        if (!rounds || rounds.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无开奖记录</p>'
            return
        }

        const tableHTML = `
            <div class="history-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>期数</th>
                            <th>开奖数字</th>
                            <th>开奖时间</th>
                            <th>投注数</th>
                            <th>中奖数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rounds.map(round => `
                            <tr>
                                <td>第${round.round_number}期</td>
                                <td class="winning-numbers">
                                    ${WinningNumbers.render(round.winning_numbers, { size: 'small' })}
                                </td>
                                <td>${formatTime(round.draw_time)}</td>
                                <td>${round.total_bets_count || 0}</td>
                                <td>${round.winning_bets || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `

        container.innerHTML = tableHTML
    } catch (error) {
        container.innerHTML = `<p class="error-message">加载历史记录失败: ${error.message}</p>`
    }
}

// 处理充值
async function processRecharge() {
    const amountInput = document.getElementById('rechargeAmount')
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')

    if (!amountInput || !paymentMethod) {
        showToast('请填写完整信息', 'error')
        return
    }

    const amount = parseFloat(amountInput.value)
    if (!amount || amount < 10) {
        showToast('充值金额不能少于10金币', 'error')
        return
    }

    if (amount > 50000) {
        showToast('单次充值金额不能超过50000金币', 'error')
        return
    }

    try {
        showToast('正在处理充值...', 'info')

        const { data, error } = await supabaseClient.functions.invoke('manage-balance', {
            body: {
                action: 'recharge',
                userId: currentUser.id,
                amount: amount,
                paymentMethod: paymentMethod.value,
                paymentId: 'demo_' + Date.now()
            }
        })

        if (error) throw error

        showToast('充值成功！', 'success')
        closeModal('rechargeModal')

        // 更新余额显示
        await updateBalance()

    } catch (error) {
        showToast(`充值失败: ${error.message}`, 'error')
    }
}

// 在模态框中显示投注详情
async function showBetDetailInModal(betId) {
    try {
        // 隐藏投注列表，显示详情区域
        document.getElementById('betListSection').style.display = 'none'
        document.getElementById('betDetailSection').style.display = 'block'

        // 显示加载状态
        document.getElementById('betDetailContent').innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在加载投注详情...</p>
            </div>
        `

        // 获取投注详情数据
        let betData = null

        // 检查是否是测试数据
        if (betId.startsWith('test-bet-')) {
            betData = getTestBetData(betId)
        } else {
            // 从数据库获取真实数据
            // 首先检查用户是否已登录
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
            if (userError || !user) {
                throw new Error('请先登录')
            }

            const { data, error } = await supabaseClient
                .from('bets')
                .select(`
                    *,
                    rounds (
                        round_number,
                        winning_numbers,
                        status,
                        start_time,
                        end_time,
                        draw_time
                    )
                `)
                .eq('id', betId)
                .eq('user_id', user.id)  // 确保只能查看自己的投注
                .single()

            if (error) throw error
            betData = data
        }

        if (!betData) {
            throw new Error('未找到投注数据')
        }

        // 渲染投注详情
        renderBetDetailInModal(betData)

    } catch (error) {
        console.error('加载投注详情失败:', error)
        document.getElementById('betDetailContent').innerHTML = `
            <div class="error-state">
                <p>❌ 加载失败: ${error.message}</p>
                <button class="retry-btn" onclick="showBetDetailInModal('${betId}')">重试</button>
            </div>
        `
    }
}

// 返回投注记录列表
function backToBetList() {
    document.getElementById('betDetailSection').style.display = 'none'
    document.getElementById('betListSection').style.display = 'block'
}

// 获取测试投注数据
function getTestBetData(betId) {
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
        }
    }

    return testData[betId] || null
}

// 在模态框中渲染投注详情
function renderBetDetailInModal(bet) {
    const round = bet.rounds

    // 实时计算是否中奖（不依赖数据库中的is_winner字段）
    let isActualWinner = false

    if (round?.winning_numbers && round.winning_numbers.length > 0) {
        const stats = WinningNumbers.calculateWinningStats(bet.selected_numbers, round.winning_numbers)
        isActualWinner = stats.winningGroups >= 1 // 只要有一组中奖就算中奖
    } else {
        isActualWinner = bet.is_winner // 如果没有开奖数字，使用数据库中的值
    }

    // 计算盈亏
    const profitLoss = bet.actual_payout - bet.bet_amount
    const profitLossClass = profitLoss > 0 ? 'positive' : profitLoss < 0 ? 'negative' : 'neutral'
    const profitLossText = profitLoss > 0 ? `+${formatCurrency(profitLoss)}` : formatCurrency(profitLoss)

    const html = `
        <div class="bet-detail-card">
            <!-- 基本信息 -->
            <div class="detail-section">
                <h4 class="section-title">
                    <span class="section-icon">📋</span>
                    基本信息
                    ${isActualWinner ? '<span class="winner-badge">🏆 中奖</span>' : ''}
                </h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">投注ID</div>
                        <div class="detail-value">${bet.id.slice(0, 8)}...</div>
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
                            <span class="status ${bet.status}">
                                ${bet.status === 'settled' ? (isActualWinner ? '已中奖' : '未中奖') : '待开奖'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 投注内容 -->
            <div class="detail-section">
                <h4 class="section-title">
                    <span class="section-icon">🎯</span>
                    投注内容
                     <div class="draw-time">
                        开奖时间: ${formatTime(round.draw_time)}
                    </div>
                </h4>
                <div class="bet-numbers-display">
                    ${WinningNumbers.renderBetNumbers(bet.selected_numbers, { size: 'medium' }, round?.winning_numbers)}
                </div>
                ${round?.winning_numbers && round.winning_numbers.length > 0 ? `
                    <div class="winning-numbers-display">
                        ${WinningNumbers.renderDetailed(round.winning_numbers)}
                    </div>
            ` : ''}
            </div>

            <!-- 财务信息 -->
            <div class="detail-section">
                <h4 class="section-title">
                    <span class="section-icon">💰</span>
                    财务信息
                </h4>
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
                        <div class="detail-value ${bet.actual_payout > 0 ? 'success' : ''}">${formatCurrency(bet.actual_payout)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">盈亏</div>
                        <div class="detail-value ${profitLossClass}">
                            ${profitLossText}
                        </div>
                    </div>
                </div>

                <div class="financial-analysis">
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
                    ${bet.status === 'settled' && bet.settled_at ? `
                        <div class="analysis-item">
                            <span>结算时间:</span>
                            <span>${formatTime(bet.settled_at)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `

    document.getElementById('betDetailContent').innerHTML = html
}

// 渲染中奖统计
function renderWinningStats(selectedNumbers, winningNumbers) {
    if (!winningNumbers || winningNumbers.length === 0) {
        return ''
    }

    const stats = WinningNumbers.calculateWinningStats(selectedNumbers, winningNumbers)

    if (stats.totalGroups === 0) {
        return ''
    }

    const hasWinnings = stats.winningGroups > 0
    const winRate = (stats.winRate * 100).toFixed(1)

    return `
        <div class="winning-stats ${hasWinnings ? 'has-winnings' : ''}">
            <div class="winning-stats-title">
                ${hasWinnings ? '🎯' : '📊'} 中奖统计
            </div>
            <div class="winning-stats-content">
                <div class="winning-stat-item">
                    <div class="winning-stat-label">投注组数</div>
                    <div class="winning-stat-value">${stats.totalGroups}</div>
                </div>
                <div class="winning-stat-item">
                    <div class="winning-stat-label">中奖组数</div>
                    <div class="winning-stat-value ${hasWinnings ? 'success' : ''}">${stats.winningGroups}</div>
                </div>
                <div class="winning-stat-item">
                    <div class="winning-stat-label">中奖率</div>
                    <div class="winning-stat-value ${hasWinnings ? 'highlight' : ''}">${winRate}%</div>
                </div>
            </div>
            ${hasWinnings ? `
                <div style="margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.8);">
                    中奖组别: ${stats.winningDetails
                .filter(detail => detail.isWinning)
                .map(detail => `第${detail.group}组`)
                .join(', ')}
                </div>
            ` : ''}
        </div>
    `
}

// 渲染投注分析
function renderBetAnalysis(metadata) {
    if (!metadata || !metadata.original_bets) {
        return ''
    }

    const originalBets = metadata.original_bets
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

    return `
        <div class="bet-analysis">
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
                <span>${formatCurrency(metadata.bet_count ? (originalBets.reduce((sum, bet) => sum + bet.amount, 0) / totalBets) : 0)}</span>
            </div>
        </div>
    `
}

// 导出函数供全局使用
window.showBetDetailInModal = showBetDetailInModal
window.backToBetList = backToBetList

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 为所有模态框添加关闭按钮事件
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal')
            if (modal) {
                closeModal(modal.id)
            }
        })
    })
})
