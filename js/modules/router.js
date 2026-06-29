// ============================================================
// modules/router.js - SPA 라우터
// ============================================================

const Router = {
  currentPage: null,

  pages: {
    'mypage':        () => Pages.mypage.render(),
    'admin-users':   () => Pages.adminUsers.render(),
    'clients':       () => Pages.clients.render(),
    'client-detail': (id) => Pages.clientDetail.render(id),
    'assessments':      () => Pages.assessments.render(),
    'admin-standards':   () => Pages.adminStandards.render(),
    'reports':       () => Pages.reports.render(),
    'dashboard':     () => Pages.dashboard.render()
  },

  navigate: function(pageId, param) {
    const menu = AppConfig.MENUS.find(m => m.id === pageId);
    if (menu && menu.comingSoon) { UI.toast('준비 중인 기능입니다.','info'); return; }
    if (menu && menu.roles && !menu.roles.includes(Auth.getUser()?.role)) {
      UI.toast('접근 권한이 없습니다.','error'); return;
    }
    this.currentPage = pageId;
    this._renderPage(pageId, param);
    this._updateNav(pageId);
  },

  _renderPage: function(pageId, param) {
    const container = document.getElementById('page-content');
    const renderer  = this.pages[pageId];
    if (!renderer) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-text">준비 중인 페이지입니다</div></div>`;
      return;
    }
    renderer(param);
  },

  _updateNav: function(pageId) {
    const activeId = pageId === 'client-detail' ? 'clients' : pageId;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === activeId);
    });
    const menu    = AppConfig.MENUS.find(m => m.id === activeId);
    const titleEl = document.getElementById('header-title');
    if (titleEl) {
      if (pageId === 'client-detail') titleEl.textContent = '고객 상세';
      else if (menu) titleEl.textContent = menu.label;
    }
  }
};
