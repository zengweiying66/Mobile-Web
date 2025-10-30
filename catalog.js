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
        path: '8-1(1)/8-1(1)/zy.html',
        files: ['zy.html']
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
            <a href="${project.path}" class="project-link">
                打开项目 →
            </a>
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
    window.location.href = path;
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
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // 按 '/' 键聚焦搜索框
        if (e.key === '/' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // 按 ESC 清空搜索
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            searchInput.value = '';
            searchInput.blur();
            renderProjects();
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
