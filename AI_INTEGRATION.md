# 🤖 AI 助手集成指南

本文档说明如何将华为云 DeepSeek R1 64K 模型集成到项目目录系统中。

## 📋 概述

AI 助手功能位于页面右下角的浮动按钮中，可以帮助用户：
- 了解项目列表和详情
- 学习如何使用目录系统
- 回答关于项目代码的问题
- 提供使用建议

## 🔧 当前实现

当前版本使用**预设响应模式**，在 `catalog.js` 的 `getAIResponse()` 函数中定义了常见问题的回答：

```javascript
async function getAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('项目') || lowerMessage.includes('有哪些')) {
        return `目前项目目录中包含 ${projects.length} 个项目：...`;
    }
    
    if (lowerMessage.includes('如何') || lowerMessage.includes('怎么')) {
        return '你可以点击项目卡片打开项目预览...';
    }
    
    // 更多预设响应...
}
```

## 🚀 完整 AI 集成步骤

### 1. 获取华为云 DeepSeek API 密钥

1. 访问 [华为云控制台](https://console.huaweicloud.com/)
2. 开通 DeepSeek R1 64K 服务
3. 获取 API 密钥和端点地址
4. 记录必要的认证信息

### 2. 修改 `catalog.js` 中的 `getAIResponse()` 函数

替换当前的预设响应逻辑为实际的 API 调用：

```javascript
async function getAIResponse(message) {
    try {
        // 华为云 DeepSeek API 配置
        const API_ENDPOINT = 'YOUR_API_ENDPOINT';
        const API_KEY = 'YOUR_API_KEY';
        
        // 构建提示词，包含项目上下文
        const systemPrompt = `你是一个项目目录助手，专门帮助用户了解以下项目：
${projects.map(p => `- ${p.name}: ${p.description}`).join('\n')}

你可以回答关于这些项目的问题，帮助用户浏览和使用项目目录。`;

        // 调用 DeepSeek API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-r1-64k',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
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
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('AI API Error:', error);
        return '抱歉，AI 服务暂时不可用。请稍后再试。';
    }
}
```

### 3. 安全考虑

**重要：不要将 API 密钥直接写在前端代码中！**

推荐方案：

#### 方案 A: 使用后端代理
```javascript
async function getAIResponse(message) {
    try {
        // 调用自己的后端 API，后端再调用华为云
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                context: projects
            })
        });
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        return '抱歉，AI 服务暂时不可用。';
    }
}
```

#### 方案 B: 使用环境变量（构建时注入）
```javascript
// 在构建流程中通过环境变量注入
const API_KEY = process.env.HUAWEI_DEEPSEEK_KEY;
const API_ENDPOINT = process.env.HUAWEI_DEEPSEEK_ENDPOINT;
```

### 4. 增强功能建议

#### 添加对话历史
```javascript
let conversationHistory = [];

async function getAIResponse(message) {
    // 添加用户消息到历史
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // 调用 API 时包含历史
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { /* ... */ },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ]
        })
    });
    
    const aiMessage = data.choices[0].message.content;
    
    // 添加 AI 回复到历史
    conversationHistory.push({
        role: 'assistant',
        content: aiMessage
    });
    
    return aiMessage;
}
```

#### 添加代码分析功能
```javascript
async function analyzeCode(projectId, fileName) {
    const project = projects.find(p => p.id === projectId);
    const filePath = `${project.path.substring(0, project.path.lastIndexOf('/'))}/${fileName}`;
    
    const response = await fetch(filePath);
    const code = await response.text();
    
    // 让 AI 分析代码
    const aiResponse = await getAIResponse(
        `请分析以下代码并解释其功能：\n\n${code}`
    );
    
    return aiResponse;
}
```

## 📊 API 调用示例

### 请求示例
```json
{
    "model": "deepseek-r1-64k",
    "messages": [
        {
            "role": "system",
            "content": "你是一个项目目录助手..."
        },
        {
            "role": "user",
            "content": "有哪些项目？"
        }
    ],
    "max_tokens": 500,
    "temperature": 0.7
}
```

### 响应示例
```json
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "目前项目目录中包含 5 个项目：..."
            }
        }
    ]
}
```

## 🧪 测试

### 测试预设响应（当前版本）
1. 打开项目目录页面
2. 点击右下角的 🤖 按钮
3. 尝试以下问题：
   - "有哪些项目？"
   - "如何查看源代码？"
   - "GitHub 地址是什么？"

### 测试完整 AI 功能（集成后）
1. 确保 API 密钥配置正确
2. 测试基本对话
3. 测试上下文理解
4. 测试错误处理
5. 测试并发请求

## 💰 成本控制

华为云 DeepSeek API 按 Token 计费，建议：

1. **限制请求频率** - 添加防抖或节流
2. **限制对话长度** - 定期清理历史记录
3. **缓存常见问题** - 预设回答常见问题
4. **设置 Token 上限** - 控制单次响应长度

```javascript
const MAX_HISTORY_LENGTH = 10;
const MAX_TOKENS = 500;

if (conversationHistory.length > MAX_HISTORY_LENGTH) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
}
```

## 🔒 隐私和安全

1. **不记录敏感信息** - 避免将用户输入发送到第三方
2. **内容过滤** - 过滤恶意输入
3. **速率限制** - 防止滥用
4. **HTTPS** - 确保 API 通信加密

## 📚 参考资源

- [华为云官方文档](https://www.huaweicloud.com/)
- [DeepSeek 模型说明](https://huaweicloud.com/product/deepseek.html)
- [API 使用指南](https://support.huaweicloud.com/)

## 🆘 故障排查

### 问题：API 返回 401 错误
**解决方案**：检查 API 密钥是否正确，是否已过期

### 问题：响应超时
**解决方案**：增加超时时间或减少 max_tokens

### 问题：返回内容不相关
**解决方案**：优化 system prompt，提供更多上下文

---

如有问题或建议，欢迎提 Issue！
