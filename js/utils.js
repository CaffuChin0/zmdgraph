// ==================== 工具函数 ====================

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