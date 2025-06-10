// scripts/core/storage.js - 本地儲存管理

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class StorageManager {
    /**
     * 保存數據到本地儲存
     * @param {string} key - 儲存鍵
     * @param {any} data - 要保存的數據
     * @returns {boolean} 是否保存成功
     */
    static save(key, data) {
        try {
            const serializedData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: CONFIG.VERSION
            });
            localStorage.setItem(key, serializedData);
            return true;
        } catch (error) {
            console.error('儲存失敗:', error);
            Utils.showNotification('儲存失敗，請檢查儲存空間', 'error');
            return false;
        }
    }

    /**
     * 從本地儲存載入數據
     * @param {string} key - 儲存鍵
     * @param {any} defaultValue - 預設值
     * @returns {any} 載入的數據
     */
    static load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;

            const parsed = JSON.parse(item);
            
            // 檢查版本兼容性
            if (parsed.version && parsed.version !== CONFIG.VERSION) {
                console.warn(`數據版本不匹配: ${key}`);
            }

            return parsed.data || defaultValue;
        } catch (error) {
            console.error('載入失敗:', error);
            return defaultValue;
        }
    }

    /**
     * 刪除儲存數據
     * @param {string} key - 儲存鍵
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('刪除失敗:', error);
        }
    }

    /**
     * 清空所有應用數據
     */
    static clearAll() {
        try {
            Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('清空失敗:', error);
        }
    }

    /**
     * 取得儲存使用量
     * @returns {Object} 儲存使用情況
     */
    static getStorageUsage() {
        let totalSize = 0;
        const details = {};

        try {
            Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
                const item = localStorage.getItem(key);
                const size = item ? new Blob([item]).size : 0;
                details[name] = {
                    size: size,
                    sizeFormatted: this.formatBytes(size)
                };
                totalSize += size;
            });

            return {
                total: totalSize,
                totalFormatted: this.formatBytes(totalSize),
                details: details
            };
        } catch (error) {
            console.error('取得儲存使用量失敗:', error);
            return { total: 0, totalFormatted: '0 B', details: {} };
        }
    }

    /**
     * 格式化位元組大小
     * @param {number} bytes - 位元組數
     * @returns {string} 格式化的大小
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 匯出數據
     * @returns {Object} 匯出的數據
     */
    static exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: CONFIG.VERSION,
            data: {}
        };

        Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
            const data = this.load(key);
            if (data) {
                exportData.data[name] = data;
            }
        });

        return exportData;
    }

    /**
     * 匯入數據
     * @param {Object} importData - 要匯入的數據
     * @returns {boolean} 是否匯入成功
     */
    static importData(importData) {
        try {
            if (!importData || !importData.data) {
                throw new Error('無效的匯入數據格式');
            }

            // 版本檢查
            if (importData.version !== CONFIG.VERSION) {
                console.warn('匯入數據版本不匹配，可能存在兼容性問題');
            }

            // 備份現有數據
            const backup = this.exportData();

            try {
                Object.entries(importData.data).forEach(([name, data]) => {
                    const key = CONFIG.STORAGE_KEYS[name.toUpperCase()];
                    if (key) {
                        this.save(key, data);
                    }
                });

                Utils.showNotification('數據匯入成功', 'success');
                return true;
            } catch (error) {
                // 恢復備份
                this.restoreFromBackup(backup);
                throw error;
            }
        } catch (error) {
            console.error('匯入失敗:', error);
            Utils.showNotification('數據匯入失敗', 'error');
            return false;
        }
    }

    /**
     * 從備份恢復數據
     * @param {Object} backup - 備份數據
     */
    static restoreFromBackup(backup) {
        try {
            Object.entries(backup.data).forEach(([name, data]) => {
                const key = CONFIG.STORAGE_KEYS[name.toUpperCase()];
                if (key) {
                    this.save(key, data);
                }
            });
        } catch (error) {
            console.error('恢復備份失敗:', error);
        }
    }

    /**
     * 檢查儲存空間是否足夠
     * @param {number} requiredSpace - 需要的空間（位元組）
     * @returns {boolean} 是否有足夠空間
     */
    static checkStorageSpace(requiredSpace) {
        try {
            // 嘗試儲存測試數據
            const testKey = 'storage-test';
            const testData = 'x'.repeat(requiredSpace);
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 壓縮數據
     * @param {any} data - 要壓縮的數據
     * @returns {string} 壓縮後的字符串
     */
    static compressData(data) {
        // 簡單的數據壓縮（移除不必要的空格）
        return JSON.stringify(data, null, 0);
    }

    /**
     * 批量操作
     * @param {Array} operations - 操作列表 [{action: 'save'|'load'|'remove', key: string, data?: any}]
     */
    static batch(operations) {
        const results = [];
        
        operations.forEach(op => {
            try {
                switch (op.action) {
                    case 'save':
                        results.push(this.save(op.key, op.data));
                        break;
                    case 'load':
                        results.push(this.load(op.key, op.defaultValue));
                        break;
                    case 'remove':
                        this.remove(op.key);
                        results.push(true);
                        break;
                    default:
                        results.push(false);
                }
            } catch (error) {
                console.error(`批量操作失敗: ${op.action} ${op.key}`, error);
                results.push(false);
            }
        });

        return results;
    }
}

/**
 * 用戶數據管理
 */
export class UserStorage {
    static save(userData) {
        return StorageManager.save(CONFIG.STORAGE_KEYS.USER_DATA, userData);
    }

    static load() {
        return StorageManager.load(CONFIG.STORAGE_KEYS.USER_DATA, {
            name: localStorage.getItem('username') || '學習者',
            email: localStorage.getItem('email') || 'user@stust.edu.tw',
            loginTime: localStorage.getItem('loginTime') || new Date().toISOString(),
            preferences: CONFIG.DEFAULT_SETTINGS
        });
    }

    static updatePreferences(preferences) {
        const userData = this.load();
        userData.preferences = { ...userData.preferences, ...preferences };
        return this.save(userData);
    }
}

/**
 * 學習數據管理
 */
export class LearningStorage {
    static save(learningData) {
        return StorageManager.save(CONFIG.STORAGE_KEYS.LEARNING_DATA, learningData);
    }

    static load() {
        return StorageManager.load(CONFIG.STORAGE_KEYS.LEARNING_DATA, {
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
        });
    }

    static updateStats(type, value = 1) {
        const data = this.load();
        
        // 更新連續學習天數
        const today = new Date().toDateString();
        if (data.lastStudyDate !== today) {
            const lastDate = new Date(data.lastStudyDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                data.currentStreak++;
            } else if (diffDays > 1) {
                data.currentStreak = 1;
            }
            
            data.bestStreak = Math.max(data.bestStreak, data.currentStreak);
            data.lastStudyDate = today;
        }

        // 更新具體統計
        switch (type) {
            case 'word':
                data.totalWordsLearned += value;
                data.progress.words += value;
                break;
            case 'quiz':
                data.totalQuizzesTaken += value;
                data.progress.quizzes += value;
                break;
            case 'feynman':
                data.totalFeynmanExplanations += value;
                data.progress.feynman += value;
                break;
            case 'force':
                data.totalForceChallenges += value;
                data.progress.force += value;
                break;
            case 'studyTime':
                data.totalStudyTime += value;
                break;
        }

        return this.save(data);
    }
}