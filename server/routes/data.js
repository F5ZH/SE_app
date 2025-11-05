// server/routes/data.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 1. 引入我们的"守卫"
const User = require('../models/User'); // 2. 引入 User Model

// 调试接口 - 查看所有用户（开发环境）
router.get('/debug/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password').limit(20);
        res.json({
            count: users.length,
            users: users.map(u => ({
                id: u._id,
                username: u.username,
                email: u.email,
                hasWordBooks: u.wordBooks?.length || 0,
                hasStudyPlans: u.studyPlans?.length || 0,
                hasWordMateState: !!u.wordMateState,
                lastSyncedAt: u.lastSyncedAt,
                createdAt: u.createdAt
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '服务器错误', error: err.message });
    }
});

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
            wordBooks: user.wordBooks || [],
            studyPlans: user.studyPlans || [],
            studyRecords: user.studyRecords || [],
            wordMateState: user.wordMateState || null,
            checkInData: user.checkInData || {},
            userSettings: user.userSettings || {},
            lastSyncedAt: user.lastSyncedAt
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

//  POST /api/data/sync
// @desc    同步所有数据到服务器（覆盖式保存）
// @access  Private
router.post('/sync', auth, async (req, res) => {
    try {
        const { wordBooks, studyPlans, studyRecords, wordMateState, checkInData, userSettings } = req.body;

        // 使用 findByIdAndUpdate 避免版本冲突
        const updateData = {
            lastSyncedAt: new Date()
        };

        if (wordBooks !== undefined) updateData.wordBooks = wordBooks;
        if (studyPlans !== undefined) updateData.studyPlans = studyPlans;
        if (studyRecords !== undefined) updateData.studyRecords = studyRecords;
        if (wordMateState !== undefined) updateData.wordMateState = wordMateState;
        if (checkInData !== undefined) updateData.checkInData = checkInData;
        if (userSettings !== undefined) updateData.userSettings = userSettings;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        res.status(200).json({
            message: '数据同步成功',
            lastSyncedAt: user.lastSyncedAt
        });

    } catch (err) {
        console.error('同步数据错误:', err.message);
        res.status(500).json({ message: '服务器错误', error: err.message });
    }
});

//  POST /api/data/wordbook
// @desc    添加新词书
// @access  Private
router.post('/wordbook', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        const newWordBook = req.body;
        user.wordBooks.push(newWordBook);
        user.lastSyncedAt = new Date();

        await user.save();

        res.status(201).json(user.wordBooks);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

//  DELETE /api/data/wordbook/:id
// @desc    删除词书
// @access  Private
router.delete('/wordbook/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '未找到用户' });
        }

        user.wordBooks = user.wordBooks.filter(book => book.id !== req.params.id);
        user.lastSyncedAt = new Date();

        await user.save();

        res.status(200).json({ message: '词书删除成功' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;