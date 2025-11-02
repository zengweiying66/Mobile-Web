# 📦 部署说明文档

本文档详细说明如何部署移动端 Web 项目目录系统，包括后端服务和 AI 助手功能。

## 📋 目录

- [系统架构](#系统架构)
- [后端部署](#后端部署)
- [AI 助手部署](#ai-助手部署)
- [前端部署](#前端部署)
- [常见问题](#常见问题)

---

## 🏗️ 系统架构

```
┌─────────────────┐
│   前端页面       │ (index.html, catalog.js, catalog.css)
│  (静态部署)      │
└────────┬────────┘
         │
         │ HTTP API
         ▼
┌─────────────────┐
│   后端服务       │ (Node.js/Python/Go)
│  - 项目扫描      │
│  - 目录更新      │
│  - API 接口      │
└────────┬────────┘
         │
         │ AI API 调用
         ▼
┌─────────────────┐
│   AI 助手服务    │ (华为云 DeepSeek R1 64K)
│  - 智能问答      │
│  - 代码分析      │
│  - 项目推荐      │
└─────────────────┘
```

---

## 🚀 后端部署

### 方案一：Node.js 后端

#### 1. 安装依赖

创建 `backend` 目录并初始化项目：

```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv fs-extra
```

#### 2. 创建后端服务 (backend/server.js)

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 项目扫描函数
async function scanProjects() {
    const projects = [];
    const baseDir = path.join(__dirname, '..');
    const excludeDirs = ['.git', '.github', 'node_modules', 'backend'];

    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (!entry.isDirectory() || excludeDirs.includes(entry.name)) {
                continue;
            }

            const projectDir = path.join(baseDir, entry.name);
            const htmlFiles = await findHtmlFiles(projectDir);
            
            if (htmlFiles.length === 0) continue;

            // 获取最后修改时间
            const stats = await fs.stat(projectDir);
            const lastUpdated = stats.mtime.toISOString().split('T')[0];

            // 查找入口文件
            const entryFile = htmlFiles.find(f => 
                f.includes('index.html') || f.includes('main.html')
            ) || htmlFiles[0];

            projects.push({
                id: entry.name.replace(/[()]/g, ''),
                name: entry.name,
                description: `项目: ${entry.name}`,
                icon: getProjectIcon(entry.name),
                path: path.relative(baseDir, entryFile).replace(/\\/g, '/'),
                files: htmlFiles.map(f => path.basename(f)),
                lastUpdated: lastUpdated
            });
        }
    } catch (error) {
        console.error('扫描项目失败:', error);
    }

    return projects;
}

// 递归查找 HTML 文件
async function findHtmlFiles(dir) {
    const files = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await findHtmlFiles(fullPath));
            } else if (entry.name.endsWith('.html')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error('读取目录失败:', error);
    }
    return files;
}

// 获取项目图标
function getProjectIcon(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('shop')) return '🛒';
    if (lowerName.includes('travel')) return '✈️';
    if (lowerName.includes('grid') || lowerName.includes('layout')) return '📐';
    if (lowerName.includes('css') || lowerName.includes('style')) return '🎨';
    return '📦';
}

// API 路由
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await scanProjects();
        res.json({
            success: true,
            data: projects,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI 聊天 API（代理华为云）
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        // 调用华为云 DeepSeek API
        const response = await fetch(process.env.HUAWEI_AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.HUAWEI_AI_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-r1-64k',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个项目目录助手。当前有以下项目：\n${context.map(p => `- ${p.name}: ${p.description}`).join('\n')}`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        res.json({
            success: true,
            response: data.choices[0].message.content
        });
    } catch (error) {
        console.error('AI API 错误:', error);
        res.status(500).json({
            success: false,
            error: '抱歉，AI 服务暂时不可用'
        });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
    console.log(`📡 API 端点: http://localhost:${PORT}/api/projects`);
    console.log(`🤖 AI 端点: http://localhost:${PORT}/api/ai/chat`);
});
```

#### 3. 配置环境变量 (backend/.env)

```env
PORT=3000
HUAWEI_AI_ENDPOINT=https://your-huawei-endpoint.com/v1/chat/completions
HUAWEI_AI_KEY=your_api_key_here
```

#### 4. 启动后端服务

```bash
cd backend
node server.js
```

#### 5. 使用 PM2 部署（生产环境）

安装 PM2：
```bash
npm install -g pm2
```

启动服务：
```bash
pm2 start server.js --name "mobile-web-backend"
pm2 save
pm2 startup
```

查看日志：
```bash
pm2 logs mobile-web-backend
```

---

### 方案二：Python 后端 (Flask)

#### 1. 安装依赖

```bash
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install flask flask-cors python-dotenv requests
```

#### 2. 创建后端服务 (backend/app.py)

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from pathlib import Path
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).parent.parent

def scan_projects():
    """扫描项目目录"""
    projects = []
    exclude_dirs = {'.git', '.github', 'node_modules', 'backend', '__pycache__'}
    
    for item in BASE_DIR.iterdir():
        if not item.is_dir() or item.name in exclude_dirs:
            continue
            
        html_files = list(item.glob('**/*.html'))
        if not html_files:
            continue
            
        # 获取最后修改时间
        mtime = datetime.fromtimestamp(item.stat().st_mtime)
        last_updated = mtime.strftime('%Y-%m-%d')
        
        # 查找入口文件
        entry_file = next(
            (f for f in html_files if 'index' in f.name.lower()),
            html_files[0]
        )
        
        projects.append({
            'id': item.name.replace('(', '').replace(')', ''),
            'name': item.name,
            'description': f'项目: {item.name}',
            'icon': get_project_icon(item.name),
            'path': str(entry_file.relative_to(BASE_DIR)).replace('\\', '/'),
            'files': [f.name for f in html_files[:10]],
            'lastUpdated': last_updated
        })
    
    return projects

def get_project_icon(name):
    """获取项目图标"""
    name_lower = name.lower()
    if 'shop' in name_lower:
        return '🛒'
    elif 'travel' in name_lower:
        return '✈️'
    elif 'grid' in name_lower or 'layout' in name_lower:
        return '📐'
    elif 'css' in name_lower or 'style' in name_lower:
        return '🎨'
    return '📦'

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """获取项目列表"""
    try:
        projects = scan_projects()
        return jsonify({
            'success': True,
            'data': projects,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """AI 聊天接口"""
    try:
        data = request.json
        message = data.get('message')
        context = data.get('context', [])
        
        # 构建系统提示
        system_prompt = f"你是一个项目目录助手。当前有以下项目：\n"
        system_prompt += "\n".join([f"- {p['name']}: {p['description']}" for p in context])
        
        # 调用华为云 DeepSeek API
        response = requests.post(
            os.getenv('HUAWEI_AI_ENDPOINT'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {os.getenv('HUAWEI_AI_KEY')}"
            },
            json={
                'model': 'deepseek-r1-64k',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': 500,
                'temperature': 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            ai_response = response.json()['choices'][0]['message']['content']
            return jsonify({
                'success': True,
                'response': ai_response
            })
        else:
            raise Exception(f'API 返回错误: {response.status_code}')
            
    except Exception as e:
        print(f'AI API 错误: {e}')
        return jsonify({
            'success': False,
            'error': '抱歉，AI 服务暂时不可用'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### 3. 配置环境变量 (backend/.env)

```env
PORT=5000
HUAWEI_AI_ENDPOINT=https://your-huawei-endpoint.com/v1/chat/completions
HUAWEI_AI_KEY=your_api_key_here
```

#### 4. 启动后端服务

```bash
cd backend
python app.py
```

#### 5. 使用 Gunicorn 部署（生产环境）

安装 Gunicorn：
```bash
pip install gunicorn
```

启动服务：
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 🤖 AI 助手部署

### 1. 获取华为云 DeepSeek API 密钥

1. 访问 [华为云控制台](https://console.huaweicloud.com/)
2. 搜索并开通 "DeepSeek" 服务
3. 创建 API 密钥
4. 记录以下信息：
   - API Endpoint（端点地址）
   - API Key（密钥）

### 2. 配置 API 密钥

在后端项目的 `.env` 文件中配置：

```env
HUAWEI_AI_ENDPOINT=https://your-endpoint.com/v1/chat/completions
HUAWEI_AI_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ 安全提示：**
- 不要将 API 密钥提交到 Git 仓库
- 在 `.gitignore` 中添加 `.env` 文件
- 在生产环境使用环境变量或密钥管理服务

### 3. 修改前端代码

更新 `catalog.js` 中的 `getAIResponse()` 函数，使其调用后端 API：

```javascript
async function getAIResponse(message) {
    try {
        // 调用后端 API 而不是直接调用华为云
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                context: projects  // 传递项目上下文
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data.response;
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('AI API Error:', error);
        return '抱歉，AI 服务暂时不可用。请稍后再试。';
    }
}
```

### 4. 测试 AI 功能

启动后端服务后，测试 AI 接口：

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "有哪些项目？",
    "context": []
  }'
```

### 5. AI 功能优化建议

#### 添加请求限流

```javascript
// 防抖函数，避免频繁请求
let aiRequestTimeout = null;

function sendAIMessageDebounced() {
    clearTimeout(aiRequestTimeout);
    aiRequestTimeout = setTimeout(() => {
        sendAIMessage();
    }, 500);
}
```

#### 添加缓存机制

```javascript
// 缓存常见问题的回答
const aiCache = new Map();

async function getAIResponse(message) {
    // 检查缓存
    if (aiCache.has(message)) {
        return aiCache.get(message);
    }
    
    // 调用 API
    const response = await fetch(/* ... */);
    const answer = await response.json();
    
    // 缓存结果
    aiCache.set(message, answer);
    
    return answer;
}
```

---

## 🌐 前端部署

### 更新前端以使用后端 API

修改 `catalog.js`，添加动态加载项目的功能：

```javascript
// 在文件开头添加 API 配置
const API_BASE_URL = 'http://localhost:3000/api';  // 开发环境
// const API_BASE_URL = 'https://your-domain.com/api';  // 生产环境

// 修改项目加载逻辑
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`);
        const data = await response.json();
        
        if (data.success) {
            // 更新全局 projects 变量
            projects.length = 0;
            projects.push(...data.data);
            
            // 重新渲染项目列表
            renderProjects();
            updateTimestamp();
        } else {
            throw new Error(data.error || 'Failed to load projects');
        }
    } catch (error) {
        console.error('加载项目失败:', error);
        // 使用本地备份数据
        renderProjects();
    }
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();  // 从后端加载
    setupSearch();
    initAI();
});
```

### 静态文件部署

#### 方案 A: GitHub Pages

1. 推送代码到 GitHub
2. 在仓库设置中启用 GitHub Pages
3. 选择分支和目录（通常是 `main` 分支的根目录）
4. 访问 `https://username.github.io/repo-name`

#### 方案 B: Nginx

创建 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/mobile-web;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理到后端 API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 方案 C: Vercel/Netlify

1. 在 Vercel 或 Netlify 注册账号
2. 连接 GitHub 仓库
3. 配置构建命令（如果需要）
4. 自动部署

---

## 🔧 常见问题

### 1. CORS 错误

**问题**：前端调用后端 API 时出现 CORS 错误

**解决方案**：
- 确保后端启用了 CORS
- Node.js: `app.use(cors())`
- Python Flask: `CORS(app)`

### 2. API 密钥泄露

**问题**：不小心将 API 密钥提交到 Git

**解决方案**：
```bash
# 1. 立即撤销旧密钥
# 2. 生成新密钥
# 3. 从 Git 历史中移除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. 后端服务崩溃

**问题**：后端服务意外停止

**解决方案**：
- 使用进程管理器（PM2 或 Supervisor）
- 添加错误处理和日志记录
- 设置健康检查和自动重启

### 4. AI 响应慢

**问题**：AI 助手响应时间过长

**解决方案**：
- 减少 `max_tokens` 限制
- 添加加载动画提示用户等待
- 实现请求超时机制
- 考虑使用流式响应

### 5. 项目扫描不完整

**问题**：某些项目没有被扫描到

**解决方案**：
- 检查项目目录结构
- 确认 HTML 文件命名符合规范
- 查看后端日志排查错误
- 调整扫描逻辑的排除规则

---

## 📊 监控和日志

### 添加日志记录

Node.js 示例：
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
```

### 性能监控

使用 PM2 监控：
```bash
pm2 monit
```

---

## 📚 参考资源

- [Express.js 文档](https://expressjs.com/)
- [Flask 文档](https://flask.palletsprojects.com/)
- [华为云 AI 服务](https://www.huaweicloud.com/)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Nginx 配置指南](https://nginx.org/en/docs/)

---

## 🆘 获取帮助

如遇到问题：
1. 查看本文档的常见问题部分
2. 检查后端日志文件
3. 在 GitHub Issues 中提问
4. 查阅相关技术文档

---

**最后更新**: 2025-11-02
