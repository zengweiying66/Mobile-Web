// Simple syntax highlighter
function highlightCode(code, language) {
    if (language === 'css') {
        return highlightCSS(code);
    } else if (language === 'javascript') {
        return highlightJS(code);
    } else {
        return highlightHTML(code);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightHTML(code) {
    code = escapeHtml(code);
    
    // Highlight HTML tags
    code = code.replace(/(&lt;\/?)([\w-]+)/g, '<span class="token tag">$1<span class="token tag-name">$2</span>');
    code = code.replace(/(&gt;)/g, '</span>$1');
    
    // Highlight attributes
    code = code.replace(/([\w-]+)(=)/g, '<span class="token attr-name">$1</span>$2');
    
    // Highlight attribute values
    code = code.replace(/=(&quot;|")([^"]*?)(&quot;|")/g, '=<span class="token attr-value">"$2"</span>');
    
    // Highlight comments
    code = code.replace(/(&lt;!--)(.*?)(--&gt;)/g, '<span class="token comment">$1$2$3</span>');
    
    return code;
}

function highlightCSS(code) {
    code = escapeHtml(code);
    
    // Highlight selectors
    code = code.replace(/^([\w\s\.\#\[\],:>+~-]+)(\{)/gm, '<span class="token selector">$1</span>$2');
    
    // Highlight properties
    code = code.replace(/([\w-]+)(\s*:)/g, '<span class="token property">$1</span>$2');
    
    // Highlight values
    code = code.replace(/:\s*([^;]+)(;|$)/g, ': <span class="token value">$1</span>$2');
    
    // Highlight comments
    code = code.replace(/(\/\*)(.*?)(\*\/)/gs, '<span class="token comment">$1$2$3</span>');
    
    return code;
}

function highlightJS(code) {
    code = escapeHtml(code);
    
    // Highlight keywords
    const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'from', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw'];
    keywords.forEach(keyword => {
        code = code.replace(new RegExp(`\\b(${keyword})\\b`, 'g'), '<span class="token keyword">$1</span>');
    });
    
    // Highlight strings
    code = code.replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<span class="token string">$1</span>');
    
    // Highlight comments
    code = code.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
    
    // Highlight numbers
    code = code.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');
    
    // Highlight functions
    code = code.replace(/\b(\w+)(\()/g, '<span class="token function">$1</span>$2');
    
    return code;
}

window.highlightCode = highlightCode;
