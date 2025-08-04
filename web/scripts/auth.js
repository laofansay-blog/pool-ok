// 认证相关脚本

// Supabase 客户端初始化
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

// 当前用户
let currentUser = null

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initAuthPage()
})

// 初始化认证页面
function initAuthPage() {
    // 检查是否已登录
    checkAuthStatus()
    
    // 初始化选项卡切换
    initAuthTabs()
    
    // 初始化表单事件
    initAuthForms()
    
    // 初始化社交登录
    initSocialLogin()
}

// 检查认证状态
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        
        if (error) {
            console.error('检查认证状态失败:', error)
            return
        }
        
        if (user) {
            // 用户已登录，跳转到主页
            window.location.href = 'index.html'
        }
    } catch (error) {
        console.error('检查认证状态异常:', error)
    }
}

// 初始化选项卡切换
function initAuthTabs() {
    const tabBtns = document.querySelectorAll('.auth-tabs .tab-btn')
    const authForms = document.querySelectorAll('.auth-form')
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabType = btn.dataset.tab
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            
            // 更新表单显示
            authForms.forEach(form => {
                form.classList.remove('active')
            })
            
            const targetForm = document.getElementById(tabType + 'Form')
            if (targetForm) {
                targetForm.classList.add('active')
            }
        })
    })
}

// 初始化表单事件
function initAuthForms() {
    // 登录表单
    const loginForm = document.getElementById('loginForm')
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin)
    }
    
    // 注册表单
    const registerForm = document.getElementById('registerForm')
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister)
    }
    
    // 忘记密码表单
    const forgotForm = document.getElementById('forgotPasswordForm')
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword)
    }
    
    // 密码确认验证
    const confirmPasswordInput = document.getElementById('confirmPassword')
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch)
    }
    
    // 实时邮箱验证
    const emailInputs = document.querySelectorAll('input[type="email"]')
    emailInputs.forEach(input => {
        input.addEventListener('blur', validateEmailInput)
    })
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault()
    
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value
    const rememberMe = document.getElementById('rememberMe').checked
    
    // 验证输入
    if (!email || !password) {
        showToast('请填写完整的登录信息', 'error')
        return
    }
    
    if (!validateEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error')
        return
    }
    
    try {
        showToast('正在登录...', 'info')
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) {
            throw error
        }
        
        // 保存登录状态
        if (rememberMe) {
            storage.set('rememberLogin', true)
        }
        
        showToast('登录成功！', 'success')
        
        // 跳转到主页
        setTimeout(() => {
            window.location.href = 'index.html'
        }, 1000)
        
    } catch (error) {
        console.error('登录失败:', error)
        
        let errorMessage = '登录失败'
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = '邮箱或密码错误'
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '请先验证邮箱'
        } else if (error.message.includes('Too many requests')) {
            errorMessage = '请求过于频繁，请稍后再试'
        }
        
        showToast(errorMessage, 'error')
    }
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault()
    
    const email = document.getElementById('registerEmail').value.trim()
    const username = document.getElementById('registerUsername').value.trim()
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value
    const agreeTerms = document.getElementById('agreeTerms').checked
    
    // 验证输入
    if (!email || !username || !password || !confirmPassword) {
        showToast('请填写完整的注册信息', 'error')
        return
    }
    
    if (!validateEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error')
        return
    }
    
    if (username.length < 3) {
        showToast('用户名长度至少3位', 'error')
        return
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
        showToast(passwordValidation.errors[0], 'error')
        return
    }
    
    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error')
        return
    }
    
    if (!agreeTerms) {
        showToast('请同意服务条款和隐私政策', 'error')
        return
    }
    
    try {
        showToast('正在注册...', 'info')
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    full_name: username
                }
            }
        })
        
        if (error) {
            throw error
        }
        
        if (data.user && !data.session) {
            // 需要邮箱验证
            showToast('注册成功！请检查邮箱并点击验证链接', 'success')
        } else {
            // 直接登录成功
            showToast('注册成功！', 'success')
            setTimeout(() => {
                window.location.href = 'index.html'
            }, 1000)
        }
        
    } catch (error) {
        console.error('注册失败:', error)
        
        let errorMessage = '注册失败'
        if (error.message.includes('User already registered')) {
            errorMessage = '该邮箱已被注册'
        } else if (error.message.includes('Password should be at least')) {
            errorMessage = '密码长度不符合要求'
        } else if (error.message.includes('Invalid email')) {
            errorMessage = '邮箱格式不正确'
        }
        
        showToast(errorMessage, 'error')
    }
}

// 处理忘记密码
async function handleForgotPassword(event) {
    event.preventDefault()
    
    const email = document.getElementById('resetEmail').value.trim()
    
    if (!email) {
        showToast('请输入邮箱地址', 'error')
        return
    }
    
    if (!validateEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error')
        return
    }
    
    try {
        showToast('正在发送重置链接...', 'info')
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        })
        
        if (error) {
            throw error
        }
        
        showToast('重置链接已发送到您的邮箱', 'success')
        closeModal('forgotPasswordModal')
        
    } catch (error) {
        console.error('发送重置链接失败:', error)
        showToast('发送重置链接失败，请稍后再试', 'error')
    }
}

// 发送重置邮件
async function sendResetEmail() {
    const form = document.getElementById('forgotPasswordForm')
    if (form) {
        handleForgotPassword({ preventDefault: () => {} })
    }
}

// 验证密码匹配
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value
    const confirmInput = document.getElementById('confirmPassword')
    
    if (confirmPassword && password !== confirmPassword) {
        confirmInput.setCustomValidity('密码不匹配')
        confirmInput.style.borderColor = '#f44336'
    } else {
        confirmInput.setCustomValidity('')
        confirmInput.style.borderColor = ''
    }
}

// 验证邮箱输入
function validateEmailInput(event) {
    const input = event.target
    const email = input.value.trim()
    
    if (email && !validateEmail(email)) {
        input.style.borderColor = '#f44336'
        showToast('邮箱格式不正确', 'warning')
    } else {
        input.style.borderColor = ''
    }
}

// 初始化社交登录
function initSocialLogin() {
    // 监听认证状态变化
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user
            showToast('登录成功！', 'success')
            setTimeout(() => {
                window.location.href = 'index.html'
            }, 1000)
        }
    })
}

// Google 登录
async function loginWithGoogle() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/index.html`
            }
        })
        
        if (error) {
            throw error
        }
        
    } catch (error) {
        console.error('Google 登录失败:', error)
        showToast('Google 登录失败', 'error')
    }
}

// GitHub 登录
async function loginWithGithub() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/index.html`
            }
        })
        
        if (error) {
            throw error
        }
        
    } catch (error) {
        console.error('GitHub 登录失败:', error)
        showToast('GitHub 登录失败', 'error')
    }
}

// 自动填充记住的登录信息
function loadRememberedLogin() {
    const rememberLogin = storage.get('rememberLogin')
    if (rememberLogin) {
        const rememberCheckbox = document.getElementById('rememberMe')
        if (rememberCheckbox) {
            rememberCheckbox.checked = true
        }
    }
}

// 页面加载完成后加载记住的登录信息
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedLogin()
})
