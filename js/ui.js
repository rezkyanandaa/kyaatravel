/* UI helpers: modal, toast, theme */

const UI = {
  showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: '✈️' };
    toast.innerHTML = `<span>${icons[type] || '✈️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  openModal({ title, bodyHTML, footerHTML, onOpen }) {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML || '';
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (onOpen) onOpen();
  },

  closeModal() {
    document.getElementById('modalOverlay').hidden = true;
    document.body.style.overflow = '';
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.querySelector('span:last-child').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  },

  updateNotifBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = count > 9 ? '9+' : count;
    } else {
      badge.hidden = true;
    }
  },

  renderNotifs(notifications) {
    const list = document.getElementById('notifList');
    if (!notifications.length) {
      list.innerHTML = `<div class="notif-item" style="text-align:center;color:var(--text-muted)">Nothing new. You’re all caught up ✨</div>`;
      return;
    }
    list.innerHTML = notifications
      .slice()
      .reverse()
      .map(
        n => `
      <div class="notif-item">
        <div>${n.message}</div>
        <div class="time">${new Date(n.at).toLocaleString()}</div>
      </div>`
      )
      .join('');
  }
};

window.KyaaUI = UI;
