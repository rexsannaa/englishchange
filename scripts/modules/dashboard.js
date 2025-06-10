// scripts/modules/dashboard.js - 儀表板模組

import { learningService } from '../services/learningService.js';
import { userService } from '../services/userService.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { Utils } from '../core/utils.js';
import { CONFIG } from '../core/config.js';

export class DashboardModule {
    constructor() {
        this.container = null;
        this.refreshInterval = null;
        this.init();
    }

    /**
     * 初始化儀表板模組
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        eventBus.on(EVENTS.MODULE_CHANGED, (moduleName) => {
            if (moduleName === 'dashboard') {
                this.render();
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        eventBus.on(EVENTS.DATA_SAVED, () => {
            this.updateStats();
        });
    }

    /**
     * 渲染儀表板
     */
    render() {
        const container = document.getElementById('module-container');
        if (!container) return;

        this.container = container;
        container.innerHTML = this.getTemplate();
        this.bindEvents();
        this.updateStats();
        this.updateRecommendations();
    }

    /**
     * 取得模板
     * @returns {string} HTML模板
     */
    getTemplate() {
        return `
            <div class="dashboard-module">
                <h2 class="module-title">
                    <i class="fas fa-chart-line"></i>學習儀表板
                </h2>
                
                <!-- 學習統計卡片 -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-book" style="color: #4ecdc4;"></i>
                        </div>
                        <div class="stat-number" id="totalWords">0</div>
                        <div class="stat-title">已學單字</div>
                        <div class="stat-label">本週新增</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-brain" style="color: #ffd93d;"></i>
                        </div>
                        <div class="stat-number" id="feynmanCount">0</div>
                        <div class="stat-title">費曼解釋</div>
                        <div class="stat-label">深度理解</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dumbbell" style="color: #ff6b6b;"></i>
                        </div>
                        <div class="stat-number" id="forceLevel">0</div>
                        <div class="stat-title">強迫挑戰</div>
                        <div class="stat-label">高效學習</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-fire" style="color: #ff9f43;"></i>
                        </div>
                        <div class="stat-number" id="currentStreak">0</div>
                        <div class="stat-title">連續天數</div>
                        <div class="stat-label">保持動力</div>
                    </div>
                </div>

                <!-- 週進度 -->
                <div class="progress-section">
                    <h3 class="section-title">
                        <i class="fas fa-target"></i>本週學習目標
                    </h3>
                    <div class="progress-grid" id="progressGrid">
                        <!-- 進度項目將由 JavaScript 動態生成 -->
                    </div>
                </div>

                <!-- 學習建議 -->
                <div class="recommendations-section">
                    <h3 class="section-title">
                        <i class="fas fa-lightbulb"></i>學習建議
                    </h3>
                    <div class="recommendations-grid" id="recommendationsGrid">
                        <!-- 建議將由 JavaScript 動態生成 -->
                    </div>
                </div>

                <!-- 成就展示 -->
                <div class="achievements-section">
                    <h3 class="section-title">
                        <i class="fas fa-trophy"></i>最新成就
                    </h3>
                    <div class="achievements-list" id="achievementsList">
                        <!-- 成就將由 JavaScript 動態生成 -->
                    </div>
                </div>

                <!-- 學習效率 -->
                <div class="efficiency-section">
                    <h3 class="section-title">
                        <i class="fas fa-chart-bar"></i>學習效率
                    </h3>
                    <div class="efficiency-stats" id="efficiencyStats">
                        <!-- 效率統計將由 JavaScript 動態生成 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 統計卡片點擊事件
        const statCards = this.container.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const modules = ['words', 'feynman', 'force', 'dashboard'];
                if (modules[index] !== 'dashboard') {
                    eventBus.emit(EVENTS.MODULE_CHANGED, modules[index]);
                }
            });
        });

        // 建議卡片點擊事件
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.recommendation-card')) {
                const card = e.target.closest('.recommendation-card');
                const moduleType = card.dataset.module;
                if (moduleType) {
                    eventBus.emit(EVENTS.MODULE_CHANGED, moduleType);
                }
            }
        });
    }

    /**
     * 更新統計數據
     */
    updateStats() {
        if (!this.container) return;

        const stats = learningService.getStatsSummary();
        if (!stats) return;

        // 更新統計數字
        this.updateElement('totalWords', stats.totalWords);
        this.updateElement('feynmanCount', stats.totalFeynman);
        this.updateElement('forceLevel', stats.totalForce);
        this.updateElement('currentStreak', stats.currentStreak);

        // 更新週進度
        this.updateWeeklyProgress();

        // 更新效率統計
        this.updateEfficiency();

        // 更新成就
        this.updateAchievements();
    }

    /**
     * 更新元素內容
     * @param {string} id - 元素ID
     * @param {any} value - 新值
     */
    updateElement(id, value) {
        const element = this.container.querySelector(`#${id}`);
        if (element) {
            // 添加動畫效果
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.textContent = value;
                element.style.transform = 'scale(1)';
            }, 150);
        }
    }

    /**
     * 更新週進度
     */
    updateWeeklyProgress() {
        const progressGrid = this.container.querySelector('#progressGrid');
        if (!progressGrid) return;

        const weeklyProgress = learningService.getWeeklyProgress();
        if (!weeklyProgress) return;

        progressGrid.innerHTML = Object.entries(weeklyProgress).map(([key, progress]) => {
            const titles = {
                words: '單字學習',
                quizzes: '測驗完成',
                feynman: '費曼解釋',
                force: '強迫挑戰'
            };

            const icons = {
                words: 'fas fa-book',
                quizzes: 'fas fa-question-circle',
                feynman: 'fas fa-brain',
                force: 'fas fa-dumbbell'
            };

            return `
                <div class="progress-item">
                    <div class="progress-header">
                        <i class="${icons[key]}"></i>
                        <span class="progress-title">${titles[key]}</span>
                        <span class="progress-ratio">${progress.current}/${progress.goal}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${Math.min(progress.percentage, 100)}%"></div>
                    </div>
                    <div class="progress-percentage">${progress.percentage}%</div>
                </div>
            `;
        }).join('');
    }

    /**
     * 更新學習建議
     */
    updateRecommendations() {
        const recommendationsGrid = this.container.querySelector('#recommendationsGrid');
        if (!recommendationsGrid) return;

        const recommendations = learningService.getLearningRecommendations();
        
        if (recommendations.length === 0) {
            recommendationsGrid.innerHTML = `
                <div class="no-recommendations">
                    <i class="fas fa-check-circle"></i>
                    <p>太棒了！你已經完成了所有建議的學習任務</p>
                </div>
            `;
            return;
        }

        recommendationsGrid.innerHTML = recommendations.slice(0, 4).map(rec => `
            <div class="recommendation-card" data-module="${rec.type}">
                <div class="recommendation-icon">
                    <i class="${rec.icon}"></i>
                </div>
                <div class="recommendation-content">
                    <h4 class="recommendation-title">${rec.title}</h4>
                    <p class="recommendation-desc">${rec.description}</p>
                    <span class="priority-badge priority-${rec.priority}">
                        ${rec.priority === 'high' ? '高優先級' : rec.priority === 'medium' ? '中優先級' : '低優先級'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    /**
     * 更新成就展示
     */
    updateAchievements() {
        const achievementsList = this.container.querySelector('#achievementsList');
        if (!achievementsList) return;

        const achievements = learningService.getAchievements();
        const recentAchievements = achievements
            .filter(a => a.unlocked)
            .slice(-3); // 顯示最近3個成就

        if (recentAchievements.length === 0) {
            achievementsList.innerHTML = `
                <div class="no-achievements">
                    <i class="fas fa-medal"></i>
                    <p>繼續學習來解鎖你的第一個成就！</p>
                </div>
            `;
            return;
        }

        achievementsList.innerHTML = recentAchievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-info">
                    <h4 class="achievement-name">${achievement.name}</h4>
                    <p class="achievement-desc">${achievement.description}</p>
                </div>
                <div class="achievement-badge">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('');
    }

    /**
     * 更新效率統計
     */
    updateEfficiency() {
        const efficiencyStats = this.container.querySelector('#efficiencyStats');
        if (!efficiencyStats) return;

        const efficiency = learningService.calculateEfficiency();
        
        efficiencyStats.innerHTML = `
            <div class="efficiency-grid">
                <div class="efficiency-item">
                    <div class="efficiency-value">${efficiency.wordsPerMinute}</div>
                    <div class="efficiency-label">單字/分鐘</div>
                </div>
                <div class="efficiency-item">
                    <div class="efficiency-value">${efficiency.totalStudyTimeHours}h</div>
                    <div class="efficiency-label">總學習時間</div>
                </div>
                <div class="efficiency-item">
                    <div class="efficiency-indicator efficiency-${efficiency.efficiency}">
                        ${efficiency.efficiency === 'high' ? '高效' : 
                          efficiency.efficiency === 'medium' ? '中等' : '需提升'}
                    </div>
                    <div class="efficiency-label">學習效率</div>
                </div>
            </div>
        `;
    }

    /**
     * 開始自動刷新
     */
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.updateStats();
        }, 30000); // 每30秒刷新一次
    }

    /**
     * 停止自動刷新
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * 銷毀模組
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 建立模組實例
export const dashboardModule = new DashboardModule();