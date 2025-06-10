// scripts/modules/feynman.js - 費曼學習模組

import { WORD_DATA, CONFIG } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { learningService } from '../services/learningService.js';

export class FeynmanModule {
    constructor() {
        this.container = null;
        this.currentWord = null;
        this.currentExplanation = '';
        this.timer = null;
        this.startTime = null;
        this.explanationHistory = [];
        this.init();
    }

    /**
     * 初始化費曼學習模組
     */
    init() {
        this.setupEventListeners();
        this.loadExplanationHistory();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        eventBus.on(EVENTS.MODULE_CHANGED, (moduleName) => {
            if (moduleName === 'feynman') {
                this.render();
                this.startFeynmanSession();
            } else {
                this.cleanup();
            }
        });
    }

    /**
     * 渲染費曼學習模組
     */
    render() {
        const container = document.getElementById('module-container');
        if (!container) return;

        this.container = container;
        container.innerHTML = this.getTemplate();
        this.bindEvents();
    }

    /**
     * 取得模組模板
     * @returns {string} HTML模板
     */
    getTemplate() {
        return `
            <div class="feynman-module">
                <div class="module-header">
                    <h2 class="module-title">
                        <i class="fas fa-brain"></i>費曼學習法
                    </h2>
                    <p class="module-description">
                        用自己的話解釋單字，深化理解與記憶
                    </p>
                </div>

                <!-- 學習階段指示器 -->
                <div class="learning-phases">
                    <div class="phase active" data-phase="select">
                        <div class="phase-number">1</div>
                        <div class="phase-title">選擇單字</div>
                    </div>
                    <div class="phase" data-phase="explain">
                        <div class="phase-number">2</div>
                        <div class="phase-title">解釋說明</div>
                    </div>
                    <div class="phase" data-phase="evaluate">
                        <div class="phase-number">3</div>
                        <div class="phase-title">自我評估</div>
                    </div>
                    <div class="phase" data-phase="improve">
                        <div class="phase-number">4</div>
                        <div class="phase-title">改進加強</div>
                    </div>
                </div>

                <!-- 單字選擇區域 -->
                <div class="word-selection-area" id="wordSelectionArea">
                    <h3 class="section-title">選擇要解釋的單字</h3>
                    <div class="word-grid" id="wordGrid">
                        <!-- 單字卡片將由 JavaScript 動態生成 -->
                    </div>
                    <button class="btn btn-secondary" id="randomSelectBtn">
                        <i class="fas fa-random"></i>隨機選擇
                    </button>
                </div>

                <!-- 解釋區域 -->
                <div class="explanation-area hidden" id="explanationArea">
                    <div class="current-word-display">
                        <div class="word-card-large">
                            <div class="word-main" id="currentWordMain">單字</div>
                            <div class="word-phonetic" id="currentWordPhonetic">/音標/</div>
                            <div class="word-definition" id="currentWordDefinition">定義</div>
                        </div>
                    </div>

                    <div class="explanation-section">
                        <h3 class="section-title">用你自己的話解釋這個單字</h3>
                        <div class="explanation-guidelines">
                            <h4>解釋要點提示：</h4>
                            <ul>
                                <li>單字的基本含義是什麼？</li>
                                <li>在什麼情況下會使用這個單字？</li>
                                <li>能否舉出具體的例子？</li>
                                <li>這個單字與其他相似單字有什麼區別？</li>
                                <li>詞根或構詞法有什麼特點？</li>
                            </ul>
                        </div>
                        
                        <div class="explanation-input-container">
                            <textarea 
                                id="explanationTextarea" 
                                placeholder="在這裡用你自己的話解釋這個單字的含義、用法和特點..."
                                rows="8"
                                maxlength="1000"
                            ></textarea>
                            <div class="character-counter">
                                <span id="charCount">0</span> / 1000 字元
                                <span class="min-length-hint">(建議至少 ${CONFIG.FEYNMAN_CONFIG.MIN_EXPLANATION_LENGTH} 字元)</span>
                            </div>
                        </div>

                        <div class="explanation-controls">
                            <button class="btn btn-secondary" id="clearExplanationBtn">
                                <i class="fas fa-eraser"></i>清除內容
                            </button>
                            <button class="btn btn-primary" id="submitExplanationBtn" disabled>
                                <i class="fas fa-check"></i>提交解釋
                            </button>
                        </div>
                    </div>

                    <div class="timer-display">
                        <i class="fas fa-clock"></i>
                        <span id="timerDisplay">00:00</span>
                    </div>
                </div>

                <!-- 評估區域 -->
                <div class="evaluation-area hidden" id="evaluationArea">
                    <h3 class="section-title">評估你的解釋</h3>
                    
                    <div class="evaluation-comparison">
                        <div class="comparison-section">
                            <h4>你的解釋</h4>
                            <div class="user-explanation" id="userExplanationDisplay"></div>
                        </div>
                        
                        <div class="comparison-section">
                            <h4>標準定義</h4>
                            <div class="standard-definition" id="standardDefinitionDisplay"></div>
                            <div class="etymology-info" id="etymologyDisplay"></div>
                            <div class="example-sentence" id="exampleSentenceDisplay"></div>
                        </div>
                    </div>

                    <div class="self-rating-section">
                        <h4>自我評分 (1-5分)</h4>
                        <div class="rating-criteria">
                            <div class="criteria-item">
                                <label>理解準確性</label>
                                <div class="rating-stars" data-category="accuracy">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                            </div>
                            <div class="criteria-item">
                                <label>解釋完整性</label>
                                <div class="rating-stars" data-category="completeness">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                            </div>
                            <div class="criteria-item">
                                <label>表達清晰度</label>
                                <div class="rating-stars" data-category="clarity">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="improvement-section">
                        <h4>改進建議</h4>
                        <div class="improvement-suggestions" id="improvementSuggestions">
                            <!-- 建議將由 JavaScript 動態生成 -->
                        </div>
                    </div>

                    <div class="evaluation-controls">
                        <button class="btn btn-secondary" id="tryAgainBtn">
                            <i class="fas fa-redo"></i>重新解釋
                        </button>
                        <button class="btn btn-primary" id="completeFeynmanBtn">
                            <i class="fas fa-check-circle"></i>完成學習
                        </button>
                    </div>
                </div>

                <!-- 學習歷史 -->
                <div class="learning-history-section">
                    <h3 class="section-title">
                        <i class="fas fa-history"></i>學習歷史
                    </h3>
                    <div class="history-list" id="historyList">
                        <!-- 歷史記錄將由 JavaScript 動態生成 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 綁定事件處理器
     */
    bindEvents() {
        // 隨機選擇按鈕
        const randomSelectBtn = this.container.querySelector('#randomSelectBtn');
        randomSelectBtn.addEventListener('click', () => {
            this.selectRandomWord();
        });

        // 解釋文本框
        const explanationTextarea = this.container.querySelector('#explanationTextarea');
        explanationTextarea.addEventListener('input', (e) => {
            this.handleExplanationInput(e);
        });

        // 清除按鈕
        const clearBtn = this.container.querySelector('#clearExplanationBtn');
        clearBtn.addEventListener('click', () => {
            this.clearExplanation();
        });

        // 提交解釋按鈕
        const submitBtn = this.container.querySelector('#submitExplanationBtn');
        submitBtn.addEventListener('click', () => {
            this.submitExplanation();
        });

        // 評分星星
        const ratingStars = this.container.querySelectorAll('.rating-stars');
        ratingStars.forEach(ratingGroup => {
            const stars = ratingGroup.querySelectorAll('.star');
            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    this.handleRating(ratingGroup, e.target.dataset.rating);
                });
            });
        });

        // 重新嘗試按鈕
        const tryAgainBtn = this.container.querySelector('#tryAgainBtn');
        tryAgainBtn.addEventListener('click', () => {
            this.resetToExplanation();
        });

        // 完成學習按鈕
        const completeBtn = this.container.querySelector('#completeFeynmanBtn');
        completeBtn.addEventListener('click', () => {
            this.completeFeynmanLearning();
        });

        // 單字網格點擊事件委託
        const wordGrid = this.container.querySelector('#wordGrid');
        wordGrid.addEventListener('click', (e) => {
            const wordCard = e.target.closest('.word-card');
            if (wordCard) {
                const wordIndex = parseInt(wordCard.dataset.index);
                this.selectWord(wordIndex);
            }
        });
    }

    /**
     * 開始費曼學習會話
     */
    startFeynmanSession() {
        this.renderWordGrid();
        this.renderLearningHistory();
        this.updatePhase('select');
    }

    /**
     * 渲染單字網格
     */
    renderWordGrid() {
        const wordGrid = this.container.querySelector('#wordGrid');
        if (!wordGrid) return;

        wordGrid.innerHTML = WORD_DATA.map((word, index) => `
            <div class="word-card" data-index="${index}">
                <div class="word-main">${word.word}</div>
                <div class="word-phonetic">${word.phonetic}</div>
                <div class="word-definition-short">${word.definition.substring(0, 30)}...</div>
            </div>
        `).join('');
    }

    /**
     * 選擇單字
     * @param {number} index - 單字索引
     */
    selectWord(index) {
        this.currentWord = WORD_DATA[index];
        this.showExplanationArea();
        this.updatePhase('explain');
        this.startTimer();
    }

    /**
     * 隨機選擇單字
     */
    selectRandomWord() {
        const randomIndex = Math.floor(Math.random() * WORD_DATA.length);
        this.selectWord(randomIndex);
    }

    /**
     * 顯示解釋區域
     */
    showExplanationArea() {
        const wordSelectionArea = this.container.querySelector('#wordSelectionArea');
        const explanationArea = this.container.querySelector('#explanationArea');
        
        wordSelectionArea.classList.add('hidden');
        explanationArea.classList.remove('hidden');

        // 更新當前單字顯示
        this.container.querySelector('#currentWordMain').textContent = this.currentWord.word;
        this.container.querySelector('#currentWordPhonetic').textContent = this.currentWord.phonetic;
        this.container.querySelector('#currentWordDefinition').textContent = this.currentWord.definition;

        // 聚焦到文本框
        const textarea = this.container.querySelector('#explanationTextarea');
        setTimeout(() => textarea.focus(), 100);
    }

    /**
     * 處理解釋輸入
     * @param {Event} e - 輸入事件
     */
    handleExplanationInput(e) {
        const text = e.target.value;
        const charCount = text.length;
        
        // 更新字元計數
        this.container.querySelector('#charCount').textContent = charCount;
        
        // 更新提交按鈕狀態
        const submitBtn = this.container.querySelector('#submitExplanationBtn');
        const isValid = charCount >= CONFIG.FEYNMAN_CONFIG.MIN_EXPLANATION_LENGTH;
        submitBtn.disabled = !isValid;
        submitBtn.classList.toggle('btn-primary', isValid);
        submitBtn.classList.toggle('btn-secondary', !isValid);

        this.currentExplanation = text;
    }

    /**
     * 清除解釋
     */
    clearExplanation() {
        const textarea = this.container.querySelector('#explanationTextarea');
        textarea.value = '';
        this.handleExplanationInput({ target: textarea });
    }

    /**
     * 提交解釋
     */
    submitExplanation() {
        if (this.currentExplanation.length < CONFIG.FEYNMAN_CONFIG.MIN_EXPLANATION_LENGTH) {
            Utils.showNotification('解釋內容太短，請詳細說明', 'warning');
            return;
        }

        this.stopTimer();
        this.showEvaluationArea();
        this.updatePhase('evaluate');
    }

    /**
     * 顯示評估區域
     */
    showEvaluationArea() {
        const explanationArea = this.container.querySelector('#explanationArea');
        const evaluationArea = this.container.querySelector('#evaluationArea');
        
        explanationArea.classList.add('hidden');
        evaluationArea.classList.remove('hidden');

        // 顯示用戶解釋
        this.container.querySelector('#userExplanationDisplay').textContent = this.currentExplanation;
        
        // 顯示標準定義
        this.container.querySelector('#standardDefinitionDisplay').textContent = this.currentWord.definition;
        this.container.querySelector('#etymologyDisplay').innerHTML = `
            <strong>詞源：</strong>${this.currentWord.etymology}
        `;
        this.container.querySelector('#exampleSentenceDisplay').innerHTML = `
            <strong>例句：</strong>${this.currentWord.sentence}
        `;

        // 生成改進建議
        this.generateImprovementSuggestions();
    }

    /**
     * 生成改進建議
     */
    generateImprovementSuggestions() {
        const suggestions = [];
        const userText = this.currentExplanation.toLowerCase();
        const word = this.currentWord;

        // 檢查是否包含詞源信息
        if (!userText.includes('詞根') && !userText.includes('來自')) {
            suggestions.push({
                type: 'etymology',
                title: '加入詞源信息',
                content: `可以提到這個單字的詞源：${word.etymology}`
            });
        }

        // 檢查是否有具體例子
        if (!userText.includes('例如') && !userText.includes('比如')) {
            suggestions.push({
                type: 'example',
                title: '添加具體例子',
                content: '嘗試舉出具體的使用情境或例句來幫助理解'
            });
        }

        // 檢查解釋長度
        if (this.currentExplanation.length < 100) {
            suggestions.push({
                type: 'detail',
                title: '增加解釋深度',
                content: '可以更詳細地解釋單字的含義、用法和語境'
            });
        }

        // 渲染建議
        const suggestionsContainer = this.container.querySelector('#improvementSuggestions');
        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="no-suggestions">
                    <i class="fas fa-thumbs-up"></i>
                    <p>你的解釋已經很完整了！</p>
                </div>
            `;
        } else {
            suggestionsContainer.innerHTML = suggestions.map(suggestion => `
                <div class="suggestion-item">
                    <div class="suggestion-title">
                        <i class="fas fa-lightbulb"></i>
                        ${suggestion.title}
                    </div>
                    <div class="suggestion-content">${suggestion.content}</div>
                </div>
            `).join('');
        }
    }

    /**
     * 處理評分
     * @param {Element} ratingGroup - 評分組元素
     * @param {string} rating - 評分值
     */
    handleRating(ratingGroup, rating) {
        const stars = ratingGroup.querySelectorAll('.star');
        const ratingValue = parseInt(rating);
        
        stars.forEach((star, index) => {
            if (index < ratingValue) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        // 儲存評分
        const category = ratingGroup.dataset.category;
        if (!this.ratings) this.ratings = {};
        this.ratings[category] = ratingValue;

        this.updatePhase('improve');
    }

    /**
     * 重置到解釋階段
     */
    resetToExplanation() {
        const evaluationArea = this.container.querySelector('#evaluationArea');
        const explanationArea = this.container.querySelector('#explanationArea');
        
        evaluationArea.classList.add('hidden');
        explanationArea.classList.remove('hidden');

        // 清除評分
        this.ratings = {};
        const stars = this.container.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));

        this.updatePhase('explain');
        this.startTimer();
    }

    /**
     * 完成費曼學習
     */
    completeFeynmanLearning() {
        // 記錄學習數據
        const learningRecord = {
            word: this.currentWord.word,
            explanation: this.currentExplanation,
            ratings: this.ratings || {},
            studyTime: this.getStudyTime(),
            timestamp: new Date().toISOString()
        };

        // 保存到歷史記錄
        this.explanationHistory.unshift(learningRecord);
        this.saveExplanationHistory();

        // 更新學習統計
        learningService.updateStats('feynman', 1);
        learningService.recordStudyTime(this.getStudyTime());

        // 發布完成事件
        eventBus.emit(EVENTS.FEYNMAN_COMPLETED, learningRecord);

        // 顯示完成訊息
        Utils.showNotification('費曼學習完成！', 'success');
        Utils.playSound('success');

        // 重置到選擇階段
        this.resetToSelection();
    }

    /**
     * 重置到選擇階段
     */
    resetToSelection() {
        const explanationArea = this.container.querySelector('#explanationArea');
        const evaluationArea = this.container.querySelector('#evaluationArea');
        const wordSelectionArea = this.container.querySelector('#wordSelectionArea');
        
        explanationArea.classList.add('hidden');
        evaluationArea.classList.add('hidden');
        wordSelectionArea.classList.remove('hidden');

        // 重置狀態
        this.currentWord = null;
        this.currentExplanation = '';
        this.ratings = {};
        this.stopTimer();

        // 清除表單
        const textarea = this.container.querySelector('#explanationTextarea');
        textarea.value = '';
        this.handleExplanationInput({ target: textarea });

        // 清除評分
        const stars = this.container.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));

        this.updatePhase('select');
        this.renderLearningHistory();
    }

    /**
     * 開始計時器
     */
    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * 停止計時器
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 更新計時器顯示
     */
    updateTimerDisplay() {
        if (!this.startTime) return;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const timerDisplay = this.container.querySelector('#timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = Utils.formatTime(elapsed);
        }
    }

    /**
     * 取得學習時間
     * @returns {number} 學習時間（秒）
     */
    getStudyTime() {
        return this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    }

    /**
     * 更新學習階段
     * @param {string} phase - 階段名稱
     */
    updatePhase(phase) {
        const phases = this.container.querySelectorAll('.phase');
        phases.forEach(p => {
            p.classList.remove('active', 'completed');
            if (p.dataset.phase === phase) {
                p.classList.add('active');
            }
        });

        // 標記已完成的階段
        const phaseOrder = ['select', 'explain', 'evaluate', 'improve'];
        const currentIndex = phaseOrder.indexOf(phase);
        
        phases.forEach(p => {
            const phaseIndex = phaseOrder.indexOf(p.dataset.phase);
            if (phaseIndex < currentIndex) {
                p.classList.add('completed');
            }
        });
    }

    /**
     * 載入解釋歷史
     */
    loadExplanationHistory() {
        const history = localStorage.getItem('feynman-explanation-history');
        this.explanationHistory = history ? JSON.parse(history) : [];
    }

    /**
     * 保存解釋歷史
     */
    saveExplanationHistory() {
        // 只保留最近20個記錄
        if (this.explanationHistory.length > 20) {
            this.explanationHistory = this.explanationHistory.slice(0, 20);
        }
        localStorage.setItem('feynman-explanation-history', JSON.stringify(this.explanationHistory));
    }

    /**
     * 渲染學習歷史
     */
    renderLearningHistory() {
        const historyList = this.container.querySelector('#historyList');
        if (!historyList) return;

        if (this.explanationHistory.length === 0) {
            historyList.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-book-open"></i>
                    <p>還沒有學習記錄，開始你的第一次費曼解釋吧！</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.explanationHistory.slice(0, 5).map(record => {
            const avgRating = this.calculateAverageRating(record.ratings);
            return `
                <div class="history-item">
                    <div class="history-word">
                        <strong>${record.word}</strong>
                        <span class="history-date">${Utils.formatDate(record.timestamp)}</span>
                    </div>
                    <div class="history-details">
                        <div class="history-rating">
                            <span class="rating-stars-display">
                                ${this.renderRatingStars(avgRating)}
                            </span>
                            <span class="study-time">
                                <i class="fas fa-clock"></i>${Utils.formatTime(record.studyTime)}
                            </span>
                        </div>
                        <div class="history-explanation">
                            ${record.explanation.substring(0, 100)}...
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 計算平均評分
     * @param {Object} ratings - 評分對象
     * @returns {number} 平均評分
     */
    calculateAverageRating(ratings) {
        if (!ratings || Object.keys(ratings).length === 0) return 0;
        
        const values = Object.values(ratings);
        return values.reduce((sum, rating) => sum + rating, 0) / values.length;
    }

    /**
     * 渲染評分星星
     * @param {number} rating - 評分值
     * @returns {string} 星星HTML
     */
    renderRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        return starsHtml;
    }

    /**
     * 清理資源
     */
    cleanup() {
        this.stopTimer();
    }

    /**
     * 銷毀模組
     */
    destroy() {
        this.cleanup();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 建立模組實例
export const feynmanModule = new FeynmanModule();