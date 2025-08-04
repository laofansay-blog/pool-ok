// 音效管理脚本

class AudioManager {
    constructor() {
        this.sounds = {}
        this.enabled = true
        this.volume = 0.5
        
        // 初始化音效
        this.initSounds()
        
        // 从本地存储加载设置
        this.loadSettings()
    }
    
    // 初始化音效
    initSounds() {
        // 定义音效文件
        const soundFiles = {
            click: 'assets/sounds/click.mp3',
            bet: 'assets/sounds/bet.mp3',
            win: 'assets/sounds/win.mp3',
            lose: 'assets/sounds/lose.mp3',
            coin: 'assets/sounds/coin.mp3',
            countdown: 'assets/sounds/countdown.mp3',
            draw: 'assets/sounds/draw.mp3',
            ambient: 'assets/sounds/ambient.mp3'
        }
        
        // 创建音频对象
        for (const [name, file] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio(file)
                audio.volume = this.volume
                audio.preload = 'auto'
                
                // 处理加载错误
                audio.onerror = () => {
                    console.warn(`音效文件加载失败: ${file}`)
                }
                
                this.sounds[name] = audio
            } catch (error) {
                console.warn(`创建音频对象失败: ${name}`, error)
            }
        }
    }
    
    // 播放音效
    play(soundName, options = {}) {
        if (!this.enabled) return
        
        const sound = this.sounds[soundName]
        if (!sound) {
            console.warn(`音效不存在: ${soundName}`)
            return
        }
        
        try {
            // 重置播放位置
            sound.currentTime = 0
            
            // 设置音量
            if (options.volume !== undefined) {
                sound.volume = Math.max(0, Math.min(1, options.volume))
            } else {
                sound.volume = this.volume
            }
            
            // 播放音效
            const playPromise = sound.play()
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`播放音效失败: ${soundName}`, error)
                })
            }
            
        } catch (error) {
            console.warn(`播放音效异常: ${soundName}`, error)
        }
    }
    
    // 停止音效
    stop(soundName) {
        const sound = this.sounds[soundName]
        if (sound) {
            sound.pause()
            sound.currentTime = 0
        }
    }
    
    // 停止所有音效
    stopAll() {
        for (const sound of Object.values(this.sounds)) {
            sound.pause()
            sound.currentTime = 0
        }
    }
    
    // 设置音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))
        
        // 更新所有音效的音量
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.volume
        }
        
        // 保存设置
        this.saveSettings()
    }
    
    // 启用/禁用音效
    setEnabled(enabled) {
        this.enabled = enabled
        
        if (!enabled) {
            this.stopAll()
        }
        
        // 保存设置
        this.saveSettings()
    }
    
    // 切换音效开关
    toggle() {
        this.setEnabled(!this.enabled)
        return this.enabled
    }
    
    // 播放背景音乐
    playAmbient() {
        if (!this.enabled) return
        
        const ambient = this.sounds.ambient
        if (ambient) {
            ambient.loop = true
            ambient.volume = this.volume * 0.3 // 背景音乐音量较低
            ambient.play().catch(error => {
                console.warn('播放背景音乐失败:', error)
            })
        }
    }
    
    // 停止背景音乐
    stopAmbient() {
        const ambient = this.sounds.ambient
        if (ambient) {
            ambient.pause()
            ambient.currentTime = 0
        }
    }
    
    // 保存设置到本地存储
    saveSettings() {
        try {
            const settings = {
                enabled: this.enabled,
                volume: this.volume
            }
            localStorage.setItem('audioSettings', JSON.stringify(settings))
        } catch (error) {
            console.warn('保存音效设置失败:', error)
        }
    }
    
    // 从本地存储加载设置
    loadSettings() {
        try {
            const settings = localStorage.getItem('audioSettings')
            if (settings) {
                const parsed = JSON.parse(settings)
                this.enabled = parsed.enabled !== false // 默认启用
                this.volume = parsed.volume || 0.5
            }
        } catch (error) {
            console.warn('加载音效设置失败:', error)
        }
    }
}

// 创建全局音效管理器实例
const audioManager = new AudioManager()

// 音效快捷函数
function playSound(soundName, options) {
    audioManager.play(soundName, options)
}

function playClickSound() {
    playSound('click', { volume: 0.3 })
}

function playBetSound() {
    playSound('bet', { volume: 0.6 })
}

function playWinSound() {
    playSound('win', { volume: 0.8 })
}

function playLoseSound() {
    playSound('lose', { volume: 0.5 })
}

function playCoinSound() {
    playSound('coin', { volume: 0.4 })
}

function playCountdownSound() {
    playSound('countdown', { volume: 0.7 })
}

function playDrawSound() {
    playSound('draw', { volume: 0.8 })
}

// 为按钮添加点击音效
function addClickSounds() {
    // 为所有按钮添加点击音效
    document.addEventListener('click', (event) => {
        if (event.target.matches('button, .btn, .number-btn, .tab-btn')) {
            playClickSound()
        }
    })
    
    // 为数字按钮添加特殊音效
    document.addEventListener('click', (event) => {
        if (event.target.matches('.number-btn')) {
            // 如果是选中状态，播放金币音效
            if (event.target.classList.contains('selected')) {
                playCoinSound()
            }
        }
    })
}

// 创建音效控制面板
function createAudioControls() {
    const controlsHTML = `
        <div class="audio-controls">
            <button class="audio-toggle" id="audioToggle" title="音效开关">
                <span class="audio-icon">${audioManager.enabled ? '🔊' : '🔇'}</span>
            </button>
            <div class="volume-control">
                <input type="range" id="volumeSlider" min="0" max="1" step="0.1" 
                       value="${audioManager.volume}" title="音量控制">
            </div>
        </div>
    `
    
    // 添加到页面
    const container = document.querySelector('.header-content .user-info')
    if (container) {
        container.insertAdjacentHTML('beforeend', controlsHTML)
        
        // 绑定事件
        const toggleBtn = document.getElementById('audioToggle')
        const volumeSlider = document.getElementById('volumeSlider')
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const enabled = audioManager.toggle()
                toggleBtn.querySelector('.audio-icon').textContent = enabled ? '🔊' : '🔇'
                playClickSound()
            })
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                audioManager.setVolume(parseFloat(e.target.value))
            })
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 添加点击音效
    addClickSounds()
    
    // 创建音效控制面板
    createAudioControls()
    
    // 延迟播放背景音乐（避免自动播放限制）
    setTimeout(() => {
        // 只有在用户交互后才播放背景音乐
        document.addEventListener('click', () => {
            audioManager.playAmbient()
        }, { once: true })
    }, 1000)
})

// 页面卸载时停止所有音效
window.addEventListener('beforeunload', () => {
    audioManager.stopAll()
})

// 导出音效管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        audioManager,
        playSound,
        playClickSound,
        playBetSound,
        playWinSound,
        playLoseSound,
        playCoinSound,
        playCountdownSound,
        playDrawSound
    }
}
