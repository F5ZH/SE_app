// server/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 1. 引入 jwt
const User = require('../models/User'); // 引入 User Model

//  POST /api/auth/register (注册功能的 API)
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).json({ message: '此 Email 已经被注册' });
        }

        user = new User({
            email: email,
            password: password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(201).json({ message: '用户注册成功！' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});

// --- ↓↓↓ 我们新添加的代码在这里 ↓↓↓ ---

//  POST /api/auth/login (登录功能的 API)
// @desc    用户登录并获取 Token
router.post('/login', async (req, res) => {
    try {
        // 1. 从前端获取 email 和 password
        const { email, password } = req.body;

        // 2. 检查 email 是否存在
        let user = await User.findOne({ email: email });
        if (!user) {
            // 400 Bad Request
            return res.status(400).json({ message: 'Email 或密码错误' });
        }

        // 3. 检查密码是否匹配
        //    bcrypt.compare 会自动比较明文密码 (password) 和数据库中的加密密码 (user.password)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Email 或密码错误' });
        }

        // 4. 密码正确！创建并返回“通行证” (Token)
        const payload = {
            user: {
                id: user.id // 我们只需要用户的ID
            }
        };

        // 5. 使用我们 .env 文件中的密钥签名
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // 从 .env 读取密钥
            { expiresIn: 360000 }, // Token 有效期 (这里设置了 100 小时)
            (err, token) => {
                if (err) throw err;
                // 6. 将 Token 发回给前端
                res.status(200).json({ token: token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: '服务器错误' });
    }
});
// --- ↑↑↑ 我们新添加的代码在这里 ↑↑↑ ---

module.exports = router;