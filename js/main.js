// 入口文件（全局变量、初始化调用）
var planRows = [];
var _loading = false;

// 引入其他模块的初始化函数（需确保这些函数已在其他文件中定义）
// 注意：由于各模块已通过 <script> 标签加载，这些函数已存在于全局作用域，可以直接调用。

window.onload = function() {
    // 初始化路由
    initRouter(); // 在 router.js 中定义

    // 初始化各页面
    initPlanner(); // 在 planner.js 中定义
    initOperatorAdd(); // 在 operatorAdd.js 中定义
    initWeaponAdd(); // 在 weaponAdd.js 中定义
    initStock(); // 在 stock.js 中定义
    initSettings(); // 在 settings.js 中定义
    initPlan(); // 在 plan.js 中定义

    // 加载存储数据
    loadPlansFromStorage(); // 在 planner.js 中定义
    loadStockFromStorage(); // 在 stock.js 中定义

    // 夜间模式
    initNightMode();
};

// 夜间模式切换
function initNightMode() {
    const toggleBtn = document.getElementById('nightModeToggle');
    if (!toggleBtn) return;

    // 检查本地存储
    const isNight = localStorage.getItem('zmdgraph_night_mode') === 'true';
    if (isNight) {
        document.body.classList.add('night-mode');
        toggleBtn.textContent = '☀️';
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
        const nowNight = document.body.classList.contains('night-mode');
        localStorage.setItem('zmdgraph_night_mode', nowNight);
        toggleBtn.textContent = nowNight ? '☀️' : '🌙';
    });
}