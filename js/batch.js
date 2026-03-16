// 批量添加页面数据

function initBatch() {
    // 填充干员复选框
    const opChecklist = document.getElementById('batchOperatorChecklist');
    CHARACTER_LIST.forEach(op => {
        const label = document.createElement('label');
        label.className = 'checklist-item';
        label.innerHTML = `<input type="checkbox" value="${op}"> ${op}`;
        opChecklist.appendChild(label);
    });

    // 填充武器复选框
    const wpChecklist = document.getElementById('batchWeaponChecklist');
    const weaponNames = [...new Set(WEAPON_LIST.map(w => w.name))].sort();
    weaponNames.forEach(name => {
        const label = document.createElement('label');
        label.className = 'checklist-item';
        label.innerHTML = `<input type="checkbox" value="${name}"> ${name}`;
        wpChecklist.appendChild(label);
    });

    // 绑定生成表格按钮
    document.getElementById('generateOperatorBatchBtn').addEventListener('click', generateOperatorBatchTable);
    document.getElementById('generateWeaponBatchBtn').addEventListener('click', generateWeaponBatchTable);

    // 绑定计算需求和添加到培养表按钮
    document.getElementById('batchCalcDemandBtn').addEventListener('click', calculateBatchDemand);
    document.getElementById('batchAddToPlannerBtn').addEventListener('click', batchAddToPlanner);
}

// 干员表格生成
const BATCH_OPERATOR_PROJECTS = [
    { key: 'elite', label: '精英', min: 0, max: 4 },
    { key: 'level', label: '等级', min: 1, max: 90 },
    { key: 'skill1', label: '技能1', min: 1, max: 12 },
    { key: 'skill2', label: '技能2', min: 1, max: 12 },
    { key: 'skill3', label: '技能3', min: 1, max: 12 },
    { key: 'skill4', label: '技能4', min: 1, max: 12 },
    { key: 'talent', label: '天赋', min: 0, max: 4 },
    { key: 'base', label: '基建', min: 0, max: 4 },
    { key: 'trust', label: '信赖', min: 0, max: 4 },
    { key: 'adapt', label: '装备适配', min: 0, max: 3 }
];

function generateOperatorBatchTable() {
    const container = document.getElementById('batchOperatorTableContainer');
    container.innerHTML = '';

    // 获取选中的干员
    const checkedOps = Array.from(document.querySelectorAll('#batchOperatorChecklist input:checked')).map(cb => cb.value);
    if (checkedOps.length === 0) {
        alert('请至少选择一个干员');
        return;
    }

    // 创建统一目标面板
    const targetPanel = createOperatorTargetPanel();
    container.appendChild(targetPanel);

    const table = createOperatorTable(checkedOps);
    container.appendChild(table);

    // 绑定全选事件（表格内）
    const selectAll = document.getElementById('opSelectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.op-group-check').forEach(cb => cb.checked = this.checked);
            updateOperatorSelectAll();
        });
    }

    // 绑定应用到勾选干员按钮
    document.getElementById('applyOpTargetBtn')?.addEventListener('click', applyOperatorTarget);
}

function createOperatorTargetPanel() {
    const div = document.createElement('div');
    div.className = 'batch-target-panel';
    div.innerHTML = `
        <strong>统一设置目标值：</strong>
        ${BATCH_OPERATOR_PROJECTS.map(proj => `
            <label>
                ${proj.label}:
                <input type="number" id="batchOpTarget_${proj.key}" min="${proj.min}" max="${proj.max}" value="${proj.max}" style="width:60px;">
            </label>
        `).join('')}
        <button id="applyOpTargetBtn" class="btn btn-sm btn-primary" style="margin-left:15px;">应用到勾选干员</button>
    `;
    return div;
}

function createOperatorTable(operators) {
    const table = document.createElement('table');
    table.id = 'batchOperatorTable';
    table.className = 'batch-table';
    table.style.width = 'max-content';

    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th><input type="checkbox" id="opSelectAll" checked> 全选</th>
        <th>干员</th>
        ${BATCH_OPERATOR_PROJECTS.map(p => `<th>${p.label}</th>`).join('')}
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    operators.forEach(op => {
        // 当前行
        const curRow = document.createElement('tr');
        const tdCheck = document.createElement('td');
        tdCheck.rowSpan = 2;
        tdCheck.style.verticalAlign = 'middle';
        tdCheck.innerHTML = `<input type="checkbox" class="op-group-check" data-operator="${op}" checked>`;
        const chk = tdCheck.querySelector('input');
        chk.addEventListener('change', updateOperatorSelectAll);
        curRow.appendChild(tdCheck);

        const tdOpCur = document.createElement('td');
        tdOpCur.textContent = op;
        tdOpCur.style.fontWeight = 'bold';
        curRow.appendChild(tdOpCur);

        BATCH_OPERATOR_PROJECTS.forEach(proj => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = proj.min;
            input.max = proj.max;
            input.value = proj.min;
            input.classList.add('batch-op-cur');
            input.dataset.operator = op;
            input.dataset.project = proj.key;
            input.addEventListener('blur', clampInput);
            td.appendChild(input);
            curRow.appendChild(td);
        });
        tbody.appendChild(curRow);

        // 目标行
        const tarRow = document.createElement('tr');
        const tdOpTar = document.createElement('td'); // 干员列留空
        tdOpTar.textContent = '';
        tarRow.appendChild(tdOpTar);

        BATCH_OPERATOR_PROJECTS.forEach(proj => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = proj.min;
            input.max = proj.max;
            // 默认目标值
            if (proj.key === 'level') input.value = 90;
            else if (proj.key.startsWith('skill')) input.value = 12;
            else if (proj.key === 'adapt') input.value = 3;
            else input.value = proj.max;
            input.classList.add('batch-op-tar');
            input.dataset.operator = op;
            input.dataset.project = proj.key;
            input.addEventListener('blur', clampInput);
            td.appendChild(input);
            tarRow.appendChild(td);
        });
        tbody.appendChild(tarRow);
    });
    table.appendChild(tbody);
    return table;
}

function applyOperatorTarget() {
    const checkedOps = Array.from(document.querySelectorAll('.op-group-check:checked')).map(cb => cb.dataset.operator);
    if (checkedOps.length === 0) return alert('请先勾选干员');

    const targets = {};
    BATCH_OPERATOR_PROJECTS.forEach(proj => {
        const inp = document.getElementById(`batchOpTarget_${proj.key}`);
        if (inp) targets[proj.key] = parseInt(inp.value, 10) || proj.max;
    });

    document.querySelectorAll('#batchOperatorTable .batch-op-tar').forEach(inp => {
        const op = inp.dataset.operator;
        const proj = inp.dataset.project;
        if (checkedOps.includes(op) && targets.hasOwnProperty(proj)) {
            inp.value = targets[proj];
        }
    });
}

// 武器表格生成
const BATCH_WEAPON_PROJECTS = [
    { key: 'break', label: '突破', min: 0, max: 4 },
    { key: 'level', label: '等级', min: 1, max: 90 }
];

function generateWeaponBatchTable() {
    const container = document.getElementById('batchWeaponTableContainer');
    container.innerHTML = '';

    const checkedWps = Array.from(document.querySelectorAll('#batchWeaponChecklist input:checked')).map(cb => cb.value);
    if (checkedWps.length === 0) {
        alert('请至少选择一个武器');
        return;
    }

    const targetPanel = createWeaponTargetPanel();
    container.appendChild(targetPanel);

    const table = createWeaponTable(checkedWps);
    container.appendChild(table);

    document.getElementById('wpSelectAll')?.addEventListener('change', function() {
        document.querySelectorAll('.wp-group-check').forEach(cb => cb.checked = this.checked);
        updateWeaponSelectAll();
    });

    document.getElementById('applyWpTargetBtn')?.addEventListener('click', applyWeaponTarget);
}

function createWeaponTargetPanel() {
    const div = document.createElement('div');
    div.className = 'batch-target-panel';
    div.innerHTML = `
        <strong>统一设置目标值：</strong>
        ${BATCH_WEAPON_PROJECTS.map(proj => `
            <label>
                ${proj.label}:
                <input type="number" id="batchWpTarget_${proj.key}" min="${proj.min}" max="${proj.max}" value="${proj.max}" style="width:60px;">
            </label>
        `).join('')}
        <button id="applyWpTargetBtn" class="btn btn-sm btn-primary">应用到勾选武器</button>
    `;
    return div;
}

function createWeaponTable(weapons) {
    const table = document.createElement('table');
    table.id = 'batchWeaponTable';
    table.className = 'batch-table';
    table.style.width = 'max-content';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th><input type="checkbox" id="wpSelectAll" checked> 全选</th>
        <th>武器</th>
        ${BATCH_WEAPON_PROJECTS.map(p => `<th>${p.label}</th>`).join('')}
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    weapons.forEach(wp => {
        // 当前行
        const curRow = document.createElement('tr');
        const tdCheck = document.createElement('td');
        tdCheck.rowSpan = 2;
        tdCheck.innerHTML = `<input type="checkbox" class="wp-group-check" data-weapon="${wp}" checked>`;
        const chk = tdCheck.querySelector('input');
        chk.addEventListener('change', updateWeaponSelectAll);
        curRow.appendChild(tdCheck);

        const tdWpCur = document.createElement('td');
        tdWpCur.textContent = wp;
        tdWpCur.style.fontWeight = 'bold';
        curRow.appendChild(tdWpCur);

        BATCH_WEAPON_PROJECTS.forEach(proj => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = proj.min;
            input.max = proj.max;
            input.value = proj.min;
            input.classList.add('batch-wp-cur');
            input.dataset.weapon = wp;
            input.dataset.project = proj.key;
            input.addEventListener('blur', clampInput);
            td.appendChild(input);
            curRow.appendChild(td);
        });
        tbody.appendChild(curRow);

        // 目标行
        const tarRow = document.createElement('tr');
        const tdWpTar = document.createElement('td');
        tdWpTar.textContent = '';
        tarRow.appendChild(tdWpTar);

        BATCH_WEAPON_PROJECTS.forEach(proj => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = proj.min;
            input.max = proj.max;
            input.value = proj.max;
            input.classList.add('batch-wp-tar');
            input.dataset.weapon = wp;
            input.dataset.project = proj.key;
            input.addEventListener('blur', clampInput);
            td.appendChild(input);
            tarRow.appendChild(td);
        });
        tbody.appendChild(tarRow);
    });
    table.appendChild(tbody);
    return table;
}

function applyWeaponTarget() {
    const checkedWps = Array.from(document.querySelectorAll('.wp-group-check:checked')).map(cb => cb.dataset.weapon);
    if (checkedWps.length === 0) return alert('请先勾选武器');

    const targets = {};
    BATCH_WEAPON_PROJECTS.forEach(proj => {
        const inp = document.getElementById(`batchWpTarget_${proj.key}`);
        if (inp) targets[proj.key] = parseInt(inp.value, 10) || proj.max;
    });

    document.querySelectorAll('#batchWeaponTable .batch-wp-tar').forEach(inp => {
        const wp = inp.dataset.weapon;
        const proj = inp.dataset.project;
        if (checkedWps.includes(wp) && targets.hasOwnProperty(proj)) {
            inp.value = targets[proj];
        }
    });
}

// 工具函数
function clampInput() {
    let val = parseInt(this.value, 10);
    if (isNaN(val)) {
        this.value = this.min;
        return;
    }
    const min = parseInt(this.min, 10);
    const max = parseInt(this.max, 10);
    if (val < min) this.value = min;
    else if (val > max) this.value = max;
}

// 获取技能名称
function getSkillName(operator, index) {
    const row = SKILL_MAPPING.find(r => r.干员 === operator);
    return row ? row[`技能${index}`] || `技能${index}` : `技能${index}`;
}

// 计算需求
function calculateBatchDemand() {
    const demands = []; // 存储每个实体的需求
    const totalMaterials = {};
    MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] = 0);

    // 处理干员表格
    const opTable = document.getElementById('batchOperatorTable');
    if (opTable) {
        const rows = opTable.querySelector('tbody').children;
        for (let i = 0; i < rows.length; i += 2) {
            const curRow = rows[i];
            const tarRow = rows[i+1];
            if (!curRow || !tarRow) continue;

            const checkCb = curRow.cells[0].querySelector('input');
            if (!checkCb || !checkCb.checked) continue;

            const operator = curRow.cells[1].textContent;
            const available = getAvailableProjects(operator);
            const opMaterials = {};
            MATERIAL_COLUMNS.forEach(mat => opMaterials[mat] = 0);

            for (let j = 2; j < curRow.cells.length; j++) {
                const curInput = curRow.cells[j].querySelector('input');
                const tarInput = tarRow.cells[j-1].querySelector('input');
                if (!curInput || !tarInput) continue;

                const projKey = curInput.dataset.project;
                const curVal = parseInt(curInput.value, 10);
                const tarVal = parseInt(tarInput.value, 10);
                if (isNaN(curVal) || isNaN(tarVal) || curVal >= tarVal) continue;

                let materials = null;
                if (projKey === 'level') {
                    materials = calculateLevelMaterials(operator, curVal, tarVal);
                } else {
                    let actualProject;
                    if (projKey.startsWith('skill')) {
                        const idx = parseInt(projKey.replace('skill', ''), 10);
                        actualProject = getSkillName(operator, idx);
                    } else if (projKey === 'elite') actualProject = '精英阶段';
                    else if (projKey === 'talent') actualProject = '天赋';
                    else if (projKey === 'base') actualProject = '基建';
                    else if (projKey === 'trust') actualProject = '能力值（信赖）';
                    else if (projKey === 'adapt') actualProject = '装备适配';
                    else actualProject = projKey;

                    if ((projKey === 'talent' || projKey === 'base' || projKey === 'trust') && !available.includes(actualProject)) {
                        continue;
                    }
                    materials = calculateMaterials(operator, actualProject, curVal, tarVal);
                }

                if (materials) {
                    MATERIAL_COLUMNS.forEach(mat => {
                        opMaterials[mat] += materials[mat] || 0;
                    });
                }
            }

            if (Object.values(opMaterials).some(v => v > 0)) {
                demands.push({ type: 'operator', name: operator, materials: opMaterials });
                MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] += opMaterials[mat]);
            }
        }
    }

    // 处理武器表格
    const wpTable = document.getElementById('batchWeaponTable');
    if (wpTable) {
        const rows = wpTable.querySelector('tbody').children;
        for (let i = 0; i < rows.length; i += 2) {
            const curRow = rows[i];
            const tarRow = rows[i+1];
            if (!curRow || !tarRow) continue;

            const checkCb = curRow.cells[0].querySelector('input');
            if (!checkCb || !checkCb.checked) continue;

            const weapon = curRow.cells[1].textContent;
            const wpMaterials = {};
            MATERIAL_COLUMNS.forEach(mat => wpMaterials[mat] = 0);

            // 突破
            const breakCur = curRow.cells[2]?.querySelector('input');
            const breakTar = tarRow.cells[1]?.querySelector('input');
            if (breakCur && breakTar) {
                const curBreak = parseInt(breakCur.value, 10);
                const tarBreak = parseInt(breakTar.value, 10);
                if (!isNaN(curBreak) && !isNaN(tarBreak) && curBreak < tarBreak) {
                    const mats = calculateWeaponBreakMaterials(weapon, curBreak, tarBreak);
                    if (mats) {
                        MATERIAL_COLUMNS.forEach(mat => wpMaterials[mat] += mats[mat] || 0);
                    }
                }
            }

            // 等级
            const levelCur = curRow.cells[3]?.querySelector('input');
            const levelTar = tarRow.cells[2]?.querySelector('input');
            if (levelCur && levelTar) {
                const curLevel = parseInt(levelCur.value, 10);
                const tarLevel = parseInt(levelTar.value, 10);
                if (!isNaN(curLevel) && !isNaN(tarLevel) && curLevel < tarLevel) {
                    const lvlMats = calculateWeaponLevelMaterials(curLevel, tarLevel);
                    if (lvlMats) {
                        const expMats = convertExpToMaterials(lvlMats.武器经验值);
                        wpMaterials.折金票 += lvlMats.折金票;
                        wpMaterials.武器经验值 += lvlMats.武器经验值;
                        wpMaterials.武器检查套组 += expMats.武器检查套组 || 0;
                        wpMaterials.武器检查装置 += expMats.武器检查装置 || 0;
                        wpMaterials.武器检查单元 += expMats.武器检查单元 || 0;
                    }
                }
            }

            if (Object.values(wpMaterials).some(v => v > 0)) {
                demands.push({ type: 'weapon', name: weapon, materials: wpMaterials });
                MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] += wpMaterials[mat]);
            }
        }
    }

    // 渲染结果
    const resultDiv = document.getElementById('batchDemandResult');
    const contentDiv = document.getElementById('batchDemandContent');
    contentDiv.innerHTML = '';

    // 总材料需求
    if (Object.values(totalMaterials).some(v => v > 0)) {
        const totalSection = document.createElement('div');
        totalSection.innerHTML = '<h4 style="margin:10px 0 5px;">📊 总材料需求</h4>';
        MATERIAL_COLUMNS.forEach(mat => {
            if (totalMaterials[mat] > 0) {
                const span = document.createElement('span');
                span.className = 'demand-item';
                span.innerHTML = `<img src="${MATERIAL_ICONS[mat] || DEFAULT_ICON}" style="width:24px;height:24px;"> ${mat} ×${totalMaterials[mat]}`;
                totalSection.appendChild(span);
            }
        });
        contentDiv.appendChild(totalSection);
    }

    // 每个干员/武器的单独需求
    demands.forEach(d => {
        const section = document.createElement('div');
        section.style.marginTop = '20px';
        section.style.padding = '10px';
        section.style.border = '1px solid #ddd';
        section.style.borderRadius = '8px';
        section.style.backgroundColor = '#f9f9f9';
        const title = d.type === 'operator' ? `🧑‍🤝‍🧑 ${d.name}` : `🗡️ ${d.name}`;
        const h5 = document.createElement('h5');
        h5.style.margin = '0 0 8px 0';
        h5.textContent = title;
        section.appendChild(h5);
        MATERIAL_COLUMNS.forEach(mat => {
            if (d.materials[mat] > 0) {
                const span = document.createElement('span');
                span.className = 'demand-item';
                span.innerHTML = `<img src="${MATERIAL_ICONS[mat] || DEFAULT_ICON}" style="width:24px;height:24px;"> ${mat} ×${d.materials[mat]}`;
                section.appendChild(span);
            }
        });
        contentDiv.appendChild(section);
    });

    // 无任何需求
    if (demands.length === 0) {
        contentDiv.innerHTML = '<p>无材料需求（所有勾选项目已满或未勾选有效项目）</p>';
    }

    resultDiv.style.display = 'block';
}

// 添加需求至培养表中
function batchAddToPlanner() {
    const opTable = document.getElementById('batchOperatorTable');
    const wpTable = document.getElementById('batchWeaponTable');
    if (!opTable && !wpTable) {
        alert('请先生成干员或武器表格');
        return;
    }

    let addedCount = 0;
    // 干员添加
    if (opTable) {
        const rows = opTable.querySelector('tbody').children;
        for (let i = 0; i < rows.length; i += 2) {
            const curRow = rows[i];
            const tarRow = rows[i+1];
            if (!curRow || !tarRow) continue;

            const checkCb = curRow.cells[0].querySelector('input');
            if (!checkCb || !checkCb.checked) continue;

            const operator = curRow.cells[1].textContent;
            const available = getAvailableProjects(operator);

            for (let j = 2; j < curRow.cells.length; j++) {
                const curInput = curRow.cells[j].querySelector('input');
                const tarInput = tarRow.cells[j-1].querySelector('input');
                if (!curInput || !tarInput) continue;

                const projKey = curInput.dataset.project;
                const curVal = parseInt(curInput.value, 10);
                const tarVal = parseInt(tarInput.value, 10);
                if (isNaN(curVal) || isNaN(tarVal) || curVal >= tarVal) continue;

                let materials = null;
                let displayProject = '';

                if (projKey === 'level') {
                    materials = calculateLevelMaterials(operator, curVal, tarVal);
                    displayProject = `角色等级-升级`;
                } else {
                    let actualProject;
                    if (projKey.startsWith('skill')) {
                        const idx = parseInt(projKey.replace('skill', ''), 10);
                        actualProject = getSkillName(operator, idx);
                    } else if (projKey === 'elite') actualProject = '精英阶段';
                    else if (projKey === 'talent') actualProject = '天赋';
                    else if (projKey === 'base') actualProject = '基建';
                    else if (projKey === 'trust') actualProject = '能力值（信赖）';
                    else if (projKey === 'adapt') actualProject = '装备适配';
                    else actualProject = projKey;

                    if ((projKey === 'talent' || projKey === 'base' || projKey === 'trust') && !available.includes(actualProject)) {
                        continue;
                    }

                    materials = calculateMaterials(operator, actualProject, curVal, tarVal);
                    // 构造显示项目
                    const baseLabel = BATCH_OPERATOR_PROJECTS.find(p => p.key === projKey)?.label || projKey;
                    if (projKey === 'adapt') {
                        const fromColor = mapAdaptLevelToColor(curVal);
                        const toColor = mapAdaptLevelToColor(tarVal);
                        displayProject = `装备适配 ${fromColor}→${toColor}`;
                    } else if (projKey.startsWith('skill')) {
                        // 技能使用实际名称
                        displayProject = `${actualProject} ${curVal}→${tarVal}`;
                    } else {
                        displayProject = `${baseLabel} ${curVal}→${tarVal}`;
                    }
                }

                if (materials && Object.values(materials).some(v => v > 0)) {
                    addPlanRow(operator, displayProject, curVal, tarVal, materials);
                    addedCount++;
                }
            }
        }
    }

    // 武器添加
    if (wpTable) {
        const rows = wpTable.querySelector('tbody').children;
        for (let i = 0; i < rows.length; i += 2) {
            const curRow = rows[i];
            const tarRow = rows[i+1];
            if (!curRow || !tarRow) continue;

            const checkCb = curRow.cells[0].querySelector('input');
            if (!checkCb || !checkCb.checked) continue;

            const weapon = curRow.cells[1].textContent;

            // 突破
            const breakCur = curRow.cells[2]?.querySelector('input');
            const breakTar = tarRow.cells[1]?.querySelector('input');
            if (breakCur && breakTar) {
                const curBreak = parseInt(breakCur.value, 10);
                const tarBreak = parseInt(breakTar.value, 10);
                if (!isNaN(curBreak) && !isNaN(tarBreak) && curBreak < tarBreak) {
                    const mats = calculateWeaponBreakMaterials(weapon, curBreak, tarBreak);
                    if (mats && Object.values(mats).some(v => v > 0)) {
                        addPlanRow(weapon, `武器突破 ${curBreak}→${tarBreak}`, curBreak, tarBreak, mats);
                        addedCount++;
                    }
                }
            }

            // 等级
            const levelCur = curRow.cells[3]?.querySelector('input');
            const levelTar = tarRow.cells[2]?.querySelector('input');
            if (levelCur && levelTar) {
                const curLevel = parseInt(levelCur.value, 10);
                const tarLevel = parseInt(levelTar.value, 10);
                if (!isNaN(curLevel) && !isNaN(tarLevel) && curLevel < tarLevel) {
                    const lvlMats = calculateWeaponLevelMaterials(curLevel, tarLevel);
                    if (lvlMats) {
                        const expMats = convertExpToMaterials(lvlMats.武器经验值);
                        const finalMats = {
                            ...expMats,
                            折金票: lvlMats.折金票,
                            武器经验值: lvlMats.武器经验值
                        };
                        addPlanRow(weapon, `武器等级 ${curLevel}→${tarLevel}`, curLevel, tarLevel, finalMats);
                        addedCount++;
                    }
                }
            }
        }
    }

    alert(`已添加 ${addedCount} 个项目到培养表`);
    window.location.hash = '#table';
}

// 更新全选状态
function updateOperatorSelectAll() {
    const opTable = document.getElementById('batchOperatorTable');
    if (!opTable) return;
    const allChecks = opTable.querySelectorAll('.op-group-check');
    const selectAll = document.getElementById('opSelectAll');
    if (!selectAll) return;
    const allChecked = Array.from(allChecks).every(cb => cb.checked);
    selectAll.checked = allChecked;
}

function updateWeaponSelectAll() {
    const wpTable = document.getElementById('batchWeaponTable');
    if (!wpTable) return;
    const allChecks = wpTable.querySelectorAll('.wp-group-check');
    const selectAll = document.getElementById('wpSelectAll');
    if (!selectAll) return;
    const allChecked = Array.from(allChecks).every(cb => cb.checked);
    selectAll.checked = allChecked;
}

// 初始化
initBatch();