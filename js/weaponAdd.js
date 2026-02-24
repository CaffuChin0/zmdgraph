// 武器添加页面逻辑

let currentWeapon = ''; // 当前选中的武器
let weaponColumns = []; // 列定义 [{ key, label, min, max }]

// 武器列表（按星级分组）
const WEAPON_LIST = [
    // 3星
    { name: "达尔霍夫7", star: 3 },
    { name: "奥佩罗77", star: 3 },
    { name: "吉米尼12", star: 3 },
    { name: "佩科5", star: 3 },
    { name: "塔尔11", star: 3 },

    // 4星
    { name: "工业零点一", star: 4 },
    { name: "淬火者", star: 4 },
    { name: "天使杀手", star: 4 },
    { name: "荧光雷羽", star: 4 },
    { name: "全自动骇新星", star: 4 },
    { name: "应急手段", star: 4 },
    { name: "寻路者道标", star: 4 },
    { name: "呼啸守卫", star: 4 },
    { name: "长路", star: 4 },
    { name: "浪潮", star: 4 },

    // 5星
    { name: "作品：众生", star: 5 },
    { name: "探骊", star: 5 },
    { name: "终点之声", star: 5 },
    { name: "古渠", star: 5 },
    { name: "O.B.J.重荷", star: 5 },
    { name: "坚城铸造者", star: 5 },
    { name: "迷失荒野", star: 5 },
    { name: "十二问", star: 5 },
    { name: "悼亡诗", star: 5 },
    { name: "莫奈何", star: 5 },
    { name: "逐鳞3.0", star: 5 },
    { name: "布道自由", star: 5 },
    { name: "向心之引", star: 5 },
    { name: "O.B.J.术识", star: 5 },
    { name: "嵌合正义", star: 5 },
    { name: "O.B.J.尖峰", star: 5 },
    { name: "理性告别", star: 5 },
    { name: "O.B.J.迅极", star: 5 },
    { name: "钢铁余音", star: 5 },
    { name: "仰止", star: 5 },
    { name: "O.B.J.轻芒", star: 5 },

    // 6星
    { name: "遗忘", star: 6 },
    { name: "典范", star: 6 },
    { name: "破碎君王", star: 6 },
    { name: "昔日精品", star: 6 },
    { name: "大雷斑", star: 6 },
    { name: "骑士精神", star: 6 },
    { name: "显赫声名", star: 6 },
    { name: "扶摇", star: 6 },
    { name: "赫拉芬格", star: 6 },
    { name: "作品：蚀迹", star: 6 },
    { name: "黯色火炬", star: 6 },
    { name: "爆破单元", star: 6 },
    { name: "使命必达", star: 6 },
    { name: "沧溟星梦", star: 6 },
    { name: "骁勇", star: 6 },
    { name: "J.E.T.", star: 6 },
    { name: "负山", star: 6 },
    { name: "艺术暴君", star: 6 },
    { name: "白夜新星", star: 6 },
    { name: "领航者", star: 6 },
    { name: "楔子", star: 6 },
    { name: "熔铸火焰", star: 6 },
    { name: "同类相食", star: 6 },
    { name: "不知归", star: 6 },
    { name: "热熔切割器", star: 6 },
    { name: "宏愿", star: 6 }
];

// 武器突破4特有材料表
const WEAPON_BREAK_4_SPECIAL = {
    // 3星
    "达尔霍夫7": { 三相纳米片: 16, 燎石: 8 },
    "奥佩罗77": { 超距辉映管: 16, 燎石: 8 },
    "吉米尼12": { 快子遴捡晶格: 16, 燎石: 8 },
    "佩科5": { 象限拟合液: 16, 武陵石: 8 },
    "塔尔11": { D96钢样品四: 16, 武陵石: 8 },

    // 4星
    "工业零点一": { 象限拟合液: 16, 燎石: 8 },
    "淬火者": { 三相纳米片: 16, 武陵石: 8 },
    "天使杀手": { D96钢样品四: 16, 武陵石: 8 },
    "荧光雷羽": { 超距辉映管: 16, 武陵石: 8 },
    "全自动骇新星": { 三相纳米片: 16, 燎石: 8 },
    "应急手段": { 快子遴捡晶格: 16, 燎石: 8 },
    "寻路者道标": { 超距辉映管: 16, 燎石: 8 },
    "呼啸守卫": { D96钢样品四: 16, 燎石: 8 },
    "长路": { 快子遴捡晶格: 16, 武陵石: 8 },
    "浪潮": { 象限拟合液: 16, 武陵石: 8 },

    // 5星
    "作品：众生": { 超距辉映管: 16, 武陵石: 8 },
    "探骊": { D96钢样品四: 16, 燎石: 8 },
    "终点之声": { 象限拟合液: 16, 燎石: 8 },
    "古渠": { 三相纳米片: 16, 武陵石: 8 },
    "O.B.J.重荷": { 快子遴捡晶格: 16, 武陵石: 8 },
    "坚城铸造者": { 快子遴捡晶格: 16, 燎石: 8 },
    "迷失荒野": { 快子遴捡晶格: 16, 燎石: 8 },
    "十二问": { 超距辉映管: 16, 武陵石: 8 },
    "悼亡诗": { 象限拟合液: 16, 武陵石: 8 },
    "莫奈何": { 三相纳米片: 16, 燎石: 8 },
    "逐鳞3.0": { 超距辉映管: 16, 燎石: 8 },
    "布道自由": { D96钢样品四: 16, 武陵石: 8 },
    "向心之引": { 快子遴捡晶格: 16, 武陵石: 8 },
    "O.B.J.术识": { 超距辉映管: 16, 燎石: 8 },
    "嵌合正义": { 超距辉映管: 16, 燎石: 8 },
    "O.B.J.尖峰": { 象限拟合液: 16, 燎石: 8 },
    "理性告别": { 三相纳米片: 16, 燎石: 8 },
    "O.B.J.迅极": { 三相纳米片: 16, 武陵石: 8 },
    "钢铁余音": { D96钢样品四: 16, 武陵石: 8 },
    "仰止": { 象限拟合液: 16, 武陵石: 8 },
    "O.B.J.轻芒": { D96钢样品四: 16, 燎石: 8 },

    // 6星
    "遗忘": { 超距辉映管: 16, 燎石: 8 },
    "典范": { 三相纳米片: 16, 燎石: 8 },
    "破碎君王": { D96钢样品四: 16, 燎石: 8 },
    "昔日精品": { 超距辉映管: 16, 武陵石: 8 },
    "大雷斑": { D96钢样品四: 16, 燎石: 8 },
    "骑士精神": { D96钢样品四: 16, 武陵石: 8 },
    "显赫声名": { 快子遴捡晶格: 16, 武陵石: 8 },
    "扶摇": { 超距辉映管: 16, 武陵石: 8 },
    "赫拉芬格": { 三相纳米片: 16, 武陵石: 8 },
    "作品：蚀迹": { 象限拟合液: 16, 武陵石: 8 },
    "黯色火炬": { 超距辉映管: 16, 燎石: 8 },
    "爆破单元": { 三相纳米片: 16, 武陵石: 8 },
    "使命必达": { 快子遴捡晶格: 16, 武陵石: 8 },
    "沧溟星梦": { 象限拟合液: 16, 燎石: 8 },
    "骁勇": { 快子遴捡晶格: 16, 燎石: 8 },
    "J.E.T.": { 象限拟合液: 16, 武陵石: 8 },
    "负山": { 超距辉映管: 16, 燎石: 8 },
    "艺术暴君": { 快子遴捡晶格: 16, 武陵石: 8 },
    "白夜新星": { 象限拟合液: 16, 燎石: 8 },
    "领航者": { 超距辉映管: 16, 武陵石: 8 },
    "楔子": { 快子遴捡晶格: 16, 燎石: 8 },
    "熔铸火焰": { D96钢样品四: 16, 武陵石: 8 },
    "同类相食": { 象限拟合液: 16, 武陵石: 8 },
    "不知归": { 超距辉映管: 16, 燎石: 8 },
    "热熔切割器": { D96钢样品四: 16, 燎石: 8 },
    "宏愿": { 超距辉映管: 16, 武陵石: 8 }
};

let currentWeaponStar = 0; // 当前选中的星级，0表示全部

// 初始化武器添加页面
function initWeaponAdd() {
    const weaponSelect = document.getElementById('weaponSelect');
    const starSelect = document.getElementById('weaponStarSelect');
    if (!weaponSelect || !starSelect) return;

    // 星级变化时更新武器下拉
    starSelect.addEventListener('change', function() {
        currentWeaponStar = parseInt(this.value, 10);
        updateWeaponSelect();
    });

    // 武器变化时生成表格
    weaponSelect.addEventListener('change', function() {
        const selectedName = this.value;
        const weaponObj = WEAPON_LIST.find(w => w.name === selectedName);
        currentWeapon = weaponObj ? weaponObj.name : '';
        if (currentWeapon) {
            generateWeaponTable();
        } else {
            clearWeaponTable();
        }
    });

    // 初始化武器下拉（默认全部）
    updateWeaponSelect();

    // 快捷按钮事件
    document.querySelectorAll('#page-weapon .quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            applyWeaponQuickTarget(target);
        });
    });

    // 计算需求按钮
    document.getElementById('calcWeaponDemandBtn').addEventListener('click', calculateWeaponDemand);

    // 添加全部到计算器按钮
    document.getElementById('addWeaponToPlannerBtn').addEventListener('click', addWeaponToPlanner);

    clearWeaponTable();
}

// 根据当前星级更新武器下拉框选项
function updateWeaponSelect() {
    const weaponSelect = document.getElementById('weaponSelect');
    weaponSelect.innerHTML = ''; // 清空

    // 添加“请选择”选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择';
    weaponSelect.appendChild(defaultOption);

    // 根据星级过滤武器列表
    const filtered = WEAPON_LIST.filter(w => currentWeaponStar === 0 || w.star === currentWeaponStar);
    filtered.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.name;
        opt.textContent = `${w.name} (${w.star}星)`;
        weaponSelect.appendChild(opt);
    });

    // 清空当前武器，并清空表格
    currentWeapon = '';
    clearWeaponTable();
}

// 清空武器表格
function clearWeaponTable() {
    document.getElementById('weaponProjectHeader').innerHTML = '';
    document.getElementById('weaponProjectBody').innerHTML = '';
    weaponColumns = [];
}

// 生成武器表格（突破阶段 + 等级）
function generateWeaponTable() {
    const headerRow = document.getElementById('weaponProjectHeader');
    const tbody = document.getElementById('weaponProjectBody');
    headerRow.innerHTML = '';
    tbody.innerHTML = '';

    const columnDefs = [
        { key: 'break', label: '突破阶段', min: 0, max: 4 },
        { key: 'level', label: '等级', min: 1, max: 90 }
    ];
    weaponColumns = columnDefs;

    // 表头
    const headerTr = document.createElement('tr');
    headerTr.appendChild(document.createElement('th'));
    columnDefs.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        headerTr.appendChild(th);
    });
    headerRow.appendChild(headerTr);

    // 目前等级行
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
        input.value = col.key === 'level' ? 1 : 0;
        input.classList.add('weapon-cur');
        input.dataset.key = col.key;
        input.addEventListener('blur', function() {
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
        curRow.appendChild(td);
    });
    tbody.appendChild(curRow);

    // 培养目标行
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
        input.value = col.key === 'level' ? 1 : 0;
        input.classList.add('weapon-tar');
        input.dataset.key = col.key;
        input.addEventListener('blur', function() {
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
    tbody.appendChild(tarRow);

    // 等级与突破联动
    const levelTarInput = document.querySelector('#weaponProjectBody .weapon-tar[data-key="level"]');
    if (levelTarInput) {
        levelTarInput.addEventListener('input', function() {
            const tar = parseInt(this.value, 10);
            if (isNaN(tar)) return;

            let requiredBreak = 0;
            if (tar > 80) requiredBreak = 4;
            else if (tar > 60) requiredBreak = 3;
            else if (tar > 40) requiredBreak = 2;
            else if (tar > 20) requiredBreak = 1;
            else requiredBreak = 0;

            const breakTarInput = document.querySelector('#weaponProjectBody .weapon-tar[data-key="break"]');
            if (!breakTarInput) return;
            const maxBreak = parseInt(breakTarInput.max, 10);
            const newBreak = Math.min(requiredBreak, maxBreak);
            breakTarInput.value = newBreak;
        });
    }
}

// 应用快捷目标
function applyWeaponQuickTarget(target) {
    const curInputs = document.querySelectorAll('#page-weapon .weapon-cur');
    const tarInputs = document.querySelectorAll('#page-weapon .weapon-tar');
    if (curInputs.length === 0 || tarInputs.length === 0) return;

    tarInputs.forEach(input => {
        const key = input.dataset.key;
        switch (target) {
            case 'break0': // 未突破（等级上限20）
                if (key === 'break') input.value = 0;
                if (key === 'level') input.value = 20;
                break;
            case 'break1': // 突破1满级（等级上限40）
                if (key === 'break') input.value = 1;
                if (key === 'level') input.value = 40;
                break;
            case 'break2': // 突破2满级（等级上限60）
                if (key === 'break') input.value = 2;
                if (key === 'level') input.value = 60;
                break;
            case 'break3': // 突破3满级（等级上限80）
                if (key === 'break') input.value = 3;
                if (key === 'level') input.value = 80;
                break;
            case 'full': // 突破4满级（等级上限90）
                if (key === 'break') input.value = 4;
                if (key === 'level') input.value = 90;
                break;
        }
    });
}

// 计算武器升级材料（从 cur 到 tar）
function calculateWeaponLevelMaterials(cur, tar) {
    let totalExp = 0;
    let totalTicket = 0;
    for (let lv = cur; lv < tar; lv++) {
        const stage = WEAPON_LEVEL_STAGES.find(s => lv >= s.from && lv < s.to);
        if (stage) {
            totalExp += stage.武器经验值;
            totalTicket += stage.折金票;
        } else {
            console.warn(`武器等级 ${lv}→${lv+1} 数据缺失`);
            alert(`武器等级 ${lv}→${lv+1} 数据尚未录入，请补充数据`);
            return null;
        }
    }
    return { 武器经验值: totalExp, 折金票: totalTicket };
}

// 将武器经验值转换为武器检查单元/装置/套组（使材料数量最少）
function convertExpToMaterials(exp) {
    const materials = { "武器检查套组": 0, "武器检查装置": 0, "武器检查单元": 0 };
    // 先用套组
    materials["武器检查套组"] = Math.floor(exp / 10000);
    let remaining = exp % 10000;

    // 对于剩余经验，枚举装置数量（允许超额），使总材料个数最少
    let bestDevice = 0;
    let bestUnit = 0;
    let minCount = Infinity;
    const maxDevice = Math.ceil(remaining / 1000);
    for (let d = 0; d <= maxDevice; d++) {
        const needExp = remaining - d * 1000;
        let u = 0;
        if (needExp > 0) {
            u = Math.ceil(needExp / 200);
        }
        const count = d + u;
        if (count < minCount) {
            minCount = count;
            bestDevice = d;
            bestUnit = u;
        }
    }
    materials["武器检查装置"] = bestDevice;
    materials["武器检查单元"] = bestUnit;
    return materials;
}

// 计算突破材料
function calculateWeaponBreakMaterials(weapon, fromBreak, toBreak) {
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
    for (let b = fromBreak; b < toBreak; b++) {
        const breakStage = b + 1;
        if (breakStage <= 3) {
            const data = WEAPON_BREAK_GENERAL[breakStage];
            total["折金票"] += data.折金票;
            total["强固模具"] += data["强固模具"] || 0;
            total["重型强固模具"] += data["重型强固模具"] || 0;
            total["轻黯石"] += data["轻黯石"] || 0;
            total["中黯石"] += data["中黯石"] || 0;
            total["重黯石"] += data["重黯石"] || 0;
        } else if (breakStage === 4) {
            // 基础通用
            total["折金票"] += WEAPON_BREAK_4_BASE.折金票;
            total["重型强固模具"] += WEAPON_BREAK_4_BASE["重型强固模具"];
            // 添加武器特有材料
            const special = WEAPON_BREAK_4_SPECIAL[weapon];
            if (special) {
                for (let [mat, amount] of Object.entries(special)) {
                    total[mat] = (total[mat] || 0) + amount;
                }
            }
        }
    }
    return total;
}

// 计算需求
function calculateWeaponDemand() {
    const weapon = currentWeapon;
    if (!weapon) {
        alert('请先选择武器');
        return;
    }

    const curBreakInput = document.querySelector('#weaponProjectBody .weapon-cur[data-key="break"]');
    const curLevelInput = document.querySelector('#weaponProjectBody .weapon-cur[data-key="level"]');
    const tarBreakInput = document.querySelector('#weaponProjectBody .weapon-tar[data-key="break"]');
    const tarLevelInput = document.querySelector('#weaponProjectBody .weapon-tar[data-key="level"]');

    if (!curBreakInput || !curLevelInput || !tarBreakInput || !tarLevelInput) return;

    const curBreak = parseInt(curBreakInput.value, 10);
    const curLevel = parseInt(curLevelInput.value, 10);
    const tarBreak = parseInt(tarBreakInput.value, 10);
    const tarLevel = parseInt(tarLevelInput.value, 10);

    if (isNaN(curBreak) || isNaN(curLevel) || isNaN(tarBreak) || isNaN(tarLevel)) return;

    const demands = [];

    // 升级材料
    if (curLevel < tarLevel) {
        const levelRes = calculateWeaponLevelMaterials(curLevel, tarLevel);
        if (levelRes) {
            const expMaterials = convertExpToMaterials(levelRes.武器经验值);
            const materials = { ...expMaterials, 折金票: levelRes.折金票, 武器经验值: levelRes.武器经验值 };
            demands.push({
                project: `武器等级 ${curLevel}→${tarLevel}`,
                from: curLevel,
                to: tarLevel,
                materials: materials
            });
        }
    }

    // 突破材料
    if (curBreak < tarBreak) {
        const breakRes = calculateWeaponBreakMaterials(weapon, curBreak, tarBreak);
        if (Object.values(breakRes).some(v => v > 0)) {
            demands.push({
                project: `武器突破 ${curBreak}→${tarBreak}`,
                from: curBreak,
                to: tarBreak,
                materials: breakRes
            });
        }
    }

    // 渲染需求表格
    const demandBody = document.getElementById('weaponDemandBody');
    demandBody.innerHTML = '';

    // 累加总和
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
        tdFrom.textContent = d.from;
        row.appendChild(tdFrom);

        // 目标等级
        const tdTo = document.createElement('td');
        tdTo.textContent = d.to;
        row.appendChild(tdTo);

        // 所需材料
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

                // 累加总和
                totalMaterials[mat] += d.materials[mat];
            }
        });
        if (matSpans.length === 0) {
            tdMat.textContent = '无';
        } else {
            matSpans.forEach(div => tdMat.appendChild(div));
        }
        row.appendChild(tdMat);

        demandBody.appendChild(row);
    });

    // 添加总和行
    if (demands.length > 0) {
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-sum-row';

        const tdProj = document.createElement('td');
        tdProj.textContent = '总和';
        tdProj.style.fontWeight = 'bold';
        totalRow.appendChild(tdProj);

        const tdFrom = document.createElement('td');
        tdFrom.textContent = '-';
        totalRow.appendChild(tdFrom);

        const tdTo = document.createElement('td');
        tdTo.textContent = '-';
        totalRow.appendChild(tdTo);

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
    window.currentWeaponDemands = demands;
}

// 添加全部到计算器
function addWeaponToPlanner() {
    if (!window.currentWeaponDemands || window.currentWeaponDemands.length === 0) {
        alert('请先点击“计算需求”生成材料列表');
        return;
    }

    const weapon = currentWeapon;
    window.currentWeaponDemands.forEach(d => {
        addPlanRow(weapon, d.project, d.from, d.to, d.materials);
    });

    alert(`已添加 ${window.currentWeaponDemands.length} 个项目到培养表`);

    // 重置页面
    const weaponSelect = document.getElementById('weaponSelect');
    if (weaponSelect) {
        weaponSelect.value = '';
        weaponSelect.dispatchEvent(new Event('change'));
    }
    document.getElementById('weaponDemandBody').innerHTML = '';
    window.currentWeaponDemands = [];

    window.location.hash = '#table';
}