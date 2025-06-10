// scripts/core/eventBus.js - 事件總線

export class EventBus {
    constructor() {
        this.events = {};
        this.onceEvents = new Set();
    }

    /**
     * 訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     * @param {Object} context - 上下文
     */
    on(event, callback, context = null) {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push({
            callback,
            context
        });
    }

    /**
     * 訂閱一次性事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     * @param {Object} context - 上下文
     */
    once(event, callback, context = null) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback);
            callback.apply(context, args);
        };

        this.onceEvents.add(onceCallback);
        this.on(event, onceCallback, context);
    }

    /**
     * 取消訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off(event, callback = null) {
        if (!this.events[event]) return;

        if (callback) {
            this.events[event] = this.events[event].filter(
                listener => listener.callback !== callback
            );
        } else {
            delete this.events[event];
        }
    }

    /**
     * 發布事件
     * @param {string} event - 事件名稱
     * @param {...any} args - 參數
     */
    emit(event, ...args) {
        if (!this.events[event]) return;

        this.events[event].forEach(listener => {
            try {
                listener.callback.apply(listener.context, args);
            } catch (error) {
                console.error(`事件處理錯誤 [${event}]:`, error);
            }
        });
    }

    /**
     * 清除所有事件監聽器
     */
    clear() {
        this.events = {};
        this.onceEvents.clear();
    }

    /**
     * 取得事件監聽器數量
     * @param {string} event - 事件名稱
     * @returns {number} 監聽器數量
     */
    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }

    /**
     * 取得所有事件名稱
     * @returns {Array} 事件名稱列表
     */
    eventNames() {
        return Object.keys(this.events);
    }
}

// 全域事件總線實例
export const eventBus = new EventBus();

// 常用事件名稱常數
export const EVENTS = {
    // 模組事件
    MODULE_CHANGED: 'module:changed',
    MODULE_LOADED: 'module:loaded',
    MODULE_UNLOADED: 'module:unloaded',
    
    // 用戶事件
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_UPDATED: 'user:updated',
    
    // 學習事件
    WORD_LEARNED: 'learning:word',
    QUIZ_COMPLETED: 'learning:quiz',
    FEYNMAN_COMPLETED: 'learning:feynman',
    FORCE_COMPLETED: 'learning:force',
    ACHIEVEMENT_UNLOCKED: 'learning:achievement',
    
    // 系統事件
    DATA_SAVED: 'system:saved',
    DATA_LOADED: 'system:loaded',
    ERROR_OCCURRED: 'system:error',
    NOTIFICATION_SHOW: 'system:notification',
    
    // 導航事件
    NAVIGATION_CHANGED: 'nav:changed',
    
    // 介面事件
    THEME_CHANGED: 'ui:theme',
    LANGUAGE_CHANGED: 'ui:language'
};