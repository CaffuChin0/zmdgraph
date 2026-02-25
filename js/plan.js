// 规划页面逻辑
function initPlan() {
    // 确保缺少行数据最新
    if (typeof updateMissingRow === 'function') {
        updateMissingRow();
    }
    renderPlanPage();
}

function renderPlanPage() {
    const panel = document.querySelector('#page-plan .panel');
    if (!panel) return;
    // 从缺少行获取缺少的材料数量
    const missing = getMissingMaterials();
    // 计算刷取次数
    const farmResults = calculateFarmTimes(missing);
    // 渲染结果
    displayPlanResults(farmResults, missing);
}

// 从缺少行单元格获取缺少的材料数量
function getMissingMaterials() {
    const missing = {};
    MATERIAL_COLUMNS.forEach(mat => missing[mat] = 0);
    document.querySelectorAll('#summaryRows .missing-value').forEach(td => {
        const mat = td.dataset.material;
        if (mat) {
            missing[mat] = parseFloat(td.textContent) || 0;
        }
    });
    return missing;
}

// 根据缺少数量计算各刷取项的次数
function calculateFarmTimes(needs) {
    return FARM_ITEMS.map(item => {
        let maxCount = 0;
        for (let [mat, per] of Object.entries(item.output)) {
            const need = needs[mat] || 0;
            if (need > 0) {
                const count = Math.ceil(need / per);
                if (count > maxCount) maxCount = count;
            }
        }
        return { ...item, count: maxCount };
    }).filter(item => item.count > 0);
}

function displayPlanResults(farmItems, needs) {
    const panel = document.querySelector('#page-plan .panel');
    let html = `
        <h2>规划 - 体力计算</h2>
    `;
    if (farmItems.length === 0) {
        html += '<p>缺少材料为0，无需刷取。</p>';
    } else {
        let totalStamina = 0;
        html += `
            <table class="plan-table">
                <thead>
                    <tr>
                        <th>刷取项</th>
                        <th>每次产出</th>
                        <th>所需次数</th>
                        <th>消耗体力</th>
                    </tr>
                </thead>
                <tbody>
        `;
        farmItems.forEach(item => {
            const stamina = item.count * 80;
            totalStamina += stamina;
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${Object.entries(item.output).map(([k,v]) => `${k}×${v}`).join(' + ')}</td>
                    <td>${item.count}</td>
                    <td>${stamina}</td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        // 读取每日体力上限
        const dailyStamina = parseInt(localStorage.getItem('zmdgraph_daily_stamina') || '200', 10);
        const days = Math.ceil(totalStamina / dailyStamina);
        html += `<p class="plan-summary">总体力需求：<strong>${totalStamina}</strong>，约需 <strong>${days}</strong> 天（每日 ${dailyStamina} 体力）。</p>`
    }
    panel.innerHTML = html;
}

// 刷新规划页面（直接重新渲染，不考虑页面是否激活）
function refreshPlan() {
    renderPlanPage();
}

// 监听页面切换，当规划页面激活时重新渲染
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#plan' || window.location.hash === '#plan/') {
        renderPlanPage();
    }
});