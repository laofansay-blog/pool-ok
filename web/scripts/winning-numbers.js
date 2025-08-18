// 开奖数字彩色显示组件
class WinningNumbersComponent {
    constructor() {
        // 定义10种颜色，对应10个位置
        this.colors = [
            '#FF6B6B', // 红色 - 第1位
            '#4ECDC4', // 青色 - 第2位
            '#45B7D1', // 蓝色 - 第3位
            '#96CEB4', // 绿色 - 第4位
            '#FFEAA7', // 黄色 - 第5位
            '#DDA0DD', // 紫色 - 第6位
            '#98D8C8', // 薄荷绿 - 第7位
            '#F7DC6F', // 金色 - 第8位
            '#BB8FCE', // 淡紫色 - 第9位
            '#85C1E9'  // 天蓝色 - 第10位
        ]

        // 对应的文字颜色（确保对比度）
        this.textColors = [
            '#FFFFFF', // 白色
            '#FFFFFF', // 白色
            '#FFFFFF', // 白色
            '#FFFFFF', // 白色
            '#2C3E50', // 深色
            '#FFFFFF', // 白色
            '#2C3E50', // 深色
            '#2C3E50', // 深色
            '#FFFFFF', // 白色
            '#FFFFFF'  // 白色
        ]
    }

    /**
     * 渲染开奖数字
     * @param {Array} numbers - 开奖数字数组 (10个数字)
     * @param {Object} options - 配置选项
     * @param {string} options.size - 尺寸 ('small', 'medium', 'large')
     * @param {boolean} options.showPosition - 是否显示位置标识
     * @param {string} options.className - 额外的CSS类名
     * @returns {string} HTML字符串
     */
    render(numbers, options = {}) {
        const {
            size = 'medium',
            showPosition = false,
            className = ''
        } = options

        if (!Array.isArray(numbers) || numbers.length !== 10) {
            console.warn('开奖数字必须是包含10个数字的数组')
            return '<span class="error">数据格式错误</span>'
        }

        const sizeClass = `winning-numbers-${size}`
        const containerClass = `winning-numbers-container ${sizeClass} ${className}`.trim()

        return `
            <div class="${containerClass}">
                ${numbers.map((number, index) => this.renderSingleNumber(number, index, showPosition)).join('')}
            </div>
        `
    }

    /**
     * 渲染单个数字
     * @param {number} number - 数字
     * @param {number} position - 位置 (0-9)
     * @param {boolean} showPosition - 是否显示位置
     * @returns {string} HTML字符串
     */
    renderSingleNumber(number, position, showPosition) {
        const backgroundColor = this.colors[position]
        const textColor = this.textColors[position]
        const positionLabel = showPosition ? `<span class="position-label">${position + 1}</span>` : ''

        return `
            <div class="winning-number-item" 
                 style="background-color: ${backgroundColor}; color: ${textColor};"
                 data-position="${position + 1}"
                 title="第${position + 1}位: ${number}">
                ${positionLabel}
                <span class="number-value">${number}</span>
            </div>
        `
    }

    /**
     * 渲染简化版本（用于历史记录列表）
     * @param {Array} numbers - 开奖数字数组
     * @returns {string} HTML字符串
     */
    renderCompact(numbers) {
        return this.render(numbers, { size: 'small', className: 'compact' })
    }

    /**
     * 渲染详细版本（用于开奖结果展示）
     * @param {Array} numbers - 开奖数字数组
     * @returns {string} HTML字符串
     */
    renderDetailed(numbers) {
        return this.render(numbers, { size: 'large', showPosition: true, className: 'detailed' })
    }

    /**
     * 获取位置对应的颜色
     * @param {number} position - 位置 (0-9)
     * @returns {Object} 包含背景色和文字色的对象
     */
    getPositionColor(position) {
        if (position < 0 || position >= 10) {
            return { backgroundColor: '#CCCCCC', textColor: '#333333' }
        }
        return {
            backgroundColor: this.colors[position],
            textColor: this.textColors[position]
        }
    }

    /**
     * 为现有的数字元素添加颜色
     * @param {HTMLElement} container - 容器元素
     * @param {Array} numbers - 开奖数字数组
     */
    applyColorsToExisting(container, numbers) {
        const numberElements = container.querySelectorAll('.number-badge, .winning-number')

        numberElements.forEach((element, index) => {
            if (index < 10 && index < numbers.length) {
                const colors = this.getPositionColor(index)
                element.style.backgroundColor = colors.backgroundColor
                element.style.color = colors.textColor
                element.setAttribute('data-position', index + 1)
                element.setAttribute('title', `第${index + 1}位: ${numbers[index]}`)
            }
        })
    }

    /**
     * 渲染投注记录中的选择数字（JSONB格式）
     * @param {Object|Array} selectedNumbers - 投注的数字（可能是JSONB对象或旧格式数组）
     * @param {Object} options - 配置选项
     * @returns {string} HTML字符串
     */
    renderBetNumbers(selectedNumbers, options = {}) {
        const { size = 'small', showEmpty = false } = options

        // 如果是旧格式（数组），直接渲染
        if (Array.isArray(selectedNumbers)) {
            return this.render(selectedNumbers, { size })
        }

        // 如果是新格式（JSONB对象）
        if (typeof selectedNumbers === 'object' && selectedNumbers !== null) {
            const betNumbers = []
            const betGroups = []

            // 遍历10个组
            for (let group = 1; group <= 10; group++) {
                const groupKey = group.toString()
                const groupNumbers = selectedNumbers[groupKey] || []

                if (groupNumbers.length > 0) {
                    groupNumbers.forEach(number => {
                        betNumbers.push({ group, number })
                        betGroups.push(`${group}-${number}`)
                    })
                }
            }

            if (betNumbers.length === 0) {
                return '<span class="no-bets">无投注</span>'
            }

            // 渲染投注的组合
            return `
                <div class="bet-numbers-container">
                    ${betNumbers.map(({ group, number }) => {
                const colors = this.getPositionColor(group - 1)
                return `
                            <span class="bet-number-badge ${size}"
                                  style="background-color: ${colors.backgroundColor}; color: ${colors.textColor};"
                                  title="第${group}组: ${number}">
                                ${group}-${number}
                            </span>
                        `
            }).join('')}
                </div>
            `
        }

        // 如果格式不正确
        return '<span class="error">数据格式错误</span>'
    }

    /**
     * 将JSONB格式的投注数字转换为文字描述
     * @param {Object|Array} selectedNumbers - 投注的数字
     * @returns {string} 文字描述
     */
    formatBetNumbersText(selectedNumbers) {
        // 如果是旧格式（数组）
        if (Array.isArray(selectedNumbers)) {
            return selectedNumbers.join(', ')
        }

        // 如果是新格式（JSONB对象）
        if (typeof selectedNumbers === 'object' && selectedNumbers !== null) {
            const betDescriptions = []

            // 遍历10个组
            for (let group = 1; group <= 10; group++) {
                const groupKey = group.toString()
                const groupNumbers = selectedNumbers[groupKey] || []

                if (groupNumbers.length > 0) {
                    betDescriptions.push(`第${group}组: ${groupNumbers.join(',')}`)
                }
            }

            return betDescriptions.length > 0 ? betDescriptions.join(' | ') : '无投注'
        }

        return '数据格式错误'
    }
}

// 创建全局实例
const WinningNumbers = new WinningNumbersComponent()

// 导出组件（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WinningNumbersComponent
}
