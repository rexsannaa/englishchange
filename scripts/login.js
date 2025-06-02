// scripts/login.js - 南臺科技大學英語學習平台登入頁面邏輯

/**
 * 登入管理類別
 * 處理用戶登入、驗證、表單管理等功能
 */
class LoginManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupFormValidation();
    }

    /**
     * 初始化DOM元素
     */
    initializeElements() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.btnSpinner = document.getElementById('btnSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.btnText = this.loginBtn.querySelector('.btn-text');
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 表單提交事件
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // 輸入時隱藏錯誤訊息
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('input', () => this.hideError());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin(e);
                }
            });
        });

        // 輸入框聚焦效果
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.style.transform = 'scale(1.02)';
            });
            input.addEventListener('blur', () => {
                input.parentElement.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * 設置表單驗證
     */
    setupFormValidation() {
        // 即時驗證
        this.usernameInput.addEventListener('input', () => {
            this.validateField(this.usernameInput, this.usernameInput.value.length >= 3);
        });

        this.passwordInput.addEventListener('input', () => {
            this.validateField(this.passwordInput, this.passwordInput.value.length >= 3);
        });
    }

    /**
     * 驗證輸入欄位
     */
    validateField(field, isValid) {
        if (isValid) {
            field.style.borderColor = 'rgba(72, 187, 120, 0.6)';
            field.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
        } else if (field.value.length > 0) {
            field.style.borderColor = 'rgba(245, 101, 101, 0.6)';
            field.style.boxShadow = '0 0 0 3px rgba(245, 101, 101, 0.1)';
        } else {
            field.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            field.style.boxShadow = 'none';
        }
    }

    /**
     * 處理登入邏輯
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        
        if (!this.validateInputs(username, password)) {
            return;
        }

        this.showLoading();
        
        try {
            // 模擬網路延遲
            await this.simulateNetworkDelay();
            
            if (this.authenticateUser(username, password)) {
                this.performLogin(username);
            } else {
                this.showError('帳號或密碼錯誤，請重新輸入');
            }
        } catch (error) {
            this.showError('登入過程中發生錯誤，請稍後再試');
            console.error('登入錯誤:', error);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 驗證輸入內容
     */
    validateInputs(username, password) {
        if (!username) {
            this.showError('請輸入使用者名稱');
            this.usernameInput.focus();
            return false;
        }
        
        if (!password) {
            this.showError('請輸入密碼');
            this.passwordInput.focus();
            return false;
        }

        if (username.length < 3) {
            this.showError('使用者名稱至少需要 3 個字元');
            this.usernameInput.focus();
            return false;
        }

        return true;
    }

    /**
     * 用戶身份驗證
     */
    authenticateUser(username, password) {
        // 支援的帳號列表
        const validCredentials = [
            { username: 'admin', password: 'stustai', role: 'admin' },
            { username: 'student', password: 'demo123', role: 'student' },
            { username: 'teacher', password: 'teacher123', role: 'teacher' },
            { username: 'guest', password: 'guest', role: 'guest' }
        ];

        return validCredentials.some(cred => 
            cred.username === username && cred.password === password
        );
    }

    /**
     * 模擬網路延遲
     */
    async simulateNetworkDelay() {
        const delay = Math.random() * 1000 + 500; // 0.5-1.5秒
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * 執行登入流程
     */
    performLogin(username) {
        const userRole = this.getUserRole(username);
        const email = `${username}@stust.edu.tw`;
        
        // 儲存使用者資訊到 localStorage
        const userData = {
            username: username,
            email: email,
            role: userRole,
            loginTime: new Date().toISOString(),
            sessionId: this.generateSessionId(),
            preferences: {
                theme: 'auto',
                language: 'zh-TW',
                notifications: true
            }
        };

        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('loginTime', userData.loginTime);
        localStorage.setItem('sessionId', userData.sessionId);
        localStorage.setItem('qiaomu-user-session', JSON.stringify(userData));

        this.showSuccess();
        
        // 延遲跳轉以顯示成功動畫
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    /**
     * 取得用戶角色
     */
    getUserRole(username) {
        const roleMap = {
            'admin': 'admin',
            'student': 'student',
            'teacher': 'teacher',
            'guest': 'guest'
        };
        return roleMap[username] || 'student';
    }

    /**
     * 生成會話ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 顯示載入狀態
     */
    showLoading() {
        this.loginBtn.disabled = true;
        this.btnSpinner.classList.add('show');
        this.btnText.textContent = '登入中...';
        this.hideError();
    }

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
        this.loginBtn.disabled = false;
        this.btnSpinner.classList.remove('show');
        this.btnText.textContent = '開始學習之旅';
    }

    /**
     * 顯示成功狀態
     */
    showSuccess() {
        this.loginBtn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
        this.btnText.textContent = '登入成功！';
        this.btnSpinner.innerHTML = '<i class="fas fa-check"></i>';
        this.btnSpinner.classList.add('show');
        
        // 添加成功動畫
        this.loginBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
            this.loginBtn.style.transform = 'scale(1)';
        }, 200);
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        this.errorMessage.querySelector('span').textContent = message;
        this.errorMessage.classList.add('show');
        
        // 輸入框錯誤樣式
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            input.style.animation = 'shake 0.5s ease-in-out';
            
            // 清除動畫
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        });
        
        // 自動隱藏錯誤訊息
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    /**
     * 隱藏錯誤訊息
     */
    hideError() {
        this.errorMessage.classList.remove('show');
        
        // 重置輸入框樣式
        [this.usernameInput, this.passwordInput].forEach(input => {
            if (input.value.length === 0) {
                input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                input.style.boxShadow = 'none';
            }
        });
    }
}

/**
 * 快速登入功能
 * @param {string} username - 使用者名稱
 * @param {string} password - 密碼
 */
function quickLogin(username, password) {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    usernameInput.value = username;
    passwordInput.value = password;
    
    // 添加填充動畫
    usernameInput.style.animation = 'fillAnimation 0.3s ease';
    passwordInput.style.animation = 'fillAnimation 0.3s ease 0.1s';
    
    // 觸發登入
    setTimeout(() => {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }, 500);
}

/**
 * 添加動畫樣式
 */
function addAnimationStyles() {
    const shakeAnimation = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes fillAnimation {
            0% { background: rgba(255, 255, 255, 0.1); }
            50% { background: rgba(72, 187, 120, 0.2); }
            100% { background: rgba(255, 255, 255, 0.1); }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = shakeAnimation;
    document.head.appendChild(styleSheet);
}

/**
 * 檢查現有登入狀態
 */
function checkExistingLogin() {
    if (localStorage.getItem('username')) {
        const confirmLogout = confirm('您已登入，是否要登出並重新登入？');
        if (!confirmLogout) {
            window.location.href = 'index.html';
            return true;
        } else {
            // 清除登入狀態
            localStorage.clear();
        }
    }
    return false;
}

/**
 * 設置鍵盤快捷鍵
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            quickLogin('admin', 'stustai');
        }
    });
}

/**
 * 性能監控
 */
function setupPerformanceMonitoring() {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`登入頁面載入時間: ${Math.round(loadTime)}ms`);
    });
}

/**
 * 全域錯誤處理
 */
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('頁面錯誤:', event.error);
    });
}

/**
 * 頁面初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    // 檢查現有登入狀態
    if (checkExistingLogin()) {
        return;
    }

    // 添加動畫樣式
    addAnimationStyles();

    // 初始化登入管理器
    window.loginManager = new LoginManager();
    
    // 設置各種功能
    setupKeyboardShortcuts();
    setupPerformanceMonitoring();
    setupErrorHandling();

    console.log('南臺科技大學英語學習平台登入頁面已載入完成');
    console.log('快捷鍵: Ctrl+Enter 快速登入管理員帳號');
});