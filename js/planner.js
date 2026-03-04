// 培养表页面数据

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
            input.type = 'number';
            input.value = '0';
            input.min = '0';
            input.className = 'stock-input stock-value';
            input.dataset.material = mat;
            input.addEventListener('input', function() {
                let val = parseInt(this.value, 10);
                if (isNaN(val)) {
                    this.value = 0;
                } else {
                    const min = parseInt(this.min, 10);
                    if (val < min) this.value = min;
                }
                if (_loading) return;
                const expMaterials = ["高级作战记录","中级作战记录","初级作战记录","高级认知载体","初级认知载体",
                                    "武器检查单元","武器检查装置","武器检查套组"];
                if (expMaterials.includes(mat)) {
                    updateExpValues();
                } else {
                    updateMissingRow();
                }
                saveStockToStorage();
                const stockInput = document.querySelector(`#page-stock .stock-input[data-material="${mat}"]`);
                if (stockInput) stockInput.value = this.value;
                if (typeof refreshPlan === 'function') refreshPlan();
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

// 更新缺少行
function updateMissingRow() {
    const totals = {};
    MATERIAL_COLUMNS.forEach(mat => {
        const totalCell = document.querySelector(`.total-value[data-material="${mat}"]`);
        totals[mat] = totalCell ? parseFloat(totalCell.textContent) || 0 : 0;
    });

    MATERIAL_COLUMNS.forEach(mat => {
        const stockElement = document.querySelector(`.stock-value[data-material="${mat}"]`);
        let stock = 0;
        if (stockElement) {
            if (stockElement.tagName === 'INPUT') {
                stock = parseFloat(stockElement.value) || 0;
            } else {
                stock = parseFloat(stockElement.textContent) || 0;
            }
        }
        const missing = Math.max(0, totals[mat] - stock);
        const missingCell = document.querySelector(`.missing-value[data-material="${mat}"]`);
        if (missingCell) missingCell.textContent = missing;
    });
}

// 添加计划行
function addPlanRow(operator, project, curLv, tarLv, materialObj, skipSave = false) {
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
    const doneChk = document.createElement('input');
    doneChk.type = 'checkbox';
    doneChk.className = 'complete-checkbox';
    doneChk.addEventListener('change', function() {
        updateSummaryRows();
        row.classList.toggle('completed-row', this.checked);
    });
    tdDone.appendChild(doneChk);
    row.appendChild(tdDone);

    // 隐藏列
    const tdHide = document.createElement('td');
    const hideChk = document.createElement('input');
    hideChk.type = 'checkbox';
    hideChk.className = 'hide-checkbox';
    hideChk.addEventListener('change', function() {
        if (this.checked) {
            row.classList.add('hidden-row');
        } else {
            row.classList.remove('hidden-row');
        }
        updateSummaryRows();
    });
    tdHide.appendChild(hideChk);
    row.appendChild(tdHide);

    // 干员
    const tdOp = document.createElement('td');
    tdOp.textContent = operator;
    row.appendChild(tdOp);

    // 升级项目
    const tdProj = document.createElement('td');
    tdProj.textContent = project;
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

    planRows.push({
        干员: operator,
        项目: project,
        现等级: curLv,
        目标等级: tarLv,
        materials: MATERIAL_COLUMNS.reduce((acc, mat) => {
            acc[mat] = materialObj[mat] || 0;
            return acc;
        }, {})
    });

    updateSummaryRows();
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
            addPlanRow(p.干员, p.项目, p.现等级, p.目标等级, p.materials, true);
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

    document.getElementById('addRowBtn').addEventListener('click', function() {
        alert("手动添加行功能暂未实现，请使用计算按钮添加。（别问，这个按钮纯用来占位的）");
    });

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