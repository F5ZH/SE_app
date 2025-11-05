// server/routes/data.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 1. 引入我们的“守卫”
const User = require('../models/User'); // 2. 引入 User Model

//  GET /api/data/all
// @desc    获取当前登录用户的所有数据 (词书, 计划, 记录)
// @access  Private (必须带 Token 才能访问)
router.get('/all', auth, async (req, res) => {
    try {
        // 3. "auth" 守卫已经验证了 token
        //    并把 user.id 放在了 req.user.id 里

        // 4. 从数据库中查找用户，但不选择 (select) 密码
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        // 5. 返回该用户的所有数据
        res.status(200).json({
            wordBooks: user.wordBooks,
            studyPlans: user.studyPlans,
            studyRecords: user.studyRecords
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

//  POST /api/data/wordbook
// @desc    为当前用户添加一本新词书
// @access  Private
router.post('/wordbook', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        // req.body 就是前端发来的新词书对象
        const newWordBook = req.body;

        // 将新词书添加到数组中
        user.wordBooks.push(newWordBook);

        // 保存更新
        await user.save();

        // 返回更新后的词书列表
        res.status(201).json(user.wordBooks);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

// TODO:
// 在这里我们还需要为 deleteWordBook, createStudyPlan, saveStudyRecord 创建 API
// 但我们先把 "获取" 和 "添加词书" 跑通

module.exports = router;