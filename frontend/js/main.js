// 全局变量 - 配置服务器URL (使用相对路径)
// 当前后端部署在同一域名和端口时，使用相对路径避免跨域问题
const API_BASE_URL = '';
let currentLogData = []; // 当前解码日志数据
let tokenizedSource = []; // 分词后的源语言文本
let tokenizedTarget = []; // 分词后的目标语言文本

// DOM元素
const sourceText = document.getElementById('sourceText');
const translateBtn = document.getElementById('translateBtn');
const resultContainer = document.getElementById('resultContainer');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const decodingVisualization = document.getElementById('decodingVisualization');
const sourceVisualization = document.getElementById('sourceVisualization');
const targetVisualization = document.getElementById('targetVisualization');
const decodingLogTable = document.getElementById('decodingLogTable');
const loadingIndicator = document.getElementById('loadingIndicator');

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', () => {
    // 翻译按钮点击事件
    translateBtn.addEventListener('click', handleTranslation);
    
    // 添加示例文本按钮功能
    addExampleTextButton();
});

// 创建一个添加示例文本按钮
function addExampleTextButton() {
    const exampleBtn = document.createElement('button');
    exampleBtn.textContent = '填充示例文本';
    exampleBtn.className = 'btn btn-outline-secondary ms-2';
    exampleBtn.addEventListener('click', () => {
        sourceText.value = 'This is a test sentence.';
    });
    translateBtn.after(exampleBtn);
}

// 处理翻译请求
async function handleTranslation() {
    const text = sourceText.value.trim();
    
    // 检查输入是否为空
    if (!text) {
        showAlert('请输入要翻译的文本', 'warning');
        return;
    }
    
    // 显示加载指示器
    showLoading(true);
    
    try {
        // 1. 调用翻译API
        console.log('开始翻译流程, 文本:', text);
        const translationResult = await translateText(text);
        console.log('翻译结果:', translationResult);
        
        // 2. 显示翻译结果
        displayTranslationResult(translationResult);
        
        // 3. 获取解码日志并可视化
        console.log('正在获取解码日志...');
        const decodingLog = await fetchDecodingLog();
        console.log('获取到解码日志:', decodingLog);
        
        if (decodingLog && decodingLog.log_data) {
            visualizeDecodingLog(decodingLog, translationResult);
        } else {
            showAlert('解码日志数据为空或格式不正确', 'warning');
        }
        
    } catch (error) {
        console.error('翻译处理出错:', error);
        showAlert(`翻译失败: ${error.message}`, 'danger');
    } finally {
        // 隐藏加载指示器
        showLoading(false);
    }
}

// 调用翻译API
async function translateText(text) {
    try {
        console.log(`发送翻译请求到 ${API_BASE_URL}/translate，文本: ${text}`);
        const response = await fetch(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        
        console.log('收到响应:', response.status, response.statusText);
        
        const responseData = await response.json();
        console.log('响应数据:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.error || `翻译请求失败: ${response.status} ${response.statusText}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('翻译API调用出错:', error.message, error.stack);
        throw new Error(`翻译失败: ${error.message}`);
    }
}

// 获取解码日志
async function fetchDecodingLog() {
    try {
        console.log(`获取解码日志: ${API_BASE_URL}/decoding_log`);
        const response = await fetch(`${API_BASE_URL}/decoding_log`);
        
        console.log('解码日志响应状态:', response.status);
        
        const responseData = await response.json();
        console.log('解码日志数据:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.error || `获取解码日志失败: ${response.status} ${response.statusText}`);
        }
        
        return responseData;
    } catch (error) {
        console.error('获取解码日志出错:', error.message, error.stack);
        throw new Error(`获取解码日志失败: ${error.message}`);
    }
}

// 显示翻译结果
function displayTranslationResult(result) {
    originalText.textContent = result.original_text;
    translatedText.textContent = result.translated_text;
    resultContainer.classList.remove('d-none');
    
    // 对源文本和翻译文本进行分词
    // 这里简单地以空格分词，实际应用中可能需要更复杂的分词处理
    tokenizedSource = result.original_text.split(/\s+/);
    tokenizedTarget = result.translated_text.split(/\s+/);
}

// 可视化解码日志
function visualizeDecodingLog(decodingLog, translationResult) {
    if (!decodingLog.log_data || decodingLog.log_data.length === 0) {
        showAlert('解码日志数据为空', 'warning');
        return;
    }
    
    console.log('原始解码日志数据:', decodingLog.log_data);
    
    // 过滤掉特殊标记如<s>、</s>
    const filteredLogData = decodingLog.log_data.filter(entry => 
        entry.source !== '<s>' && entry.source !== '</s>' && 
        entry.target !== '<s>' && entry.target !== '</s>');
    
    console.log('过滤后的日志数据:', filteredLogData);
    
    // 给日志数据增强处理
    const processedLogData = processLogDataWithMetadata(filteredLogData);
    
    // 保存处理后的日志数据到全局变量
    currentLogData = processedLogData;
    
    // 清空可视化区域
    sourceVisualization.innerHTML = '';
    targetVisualization.innerHTML = '';
    decodingLogTable.innerHTML = '';
    
    // 创建源文本和目标文本的可视化显示
    createSourceVisualization(processedLogData);
    createTargetVisualization(processedLogData);
    
    // 创建解码日志表格
    createDecodingLogTable(processedLogData);
    
    // 显示解码可视化区域
    decodingVisualization.classList.remove('d-none');
}

// 增强操作解码日志数据，处理重复短语和重叠源短语
// 为每个日志条目添加颜色和元数据
// 返回增强后的日志数据和每个源词的索引到日志条目的映射
// 处理互相重叠的短语
// 返回每个源词应该属于哪个条目的映射
function processLogDataWithMetadata(logData) {
    // 首先为每个日志条目分配一个唯一的颜色索引
    const processedData = logData.map((entry, index) => {
        return {
            ...entry,
            colorIndex: index % 10, // 使用10种颜色循环
            logIndex: index // 日志索引，帮助我们跟踪原始顺序
        };
    });

    // 处理每个条目，计算每个源词属于哪些日志条目
    // 这将含盛所有源词的信息，包括重复处理和重叠处理
    
    console.log('处理日志元数据和颜色映射');
    return processedData;
}

// 创建源文本可视化
function createSourceVisualization(logData) {
    // 清空源文本可视化容器
    sourceVisualization.innerHTML = '';
    
    console.log('开始创建源文本可视化，源词数量：', tokenizedSource.length);
    
    // 首先创建源词到日志条目的映射关系
    // 对于每个位置的源词，记录它属于哪些日志条目
    const wordToLogEntries = buildSourceWordMapping(logData);
    
    // 为每个源词创建可视化元素
    const wordSpans = [];
    
    // 创建源文本的可视化元素
    for (let i = 0; i < tokenizedSource.length; i++) {
        const word = tokenizedSource[i];
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.className = 'source-word';
        span.dataset.index = i;
        
        // 获取当前词索引对应的日志条目列表
        const entries = wordToLogEntries[i] || [];
        
        if (entries.length === 0) {
            // 没有匹配的日志条目，不高亮
            // 这表示这个词可能没有被翻译或被跳过
        } else if (entries.length === 1) {
            // 只有一个匹配的日志条目，直接使用其颜色
            const entry = entries[0];
            span.classList.add('highlight-text');
            span.classList.add(`highlight-color-${entry.colorIndex}`);
            span.dataset.logIndex = entry.logIndex;
            
            // 添加点击事件
            span.addEventListener('click', () => {
                highlightCorrespondingText(entry.logIndex);
            });
        } else {
            // 多个匹配的日志条目，这是重叠的情况
            // 我们使用一个特殊的多颜色样式或选最短的条目
            
            // 寻找最短的短语（通常更精确）
            const shortestEntry = findShortestPhraseEntry(entries);
            
            span.classList.add('highlight-text');
            span.classList.add('multi-match');
            span.classList.add(`highlight-color-${shortestEntry.colorIndex}`);
            span.dataset.logIndex = shortestEntry.logIndex;
            
            // 将所有匹配的条目 ID 存储在数据属性中
            span.dataset.allLogIndices = entries.map(e => e.logIndex).join(',');
            
            // 添加点击事件显示所有匹配项
            span.addEventListener('click', () => {
                highlightAllCorrespondingMatches(entries.map(e => e.logIndex));
            });
            
            // 添加一个特殊的边框或图案
            span.style.border = '2px dashed black';
            span.title = `多重匹配: ${entries.map(e => e.target).join(', ')}`;
        }
        
        wordSpans.push(span);
    }
    
    // 将词语添加到可视化容器
    wordSpans.forEach(span => {
        sourceVisualization.appendChild(span);
    });
    
    console.log('源文本可视化创建完成');
}

// 构建源词到日志条目的映射关系
function buildSourceWordMapping(logData) {
    const wordToLogEntries = [];
    
    // 初始化映射数组
    for (let i = 0; i < tokenizedSource.length; i++) {
        wordToLogEntries[i] = [];
    }
    
    // 遮盖每个日志条目，添加映射
    // 注意：解码日志中的索引从1开始，需要调整偏移量
    logData.forEach(entry => {
        const [startIdx, endIdx] = entry.span;
        
        // 将日志索引调整为0-based索引以匹配tokenizedSource
        const adjustedStartIdx = startIdx - 1; // 减1调整为0-based索引
        const adjustedEndIdx = endIdx - 1;   // 减1调整为0-based索引
        
        // 确保索引在有效范围内
        for (let i = adjustedStartIdx; i < adjustedEndIdx && i < tokenizedSource.length; i++) {
            // 确保索引不为负数
            if (i >= 0) {
                wordToLogEntries[i].push(entry);
            }
        }
    });
    
    console.log('调整偏移量后的源词映射:', wordToLogEntries);
    return wordToLogEntries;
}

// 找到最短的短语条目
// 当匹配多个短语时，我们优先选择最短的一个，它通常更精确
function findShortestPhraseEntry(entries) {
    if (!entries || entries.length === 0) return null;
    
    return entries.reduce((shortest, current) => {
        const currentLength = current.span[1] - current.span[0];
        const shortestLength = shortest.span[1] - shortest.span[0];
        return currentLength < shortestLength ? current : shortest;
    }, entries[0]);
}

// 创建目标文本可视化
function createTargetVisualization(logData) {
    // 清空目标文本可视化容器
    targetVisualization.innerHTML = '';
    
    console.log('开始创建目标文本可视化');
    
    // 处理每个日志条目的目标文本
    logData.forEach((entry) => {
        // 获取目标短语和日志索引
        const targetPhrase = entry.target;
        const logIndex = entry.logIndex;
        
        if (targetPhrase && targetPhrase.trim()) {
            // 创建一个包裹器来清晰地显示每个短语单元
            const phraseContainer = document.createElement('span');
            phraseContainer.className = 'target-phrase-container';
            
            // 将目标短语分词
            const words = targetPhrase.split(/\s+/);
            
            // 为每个目标词创建元素，使用与相应日志条目相同的颜色
            words.forEach(word => {
                if (word.trim() === '') return;
                
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.className = 'target-word highlight-text';
                // 使用entry的颜色索引，确保与源短语颜色对应
                span.classList.add(`highlight-color-${entry.colorIndex}`);
                span.dataset.logIndex = logIndex;
                
                // 添加点击事件
                span.addEventListener('click', () => {
                    highlightCorrespondingText(logIndex);
                });
                
                phraseContainer.appendChild(span);
            });
            
            // 将整个短语容器添加到目标可视化区域
            targetVisualization.appendChild(phraseContainer);
            
            // 添加小空格作为短语间的分隔符
            const spacer = document.createElement('span');
            spacer.innerHTML = '&nbsp;';
            targetVisualization.appendChild(spacer);
        }
    });
    
    console.log('目标文本可视化创建完成');
}

// 创建解码日志表格
function createDecodingLogTable(logData) {
    // 清空表格
    decodingLogTable.innerHTML = '';
    
    // 创建表头
    const tableHeader = document.createElement('tr');
    ['序号', '源文本位置', '源短语', '目标短语'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        tableHeader.appendChild(th);
    });
    decodingLogTable.appendChild(tableHeader);
    
    // 添加表行
    logData.forEach((entry) => {
        const row = document.createElement('tr');
        row.dataset.logIndex = entry.logIndex; // 使用entry的logIndex而不是循环索引
        
        // 添加与源和目标短语相同的颜色类
        row.classList.add(`highlight-table-row`);
        row.classList.add(`highlight-color-${entry.colorIndex}`);
        
        // 添加点击事件
        row.addEventListener('click', () => {
            highlightCorrespondingText(entry.logIndex);
        });
        
        // 序号单元格
        const indexCell = document.createElement('td');
        indexCell.textContent = entry.logIndex + 1; // 显示的序号从1开始
        row.appendChild(indexCell);
        
        // 源文本位置单元格
        const spanCell = document.createElement('td');
        spanCell.textContent = `[${entry.span[0]}, ${entry.span[1]})`;
        row.appendChild(spanCell);
        
        // 源短语单元格
        const sourceCell = document.createElement('td');
        sourceCell.textContent = entry.source;
        sourceCell.classList.add('source-phrase');
        row.appendChild(sourceCell);
        
        // 目标短语单元格
        const targetCell = document.createElement('td');
        targetCell.textContent = entry.target;
        targetCell.classList.add('target-phrase');
        row.appendChild(targetCell);
        
        decodingLogTable.appendChild(row);
    });
}

// 根据索引获取颜色名称（Bootstrap颜色变量）
function getColorNameByIndex(index) {
    const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 
                   'info', 'light', 'dark', 'primary', 'secondary'];
    return colors[index % colors.length];
}

// 我们不再需要这个功能，源文本高亮已经在createSourceVisualization中处理
function addHighlightInteraction(logData) {
    // 已经在createSourceVisualization和createTargetVisualization中实现
    return;
}

// 高亮显示对应文本
function highlightCorrespondingText(logIndex) {
    console.log(`高亮索引为 ${logIndex} 的元素`);
    
    // 重置所有元素的活动状态
    resetAllHighlights();
    
    // 高亮源文本中对应的词语
    document.querySelectorAll(`.source-word[data-log-index="${logIndex}"]`).forEach(word => {
        word.classList.add('active');
    });
    
    // 高亮目标文本中对应的词语
    document.querySelectorAll(`.highlight-text[data-log-index="${logIndex}"]`).forEach(word => {
        word.classList.add('active');
    });
    
    // 高亮解码日志表中对应的行
    const tableRow = document.querySelector(`#decodingLogTable tr[data-log-index="${logIndex}"]`);
    if (tableRow) {
        tableRow.classList.add('active');
        // 滚动到该行
        tableRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // 高亮目标文本中的对应词（也会滚动到该词）
    const targetWord = document.querySelector(`.highlight-text[data-log-index="${logIndex}"]`);
    if (targetWord) {
        targetWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 高亮显示多个匹配的文本 
// 当一个词属于多个短语时使用此函数
function highlightAllCorrespondingMatches(logIndices) {
    if (!logIndices || !logIndices.length) return;
    
    console.log(`高亮多个索引的元素: ${logIndices.join(', ')}`);
    
    // 重置所有元素的活动状态
    resetAllHighlights();
    
    // 高亮所有相关元素
    logIndices.forEach(logIndex => {
        // 高亮源文本
        document.querySelectorAll(`.source-word[data-log-index="${logIndex}"]`).forEach(word => {
            word.classList.add('active');
        });
        
        // 高亮目标文本
        document.querySelectorAll(`.highlight-text[data-log-index="${logIndex}"]`).forEach(word => {
            word.classList.add('active');
        });
        
        // 高亮表格行
        const tableRow = document.querySelector(`#decodingLogTable tr[data-log-index="${logIndex}"]`);
        if (tableRow) {
            tableRow.classList.add('active');
        }
    });
    
    // 滚动到第一个匹配的表格行
    if (logIndices.length > 0) {
        const firstTableRow = document.querySelector(`#decodingLogTable tr[data-log-index="${logIndices[0]}"]`);
        if (firstTableRow) {
            firstTableRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// 重置所有的高亮状态
function resetAllHighlights() {
    document.querySelectorAll('.source-word.active, .highlight-text.active, #decodingLogTable tr.active').forEach(el => {
        el.classList.remove('active');
    });
}

// 显示/隐藏加载指示器
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('d-none');
    } else {
        loadingIndicator.classList.add('d-none');
    }
}

// 显示警告/错误提示
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="关闭"></button>
    `;
    
    // 添加到页面
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, resultContainer);
    
    // 自动关闭
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}
