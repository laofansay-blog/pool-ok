// 主应用脚本
const { createClient } = supabase
const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

let selectedNumbers = []
let currentUser = null
let countdownInterval = null
let currentRound = null

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth()
    initializeNumberGrid()
    await loadCurrentRound()
    startCountdown()
    loadHistory()

    // 绑定事件
    const betAmountInput = document.getElementById('betAmount')
    if (betAmountInput) {
        betAmountInput.addEventListener('input', updateBetButton)
        betAmountInput.addEventListener('input', updatePotentialWin)
    }

    const logoutBtn = document.getElementById('logout')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout)
    }

    const placeBetBtn = document.getElementById('placeBet')
    if (placeBetBtn) {
        placeBetBtn.addEventListener('click', placeBet)
    }

    const clearAllBtn = document.getElementById('clearAll')
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllSelections)
    }

    const singleBetAmountInput = document.getElementById('singleBetAmount')
    if (singleBetAmountInput) {
        singleBetAmountInput.addEventListener('input', updateBetSummary)
    }

    // 监听认证状态变化
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html'
        }
    })
})

// 检查用户认证
async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        window.location.href = 'login.html'
        return
    }
    currentUser = user
    await updateBalance()
}

// 退出登录
async function logout() {
    await supabaseClient.auth.signOut()
    window.location.href = 'login.html'
}

// 生成数字组
function initializeNumberGrid() {
    const container = document.getElementById('numberGroups')
    if (!container) return

    // 清空现有内容
    container.innerHTML = ''

    // 创建10组数字
    for (let group = 1; group <= 10; group++) {
        const groupDiv = document.createElement('div')
        groupDiv.className = 'number-group'
        groupDiv.setAttribute('data-group', group)

        // 组头部
        const groupHeader = document.createElement('div')
        groupHeader.className = 'group-header'
        groupHeader.innerHTML = `
            <span class="group-name">第${getChineseNumber(group)}组</span>
            <div class="quick-select">
                <button class="quick-btn" data-action="all" data-group="${group}">全</button>
                <button class="quick-btn" data-action="big" data-group="${group}">大</button>
                <button class="quick-btn" data-action="small" data-group="${group}">小</button>
                <button class="quick-btn" data-action="odd" data-group="${group}">单</button>
                <button class="quick-btn" data-action="even" data-group="${group}">双</button>
                <button class="quick-btn" data-action="clear" data-group="${group}">清</button>
            </div>
        `

        // 数字容器
        const numbersDiv = document.createElement('div')
        numbersDiv.className = 'group-numbers'

        // 创建1-10的数字圆圈
        for (let num = 1; num <= 10; num++) {
            const circle = document.createElement('div')
            circle.className = 'number-circle'
            circle.setAttribute('data-number', num)
            circle.setAttribute('data-group', group)
            circle.textContent = num
            circle.onclick = () => toggleNumber(num, group, circle)
            numbersDiv.appendChild(circle)
        }

        groupDiv.appendChild(groupHeader)
        groupDiv.appendChild(numbersDiv)
        container.appendChild(groupDiv)
    }

    // 添加快速选择按钮的事件监听器
    initializeQuickSelectButtons()
}

// 初始化快速选择按钮
function initializeQuickSelectButtons() {
    // 使用延迟确保DOM已经更新
    setTimeout(() => {
        const buttons = document.querySelectorAll('.quick-btn')
        console.log('找到快速选择按钮数量:', buttons.length)

        buttons.forEach((btn, index) => {
            console.log(`绑定按钮 ${index}:`, btn.textContent, btn.getAttribute('data-action'))

            // 移除可能存在的旧事件监听器
            btn.removeEventListener('click', handleQuickSelectClick)
            // 添加新的事件监听器
            btn.addEventListener('click', handleQuickSelectClick)
        })
    }, 100)
}

// 快速选择按钮点击处理函数
function handleQuickSelectClick(e) {
    e.preventDefault()
    e.stopPropagation()

    console.log('快速选择按钮被点击:', this.textContent)

    const action = this.getAttribute('data-action')
    const group = parseInt(this.getAttribute('data-group'))

    console.log('执行操作:', action, '组:', group)
    handleQuickSelect(action, group)
}

// 处理快速选择
function handleQuickSelect(action, group) {
    console.log(`处理快速选择: ${action}, 组: ${group}`)

    const groupElement = document.querySelector(`[data-group="${group}"]`)
    if (!groupElement) {
        console.error('未找到组元素:', group)
        return
    }

    const numbers = groupElement.querySelectorAll('.number-circle')
    const quickBtns = groupElement.querySelectorAll('.quick-btn')
    console.log('找到数字圆圈数量:', numbers.length)

    // 清除该组所有按钮的激活状态
    quickBtns.forEach(btn => btn.classList.remove('active'))

    // 先清除该组的所有选择
    numbers.forEach(circle => {
        const number = parseInt(circle.getAttribute('data-number'))
        const selection = `${group}-${number}`
        const index = selectedNumbers.indexOf(selection)
        if (index > -1) {
            selectedNumbers.splice(index, 1)
            circle.classList.remove('selected')
        }
    })

    // 如果不是清除操作，则激活当前按钮并执行选择
    if (action !== 'clear') {
        // 激活当前按钮
        const currentBtn = groupElement.querySelector(`[data-action="${action}"]`)
        if (currentBtn) {
            currentBtn.classList.add('active')
        }
    }

    switch (action) {
        case 'all':
            // 选择全部
            numbers.forEach(circle => {
                const selection = `${group}-${circle.getAttribute('data-number')}`
                if (!selectedNumbers.includes(selection)) {
                    selectedNumbers.push(selection)
                    circle.classList.add('selected')
                }
            })
            break

        case 'big':
            // 选择大号 (6-10)
            numbers.forEach(circle => {
                const number = parseInt(circle.getAttribute('data-number'))
                const selection = `${group}-${number}`
                if (number >= 6 && number <= 10) {
                    if (!selectedNumbers.includes(selection)) {
                        selectedNumbers.push(selection)
                        circle.classList.add('selected')
                    }
                }
            })
            break

        case 'small':
            // 选择小号 (1-5)
            numbers.forEach(circle => {
                const number = parseInt(circle.getAttribute('data-number'))
                const selection = `${group}-${number}`
                if (number >= 1 && number <= 5) {
                    if (!selectedNumbers.includes(selection)) {
                        selectedNumbers.push(selection)
                        circle.classList.add('selected')
                    }
                }
            })
            break

        case 'odd':
            // 选择单号
            numbers.forEach(circle => {
                const number = parseInt(circle.getAttribute('data-number'))
                const selection = `${group}-${number}`
                if (number % 2 === 1) {
                    if (!selectedNumbers.includes(selection)) {
                        selectedNumbers.push(selection)
                        circle.classList.add('selected')
                    }
                }
            })
            break

        case 'even':
            // 选择双号
            numbers.forEach(circle => {
                const number = parseInt(circle.getAttribute('data-number'))
                const selection = `${group}-${number}`
                if (number % 2 === 0) {
                    if (!selectedNumbers.includes(selection)) {
                        selectedNumbers.push(selection)
                        circle.classList.add('selected')
                    }
                }
            })
            break

        case 'clear':
            // 清除该组选择
            numbers.forEach(circle => {
                const number = parseInt(circle.getAttribute('data-number'))
                const selection = `${group}-${number}`
                const index = selectedNumbers.indexOf(selection)
                if (index > -1) {
                    selectedNumbers.splice(index, 1)
                    circle.classList.remove('selected')
                }
            })
            break
    }

    // 更新显示
    updateSelectedDisplay()
    updateBetButton()
    updateBetSummary()
}

// 获取中文数字
function getChineseNumber(num) {
    const chinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    return chinese[num] || num.toString()
}

// 切换数字选择
function toggleNumber(number, group, circle) {
    const selection = `${group}-${number}` // 组-数字的格式

    if (selectedNumbers.includes(selection)) {
        selectedNumbers = selectedNumbers.filter(n => n !== selection)
        circle.classList.remove('selected')
    } else {
        selectedNumbers.push(selection)
        circle.classList.add('selected')
    }

    updateSelectedDisplay()
    updateBetButton()
    updateBetSummary()
}

// 更新选中显示
function updateSelectedDisplay() {
    const display = document.getElementById('selectedDisplay')
    if (display) {
        display.textContent = selectedNumbers.length > 0 ?
            selectedNumbers.sort().join(', ') : '无'
    }
}

// 更新下注汇总
function updateBetSummary() {
    const selectedCountEl = document.getElementById('selectedCount')
    const singleBetAmountEl = document.getElementById('singleBetAmount')
    const totalAmountEl = document.getElementById('totalAmount')

    if (selectedCountEl) {
        selectedCountEl.textContent = selectedNumbers.length
    }

    if (singleBetAmountEl && totalAmountEl) {
        const singleAmount = parseFloat(singleBetAmountEl.value) || 2
        const totalAmount = selectedNumbers.length * singleAmount
        totalAmountEl.textContent = `${totalAmount} 元`
    }
}

// 更新下注按钮状态
function updateBetButton() {
    const betBtn = document.getElementById('placeBet')
    const singleBetAmountEl = document.getElementById('singleBetAmount')
    const singleAmount = singleBetAmountEl ? parseFloat(singleBetAmountEl.value) : 2

    if (betBtn) {
        betBtn.disabled = selectedNumbers.length === 0 || !singleAmount || singleAmount < 1
    }
}

// 下注
async function placeBet() {
    const singleBetAmountEl = document.getElementById('singleBetAmount')
    if (!singleBetAmountEl) return

    const singleAmount = parseFloat(singleBetAmountEl.value)
    const totalAmount = selectedNumbers.length * singleAmount

    // 验证输入
    if (!singleAmount || singleAmount < 1) {
        showToast('单注金额不能少于 1 元', 'error')
        return
    }

    if (selectedNumbers.length === 0) {
        showToast('请至少选择一个数字', 'error')
        return
    }

    if (totalAmount > 10000) {
        showToast('总下注金额不能超过 10000 元', 'error')
        return
    }

    try {
        showToast('正在下注...', 'info')

        // 将选择的数字转换为适合后端的格式
        const betData = selectedNumbers.map(selection => {
            const [group, number] = selection.split('-')
            return {
                group: parseInt(group),
                number: parseInt(number),
                amount: singleAmount
            }
        })

        const { error } = await supabaseClient.functions.invoke(CONFIG.API.ENDPOINTS.PLACE_BET, {
            body: {
                bets: betData,
                totalAmount: totalAmount,
                userId: currentUser.id
            }
        })

        if (error) throw error

        showToast(`下注成功！共 ${selectedNumbers.length} 注，总金额 ${totalAmount} 元`, 'success')
        resetBetting()
        await updateBalance()

    } catch (error) {
        console.error('下注失败:', error)
        showToast(`下注失败: ${error.message}`, 'error')
    }
}

// 清空所有选择
function clearAllSelections() {
    selectedNumbers = []
    document.querySelectorAll('.number-circle.selected').forEach(circle => {
        circle.classList.remove('selected')
    })
    updateSelectedDisplay()
    updateBetButton()
    updateBetSummary()
}

// 重置下注状态
function resetBetting() {
    clearAllSelections()
}

// 加载当前轮次信息
async function loadCurrentRound() {
    try {
        const { data, error } = await supabaseClient
            .from('rounds')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        currentRound = data

        // 更新期数显示
        if (data) {
            updateRoundDisplay(data)
        }

    } catch (error) {
        console.error('加载当前轮次失败:', error)
    }
}

// 更新期数显示
function updateRoundDisplay(round) {
    const roundNumberEl = document.getElementById('roundNumber')
    if (roundNumberEl && round) {
        // 生成期数格式：年月日 + 流水号
        const date = new Date(round.created_at)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const sequence = String(round.round_number).padStart(3, '0')

        const roundNumber = `${year}${month}${day}${sequence}`
        roundNumberEl.textContent = roundNumber
    }
}

// 倒计时
function startCountdown() {
    const timer = document.getElementById('timer')
    if (!timer) return

    // 清除现有倒计时
    if (countdownInterval) {
        clearInterval(countdownInterval)
    }

    updateCountdownDisplay()

    countdownInterval = setInterval(() => {
        updateCountdownDisplay()
    }, 1000)
}

// 更新倒计时显示
function updateCountdownDisplay() {
    const timer = document.getElementById('timer')
    if (!timer || !currentRound) {
        timer.textContent = '00:00'
        return
    }

    const now = new Date()
    const endTime = new Date(currentRound.end_time)
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000))

    if (timeLeft <= 0) {
        timer.textContent = '00:00'
        // 轮次结束，重新加载
        setTimeout(async () => {
            await loadCurrentRound()
            await loadHistory()
            await updateBalance()
        }, 1000)
        return
    }

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 更新潜在收益显示
function updatePotentialWin() {
    const betAmountInput = document.getElementById('betAmount')
    const potentialWinElement = document.getElementById('potentialWin')

    if (!betAmountInput || !potentialWinElement) return

    const betAmount = parseFloat(betAmountInput.value) || 0
    const potentialWin = betAmount * CONFIG.GAME.WINNING_MULTIPLIER

    potentialWinElement.textContent = formatCurrency(potentialWin)
}

// 更新余额
async function updateBalance() {
    if (!currentUser) return

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', currentUser.id)
            .single()

        if (error) throw error

        const balanceElement = document.getElementById('balance')
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(data.balance, '').replace(' ', '')
        }
    } catch (error) {
        console.error('更新余额失败:', error)
    }
}

// 加载历史记录
async function loadHistory() {
    try {
        const { data, error } = await supabaseClient.functions.invoke('get-history', {
            body: { type: 'rounds', limit: 10 }
        })

        if (error) throw error

        const historyList = document.getElementById('historyList')
        if (!historyList) return

        const rounds = data.data || []

        if (rounds.length === 0) {
            historyList.innerHTML = '<p class="empty-message">暂无开奖记录</p>'
            return
        }

        historyList.innerHTML = rounds.map(round =>
            `<div class="history-item">
                <span class="round-number">第${round.round_number}期</span>
                <span class="winning-numbers">
                    ${round.winning_numbers.map(num =>
                `<span class="number-badge">${num}</span>`
            ).join('')}
                </span>
                <span class="round-time">${formatTime(round.draw_time)}</span>
            </div>`
        ).join('')
    } catch (error) {
        console.error('加载历史失败:', error)
        const historyList = document.getElementById('historyList')
        if (historyList) {
            historyList.innerHTML = '<p class="error-message">加载失败</p>'
        }
    }
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval)
    }
})