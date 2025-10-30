# 📱 移动端 Web 项目目录

这是一个功能丰富的项目目录系统，可以方便地浏览、查看源代码和访问仓库中的所有移动端 Web 项目。

## 🌟 特性

- **📋 自动目录生成** - 使用 GitHub Actions 自动扫描和更新项目列表
- **🔍 实时搜索** - 支持按项目名称、描述、ID 搜索
- **📄 源代码查看器** - 直接在浏览器中查看项目的 HTML、CSS、JavaScript 源代码
- **🎨 语法高亮** - 代码显示支持语法高亮，提升可读性
- **🤖 AI 助手** - 集成智能助手，可回答项目相关问题（基于华为云 DeepSeek R1 64K）
- **🔗 双仓库链接** - 同时提供 GitHub 和 Gitee 链接，方便国内用户访问
- **🎨 美观界面** - 现代化的卡片式设计，响应式布局
- **⌨️ 键盘快捷键** - 
  - 按 `/` 键快速聚焦搜索框
  - 按 `ESC` 键清空搜索内容或关闭模态框
- **📊 项目信息** - 显示每个项目的文件数量和简介

## 🚀 使用方法

### 在线访问

#### GitHub Pages
访问 GitHub 仓库：[https://github.com/zengweiying66/Mobile-Web](https://github.com/zengweiying66/Mobile-Web)

#### Gitee Pages（国内镜像）
访问 Gitee 仓库：[https://gitee.com/zxcvbnm668813/mobile-web](https://gitee.com/zxcvbnm668813/mobile-web)

### 本地开发
```bash
# 启动一个简单的 HTTP 服务器
python3 -m http.server 8080

# 或使用 Node.js
npx serve

# 然后在浏览器访问
http://localhost:8080
```

### 查看源代码
1. 点击任意项目卡片上的 **"📄 查看源码"** 按钮
2. 在弹出的源代码查看器中，点击不同的文件标签切换查看
3. 代码会自动应用语法高亮，方便阅读

### 使用 AI 助手
1. 点击右下角的 **🤖** 按钮打开 AI 助手面板
2. 输入你的问题，例如：
   - "有哪些项目？"
   - "如何查看源代码？"
   - "GitHub 地址是什么？"
3. AI 助手会根据项目信息为你提供答案

## 📁 项目结构

```
.
├── index.html                      # 主目录页面
├── catalog.css                     # 目录样式文件
├── catalog.js                      # 目录功能脚本（自动生成）
├── lib/                           # 依赖库
│   ├── simple-highlight.js        # 语法高亮脚本
│   └── simple-highlight.css       # 语法高亮样式
├── .github/
│   └── workflows/
│       └── auto-update-catalog.yml # 自动更新目录的 GitHub Actions
├── 6-2/                           # HTML + CSS 基础项目
├── 7-1(1)/                        # 栅格系统项目
├── 7-2(1)/                        # Web 开发进阶项目
├── 8-1(1)/                        # 高级 Web 应用项目
└── shopM/                         # 移动商城项目
```

## 🔧 添加新项目

### 方法一：自动更新（推荐）

当您向仓库推送新的项目代码时，GitHub Actions 会自动：
1. 扫描仓库中的所有项目目录
2. 自动更新 `catalog.js` 文件
3. 提交并推送更改

**无需手动维护项目列表！**

触发条件：
- 推送 HTML、CSS 或 JS 文件到 main/master 分支
- 手动触发工作流

### 方法二：手动添加

如果需要自定义项目信息，可以手动编辑 `catalog.js` 文件：

```javascript
{
    id: 'project-name',           // 项目唯一标识
    name: '项目名称',              // 显示的项目名称
    description: '项目描述',       // 项目简介
    icon: '📦',                    // 项目图标 (emoji)
    path: 'folder/index.html',    // 项目入口文件路径
    files: ['index.html', ...]    // 项目文件列表
}
```

## 📸 预览

![项目目录预览](https://github.com/user-attachments/assets/30a5b386-fc4a-4142-aa42-60549a5ee365)

## 🎯 当前包含的项目

1. **6-2 项目** - HTML + CSS 基础项目示例
2. **7-1 栅格系统** - 响应式栅格布局实现
3. **7-2 项目** - Web 开发进阶示例
4. **8-1 项目** - 高级 Web 应用开发
5. **移动商城** - 完整的移动端电商网站

## 🔄 自动更新原理

GitHub Actions 工作流（`.github/workflows/auto-update-catalog.yml`）会：

1. **监听代码推送** - 当 HTML/CSS/JS 文件被推送时触发
2. **扫描项目目录** - Python 脚本自动扫描所有项目文件夹
3. **提取项目信息** - 从 HTML 文件中提取标题等信息
4. **更新配置文件** - 自动更新 `catalog.js` 中的项目列表
5. **提交变更** - 如有更改，自动提交并推送

## 🤖 AI 助手集成

AI 助手功能基于华为云 DeepSeek R1 64K 模型，提供：

- **项目信息查询** - 快速了解项目列表和详情
- **使用指导** - 帮助用户了解如何使用目录系统
- **代码相关问题** - 回答关于项目源代码的问题

当前为演示版本，使用预设的响应模式。要启用完整的 AI 功能，需要：

1. 在 `catalog.js` 中的 `getAIResponse()` 函数中集成华为云 DeepSeek API
2. 配置 API 密钥和端点
3. 实现完整的对话逻辑

## 💡 提示

- 搜索功能支持中文和英文
- 点击项目卡片或"打开项目"按钮都可以访问项目
- 点击"查看源码"按钮可以直接查看项目源代码
- 目录页面会自动显示最后更新时间
- 所有项目都经过优化，适配移动端浏览
- GitHub 访问受限时可使用 Gitee 镜像

## 📝 许可证

本项目用于学习和演示目的。
