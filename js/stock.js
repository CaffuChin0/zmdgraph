// 库存页面数据
function renderStockPage() {
    const panel = document.querySelector('#page-stock .panel');
    if (!panel) return;
    // 清除原有表格和旧网格
    const oldGrid = document.getElementById('stockGrid');
    if (oldGrid) oldGrid.remove();
   
    // 创建网格容器
    const gridContainer = document.createElement('div');
    gridContainer.id = 'stockGrid';
    gridContainer.className = 'stock-grid';// 使用CSS类控制布局
    
    // 从 localStorage 加载库存数据
    const stockData = JSON.parse(localStorage.getItem('zmdgraph_stock') || '{}');

    MATERIAL_COLUMNS.forEach(mat => {
        const card = document.createElement('div');
        card.className = 'stock-card';

        // 图标和名称行
        const nameRow = document.createElement('div');
        nameRow.style.display = 'flex';
        nameRow.style.alignItems = 'center';
        nameRow.style.gap = '8px';
        nameRow.style.marginBottom = '6px';

        const icon = document.createElement('img');
        icon.src = MATERIAL_ICONS[mat] || DEFAULT_ICON;
        icon.style.width = '60px';
        icon.style.height = '60px';
        icon.style.objectFit = 'contain';
        nameRow.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = mat;
        nameSpan.style.fontWeight = '500';
        nameRow.appendChild(nameSpan);

        card.appendChild(nameRow);

        // 输入框或只读显示
        if (mat === "武器经验值" || mat === "作战记录经验值" || mat === "认知载体经验值") {
            const span = document.createElement('span');
            span.className = 'stock-value exp-text';
            span.dataset.material = mat;
            span.textContent = stockData[mat] || '0';
            card.appendChild(span);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = stockData[mat] || '0';
            input.className = 'stock-input stock-value';
            input.dataset.material = mat;

            let saveTimer = null; // 防抖定时器

            input.addEventListener('input', function() {
                // 1. 实时过滤非数字，只保留整数
                let raw = this.value.replace(/[^\d]/g, '');
                if (raw === '') raw = '0';
                let val = parseInt(raw, 10);
                if (isNaN(val)) val = 0;
                this.value = val;

                // 2. 实时更新经验值和缺少行（仅UI）
                const expMaterials = ["高级作战记录","中级作战记录","初级作战记录","高级认知载体","初级认知载体",
                                    "武器检查单元","武器检查装置","武器检查套组"];
                if (expMaterials.includes(mat)) {
                    updateExpValues();
                } else {
                    updateMissingRow();
                }

                // 3. 防抖保存：用户停止输入后 50ms 再保存
                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    if (_loading) return;
                    const finalVal = parseInt(this.value, 10);
                    if (!isNaN(finalVal)) {
                        // 同步培养表库存行
                        const planInput = document.querySelector(`#planTable .stock-input[data-material="${mat}"]`);
                        if (planInput) planInput.value = finalVal;
                        saveStockToStorage();
                        if (typeof refreshPlan === 'function') refreshPlan();
                    }
                    saveTimer = null;
                }, 50);
            });
            card.appendChild(input);
        }

        gridContainer.appendChild(card);
    });

    // 将网格容器插入面板（在保存按钮之前）
    const saveBtn = document.getElementById('saveStockBtn');
    panel.insertBefore(gridContainer, saveBtn);
}

function saveStockToStorage() {
    if (_loading) return;
    const stockInputs = document.querySelectorAll('.stock-input');
    const stockData = {};
    stockInputs.forEach(input => {
        const mat = input.dataset.material;
        if (mat) {
            let val = Number(input.value);
            if (isNaN(val)) val = 0;
            val = Math.floor(val);
            stockData[mat] = val;
            console.log(`保存 ${mat}: ${val}`); // 调试
        }
    });
    localStorage.setItem('zmdgraph_stock', JSON.stringify(stockData));
}

function loadStockFromStorage() {
    const stored = localStorage.getItem('zmdgraph_stock');
    if (!stored) return;
    _loading = true;
    try {
        const stockData = JSON.parse(stored);
        const stockInputs = document.querySelectorAll('.stock-input');
        stockInputs.forEach(input => {
            const mat = input.dataset.material;
            if (mat && stockData.hasOwnProperty(mat)) {
                let val = Number(stockData[mat]);
                if (isNaN(val)) val = 0;
                val = Math.floor(val);
                input.value = val;
                console.log(`加载 ${mat}: ${val}`);
            }
        });
        updateExpValues();
        updateMissingRow();
        refreshStockPage();
    } catch (e) {
        console.error('加载库存失败', e);
    } finally {
        _loading = false;
    }
}

function refreshStockPage() {
    const stockPage = document.getElementById('page-stock');
    if (stockPage && stockPage.classList.contains('active')) {
        renderStockPage();
    }
}

function initStock() {
    renderStockPage();
    document.getElementById('saveStockBtn')?.addEventListener('click', saveStockToStorage);
}