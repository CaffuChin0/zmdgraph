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
        icon.style.width = '24px';
        icon.style.height = '24px';
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
            input.type = 'number';
            input.value = stockData[mat] || '0';
            input.min = '0';
            input.className = 'stock-input stock-value';
            input.dataset.material = mat;
            input.addEventListener('input', function() {
                if (_loading) return;
                let val = parseInt(this.value, 10);
                if (isNaN(val)) {
                    this.value = 0;
                } else {
                    const min = parseInt(this.min, 10);
                    if (val < min) this.value = min;
                }
                // 同步培养表库存输入框
                const planInput = document.querySelector(`#planTable .stock-input[data-material="${mat}"]`);
                if (planInput) {
                    planInput.value = this.value;
                }
                const expMaterials = ["高级作战记录","中级作战记录","初级作战记录","高级认知载体","初级认知载体",
                                    "武器检查单元","武器检查装置","武器检查套组"];
                if (expMaterials.includes(mat)) {
                    updateExpValues();
                } else {
                    updateMissingRow();
                }
                saveStockToStorage();
                if (typeof refreshPlan === 'function') {
                    refreshPlan();
                }
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
        if (mat) stockData[mat] = input.value;
    });
    localStorage.setItem('zmdgraph_stock', JSON.stringify(stockData));
}

function loadStockFromStorage() {
    const stored = localStorage.getItem('zmdgraph_stock');
    if (!stored) return;
    _loading = true;
    const stockData = JSON.parse(stored);
    const stockInputs = document.querySelectorAll('.stock-input');
    stockInputs.forEach(input => {
        const mat = input.dataset.material;
        if (mat && stockData.hasOwnProperty(mat)) {
            input.value = stockData[mat];
        }
    });
    updateExpValues();
    updateMissingRow();
    _loading = false;
    refreshStockPage();
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