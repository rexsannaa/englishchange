// scripts/modules.js - 南臺科技大學英語學習平台模組邏輯

/**
 * Alpine.js 主應用程式資料
 * 包含所有模組的狀態管理和方法
 */
function qiaomuApp() {
    return {
        // 基本狀態
        currentModule: 'dashboard',
        currentUser: {
            name: localStorage.getItem('username') || '學習者',
            email: localStorage.getItem('email') || 'user@stust.edu.tw'
        },
        learningStreak: 7,

        // 單字學習相關數據
        words: [
            { 
                word: 'native', 
                phonetic: '/ˈneɪtɪv/', 
                definition: '本地的；天生的；土生土長的', 
                etymology: '來自拉丁語 nativus "天生的，自然的"', 
                sentence: 'This is a truly AI Native browser.' 
            },
            { 
                word: 'browser', 
                phonetic: '/ˈbraʊzər/', 
                definition: '瀏覽器；瀏覽者', 
                etymology: '動詞 browse + -er 後綴', 
                sentence: 'You need an invitation code for the Dia browser.' 
            },
            { 
                word: 'invitation', 
                phonetic: '/ˌɪnvɪˈteɪʃən/', 
                definition: '邀請；請帖；邀請函', 
                etymology: '來自拉丁語 invitare "邀請"', 
                sentence: 'Everyone should try to get an invitation code.' 
            },
            { 
                word: 'encompass', 
                phonetic: '/ɪnˈkʌmpəs/', 
                definition: '包含；環繞；涵蓋', 
                etymology: 'en- "使進入" + compass "範圍"', 
                sentence: 'Questions that encompass all the content.' 
            },
            { 
                word: 'extract', 
                phonetic: '/ɪkˈstrækt/', 
                definition: '提取；摘錄；精華', 
                etymology: 'ex- "出" + tract "拉" = 拉出', 
                sentence: 'Extract all the stories from the text.' 
            },
            { 
                word: 'authentic', 
                phonetic: '/ɔːˈθentɪk/', 
                definition: '真實的；可信的；原創的', 
                etymology: '來自希臘語 authentikos "原創的"', 
                sentence: 'We need authentic examples for learning.' 
            },
            { 
                word: 'comprehensive', 
                phonetic: '/ˌkɒmprɪˈhensɪv/', 
                definition: '全面的；綜合的；廣泛的', 
                etymology: 'com- "完全" + prehensive "理解"', 
                sentence: 'This is a comprehensive learning platform.' 
            },
            { 
                word: 'methodology', 
                phonetic: '/ˌmeθəˈdɒlədʒi/', 
                definition: '方法論；方法學', 
                etymology: 'method "方法" + -ology "學說"', 
                sentence: 'The Feynman methodology is very effective.' 
            }
        ],
        currentWordIndex: 0,
        wordCardFlipped: false,

        // 費曼學習相關數據
        feynmanWordIndex: -1,
        feynmanExplanation: '',
        feynmanFeedback: '',
        feynmanHistory: [],
        feynmanProgress: {
            completed: 3,
            total: 8
        },

        // 強迫學習相關數據
        forceChallenge: {
            active: false,
            type: '',
            timeLeft: 0,
            totalTime: 0,
            words: [],
            currentQuestion: null,
            score: 0,
            target: 0,
            completed: false,
            success: false
        },
        forceProgress: {
            level: 3,
            totalChallenges: 12,
            successRate: 75,
            bestScore: 8
        },

        // 測驗相關數據
        questions: [
            {
                question: "什麼是 'native' 這個單字最常見的含義？",
                options: ["外國的", "本地的", "現代的", "複雜的"],
                correctAnswer: 1,
                explanation: "'native' 最常見的含義是本地的、天生的，指某地原產的或與生俱來的特質。"
            },
            {
                question: "單字 'encompass' 的詞根含義是什麼？",
                options: ["拉出", "使進入", "分離", "連接"],
                correctAnswer: 1,
                explanation: "'encompass' 由 en-（使進入）+ compass（範圍）組成，表示包含或涵蓋。"
            },
            {
                question: "下列哪個單字與 'extract' 的詞根構成最相似？",
                options: ["attract", "contract", "subtract", "以上皆是"],
                correctAnswer: 3,
                explanation: "這些單字都含有拉丁語詞根 'tract'，意思是拉、拖拽。"
            },
            {
                question: "'comprehensive' 的前綴 'com-' 表示什麼意思？",
                options: ["反對", "完全", "部分", "重複"],
                correctAnswer: 1,
                explanation: "前綴 'com-' 表示完全、一起，與 'prehensive'（理解）結合表示全面理解。"
            },
            {
                question: "'methodology' 這個單字的後綴 '-ology' 通常表示什麼？",
                options: ["動作", "狀態", "學說", "地點"],
                correctAnswer: 2,
                explanation: "後綴 '-ology' 來自希臘語，表示學說、學科或研究領域。"
            }
        ],
        currentQuestionIndex: 0,
        userAnswers: {},
        quizScore: 0,
        quizCompleted: false,
        quizTimer: 0,

        /**
         * 初始化方法
         */
        init() {
            this.loadUserData();
            this.startQuizTimer();
            this.initializeAnswers();
            console.log('Alpine.js 應用程式已初始化');
        },

        /**
         * 載入用戶數據
         */
        loadUserData() {
            const savedData = localStorage.getItem('qiaomu-user-data');
            if (savedData) {
                const userData = JSON.parse(savedData);
                this.learningStreak = userData.learningStreak || 7;
                this.feynmanHistory = userData.feynmanHistory || [];
                this.forceProgress = userData.forceProgress || this.forceProgress;
                this.feynmanProgress = userData.feynmanProgress || this.feynmanProgress;
            }
        },

        /**
         * 保存用戶數據
         */
        saveUserData() {
            const userData = {
                learningStreak: this.learningStreak,
                feynmanHistory: this.feynmanHistory,
                forceProgress: this.forceProgress,
                feynmanProgress: this.feynmanProgress,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('qiaomu-user-data', JSON.stringify(userData));
        },

        /**
         * 初始化測驗答案
         */
        initializeAnswers() {
            this.questions.forEach((_, index) => {
                this.userAnswers[index] = null;
            });
        },

        // ==========================================================================
        // 單字學習模組方法
        // ==========================================================================

        /**
         * 取得當前單字數據
         */
        get currentWordData() {
            return this.words[this.currentWordIndex] || {};
        },

        /**
         * 下一個單字
         */
        nextWord() {
            if (this.currentWordIndex < this.words.length - 1) {
                this.currentWordIndex++;
                this.wordCardFlipped = false;
                
                // 更新學習統計
                if (window.qiaomuApp) {
                    window.qiaomuApp.updateLearningStats('word', 1);
                }
            }
        },

        /**
         * 上一個單字
         */
        prevWord() {
            if (this.currentWordIndex > 0) {
                this.currentWordIndex--;
                this.wordCardFlipped = false;
            }
        },

        /**
         * 取得剩餘單字數量
         */
        getRemainingWords() {
            return Math.max(0, this.words.length - this.currentWordIndex - 1);
        },

        // ==========================================================================
        // 費曼學習模組方法
        // ==========================================================================

        /**
         * 取得當前費曼學習單字
         */
        get currentFeynmanWord() {
            return this.words[this.feynmanWordIndex] || {};
        },

        /**
         * 選擇費曼學習單字
         */
        selectFeynmanWord(index) {
            this.feynmanWordIndex = index;
            this.feynmanExplanation = '';
            this.feynmanFeedback = '';
        },

        /**
         * 檢查費曼解釋
         */
        checkFeynmanExplanation() {
            const length = this.feynmanExplanation.length;
            
            if (length > 100) {
                this.feynmanFeedback = "很好！你的解釋很詳細。記住要用簡單的語言，就像在教小孩一樣。";
            } else if (length > 50) {
                this.feynmanFeedback = "不錯的開始！可以再詳細一些，增加一些例子會更好。";
            } else if (length > 20) {
                this.feynmanFeedback = "繼續加油！試著用更多的詞彙來解釋這個概念。";
            } else {
                this.feynmanFeedback = "";
            }
        },

        /**
         * 提交費曼解釋
         */
        submitFeynmanExplanation() {
            if (this.feynmanExplanation.length < 50) {
                alert('解釋內容太短，請至少寫50個字符！');
                return;
            }

            const rating = Math.floor(Math.random() * 2) + 4; // 4-5 星評分
            const feedbacks = [
                "優秀的解釋！你真正理解了這個概念。",
                "很好的嘗試！你的表達很清楚。",
                "不錯的解釋！繼續保持這種學習方式。",
                "很棒！你能用簡單的話解釋複雜概念。"
            ];
            const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
            
            // 添加到歷史記錄
            this.feynmanHistory.unshift({
                word: this.currentFeynmanWord.word,
                explanation: this.feynmanExplanation,
                rating: rating,
                feedback: feedback,
                date: new Date().toLocaleDateString('zh-TW')
            });
            
            // 更新進度
            this.feynmanProgress.completed++;
            
            // 重置狀態
            this.feynmanWordIndex = -1;
            this.feynmanExplanation = '';
            this.feynmanFeedback = '';
            
            // 保存數據
            this.saveUserData();
            
            // 更新統計
            if (window.qiaomuApp) {
                window.qiaomuApp.updateLearningStats('feynman', 1);
            }
            
            alert(`費曼解釋已提交！獲得 ${rating} 星評價：${feedback}`);
        },

        /**
         * 從單字學習跳轉到費曼解釋
         */
        startFeynmanExplanation() {
            this.currentModule = 'feynman';
            this.selectFeynmanWord(this.currentWordIndex);
        },

        // ==========================================================================
        // 強迫學習模組方法
        // ==========================================================================

        /**
         * 開始強迫學習挑戰
         */
        startForceChallenge(type) {
            this.forceChallenge = {
                active: true,
                type: type,
                timeLeft: type === 'memory' ? 60 : 30,
                totalTime: type === 'memory' ? 60 : 30,
                words: type === 'memory' ? this.getRandomWords(10) : [],
                currentQuestion: type === 'quiz' ? this.getRandomQuestion() : null,
                score: 0,
                target: type === 'memory' ? 10 : 5,
                completed: false,
                success: false
            };
            
            this.startForceTimer();
        },

        /**
         * 開始強迫學習計時器
         */
        startForceTimer() {
            const timer = setInterval(() => {
                this.forceChallenge.timeLeft--;
                
                if (this.forceChallenge.timeLeft <= 0) {
                    clearInterval(timer);
                    this.completeForceChallenge();
                }
            }, 1000);
        },

        /**
         * 回答強迫學習問題
         */
        answerForceQuestion(answerIndex) {
            if (answerIndex === this.forceChallenge.currentQuestion.correctAnswer) {
                this.forceChallenge.score++;
            }
            
            if (this.forceChallenge.score >= this.forceChallenge.target) {
                this.forceChallenge.success = true;
                this.completeForceChallenge();
            } else {
                // 下一題
                this.forceChallenge.currentQuestion = this.getRandomQuestion();
            }
        },

        /**
         * 完成強迫學習挑戰
         */
        completeForceChallenge() {
            this.forceChallenge.completed = true;
            this.forceChallenge.active = false;
            
            if (this.forceChallenge.score >= this.forceChallenge.target) {
                this.forceChallenge.success = true;
            }
            
            // 更新統計
            this.forceProgress.totalChallenges++;
            if (this.forceChallenge.success) {
                this.forceProgress.level = Math.min(this.forceProgress.level + 1, 10);
            }
            this.forceProgress.bestScore = Math.max(this.forceProgress.bestScore, this.forceChallenge.score);
            this.forceProgress.successRate = Math.round(
                (this.forceProgress.successRate * (this.forceProgress.totalChallenges - 1) + 
                 (this.forceChallenge.success ? 100 : 0)) / this.forceProgress.totalChallenges
            );
            
            // 保存數據
            this.saveUserData();
            
            // 更新全域統計
            if (window.qiaomuApp) {
                window.qiaomuApp.updateLearningStats('force', 1);
            }
        },

        /**
         * 重試強迫學習挑戰
         */
        retryForceChallenge() {
            const type = this.forceChallenge.type;
            this.endForceChallenge();
            this.startForceChallenge(type);
        },

        /**
         * 結束強迫學習挑戰
         */
        endForceChallenge() {
            this.forceChallenge = {
                active: false,
                type: '',
                timeLeft: 0,
                totalTime: 0,
                words: [],
                currentQuestion: null,
                score: 0,
                target: 0,
                completed: false,
                success: false
            };
        },

        /**
         * 取得隨機單字
         */
        getRandomWords(count) {
            const shuffled = [...this.words].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(count, this.words.length));
        },

        /**
         * 取得隨機問題
         */
        getRandomQuestion() {
            const randomIndex = Math.floor(Math.random() * this.questions.length);
            return this.questions[randomIndex];
        },

        // ==========================================================================
        // 測驗模組方法
        // ==========================================================================

        /**
         * 取得當前問題數據
         */
        get currentQuestionData() {
            return this.questions[this.currentQuestionIndex] || {};
        },

        /**
         * 開始測驗計時器
         */
        startQuizTimer() {
            setInterval(() => {
                if (!this.quizCompleted) {
                    this.quizTimer++;
                }
            }, 1000);
        },

        /**
         * 選擇答案
         */
        selectAnswer(index) {
            if (this.userAnswers[this.currentQuestionIndex] === null) {
                this.userAnswers[this.currentQuestionIndex] = index;
            }
        },

        /**
         * 下一題
         */
        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },

        /**
         * 完成測驗
         */
        finishQuiz() {
            this.calculateScore();
            this.quizCompleted = true;
            
            // 更新統計
            if (window.qiaomuApp) {
                window.qiaomuApp.updateLearningStats('quiz', 1);
            }
        },

        /**
         * 計算分數
         */
        calculateScore() {
            let score = 0;
            this.questions.forEach((question, index) => {
                if (this.userAnswers[index] === question.correctAnswer) {
                    score++;
                }
            });
            this.quizScore = score;
        },

        /**
         * 重新測驗
         */
        retakeQuiz() {
            this.currentQuestionIndex = 0;
            this.quizCompleted = false;
            this.quizScore = 0;
            this.quizTimer = 0;
            this.initializeAnswers();
        },

        // ==========================================================================
        // 通用統計方法
        // ==========================================================================

        /**
         * 取得準確率
         */
        getAccuracyRate() {
            if (this.questions.length === 0) return 0;
            return Math.round((this.quizScore / this.questions.length) * 100);
        },

        /**
         * 取得測驗反饋
         */
        getQuizFeedback() {
            const percentage = this.getAccuracyRate();
            if (percentage === 100) return "🎉 完美！你完全掌握了內容！";
            if (percentage >= 80) return "🌟 優秀！你的理解很到位！";
            if (percentage >= 60) return "👍 不錯！繼續加油！";
            return "💪 需要多加練習，不要放棄！";
        },

        /**
         * 取得分數圖標
         */
        getScoreIcon() {
            const percentage = this.getAccuracyRate();
            if (percentage >= 90) return 'fas fa-trophy';
            if (percentage >= 70) return 'fas fa-medal';
            if (percentage >= 50) return 'fas fa-star';
            return 'fas fa-heart';
        },

        /**
         * 取得分數顏色
         */
        getScoreColor() {
            const percentage = this.getAccuracyRate();
            if (percentage >= 90) return 'color: #ffd700;';
            if (percentage >= 70) return 'color: #c0c0c0;';
            if (percentage >= 50) return 'color: #cd7f32;';
            return 'color: #ff6b6b;';
        },

        // ==========================================================================
        // 工具方法
        // ==========================================================================

        /**
         * 格式化時間
         */
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },

        /**
         * 重置到首頁
         */
        resetToHome() {
            this.currentModule = 'dashboard';
            this.currentWordIndex = 0;
            this.wordCardFlipped = false;
            this.endForceChallenge();
        }
    };
}

/**
 * 頁面載入完成後的初始化檢查
 */
document.addEventListener('DOMContentLoaded', function() {
    // 檢查登入狀態
    if (!localStorage.getItem('username')) {
        window.location.href = 'login.html';
        return;
    }
    
    console.log('南臺科技大學英語雙向費曼學習平台模組已載入');
});