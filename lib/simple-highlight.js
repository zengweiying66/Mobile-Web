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
    
    // Highlight comments
    code = code.replace(/(&lt;!--)(.*?)(--&gt;)/gs, '<span class="token comment">$1$2$3</span>');
    
    // Highlight DOCTYPE
    code = code.replace(/(&lt;!DOCTYPE[^&]*?&gt;)/gi, '<span class="token doctype">$1</span>');
    
    // Highlight complete tags with attributes
    code = code.replace(/(&lt;\/?)([\w-]+)((?:\s+[\w-]+(?:=(?:&quot;[^&]*?&quot;|"[^"]*?"))?)*\s*)(&gt;)/g, function(match, lt, tagName, attributes, gt) {
        let result = '<span class="token tag">' + lt + '<span class="token tag-name">' + tagName + '</span>';
        
        // Process attributes if present
        if (attributes.trim()) {
            // Match attribute name and value pairs
            result += attributes.replace(/([\w-]+)(?:=((?:&quot;|")([^"&]*?)(?:&quot;|")))?/g, function(attrMatch, attrName, fullValue, attrValue) {
                if (fullValue) {
                    // Attribute with value
                    return '<span class="token attr-name">' + attrName + '</span>=<span class="token attr-value">"' + attrValue + '"</span>';
                } else if (attrName.trim()) {
                    // Boolean attribute
                    return '<span class="token attr-name">' + attrName + '</span>';
                }
                return attrMatch;
            });
        }
        
        result += gt + '</span>';
        return result;
    });
    
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
