// 设置页面数据
function initSettings() {
    document.getElementById('copyPlanData')?.addEventListener('click', function() {
        const data = JSON.stringify(planRows, null, 2);
        navigator.clipboard.writeText(data).then(() => {
            alert('计划数据已复制到剪贴板');
        }).catch(() => alert('复制失败'));
    });

    document.getElementById('pastePlanData')?.addEventListener('click', function() {
        navigator.clipboard.readText().then(text => {
            try {
                const plans = JSON.parse(text);
                if (!Array.isArray(plans)) throw new Error('不是数组');
                planRows = plans;
                const tbody = document.getElementById('planBody');
                tbody.innerHTML = '';
                plans.forEach(p => {
                    addPlanRow(p.干员, p.项目, p.现等级, p.目标等级, p.materials, true);
                });
                updateSummaryRows();
                savePlansToStorage();
                alert('数据恢复成功');
            } catch (e) {
                alert('无效的数据格式');
            }
        }).catch(() => alert('无法读取剪贴板'));
    });

    document.getElementById('clearAllData')?.addEventListener('click', function() {
        if (confirm('确定要清除所有计划数据吗？此操作不可恢复。')) {
            planRows = [];
            document.getElementById('planBody').innerHTML = '';
            updateSummaryRows();
            savePlansToStorage();
        }
    });

    document.getElementById('resetStockData')?.addEventListener('click', function() {
        if (confirm('确定要重置所有库存数据为0吗？')) {
            localStorage.removeItem('zmdgraph_stock');
            document.querySelectorAll('.stock-input').forEach(input => input.value = 0);
            updateExpValues();
        }
    });
}