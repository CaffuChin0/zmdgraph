// 干员添加页面数据
function updateAddProjectChecklist(operator) {
    const container = document.getElementById('projectChecklist');
    container.innerHTML = '';
    const projects = getAvailableProjects(operator);
    projects.forEach(proj => {
        const div = document.createElement('div');
        const label = document.createElement('label');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'project-check';
        chk.value = proj;
        label.appendChild(chk);
        label.appendChild(document.createTextNode(proj));
        div.appendChild(label);
        container.appendChild(div);
    });
}

function initOperatorAdd() {
    const addOperatorSelect = document.getElementById('addOperatorSelect');
    if (!addOperatorSelect) return;

    // 默认“请选择”选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择';
    addOperatorSelect.appendChild(defaultOption);

    // 填充干员列表
    CHARACTER_LIST.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        addOperatorSelect.appendChild(opt);
    });

    // 监听变化，更新项目复选框
    addOperatorSelect.addEventListener('change', function() {
        if (this.value) {
            updateAddProjectChecklist(this.value);
        } else {
            const container = document.getElementById('projectChecklist');
            if (container) container.innerHTML = '';
        }
    });

    // “从0到全满”按钮（暂未实现）
    document.getElementById('addFullPlan').addEventListener('click', function() {
        alert('该功能正在开发中');
    });

    // “添加全部到计算器”按钮
    document.getElementById('addSelectedToPlanner').addEventListener('click', function() {
        const operator = addOperatorSelect.value;
        if (!operator) { alert('请选择干员'); return; }
        const cur = parseInt(document.getElementById('addCurrentLevel').value, 10);
        const tar = parseInt(document.getElementById('addTargetLevel').value, 10);
        if (isNaN(cur) || isNaN(tar)) { alert('请输入有效的等级'); return; }
        const checkedBoxes = document.querySelectorAll('#projectChecklist input[type="checkbox"]:checked');
        if (checkedBoxes.length === 0) { alert('请至少勾选一个项目'); return; }

        let addedCount = 0;
        checkedBoxes.forEach(cb => {
            const proj = cb.value;
            const result = calculateMaterials(operator, proj, cur, tar);
            if (result) {
                addPlanRow(operator, proj, cur, tar, result);
                addedCount++;
            } else {
                console.warn(`项目 ${proj} 从 ${cur} 到 ${tar} 无材料数据，已跳过`);
            }
        });
        alert(`成功添加 ${addedCount} 个项目到培养表`);
        window.location.hash = '#table';
    });
}