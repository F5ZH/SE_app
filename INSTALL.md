# 安装指南

## 环境要求

在运行此项目之前，您需要安装以下软件：

### 1. Node.js
- **版本要求**：Node.js 16.0 或更高版本
- **下载地址**：https://nodejs.org/
- **安装步骤**：
  1. 访问 Node.js 官网
  2. 下载 LTS 版本（推荐）
  3. 运行安装程序
  4. 按照提示完成安装

### 2. 验证安装
安装完成后，打开命令提示符或PowerShell，运行以下命令验证安装：

```bash
node --version
npm --version
```

如果显示版本号，说明安装成功。

## 项目安装

### 1. 安装依赖
在项目根目录下运行：

```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问：http://localhost:3000

## 构建生产版本

```bash
npm run build
```

构建完成后，文件将生成在 `dist` 目录中。

## 常见问题

### Q: 提示 "npm 不是内部或外部命令"
**A**: 说明 Node.js 没有正确安装，请重新安装 Node.js 并确保添加到系统 PATH 中。

### Q: 安装依赖时出现网络错误
**A**: 可以尝试使用国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: 端口 3000 被占用
**A**: 可以修改端口：
```bash
npm run dev -- --port 3001
```

## 项目结构说明

```
vocabulary-app/
├── src/                 # 源代码目录
│   ├── components/      # React 组件
│   ├── data/           # 数据文件
│   ├── types/          # TypeScript 类型
│   ├── utils/          # 工具函数
│   └── ...
├── public/             # 静态资源
├── package.json        # 项目配置
├── vite.config.ts      # Vite 配置
└── README.md          # 项目说明
```

## 开发说明

- 使用 TypeScript 进行类型检查
- 使用 Vite 作为构建工具
- 使用 localStorage 进行数据存储
- 采用响应式设计，支持移动端

## 技术支持

如果遇到问题，请检查：
1. Node.js 版本是否符合要求
2. 网络连接是否正常
3. 端口是否被占用
4. 依赖是否正确安装
