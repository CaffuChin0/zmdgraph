// 路由导航（hash 切换） 
// 处理 hash 变化，切换页面激活状态，绑定导航点击事件。
function initRouter() {
    function showPageFromHash() {
        let hash = window.location.hash.slice(1) || 'home';
        const validPages = ['home', 'table', 'operator','weapon','plan','stock','settings']; // 跳转对应页面
        if (!validPages.includes(hash)) hash = 'home';

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === hash);
        });
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `page-${hash}`);
        });
    }

    window.addEventListener('hashchange', showPageFromHash);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.hash = this.getAttribute('href').slice(1);
        });
    });

    showPageFromHash();
}