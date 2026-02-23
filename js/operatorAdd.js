// 干员添加页面逻辑

let currentOperator = ''; // 存储当前干员的所有项目及范围信息
let projectColumns = []; // 存储列定义 { key, label, min, max }

// 初始化干员添加页面
function initOperatorAdd() {
    const addOperatorSelect = document.getElementById('addOperatorSelect');
    if (!addOperatorSelect) return;

    // 先添加一个空的“请选择”选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择';
    addOperatorSelect.appendChild(defaultOption);

    // 填充干员下拉
    CHARACTER_LIST.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        addOperatorSelect.appendChild(opt);
    });

    // 默认选中“请选择”
    addOperatorSelect.value = '';

    // 干员变化时重新生成表格
    addOperatorSelect.addEventListener('change', function() {
        currentOperator = this.value;
        if (currentOperator) {
            generateHorizontalTable(currentOperator);
        } else {
            clearTable(); // 清空表格
        }
    });

    // 快捷按钮事件
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            applyQuickTarget(target);
        });
    });

    // 计算需求按钮
    document.getElementById('calcDemandBtn').addEventListener('click', calculateDemandHorizontal);

    // 添加全部到计算器按钮
    document.getElementById('addAllToPlannerBtn').addEventListener('click', addAllToPlanner);

    // 初始时不生成表格
    clearTable();
}

// 清空表格
function clearTable() {
    document.getElementById('operatorProjectHeader').innerHTML = '';
    document.getElementById('operatorProjectBody').innerHTML = '';
    projectColumns = [];
}

// 生成表格
function generateHorizontalTable(operator) {
    const headerRow = document.getElementById('operatorProjectHeader');
    const tbody = document.getElementById('operatorProjectBody');
    headerRow.innerHTML = '';
    tbody.innerHTML = '';

    // 获取干员可用项目（判断天赋、基建等是否存在）
    const available = getAvailableProjects(operator);

    // 定义所有可能的列（顺序固定）
    const columnDefs = [
        { key: 'elite', label: '精英阶段', min: 0, max: 4 },
        { key: 'level', label: '等级', min: 1, max: 90 }
    ];

    // 添加技能列（1-4）
    for (let i = 1; i <= 4; i++) {
        const skillName = getSkillName(operator, i);
        columnDefs.push({ key: `skill${i}`, label: skillName, min: 0, max: 12 });
    }

    // 天赋
    if (available.includes('天赋')) {
        columnDefs.push({ key: 'talent', label: '天赋', min: 0, max: 4 });
    }

    // 基建
    if (available.includes('基建')) {
        columnDefs.push({ key: 'base', label: '基建', min: 0, max: 4 });
    }

    // 信赖
    if (available.includes('能力值（信赖）')) {
        columnDefs.push({ key: 'trust', label: '信赖', min: 0, max: 4 });
    }

    projectColumns = columnDefs;

    // 生成表头：一个空单元格（用于放置行标题）+ 每个项目的名称
    const headerTr = document.createElement('tr');
    // 第一个单元格留空（对应行标题列）
    headerTr.appendChild(document.createElement('th'));
    columnDefs.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        headerTr.appendChild(th);
    });
    headerRow.appendChild(headerTr);

    // 生成目前等级行
    const curRow = document.createElement('tr');
    const curLabelCell = document.createElement('td');
    curLabelCell.textContent = '目前等级';
    curLabelCell.style.fontWeight = 'bold';
    curRow.appendChild(curLabelCell);

    columnDefs.forEach(col => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = col.min;
        input.max = col.max;
        if (col.key.startsWith('skill')) {
            input.value = 1;
        } else {
            input.value = col.min;
        }
        input.classList.add('project-cur');
        input.dataset.key = col.key;
        // 修改：失去焦点时进行钳位
        input.addEventListener('blur', function(e) {
            let val = parseInt(this.value, 10);
            if (isNaN(val)) {
                this.value = this.min; // 若为空，恢复最小值
                return;
            }
            const min = parseInt(this.min, 10);
            const max = parseInt(this.max, 10);
            if (val < min) this.value = min;
            else if (val > max) this.value = max;
        });
        td.appendChild(input);
        curRow.appendChild(td);
    });
    tbody.appendChild(curRow); // 追加curRow至tbody

    // 生成培养目标行
    const tarRow = document.createElement('tr');
    const tarLabelCell = document.createElement('td');
    tarLabelCell.textContent = '培养目标';
    tarLabelCell.style.fontWeight = 'bold';
    tarRow.appendChild(tarLabelCell);

    columnDefs.forEach(col => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = col.min;
        input.max = col.max;
        if (col.key.startsWith('skill')) {
            input.value = 1;
        } else {
            input.value = col.min;
        }
        input.classList.add('project-tar');
        input.dataset.key = col.key;
        // 修改：失去焦点时进行钳位
        input.addEventListener('blur', function(e) {
            let val = parseInt(this.value, 10);
            if (isNaN(val)) {
                this.value = this.min;
                return;
            }
            const min = parseInt(this.min, 10);
            const max = parseInt(this.max, 10);
            if (val < min) this.value = min;
            else if (val > max) this.value = max;
        });
        td.appendChild(input);
        tarRow.appendChild(td);
    });
    tbody.appendChild(tarRow); // 追加tarRow至tbody

    // 为等级培养目标添加联动事件：自动调整精英阶段
    const levelTarInputs = document.querySelectorAll('.project-tar[data-key="level"]');
    levelTarInputs.forEach(input => {
        input.addEventListener('input', function() {
            const tar = parseInt(this.value, 10);
            if (isNaN(tar)) return;

            let requiredElite = 0;
            if (tar >= 80) requiredElite = 4;
            else if (tar >= 60) requiredElite = 3;
            else if (tar >= 40) requiredElite = 2;
            else if (tar >= 20) requiredElite = 1;
            else requiredElite = 0;

            const eliteTarInput = document.querySelector('.project-tar[data-key="elite"]');
            if (!eliteTarInput) return;
            const maxElite = parseInt(eliteTarInput.max, 10);
            const newEliteTar = Math.min(requiredElite, maxElite);
            eliteTarInput.value = newEliteTar;
        });
    });
}

// 获取技能实际名称
function getSkillName(operator, index) {
    const row = SKILL_MAPPING.find(r => r.干员 === operator);
    if (row) {
        return row[`技能${index}`] || `技能${index}`;
    }
    return `技能${index}`;
}

// 应用快捷目标
function applyQuickTarget(target) {
    const curInputs = document.querySelectorAll('.project-cur');
    const tarInputs = document.querySelectorAll('.project-tar');
    if (curInputs.length === 0 || tarInputs.length === 0) return;

    tarInputs.forEach(input => {
        const key = input.dataset.key;
        switch (target) {
            case 'elite1':
                if (key === 'elite') input.value = 1;
                if (key === 'level') input.value = 40;
                break;
            case 'elite2':
                if (key === 'elite') input.value = 2;
                if (key === 'level') input.value = 60;
                break;
            case 'elite3':
                if (key === 'elite') input.value = 3;
                if (key === 'level') input.value = 80;
                break;
            case 'elite4':
                if (key === 'elite') input.value = 4;
                if (key === 'level') input.value = 90;
                break;
            case 'full':
                if (key === 'elite') input.value = 4;
                if (key === 'level') input.value = 90;
                if (key.startsWith('skill')) input.value = 12;
                if (key === 'talent') input.value = 4;
                if (key === 'base') input.value = 4;
                if (key === 'trust') input.value = 4;
                break;
        }
    });
}

// 计算需求
function calculateDemandHorizontal() {
    const operator = currentOperator;
    if (!operator) {
        alert('请先选择干员');
        return;
    }

    const curInputs = document.querySelectorAll('.project-cur');
    const tarInputs = document.querySelectorAll('.project-tar');
    if (curInputs.length === 0 || tarInputs.length === 0) return;

    const demands = [];

    for (let i = 0; i < curInputs.length; i++) {
        const curInput = curInputs[i];
        const tarInput = tarInputs[i];
        const key = curInput.dataset.key;
        const cur = parseInt(curInput.value, 10);
        const tar = parseInt(tarInput.value, 10);
        if (isNaN(cur) || isNaN(tar) || cur === tar) continue;

        if (key === 'elite') {
            // 精英阶段合并
            let totalMaterials = {};
            MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] = 0);
            for (let e = cur; e < tar; e++) {
                const res = calculateMaterials(operator, '精英阶段', e, e+1);
                if (res) {
                    MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] += res[mat] || 0);
                }
            }
            if (Object.values(totalMaterials).some(v => v > 0)) {
                demands.push({
                    project: `精英阶段 ${cur}→${tar}`,
                    from: cur,
                    to: tar,
                    materials: totalMaterials
                });
            }

        } else if (key === 'level') {
            // 计算升级材料
            const levelRes = calculateLevelMaterials(operator, cur, tar);
            if (levelRes && Object.values(levelRes).some(v => v > 0)) {
                demands.push({
                    project: '角色等级-升级',
                    from: cur,
                    to: tar,
                    materials: levelRes
                });
            }

            // 计算装备适配材料（合并）
            let adaptTotal = {};
            MATERIAL_COLUMNS.forEach(mat => adaptTotal[mat] = 0);
            let minAdaptFrom = null, maxAdaptTo = null;
            const adaptStages = [
                { threshold: 20, from: 0, to: 1 }, // 蓝装
                { threshold: 40, from: 1, to: 2 }, // 紫装
                { threshold: 60, from: 2, to: 3 }  // 金装
            ];
            for (let stage of adaptStages) {
                if (cur < stage.threshold && tar > stage.threshold) {
                    const adaptRes = calculateMaterials(operator, '装备适配', stage.from, stage.to);
                    if (adaptRes && Object.values(adaptRes).some(v => v > 0)) {
                        MATERIAL_COLUMNS.forEach(mat => adaptTotal[mat] += adaptRes[mat] || 0);
                        if (minAdaptFrom === null || stage.from < minAdaptFrom) minAdaptFrom = stage.from;
                        if (maxAdaptTo === null || stage.to > maxAdaptTo) maxAdaptTo = stage.to;
                    }
                }
            }
            if (minAdaptFrom !== null && maxAdaptTo !== null && Object.values(adaptTotal).some(v => v > 0)) {
                const fromColor = mapAdaptLevelToColor(minAdaptFrom);
                const toColor = mapAdaptLevelToColor(maxAdaptTo);
                demands.push({
                    project: `装备适配 ${fromColor}→${toColor}`,
                    from: minAdaptFrom,
                    to: maxAdaptTo,
                    materials: adaptTotal
                });
            }

        } else if (key.startsWith('skill')) {
            // 技能
            const skillIndex = parseInt(key.replace('skill', ''), 10);
            const skillName = getSkillName(operator, skillIndex);
            const res = calculateMaterials(operator, skillName, cur, tar);
            if (res && Object.values(res).some(v => v > 0)) {
                demands.push({
                    project: `${skillName} ${cur}→${tar}`,
                    from: cur,
                    to: tar,
                    materials: res
                });
            }

       } else if (key === 'talent') {
        // 天赋
            const res = calculateMaterials(operator, '天赋', cur, tar);
            if (res && Object.values(res).some(v => v > 0)) {
                demands.push({
                    project: `天赋 ${cur}→${tar}`,
                    from: cur,
                    to: tar,
                    materials: res
                });
            }

        } else if (key === 'base') {
            // 基建
            const res = calculateMaterials(operator, '基建', cur, tar);
            if (res && Object.values(res).some(v => v > 0)) {
                demands.push({
                    project: `基建 ${cur}→${tar}`,
                    from: cur,
                    to: tar,
                    materials: res
                });
            }
            
        } else if (key === 'trust') {
            // 信赖
            const res = calculateMaterials(operator, '能力值（信赖）', cur, tar);
            if (res && Object.values(res).some(v => v > 0)) {
                demands.push({
                    project: `信赖 ${cur}→${tar}`,
                    from: cur,
                    to: tar,
                    materials: res
                });
            }
        }
    }

    // 渲染需求表格（带图标）
    const demandBody = document.getElementById('demandBody');
    demandBody.innerHTML = '';
    // 初始化材料总和对象
    const totalMaterials = {};
    MATERIAL_COLUMNS.forEach(mat => totalMaterials[mat] = 0);
    demands.forEach(d => {
        const row = document.createElement('tr');

        // 项目
        const tdProj = document.createElement('td');
        tdProj.textContent = d.project;
        row.appendChild(tdProj);

        // 现等级
        const tdFrom = document.createElement('td');
        if (d.project.includes('装备适配')) {
            tdFrom.textContent = mapAdaptLevelToColor(d.from);
        } else {
            tdFrom.textContent = d.from;
        }
        row.appendChild(tdFrom);

        // 目标等级
        const tdTo = document.createElement('td');
        if (d.project.includes('装备适配')) {
            tdTo.textContent = mapAdaptLevelToColor(d.to);
        } else {
            tdTo.textContent = d.to;
        }
        row.appendChild(tdTo);

        // 所需材料（图标 + 名称 + 数量）
        const tdMat = document.createElement('td');
        const matSpans = [];
        MATERIAL_COLUMNS.forEach(mat => {
            if (d.materials[mat] > 0) {
                const div = document.createElement('div');
                div.style.display = 'inline-block';
                div.style.marginRight = '20px';
                div.style.marginBottom = '4px';
                div.style.whiteSpace = 'nowrap';
                
                const icon = document.createElement('img');
                icon.src = MATERIAL_ICONS[mat] || DEFAULT_ICON;
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '6px';
                icon.style.verticalAlign = 'middle';
                div.appendChild(icon);
                
                const text = document.createTextNode(`${mat} ×${d.materials[mat]}`);
                div.appendChild(text);
                
                matSpans.push(div);
            }
        });
        if (matSpans.length === 0) {
            tdMat.textContent = '无';
        } else {
            matSpans.forEach(div => tdMat.appendChild(div));
        }
        row.appendChild(tdMat);

        // 累加材料到总和
        MATERIAL_COLUMNS.forEach(mat => {
            totalMaterials[mat] += d.materials[mat] || 0;
        });

        demandBody.appendChild(row);
    });

    
    // 添加总和行
    if (demands.length > 0) {
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-sum-row'; // 可选样式

        // 项目列
        const tdProj = document.createElement('td');
        tdProj.textContent = '总和';
        tdProj.style.fontWeight = 'bold';
        totalRow.appendChild(tdProj);

        // 现等级列（留空）
        const tdFrom = document.createElement('td');
        tdFrom.textContent = '-';
        totalRow.appendChild(tdFrom);

        // 目标等级列（留空）
        const tdTo = document.createElement('td');
        tdTo.textContent = '-';
        totalRow.appendChild(tdTo);

        // 所需材料列
        const tdMat = document.createElement('td');
        const matSpans = [];
        MATERIAL_COLUMNS.forEach(mat => {
            if (totalMaterials[mat] > 0) {
                const div = document.createElement('div');
                div.style.display = 'inline-block';
                div.style.marginRight = '20px';
                div.style.marginBottom = '4px';
                div.style.whiteSpace = 'nowrap';
                
                const icon = document.createElement('img');
                icon.src = MATERIAL_ICONS[mat] || DEFAULT_ICON;
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '6px';
                icon.style.verticalAlign = 'middle';
                div.appendChild(icon);
                
                const text = document.createTextNode(`${mat} ×${totalMaterials[mat]}`);
                div.appendChild(text);
                
                matSpans.push(div);
            }
        });
        if (matSpans.length === 0) {
            tdMat.textContent = '无';
        } else {
            matSpans.forEach(div => tdMat.appendChild(div));
        }
        totalRow.appendChild(tdMat);

        demandBody.appendChild(totalRow);
    }

    // 存储需求数据供添加使用
    window.currentDemands = demands;
}

// 添加全部到计算器
function addAllToPlanner() {
    if (!window.currentDemands || window.currentDemands.length === 0) {
        alert('请先点击“计算需求”生成材料列表');
        return;
    }

    const operator = currentOperator;
    window.currentDemands.forEach(d => {
        // 从项目名中解析原始项目名和等级
        addPlanRow(operator, d.project, d.from, d.to, d.materials);
    });

    alert(`已添加 ${window.currentDemands.length} 个项目到培养表`);

    // 重置干员添加页面
    const addOperatorSelect = document.getElementById('addOperatorSelect');
    if (addOperatorSelect) {
        addOperatorSelect.value = ''; // 设为“请选择”
        addOperatorSelect.dispatchEvent(new Event('change')); // 触发 change 事件，自动清空表格
    }

    // 清空需求表格
    const demandBody = document.getElementById('demandBody');
    if (demandBody) demandBody.innerHTML = '';

    // 重置全局变量
    currentOperator = '';
    projectColumns = [];
    window.currentDemands = [];

    // 跳转到培养表
    window.location.hash = '#table';
}