// 库存页面数据
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
}

function renderStockPage() {
}

function initStock() {
    document.getElementById('saveStockBtn')?.addEventListener('click', saveStockToStorage);
    // 加载库存数据
}