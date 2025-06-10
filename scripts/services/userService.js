// scripts/services/userService.js - 用戶服務

import { UserStorage } from '../core/storage.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { Utils } from '../core/utils.js';
import { CONFIG } from '../core/config.js';

export class UserService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    /**
     * 初始化用戶服務
     */
    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
    }

    /**
     * 載入當前用戶
     */
    loadCurrentUser() {
        const username = localStorage.getItem('username');
        if (username) {
            this.currentUser = UserStorage.load();
            this.isAuthenticated = true;
            eventBus.emit(EVENTS.USER_LOGIN, this.currentUser);
        }
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 監聽用戶資料更新
        eventBus.on(EVENTS.USER_UPDATED, (userData) => {
            this.updateUser(userData);
        });
    }

    /**
     * 用戶登入
     * @param {string} username - 使用者名稱
     * @param {string} password - 密碼
     * @returns {Promise<boolean>} 登入是否成功
     */
    async login(username, password) {
        try {
            if (this.validateCredentials(username, password)) {
                const userRole = this.getUserRole(username);
                const email = `${username}@stust.edu.tw`;
                
                const userData = {
                    username: username,
                    email: email,
                    role: userRole,
                    loginTime: new Date().toISOString(),
                    sessionId: this.generateSessionId(),
                    preferences: CONFIG.DEFAULT_SETTINGS
                };

                // 保存到本地儲存
                localStorage.setItem('username', username);
                localStorage.setItem('email', email);
                localStorage.setItem('userRole', userRole);
                localStorage.setItem('loginTime', userData.loginTime);
                localStorage.setItem('sessionId', userData.sessionId);
                
                UserStorage.save(userData);
                
                this.currentUser = userData;
                this.isAuthenticated = true;
                
                eventBus.emit(EVENTS.USER_LOGIN, userData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('登入錯誤:', error);
            return false;
        }
    }

    /**
     * 用戶登出
     */
    logout() {
        localStorage.clear();
        this.currentUser = null;
        this.isAuthenticated = false;
        eventBus.emit(EVENTS.USER_LOGOUT);
        window.location.href = 'login.html';
    }

    /**
     * 驗證登入憑證
     * @param {string} username - 使用者名稱
     * @param {string} password - 密碼
     * @returns {boolean} 是否有效
     */
    validateCredentials(username, password) {
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
     * 取得用戶角色
     * @param {string} username - 使用者名稱
     * @returns {string} 用戶角色
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
     * @returns {string} 會話ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新用戶資料
     * @param {Object} updates - 更新的資料
     */
    updateUser(updates) {
        if (!this.currentUser) return;

        this.currentUser = { ...this.currentUser, ...updates };
        UserStorage.save(this.currentUser);
        eventBus.emit(EVENTS.USER_UPDATED, this.currentUser);
    }

    /**
     * 更新用戶偏好設定
     * @param {Object} preferences - 偏好設定
     */
    updatePreferences(preferences) {
        if (!this.currentUser) return;

        this.currentUser.preferences = { 
            ...this.currentUser.preferences, 
            ...preferences 
        };
        
        UserStorage.updatePreferences(preferences);
        eventBus.emit(EVENTS.USER_UPDATED, this.currentUser);
    }

    /**
     * 取得當前用戶資料
     * @returns {Object|null} 用戶資料
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 檢查是否已登入
     * @returns {boolean} 是否已登入
     */
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    /**
     * 檢查用戶權限
     * @param {string} permission - 權限名稱
     * @returns {boolean} 是否有權限
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            admin: ['all'],
            teacher: ['view_stats', 'manage_content'],
            student: ['view_own_progress'],
            guest: ['basic_access']
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    /**
     * 取得用戶統計資料
     * @returns {Object} 統計資料
     */
    getUserStats() {
        if (!this.currentUser) return null;

        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        const sessionDuration = Math.floor((now - loginTime) / 1000);

        return {
            username: this.currentUser.username,
            email: this.currentUser.email,
            role: this.currentUser.role,
            loginTime: this.currentUser.loginTime,
            sessionDuration: sessionDuration,
            sessionDurationFormatted: Utils.formatTime(sessionDuration)
        };
    }

    /**
     * 驗證會話有效性
     * @returns {boolean} 會話是否有效
     */
    validateSession() {
        if (!this.currentUser || !this.currentUser.sessionId) {
            return false;
        }

        const storedSessionId = localStorage.getItem('sessionId');
        return storedSessionId === this.currentUser.sessionId;
    }

    /**
     * 刷新會話
     */
    refreshSession() {
        if (this.currentUser) {
            const newSessionId = this.generateSessionId();
            this.currentUser.sessionId = newSessionId;
            localStorage.setItem('sessionId', newSessionId);
            UserStorage.save(this.currentUser);
        }
    }

    /**
     * 取得用戶頭像URL
     * @returns {string} 頭像URL
     */
    getAvatarUrl() {
        if (this.currentUser && this.currentUser.avatar) {
            return this.currentUser.avatar;
        }
        
        // 根據用戶名稱生成預設頭像
        const username = this.currentUser ? this.currentUser.username : 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&size=128`;
    }

    /**
     * 更新頭像
     * @param {string} avatarUrl - 頭像URL
     */
    updateAvatar(avatarUrl) {
        this.updateUser({ avatar: avatarUrl });
    }

    /**
     * 匯出用戶資料
     * @returns {Object} 匯出的資料
     */
    exportUserData() {
        if (!this.currentUser) return null;

        return {
            user: this.currentUser,
            exportDate: new Date().toISOString(),
            version: CONFIG.VERSION
        };
    }

    /**
     * 刪除用戶帳戶
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async deleteAccount() {
        if (!this.currentUser) return false;

        try {
            const confirmed = confirm('確定要刪除帳戶嗎？此操作無法復原。');
            if (!confirmed) return false;

            // 清除所有用戶資料
            localStorage.clear();
            this.currentUser = null;
            this.isAuthenticated = false;
            
            Utils.showNotification('帳戶已刪除', 'success');
            eventBus.emit(EVENTS.USER_LOGOUT);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('刪除帳戶失敗:', error);
            Utils.showNotification('刪除帳戶失敗', 'error');
            return false;
        }
    }
}

// 建立全域實例
export const userService = new UserService();