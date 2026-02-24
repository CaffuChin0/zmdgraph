// 通用工具函数

// 获取干员的技能名数组
function getSkillsForOperator(op) {
    const row = SKILL_MAPPING.find(r => r.干员 === op);
    if (!row) return [];
    return [row.技能1, row.技能2, row.技能3, row.技能4].filter(s => s && s.trim() !== "");
}

// 获取干员可用的升级项目（技能+通用，排除例外）
function getAvailableProjects(op) {
    const skills = getSkillsForOperator(op);
    const excluded = EXCEPTIONS.filter(e => e.干员 === op).map(e => e.排除项目);
    return [...skills, ...GENERAL_PROJECTS].filter(p => !excluded.includes(p));
}

// 将实际技能名映射为通用名（技能1~4）
function mapSkillToGeneric(干员, 项目) {
    const row = SKILL_MAPPING.find(r => r.干员 === 干员);
    if (row) {
        for (let i = 1; i <= 4; i++) {
            if (row[`技能${i}`] === 项目) return `技能${i}`;
        }
    }
    return 项目;
}

// 将作战记录经验值转换为高级/中级/初级作战记录（优先最小溢出，其次最少材料）
function convertRecordExpToMaterials(exp) {
    const materials = { "高级作战记录": 0, "中级作战记录": 0, "初级作战记录": 0 };
    let bestOverflow = Infinity;
    let bestCount = Infinity;
    let bestHigh = 0, bestMid = 0, bestLow = 0;
    const maxHigh = Math.ceil(exp / 10000);
    for (let h = 0; h <= maxHigh; h++) {
        const highExp = h * 10000;
        let remaining = exp - highExp;
        if (remaining < 0) remaining = 0;
        const maxMid = Math.ceil(remaining / 1000);
        for (let m = 0; m <= maxMid; m++) {
            const midExp = m * 1000;
            let rem = remaining - midExp;
            if (rem < 0) rem = 0;
            const low = Math.ceil(rem / 200);
            const totalExp = highExp + midExp + low * 200;
            const overflow = totalExp - exp;
            const totalCount = h + m + low;
            if (overflow < bestOverflow || (overflow === bestOverflow && totalCount < bestCount)) {
                bestOverflow = overflow;
                bestCount = totalCount;
                bestHigh = h;
                bestMid = m;
                bestLow = low;
            }
        }
    }
    materials["高级作战记录"] = bestHigh;
    materials["中级作战记录"] = bestMid;
    materials["初级作战记录"] = bestLow;
    return materials;
}

// 将认知载体经验值转换为高级/初级认知载体（优先最小溢出，其次最少材料）
function convertCognitionExpToMaterials(exp) {
    const materials = { "高级认知载体": 0, "初级认知载体": 0 };
    let bestOverflow = Infinity;
    let bestCount = Infinity;
    let bestHigh = 0, bestLow = 0;
    const maxHigh = Math.ceil(exp / 10000);
    for (let h = 0; h <= maxHigh; h++) {
        const highExp = h * 10000;
        let remaining = exp - highExp;
        if (remaining < 0) remaining = 0;
        const low = Math.ceil(remaining / 1000);
        const totalExp = highExp + low * 1000;
        const overflow = totalExp - exp;
        const totalCount = h + low;
        if (overflow < bestOverflow || (overflow === bestOverflow && totalCount < bestCount)) {
            bestOverflow = overflow;
            bestCount = totalCount;
            bestHigh = h;
            bestLow = low;
        }
    }
    materials["高级认知载体"] = bestHigh;
    materials["初级认知载体"] = bestLow;
    return materials;
}

// 计算干员等级从现等级到目标等级的总材料（按阶段独立转换）
function calculateLevelMaterials(干员, 现等级, 目标等级) {
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
    let totalRecordExp = 0;
    let totalCognitionExp = 0;

    const levelStages = [
        { project: "精0等级", min: 1, max: 20, expType: "作战记录经验值" },
        { project: "精1等级", min: 20, max: 40, expType: "作战记录经验值" },
        { project: "精2等级", min: 40, max: 60, expType: "作战记录经验值" },
        { project: "精3等级", min: 60, max: 80, expType: "认知载体经验值" },
        { project: "精4等级", min: 80, max: 90, expType: "认知载体经验值" }
    ];

    for (let stage of levelStages) {
        if (现等级 < stage.max && 目标等级 > stage.min) {
            let stageCur = Math.max(现等级, stage.min);
            let stageTar = Math.min(目标等级, stage.max);
            if (stageCur < stageTar) {
                // 从数据库中筛选当前阶段内所有符合条件的小段记录
                const rows = DATABASE.filter(row => 
                    (row.干员 === "" || row.干员 === "通用") &&
                    row.升级项目 === stage.project &&
                    row.现等级 >= stageCur &&
                    row.目标等级 <= stageTar
                );
                let stageExp = 0;
                for (let row of rows) {
                    total["折金票"] += row["折金票"] || 0;
                    if (stage.expType === "作战记录经验值") {
                        stageExp += row["作战记录经验值"] || 0;
                    } else {
                        stageExp += row["认知载体经验值"] || 0;
                    }
                }
                // 对本阶段经验值进行转换，累加材料
                if (stageExp > 0) {
                    if (stage.expType === "作战记录经验值") {
                        const expMaterials = convertRecordExpToMaterials(stageExp);
                        for (let [mat, val] of Object.entries(expMaterials)) {
                            total[mat] += val;
                        }
                        totalRecordExp += stageExp; // 记录总经验供显示
                    } else {
                        const expMaterials = convertCognitionExpToMaterials(stageExp);
                        for (let [mat, val] of Object.entries(expMaterials)) {
                            total[mat] += val;
                        }
                        totalCognitionExp += stageExp;
                    }
                }
            }
        }
    }

    // 记录总经验值（用于库存行显示）
    total["作战记录经验值"] = totalRecordExp;
    total["认知载体经验值"] = totalCognitionExp;

    return total;
}

// 计算完整的角色等级升级材料（包括升级、精英阶段、装备适配）
function calculateFullLevelMaterials(干员, 现等级, 目标等级, eliteDone, adaptDone) {
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);

    // 计算升级素材（精0~4）
    const levelResult = calculateLevelMaterials(干员, 现等级, 目标等级);
    if (levelResult) {
        MATERIAL_COLUMNS.forEach(mat => total[mat] += levelResult[mat] || 0);
    }

    // 精英阶段材料（阈值：20,40,60,80）
    const eliteThresholds = [20, 40, 60, 80];
    const eliteStages = [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 }
    ];
    for (let i = 0; i < eliteThresholds.length; i++) {
        const threshold = eliteThresholds[i];
        // 只有当目标等级达到或超过该阈值，且当前等级未达到该阈值，且精英化未完成时，才添加该精英阶段
        if (目标等级 >= threshold && 现等级 < threshold && !eliteDone) {
            const eliteRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
            if (eliteRes) {
                MATERIAL_COLUMNS.forEach(mat => total[mat] += eliteRes[mat] || 0);
            }
        }
    }

    // 装备适配材料（阈值 20,40,60）
    const adaptThresholds = [20, 40, 60];
    const adaptStages = [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 }
    ];
    for (let i = 0; i < adaptThresholds.length; i++) {
        const threshold = adaptThresholds[i];
        // 只有当目标等级达到或超过该阈值，且当前等级未达到该阈值，且装备适配未完成时，才添加该装备适配阶段
        if (目标等级 >= threshold && 现等级 < threshold && !adaptDone) {
            const adaptRes = calculateMaterials(干员, "装备适配", adaptStages[i].from, adaptStages[i].to);
            if (adaptRes) {
                MATERIAL_COLUMNS.forEach(mat => total[mat] += adaptRes[mat] || 0);
            }
        }
    }

    return total;
}

// 计算精英阶段材料（从当前等级到目标等级，仅当跨越阈值且未完成时）
function calculateEliteMaterials(干员, 现等级, 目标等级, eliteDone) {
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
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
                // 未来阶段
                const stageRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
                if (stageRes) {
                    MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                }
            } else if (现等级 === threshold && !eliteDone) {
                // 当前阶段且未完成
                const stageRes = calculateMaterials(干员, "精英阶段", eliteStages[i].from, eliteStages[i].to);
                if (stageRes) {
                    MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                }
            }
        }
    }
    return total;
}

// 计算装备适配材料
function calculateAdaptMaterials(干员, 现等级, 目标等级, adaptDone) {
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);
    const adaptThresholds = [20, 40, 60];
    const adaptStages = [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 }
    ];
    for (let i = 0; i < adaptThresholds.length; i++) {
        const threshold = adaptThresholds[i];
        if (目标等级 >= threshold) {
            if (现等级 < threshold) {
                const stageRes = calculateMaterials(干员, "装备适配", adaptStages[i].from, adaptStages[i].to);
                if (stageRes) {
                    MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                }
            } else if (现等级 === threshold && !adaptDone) {
                const stageRes = calculateMaterials(干员, "装备适配", adaptStages[i].from, adaptStages[i].to);
                if (stageRes) {
                    MATERIAL_COLUMNS.forEach(mat => total[mat] += stageRes[mat] || 0);
                }
            }
        }
    }
    return total;
}

// 累加计算材料
function calculateMaterials(干员, 项目, 现等级, 目标等级) {

    const generic = mapSkillToGeneric(干员, 项目);

    // 匹配干员特有行
    let exact = DATABASE.find(row => 
        row.干员 === 干员 && 
        row.升级项目 === generic && 
        row.现等级 === 现等级 && 
        row.目标等级 === 目标等级
    );
    if (exact) {
        let result = {};
        MATERIAL_COLUMNS.forEach(mat => result[mat] = parseFloat(exact[mat]) || 0);
        return result;
    }

    // 匹配通用行
    let generalExact = DATABASE.find(row => 
        (row.干员 === "" || row.干员 === "通用") && 
        row.升级项目 === generic && 
        row.现等级 === 现等级 && 
        row.目标等级 === 目标等级
    );
    if (generalExact) {
        let result = {};
        MATERIAL_COLUMNS.forEach(mat => result[mat] = parseFloat(generalExact[mat]) || 0);
        return result;
    }

    // 逐级累加（用于连续等级段，如技能1→12）
    let total = {};
    MATERIAL_COLUMNS.forEach(mat => total[mat] = 0);

    for (let lv = 现等级; lv < 目标等级; lv++) {
        // 优先找干员特有行（当前等级段）
        let row = DATABASE.find(r => 
            r.干员 === 干员 && 
            r.升级项目 === generic && 
            r.现等级 === lv && 
            r.目标等级 === lv + 1
        );
        // 若没有，则找通用行
        if (!row) {
            row = DATABASE.find(r => 
                (r.干员 === "" || r.干员 === "通用") && 
                r.升级项目 === generic && 
                r.现等级 === lv && 
                r.目标等级 === lv + 1
            );
        }
        if (!row) {
            // 缺少某一级数据，返回 null 提示
            console.warn(`缺少等级 ${lv} → ${lv+1} 的数据`);
            return null;
        }
        MATERIAL_COLUMNS.forEach(mat => {
            total[mat] += parseFloat(row[mat]) || 0;
        });
    }

    const hasAny = MATERIAL_COLUMNS.some(mat => total[mat] > 0);
    return hasAny ? total : null;
}

// 将装备适配等级映射为名称
function mapAdaptLevelToColor(level) {
    const colors = ['绿装', '蓝装', '紫装', '金装'];
    return colors[level] !== undefined ? colors[level] : level; // 若超出范围则返回原数字
}

// 将作战记录经验值转换为高级/中级/初级作战记录（优先最小溢出，其次最少材料）
function convertRecordExpToMaterials(exp) {
    const materials = { "高级作战记录": 0, "中级作战记录": 0, "初级作战记录": 0 };
    const values = [10000, 1000, 200];
    const keys = ["高级作战记录", "中级作战记录", "初级作战记录"];
    let remaining = exp;
    // 贪心从大到小，但后续枚举调整
    let best = { total: Infinity, overflow: Infinity, counts: [0,0,0] };
    // 枚举高级的数量（允许超额）
    const maxHigh = Math.ceil(remaining / 10000);
    for (let h = 0; h <= maxHigh; h++) {
        const highExp = h * 10000;
        let rem1 = remaining - highExp;
        if (rem1 < 0) rem1 = 0; // 超额
        // 枚举中级的数量
        const maxMid = Math.ceil(rem1 / 1000);
        for (let m = 0; m <= maxMid; m++) {
            const midExp = m * 1000;
            let rem2 = rem1 - midExp;
            if (rem2 < 0) rem2 = 0;
            const low = Math.ceil(rem2 / 200);
            const totalExp = highExp + midExp + low * 200;
            const overflow = totalExp - exp;
            const totalCount = h + m + low;
            if (overflow < best.overflow || (overflow === best.overflow && totalCount < best.total)) {
                best.overflow = overflow;
                best.total = totalCount;
                best.counts = [h, m, low];
            }
        }
    }
    materials["高级作战记录"] = best.counts[0];
    materials["中级作战记录"] = best.counts[1];
    materials["初级作战记录"] = best.counts[2];
    return materials;
}

// 将认知载体经验值转换为高级/初级认知载体（优先最小溢出，其次最少材料）
function convertCognitionExpToMaterials(exp) {
    const materials = { "高级认知载体": 0, "初级认知载体": 0 };
    const values = [10000, 1000];
    const keys = ["高级认知载体", "初级认知载体"];
    let remaining = exp;
    let best = { total: Infinity, overflow: Infinity, counts: [0,0] };
    const maxHigh = Math.ceil(remaining / 10000);
    for (let h = 0; h <= maxHigh; h++) {
        const highExp = h * 10000;
        let rem1 = remaining - highExp;
        if (rem1 < 0) rem1 = 0;
        const low = Math.ceil(rem1 / 1000);
        const totalExp = highExp + low * 1000;
        const overflow = totalExp - exp;
        const totalCount = h + low;
        if (overflow < best.overflow || (overflow === best.overflow && totalCount < best.total)) {
            best.overflow = overflow;
            best.total = totalCount;
            best.counts = [h, low];
        }
    }
    materials["高级认知载体"] = best.counts[0];
    materials["初级认知载体"] = best.counts[1];
    return materials;
}