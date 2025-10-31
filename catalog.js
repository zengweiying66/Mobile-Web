// 项目配置 - 自动识别所有项目目录
const projects = [
    {
        id: '6-2',
        name: '6-2 项目',
        description: 'HTML + CSS 基础项目，包含多个页面示例',
        icon: '📄',
        path: '6-2/1.html',
        files: ['1.html', '2.html', '1.css', '2.css']
    },
    {
        id: '7-1',
        name: '7-1 栅格系统',
        description: '实现简单的栅格系统，响应式布局示例',
        icon: '📐',
        path: '7-1(1)/index.html',
        files: ['index.html', 'zy.html']
    },
    {
        id: '7-2',
        name: '7-2 项目',
        description: 'Web 开发进阶项目示例',
        icon: '🎨',
        path: '7-2(1)/index.html',
        files: ['index.html', '2.html', '3.html']
    },
    {
        id: '8-1',
        name: '8-1 项目',
        description: '高级 Web 应用开发项目',
        icon: '🚀',
        path: '8-1(1)/zy.html',
        files: ['zy.html']
    },
    {
        id: '8-2',
        name: '8-2 Flex布局',
        description: 'Flex弹性布局实战示例',
        icon: '🔲',
        path: '8-2(1)/1.html',
        files: ['1.html']
    },
    {
        id: 'travel',
        name: '旅游网',
        description: '移动端旅游网站项目，响应式布局',
        icon: '✈️',
        path: 'travel/index.html',
        files: ['index.html', 'css/', 'images/']
    },
    {
        id: 'shopM',
        name: '移动商城',
        description: '移动端电商网站项目，完整的购物商城界面',
        icon: '🛒',
        path: 'shopM/index.html',
        files: ['index.html', 'css/', 'js/', 'img/']
    }
];

// 渲染项目列表
function renderProjects(filteredProjects = projects) {
    const projectList = document.getElementById('projectList');
    
    if (filteredProjects.length === 0) {
        projectList.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <p>没有找到匹配的项目</p>
            </div>
        `;
        return;
    }
    
    projectList.innerHTML = filteredProjects.map(project => `
        <div class="project-card" data-path="${project.path}" tabindex="0" role="button" aria-label="打开 ${project.name}">
            <div class="project-icon">${project.icon}</div>
            <h2 class="project-title">${project.name}</h2>
            <p class="project-description">${project.description}</p>
            <button class="view-code-btn" onclick="event.stopPropagation(); viewCode('${project.id}')">
                📄 查看源码
            </button>
            <a href="${project.path}" class="project-link">
                打开项目 →
            </a>
            <button class="view-repo-btn" onclick="event.stopPropagation(); viewRepository('${project.id}')">
                🔗 查看源代码
            </button>
            <div class="project-meta">
                <span class="file-count">
                    📁 ${project.files.length} 个文件
                </span>
                <span class="project-id">#${project.id}</span>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for keyboard and click navigation
    projectList.querySelectorAll('.project-card').forEach(card => {
        const path = card.getAttribute('data-path');
        
        // Handle clicks on the card (but not on the link)
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                openProject(path);
            }
        });
        
        // Handle keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProject(path);
            }
        });
    });
}

// 打开项目
function openProject(path) {
    // 验证路径是否来自已知的项目列表，防止潜在的XSS攻击
    const validPaths = projects.map(p => p.path);
    if (validPaths.includes(path)) {
        window.location.href = path;
    } else {
        console.error('Invalid project path:', path);
    }
}

// 搜索功能
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filtered = projects.filter(project => 
            project.name.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm) ||
            project.id.toLowerCase().includes(searchTerm)
        );
        
        renderProjects(filtered);
    });
}

// 更新时间
function updateTimestamp() {
    const lastUpdate = document.getElementById('lastUpdate');
    const now = new Date();
    const dateString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    lastUpdate.textContent = dateString;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    setupSearch();
    updateTimestamp();
    initAI();
    
    // Setup modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('codeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Setup repository modal
    const repoModal = document.getElementById('repoModal');
    if (repoModal) {
        repoModal.addEventListener('click', (e) => {
            if (e.target === repoModal) {
                closeRepoModal();
            }
        });
    }
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // 按 '/' 键聚焦搜索框
        if (e.key === '/' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // 按 ESC 清空搜索或关闭模态框
        if (e.key === 'Escape') {
            const modal = document.getElementById('codeModal');
            if (modal.classList.contains('show')) {
                closeModal();
            } else {
                const searchInput = document.getElementById('searchInput');
                searchInput.value = '';
                searchInput.blur();
                renderProjects();
            }
        }
    });
});

// 自动扫描功能（可选）- 用于未来自动发现新项目
function autoDiscoverProjects() {
    // 这个功能需要服务器端支持或文件系统API
    // 当前版本使用静态配置
    console.log('使用静态项目配置');
    return projects;
}

// Code Viewer Functions
function viewCode(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('codeModal');
    const modalTitle = document.getElementById('modalTitle');
    const fileTabs = document.getElementById('fileTabs');
    const codeContent = document.getElementById('codeContent');
    
    modalTitle.textContent = `${project.name} - 源代码`;
    
    // Create file tabs
    const htmlFiles = project.files.filter(f => 
        f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.js')
    );
    
    fileTabs.innerHTML = htmlFiles.map((file, index) => `
        <button class="file-tab ${index === 0 ? 'active' : ''}" 
                onclick="loadFile('${project.id}', '${file}')">
            ${file}
        </button>
    `).join('');
    
    // Load first file
    if (htmlFiles.length > 0) {
        loadFile(project.id, htmlFiles[0]);
    }
    
    modal.classList.add('show');
}

async function loadFile(projectId, fileName) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const codeContent = document.getElementById('codeContent');
    
    // Update active tab
    document.querySelectorAll('.file-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.trim() === fileName) {
            tab.classList.add('active');
        }
    });
    
    try {
        // Construct file path
        let filePath = project.path.substring(0, project.path.lastIndexOf('/') + 1) + fileName;
        
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Failed to load file');
        
        const code = await response.text();
        
        // Determine language for syntax highlighting
        let language = 'markup';
        if (fileName.endsWith('.css')) language = 'css';
        if (fileName.endsWith('.js')) language = 'javascript';
        
        // Apply syntax highlighting
        if (window.highlightCode) {
            codeContent.innerHTML = highlightCode(code, language);
        } else {
            codeContent.textContent = code;
        }
    } catch (error) {
        codeContent.textContent = `// 无法加载文件: ${fileName}\n// 错误: ${error.message}`;
        codeContent.className = 'language-markup';
    }
}

function closeModal() {
    const modal = document.getElementById('codeModal');
    modal.classList.remove('show');
}

// AI Assistant Functions
let aiMessages = [];
let isAIEnabled = false;

function initAI() {
    const aiToggle = document.getElementById('aiToggle');
    const aiPanel = document.getElementById('aiPanel');
    const aiClose = document.querySelector('.ai-close');
    const aiSend = document.getElementById('aiSend');
    const aiInput = document.getElementById('aiInput');
    
    aiToggle.addEventListener('click', () => {
        const isVisible = aiPanel.style.display === 'block';
        aiPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && aiMessages.length === 0) {
            addAIMessage('ai', '你好！我是 AI 助手，由华为云 DeepSeek R1 64K 提供支持。我可以帮你了解这个项目目录中的项目，回答关于代码的问题。有什么可以帮你的吗？');
        }
    });
    
    aiClose.addEventListener('click', () => {
        aiPanel.style.display = 'none';
    });
    
    aiSend.addEventListener('click', sendAIMessage);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAIMessage();
        }
    });
}

function addAIMessage(type, message) {
    const messagesContainer = document.getElementById('aiMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${type}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    aiMessages.push({ type, message });
}

async function sendAIMessage() {
    const aiInput = document.getElementById('aiInput');
    const message = aiInput.value.trim();
    
    if (!message) return;
    
    addAIMessage('user', message);
    aiInput.value = '';
    
    // Simulate AI response (replace with actual API call)
    try {
        const response = await getAIResponse(message);
        addAIMessage('ai', response);
    } catch (error) {
        addAIMessage('ai', '抱歉，AI 服务暂时不可用。请稍后再试。');
    }
}

async function getAIResponse(message) {
    // This is a placeholder for the actual Huawei Cloud DeepSeek API integration
    // For now, provide context-aware responses
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('项目') || lowerMessage.includes('有哪些')) {
        return `目前项目目录中包含 ${projects.length} 个项目：\n${projects.map(p => `• ${p.name} - ${p.description}`).join('\n')}`;
    }
    
    if (lowerMessage.includes('如何') || lowerMessage.includes('怎么')) {
        return '你可以点击项目卡片打开项目预览，或点击"查看源码"按钮查看项目的源代码。使用顶部的搜索框可以快速查找项目。';
    }
    
    if (lowerMessage.includes('源码') || lowerMessage.includes('代码')) {
        return '每个项目卡片都有"查看源码"按钮，点击后可以看到该项目的 HTML、CSS 和 JavaScript 文件。你可以在不同文件之间切换查看。';
    }
    
    if (lowerMessage.includes('github') || lowerMessage.includes('gitee')) {
        return '项目托管在 GitHub 和 Gitee 上。GitHub 地址：https://github.com/zengweiying66/Mobile-Web，Gitee 镜像（适合国内访问）：https://gitee.com/zxcvbnm668813/mobile-web';
    }
    
    return '感谢你的提问！我可以帮你了解项目列表、如何查看源代码、项目仓库地址等信息。请告诉我你想了解什么？';
}

// Repository path mapping
const repoPathMap = {
    '6-2': '6-2',
    '7-1': '7-1(1)',
    '7-2': '7-2(1)',
    '8-1': '8-1(1)',
    '8-2': '8-2(1)',
    'shopM': 'shopM',
    'travel': 'travel'
};

// View repository function
function viewRepository(projectId) {
    const modal = document.getElementById('repoModal');
    const modalTitle = document.getElementById('repoModalTitle');
    const githubLink = document.getElementById('githubRepoLink');
    const giteeLink = document.getElementById('giteeRepoLink');
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    modalTitle.textContent = `${project.name} - 选择代码仓库`;
    
    // Get the repository path
    const repoPath = repoPathMap[projectId] || projectId;
    
    // Set repository links
    githubLink.href = `https://github.com/zengweiying66/Mobile-Web/tree/main/${repoPath}`;
    giteeLink.href = `https://gitee.com/zxcvbnm668813/mobile-web/tree/master/${repoPath}`;
    
    modal.classList.add('show');
}

function closeRepoModal() {
    const modal = document.getElementById('repoModal');
    modal.classList.remove('show');
}

// Make functions global
window.viewCode = viewCode;
window.viewRepository = viewRepository;
window.closeRepoModal = closeRepoModal;
