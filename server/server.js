// server/server.js

// 在文件最顶部加载 .env 文件中的变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // 引入 mongoose

const app = express();
const PORT = 8080;

// --- 中间件 ---
app.use(cors());
app.use(express.json());

// --- 数据库连接 ---
// 从 .env 文件中安全地读取你的“钥匙”
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ 成功连接到 MongoDB Atlas!');
    })
    .catch((err) => {
        console.error('❌ 连接 MongoDB 失败:', err);
    });

// --- 路由 (API的"链接") ---
app.get('/api/test', (req, res) => {
    res.json({ message: '你好，来自后端服务器!' });
});
// 导入 auth 路由
app.use('/api/auth', require('./routes/auth'));

// --- 启动服务器 ---
app.listen(PORT, () => {
    console.log(`✅ 后端服务器已启动，运行在 http://localhost:${PORT}`);
});