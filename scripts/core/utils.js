// scripts/core/utils.js - 核心工具函數

export class Utils {
    /**
     * 格式化時間
     * @param {number} seconds - 秒數
     * @returns {string} 格式化的時間字符串
     */
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化日期
     * @param {Date|string} date - 日期對象或字符串
     * @param {string} locale - 語言環境
     * @returns {string} 格式化的日期字符串
     */
    static formatDate(date, locale = 'zh-TW') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * 節流函數
     * @param {Function} func - 要節流的函數
     * @param {number} wait - 等待時間（毫秒）
     * @returns {Function} 節流後的函數
     */
    static throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 防抖函數
     * @param {Function} func - 要防抖的函數
     * @param {number} wait - 等待時間（毫秒）
     * @param {boolean} immediate - 是否立即執行
     * @returns {Function} 防抖後的函數
     */
    static debounce(func, wait, immediate = false) {
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
    }

    /**
     * 深拷貝對象
     * @param {any} obj - 要拷貝的對象
     * @returns {any} 拷貝後的對象
     */
    static deepClone(obj) {
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
    }

    /**
     * 產生隨機ID
     * @param {number} length - ID長度
     * @returns {string} 隨機ID
     */
    static generateId(length = 8) {
        return Math.random().toString(36).substr(2, length);
    }

    /**
     * 隨機打亂陣列
     * @param {Array} array - 要打亂的陣列
     * @returns {Array} 打亂後的陣列
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 計算兩個日期間的天數差
     * @param {Date|string} date1 - 第一個日期
     * @param {Date|string} date2 - 第二個日期
     * @returns {number} 天數差
     */
    static daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    }

    /**
     * 檢查是否為有效的電子郵件
     * @param {string} email - 電子郵件地址
     * @returns {boolean} 是否有效
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 轉換為百分比
     * @param {number} value - 數值
     * @param {number} total - 總數
     * @param {number} decimals - 小數位數
     * @returns {number} 百分比
     */
    static toPercentage(value, total, decimals = 0) {
        if (total === 0) return 0;
        return Number(((value / total) * 100).toFixed(decimals));
    }

    /**
     * 本地化文字
     * @param {string} key - 翻譯鍵
     * @param {Object} params - 參數對象
     * @returns {string} 本地化文字
     */
    static t(key, params = {}) {
        const translations = {
            'zh-TW': {
                'welcome': '歡迎使用南臺科技大學英語學習平台',
                'loading': '載入中...',
                'error': '發生錯誤',
                'success': '成功',
                'save': '保存',
                'cancel': '取消',
                'confirm': '確認',
                'next': '下一個',
                'previous': '上一個',
                'finish': '完成',
                'retry': '重試'
            }
        };

        const lang = localStorage.getItem('preferred-language') || 'zh-TW';
        let text = translations[lang]?.[key] || key;

        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    }

    /**
     * 顯示通知
     * @param {string} message - 通知訊息
     * @param {string} type - 通知類型 (success, error, info, warning)
     * @param {number} duration - 顯示時間（毫秒）
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 取得通知顏色
     * @param {string} type - 通知類型
     * @returns {string} 顏色值
     */
    static getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    /**
     * 播放音效
     * @param {string} type - 音效類型
     * @param {number} volume - 音量 (0-1)
     */
    static playSound(type, volume = 0.3) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = {
                success: [800, 1000, 1200],
                error: [300, 200, 100],
                click: [1000],
                notification: [600, 800]
            };

            const freq = frequencies[type] || frequencies.click;
            
            oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
            freq.forEach((f, i) => {
                if (i > 0) {
                    oscillator.frequency.setValueAtTime(f, audioContext.currentTime + i * 0.1);
                }
            });

            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('無法播放音效:', error);
        }
    }

    /**
     * 檢查裝置類型
     * @returns {string} 裝置類型
     */
    static getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
            return 'mobile';
        }
        if (/tablet/.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }

    /**
     * 檢查網路狀態
     * @returns {boolean} 是否在線
     */
    static isOnline() {
        return navigator.onLine;
    }

    /**
     * 安全的JSON解析
     * @param {string} str - JSON字符串
     * @param {any} defaultValue - 預設值
     * @returns {any} 解析結果
     */
    static safeParseJSON(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('JSON解析失敗:', error);
            return defaultValue;
        }
    }

    /**
     * 驗證輸入值
     * @param {any} value - 要驗證的值
     * @param {string} type - 驗證類型
     * @param {Object} options - 選項
     * @returns {boolean} 是否有效
     */
    static validate(value, type, options = {}) {
        switch (type) {
            case 'required':
                return value !== null && value !== undefined && value !== '';
            case 'minLength':
                return typeof value === 'string' && value.length >= (options.min || 0);
            case 'maxLength':
                return typeof value === 'string' && value.length <= (options.max || Infinity);
            case 'number':
                return !isNaN(value) && isFinite(value);
            case 'email':
                return this.isValidEmail(value);
            default:
                return true;
        }
    }
}