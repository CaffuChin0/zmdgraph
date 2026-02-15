// ==================== 全局变量 ====================
let planRows = [];
let _loading = false; // 加载数据时设为 true，避免保存

// ==================== DOM 操作函数 ====================


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

// 保存库存
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

//加载计划
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
        savePlansToStorage(); // 确保存储与 planRows 同步
    } catch (e) {
        console.error('加载失败', e);
        _loading = false;
    }
}

//加载库存
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

// 动态生成表头（包含图标）
function renderTableHeader() {
    const theadRow = document.querySelector('#planTable thead tr');
    MATERIAL_COLUMNS.forEach(mat => {
        const th = document.createElement('th');
        th.setAttribute('data-material', mat); // 新增
        const icon = document.createElement('img');
        icon.src = MATERIAL_ICONS[mat] || DEFAULT_ICON;
        icon.style.width = '20px';
        icon.style.height = '20px';
        icon.style.marginRight = '5px';
        icon.style.verticalAlign = 'middle';
        th.appendChild(icon);
        th.appendChild(document.createTextNode(mat));
        theadRow.appendChild(th);
    });
}

// 创建底部汇总行
function createSummaryRows() {
    const summaryTbody = document.getElementById('summaryRows');
    summaryTbody.innerHTML = '';

    // 库存行
    const stockRow = document.createElement('tr');
    stockRow.className = 'inventory-row';
    stockRow.id = 'stockRow';
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        if (i === 0) td.textContent = '库存';
        stockRow.appendChild(td);
    }
    for (let i = 0; i < 4; i++) stockRow.appendChild(document.createElement('td'));

    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        if (mat === "精一经验值" || mat === "精三经验值") {
            // 经验值列显示为不可编辑的文本
            const span = document.createElement('span');
            span.className = 'stock-value exp-display';
            span.dataset.material = mat;
            span.textContent = '0';
            td.appendChild(span);
        } else {
            // 其他材料列可输入
            const input = document.createElement('input');
            input.type = 'number';
            input.value = '0';
            input.min = '0';
            input.className = 'stock-input stock-value';
            input.dataset.material = mat;
            input.addEventListener('input', function() {
                if (_loading) return;
                // 如果是经验卡输入，更新经验值；否则直接更新缺少
                if (["高级作战记录","中级作战记录","初级作战记录","高级认知载体","初级认知载体"].includes(mat)) {
                    updateExpValues();
                } else {
                    updateMissingRow();
                }
                saveStockToStorage();
            });
            td.appendChild(input);
        }
        stockRow.appendChild(td);
    });
    summaryTbody.appendChild(stockRow);


    // 缺少行
    const missingRow = document.createElement('tr');
    missingRow.className = 'missing-row';
    missingRow.id = 'missingRow';
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
    summaryTbody.appendChild(missingRow);

    // 合计行
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.id = 'totalRow';
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
    summaryTbody.appendChild(totalRow);
}

// 更新合计行和缺少行
function updateSummaryRows() {
    const totals = {};
    MATERIAL_COLUMNS.forEach(mat => totals[mat] = 0);

    const rows = document.querySelectorAll('#planBody tr');
    rows.forEach(row => {
        const hideChk = row.querySelector('.hide-checkbox');
        const completeChk = row.querySelector('.complete-checkbox');
        // 如果隐藏或完成被勾选，则跳过该行
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

// 根据经验卡库存更新精一/精三经验值显示
function updateExpValues() {
    const 高级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="高级作战记录"]')?.value) || 0;
    const 中级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="中级作战记录"]')?.value) || 0;
    const 初级作战记录 = parseFloat(document.querySelector('.stock-input[data-material="初级作战记录"]')?.value) || 0;
    const 高级认知载体 = parseFloat(document.querySelector('.stock-input[data-material="高级认知载体"]')?.value) || 0;
    const 初级认知载体 = parseFloat(document.querySelector('.stock-input[data-material="初级认知载体"]')?.value) || 0;

    const 精一经验值 = 高级作战记录 * 10000 + 中级作战记录 * 1000 + 初级作战记录 * 200;
    const 精三经验值 = 高级认知载体 * 10000 + 初级认知载体 * 1000;

    const exp1Span = document.querySelector('.stock-value[data-material="精一经验值"]');
    const exp3Span = document.querySelector('.stock-value[data-material="精三经验值"]');
    if (exp1Span) exp1Span.textContent = 精一经验值;
    if (exp3Span) exp3Span.textContent = 精三经验值;

    updateMissingRow(); // 重新计算缺少
}

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
function addPlanRow(operator, project, curLv, tarLv, materialObj,skipSave = false) {
    const tbody = document.getElementById('planBody');
    const row = document.createElement('tr');

    // 头像列
    const tdAvatar = document.createElement('td');
    const avatarImg = document.createElement('img');
    avatarImg.style.maxWidth = '50px';
    avatarImg.style.maxHeight = '50px';
    avatarImg.src = OPERATOR_AVATARS[operator] || DEFAULT_AVATAR;
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
    tdCur.textContent = curLv;
    row.appendChild(tdCur);

    // 目标等级
    const tdTar = document.createElement('td');
    tdTar.textContent = tarLv;
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
}

function hideZeroColumns() {
    MATERIAL_COLUMNS.forEach(mat => {
        const totalCell = document.querySelector(`.total-value[data-material="${mat}"]`);
        const total = totalCell ? parseFloat(totalCell.textContent) || 0 : 0;
        const shouldHide = total === 0;

        // 隐藏表头
        const th = document.querySelector(`#planTable thead th[data-material="${mat}"]`);
        if (th) th.style.display = shouldHide ? 'none' : '';

        // 隐藏计划行中的对应列
        document.querySelectorAll(`#planBody td[data-material="${mat}"]`).forEach(td => td.style.display = shouldHide ? 'none' : '');

        // 隐藏汇总行中的对应列（库存、缺少、合计）
        document.querySelectorAll(`#summaryRows td[data-material="${mat}"]`).forEach(td => td.style.display = shouldHide ? 'none' : '');
    });
}

// ==================== 初始化 ====================
window.onload = function() {
    renderTableHeader();
    createSummaryRows();
    updateExpValues(); // 初始化经验值显示
    hideZeroColumns(); // 初始隐藏
    loadPlansFromStorage(); // 最后加载存储计划的数据
    loadStockFromStorage(); // 最后加载存储库存的数据

    const operatorSelect = document.getElementById('operatorSelect');
    CHARACTER_LIST.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        operatorSelect.appendChild(opt);
    });

    const projectSelect = document.getElementById('projectSelect');

    operatorSelect.addEventListener('change', function() {
        // 清空等级输入
        document.getElementById('currentLevel').value = '';
        document.getElementById('targetLevel').value = '';

        const op = this.value;
        if (!op) {
            projectSelect.disabled = true;
            projectSelect.innerHTML = '<option value="">请先选干员</option>';
            return;
        }
        const projects = getAvailableProjects(op);
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
        if (!selectedProj || !selectedOp) {
            document.getElementById('currentLevel').value = '';
            document.getElementById('targetLevel').value = '';
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
            document.getElementById('currentLevel').value = minRow.现等级;
            document.getElementById('targetLevel').value = minRow.目标等级;
        } else {
            document.getElementById('currentLevel').value = '';
            document.getElementById('targetLevel').value = '';
        }
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
        const result = calculateMaterials(op, proj, cur, tar);
        if (result) {
            addPlanRow(op, proj, cur, tar, result);
            document.getElementById('currentLevel').value = '';
            document.getElementById('targetLevel').value = '';
        } else {
            alert("未找到对应材料数据，请确定是否填写正确，如填写正确无数据，请反馈bug给底下联系人");
        }
    });

    document.getElementById('addRowBtn').addEventListener('click', function() {
        alert("手动添加行功能暂未实现，请使用计算按钮添加。（别问，这个按钮纯用来占位的）");
    });
};