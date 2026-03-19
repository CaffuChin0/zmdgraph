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
    const allowBackward = document.getElementById('allowBackwardCheckbox')?.checked || false;
    // 计算刷取次数
    const farmResults = calculateFarmTimes(missing, allowBackward);
    // 渲染结果
    displayPlanResults(farmResults, missing);
}

// 从缺少行单元格获取缺少的材料数量
function getMissingMaterials() {
    const missing = {};
    MATERIAL_COLUMNS.forEach(mat => missing[mat] = 0);
    document.querySelectorAll('.missing-row td.missing-value').forEach(td => {
        const mat = td.dataset.material;
        if (mat) {
            missing[mat] = parseFloat(td.textContent) || 0;
        }
    });
    return missing;
}

// 根据缺少数量计算各刷取项的次数
function calculateFarmTimes(needs, allowBackward) {
    return FARM_ITEMS.map(item => {
        let maxCount = 0;

        // 处理干员经验（1~60级）
        if (item.name === "协议空间-干员经验（1~60级经验卡）") {
            const need = needs["高级作战记录"] || 0;
            if (need > 0) {
                maxCount = Math.ceil(need / 17);
            }
        }
        // 处理干员经验（61~90级）
        else if (item.name === "协议空间-干员经验（61~90级经验卡）") {
            const needHigh = needs["高级认知载体"] || 0;
            const needLow = needs["初级认知载体"] || 0;
            if (needHigh > 0 || needLow > 0) {
                if (allowBackward) {
                    // 允许反向代偿：解不等式求最小n
                    let n = 0;
                    const highPer = 6;
                    const lowPer = 8;
                    const rate = 10; // 反向代偿比例
                    while (true) {
                        n++;
                        if (highPer * n >= needHigh) {
                            const remainingHigh = highPer * n - needHigh;
                            const availableLowFromHigh = remainingHigh * rate;
                            const totalLow = lowPer * n + availableLowFromHigh;
                            if (totalLow >= needLow) {
                                break;
                            }
                        }
                    }
                    maxCount = n;
                } else {
                    // 不允许反向代偿，分别取最大值
                    const highCount = needHigh > 0 ? Math.ceil(needHigh / 6) : 0;
                    const lowCount = needLow > 0 ? Math.ceil(needLow / 8) : 0;
                    maxCount = Math.max(highCount, lowCount);
                }
            }
        }
        // 处理武器经验
        else if (item.name === "协议空间·武器经验") {
            const needHigh = needs["武器检查套组"] || 0;
            const needLow = needs["武器检查装置"] || 0;
            if (needHigh > 0 || needLow > 0) {
                if (allowBackward) {
                    let n = 0;
                    const highPer = 16;
                    const lowPer = 10;
                    const rate = 10;
                    while (true) {
                        n++;
                        if (highPer * n >= needHigh) {
                            const remainingHigh = highPer * n - needHigh;
                            const availableLowFromHigh = remainingHigh * rate;
                            const totalLow = lowPer * n + availableLowFromHigh;
                            if (totalLow >= needLow) {
                                break;
                            }
                        }
                    }
                    maxCount = n;
                } else {
                    const highCount = needHigh > 0 ? Math.ceil(needHigh / 16) : 0;
                    const lowCount = needLow > 0 ? Math.ceil(needLow / 10) : 0;
                    maxCount = Math.max(highCount, lowCount);
                }
            }
        }
        // 其他刷取项
        else {
            for (let [mat, per] of Object.entries(item.output)) {
                const need = needs[mat] || 0;
                if (need > 0) {
                    const count = Math.ceil(need / per);
                    if (count > maxCount) maxCount = count;
                }
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

    // 定义产出显示映射
    const outputDisplayMap = {
        "协议空间-干员经验（1~60级经验卡）": "高级作战记录×17",
        "协议空间-干员经验（61~90级经验卡）": "高级认知载体×6 + 初级认知载体×8",
        "协议空间·武器经验": "武器检查套组×16 + 武器检查装置×10"
    };

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

            // 判断是否有自定义显示
            let outputDisplay = outputDisplayMap[item.name];
            if (!outputDisplay) {
                // 默认拼接
                outputDisplay = Object.entries(item.output).map(([k, v]) => `${k}×${v}`).join(' + ');
            }

            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${outputDisplay}</td>
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