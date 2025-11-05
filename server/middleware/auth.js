// server/middleware/auth.js

const jwt = require('jsonwebtoken');

// 这个函数就是我们的“守卫”
module.exports = function (req, res, next) {
    // 1. 从请求的 header 中获取 token
    //    (我们规定前端在发送请求时，必须把 token 放在一个叫 'x-auth-token' 的 header 里)
    const token = req.header('x-auth-token');

    // 2. 检查是否存在 token
    if (!token) {
        return res.status(401).json({ message: '没有 token，授权失败' });
    }

    // 3. 验证 token
    try {
        // 使用我们 .env 文件中的密钥来解码 "通行证"
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. 解码成功！把 "payload" (包含 user.id) 附加到 req 对象上
        //    这样，后面的 API 就能知道是哪个用户在请求
        req.user = decoded.user;

        // 5. 放行，让请求继续前往它想去的 API
        next();

    } catch (err) {
        res.status(401).json({ message: 'Token 无效' });
    }
};