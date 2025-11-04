// server/models/User.js

const mongoose = require('mongoose');

// 这就是“用户”的数据结构定义
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true, // 必须有
        unique: true,   // 必须是唯一的（不能重复注册）
        lowercase: true // 自动转为小写
    },
    password: {
        type: String,
        required: true // 必须有
    },
    // 我们可以把之前 localStorage 的数据也移到这里
    // wordBooks: [Object],
    // studyPlans: [Object],
    // studyRecords: [Object],
    // wordMateState: Object
    // ...但我们先保持简单，只做注册
});

// "User" 是我们给这个 Model 起的名字，MongoDB 会自动把它变成复数 "users" 作为 collection 的名字
module.exports = mongoose.model('User', UserSchema);