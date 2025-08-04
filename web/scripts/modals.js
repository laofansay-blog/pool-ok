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
        
        const bets = data.data
        if (!bets || bets.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无投注记录</p>'
            return
        }
        
        const tableHTML = `
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
                        </tr>
                    </thead>
                    <tbody>
                        ${bets.map(bet => `
                            <tr class="${bet.is_winner ? 'winner' : ''}">
                                <td>第${bet.rounds?.round_number || '-'}期</td>
                                <td>${bet.selected_numbers.join(', ')}</td>
                                <td>${formatCurrency(bet.bet_amount)}</td>
                                <td>
                                    <span class="status ${bet.status}">
                                        ${bet.status === 'settled' ? (bet.is_winner ? '中奖' : '未中奖') : '待开奖'}
                                    </span>
                                </td>
                                <td class="${bet.actual_payout > 0 ? 'positive' : ''}">
                                    ${formatCurrency(bet.actual_payout)}
                                </td>
                                <td>${formatTime(bet.placed_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
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
                                    ${round.winning_numbers.map(num => 
                                        `<span class="number-badge">${num}</span>`
                                    ).join('')}
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
