// server/models/User.js

const mongoose = require('mongoose');

// --- 1. 定义我们需要的子数据结构 ---
// (我们直接从 src/types/index.ts 翻译过来)

const WordSchema = new mongoose.Schema({
    id: { type: String, required: true },
    word: { type: String, required: true },
    pronunciation: String,
    translation: { type: String, required: true },
    example: String,
    difficulty: Number,
    createdAt: Number
});

const WordBookSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    words: [WordSchema], // 嵌套 Word 结构
    totalWords: Number,
    isPreset: Boolean,
    createdAt: Number
});

const StudyPlanSchema = new mongoose.Schema({
    id: { type: String, required: true },
    wordBookId: { type: String, required: true },
    wordBookName: String,
    dailyNewWords: Number,
    startDate: Number,
    expectedEndDate: Number,
    isActive: Boolean,
    createdAt: Number
});

const StudyRecordSchema = new mongoose.Schema({
    wordId: { type: String, required: true },
    word: String,
    correctCount: Number,
    wrongCount: Number,
    lastReviewed: Number,
    nextReview: Number,
    interval: Number,
    easeFactor: Number,
    reviewCount: Number,
    difficultCount: Number,
    studyMode: String
});

// --- 2. 定义主用户结构 ---

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    // --- 3. 把数据结构作为字段添加进来 ---
    wordBooks: [WordBookSchema],
    studyPlans: [StudyPlanSchema],
    studyRecords: [StudyRecordSchema],

    // WordMate 状态
    wordMateState: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // 签到记录
    checkInData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // 用户设置
    userSettings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // 最后同步时间
    lastSyncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt
});

module.exports = mongoose.model('User', UserSchema);