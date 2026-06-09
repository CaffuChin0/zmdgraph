// 培养表页面数据

let isEditing = false;

function getActualProject(displayProject) {
    if (displayProject.includes('角色等级-升级')) return '角色等级-升级';
    if (displayProject.includes('精英阶段')) return '精英阶段';
    if (displayProject.includes('装备适配')) return '装备适配';
    return displayProject;
}

function toggleEditMode() {
    const tbody = document.getElementById('planBody');
    const rows = Array.from(tbody.children);
    if (!isEditing) {
        // 进入编辑模式
        isEditing = true;
        document.getElementById('addRowBtn').textContent = '💾 保存修改';
        document.getElementById('refreshPlansBtn').disabled = true;
        document.getElementById('removeAllBtn').disabled = true;
        rows.forEach(row => {
            const removeBtn = row.cells[1]?.querySelector('button');
            const completeBtn = row.cells[2]?.querySelector('button');
            const hideChk = row.cells[3]?.querySelector('input[type="checkbox"]');
            if (removeBtn) removeBtn.disabled = true;
            if (completeBtn) completeBtn.disabled = true;
            if (hideChk) hideChk.disabled = true;
        });
        rows.forEach((row, index) => {
            const curCell = row.cells[6];
            const tarCell = row.cells[7];
            const project = row.cells[5].textContent;
            // 读取当前等级
            const curVal = planRows[index].现等级;
            const tarVal = planRows[index].目标等级;
            let maxVal = 90;
            if (project.includes('技能') || project.includes('skill')) maxVal = 12;
            else if (project.includes('精英阶段')) maxVal = 4;
            else if (project.includes('装备适配')) maxVal = 3;
            else if (project.includes('天赋') || project.includes('基建') || project.includes('信赖')) maxVal = 4;

            const curInput = document.createElement('input');
            curInput.type = 'number';
            curInput.value = curVal;
            curInput.min = 0;
            curInput.max = maxVal;
            curInput.classList.add('edit-cur');
            curInput.style.width = '60px';
            curInput.style.boxSizing = 'border-box';
            curInput.style.padding = '4px';
            curInput.style.textAlign = 'center';
            curInput.addEventListener('blur', function() {
                let val = parseInt(this.value, 10);
                if (isNaN(val)) this.value = this.min;
                else if (val < this.min) this.value = this.min;
                else if (val > this.max) this.value = this.max;
            });
            curCell.innerHTML = '';
            curCell.appendChild(curInput);

            const tarInput = document.createElement('input');
            tarInput.type = 'number';
            tarInput.value = tarVal;
            tarInput.min = 0;
            tarInput.max = maxVal;
            tarInput.classList.add('edit-tar');
            tarInput.style.width = '60px';
            tarInput.style.boxSizing = 'border-box';
            tarInput.style.padding = '4px';
            tarInput.style.textAlign = 'center';
            tarInput.addEventListener('blur', function() {
                let val = parseInt(this.value, 10);
                if (isNaN(val)) this.value = this.min;
                else if (val < this.min) this.value = this.min;
                else if (val > this.max) this.value = this.max;
            });
            tarCell.innerHTML = '';
            tarCell.appendChild(tarInput);
        });
    } else {
        // 保存修改
        const newCurValues = [];
        const newTarValues = [];
        let hasInvalid = false;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const curInput = row.cells[6].querySelector('input.edit-cur');
            const tarInput = row.cells[7].querySelector('input.edit-tar');
            if (curInput && tarInput) {
                let newCur = parseInt(curInput.value, 10) || 0;
                let newTar = parseInt(tarInput.value, 10) || 0;
                // 钳位
                const project = row.cells[5].textContent;
                let minVal = 0, maxVal = 90;
                if (project.includes('等级') && (project.includes('角色') || project === '角色等级-升级')) {
                    minVal = 1;
                    maxVal = 90;
                } else if (project.includes('技能') || project.includes('战技') || project.includes('普攻') || 
                           project.includes('连携') || project.includes('大招') || project.includes('skill')) {
                    minVal = 1;
                    maxVal = 12;
                } else if (project.includes('精英阶段')) {
                    minVal = 0;
                    maxVal = 4;
                } else if (project.includes('装备适配')) {
                    minVal = 0;
                    maxVal = 3;
                } else if (project.includes('天赋') || project.includes('基建') || project.includes('信赖')) {
                    minVal = 0;
                    maxVal = 4;
                } else if (project.includes('武器突破')) {
                    minVal = 0;
                    maxVal = 4;
                } else if (project.includes('武器等级')) {
                    minVal = 1;
                    maxVal = 90;
                }
                newCur = Math.min(Math.max(newCur, minVal), maxVal);
                newTar = Math.min(Math.max(newTar, minVal), maxVal);
                if (newCur >= newTar) {
                    alert(`第 ${i+1} 行：现等级 ${newCur} 不能大于或等于目标等级 ${newTar}，请修改后重新保存。`);
                    hasInvalid = true;
                    break;
                }
                newCurValues[i] = newCur;
                newTarValues[i] = newTar;
            } else {
                newCurValues[i] = planRows[i].现等级;
                newTarValues[i] = planRows[i].目标等级;
            }
        }
        if (hasInvalid) return;

        // 更新
        for (let i = 0; i < planRows.length; i++) {
            const oldRow = planRows[i];
            const newCur = newCurValues[i];
            const newTar = newTarValues[i];
            if (newCur === undefined || newTar === undefined) continue;

            oldRow.现等级 = newCur;
            oldRow.目标等级 = newTar;

            // 重新计算材料
            let newMaterials = null;
            const project = oldRow.项目;
            if (project.includes('武器突破')) {
                // 调用武器突破计算函数
                newMaterials = calculateWeaponBreakMaterials(oldRow.干员, newCur, newTar);
            } else if (project.includes('武器等级')) {
                // 调用武器升级计算函数
                const levelResult = calculateWeaponLevelMaterials(newCur, newTar);
                if (levelResult) {
                    const expMats = convertExpToMaterials(levelResult.武器经验值);
                    newMaterials = {
                        ...expMats,
                        折金票: levelResult.折金票,
                        武器经验值: levelResult.武器经验值
                    };
                }
            } else if (project.includes('装备适配')) {
                // 装备适配
                let totalTicket = 0;
                for (let lv = newCur; lv < newTar; lv++) {
                    const row = DATABASE.find(r => 
                        (r.干员 === "" || r.干员 === "通用") &&
                        r.升级项目 === "装备适配" &&
                        r.现等级 === lv &&
                        r.目标等级 === lv + 1
                    );
                    if (row && row.折金票) totalTicket += row.折金票;
                }
                newMaterials = { 折金票: totalTicket };
                MATERIAL_COLUMNS.forEach(mat => {
                    if (newMaterials[mat] === undefined) newMaterials[mat] = 0;
                });
            } else {
                const actualProject = getActualProject(project);
                if (actualProject === '角色等级-升级') {
                    newMaterials = calculateLevelMaterials(oldRow.干员, newCur, newTar);
                } else {
                    // 提取技能名
                    let skillName = project;
                    const arrowIdx = skillName.indexOf('→');
                    if (arrowIdx !== -1) {
                        skillName = skillName.substring(0, arrowIdx).trim();
                        const parts = skillName.split(' ');
                        if (parts.length > 0 && !isNaN(parts[parts.length-1])) {
                            skillName = parts.slice(0, -1).join(' ');
                        }
                    }
                    newMaterials = calculateMaterials(oldRow.干员, skillName, newCur, newTar);
                }
            }
            if (newMaterials) {
                oldRow.materials = newMaterials;
            } else {
                console.warn(`材料计算失败: ${oldRow.干员} ${project} ${newCur}→${newTar}`);
            }

            // 重新生成名称
            let newProject;
            if (project.includes('武器突破')) {
                newProject = `武器突破 ${newCur}→${newTar}`;
            } else if (project.includes('武器等级')) {
                newProject = `武器等级 ${newCur}→${newTar}`;
            } else {
                const actualProject = getActualProject(project);
                if (actualProject === '角色等级-升级') {
                    newProject = `角色等级-升级 ${newCur}→${newTar}`;
                } else if (actualProject === '精英阶段') {
                    newProject = `精英阶段 ${newCur}→${newTar}`;
                } else if (actualProject === '装备适配') {
                    const fromColor = mapAdaptLevelToColor(newCur);
                    const toColor = mapAdaptLevelToColor(newTar);
                    newProject = `装备适配 ${fromColor}→${toColor}`;
                } else {
                    let baseName = project;
                    const arrowIdx = baseName.indexOf('→');
                    if (arrowIdx !== -1) {
                        baseName = baseName.substring(0, arrowIdx).trim();
                        const parts = baseName.split(' ');
                        if (parts.length > 0 && !isNaN(parts[parts.length-1])) {
                            baseName = parts.slice(0, -1).join(' ');
                        }
                    }
                    newProject = `${baseName} ${newCur}→${newTar}`;
                }
            }
            oldRow.项目 = newProject;
        }

        // 更新显示
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowData = planRows[i];
            for (let j = 0; j < MATERIAL_COLUMNS.length; j++) {
                const cell = row.cells[8 + j];
                if (cell) {
                    cell.textContent = rowData.materials[MATERIAL_COLUMNS[j]] || 0;
                }
            }
            row.cells[6].textContent = rowData.现等级;
            row.cells[7].textContent = rowData.目标等级;
            const project = rowData.项目;
            if (project.includes('→')) {
                const lastArrowIndex = project.lastIndexOf('→');
                let splitIndex = -1;
                for (let k = lastArrowIndex; k >= 0; k--) {
                    if (project[k] === ' ' || project[k] === '(') {
                        splitIndex = k;
                        break;
                    }
                }
                if (splitIndex !== -1) {
                    const name = project.substring(0, splitIndex).trim();
                    const level = project.substring(splitIndex).trim();
                    row.cells[5].innerHTML = `<div>${name}</div><div>${level}</div>`;
                } else {
                    const parts = project.split(' ');
                    if (parts.length > 1) {
                        const level = parts.pop();
                        const name = parts.join(' ');
                        row.cells[5].innerHTML = `<div>${name}</div><div>${level}</div>`;
                    } else {
                        row.cells[5].textContent = project;
                    }
                }
            } else {
                row.cells[5].textContent = project;
            }
        }

        // 退出编辑模式
        isEditing = false;
        document.getElementById('addRowBtn').textContent = '✏️ 编辑计划';
        document.getElementById('refreshPlansBtn').disabled = false;
        document.getElementById('removeAllBtn').disabled = false;

        updateSummaryRows();
        savePlansToStorage();
        if (typeof refreshPlan === 'function') refreshPlan();
    }
}

// 正向代偿规则：低级→高级
const FORWARD_RULES = [
    { low: "初级认知载体", high: "高级认知载体", rate: 10 },
    { low: "初级作战记录", high: "中级作战记录", rate: 5 },
    { low: "中级作战记录", high: "高级作战记录", rate: 10 },
    { low: "武器检查单元", high: "武器检查装置", rate: 5 },
    { low: "武器检查装置", high: "武器检查套组", rate: 10 }
];

// 反向代偿规则：高级→低级（仅在库存富余时使用）
const BACKWARD_RULES = [
    { high: "高级认知载体", low: "初级认知载体", rate: 10 },
    { high: "高级作战记录", low: "中级作战记录", rate: 10 },
    { high: "高级作战记录", low: "初级作战记录", rate: 50 },
    { high: "中级作战记录", low: "初级作战记录", rate: 5 },
    { high: "武器检查套组", low: "武器检查装置", rate: 10 },
    { high: "武器检查装置", low: "武器检查单元", rate: 5 }
];

// 动态生成表头（包含图标）
function renderTableHeader() {
    const theadRow = document.querySelector('#planTable thead tr');
    MATERIAL_COLUMNS.forEach(mat => {
        const th = document.createElement('th');
        th.setAttribute('data-material', mat);

        // 改为两行显示：图标在上，文字在下
        th.innerHTML = `<img src="${MATERIAL_ICONS[mat] || DEFAULT_ICON}" style="width:20px;height:20px;display:block;margin:0 auto 4px;"><span>${mat}</span>`;
        theadRow.appendChild(th);
    });
}

// 创建汇总行（插入到 thead 中）
function createSummaryRows() {
    const planTable = document.getElementById('planTable');
    const oldSummary = document.getElementById('summaryRows');
    if (oldSummary) oldSummary.remove();

    const thead = planTable.querySelector('thead');

    // 库存行
    const stockRow = document.createElement('tr');
    stockRow.className = 'inventory-row summary-row';
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        if (i === 0) td.textContent = '库存';
        stockRow.appendChild(td);
    }
    for (let i = 0; i < 4; i++) stockRow.appendChild(document.createElement('td'));

    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        if (mat === "武器经验值" || mat === "作战记录经验值" || mat === "认知载体经验值") {
            const span = document.createElement('span');
            span.className = 'stock-value exp-display';
            span.dataset.material = mat;
            span.textContent = '0';
            td.appendChild(span);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.inputMode = 'numeric';
            input.value = '0';
            input.min = '0';
            input.className = 'stock-input stock-value';
            input.dataset.material = mat;

            let saveTimer = null;

            input.addEventListener('input', function() {
                let raw = this.value.replace(/[^\d]/g, '');
                if (raw === '') raw = '0';
                let val = parseInt(raw, 10);
                if (isNaN(val)) val = 0;
                const min = parseInt(this.min, 10);
                if (!isNaN(min) && val < min) val = min;
                this.value = val;

                const expMaterials = ["高级作战记录","中级作战记录","初级作战记录","高级认知载体","初级认知载体",
                                    "武器检查单元","武器检查装置","武器检查套组"];
                if (expMaterials.includes(mat)) {
                    updateExpValues();
                } else {
                    updateMissingRow();
                }

                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    if (_loading) return;
                    const finalVal = parseInt(this.value, 10);
                    if (!isNaN(finalVal)) {
                        const stockInput = document.querySelector(`#page-stock .stock-input[data-material="${mat}"]`);
                        if (stockInput) stockInput.value = finalVal;
                        saveStockToStorage();
                        if (typeof refreshPlan === 'function') refreshPlan();
                    }
                    saveTimer = null;
                }, 50);
            });
            td.appendChild(input);
        }
        stockRow.appendChild(td);
    });
    thead.appendChild(stockRow);

    // 缺少行
    const missingRow = document.createElement('tr');
    missingRow.className = 'missing-row summary-row';
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        if (i === 0) td.textContent = '缺少';
        missingRow.appendChild(td);
    }
    for (let i = 0; i < 4; i++) missingRow.appendChild(document.createElement('td'));
    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        td.className = 'missing-value';
        td.dataset.material = mat;
        td.textContent = '0';
        missingRow.appendChild(td);
    });
    thead.appendChild(missingRow);

    // 合计行
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row summary-row';
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        if (i === 0) td.textContent = '合计';
        totalRow.appendChild(td);
    }
    for (let i = 0; i < 4; i++) totalRow.appendChild(document.createElement('td'));
    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        td.className = 'total-value';
        td.dataset.material = mat;
        td.textContent = '0';
        totalRow.appendChild(td);
    });
    thead.appendChild(totalRow);
}

// 更新合计行和缺少行
function updateSummaryRows() {
    const totals = {};
    MATERIAL_COLUMNS.forEach(mat => totals[mat] = 0);

    const rows = document.querySelectorAll('#planBody tr');
    rows.forEach(row => {
        const hideChk = row.querySelector('.hide-checkbox');
        const completeChk = row.querySelector('.complete-checkbox');
        if ((hideChk && hideChk.checked) || (completeChk && completeChk.checked)) return;

        MATERIAL_COLUMNS.forEach((mat, idx) => {
            const cell = row.cells[8 + idx];
            if (cell) {
                const val = parseFloat(cell.textContent) || 0;
                totals[mat] += val;
            }
        });
    });

    MATERIAL_COLUMNS.forEach(mat => {
        const cell = document.querySelector(`.total-value[data-material="${mat}"]`);
        if (cell) cell.textContent = totals[mat];
    });

    updateMissingRow();
    hideZeroColumns();
}

// 根据经验卡库存更新经验值显示
function updateExpValues() {
    const 高级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="高级作战记录"]')?.value) || 0;
    const 中级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="中级作战记录"]')?.value) || 0;
    const 初级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="初级作战记录"]')?.value) || 0;
    const 作战记录经验值 = 高级作战记录 * 10000 + 中级作战记录 * 1000 + 初级作战记录 * 200;
    document.querySelectorAll('.stock-value[data-material="作战记录经验值"]').forEach(span => {
        span.textContent = 作战记录经验值;
    });

    const 高级认知载体 = parseFloat(document.querySelector('.stock-input[data-material="高级认知载体"]')?.value) || 0;
    const 初级认知载体 = parseFloat(document.querySelector('.stock-input[data-material="初级认知载体"]')?.value) || 0;
    const 认知载体经验值 = 高级认知载体 * 10000 + 初级认知载体 * 1000;
    document.querySelectorAll('.stock-value[data-material="认知载体经验值"]').forEach(span => {
        span.textContent = 认知载体经验值;
    });

    const 武器检查单元 = parseFloat(document.querySelector('.stock-input[data-material="武器检查单元"]')?.value) || 0;
    const 武器检查装置 = parseFloat(document.querySelector('.stock-input[data-material="武器检查装置"]')?.value) || 0;
    const 武器检查套组 = parseFloat(document.querySelector('.stock-input[data-material="武器检查套组"]')?.value) || 0;
    const 武器经验值 = 武器检查套组 * 10000 + 武器检查装置 * 1000 + 武器检查单元 * 200;
    document.querySelectorAll('.stock-value[data-material="武器经验值"]').forEach(span => {
        span.textContent = 武器经验值;
    });

    updateMissingRow();
}

// 根据需求和库存，考虑低级材料代偿高级材料，计算最终缺少数量
function calculateNetMissing(demand, stock) {
    // 复制需求作为初始缺少
    let missing = { ...demand };
    // 复制剩余库存，用于代偿和直接抵扣
    let remaining = { ...stock };

    // 低级材料代偿高级材料
    COMPENSATION_RULES.forEach(rule => {
        const { low, high, lowPerHigh } = rule;
        const needHigh = missing[high] || 0;
        if (needHigh <= 0) return;
        const haveLow = remaining[low] || 0;
        if (haveLow <= 0) return;

        // 可代偿高级的数量 = min(需要的高级数, floor(低级库存 / 合成率))
        const compensateHigh = Math.min(needHigh, Math.floor(haveLow / lowPerHigh));
        if (compensateHigh > 0) {
            missing[high] -= compensateHigh;
            remaining[low] -= compensateHigh * lowPerHigh;
        }
    });

    // 剩余库存直接抵扣对应材料
    MATERIAL_COLUMNS.forEach(mat => {
        if (missing[mat] > 0 && remaining[mat] > 0) {
            const use = Math.min(missing[mat], remaining[mat]);
            missing[mat] -= use;
            remaining[mat] -= use;
        }
    });

    // 确保所有缺少非负
    MATERIAL_COLUMNS.forEach(mat => {
        if (missing[mat] < 0) missing[mat] = 0;
    });

    return missing;
}

// 行级双向代偿计算
function calculateRowNetDemand(rowMaterials, remainingStock, allowBackward) {
    let netDemand = { ...rowMaterials };
    let stock = { ...remainingStock };

    // 1. 直接抵扣
    MATERIAL_COLUMNS.forEach(mat => {
        const need = netDemand[mat] || 0;
        if (need > 0 && stock[mat] > 0) {
            const use = Math.min(need, stock[mat]);
            stock[mat] -= use;
            netDemand[mat] -= use;
        }
    });

    // 2. 正向代偿（低级→高级）
    FORWARD_RULES.forEach(({ low, high, rate }) => {
        let needHigh = netDemand[high] || 0;
        if (needHigh <= 0) return;
        let haveLow = stock[low] || 0;
        if (haveLow <= 0) return;
        const maxSynth = Math.floor(haveLow / rate);
        const synth = Math.min(needHigh, maxSynth);
        if (synth > 0) {
            netDemand[high] -= synth;
            stock[low] -= synth * rate;
        }
    });

    // 3. 反向代偿（高级→低级），仅当允许时执行
    if (allowBackward) {
        BACKWARD_RULES.forEach(({ high, low, rate }) => {
            // 先检查高级是否已满足（即 netDemand[high] 可能已归零或仍有需求）
            let needHigh = netDemand[high] || 0;
            let haveHigh = stock[high] || 0;
            // 计算真正可用于代偿的高级数量：库存减去该行所需高级后剩余的部分
            let extraHigh = haveHigh - needHigh;
            if (extraHigh <= 0) return; // 没有多余高级，不进行反向代偿

            let needLow = netDemand[low] || 0;
            if (needLow <= 0) return;

            // 多余高级可代偿的低级数量 = extraHigh * rate
            const maxProvide = extraHigh * rate;
            const provide = Math.min(needLow, maxProvide);
            if (provide > 0) {
                const consumeHigh = Math.ceil(provide / rate); // 实际消耗的高级数
                netDemand[low] -= provide;
                stock[high] -= consumeHigh; // 从库存中消耗这些高级
                // 注意：这里没有修改 netDemand[high]，因为高级已经满足，消耗的是多余部分
            }
        });
    }

    // 4. 再次直接抵扣（安全处理）
    MATERIAL_COLUMNS.forEach(mat => {
        const need = netDemand[mat] || 0;
        if (need > 0 && stock[mat] > 0) {
            const use = Math.min(need, stock[mat]);
            stock[mat] -= use;
            netDemand[mat] -= use;
        }
    });

    // 更新剩余库存
    Object.keys(stock).forEach(mat => {
        remainingStock[mat] = stock[mat];
    });

    // 确保非负
    MATERIAL_COLUMNS.forEach(mat => {
        if (netDemand[mat] < 0) netDemand[mat] = 0;
    });

    return netDemand;
}

// 更新缺少材料汇总面板
function updateMissingSummary() {
    const panel = document.getElementById('missingSummaryPanel');
    const contentDiv = document.getElementById('missingSummaryContent');
    if (!panel || !contentDiv) return;

    // 从缺少行获取数据
    const missingItems = [];
    MATERIAL_COLUMNS.forEach(mat => {
        const cell = document.querySelector(`.missing-value[data-material="${mat}"]`);
        if (cell) {
            const val = parseFloat(cell.textContent) || 0;
            if (val > 0) {
                missingItems.push({ mat, val });
            }
        }
    });

    if (missingItems.length === 0) {
        panel.style.display = 'none';
        return;
    }

    // 生成内容
    let html = '';
    missingItems.forEach(item => {
        html += `<div class="missing-summary-item">
            <img src="${MATERIAL_ICONS[item.mat] || DEFAULT_ICON}" alt="${item.mat}">
            <span>${item.mat} ×${item.val}</span>
        </div>`;
    });
    contentDiv.innerHTML = html;
    panel.style.display = 'block';
}

function updateMissingRow() {
    const allowBackward = document.getElementById('allowBackwardCheckbox')?.checked || false;

    // 获取当前库存
    const stocks = {};
    MATERIAL_COLUMNS.forEach(mat => {
        const stockElement = document.querySelector(`.stock-value[data-material="${mat}"]`);
        if (stockElement) {
            if (stockElement.tagName === 'INPUT') {
                stocks[mat] = parseFloat(stockElement.value) || 0;
            } else {
                stocks[mat] = parseFloat(stockElement.textContent) || 0;
            }
        } else {
            stocks[mat] = 0;
        }
    });

    // 复制一份库存用于逐行消耗
    let remaining = { ...stocks };

    // 初始化总净需求
    const totalNetMissing = {};
    MATERIAL_COLUMNS.forEach(mat => totalNetMissing[mat] = 0);

    // 遍历所有未隐藏的计划行（按顺序）
    planRows.forEach(row => {
        if (row.hidden) return;
        const rowNet = calculateRowNetDemand(row.materials, remaining, allowBackward);
        MATERIAL_COLUMNS.forEach(mat => {
            totalNetMissing[mat] += rowNet[mat] || 0;
        });
    });

    // 更新缺少行单元格
    MATERIAL_COLUMNS.forEach(mat => {
        const missingCell = document.querySelector(`.missing-value[data-material="${mat}"]`);
        if (missingCell) missingCell.textContent = totalNetMissing[mat] || 0;
    });

    updateMissingSummary();
}

// 添加计划行
function addPlanRow(operator, project, curLv, tarLv, materialObj, skipSave = false, hidden = false, skipPush = false, skipUpdate = false) {
    const tbody = document.getElementById('planBody');
    const row = document.createElement('tr');

    // 头像列
    const tdAvatar = document.createElement('td');
    const avatarImg = document.createElement('img');
    avatarImg.style.maxWidth = '50px';
    avatarImg.style.maxHeight = '50px';
    avatarImg.src = WEAPON_AVATARS[operator] || OPERATOR_AVATARS[operator] || DEFAULT_AVATAR;
    tdAvatar.appendChild(avatarImg);
    row.appendChild(tdAvatar);

    // 移除列
    const tdRemove = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '移除';
    removeBtn.style.backgroundColor = '#dc3545';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.padding = '4px 8px';
    removeBtn.style.borderRadius = '4px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.onclick = function() {
        const index = Array.from(tbody.children).indexOf(row);
        if (index !== -1) {
            planRows.splice(index, 1);
            tbody.removeChild(row);
            updateSummaryRows();
            savePlansToStorage();
            if (typeof refreshPlan === 'function') refreshPlan();
        }
    };
    tdRemove.appendChild(removeBtn);
    row.appendChild(tdRemove);

    // 完成列
    const tdDone = document.createElement('td');
    const completeBtn = document.createElement('button');
    completeBtn.textContent = '完成';
    completeBtn.style.backgroundColor = '#28a745';
    completeBtn.style.color = 'white';
    completeBtn.style.border = 'none';
    completeBtn.style.padding = '4px 8px';
    completeBtn.style.borderRadius = '4px';
    completeBtn.style.cursor = 'pointer';
    completeBtn.onclick = function() {
        const index = Array.from(tbody.children).indexOf(row);
        if (index !== -1) {
            const plan = planRows[index];
            // 扣除库存
            MATERIAL_COLUMNS.forEach(mat => {
                const amount = plan.materials[mat] || 0;
                if (amount > 0) {
                    // 找到培养表库存行中对应的输入框
                    const stockInput = document.querySelector(`.inventory-row .stock-input[data-material="${mat}"]`);
                    if (stockInput) {
                        let currentStock = parseInt(stockInput.value, 10) || 0;
                        const newStock = Math.max(0, currentStock - amount);
                        stockInput.value = newStock;
                        // 触发 input 事件，同步更新相关数据
                        stockInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });
            // 删除行
            planRows.splice(index, 1);
            tbody.removeChild(row);
            updateSummaryRows();
            savePlansToStorage();
            if (typeof refreshPlan === 'function') refreshPlan();
        }
    };
    tdDone.appendChild(completeBtn);
    row.appendChild(tdDone);

    // 隐藏列
    const tdHide = document.createElement('td');
    const hideChk = document.createElement('input');
    hideChk.type = 'checkbox';
    hideChk.className = 'hide-checkbox';
    hideChk.checked = hidden;
    if (hidden) {
        row.classList.add('hidden-row');
    }
    hideChk.addEventListener('change', function() {
        const index = Array.from(tbody.children).indexOf(row);
        if (index !== -1) {
            if (this.checked) {
                row.classList.add('hidden-row');
                planRows[index].hidden = true;
            } else {
                row.classList.remove('hidden-row');
                planRows[index].hidden = false;
            }
            updateSummaryRows();
            savePlansToStorage();
        }
    });
    tdHide.appendChild(hideChk);
    row.appendChild(tdHide);

    // 干员
    const tdOp = document.createElement('td');
    tdOp.textContent = operator;
    row.appendChild(tdOp);

    // 升级项目：只要包含 → 就拆分为两行
    const tdProj = document.createElement('td');
    let projectDisplay = project;
    if (project.includes('→')) {
        const lastArrowIndex = project.lastIndexOf('→');
        let splitIndex = -1;
        for (let i = lastArrowIndex; i >= 0; i--) {
            if (project[i] === ' ' || project[i] === '(') {
                splitIndex = i;
                break;
            }
        }
        if (splitIndex !== -1) {
            const name = project.substring(0, splitIndex).trim();
            const level = project.substring(splitIndex).trim();
            tdProj.innerHTML = `<div>${name}</div><div>${level}</div>`;
        } else {
            const parts = project.split(' ');
            if (parts.length > 1) {
                const level = parts.pop();
                const name = parts.join(' ');
                tdProj.innerHTML = `<div>${name}</div><div>${level}</div>`;
            } else {
                tdProj.textContent = project;
            }
        }
    } else {
        tdProj.textContent = project;
    }
    row.appendChild(tdProj);

    // 现等级
    const tdCur = document.createElement('td');
    if (project.includes('装备适配')) {
        tdCur.textContent = mapAdaptLevelToColor(curLv);
    } else {
        tdCur.textContent = curLv;
    }
    row.appendChild(tdCur);

    // 目标等级
    const tdTar = document.createElement('td');
    if (project.includes('装备适配')) {
        tdTar.textContent = mapAdaptLevelToColor(tarLv);
    } else {
        tdTar.textContent = tarLv;
    }
    row.appendChild(tdTar);

    // 材料列
    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        td.textContent = materialObj[mat] || 0;
        row.appendChild(td);
    });

    tbody.appendChild(row);

    if (!skipPush) {
        planRows.push({
            干员: operator,
            项目: project,
            现等级: curLv,
            目标等级: tarLv,
            materials: MATERIAL_COLUMNS.reduce((acc, mat) => {
                acc[mat] = materialObj[mat] || 0;
                return acc;
            }, {}),
            hidden: hidden
        });
    }

    // 仅在非跳过更新时调用
    if (!skipUpdate) {
        updateSummaryRows();
    }
    if (!skipSave) savePlansToStorage();
    if (typeof refreshPlan === 'function') refreshPlan();
}

// 隐藏零材料列
function hideZeroColumns() {
    const hasPlans = planRows.length > 0;

    if (!hasPlans) {
        MATERIAL_COLUMNS.forEach(mat => {
            document.querySelector(`#planTable thead th[data-material="${mat}"]`)?.style.setProperty('display', '', 'important');
            document.querySelectorAll(`#planBody td[data-material="${mat}"]`).forEach(td => td.style.display = '');
            document.querySelectorAll(`#planTable .summary-row td[data-material="${mat}"]`).forEach(td => td.style.display = '');
        });
        return;
    }

    const getTotal = (mat) => parseFloat(document.querySelector(`.total-value[data-material="${mat}"]`)?.textContent) || 0;
    const recordExpTotal = getTotal("作战记录经验值");
    const cognitionExpTotal = getTotal("认知载体经验值");
    const weaponExpTotal = getTotal("武器经验值");

    const recordExpGroup = ["作战记录经验值", "高级作战记录", "中级作战记录", "初级作战记录"];
    const cognitionExpGroup = ["认知载体经验值", "高级认知载体", "初级认知载体"];
    const weaponExpGroup = ["武器经验值", "武器检查单元", "武器检查装置", "武器检查套组"];

    MATERIAL_COLUMNS.forEach(mat => {
        let shouldHide = true;

        if (recordExpGroup.includes(mat)) {
            shouldHide = recordExpTotal === 0;
        } else if (cognitionExpGroup.includes(mat)) {
            shouldHide = cognitionExpTotal === 0;
        } else if (weaponExpGroup.includes(mat)) {
            shouldHide = weaponExpTotal === 0;
        } else {
            const total = getTotal(mat);
            shouldHide = total === 0;
        }

        const display = shouldHide ? 'none' : '';

        // 隐藏主表格表头
        const th = document.querySelector(`#planTable thead th[data-material="${mat}"]`);
        if (th) th.style.setProperty('display', display, 'important');

        // 隐藏计划行中的对应列
        document.querySelectorAll(`#planBody td[data-material="${mat}"]`).forEach(td => td.style.display = display);

        // 隐藏汇总行中的对应列（库存、缺少、合计）
        document.querySelectorAll(`#planTable .summary-row td[data-material="${mat}"]`).forEach(td => td.style.display = display);
    });
}

// 为等级输入框添加失去焦点钳位
function setupLevelInputClamp(input) {
    input.addEventListener('blur', function() {
        let val = parseInt(this.value, 10);
        const min = parseInt(this.min, 10);
        const max = parseInt(this.max, 10);
        if (isNaN(val)) {
            const lastVal = this.getAttribute('data-last-value');
            if (lastVal !== null && !isNaN(parseInt(lastVal, 10))) {
                this.value = lastVal;
            } else {
                this.value = min;
            }
            return;
        }
        this.setAttribute('data-last-value', this.value);
        if (val < min) this.value = min;
        else if (val > max) this.value = max;
        if (typeof updateCheckboxVisibility === 'function') {
            updateCheckboxVisibility();
        }
    });
}

setupLevelInputClamp(document.getElementById('currentLevel'));
setupLevelInputClamp(document.getElementById('targetLevel'));

// 加载计划
function loadPlansFromStorage() {
    const stored = localStorage.getItem('zmdgraph_plans');
    if (!stored) {
        console.log('无存储数据');
        return;
    }
    try {
        const plans = JSON.parse(stored);
        console.log('加载计划', plans);
        _loading = true;
        const tbody = document.getElementById('planBody');
        tbody.innerHTML = '';
        planRows = [];
        plans.forEach(p => {
            const hidden = p.hidden !== undefined ? p.hidden : false;
            addPlanRow(p.干员, p.项目, p.现等级, p.目标等级, p.materials, true, hidden);
        });
        _loading = false;
        updateSummaryRows();
        savePlansToStorage();
    } catch (e) {
        console.error('加载失败', e);
        _loading = false;
    }
}

// 保存计划
function savePlansToStorage() {
    console.log('保存计划:', planRows);
    if (_loading) return;
    try {
        const data = JSON.stringify(planRows);
        localStorage.setItem('zmdgraph_plans', data);
        console.log('计划已保存', planRows);
    } catch (e) {
        console.error('保存失败', e);
    }
}

// 刷新所有计划行的材料数据
function refreshAllPlans() {
    const tbody = document.getElementById('planBody');
    const rows = tbody.children;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const operator = row.cells[4].textContent;
        const project = row.cells[5].textContent;
        const curLvText = row.cells[6].textContent;
        const tarLvText = row.cells[7].textContent;

        let curLv, tarLv;
        if (project.includes('装备适配')) {
            const colorMap = { '绿装': 0, '蓝装': 1, '紫装': 2, '金装': 3 };
            curLv = colorMap[curLvText] !== undefined ? colorMap[curLvText] : parseInt(curLvText, 10);
            tarLv = colorMap[tarLvText] !== undefined ? colorMap[tarLvText] : parseInt(tarLvText, 10);
        } else {
            curLv = parseInt(curLvText, 10);
            tarLv = parseInt(tarLvText, 10);
        }

        if (isNaN(curLv) || isNaN(tarLv)) continue;

        let newMaterials;
        if (project.includes('角色等级-升级')) {
            newMaterials = calculateLevelMaterials(operator, curLv, tarLv);
        } else if (project.includes('角色等级-精英阶段')) {
            const match = project.match(/\((\d+)→(\d+)\)/);
            if (match) {
                const from = parseInt(match[1], 10);
                const to = parseInt(match[2], 10);
                let total = {};
                MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
                for (let e = from; e < to; e++) {
                    const res = calculateMaterials(operator, '精英阶段', e, e+1);
                    if (res) {
                        MATERIAL_COLUMNS.forEach(mat => total[mat] += res[mat] || 0);
                    }
                }
                newMaterials = total;
            } else {
                continue;
            }
        } else if (project.includes('角色等级-装备适配')) {
            const colorMap = { '绿装':0, '蓝装':1, '紫装':2, '金装':3 };
            const match = project.match(/\((\D+)→(\D+)\)/);
            if (match) {
                const fromColor = match[1];
                const toColor = match[2];
                const from = colorMap[fromColor];
                const to = colorMap[toColor];
                let total = {};
                MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
                for (let a = from; a < to; a++) {
                    const res = calculateMaterials(operator, '装备适配', a, a+1);
                    if (res) {
                        MATERIAL_COLUMNS.forEach(mat => total[mat] += res[mat] || 0);
                    }
                }
                newMaterials = total;
            } else {
                continue;
            }
        } else {
            newMaterials = calculateMaterials(operator, project, curLv, tarLv);
        }

        if (!newMaterials) {
            console.warn(`刷新失败：无法计算 ${operator} ${project} ${curLv}→${tarLv}`);
            continue;
        }

        MATERIAL_COLUMNS.forEach((mat, idx) => {
            const cell = row.cells[8 + idx];
            if (cell) {
                cell.textContent = newMaterials[mat] || 0;
            }
        });

        if (planRows[i]) {
            planRows[i].materials = newMaterials;
        }
    }

    updateSummaryRows();
    savePlansToStorage();
    if (typeof refreshPlan === 'function') refreshPlan();
    alert('计划刷新完成');
}

// 初始化培养表页面
function initPlanner() {

    const operatorSelect = document.getElementById('operatorSelect');
    CHARACTER_LIST.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        operatorSelect.appendChild(opt);
    });

    const eliteCheck = document.getElementById('includeElite');
    const adapt0Check = document.getElementById('adapt0Done');
    const adapt1Check = document.getElementById('adapt1Done');
    const adapt2Check = document.getElementById('adapt2Done');
    const levelOptions = document.getElementById('levelOptions');
    const currentLevelInput = document.getElementById('currentLevel');
    const projectSelect = document.getElementById('projectSelect');

    eliteCheck.addEventListener('change', updateCheckboxVisibility);

    function updateCheckboxVisibility() {
        if (projectSelect.value !== '角色等级') {
            levelOptions.style.display = 'none';
            return;
        }

        const cur = parseInt(currentLevelInput.value, 10);
        if (isNaN(cur)) {
            levelOptions.style.display = 'none';
            return;
        }

        const adapt0Checked = adapt0Check.checked;
        const adapt1Checked = adapt1Check.checked;
        const adapt2Checked = adapt2Check.checked;

        const showElite = [20,40,60,80].includes(cur);
        eliteCheck.parentElement.style.display = showElite ? 'inline-block' : 'none';

        adapt0Check.parentElement.style.display = 'none';
        adapt0Check.disabled = false;
        adapt1Check.parentElement.style.display = 'none';
        adapt1Check.disabled = false;
        adapt2Check.parentElement.style.display = 'none';
        adapt2Check.disabled = false;

        if (cur >= 20) adapt0Check.parentElement.style.display = 'inline-block';
        if (cur >= 40) adapt1Check.parentElement.style.display = 'inline-block';
        if (cur >= 60) adapt2Check.parentElement.style.display = 'inline-block';

        if (cur > 40) {
            adapt0Check.checked = true;
            adapt0Check.disabled = true;
        }
        if (cur > 60) {
            adapt1Check.checked = true;
            adapt1Check.disabled = true;
        }
        if (cur > 80) {
            adapt2Check.checked = true;
            adapt2Check.disabled = true;
        }

        const eliteChecked = eliteCheck.checked;

        if (cur === 20) {
            if (eliteChecked) {
                adapt0Check.checked = true;
                adapt0Check.disabled = true;
            } else {
                adapt0Check.checked = adapt0Checked;
                adapt0Check.disabled = false;
            }
        }

        if (cur === 40) {
            if (eliteChecked) {
                adapt0Check.checked = true;
                adapt0Check.disabled = true;
            } else {
                adapt0Check.checked = adapt0Checked;
                adapt0Check.disabled = false;
            }
            adapt1Check.checked = adapt1Checked;
            adapt1Check.disabled = false;
        }

        if (cur === 60) {
            if (eliteChecked) {
                adapt1Check.checked = true;
                adapt1Check.disabled = true;
            } else {
                adapt1Check.checked = adapt1Checked;
                adapt1Check.disabled = false;
            }
            adapt2Check.checked = adapt2Checked;
            adapt2Check.disabled = false;
        }

        if (cur === 80) {
            if (eliteChecked) {
                adapt2Check.checked = true;
                adapt2Check.disabled = true;
            } else {
                adapt2Check.checked = adapt2Checked;
                adapt2Check.disabled = false;
            }
        }

        if (cur > 20 && cur < 40) {
            adapt0Check.checked = adapt0Checked;
            adapt0Check.disabled = false;
        }
        if (cur > 40 && cur < 60) {
            adapt1Check.checked = adapt1Checked;
            adapt1Check.disabled = false;
        }
        if (cur > 60 && cur < 80) {
            adapt2Check.checked = adapt2Checked;
            adapt2Check.disabled = false;
        }

        levelOptions.style.display = 'block';
    }

    function getProjectRange(干员, 项目) {
        const generic = mapSkillToGeneric(干员, 项目);
        if (generic.startsWith('技能')) {
            return { min: 1, max: 12 };
        }
        if (generic === '角色等级') return { min: 1, max: 90 };
        if (generic === '精英阶段') return { min: 0, max: 4 };
        if (generic === '装备适配') return { min: 0, max: 3 };
        if (generic === '能力值（信赖）') return { min: 0, max: 4 };
        if (generic === '天赋') return { min: 0, max: 4 };
        if (generic === '基建') return { min: 0, max: 4 };
        return { min: 0, max: 90 };
    }

    currentLevelInput.addEventListener('input', updateCheckboxVisibility);

    operatorSelect.addEventListener('change', function() {
        document.getElementById('currentLevel').value = '';
        document.getElementById('targetLevel').value = '';

        const curInput = document.getElementById('currentLevel');
        const tarInput = document.getElementById('targetLevel');
        curInput.value = '';
        tarInput.value = '';
        curInput.removeAttribute('data-last-value');
        tarInput.removeAttribute('data-last-value');
        curInput.min = 1;
        curInput.max = 90;
        tarInput.min = 1;
        tarInput.max = 90;

        const op = this.value;
        if (!op) {
            projectSelect.disabled = true;
            projectSelect.innerHTML = '<option value="">请先选干员</option>';
            return;
        }
        let projects = getAvailableProjects(op);
        const levelProjects = ['精0等级', '精1等级', '精2等级', '精3等级', '精4等级'];
        projects = projects.filter(p => !levelProjects.includes(p));
        projects.unshift('角色等级');
        projectSelect.disabled = false;
        projectSelect.innerHTML = '<option value="">请选择升级项目</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            projectSelect.appendChild(opt);
        });
    });

    projectSelect.addEventListener('change', function() {
        const selectedProj = this.value;
        const selectedOp = operatorSelect.value;
        const curInput = document.getElementById('currentLevel');
        const tarInput = document.getElementById('targetLevel');
        if (!selectedProj || !selectedOp) {
            curInput.value = '';
            tarInput.value = '';
            updateCheckboxVisibility();
            return;
        }
        const range = getProjectRange(selectedOp, selectedProj);
        curInput.min = range.min;
        curInput.max = range.max;
        tarInput.min = range.min;
        tarInput.max = range.max;

        if (selectedProj === '角色等级') {
            curInput.value = 1;
            tarInput.value = 90;
            curInput.setAttribute('data-last-value', curInput.value);
            tarInput.setAttribute('data-last-value', tarInput.value);
            updateCheckboxVisibility();
            return;
        }
        const genericProj = mapSkillToGeneric(selectedOp, selectedProj);
        const matchingRows = DATABASE.filter(row => {
            const operatorMatch = (row.干员 === selectedOp) || (row.干员 === "" || row.干员 === "通用");
            return operatorMatch && row.升级项目 === genericProj;
        });
        if (matchingRows.length > 0) {
            const minRow = matchingRows.reduce((min, row) => {
                return row.现等级 < min.现等级 ? row : min;
            }, matchingRows[0]);
            curInput.value = minRow.现等级;
            tarInput.value = minRow.目标等级;
            curInput.setAttribute('data-last-value', curInput.value);
            tarInput.setAttribute('data-last-value', tarInput.value);
        } else {
            curInput.value = '';
            tarInput.value = '';
            curInput.removeAttribute('data-last-value');
            tarInput.removeAttribute('data-last-value');
        }
        updateCheckboxVisibility();
    });

    document.getElementById('calcBtn').addEventListener('click', function() {
        const op = operatorSelect.value;
        const proj = projectSelect.value;
        const cur = parseInt(document.getElementById('currentLevel').value, 10);
        const tar = parseInt(document.getElementById('targetLevel').value, 10);
        if (!op || !proj || isNaN(cur) || isNaN(tar)) {
            alert("请完整填写干员、项目和等级");
            return;
        }

        if (proj === '角色等级') {
            const levelRes = calculateLevelMaterials(op, cur, tar);
            if (levelRes && Object.values(levelRes).some(v => v > 0)) {
                addPlanRow(op, '角色等级-升级', cur, tar, levelRes);
            } else {
                alert("升级材料无数据，可能等级范围不正确");
                return;
            }

            const eliteDone = eliteCheck ? eliteCheck.checked : false;
            const eliteInfo = calculateEliteWithRange(op, cur, tar, eliteDone);
            if (eliteInfo && Object.values(eliteInfo.materials).some(v => v > 0)) {
                addPlanRow(op, `角色等级-精英阶段(${eliteInfo.from}→${eliteInfo.to})`, eliteInfo.from, eliteInfo.to, eliteInfo.materials);
            }

            const adapt0Done = adapt0Check ? adapt0Check.checked : false;
            const adapt1Done = adapt1Check ? adapt1Check.checked : false;
            const adapt2Done = adapt2Check ? adapt2Check.checked : false;
            const adaptInfo = calculateAdaptWithRange(op, cur, tar, adapt0Done, adapt1Done, adapt2Done);
            if (adaptInfo && Object.values(adaptInfo.materials).some(v => v > 0)) {
                const fromColor = mapAdaptLevelToColor(adaptInfo.from);
                const toColor = mapAdaptLevelToColor(adaptInfo.to);
                addPlanRow(op, `角色等级-装备适配(${fromColor}→${toColor})`, adaptInfo.from, adaptInfo.to, adaptInfo.materials);
            }
        } else {
            const result = calculateMaterials(op, proj, cur, tar);
            if (result) {
                addPlanRow(op, proj, cur, tar, result);
            } else {
                alert("未找到对应材料数据，请确定是否填写正确，如填写正确无数据，请反馈bug给底下联系人");
            }
        }

        document.getElementById('currentLevel').value = '';
        document.getElementById('targetLevel').value = '';
    });

    document.getElementById('addRowBtn').textContent = '✏️ 编辑计划';
    document.getElementById('addRowBtn').addEventListener('click', toggleEditMode);

    function calculateEliteWithRange(干员, 现等级, 目标等级, eliteDone) {
        let total = {};
        MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
        let minFrom = null, maxTo = null;

        const eliteThresholds = [20, 40, 60, 80];
        const eliteStages = [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 }
        ];

        for (let i = 0; i < eliteThresholds.length; i++) {
            const threshold = eliteThresholds[i];
            if (目标等级 >= threshold) {
                if (现等级 < threshold) {
                    const stageRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
                    if (stageRes) {
                        MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                        if (minFrom === null || eliteStages[i].from < minFrom) minFrom = eliteStages[i].from;
                        if (maxTo === null || eliteStages[i].to > maxTo) maxTo = eliteStages[i].to;
                    }
                } else if (现等级 === threshold && !eliteDone) {
                    const stageRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
                    if (stageRes) {
                        MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                        if (minFrom === null || eliteStages[i].from < minFrom) minFrom = eliteStages[i].from;
                        if (maxTo === null || eliteStages[i].to > maxTo) maxTo = eliteStages[i].to;
                    }
                }
            }
        }

        if (minFrom === null) return null;
        return { materials: total, from: minFrom, to: maxTo };
    }

    function calculateAdaptWithRange(干员, 现等级, 目标等级, adapt0Done, adapt1Done, adapt2Done) {
        let total = {};
        MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
        let minFrom = null, maxTo = null;

        const adaptStages = [
            { threshold: 20, from: 0, to: 1, done: adapt0Done },
            { threshold: 40, from: 1, to: 2, done: adapt1Done },
            { threshold: 60, from: 2, to: 3, done: adapt2Done }
        ];

        for (let stage of adaptStages) {
            if (目标等级 > stage.threshold && 现等级 < stage.threshold + 20 && !stage.done) {
                const stageRes = calculateMaterials(干员, "装备适配", stage.from, stage.to);
                if (stageRes) {
                    MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                    if (minFrom === null || stage.from < minFrom) minFrom = stage.from;
                    if (maxTo === null || stage.to > maxTo) maxTo = stage.to;
                }
            }
        }

        if (minFrom === null) return null;
        return { materials: total, from: minFrom, to: maxTo };
    }

    const backwardCheckbox = document.getElementById('allowBackwardCheckbox');
    if (backwardCheckbox) {
        backwardCheckbox.addEventListener('change', function() {
            updateMissingRow();
            refreshPlan();
        });
    }

    document.getElementById('removeAllBtn')?.addEventListener('click', function() {
        if (planRows.length === 0) {
            alert('没有计划可移除');
            return;
        }
        if (confirm('确定要移除所有计划吗？此操作不可撤销。')) {
            planRows = [];
            document.getElementById('planBody').innerHTML = '';
            updateSummaryRows();
            savePlansToStorage();
            if (typeof refreshPlan === 'function') refreshPlan();
        }
    });

    document.getElementById('refreshPlansBtn')?.addEventListener('click', function() {
        if (planRows.length === 0) {
            alert('没有计划可刷新');
            return;
        }
        if (confirm('确定要刷新所有计划材料吗？将根据最新数据重新计算。')) {
            refreshAllPlans();
        }
    });

    // 从 localStorage 加载开关状态
    const savedBackward = localStorage.getItem('zmdgraph_allow_backward') === 'true';
    if (backwardCheckbox) {
        backwardCheckbox.checked = savedBackward;
        backwardCheckbox.addEventListener('change', function() {
            localStorage.setItem('zmdgraph_allow_backward', this.checked);
            updateMissingRow();
            refreshPlan();
        });
    }

    // 自定义提示信息（高级代偿说明）
    const infoIcon = document.querySelector('.info-icon');
    if (infoIcon) {
        let tooltip = null;

        function showTooltip(e) {
            if (tooltip) return;
            tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = '开启后允许用高级材料代替低级，但计算结果可能不够精确，建议结合实际情况参考。';
            document.body.appendChild(tooltip);
            
            const rect = infoIcon.getBoundingClientRect();
            const tooltipWidth = tooltip.offsetWidth;
            const windowWidth = window.innerWidth;
            
            let left = rect.left + window.scrollX;
            let top = rect.bottom + window.scrollY + 8;
            
            // 如果提示框超出屏幕右侧，向左移动
            if (left + tooltipWidth > windowWidth) {
                left = windowWidth - tooltipWidth - 10;
            }
            // 确保不超出左侧
            if (left < 10) left = 10;
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.style.position = 'absolute';
        }

        function hideTooltip() {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        }

        // PC：鼠标移入/移出
        infoIcon.addEventListener('mouseenter', showTooltip);
        infoIcon.addEventListener('mouseleave', hideTooltip);

        // 手机：点击切换
        infoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tooltip) {
                hideTooltip();
            } else {
                showTooltip(e);
                // 点击外部隐藏
                document.addEventListener('click', function handler(ev) {
                    if (!tooltip) {
                        document.removeEventListener('click', handler);
                        return;
                    }
                    if (!tooltip.contains(ev.target) && ev.target !== infoIcon) {
                        hideTooltip();
                        document.removeEventListener('click', handler);
                    }
                });
            }
        });
    }

    // 初次渲染
    renderTableHeader();
    createSummaryRows();
    updateExpValues();
    hideZeroColumns();

    // 加载计划数据
    loadPlansFromStorage();

    // 为等级输入框添加钳位
    setupLevelInputClamp(document.getElementById('currentLevel'));
    setupLevelInputClamp(document.getElementById('targetLevel'));
}