// 规划页面逻辑
function initPlan() {
    renderPlanPage();
}

function renderPlanPage() {
    const panel = document.querySelector('#page-plan .panel');
    if (!panel) return;
    // 计算总材料需求
    const totals = calculateTotalMaterials();
    // 计算刷取次数
    const farmResults = calculateFarmTimes(totals);
    // 渲染结果
    displayPlanResults(farmResults, totals);
}

// 从 planRows 计算所有材料总和
function calculateTotalMaterials() {
    const totals = {};
    MATERIAL_COLUMNS.forEach(mat => totals[mat] = 0);
    planRows.forEach(row => {
        const mats = row.materials;
        MATERIAL_COLUMNS.forEach(mat => {
            totals[mat] += mats[mat] || 0;
        });
    });
    return totals;
}

// 根据需求计算各刷取项的次数
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
    }).filter(item => item.count > 0); // 只保留有需求的项
}

function displayPlanResults(farmItems, totals) {
    const panel = document.querySelector('#page-plan .panel');
    let html = `
        <h2>规划 - 体力计算</h2>
    `;
    if (farmItems.length === 0) {
        html += '<p>培养表暂无计划，请先添加计划行。</p>';
    } else {
        let totalStamina = 0;
        html += `
            <table class="plan-table">
                <thead>
                    <tr>
                        <th>刷取关卡</th>
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
        const days = Math.ceil(totalStamina / 200);
        html += `<p class="plan-summary">总体力需求：<strong>${totalStamina}</strong>，约需 <strong>${days}</strong> 天（每天200体力）。</p>`;
    }
    panel.innerHTML = html;
}