// scripts/core/config.js - 全域配置

export const CONFIG = {
    APP_NAME: '南臺科技大學英語學習平台',
    VERSION: '1.0.0',
    
    STORAGE_KEYS: {
        USER_DATA: 'qiaomu-user-data',
        LEARNING_DATA: 'qiaomu-learning-data',
        SETTINGS: 'qiaomu-settings',
        SESSION: 'qiaomu-user-session',
        PERFORMANCE: 'qiaomu-performance'
    },
    
    QUIZ_CONFIG: {
        TIME_LIMIT: 300, // 5分鐘
        PASSING_SCORE: 70,
        QUESTION_COUNT: 5
    },
    
    FORCE_CONFIG: {
        MEMORY_TIME: 60,
        QUIZ_TIME: 30,
        MEMORY_TARGET: 10,
        QUIZ_TARGET: 5
    },
    
    FEYNMAN_CONFIG: {
        MIN_EXPLANATION_LENGTH: 50,
        RATING_SCALE: [1, 2, 3, 4, 5]
    },
    
    ANIMATION_DURATIONS: {
        CARD_FLIP: 800,
        MODULE_TRANSITION: 500,
        NOTIFICATION: 3000
    },
    
    API_ENDPOINTS: {
        WORDS: '/api/words',
        PROGRESS: '/api/progress',
        ACHIEVEMENTS: '/api/achievements'
    },
    
    DEFAULT_SETTINGS: {
        theme: 'auto',
        language: 'zh-TW',
        notifications: true,
        soundEffects: true,
        studyReminders: true
    },
    
    ACHIEVEMENT_THRESHOLDS: {
        FIRST_WORD: 1,
        WORD_NOVICE: 10,
        WORD_EXPERT: 50,
        STREAK_BEGINNER: 3,
        STREAK_WARRIOR: 7,
        FEYNMAN_MASTER: 10,
        FORCE_WARRIOR: 5,
        QUIZ_EXPERT: 20
    }
};

export const WORD_DATA = [
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
];

export const QUIZ_QUESTIONS = [
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
];