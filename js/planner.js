// 培养表页面数据
// 培养表的所有操作，包括表头渲染、汇总行、计划行添加、更新合计、隐藏列等，以及培养表特有的事件绑定（干员选择、计算按钮等）。

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
    const planTable = document.getElementById('planTable');
    const oldSummary = document.getElementById('summaryRows');
    if (oldSummary) oldSummary.remove();

    const tbody = document.createElement('tbody');
    tbody.id = 'summaryRows';

    // 库存行
    const stockRow = document.createElement('tr');
    stockRow.className = 'inventory-row';
    // 前8列：第一个单元格显示“库存”，其余留空
    for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        if (i === 0) td.textContent = '库存';
        stockRow.appendChild(td);
    }
    for (let i = 0; i < 4; i++) stockRow.appendChild(document.createElement('td'));

    // 材料列
    MATERIAL_COLUMNS.forEach(mat => {
        const td = document.createElement('td');
        td.setAttribute('data-material', mat);
        if (mat === "精一经验值" || mat === "精三经验值") {
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
                if (_loading) return;
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
    tbody.appendChild(stockRow);

    // 缺少行
    const missingRow = document.createElement('tr');
    missingRow.className = 'missing-row';
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
    tbody.appendChild(missingRow);

    // 合计行
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
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
    tbody.appendChild(totalRow);

    // 插入到 thead 之后，planBody 之前
    const thead = planTable.querySelector('thead');
    thead.insertAdjacentElement('afterend', tbody);
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

    // 更新合计行
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

// 隐藏零材料列
function hideZeroColumns() {
    MATERIAL_COLUMNS.forEach(mat => {
        const totalCell = document.querySelector(`.total-value[data-material="${mat}"]`);
        const total = totalCell ? parseFloat(totalCell.textContent) || 0 : 0;
        const shouldHide = total === 0;

        // 隐藏主表格表头
        const th = document.querySelector(`#planTable thead th[data-material="${mat}"]`);
        if (th) th.style.display = shouldHide ? 'none' : '';

        // 隐藏计划行中的对应列
        document.querySelectorAll(`#planBody td[data-material="${mat}"]`).forEach(td => td.style.display = shouldHide ? 'none' : '');

        // 隐藏汇总行中的对应列（库存、缺少、合计）
        document.querySelectorAll(`#summaryRows td[data-material="${mat}"]`).forEach(td => td.style.display = shouldHide ? 'none' : '');
    });
}

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
        savePlansToStorage(); // 确保存储与 planRows 同步
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

// 初始化培养表页面
function initPlanner() {

    // 填充干员下拉
    const operatorSelect = document.getElementById('operatorSelect');
    CHARACTER_LIST.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        operatorSelect.appendChild(opt);
    });

    // 获取复选框相关元素
    const eliteCheck = document.getElementById('includeElite');
    const adapt0Check = document.getElementById('adapt0Done');
    const adapt1Check = document.getElementById('adapt1Done');
    const adapt2Check = document.getElementById('adapt2Done');
    const adaptOptions = document.getElementById('adaptOptions');
    const levelOptions = document.getElementById('levelOptions');
    const currentLevelInput = document.getElementById('currentLevel');
    const projectSelect = document.getElementById('projectSelect');

    // 为精英化复选框添加change事件
    eliteCheck.addEventListener('change', updateCheckboxVisibility);

    // 定义更新复选框可见性的函数
    function updateCheckboxVisibility() {
        // 如果不是角色等级，直接隐藏整个选项区域并返回
        if (projectSelect.value !== '角色等级') {
            levelOptions.style.display = 'none';
            return;
        }

        const cur = parseInt(currentLevelInput.value, 10);
        if (isNaN(cur)) {
            levelOptions.style.display = 'none';
            return;
        }

        // 记录当前适配复选框的勾选状态
        const adapt0Checked = adapt0Check.checked;
        const adapt1Checked = adapt1Check.checked;
        const adapt2Checked = adapt2Check.checked;

        // 精英化复选框：当前等级为 20,40,60,80 时显示
        const showElite = [20,40,60,80].includes(cur);
        eliteCheck.parentElement.style.display = showElite ? 'inline-block' : 'none';

        // 重置所有适配复选框为隐藏、可编辑
        adapt0Check.parentElement.style.display = 'none';
        adapt0Check.disabled = false;
        adapt1Check.parentElement.style.display = 'none';
        adapt1Check.disabled = false;
        adapt2Check.parentElement.style.display = 'none';
        adapt2Check.disabled = false;

        // 根据等级显示适配复选框
        if (cur >= 20) adapt0Check.parentElement.style.display = 'inline-block';
        if (cur >= 40) adapt1Check.parentElement.style.display = 'inline-block';
        if (cur >= 60) adapt2Check.parentElement.style.display = 'inline-block';

        // 强制完成：等级大于阈值时，相应适配必须已完成（勾选并禁用）
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

        // 处理阈值等级（20,40,60,80）：精英化决定对应适配的勾选和禁用
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
            // 蓝装（adapt0）：如果精英化勾选，则强制完成；否则恢复用户状态
            if (eliteChecked) {
                adapt0Check.checked = true;
                adapt0Check.disabled = true;
            } else {
                adapt0Check.checked = adapt0Checked;
                adapt0Check.disabled = false;
            }
            // 紫装（adapt1）：始终可编辑，恢复用户状态，不受精英化影响
            adapt1Check.checked = adapt1Checked;
            adapt1Check.disabled = false;
        }

        if (cur === 60) {
            // 紫装（adapt1）：如果精英化勾选，则强制完成；否则恢复用户状态
            if (eliteChecked) {
                adapt1Check.checked = true;
                adapt1Check.disabled = true;
            } else {
                adapt1Check.checked = adapt1Checked;
                adapt1Check.disabled = false;
            }
            // 金装（adapt2）：始终可编辑，恢复用户状态
            adapt2Check.checked = adapt2Checked;
            adapt2Check.disabled = false;
        }

        if (cur === 80) {
            // 金装（adapt2）：如果精英化勾选，则强制完成；否则恢复用户状态
            if (eliteChecked) {
                adapt2Check.checked = true;
                adapt2Check.disabled = true;
            } else {
                adapt2Check.checked = adapt2Checked;
                adapt2Check.disabled = false;
            }
        }

        // 对于非阈值等级，适配复选框保持用户手动状态（已被强制覆盖的除外）
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

        // 最后显示整个选项区域
        levelOptions.style.display = 'block';
    }

    // 监听当前等级输入变化
    currentLevelInput.addEventListener('input', updateCheckboxVisibility);

    operatorSelect.addEventListener('change', function() {
        document.getElementById('currentLevel').value = '';
        document.getElementById('targetLevel').value = '';

        const op = this.value;
        if (!op) {
            projectSelect.disabled = true;
            projectSelect.innerHTML = '<option value="">请先选干员</option>';
            return;
        }
        let projects = getAvailableProjects(op);
        // 过滤掉精0-4等级
        const levelProjects = ['精0等级', '精1等级', '精2等级', '精3等级', '精4等级'];
        projects = projects.filter(p => !levelProjects.includes(p));
        // 添加“角色等级”选项
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

    // projectSelect 事件监听器
    projectSelect.addEventListener('change', function() {
        const selectedProj = this.value;
        const selectedOp = operatorSelect.value;
        if (!selectedProj || !selectedOp) {
            document.getElementById('currentLevel').value = '';
            document.getElementById('targetLevel').value = '';
            updateCheckboxVisibility();
            return;
        }
        if (selectedProj === '角色等级') {
            document.getElementById('currentLevel').value = 1;
            document.getElementById('targetLevel').value = 90;
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
            document.getElementById('currentLevel').value = minRow.现等级;
            document.getElementById('targetLevel').value = minRow.目标等级;
        } else {
            document.getElementById('currentLevel').value = '';
            document.getElementById('targetLevel').value = '';
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
                addPlanRow(op, `角色等级-装备适配(${adaptInfo.from}→${adaptInfo.to})`, adaptInfo.from, adaptInfo.to, adaptInfo.materials);
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

    // 计算精英阶段材料及实际范围
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
                    // 未来阶段，必须添加
                    const stageRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
                    if (stageRes) {
                        MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                        if (minFrom === null || eliteStages[i].from < minFrom) minFrom = eliteStages[i].from;
                        if (maxTo === null || eliteStages[i].to > maxTo) maxTo = eliteStages[i].to;
                    }
                } else if (现等级 === threshold && !eliteDone) {
                    // 当前阶段且未完成，添加
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

    // 计算装备适配材料及实际范围
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
            // 如果目标等级需要跨越该门槛（目标 > threshold），且当前等级还在该阶段的有效区间内（现等级 < threshold + 20），且该阶段未完成，则添加
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

    // 初次渲染（表头、汇总行）
    renderTableHeader();
    createSummaryRows();
    updateExpValues();
    hideZeroColumns();

    // 加载计划数据
    loadPlansFromStorage();
}