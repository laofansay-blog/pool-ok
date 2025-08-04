// 工具函数库

// 显示消息提示
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `

    container.appendChild(toast)

    // 自动移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove()
        }
    }, duration)

    // 添加点击移除功能
    toast.addEventListener('click', () => {
        toast.remove()
    })
}

// 格式化金额
function formatCurrency(amount, currency = 'G') {
    const num = parseFloat(amount) || 0
    return `${num.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })} ${currency}`
}

// 格式化时间
function formatTime(date) {
    if (!date) return ''
    
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    // 如果是今天
    if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }
    
    // 如果是昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.getDate() === yesterday.getDate() && 
        d.getMonth() === yesterday.getMonth() && 
        d.getFullYear() === yesterday.getFullYear()) {
        return '昨天 ' + d.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }
    
    // 其他日期
    return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 格式化倒计时
function formatCountdown(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 验证邮箱格式
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

// 验证密码强度
function validatePassword(password) {
    const errors = []
    
    if (password.length < 6) {
        errors.push('密码长度至少6位')
    }
    
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('密码必须包含字母')
    }
    
    if (!/\d/.test(password)) {
        errors.push('密码必须包含数字')
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// 节流函数
function throttle(func, limit) {
    let inThrottle
    return function() {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

// 深拷贝对象
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    if (typeof obj === 'object') {
        const clonedObj = {}
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key])
            }
        }
        return clonedObj
    }
}

// 生成随机ID
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// 本地存储工具
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value))
            return true
        } catch (error) {
            console.error('存储失败:', error)
            return false
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error('读取存储失败:', error)
            return defaultValue
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key)
            return true
        } catch (error) {
            console.error('删除存储失败:', error)
            return false
        }
    },
    
    clear() {
        try {
            localStorage.clear()
            return true
        } catch (error) {
            console.error('清空存储失败:', error)
            return false
        }
    }
}

// 数组工具
const arrayUtils = {
    // 数组去重
    unique(arr) {
        return [...new Set(arr)]
    },
    
    // 数组随机排序
    shuffle(arr) {
        const newArr = [...arr]
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
        }
        return newArr
    },
    
    // 数组分组
    chunk(arr, size) {
        const chunks = []
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
        return chunks
    },
    
    // 数组求和
    sum(arr) {
        return arr.reduce((sum, num) => sum + (parseFloat(num) || 0), 0)
    },
    
    // 数组平均值
    average(arr) {
        return arr.length > 0 ? this.sum(arr) / arr.length : 0
    }
}

// 数字工具
const numberUtils = {
    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    },
    
    // 随机浮点数
    randomFloat(min, max, decimals = 2) {
        const num = Math.random() * (max - min) + min
        return parseFloat(num.toFixed(decimals))
    },
    
    // 数字格式化
    format(num, decimals = 2) {
        return parseFloat(num).toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })
    },
    
    // 百分比格式化
    percentage(num, total, decimals = 1) {
        if (total === 0) return '0%'
        const percent = (num / total) * 100
        return `${percent.toFixed(decimals)}%`
    }
}

// DOM 工具
const domUtils = {
    // 查询元素
    $(selector) {
        return document.querySelector(selector)
    },
    
    // 查询所有元素
    $$(selector) {
        return document.querySelectorAll(selector)
    },
    
    // 添加事件监听
    on(element, event, handler) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        if (element) {
            element.addEventListener(event, handler)
        }
    },
    
    // 移除事件监听
    off(element, event, handler) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        if (element) {
            element.removeEventListener(event, handler)
        }
    },
    
    // 添加类名
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        if (element) {
            element.classList.add(className)
        }
    },
    
    // 移除类名
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        if (element) {
            element.classList.remove(className)
        }
    },
    
    // 切换类名
    toggleClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        if (element) {
            element.classList.toggle(className)
        }
    },
    
    // 检查是否有类名
    hasClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element)
        }
        return element ? element.classList.contains(className) : false
    }
}

// 导出工具函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        formatCurrency,
        formatTime,
        formatCountdown,
        validateEmail,
        validatePassword,
        debounce,
        throttle,
        deepClone,
        generateId,
        storage,
        arrayUtils,
        numberUtils,
        domUtils
    }
}
