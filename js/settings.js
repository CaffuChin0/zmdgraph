// 设置页面数据
function initSettings() {
    // 探索等级初始化
    const exploreSelect = document.getElementById('exploreLevelSelect');
    if (exploreSelect) {
        const savedLevel = localStorage.getItem('zmdgraph_explore_level') || '1';
        exploreSelect.value = savedLevel;
        exploreSelect.addEventListener('change', function() {
            localStorage.setItem('zmdgraph_explore_level', this.value);
        });
    }

    // 每日体力上限初始化
    const dailyStaminaInput = document.getElementById('dailyStaminaInput');
    if (dailyStaminaInput) {
        const savedStamina = localStorage.getItem('zmdgraph_daily_stamina') || '200';
        dailyStaminaInput.value = savedStamina;
        dailyStaminaInput.addEventListener('change', function() {
            let val = parseInt(this.value, 10);
            if (isNaN(val) || val < 200) val = 200;
            this.value = val;
            localStorage.setItem('zmdgraph_daily_stamina', val);
        });
    }

    // 生成备份（写入文本框）
    document.getElementById('generateBackup')?.addEventListener('click', function() {
        const stockData = {};
        document.querySelectorAll('.stock-input').forEach(input => {
            const mat = input.dataset.material;
            if (mat) stockData[mat] = input.value;
        });
        const backup = {
            version: '1.0',
            plans: planRows,
            stock: stockData
        };
        const data = JSON.stringify(backup); // 紧凑单行输出
        document.getElementById('backupText').value = data;
    });

    // 应用备份（从文本框读取）
    document.getElementById('applyBackup')?.addEventListener('click', function() {
        const text = document.getElementById('backupText').value.trim();
        if (!text) {
            alert('文本框为空，请输入备份数据');
            return;
        }
        try {
            const backup = JSON.parse(text);
            if (!backup.plans || !Array.isArray(backup.plans) || !backup.stock) {
                throw new Error('备份格式不正确（缺少plans或stock）');
            }
            // 恢复计划
            planRows = backup.plans;
            const tbody = document.getElementById('planBody');
            tbody.innerHTML = '';
            planRows.forEach(p => {
                addPlanRow(p.干员, p.项目, p.现等级, p.目标等级, p.materials, true);
            });
            // 恢复库存
            const stockData = backup.stock;
            document.querySelectorAll('.stock-input').forEach(input => {
                const mat = input.dataset.material;
                if (mat && stockData.hasOwnProperty(mat)) {
                    input.value = stockData[mat];
                } else {
                    input.value = 0;
                }
            });
            // 更新相关数据
            updateExpValues();
            updateMissingRow();
            savePlansToStorage();
            saveStockToStorage();
            refreshStockPage();
            if (typeof refreshPlan === 'function') {
                refreshPlan();
            }
            alert('备份恢复成功');
        } catch (e) {
            alert('无效的备份数据格式：' + e.message);
        }
    });
}