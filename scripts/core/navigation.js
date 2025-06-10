// scripts/core/navigation.js - 導航管理

import { eventBus, EVENTS } from './eventBus.js';
import { userService } from '../services/userService.js';
import { Utils } from './utils.js';

export class NavigationManager {
    constructor() {
        this.currentModule = 'dashboard';
        this.moduleHistory = [];
        this.maxHistorySize = 10;
        this.init();
    }

    /**
     * 初始化導航管理器
     */
    init() {
        this.setupEventListeners();
        this.setupNavigationButtons();
        this.checkAuthentication();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 模組變更事件
        eventBus.on(EVENTS.MODULE_CHANGED, (moduleName) => {
            this.navigateToModule(moduleName);
        });

        // 瀏覽器前進後退
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.module) {
                this.navigateToModule(e.state.module, false);
            }
        });

        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * 設置導航按鈕
     */
    setupNavigationButtons() {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const moduleName = button.dataset.module;
                if (moduleName) {
                    this.navigateToModule(moduleName);
                }
            });
        });

        // Logo點擊回到首頁
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.addEventListener('click', () => {
                this.navigateToModule('dashboard');
            });
        }
    }

    /**
     * 檢查認證狀態
     */
    checkAuthentication() {
        if (!userService.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // 更新用戶顯示
        this.updateUserDisplay();
    }

    /**
     * 導航到指定模組
     * @param {string} moduleName - 模組名稱
     * @param {boolean} addToHistory - 是否添加到歷史記錄
     */
    navigateToModule(moduleName, addToHistory = true) {
        if (!this.isValidModule(moduleName)) {
            console.warn(`無效的模組名稱: ${moduleName}`);
            return;
        }

        // 權限檢查
        if (!this.hasModulePermission(moduleName)) {
            Utils.showNotification('您沒有權限訪問此模組', 'error');
            return;
        }

        const previousModule = this.currentModule;
        this.currentModule = moduleName;

        // 添加到歷史記錄
        if (addToHistory && previousModule !== moduleName) {
            this.addToHistory(previousModule);
            
            // 更新瀏覽器歷史
            const state = { module: moduleName, timestamp: Date.now() };
            history.pushState(state, '', `#${moduleName}`);
        }

        // 更新導航狀態
        this.updateNavigationState();

        // 發布模組變更事件
        eventBus.emit(EVENTS.MODULE_CHANGED, moduleName);
        eventBus.emit(EVENTS.NAVIGATION_CHANGED, { from: previousModule, to: moduleName });

        // 記錄導航行為
        this.logNavigation(previousModule, moduleName);
    }

    /**
     * 檢查模組是否有效
     * @param {string} moduleName - 模組名稱
     * @returns {boolean} 是否有效
     */
    isValidModule(moduleName) {
        const validModules = ['dashboard', 'words', 'feynman', 'force', 'quiz'];
        return validModules.includes(moduleName);
    }

    /**
     * 檢查模組權限
     * @param {string} moduleName - 模組名稱
     * @returns {boolean} 是否有權限
     */
    hasModulePermission(moduleName) {
        const user = userService.getCurrentUser();
        if (!user) return false;

        // 管理員有所有權限
        if (user.role === 'admin') return true;

        // 根據用戶角色檢查權限
        const modulePermissions = {
            dashboard: ['admin', 'teacher', 'student', 'guest'],
            words: ['admin', 'teacher', 'student', 'guest'],
            feynman: ['admin', 'teacher', 'student'],
            force: ['admin', 'teacher', 'student'],
            quiz: ['admin', 'teacher', 'student', 'guest']
        };

        const allowedRoles = modulePermissions[moduleName] || [];
        return allowedRoles.includes(user.role);
    }

    /**
     * 更新導航狀態
     */
    updateNavigationState() {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            const moduleName = button.dataset.module;
            if (moduleName === this.currentModule) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // 更新頁面標題
        this.updatePageTitle();
    }

    /**
     * 更新頁面標題
     */
    updatePageTitle() {
        const titles = {
            dashboard: '儀表板',
            words: '單字學習',
            feynman: '費曼學習',
            force: '強迫學習',
            quiz: '測驗'
        };

        const moduleTitle = titles[this.currentModule] || '學習平台';
        document.title = `${moduleTitle} - 南臺科技大學英語學習平台`;
    }

    /**
     * 添加到歷史記錄
     * @param {string} moduleName - 模組名稱
     */
    addToHistory(moduleName) {
        this.moduleHistory.unshift(moduleName);
        
        // 限制歷史記錄大小
        if (this.moduleHistory.length > this.maxHistorySize) {
            this.moduleHistory = this.moduleHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * 返回上一個模組
     */
    goBack() {
        if (this.moduleHistory.length > 0) {
            const previousModule = this.moduleHistory.shift();
            this.navigateToModule(previousModule, false);
        }
    }

    /**
     * 重置到首頁
     */
    resetToHome() {
        this.moduleHistory = [];
        this.navigateToModule('dashboard');
    }

    /**
     * 處理鍵盤快捷鍵
     * @param {KeyboardEvent} e - 鍵盤事件
     */
    handleKeyboardShortcuts(e) {
        // 只在沒有輸入框聚焦時處理
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToModule('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToModule('words');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateToModule('feynman');
                    break;
                case '4':
                    e.preventDefault();
                    this.navigateToModule('force');
                    break;
                case '5':
                    e.preventDefault();
                    this.navigateToModule('quiz');
                    break;
            }
        }

        // 返回鍵
        if (e.key === 'Escape') {
            e.preventDefault();
            this.goBack();
        }

        // Home鍵回到首頁
        if (e.key === 'Home') {
            e.preventDefault();
            this.resetToHome();
        }
    }

    /**
     * 更新用戶顯示
     */
    updateUserDisplay() {
        const user = userService.getCurrentUser();
        if (!user) return;

        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.username;
        }

        const learningStreakElement = document.getElementById('learningStreak');
        if (learningStreakElement) {
            // 這裡應該從學習服務獲取連續天數
            const learningData = import('../services/learningService.js').then(module => {
                const stats = module.learningService.getStatsSummary();
                if (stats) {
                    learningStreakElement.textContent = stats.currentStreak;
                }
            });
        }
    }

    /**
     * 記錄導航行為
     * @param {string} from - 來源模組
     * @param {string} to - 目標模組
     */
    logNavigation(from, to) {
        console.log(`導航: ${from} -> ${to}`);
        
        // 可以在這裡添加使用者行為分析
        const navigationEvent = {
            type: 'navigation',
            from: from,
            to: to,
            timestamp: new Date().toISOString(),
            user: userService.getCurrentUser()?.username || 'anonymous'
        };

        // 保存到本地統計
        this.saveNavigationStats(navigationEvent);
    }

    /**
     * 保存導航統計
     * @param {Object} event - 導航事件
     */
    saveNavigationStats(event) {
        const stats = JSON.parse(localStorage.getItem('navigation-stats') || '[]');
        stats.push(event);
        
        // 只保留最近100次導航記錄
        if (stats.length > 100) {
            stats.splice(0, stats.length - 100);
        }
        
        localStorage.setItem('navigation-stats', JSON.stringify(stats));
    }

    /**
     * 取得導航統計
     * @returns {Array} 導航統計列表
     */
    getNavigationStats() {
        return JSON.parse(localStorage.getItem('navigation-stats') || '[]');
    }

    /**
     * 取得最常用的模組
     * @returns {Object} 模組使用統計
     */
    getMostUsedModules() {
        const stats = this.getNavigationStats();
        const moduleCount = {};
        
        stats.forEach(event => {
            moduleCount[event.to] = (moduleCount[event.to] || 0) + 1;
        });

        return Object.entries(moduleCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([module, count]) => ({ module, count }));
    }

    /**
     * 清除導航統計
     */
    clearNavigationStats() {
        localStorage.removeItem('navigation-stats');
        this.moduleHistory = [];
    }

    /**
     * 取得當前模組
     * @returns {string} 當前模組名稱
     */
    getCurrentModule() {
        return this.currentModule;
    }

    /**
     * 取得模組歷史
     * @returns {Array} 模組歷史列表
     */
    getModuleHistory() {
        return [...this.moduleHistory];
    }

    /**
     * 檢查是否可以返回
     * @returns {boolean} 是否可以返回
     */
    canGoBack() {
        return this.moduleHistory.length > 0;
    }

    /**
     * 預載入模組
     * @param {string} moduleName - 模組名稱
     */
    async preloadModule(moduleName) {
        if (!this.isValidModule(moduleName)) return;

        try {
            // 動態載入模組
            await import(`../modules/${moduleName}.js`);
            console.log(`模組預載入成功: ${moduleName}`);
        } catch (error) {
            console.error(`模組預載入失敗: ${moduleName}`, error);
        }
    }

    /**
     * 批量預載入模組
     * @param {Array} moduleNames - 模組名稱列表
     */
    async preloadModules(moduleNames = []) {
        const validModules = moduleNames.filter(name => this.isValidModule(name));
        
        const preloadPromises = validModules.map(moduleName => 
            this.preloadModule(moduleName)
        );

        try {
            await Promise.all(preloadPromises);
            console.log('所有模組預載入完成');
        } catch (error) {
            console.error('模組預載入過程中發生錯誤:', error);
        }
    }

    /**
     * 設置導航攔截器
     * @param {Function} interceptor - 攔截器函數
     */
    setNavigationInterceptor(interceptor) {
        this.navigationInterceptor = interceptor;
    }

    /**
     * 移除導航攔截器
     */
    removeNavigationInterceptor() {
        this.navigationInterceptor = null;
    }

    /**
     * 檢查導航攔截器
     * @param {string} from - 來源模組
     * @param {string} to - 目標模組
     * @returns {boolean} 是否允許導航
     */
    checkNavigationInterceptor(from, to) {
        if (this.navigationInterceptor) {
            return this.navigationInterceptor(from, to);
        }
        return true;
    }

    /**
     * 銷毀導航管理器
     */
    destroy() {
        this.clearNavigationStats();
        this.removeNavigationInterceptor();
        this.moduleHistory = [];
    }
}

// 建立全域實例
export const navigationManager = new NavigationManager();

// 導出便捷方法
export const navigation = {
    to: (module) => navigationManager.navigateToModule(module),
    back: () => navigationManager.goBack(),
    home: () => navigationManager.resetToHome(),
    current: () => navigationManager.getCurrentModule(),
    canGoBack: () => navigationManager.canGoBack()
};