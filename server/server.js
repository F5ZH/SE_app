// server/server.js (完整修正版)

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 8080;

app.use(cors());
// 增加请求体大小限制到 50MB（支持大量词书数据）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// 挂载 auth 路由
app.use('/api/auth', require('./routes/auth'));

// 挂载 data 路由 (你漏掉的就是这一行!)
app.use('/api/data', require('./routes/data'));

// --- 启动服务器 ---
app.listen(PORT, () => {
    console.log(`✅ 后端服务器已启动，运行在 http://localhost:${PORT}`);
});