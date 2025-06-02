// scripts/app.js - 南臺科技大學英語學習平台主應用邏輯

/**
 * 主應用程式類別
 * 處理用戶數據、學習統計、成就系統等核心功能
 */
class QiaomuEnglishApp {
    constructor() {
        this.currentUser = this.loadUserData();
        this.learningData = this.loadLearningData();
        this.settings = this.loadSettings();
        this.initializeEventListeners();
        this.startPerformanceMonitoring();
    }

    /**
     * 載入用戶數據
     */
    loadUserData() {
        const defaultUser = {
            name: localStorage.getItem('username') || '學習者',
            email: localStorage.getItem('email') || 'user@stust.edu.tw',
            loginTime: localStorage.getItem('loginTime') || new Date().toISOString(),
            avatar: null,
            preferences: {
                theme: 'auto',
                fontSize: 'medium',
                animations: true,
                soundEffects: true
            }
        };

        const savedUser = localStorage.getItem('qiaomu-user-profile');
        return savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser;
    }

    /**
     * 載入學習數據
     */
    loadLearningData() {
        const defaultData = {
            totalWordsLearned: 0,
            totalQuizzesTaken: 0,
            totalFeynmanExplanations: 0,
            totalForceChallenges: 0,
            currentStreak: 1,
            bestStreak: 1,
            totalStudyTime: 0,
            lastStudyDate: new Date().toDateString(),
            achievements: [],
            weeklyGoals: {
                words: 50,
                quizzes: 10,
                feynman: 5,
                force: 3
            },
            progress: {
                words: 0,
                quizzes: 0,
                feynman: 0,
                force: 0
            }
        };

        const savedData = localStorage.getItem('qiaomu-learning-data');
        return savedData ? { ...defaultData, ...JSON.parse(savedData) } : defaultData;
    }

    /**
     * 載入設定
     */
    loadSettings() {
        const defaultSettings = {
            autoSave: true,
            notifications: true,
            studyReminders: true,
            difficultyLevel: 'intermediate',
            preferredLanguage: 'zh-TW',
            studyGoalMinutes: 30,
            breakReminders: true
        };

        const savedSettings = localStorage.getItem('qiaomu-settings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    /**
     * 保存用戶數據
     */
    saveUserData() {
        localStorage.setItem('qiaomu-user-profile', JSON.stringify(this.currentUser));
    }

    /**
     * 保存學習數據
     */
    saveLearningData() {
        localStorage.setItem('qiaomu-learning-data', JSON.stringify(this.learningData));
    }

    /**
     * 保存設定
     */
    saveSettings() {
        localStorage.setItem('qiaomu-settings', JSON.stringify(this.settings));
    }

    /**
     * 更新學習統計
     */
    updateLearningStats(type, value = 1) {
        const today = new Date().toDateString();
        
        // 更新連續學習天數
        if (this.learningData.lastStudyDate !== today) {
            const lastDate = new Date(this.learningData.lastStudyDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                this.learningData.currentStreak++;
            } else if (diffDays > 1) {
                this.learningData.currentStreak = 1;
            }
            
            this.learningData.bestStreak = Math.max(
                this.learningData.bestStreak, 
                this.learningData.currentStreak
            );
            this.learningData.lastStudyDate = today;
        }

        // 更新具體統計
        switch (type) {
            case 'word':
                this.learningData.totalWordsLearned += value;
                this.learningData.progress.words += value;
                break;
            case 'quiz':
                this.learningData.totalQuizzesTaken += value;
                this.learningData.progress.quizzes += value;
                break;
            case 'feynman':
                this.learningData.totalFeynmanExplanations += value;
                this.learningData.progress.feynman += value;
                break;
            case 'force':
                this.learningData.totalForceChallenges += value;
                this.learningData.progress.force += value;
                break;
            case 'studyTime':
                this.learningData.totalStudyTime += value;
                break;
        }

        this.checkAchievements();
        this.saveLearningData();
    }

    /**
     * 成就系統檢查
     */
    checkAchievements() {
        const achievements = [
            {
                id: 'first_word',
                name: '初學者',
                description: '學習第一個單字',
                icon: '🌱',
                condition: () => this.learningData.totalWordsLearned >= 1
            },
            {
                id: 'word_master_10',
                name: '單字新手',
                description: '學習 10 個單字',
                icon: '📚',
                condition: () => this.learningData.totalWordsLearned >= 10
            },
            {
                id: 'word_master_50',
                name: '單字達人',
                description: '學習 50 個單字',
                icon: '🎓',
                condition: () => this.learningData.totalWordsLearned >= 50
            },
            {
                id: 'streak_3',
                name: '堅持三天',
                description: '連續學習 3 天',
                icon: '🔥',
                condition: () => this.learningData.currentStreak >= 3
            },
            {
                id: 'streak_7',
                name: '一週戰士',
                description: '連續學習 7 天',
                icon: '⚡',
                condition: () => this.learningData.currentStreak >= 7
            },
            {
                id: 'feynman_master',
                name: '費曼大師',
                description: '完成 10 次費曼解釋',
                icon: '🧠',
                condition: () => this.learningData.totalFeynmanExplanations >= 10
            },
            {
                id: 'force_warrior',
                name: '強迫戰士',
                description: '完成 5 次強迫學習挑戰',
                icon: '💪',
                condition: () => this.learningData.totalForceChallenges >= 5
            },
            {
                id: 'quiz_expert',
                name: '測驗專家',
                description: '完成 20 次測驗',
                icon: '🏆',
                condition: () => this.learningData.totalQuizzesTaken >= 20
            }
        ];

        achievements.forEach(achievement => {
            if (!this.learningData.achievements.includes(achievement.id) && 
                achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    /**
     * 解鎖成就
     */
    unlockAchievement(achievement) {
        this.learningData.achievements.push(achievement.id);
        this.showAchievementNotification(achievement);
        this.saveLearningData();
    }

    /**
     * 顯示成就通知
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h4>成就解鎖！</h4>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;

        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // 動畫顯示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自動隱藏
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);

        // 播放成就音效
        if (this.currentUser.preferences.soundEffects) {
            this.playAchievementSound();
        }
    }

    /**
     * 播放成就音效
     */
    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('無法播放音效:', error);
        }
    }

    /**
     * 性能監控
     */
    startPerformanceMonitoring() {
        this.performanceMetrics = {
            pageLoadTime: performance.now(),
            interactionCount: 0,
            errorCount: 0,
            lastInteraction: Date.now()
        };

        // 監控用戶互動
        document.addEventListener('click', () => {
            this.performanceMetrics.interactionCount++;
            this.performanceMetrics.lastInteraction = Date.now();
        });

        // 監控錯誤
        window.addEventListener('error', (event) => {
            this.performanceMetrics.errorCount++;
            console.error('應用程式錯誤:', event.error);
        });

        // 定期保存性能數據
        setInterval(() => {
            this.savePerformanceMetrics();
        }, 60000); // 每分鐘保存一次
    }

    /**
     * 保存性能指標
     */
    savePerformanceMetrics() {
        localStorage.setItem('qiaomu-performance', JSON.stringify(this.performanceMetrics));
    }

    /**
     * 設置學習提醒
     */
    setupStudyReminders() {
        if (!this.settings.studyReminders || !('Notification' in window)) {
            return;
        }

        // 請求通知權限
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // 設定每日學習提醒
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(19, 0, 0, 0); // 晚上7點提醒

        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        setTimeout(() => {
            this.sendStudyReminder();
            // 每24小時重複
            setInterval(() => {
                this.sendStudyReminder();
            }, 24 * 60 * 60 * 1000);
        }, timeUntilReminder);
    }

    /**
     * 發送學習提醒
     */
    sendStudyReminder() {
        if (Notification.permission === 'granted') {
            const today = new Date().toDateString();
            if (this.learningData.lastStudyDate !== today) {
                new Notification('南臺科技大學英語學習提醒', {
                    body: '該是學習英語的時間了！保持你的學習連續記錄 🔥',
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'study-reminder',
                    requireInteraction: true
                });
            }
        }
    }

    /**
     * 數據導出
     */
    exportLearningData() {
        const exportData = {
            user: this.currentUser,
            learning: this.learningData,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `qiaomu-learning-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 數據導入
     */
    importLearningData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (this.validateImportData(importedData)) {
                    this.currentUser = { ...this.currentUser, ...importedData.user };
                    this.learningData = { ...this.learningData, ...importedData.learning };
                    this.settings = { ...this.settings, ...importedData.settings };
                    
                    this.saveUserData();
                    this.saveLearningData();
                    this.saveSettings();
                    
                    alert('學習數據導入成功！');
                    location.reload();
                } else {
                    alert('無效的數據格式！');
                }
            } catch (error) {
                alert('導入失敗，請檢查檔案格式！');
                console.error('導入錯誤:', error);
            }
        };
        reader.readAsText(file);
    }

    /**
     * 驗證導入數據
     */
    validateImportData(data) {
        return data && 
               data.user && 
               data.learning && 
               data.settings && 
               data.version;
    }

    /**
     * 離線支援設置
     */
    setupOfflineSupport() {
        // 檢測網路狀態
        window.addEventListener('online', () => {
            this.showNetworkStatus('已連接到網路', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showNetworkStatus('已離線，數據將保存在本地', 'warning');
        });

        // 註冊 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker 註冊成功'))
                .catch(error => console.log('Service Worker 註冊失敗:', error));
        }
    }

    /**
     * 顯示網路狀態
     */
    showNetworkStatus(message, type) {
        const notification = document.createElement('div');
        notification.className = `network-status ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 10000;
            background: ${type === 'success' ? '#48bb78' : '#ed8936'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * 同步離線數據
     */
    syncOfflineData() {
        // 同步離線期間的數據到服務器
        console.log('同步離線數據...');
    }

    /**
     * 事件監聽器設置
     */
    initializeEventListeners() {
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 's':
                        event.preventDefault();
                        this.quickSave();
                        break;
                    case 'e':
                        event.preventDefault();
                        this.exportLearningData();
                        break;
                }
            }
        });

        // 視窗關閉前保存
        window.addEventListener('beforeunload', () => {
            this.saveUserData();
            this.saveLearningData();
            this.saveSettings();
            this.savePerformanceMetrics();
        });

        // 頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTimers();
            } else {
                this.resumeTimers();
            }
        });
    }

    /**
     * 快速保存
     */
    quickSave() {
        this.saveUserData();
        this.saveLearningData();
        this.saveSettings();
        
        // 顯示保存成功提示
        const toast = document.createElement('div');
        toast.textContent = '數據已保存 ✓';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            z-index: 10000;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 2000);
    }

    /**
     * 暫停計時器
     */
    pauseTimers() {
        this.timersPaused = true;
    }

    /**
     * 恢復計時器
     */
    resumeTimers() {
        this.timersPaused = false;
    }

    /**
     * 設置主題
     */
    setTheme(theme) {
        this.currentUser.preferences.theme = theme;
        this.saveUserData();
        this.applyTheme();
    }

    /**
     * 應用主題
     */
    applyTheme() {
        const theme = this.currentUser.preferences.theme;
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
        } else {
            // 自動模式
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-theme', prefersDark);
        }
    }

    /**
     * 輔助功能設置
     */
    setupAccessibility() {
        // 鍵盤導航支援
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // 高對比度支援
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // 減少動畫偏好
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }

    /**
     * 錯誤處理
     */
    handleError(error, context) {
        console.error(`錯誤發生在 ${context}:`, error);
        
        this.performanceMetrics.errorCount++;
        
        // 顯示用戶友好的錯誤訊息
        const errorMessage = this.getErrorMessage(error);
        this.showErrorNotification(errorMessage);
    }

    /**
     * 取得錯誤訊息
     */
    getErrorMessage(error) {
        if (error.name === 'QuotaExceededError') {
            return '儲存空間不足，請清理瀏覽器數據';
        }
        if (error.name === 'NetworkError') {
            return '網路連接問題，請檢查網路狀態';
        }
        return '發生未知錯誤，請重新整理頁面';
    }

    /**
     * 顯示錯誤通知
     */
    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // 5秒後自動移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * 初始化應用程式
     */
    initialize() {
        try {
            this.applyTheme();
            this.setupAccessibility();
            this.setupOfflineSupport();
            this.setupStudyReminders();
            console.log('南臺科技大學英語應用程式初始化完成');
        } catch (error) {
            this.handleError(error, '應用程式初始化');
        }
    }
}

/**
 * 全域工具函數
 */
window.QiaomuUtils = {
    // 格式化時間
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 格式化日期
    formatDate(date, locale = 'zh-TW') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // 節流函數
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 防抖函數
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // 深拷貝
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    // 本地化文字
    t(key, params = {}) {
        const translations = {
            'zh-TW': {
                'welcome': '歡迎使用南臺科技大學英語學習平台',
                'loading': '載入中...',
                'error': '發生錯誤',
                'success': '成功',
                'save': '保存',
                'cancel': '取消',
                'confirm': '確認'
            }
        };

        const lang = localStorage.getItem('preferred-language') || 'zh-TW';
        let text = translations[lang]?.[key] || key;

        // 替換參數
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    }
};

/**
 * 頁面載入完成時初始化應用程式
 */
document.addEventListener('DOMContentLoaded', () => {
    // 檢查登入狀態
    if (!localStorage.getItem('username')) {
        window.location.href = 'login.html';
        return;
    }

    // 初始化主應用程式
    window.qiaomuApp = new QiaomuEnglishApp();
    window.qiaomuApp.initialize();
    
    console.log('南臺科技大學英語雙向費曼學習平台已成功載入');
});