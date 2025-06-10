// scripts/modules/force.js - 強迫學習模組

import { WORD_DATA, CONFIG } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { learningService } from '../services/learningService.js';

export class ForceModule {
    constructor() {
        this.container = null;
        this.currentPhase = 'setup'; // setup, memory, quiz, result
        this.currentWords = [];
        this.studyWords = [];
        this.currentWordIndex = 0;
        this.memoryTimer = null;
        this.quizTimer = null;
        this.memoryStartTime = null;
        this.quizStartTime = null;
        this.memoryTimeLeft = CONFIG.FORCE_CONFIG.MEMORY_TIME;
        this.quizTimeLeft = CONFIG.FORCE_CONFIG.QUIZ_TIME;
        this.quizAnswers = [];
        this.sessionStats = {
            wordsStudied: 0,
            correctAnswers: 0,
            totalTime: 0,
            memoryTime: 0,
            quizTime: 0
        };
        this.init();
    }

    /**
     * 初始化強迫學習模組
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        eventBus.on(EVENTS.MODULE_CHANGED, (moduleName) => {
            if (moduleName === 'force') {
                this.render();
                this.resetSession();
            } else {
                this.cleanup();
            }
        });
    }

    /**
     * 渲染強迫學習模組
     */
    render() {
        const container = document.getElementById('module-container');
        if (!container) return;

        this.container = container;
        container.innerHTML = this.getTemplate();
        this.bindEvents();
        this.updateDisplay();
    }

    /**
     * 取得模組模板
     * @returns {string} HTML模板
     */
    getTemplate() {
        return `
            <div class="force-module">
                <div class="module-header">
                    <h2 class="module-title">
                        <i class="fas fa-dumbbell"></i>強迫學習
                    </h2>
                    <p class="module-description">
                        時間限制下的高強度學習，提升專注力與記憶效率
                    </p>
                </div>

                <!-- 學習階段指示器 -->
                <div class="force-phases">
                    <div class="phase active" data-phase="setup">
                        <div class="phase-number">1</div>
                        <div class="phase-title">設定挑戰</div>
                    </div>
                    <div class="phase" data-phase="memory">
                        <div class="phase-number">2</div>
                        <div class="phase-title">記憶階段</div>
                    </div>
                    <div class="phase" data-phase="quiz">
                        <div class="phase-number">3</div>
                        <div class="phase-title">測驗階段</div>
                    </div>
                    <div class="phase" data-phase="result">
                        <div class="phase-number">4</div>
                        <div class="phase-title">結果分析</div>
                    </div>
                </div>

                <!-- 設定區域 -->
                <div class="setup-area" id="setupArea">
                    <div class="challenge-config">
                        <h3 class="section-title">挑戰設定</h3>
                        
                        <div class="config-grid">
                            <div class="config-item">
                                <label for="memoryTime">記憶時間 (秒)</label>
                                <input type="range" id="memoryTime" min="30" max="120" value="${CONFIG.FORCE_CONFIG.MEMORY_TIME}" step="10">
                                <span class="config-value" id="memoryTimeValue">${CONFIG.FORCE_CONFIG.MEMORY_TIME}秒</span>
                            </div>
                            
                            <div class="config-item">
                                <label for="quizTime">測驗時間 (秒)</label>
                                <input type="range" id="quizTime" min="15" max="60" value="${CONFIG.FORCE_CONFIG.QUIZ_TIME}" step="5">
                                <span class="config-value" id="quizTimeValue">${CONFIG.FORCE_CONFIG.QUIZ_TIME}秒</span>
                            </div>
                            
                            <div class="config-item">
                                <label for="wordCount">單字數量</label>
                                <input type="range" id="wordCount" min="3" max="10" value="${CONFIG.FORCE_CONFIG.MEMORY_TARGET}" step="1">
                                <span class="config-value" id="wordCountValue">${CONFIG.FORCE_CONFIG.MEMORY_TARGET}個</span>
                            </div>
                        </div>

                        <div class="difficulty-selection">
                            <h4>難度選擇</h4>
                            <div class="difficulty-options">
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="easy" checked>
                                    <span class="difficulty-label">
                                        <i class="fas fa-seedling"></i>
                                        <strong>輕鬆</strong>
                                        <small>基礎單字，較長時間</small>
                                    </span>
                                </label>
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="normal">
                                    <span class="difficulty-label">
                                        <i class="fas fa-fire"></i>
                                        <strong>普通</strong>
                                        <small>中等難度，標準時間</small>
                                    </span>
                                </label>
                                <label class="difficulty-option">
                                    <input type="radio" name="difficulty" value="hard">
                                    <span class="difficulty-label">
                                        <i class="fas fa-bolt"></i>
                                        <strong>困難</strong>
                                        <small>高難度單字，緊迫時間</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-large" id="startChallengeBtn">
                        <i class="fas fa-play"></i>開始挑戰
                    </button>
                </div>

                <!-- 記憶階段 -->
                <div class="memory-area hidden" id="memoryArea">
                    <div class="timer-display timer-memory">
                        <div class="timer-circle">
                            <div class="timer-number" id="memoryTimerNumber">${CONFIG.FORCE_CONFIG.MEMORY_TIME}</div>
                            <div class="timer-label">記憶時間</div>
                        </div>
                    </div>

                    <div class="memory-content">
                        <div class="memory-instructions">
                            <h3>專注記憶以下單字</h3>
                            <p>仔細記住每個單字的拼寫、發音和含義</p>
                        </div>

                        <div class="word-display-grid" id="memoryWordGrid">
                            <!-- 記憶單字將由 JavaScript 動態生成 -->
                        </div>

                        <div class="memory-progress">
                            <div class="progress-text">
                                記憶進度: <span id="memoryProgress">準備中...</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" id="memoryProgressBar" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 測驗階段 -->
                <div class="quiz-area hidden" id="quizArea">
                    <div class="timer-display timer-quiz">
                        <div class="timer-circle">
                            <div class="timer-number" id="quizTimerNumber">${CONFIG.FORCE_CONFIG.QUIZ_TIME}</div>
                            <div class="timer-label">測驗時間</div>
                        </div>
                    </div>

                    <div class="quiz-content">
                        <div class="quiz-instructions">
                            <h3>快速測驗</h3>
                            <p>根據提示選擇正確的單字</p>
                        </div>

                        <div class="question-display" id="questionDisplay">
                            <!-- 測驗題目將由 JavaScript 動態生成 -->
                        </div>

                        <div class="quiz-progress">
                            <div class="progress-text">
                                測驗進度: <span id="quizProgress">準備中...</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" id="quizProgressBar" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 結果區域 -->
                <div class="result-area hidden" id="resultArea">
                    <div class="result-header">
                        <h3 class="section-title">挑戰結果</h3>
                        <div class="overall-score" id="overallScore">
                            <!-- 總分將由 JavaScript 動態生成 -->
                        </div>
                    </div>

                    <div class="result-stats">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <div class="stat-text">
                                <div class="stat-number" id="wordsStudiedStat">0</div>
                                <div class="stat-label">單字學習</div>
                            </div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-text">
                                <div class="stat-number" id="correctAnswersStat">0</div>
                                <div class="stat-label">正確答案</div>
                            </div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-text">
                                <div class="stat-number" id="totalTimeStat">0</div>
                                <div class="stat-label">總用時</div>
                            </div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-text">
                                <div class="stat-number" id="accuracyRateStat">0%</div>
                                <div class="stat-label">準確率</div>
                            </div>
                        </div>
                    </div>

                    <div class="detailed-results" id="detailedResults">
                        <!-- 詳細結果將由 JavaScript 動態生成 -->
                    </div>

                    <div class="result-actions">
                        <button class="btn btn-secondary" id="reviewMistakesBtn">
                            <i class="fas fa-eye"></i>檢視錯誤
                        </button>
                        <button class="btn btn-primary" id="tryAgainBtn">
                            <i class="fas fa-redo"></i>再次挑戰
                        </button>
                        <button class="btn btn-success" id="completeSessionBtn">
                            <i class="fas fa-check"></i>完成學習
                        </button>
                    </div>
                </div>

                <!-- 統計面板 -->
                <div class="stats-panel">
                    <h3 class="section-title">
                        <i class="fas fa-chart-line"></i>學習統計
                    </h3>
                    <div class="session-stats" id="sessionStatsDisplay">
                        <!-- 統計信息將由 JavaScript 動態生成 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 綁定事件處理器
     */
    bindEvents() {
        // 配置滑桿事件
        const memoryTimeSlider = this.container.querySelector('#memoryTime');
        const quizTimeSlider = this.container.querySelector('#quizTime');
        const wordCountSlider = this.container.querySelector('#wordCount');

        memoryTimeSlider.addEventListener('input', (e) => {
            this.container.querySelector('#memoryTimeValue').textContent = e.target.value + '秒';
        });

        quizTimeSlider.addEventListener('input', (e) => {
            this.container.querySelector('#quizTimeValue').textContent = e.target.value + '秒';
        });

        wordCountSlider.addEventListener('input', (e) => {
            this.container.querySelector('#wordCountValue').textContent = e.target.value + '個';
        });

        // 開始挑戰按鈕
        const startBtn = this.container.querySelector('#startChallengeBtn');
        startBtn.addEventListener('click', () => {
            this.startChallenge();
        });

        // 再次挑戰按鈕
        const tryAgainBtn = this.container.querySelector('#tryAgainBtn');
        tryAgainBtn.addEventListener('click', () => {
            this.resetSession();
        });

        // 完成學習按鈕
        const completeBtn = this.container.querySelector('#completeSessionBtn');
        completeBtn.addEventListener('click', () => {
            this.completeSession();
        });

        // 檢視錯誤按鈕
        const reviewBtn = this.container.querySelector('#reviewMistakesBtn');
        reviewBtn.addEventListener('click', () => {
            this.showMistakeReview();
        });

        // 測驗選項點擊事件委託
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.quiz-option')) {
                this.handleQuizAnswer(e.target.closest('.quiz-option'));
            }
        });
    }

    /**
     * 重置學習會話
     */
    resetSession() {
        this.currentPhase = 'setup';
        this.currentWords = [];
        this.studyWords = [];
        this.currentWordIndex = 0;
        this.quizAnswers = [];
        
        this.sessionStats = {
            wordsStudied: 0,
            correctAnswers: 0,
            totalTime: 0,
            memoryTime: 0,
            quizTime: 0
        };

        this.cleanup();
        this.updateDisplay();
        this.updatePhase('setup');
    }

    /**
     * 開始挑戰
     */
    startChallenge() {
        const config = this.getConfig();
        this.setupChallenge(config);
        this.startMemoryPhase();
    }

    /**
     * 取得當前配置
     * @returns {Object} 配置對象
     */
    getConfig() {
        return {
            memoryTime: parseInt(this.container.querySelector('#memoryTime').value),
            quizTime: parseInt(this.container.querySelector('#quizTime').value),
            wordCount: parseInt(this.container.querySelector('#wordCount').value),
            difficulty: this.container.querySelector('input[name="difficulty"]:checked').value
        };
    }

    /**
     * 設置挑戰
     * @param {Object} config - 配置對象
     */
    setupChallenge(config) {
        // 根據難度調整時間
        const difficultyMultiplier = {
            easy: 1.5,
            normal: 1.0,
            hard: 0.7
        };

        this.memoryTimeLeft = Math.floor(config.memoryTime * difficultyMultiplier[config.difficulty]);
        this.quizTimeLeft = Math.floor(config.quizTime * difficultyMultiplier[config.difficulty]);

        // 選擇單字
        this.selectWords(config.wordCount, config.difficulty);
    }

    /**
     * 選擇學習單字
     * @param {number} count - 單字數量
     * @param {string} difficulty - 難度級別
     */
    selectWords(count, difficulty) {
        let availableWords = [...WORD_DATA];
        
        // 根據難度篩選單字
        if (difficulty === 'easy') {
            availableWords = availableWords.filter(word => word.word.length <= 6);
        } else if (difficulty === 'hard') {
            availableWords = availableWords.filter(word => word.word.length >= 8);
        }

        this.studyWords = Utils.shuffleArray(availableWords).slice(0, count);
        this.sessionStats.wordsStudied = this.studyWords.length;
    }

    /**
     * 開始記憶階段
     */
    startMemoryPhase() {
        this.currentPhase = 'memory';
        this.updatePhase('memory');
        this.hideAllAreas();
        this.container.querySelector('#memoryArea').classList.remove('hidden');

        this.renderMemoryWords();
        this.startMemoryTimer();
        this.memoryStartTime = Date.now();
    }

    /**
     * 渲染記憶單字
     */
    renderMemoryWords() {
        const wordGrid = this.container.querySelector('#memoryWordGrid');
        wordGrid.innerHTML = this.studyWords.map(word => `
            <div class="memory-word-card">
                <div class="word-main">${word.word}</div>
                <div class="word-phonetic">${word.phonetic}</div>
                <div class="word-definition">${word.definition}</div>
                <div class="word-example">${word.sentence}</div>
            </div>
        `).join('');
    }

    /**
     * 開始記憶計時器
     */
    startMemoryTimer() {
        const totalTime = this.memoryTimeLeft;
        
        this.memoryTimer = setInterval(() => {
            this.memoryTimeLeft--;
            
            // 更新顯示
            this.container.querySelector('#memoryTimerNumber').textContent = this.memoryTimeLeft;
            
            // 更新進度條
            const progress = ((totalTime - this.memoryTimeLeft) / totalTime) * 100;
            this.container.querySelector('#memoryProgressBar').style.width = progress + '%';
            this.container.querySelector('#memoryProgress').textContent = 
                `${totalTime - this.memoryTimeLeft}/${totalTime} 秒`;

            // 時間警告
            if (this.memoryTimeLeft <= 10 && this.memoryTimeLeft > 0) {
                this.container.querySelector('#memoryTimerNumber').classList.add('timer-warning');
                Utils.playSound('notification', 0.1);
            }

            // 時間結束
            if (this.memoryTimeLeft <= 0) {
                this.completeMemoryPhase();
            }
        }, 1000);
    }

    /**
     * 完成記憶階段
     */
    completeMemoryPhase() {
        clearInterval(this.memoryTimer);
        this.sessionStats.memoryTime = Math.floor((Date.now() - this.memoryStartTime) / 1000);
        this.startQuizPhase();
    }

    /**
     * 開始測驗階段
     */
    startQuizPhase() {
        this.currentPhase = 'quiz';
        this.updatePhase('quiz');
        this.hideAllAreas();
        this.container.querySelector('#quizArea').classList.remove('hidden');

        this.currentWordIndex = 0;
        this.generateQuizQuestions();
        this.showNextQuestion();
        this.startQuizTimer();
        this.quizStartTime = Date.now();
    }

    /**
     * 生成測驗題目
     */
    generateQuizQuestions() {
        this.quizQuestions = this.studyWords.map(word => {
            const options = this.generateQuizOptions(word);
            return {
                word: word,
                type: Math.random() > 0.5 ? 'definition' : 'word',
                options: options,
                correctIndex: 0
            };
        });
        
        // 打亂題目順序
        this.quizQuestions = Utils.shuffleArray(this.quizQuestions);
    }

    /**
     * 生成測驗選項
     * @param {Object} correctWord - 正確答案
     * @returns {Array} 選項陣列
     */
    generateQuizOptions(correctWord) {
        const otherWords = WORD_DATA.filter(w => w.word !== correctWord.word);
        const wrongOptions = Utils.shuffleArray(otherWords).slice(0, 3);
        const allOptions = [correctWord, ...wrongOptions];
        
        return Utils.shuffleArray(allOptions);
    }

    /**
     * 顯示下一題
     */
    showNextQuestion() {
        if (this.currentWordIndex >= this.quizQuestions.length) {
            this.completeQuizPhase();
            return;
        }

        const question = this.quizQuestions[this.currentWordIndex];
        const questionDisplay = this.container.querySelector('#questionDisplay');

        if (question.type === 'definition') {
            questionDisplay.innerHTML = `
                <div class="question-content">
                    <h4 class="question-title">選擇正確的單字定義</h4>
                    <div class="question-word">${question.word.word}</div>
                    <div class="question-phonetic">${question.word.phonetic}</div>
                </div>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" data-index="${index}">
                            ${option.definition}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            questionDisplay.innerHTML = `
                <div class="question-content">
                    <h4 class="question-title">選擇對應的單字</h4>
                    <div class="question-definition">${question.word.definition}</div>
                </div>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" data-index="${index}">
                            <div class="option-word">${option.word}</div>
                            <div class="option-phonetic">${option.phonetic}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // 更新進度
        this.updateQuizProgress();
    }

    /**
     * 處理測驗答案
     * @param {Element} optionElement - 選項元素
     */
    handleQuizAnswer(optionElement) {
        const selectedIndex = parseInt(optionElement.dataset.index);
        const question = this.quizQuestions[this.currentWordIndex];
        const isCorrect = question.options[selectedIndex].word === question.word.word;

        // 記錄答案
        this.quizAnswers.push({
            question: question,
            selectedIndex: selectedIndex,
            isCorrect: isCorrect,
            timeSpent: Date.now() - this.quizStartTime
        });

        if (isCorrect) {
            this.sessionStats.correctAnswers++;
            optionElement.classList.add('correct');
            Utils.playSound('success', 0.3);
        } else {
            optionElement.classList.add('incorrect');
            // 顯示正確答案
            const correctOption = this.container.querySelector(
                `.quiz-option[data-index="${question.options.findIndex(opt => opt.word === question.word.word)}"]`
            );
            if (correctOption) {
                correctOption.classList.add('correct');
            }
            Utils.playSound('error', 0.3);
        }

        // 禁用所有選項
        const allOptions = this.container.querySelectorAll('.quiz-option');
        allOptions.forEach(option => option.style.pointerEvents = 'none');

        // 延遲顯示下一題
        setTimeout(() => {
            this.currentWordIndex++;
            this.showNextQuestion();
        }, 1500);
    }

    /**
     * 更新測驗進度
     */
    updateQuizProgress() {
        const progress = (this.currentWordIndex / this.quizQuestions.length) * 100;
        this.container.querySelector('#quizProgressBar').style.width = progress + '%';
        this.container.querySelector('#quizProgress').textContent = 
            `${this.currentWordIndex + 1}/${this.quizQuestions.length} 題`;
    }

    /**
     * 開始測驗計時器
     */
    startQuizTimer() {
        const totalTime = this.quizTimeLeft;
        
        this.quizTimer = setInterval(() => {
            this.quizTimeLeft--;
            
            // 更新顯示
            this.container.querySelector('#quizTimerNumber').textContent = this.quizTimeLeft;

            // 時間警告
            if (this.quizTimeLeft <= 10 && this.quizTimeLeft > 0) {
                this.container.querySelector('#quizTimerNumber').classList.add('timer-warning');
                Utils.playSound('notification', 0.1);
            }

            // 時間結束
            if (this.quizTimeLeft <= 0) {
                this.completeQuizPhase();
            }
        }, 1000);
    }

    /**
     * 完成測驗階段
     */
    completeQuizPhase() {
        clearInterval(this.quizTimer);
        this.sessionStats.quizTime = Math.floor((Date.now() - this.quizStartTime) / 1000);
        this.sessionStats.totalTime = this.sessionStats.memoryTime + this.sessionStats.quizTime;
        this.showResults();
    }

    /**
     * 顯示結果
     */
    showResults() {
        this.currentPhase = 'result';
        this.updatePhase('result');
        this.hideAllAreas();
        this.container.querySelector('#resultArea').classList.remove('hidden');

        this.renderResults();
    }

    /**
     * 渲染結果
     */
    renderResults() {
        const accuracy = this.sessionStats.wordsStudied > 0 ? 
            Math.round((this.sessionStats.correctAnswers / this.sessionStats.wordsStudied) * 100) : 0;

        // 更新統計數字
        this.container.querySelector('#wordsStudiedStat').textContent = this.sessionStats.wordsStudied;
        this.container.querySelector('#correctAnswersStat').textContent = this.sessionStats.correctAnswers;
        this.container.querySelector('#totalTimeStat').textContent = Utils.formatTime(this.sessionStats.totalTime);
        this.container.querySelector('#accuracyRateStat').textContent = accuracy + '%';

        // 總體評分
        const overallScore = this.calculateOverallScore();
        this.container.querySelector('#overallScore').innerHTML = `
            <div class="score-circle">
                <div class="score-number">${overallScore}</div>
                <div class="score-label">總分</div>
            </div>
            <div class="score-grade">${this.getScoreGrade(overallScore)}</div>
        `;

        // 詳細結果
        this.renderDetailedResults();
    }

    /**
     * 計算總體評分
     * @returns {number} 總分
     */
    calculateOverallScore() {
        const accuracy = this.sessionStats.correctAnswers / this.sessionStats.wordsStudied;
        const speedBonus = Math.max(0, 1 - (this.sessionStats.totalTime / (this.memoryTimeLeft + this.quizTimeLeft)));
        
        return Math.round((accuracy * 70 + speedBonus * 30) * 100);
    }

    /**
     * 取得評分等級
     * @param {number} score - 分數
     * @returns {string} 等級
     */
    getScoreGrade(score) {
        if (score >= 90) return '優秀';
        if (score >= 80) return '良好';
        if (score >= 70) return '及格';
        if (score >= 60) return '需改進';
        return '需要努力';
    }

    /**
     * 渲染詳細結果
     */
    renderDetailedResults() {
        const detailedResults = this.container.querySelector('#detailedResults');
        
        const wrongAnswers = this.quizAnswers.filter(answer => !answer.isCorrect);
        
        if (wrongAnswers.length === 0) {
            detailedResults.innerHTML = `
                <div class="perfect-score">
                    <i class="fas fa-trophy"></i>
                    <h4>完美表現！</h4