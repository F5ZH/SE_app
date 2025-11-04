// server/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // 引入我们刚创建的 User Model

//  POST /api/auth/register (注册功能的 API)
// @desc    注册一个新用户
router.post('/register', async (req, res) => {
    try {
        // 1. 从前端获取 email 和 password
        const { email, password } = req.body;

        // 2. 检查 email 是否已经被注册
        let user = await User.findOne({ email: email });
        if (user) {
            // 400 Bad Request (错误请求)
            return res.status(400).json({ message: '此 Email 已经被注册' });
        }

        // 3. 如果是新用户，创建实例
        user = new User({
            email: email,
            password: password
        });

        // 4. 加密密码
        const salt = await bcrypt.genSalt(10); // 生成一个“盐”
        user.password = await bcrypt.hash(password, salt); // 把密码和“盐”混合加密

        // 5. 保存到数据库
        await user.save();

        // 6. 返回成功信息
        // 201 Created (成功创建)
        res.status(201).json({ message: '用户注册成功！' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;