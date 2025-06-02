/**
 * 喬木英語學習系統 - JavaScript 主程式
 * 使用 Alpine.js 進行狀態管理和互動功能
 */

function qiaomuApp() {
    return {
        // 應用程式狀態
        currentModule: 'words',
        readingMode: 'english', // 'english', 'chinese', 'bilingual'
        currentDate: new Date().toLocaleDateString('zh-TW'),
        mobileMenuOpen: false,
        
        // 觸控手勢變數
        touchStartX: 0,
        touchEndX: 0,
        touchStartY: 0,
        touchEndY: 0,

        // 單字學習狀態
        words: [
            // 從範例文字中提取的 CET4+ 單字
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
                word: 'podcast', 
                phonetic: '/ˈpɒdkɑːst/', 
                definition: '播客；音頻節目', 
                etymology: 'iPod + broadcast 合成詞', 
                sentence: 'I used NotebookLM for podcast summaries before.' 
            },
            { 
                word: 'encompass', 
                phonetic: '/ɪnˈkʌmpəs/', 
                definition: '包含；環繞；涵蓋', 
                etymology: 'en- "使進入" + compass "範圍"', 
                sentence: 'Questions that encompass all the content.' 
            },
            { 
                word: 'default', 
                phonetic: '/dɪˈfɔːlt/', 
                definition: '默認；預設值；違約', 
                etymology: '來自古法語 defalte "缺點，缺少"', 
                sentence: 'It\'s ad-free by default, amazing!' 
            },
            { 
                word: 'extract', 
                phonetic: '/ɪkˈstrækt/', 
                definition: '提取；摘錄；精華', 
                etymology: 'ex- "出" + tract "拉" = 拉出', 
                sentence: 'Extract all the stories from the text.' 
            }
        ],
        currentWordIndex: 0,
        wordCardFlipped: false,

        // 閱讀狀態
        showEnglish: true,
        rawEnglishText: `Oh wow! Everyone should definitely try to get an invitation code for the Dia browser.

It's a truly AI Native browser.

Use Case: Podcast summaries. I used NotebookLM before.

The webpage directly asks: "Propose 20 questions about this content, such that the AI's answers will encompass all the text of this podcast."

Follow-up question: "Answer the first question." And it actually answered!

Asked again: "Extract all the stories." It delivered instantly.

Ad-free by default, awesome!`,
        
        rawChineseText: `我去！大家一定要想辦法搞個 Dia 瀏覽器的邀請碼。

真正的 AI Native 瀏覽器。

使用案例：播客總結，以前用 NotebookLM。

網頁直接問："針對這個內容提出 20 個問題，讓 AI 回答後能涵蓋這個播客文本的所有內容"

追問："回答第一個問題"，真的回答了！

再問："提煉所有故事"，秒出。

默認無廣告，太棒了！`,
        
        formattedEnglishText: '',
        formattedChineseText: '',
        highlightedWords: ['native', 'browser', 'invitation', 'podcast', 'encompass', 'default', 'extract'],
        popupWord: '',
        popupX: 0,
        popupY: 0,

        // 測驗狀態
        questions: [
            {
                question: "什麼是文中提到的 Dia 瀏覽器的具體應用？",
                options: ["影片編輯", "播客總結", "程式開發", "社群媒體管理"],
                correctAnswer: 1,
                explanation: "文中明確提到 'Use Case: Podcast summaries'，表明 Dia 瀏覽器用於播客總結相關的任務。"
            },
            {
                question: "用戶對於網頁問答功能最印象深刻的是什麼？",
                options: ["瀏覽器的速度", "允許的問題數量", "AI 直接回答和提取資訊的能力", "使用者介面的設計"],
                correctAnswer: 2,
                explanation: "用戶表達驚訝（'真的回答了！', '秒出'）對於 AI 能夠回答具體問題並基於網頁內容提取故事的能力。"
            },
            {
                question: "文章最後強調 Dia 瀏覽器的什麼重要優勢？",
                options: ["速度很快", "AI 更好", "免費", "默認無廣告"],
                correctAnswer: 3,
                explanation: "文章以 '默認無廣告，太棒了！' 結尾，將此作為重要優勢突出。"
            },
            {
                question: "用什麼術語來描述 Dia 瀏覽器的核心技術？",
                options: ["Web 3.0", "AI Native", "雲端基礎", "開源"],
                correctAnswer: 1,
                explanation: "文中明確表示 '真正的 AI Native 瀏覽器'。"
            }
        ],
        currentQuestionIndex: 0,
        userAnswers: {},
        quizScore: 0,
        quizCompleted: false,

        // 成就狀態
        posterVisible: false,
        selectedPosterStyle: '',
        posterData: {
            title: "學習報告",
            quote: "千里之行，始於足下。"
        },

        // 初始化方法
        init() {
            // 初始化測驗答案
            this.questions.forEach((_, index) => {
                this.userAnswers[index] = null;
            });
            
            // 格式化閱讀文字
            this.formatReadingText();
            
            console.log("喬木英語應用程式已初始化");
        },

        // 單字學習方法
        nextWord() {
            if (this.currentWordIndex < this.words.length - 1) {
                this.currentWordIndex++;
                this.wordCardFlipped = false;
            }
        },

        prevWord() {
            if (this.currentWordIndex > 0) {
                this.currentWordIndex--;
                this.wordCardFlipped = false;
            }
        },

        get currentWordData() {
            if (this.words.length === 0) {
                return { 
                    word: '', 
                    phonetic: '', 
                    definition: '', 
                    etymology: '', 
                    sentence: '' 
                };
            }
            return this.words[this.currentWordIndex];
        },

        // 閱讀方法
        formatReadingText() {
            // 使用 Marked.js 轉換 Markdown 為 HTML
            const formatOptions = { breaks: true, gfm: true };
            let htmlEn = marked.parse(this.rawEnglishText, formatOptions);
            let htmlZh = marked.parse(this.rawChineseText, formatOptions);

            // 為英文文字添加高亮標記
            this.highlightedWords.forEach(word => {
                const regex = new RegExp(`\\b(${word})\\b`, 'gi');
                htmlEn = htmlEn.replace(regex, `<span class="highlighted-word" data-word="${word.toLowerCase()}">$1</span>`);
            });

            this.formattedEnglishText = htmlEn;
            this.formattedChineseText = htmlZh;
        },

        handleWordClick(event) {
            const target = event.target;
            if (target.classList.contains('highlighted-word')) {
                const word = target.dataset.word;
                const definition = this.getWordDefinition(word);
                if (definition) {
                    this.popupWord = target.innerText;
                    // 在點擊的單字附近定位彈出視窗
                    const rect = target.getBoundingClientRect();
                    this.popupX = rect.left + window.scrollX + rect.width / 2;
                    this.popupY = rect.top + window.scrollY;
                }
            }
        },

        getWordDefinition(word) {
            const lowerCaseWord = word.toLowerCase();
            const foundWord = this.words.find(w => w.word.toLowerCase() === lowerCaseWord);
            return foundWord ? foundWord.definition : '暫無釋義';
        },

        getBilingualParagraphs() {
            const englishParagraphs = this.rawEnglishText.split('\n\n');
            const chineseParagraphs = this.rawChineseText.split('\n\n');
            return englishParagraphs.map((english, index) => ({
                english: this.formatParagraphWithHighlights(english),
                chinese: chineseParagraphs[index] || ''
            }));
        },

        formatParagraphWithHighlights(text) {
            let formatted = text;
            this.highlightedWords.forEach(word => {
                const regex = new RegExp(`\\b(${word})\\b`, 'gi');
                formatted = formatted.replace(regex, `<span class="highlighted-word" data-word="${word.toLowerCase()}">$1</span>`);
            });
            return formatted;
        },

        // 測驗方法
        get currentQuestionData() {
            if (this.questions.length === 0) {
                return { 
                    question: '', 
                    options: [], 
                    correctAnswer: -1, 
                    explanation: '' 
                };
            }
            return this.questions[this.currentQuestionIndex];
        },

        selectAnswer(index) {
            if (this.userAnswers[this.currentQuestionIndex] === null) {
                this.userAnswers[this.currentQuestionIndex] = index;
            }
        },

        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },

        finishQuiz() {
            this.calculateScore();
            this.quizCompleted = true;
            // 滾動到結果區域
            this.$nextTick(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            });
        },

        calculateScore() {
            let score = 0;
            this.questions.forEach((question, index) => {
                if (this.userAnswers[index] === question.correctAnswer) {
                    score++;
                }
            });
            this.quizScore = score;
        },

        retakeQuiz() {
            this.currentQuestionIndex = 0;
            this.quizCompleted = false;
            this.quizScore = 0;
            // 重置答案
            this.questions.forEach((_, index) => {
                this.userAnswers[index] = null;
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        getQuizFeedback() {
            const percentage = (this.quizScore / this.questions.length) * 100;
            if (percentage === 100) return "完美！你完全掌握了內容。";
            if (percentage >= 75) return "很棒！對內容的理解非常到位。";
            if (percentage >= 50) return "不錯，還有提升空間，再接再厲！";
            return "需要多加練習哦，重新測試或回顧原文吧！";
        },

        // 成就方法
        showPoster(style) {
            this.selectedPosterStyle = style;
            this.posterVisible = true;
        },

        getPosterContent() {
            const quotes = {
                'bold-modern': "突破極限，追求卓越，成就非凡！",
                'cyberpunk': "知識就是力量，程式碼就是自由。",
                'elegant-vintage': "教育不是為生活做準備；教育就是生活本身。",
                'neo-futurism': "未來屬於那些不斷學習技能並創造性地結合它們的人。"
            };

            const difficultWords = this.getDifficultWords();

            return `
                <div class="poster-header">
                    <h2 class="text-2xl font-bold mb-2">學習報告</h2>
                    <p class="text-sm opacity-80">${this.currentDate}</p>
                </div>
                
                <div class="poster-stats">
                    <div class="stat-card">
                        <div class="stat-number">${this.words.length}</div>
                        <div class="stat-label">今日單字</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.quizScore}/${this.questions.length}</div>
                        <div class="stat-label">測驗得分</div>
                    </div>
                </div>
                
                <div class="poster-words">
                    <h3 class="text-base font-semibold mb-3">今日挑戰詞彙</h3>
                    ${difficultWords.map(word => `
                        <div class="word-card">
                            <div class="word-main">
                                <div class="word-text">${word.word}</div>
                                <div class="word-phonetic">${word.phonetic}</div>
                            </div>
                            <div class="word-definition">${word.definition}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="poster-footer mt-auto">
                    <p class="poster-quote text-center text-sm mb-3">${quotes[this.selectedPosterStyle]}</p>
                    <div class="poster-branding text-center opacity-60">喬木英語</div>
                </div>
            `;
        },

        getDifficultWords() {
            // 根據單字長度和定義長度綜合評分
            return this.words
                .map(word => ({
                    ...word,
                    difficulty: word.word.length + word.definition.length
                }))
                .sort((a, b) => b.difficulty - a.difficulty)
                .slice(0, 3); // 只返回最難的3個單字
        },

        // 觸控手勢處理
        handleTouchStart(event) {
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
        },

        handleTouchMove(event) {
            this.touchEndX = event.touches[0].clientX;
            this.touchEndY = event.touches[0].clientY;
        },

        handleTouchEnd(context) {
            const deltaX = this.touchEndX - this.touchStartX;
            const deltaY = this.touchEndY - this.touchStartY;

            // 只有在水平移動顯著且垂直移動不大時才識別為滑動
            if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50 && this.touchEndX !== 0) {
                if (deltaX < -50) { // 左滑（下一個）
                    if (context === 'words') {
                        if (this.currentWordIndex < this.words.length - 1) {
                            this.nextWord();
                        } else {
                            // 最後一個單字，自動切換到閱讀
                            this.currentModule = 'reading';
                        }
                    } else if (context === 'reading' && !this.quizCompleted) {
                        // 閱讀時左滑可以切換到測驗（如果已選擇答案）
                        if (this.userAnswers[this.currentQuestionIndex] !== null && this.currentQuestionIndex < this.questions.length - 1) {
                            this.nextQuestion();
                        } else if (this.userAnswers[this.currentQuestionIndex] !== null && this.currentQuestionIndex === this.questions.length - 1) {
                            this.finishQuiz();
                        }
                    }
                } else if (deltaX > 50) { // 右滑（上一個）
                    if (context === 'words') {
                        this.prevWord();
                    } else if (context === 'reading' && !this.quizCompleted) {
                        // 閱讀時右滑回到上一題
                        if (this.currentQuestionIndex > 0) {
                            this.currentQuestionIndex--;
                        }
                    }
                }
            }
            
            // 重置觸控座標
            this.touchStartX = 0;
            this.touchEndX = 0;
            this.touchStartY = 0;
            this.touchEndY = 0;
        },

        // 實用工具方法
        formatDate(date) {
            return new Date(date).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        // 本地儲存方法（如果需要持久化）
        saveProgress() {
            const progressData = {
                currentWordIndex: this.currentWordIndex,
                quizScore: this.quizScore,
                quizCompleted: this.quizCompleted,
                userAnswers: this.userAnswers,
                lastStudyDate: new Date().toISOString()
            };
            
            try {
                localStorage.setItem('qiaomu-english-progress', JSON.stringify(progressData));
            } catch (error) {
                console.warn('無法儲存進度到本地儲存:', error);
            }
        },

        loadProgress() {
            try {
                const saved = localStorage.getItem('qiaomu-english-progress');
                if (saved) {
                    const progressData = JSON.parse(saved);
                    
                    // 檢查是否是同一天的學習記錄
                    const savedDate = new Date(progressData.lastStudyDate);
                    const today = new Date();
                    const isSameDay = savedDate.toDateString() === today.toDateString();
                    
                    if (isSameDay) {
                        this.currentWordIndex = progressData.currentWordIndex || 0;
                        this.quizScore = progressData.quizScore || 0;
                        this.quizCompleted = progressData.quizCompleted || false;
                        this.userAnswers = progressData.userAnswers || {};
                    }
                }
            } catch (error) {
                console.warn('無法載入已儲存的進度:', error);
            }
        },

        // 重置學習進度
        resetProgress() {
            this.currentWordIndex = 0;
            this.currentQuestionIndex = 0;
            this.quizScore = 0;
            this.quizCompleted = false;
            this.wordCardFlipped = false;
            this.userAnswers = {};
            this.currentModule = 'words';
            
            // 重新初始化測驗答案
            this.questions.forEach((_, index) => {
                this.userAnswers[index] = null;
            });
            
            // 清除本地儲存
            try {
                localStorage.removeItem('qiaomu-english-progress');
            } catch (error) {
                console.warn('無法清除本地儲存:', error);
            }
        },

        // 學習統計方法
        getStudyStats() {
            const wordsLearned = this.currentWordIndex + 1;
            const completionRate = (wordsLearned / this.words.length) * 100;
            const quizAccuracy = this.questions.length > 0 ? (this.quizScore / this.questions.length) * 100 : 0;
            
            return {
                wordsLearned,
                totalWords: this.words.length,
                completionRate: Math.round(completionRate),
                quizAccuracy: Math.round(quizAccuracy),
                isCompleted: this.quizCompleted && completionRate === 100
            };
        },

        // 鍵盤快捷鍵支援
        handleKeydown(event) {
            // 只在特定模組中啟用快捷鍵
            if (this.currentModule === 'words') {
                switch (event.key) {
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.prevWord();
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.nextWord();
                        break;
                    case ' ':
                        event.preventDefault();
                        this.wordCardFlipped = !this.wordCardFlipped;
                        break;
                }
            } else if (this.currentModule === 'quiz' && !this.quizCompleted) {
                // 測驗模組的數字鍵快捷鍵
                const num = parseInt(event.key);
                if (num >= 1 && num <= 4 && this.userAnswers[this.currentQuestionIndex] === null) {
                    event.preventDefault();
                    this.selectAnswer(num - 1);
                }
            }
        }
    };
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    // 添加全域鍵盤事件監聽器
    document.addEventListener('keydown', function(event) {
        // 獲取 Alpine.js 的應用程式實例
        const app = Alpine.$data(document.querySelector('[x-data]'));
        if (app && typeof app.handleKeydown === 'function') {
            app.handleKeydown(event);
        }
    });
    
    console.log('喬木英語學習系統已載入完成');
});

// 在頁面卸載前自動儲存進度
window.addEventListener('beforeunload', function() {
    const app = Alpine.$data(document.querySelector('[x-data]'));
    if (app && typeof app.saveProgress === 'function') {
        app.saveProgress();
    }
});