// server/server.js

const express = require('express');
const cors = require('cors');

const app = express();
// 你的前端在 3000 端口，我们为后端选择一个新端口
const PORT = 8080;

// --- 中间件 ---
// 允许所有来源的跨域请求 (稍后我们会收紧它)
app.use(cors());
// 允许服务器解析JSON格式的请求体
app.use(express.json());

// --- 路由 (API的"链接") ---
// 这是一个测试路由，用来检查服务器是否在工作
app.get('/api/test', (req, res) => {
    // res.json() 会自动发送一个JSON响应
    res.json({ message: '你好，来自后端服务器!' });
});

// --- 启动服务器 ---
app.listen(PORT, () => {
    console.log(`✅ 后端服务器已启动，运行在 http://localhost:${PORT}`);
});