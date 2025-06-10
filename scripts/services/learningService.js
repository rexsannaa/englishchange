// scripts/services/learningService.js - 學習服務

import { LearningStorage } from '../core/storage.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { Utils } from '../core/utils.js';
import { CONFIG } from '../core/config.js';

export class LearningService {
    constructor() {
        this.learningData = null;
        this.achievements = [];
        this.init();
    }

    /**
     * 初始化學習服務
     */
    init() {
        this.loadLearningData();
        this.setupEventListeners();
        this.setupAchievements();
    }

    /**
     * 載入學習數據
     */
    loadLearningData() {
        this.learningData = LearningStorage.load();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        eventBus.on(EVENTS.WORD_LEARNED, () => this.updateStats('word', 1));
        eventBus.on(EVENTS.QUIZ_COMPLETED, () => this.updateStats('quiz', 1));
        eventBus.on(EVENTS.FEYNMAN_COMPLETED, () => this.updateStats('feynman', 1));
        eventBus.on(EVENTS.FORCE_COMPLETED, () => this.updateStats('force', 1));
    }

    /**
     * 設置成就系統
     */
    setupAchievements() {
        this.achievements = [
            {
                id: 'first_word',
                name: '初學者',
                description: '學習第一個單字',
                icon: 'fas fa-seedling',
                condition: () => this.learningData.totalWordsLearned >= CONFIG.ACHIEVEMENT_THRESHOLDS.FIRST_WORD
            },
            {
                id: 'word_novice',
                name: '單字新手',
                description: '學習 10 個單字',
                icon: 'fas fa-book',
                condition: () => this.learningData.totalWordsLearned >= CONFIG.ACHIEVEMENT_THRESHOLDS.WORD_NOVICE
            },
            {
                id: 'word_expert',
                name: '單字達人',
                description: '學習 50 個單字',
                icon: 'fas fa-graduation-cap',
                condition: () => this.learningData.totalWordsLearned >= CONFIG.ACHIEVEMENT_THRESHOLDS.WORD_EXPERT
            },
            {
                id: 'streak_beginner',
                name: '堅持三天',
                description: '連續學習 3 天',
                icon: 'fas fa-fire',
                condition: () => this.learningData.currentStreak >= CONFIG.ACHIEVEMENT_THRESHOLDS.STREAK_BEGINNER
            },
            {
                id: 'streak_warrior',
                name: '一週戰士',
                description: '連續學習 7 天',
                icon: 'fas fa-bolt',
                condition: () => this.learningData.currentStreak >= CONFIG.ACHIEVEMENT_THRESHOLDS.STREAK_WARRIOR
            },
            {
                id: 'feynman_master',
                name: '費曼大師',
                description: '完成 10 次費曼解釋',
                icon: 'fas fa-brain',
                condition: () => this.learningData.totalFeynmanExplanations >= CONFIG.ACHIEVEMENT_THRESHOLDS.FEYNMAN_MASTER
            },
            {
                id: 'force_warrior',
                name: '強迫戰士',
                description: '完成 5 次強迫學習挑戰',
                icon: 'fas fa-dumbbell',
                condition: () => this.learningData.totalForceChallenges >= CONFIG.ACHIEVEMENT_THRESHOLDS.FORCE_WARRIOR
            },
            {
                id: 'quiz_expert',
                name: '測驗專家',
                description: '完成 20 次測驗',
                icon: 'fas fa-trophy',
                condition: () => this.learningData.totalQuizzesTaken >= CONFIG.ACHIEVEMENT_THRESHOLDS.QUIZ_EXPERT
            }
        ];
    }

    /**
     * 更新學習統計
     * @param {string} type - 統計類型
     * @param {number} value - 數值
     */
    updateStats(type, value = 1) {
        if (!this.learningData) return;

        LearningStorage.updateStats(type, value);
        this.learningData = LearningStorage.load();
        
        this.checkAchievements();
        eventBus.emit(EVENTS.DATA_SAVED, { type: 'learning', data: this.learningData });
    }

    /**
     * 檢查成就
     */
    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (!this.learningData.achievements.includes(achievement.id) && 
                achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    /**
     * 解鎖成就
     * @param {Object} achievement - 成就對象
     */
    unlockAchievement(achievement) {
        this.learningData.achievements.push(achievement.id);
        LearningStorage.save(this.learningData);
        
        this.showAchievementNotification(achievement);
        eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, achievement);
        
        if (Utils.validate(true, 'required')) {
            Utils.playSound('success');
        }
    }

    /**
     * 顯示成就通知
     * @param {Object} achievement - 成就對象
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-text">
                    <h4>成就解鎖</h4>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;

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

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    /**
     * 取得學習數據
     * @returns {Object} 學習數據
     */
    getLearningData() {
        return this.learningData;
    }

    /**
     * 取得統計摘要
     * @returns {Object} 統計摘要
     */
    getStatsSummary() {
        if (!this.learningData) return null;

        return {
            totalWords: this.learningData.totalWordsLearned,
            totalQuizzes: this.learningData.totalQuizzesTaken,
            totalFeynman: this.learningData.totalFeynmanExplanations,
            totalForce: this.learningData.totalForceChallenges,
            currentStreak: this.learningData.currentStreak,
            bestStreak: this.learningData.bestStreak,
            totalStudyTime: this.learningData.totalStudyTime,
            totalStudyTimeFormatted: Utils.formatTime(this.learningData.totalStudyTime),
            achievementCount: this.learningData.achievements.length,
            totalAchievements: this.achievements.length
        };
    }

    /**
     * 取得週進度
     * @returns {Object} 週進度
     */
    getWeeklyProgress() {
        if (!this.learningData) return null;

        const goals = this.learningData.weeklyGoals;
        const progress = this.learningData.progress;

        return {
            words: {
                current: progress.words,
                goal: goals.words,
                percentage: Utils.toPercentage(progress.words, goals.words)
            },
            quizzes: {
                current: progress.quizzes,
                goal: goals.quizzes,
                percentage: Utils.toPercentage(progress.quizzes, goals.quizzes)
            },
            feynman: {
                current: progress.feynman,
                goal: goals.feynman,
                percentage: Utils.toPercentage(progress.feynman, goals.feynman)
            },
            force: {
                current: progress.force,
                goal: goals.force,
                percentage: Utils.toPercentage(progress.force, goals.force)
            }
        };
    }

    /**
     * 設置週目標
     * @param {Object} goals - 目標設定
     */
    setWeeklyGoals(goals) {
        if (!this.learningData) return;

        this.learningData.weeklyGoals = { ...this.learningData.weeklyGoals, ...goals };
        LearningStorage.save(this.learningData);
        eventBus.emit(EVENTS.DATA_SAVED, { type: 'goals', data: goals });
    }

    /**
     * 重置週進度
     */
    resetWeeklyProgress() {
        if (!this.learningData) return;

        this.learningData.progress = {
            words: 0,
            quizzes: 0,
            feynman: 0,
            force: 0
        };
        
        LearningStorage.save(this.learningData);
        eventBus.emit(EVENTS.DATA_SAVED, { type: 'progress_reset', data: this.learningData.progress });
    }

    /**
     * 取得成就列表
     * @returns {Array} 成就列表
     */
    getAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.learningData.achievements.includes(achievement.id),
            progress: this.getAchievementProgress(achievement)
        }));
    }

    /**
     * 取得成就進度
     * @param {Object} achievement - 成就對象
     * @returns {Object} 進度信息
     */
    getAchievementProgress(achievement) {
        const thresholds = CONFIG.ACHIEVEMENT_THRESHOLDS;
        
        switch (achievement.id) {
            case 'first_word':
            case 'word_novice':
            case 'word_expert':
                return {
                    current: this.learningData.totalWordsLearned,
                    target: thresholds[achievement.id.toUpperCase()]
                };
            case 'streak_beginner':
            case 'streak_warrior':
                return {
                    current: this.learningData.currentStreak,
                    target: thresholds[achievement.id.toUpperCase()]
                };
            case 'feynman_master':
                return {
                    current: this.learningData.totalFeynmanExplanations,
                    target: thresholds.FEYNMAN_MASTER
                };
            case 'force_warrior':
                return {
                    current: this.learningData.totalForceChallenges,
                    target: thresholds.FORCE_WARRIOR
                };
            case 'quiz_expert':
                return {
                    current: this.learningData.totalQuizzesTaken,
                    target: thresholds.QUIZ_EXPERT
                };
            default:
                return { current: 0, target: 1 };
        }
    }

    /**
     * 取得學習建議
     * @returns {Array} 建議列表
     */
    getLearningRecommendations() {
        if (!this.learningData) return [];

        const recommendations = [];
        const progress = this.getWeeklyProgress();

        // 單字學習建議
        if (progress.words.percentage < 50) {
            recommendations.push({
                type: 'words',
                title: '繼續單字學習',
                description: `還需要學習 ${progress.words.goal - progress.words.current} 個單字達成週目標`,
                priority: 'high',
                icon: 'fas fa-book-open'
            });
        }

        // 費曼學習建議
        if (progress.feynman.percentage < 30) {
            recommendations.push({
                type: 'feynman',
                title: '練習費曼講解',
                description: '用自己的話解釋學過的單字，加深理解',
                priority: 'medium',
                icon: 'fas fa-chalkboard-teacher'
            });
        }

        // 強迫學習建議
        if (progress.force.percentage < 30) {
            recommendations.push({
                type: 'force',
                title: '強迫學習挑戰',
                description: '設定時間限制，提升學習效率',
                priority: 'medium',
                icon: 'fas fa-clock'
            });
        }

        // 測驗建議
        if (progress.quizzes.percentage < 40) {
            recommendations.push({
                type: 'quiz',
                title: '完成學習測驗',
                description: '測試你的學習成果，鞏固知識',
                priority: 'low',
                icon: 'fas fa-question-circle'
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * 記錄學習時間
     * @param {number} seconds - 學習時間（秒）
     */
    recordStudyTime(seconds) {
        this.updateStats('studyTime', seconds);
    }

    /**
     * 匯出學習數據
     * @returns {Object} 匯出的數據
     */
    exportLearningData() {
        return {
            learningData: this.learningData,
            achievements: this.getAchievements(),
            exportDate: new Date().toISOString(),
            version: CONFIG.VERSION
        };
    }

    /**
     * 重置學習數據
     * @param {boolean} keepAchievements - 是否保留成就
     */
    resetLearningData(keepAchievements = false) {
        const confirmed = confirm('確定要重置學習數據嗎？此操作無法復原。');
        if (!confirmed) return;

        const defaultData = LearningStorage.load();
        
        if (keepAchievements && this.learningData) {
            defaultData.achievements = this.learningData.achievements;
        }

        this.learningData = defaultData;
        LearningStorage.save(this.learningData);
        
        Utils.showNotification('學習數據已重置', 'success');
        eventBus.emit(EVENTS.DATA_SAVED, { type: 'reset', data: this.learningData });
    }

    /**
     * 計算學習效率
     * @returns {Object} 效率指標
     */
    calculateEfficiency() {
        if (!this.learningData || this.learningData.totalStudyTime === 0) {
            return { wordsPerMinute: 0, quizzesPerHour: 0, efficiency: 'N/A' };
        }

        const studyTimeMinutes = this.learningData.totalStudyTime / 60;
        const studyTimeHours = this.learningData.totalStudyTime / 3600;

        const wordsPerMinute = this.learningData.totalWordsLearned / studyTimeMinutes;
        const quizzesPerHour = this.learningData.totalQuizzesTaken / studyTimeHours;

        let efficiency = 'low';
        if (wordsPerMinute > 0.5) efficiency = 'high';
        else if (wordsPerMinute > 0.2) efficiency = 'medium';

        return {
            wordsPerMinute: Number(wordsPerMinute.toFixed(2)),
            quizzesPerHour: Number(quizzesPerHour.toFixed(2)),
            efficiency: efficiency,
            totalStudyTimeHours: Number(studyTimeHours.toFixed(1))
        };
    }

    /**
     * 取得學習統計圖表數據
     * @returns {Object} 圖表數據
     */
    getChartData() {
        if (!this.learningData) return null;

        return {
            weeklyProgress: this.getWeeklyProgress(),
            achievements: {
                unlocked: this.learningData.achievements.length,
                total: this.achievements.length
            },
            studyStreak: {
                current: this.learningData.currentStreak,
                best: this.learningData.bestStreak
            },
            efficiency: this.calculateEfficiency()
        };
    }
}

// 建立全域實例
export const learningService = new LearningService();