// scripts/app.js - 主應用程式

import { CONFIG } from './core/config.js';
import { Utils } from './core/utils.js';
import { eventBus, EVENTS } from './core/eventBus.js';
import { StorageManager } from './core/storage.js';
import { userService } from './services/userService.js';
import { learningService } from './services/learningService.js';
import { navigationManager } from './core/navigation.js';

// 動態載入模組
import { dashboardModule } from './modules/dashboard.js';

class QiaomuApp {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.performanceMetrics = {
            startTime: performance.now(),
            moduleLoadTimes: {},
            errorCount: 0
        };
        
        this.init();
    }

    /**
     * 初始化應用程式
     */
    async init() {
        try {
            console.log('初始化南臺科技大學英語學習平台...');
            
            // 檢查瀏覽器支援
            this.checkBrowserSupport();
            
            // 初始化核心服務
            await this.initializeServices();
            
            // 註冊模組
            this.registerModules();
            
            // 設置全域事件監聽器
            this.setupGlobalEventListeners();
            
            // 設置錯誤處理
            this.setupErrorHandling();
            
            // 設置離線支援
            this.setupOfflineSupport();
            
            // 預載入關鍵模組
            await this.preloadCriticalModules();
            
            // 應用初始化完成
            this.isInitialized = true;
            
            // 記錄載入時間
            this.performanceMetrics.totalLoadTime = performance.now() - this.performanceMetrics.startTime;
            console.log(`應用程式初始化完成，耗時: ${Math.round(this.performanceMetrics.totalLoadTime)}ms`);
            
            // 發布初始化完成事件
            eventBus.emit(EVENTS.MODULE_LOADED, 'app');
            
            // 導航到預設模組
            this.navigateToInitialModule();
            
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 檢查瀏覽器支援
     */
    checkBrowserSupport() {
        const requiredFeatures = [
            'localStorage',
            'Promise',
            'fetch',
            'addEventListener'
        ];

        const unsupportedFeatures = requiredFeatures.filter(feature => {
            switch (feature) {
                case 'localStorage':
                    return typeof Storage === 'undefined';
                case 'Promise':
                    return typeof Promise === 'undefined';
                case 'fetch':
                    return typeof fetch === 'undefined';
                case 'addEventListener':
                    return typeof document.addEventListener === 'undefined';
                default:
                    return false;
            }
        });

        if (unsupportedFeatures.length > 0) {
            throw new Error(`瀏覽器不支援以下功能: ${unsupportedFeatures.join(', ')}`);
        }
    }

    /**
     * 初始化核心服務
     */
    async initializeServices() {
        // 用戶服務已在導入時初始化
        // 學習服務已在導入時初始化
        // 導航服務已在導入時初始化
        
        console.log('核心服務初始化完成');
    }

    /**
     * 註冊模組
     */
    registerModules() {
        // 註冊儀表板模組
        this.modules.set('dashboard', dashboardModule);
        
        console.log('模組註冊完成');
    }

    /**
     * 動態載入模組
     * @param {string} moduleName - 模組名稱
     * @returns {Promise<Object>} 模組實例
     */
    async loadModule(moduleName) {
        if (this.modules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        const startTime = performance.now();
        
        try {
            const moduleFile = await import(`./modules/${moduleName}.js`);
            const moduleInstance = moduleFile[`${moduleName}Module`];
            
            if (moduleInstance) {
                this.modules.set(moduleName, moduleInstance);
                
                const loadTime = performance.now() - startTime;
                this.performanceMetrics.moduleLoadTimes[moduleName] = loadTime;
                
                console.log(`模組載入完成: ${moduleName} (${Math.round(loadTime)}ms)`);
                eventBus.emit(EVENTS.MODULE_LOADED, moduleName);
                
                return moduleInstance;
            }
        } catch (error) {
            console.error(`模組載入失敗: ${moduleName}`, error);
            this.performanceMetrics.errorCount++;
            throw error;
        }
    }

    /**
     * 預載入關鍵模組
     */
    async preloadCriticalModules() {
        const criticalModules = ['words', 'feynman'];
        
        const loadPromises = criticalModules.map(async (moduleName) => {
            try {
                await this.loadModule(moduleName);
            } catch (error) {
                console.warn(`關鍵模組載入失敗: ${moduleName}`, error);
            }
        });

        await Promise.allSettled(loadPromises);
        console.log('關鍵模組預載入完成');
    }

    /**
     * 設置全域事件監聽器
     */
    setupGlobalEventListeners() {
        // 模組變更事件
        eventBus.on(EVENTS.MODULE_CHANGED, async (moduleName) => {
            await this.handleModuleChange(moduleName);
        });

        // 用戶登出事件
        eventBus.on(EVENTS.USER_LOGOUT, () => {
            this.handleUserLogout();
        });

        // 數據保存事件
        eventBus.on(EVENTS.DATA_SAVED, (data) => {
            console.log('數據已保存:', data.type);
        });

        // 視窗事件
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });

        window.addEventListener('online', () => {
            Utils.showNotification('網路連線已恢復', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.showNotification('網路連線中斷，將離線運作', 'warning');
        });

        // 頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    }

    /**
     * 處理模組變更
     * @param {string} moduleName - 模組名稱
     */
    async handleModuleChange(moduleName) {
        try {
            // 確保模組已載入
            await this.loadModule(moduleName);
            
            // 清理當前模組容器
            const container = document.getElementById('module-container');
            if (container) {
                container.innerHTML = '';
            }
            
            console.log(`切換到模組: ${moduleName}`);
        } catch (error) {
            console.error(`模組切換失敗: ${moduleName}`, error);
            Utils.showNotification('模組載入失敗，請重試', 'error');
        }
    }

    /**
     * 處理用戶登出
     */
    handleUserLogout() {
        // 清理應用狀態
        this.cleanup();
        
        // 跳轉到登入頁面
        window.location.href = 'login.html';
    }

    /**
     * 處理頁面卸載前
     */
    handleBeforeUnload() {
        // 保存性能指標
        StorageManager.save('performance-metrics', this.performanceMetrics);
        
        // 清理資源
        this.cleanup();
    }

    /**
     * 處理頁面隱藏
     */
    handlePageHidden() {
        console.log('頁面隱藏，暫停非必要操作');
        // 暫停計時器等
    }

    /**
     * 處理頁面可見
     */
    handlePageVisible() {
        console.log('頁面可見，恢復操作');
        // 恢復計時器等
    }

    /**
     * 導航到初始模組
     */
    navigateToInitialModule() {
        // 檢查URL片段
        const hash = window.location.hash.substring(1);
        const initialModule = hash && ['dashboard', 'words', 'feynman', 'force', 'quiz'].includes(hash) 
            ? hash 
            : 'dashboard';
        
        navigationManager.navigateToModule(initialModule);
    }

    /**
     * 設置錯誤處理
     */
    setupErrorHandling() {
        // 全域錯誤處理
        window.addEventListener('error', (event) => {
            this.handleError(event.error, '全域錯誤');
        });

        // Promise 拒絕處理
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Promise 拒絕');
            event.preventDefault();
        });
    }

    /**
     * 處理錯誤
     * @param {Error} error - 錯誤對象
     * @param {string} context - 錯誤上下文
     */
    handleError(error, context) {
        console.error(`${context}:`, error);
        
        this.performanceMetrics.errorCount++;
        
        // 根據錯誤類型顯示適當的訊息
        let message = '發生未知錯誤';
        
        if (error.name === 'QuotaExceededError') {
            message = '儲存空間不足，請清理瀏覽器數據';
        } else if (error.name === 'NetworkError') {
            message = '網路連線問題，請檢查網路狀態';
        } else if (error.message) {
            message = error.message;
        }
        
        Utils.showNotification(message, 'error');
        
        // 記錄錯誤到本地
        this.logError(error, context);
    }

    /**
     * 記錄錯誤
     * @param {Error} error - 錯誤對象
     * @param {string} context - 錯誤上下文
     */
    logError(error, context) {
        const errorLog = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        const logs = JSON.parse(localStorage.getItem('error-logs') || '[]');
        logs.push(errorLog);
        
        // 只保留最近50個錯誤記錄
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('error-logs', JSON.stringify(logs));
    }

    /**
     * 處理初始化錯誤
     * @param {Error} error - 錯誤對象
     */
    handleInitializationError(error) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                text-align: center;
                background: linear-gradient(-45deg, #667eea, #764ba2);
                color: white;
                font-family: sans-serif;
            ">
                <h1>應用程式初始化失敗</h1>
                <p style="margin: 1rem 0; max-width: 600px;">
                    抱歉，應用程式無法正常啟動。請重新整理頁面或聯繫技術支援。
                </p>
                <p style="font-size: 0.9rem; opacity: 0.8;">
                    錯誤訊息: ${error.message}
                </p>
                <button onclick="window.location.reload()" style="
                    margin-top: 1rem;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    重新載入
                </button>
            </div>
        `;
    }

    /**
     * 設置離線支援
     */
    setupOfflineSupport() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker 註冊成功:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker 註冊失敗:', error);
                });
        }
    }

    /**
     * 清理資源
     */
    cleanup() {
        // 清理事件監聽器
        eventBus.clear();
        
        // 清理模組
        this.modules.forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules.clear();
    }

    /**
     * 取得應用狀態
     * @returns {Object} 應用狀態
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            loadedModules: Array.from(this.modules.keys()),
            performanceMetrics: this.performanceMetrics,
            currentModule: navigationManager.getCurrentModule()
        };
    }

    /**
     * 取得效能指標
     * @returns {Object} 效能指標
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            memoryUsage: this.getMemoryUsage(),
            storageUsage: StorageManager.getStorageUsage()
        };
    }

    /**
     * 取得記憶體使用量
     * @returns {Object} 記憶體使用量
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
}

// 當 DOM 載入完成時初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QiaomuApp();
});

// 導出全域存取點
export { QiaomuApp };