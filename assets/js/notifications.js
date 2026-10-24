/**
 * =========================================================================
 * COMED23 REAL-TIME NOTIFICATION ENGINE (Client-Side) - V2 Enhanced
 * - เชื่อมต่อ Supabase `notifications` table แบบ Realtime 100%
 * - รองรับ Bootstrap Icons & CSS ร่วมกับ Tailwind CSS Glassmorphism
 * - Dropdown & Mobile Drawer / Modal สำหรับการแจ้งเตือนสดพร้อมภาพประกอบ (Image Banner)
 * - GSAP & Spring Animations สำหรับ Toast Alert และ Dropdown
 * - Web Push & In-app Notification Badge ซิงค์อัตโนมัติ
 * =========================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_READ_KEY = 'COMED23_NOTIFICATIONS_READ_V2';
  const STORAGE_LOCAL_CACHE = 'COMED23_NOTIFICATIONS_CACHE_V2';
  let realtimeSub = null;
  let notificationsList = [];

  function getClient() {
    if (typeof window.getSupabaseClient === 'function') {
      return window.getSupabaseClient();
    }
    if (window.supabase && window.SUPABASE_CONFIG) {
      return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    return null;
  }

  function getReadIds() {
    try {
      const data = localStorage.getItem(STORAGE_READ_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function markAsRead(id) {
    const list = getReadIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(list));
      updateBadge();
      renderNotificationDropdown();
    }
  }

  function markAllAsRead() {
    const ids = notificationsList.map(n => n.id);
    localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(ids));
    updateBadge();
    renderNotificationDropdown();
    NotificationEngine.showSimpleToast('ทำเครื่องหมายอ่านทั้งหมดแล้ว', 'success');
  }

  // Helper mapping Bootstrap Icons according to notification type
  function getTypeMeta(type) {
    switch (type) {
      case 'urgent':
        return {
          tag: 'ด่วนที่สุด',
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
          biIcon: 'bi-exclamation-triangle-fill',
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      case 'warning':
        return {
          tag: 'สำคัญมาก',
          badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          biIcon: 'bi-exclamation-circle-fill',
          iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'event':
        return {
          tag: 'กิจกรรม & งาน',
          badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
          biIcon: 'bi-calendar-event-fill',
          iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
        };
      case 'payment':
        return {
          tag: 'การเงิน & สลิป',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          biIcon: 'bi-credit-card-2-front-fill',
          iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      default:
        return {
          tag: 'ข่าวสารทั่วไป',
          badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
          biIcon: 'bi-megaphone-fill',
          iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
        };
    }
  }

  const NotificationEngine = {
    markAllRead: markAllAsRead,

    // 1. ขอสิทธิ์ Web Notification
    async requestPermission() {
      if (!('Notification' in window)) {
        alert('เบราว์เซอร์นี้ไม่รองรับ Web Notification');
        return 'unsupported';
      }
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          this.showSimpleToast('เปิดระบบแจ้งเตือนแบบ Push สำเร็จ!', 'success');
        }
        return perm;
      } catch (e) {
        return 'denied';
      }
    },

    // 2. ส่ง Notification ผ่าน Browser
    triggerSystemNotification(item) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        const meta = getTypeMeta(item.type);
        const notif = new Notification(`[${meta.tag}] ${item.title || 'COMED23'}`, {
          body: item.message || '',
          icon: item.image_url || 'logo.png',
          badge: 'logo.png',
          tag: item.id || 'comed23_notif'
        });
        notif.onclick = () => {
          window.focus();
          markAsRead(item.id);
          if (item.link) window.location.href = item.link;
          notif.close();
        };
      } catch (e) {}
    },

    // 3. Simple In-app Feedback Toast
    showSimpleToast(msg, type = 'info') {
      let c = document.getElementById('comedSimpleToastContainer');
      if (!c) {
        c = document.createElement('div');
        c.id = 'comedSimpleToastContainer';
        c.className = 'fixed bottom-5 right-5 z-[999999] pointer-events-none flex flex-col gap-2';
        document.body.appendChild(c);
      }
      const t = document.createElement('div');
      t.className = 'pointer-events-auto px-4 py-2.5 rounded-xl bg-[#090C1B]/95 text-white border border-white/15 shadow-2xl backdrop-blur-xl text-xs font-mono flex items-center gap-2 transform translate-y-3 opacity-0 transition-all duration-300';
      const icon = type === 'success' ? 'bi-check-circle-fill text-emerald-400' : 'bi-info-circle-fill text-sky-400';
      t.innerHTML = `<i class="bi ${icon}"></i> <span>${msg}</span>`;
      c.appendChild(t);
      requestAnimationFrame(() => {
        t.classList.remove('translate-y-3', 'opacity-0');
        t.classList.add('translate-y-0', 'opacity-100');
      });
      setTimeout(() => {
        t.classList.add('translate-y-3', 'opacity-0');
        setTimeout(() => t.remove(), 300);
      }, 3000);
    },

    // 4. In-App Rich Banner Toast (พร้อมภาพประกอบถ้ามี)
    showToast(item) {
      if (!item) return;

      let container = document.getElementById('comedNotificationToastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'comedNotificationToastContainer';
        container.className = 'fixed top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3';
        document.body.appendChild(container);
      }

      const meta = getTypeMeta(item.type);
      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto rounded-2xl bg-[#0A0D1E]/95 backdrop-blur-2xl border border-white/15 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 transform -translate-y-4 opacity-0 transition-all duration-300 relative overflow-hidden group cursor-pointer';

      const imgHtml = item.image_url ? `
        <div class="w-full h-32 rounded-xl overflow-hidden bg-black/40 border border-white/10 mt-1 relative">
          <img src="${item.image_url}" alt="Illustration" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.parentElement.remove()">
        </div>
      ` : '';

      toast.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.iconColor} shadow-inner">
            <i class="bi ${meta.biIcon} text-base"></i>
          </div>
          <div class="flex-grow min-w-0 pr-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeClass}">${meta.tag}</span>
              <span class="text-[10px] text-slate-400 font-mono">เมื่อสักครู่</span>
            </div>
            <h4 class="text-xs sm:text-sm font-bold text-white line-clamp-1">${item.title || 'ประกาศใหม่'}</h4>
            <p class="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">${item.message || ''}</p>
          </div>
          <button type="button" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition flex-shrink-0" title="ปิด">
            <i class="bi bi-x-lg text-xs"></i>
          </button>
        </div>
        ${imgHtml}
        ${item.link ? `
          <div class="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#FF7A29]">
            <span class="flex items-center gap-1.5">
              <span>เปิดดูรายละเอียด</span>
              <i class="bi bi-arrow-right"></i>
            </span>
          </div>
        ` : ''}
      `;

      toast.onclick = (e) => {
        if (e.target.closest('button')) {
          closeToast(toast);
          return;
        }
        markAsRead(item.id);
        if (item.link) window.location.href = item.link;
        closeToast(toast);
      };

      container.appendChild(toast);
      playNotificationSound();

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(toast, 
          { y: -25, opacity: 0, scale: 0.95 }, 
          { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
      } else {
        requestAnimationFrame(() => {
          toast.classList.remove('-translate-y-4', 'opacity-0');
          toast.classList.add('translate-y-0', 'opacity-100');
        });
      }

      function closeToast(el) {
        if (typeof gsap !== 'undefined') {
          gsap.to(el, { y: -20, opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.in", onComplete: () => el.remove() });
        } else {
          el.classList.add('opacity-0', 'translate-x-full');
          setTimeout(() => el.remove(), 300);
        }
      }

      setTimeout(() => closeToast(toast), 7000);
    },

    // 5. ดึงข้อมูลการแจ้งเตือนจาก Supabase
    async fetchNotifications() {
      const client = getClient();
      let list = [];

      if (client) {
        try {
          const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(35);

          if (!error && Array.isArray(data)) {
            list = data;
            localStorage.setItem(STORAGE_LOCAL_CACHE, JSON.stringify(data));
          }
        } catch (e) {
          console.warn('[NotificationEngine] Fetch error:', e);
        }
      }

      if (!list || list.length === 0) {
        try {
          const cached = localStorage.getItem(STORAGE_LOCAL_CACHE);
          if (cached) list = JSON.parse(cached);
        } catch (e) {}
      }

      notificationsList = list || [];
      updateBadge();
      renderNotificationDropdown();
      return list;
    },

    // 6. Realtime Listener
    initRealtime() {
      const client = getClient();
      if (!client || realtimeSub) return;

      try {
        realtimeSub = client
          .channel('public:notifications:v2')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
            const newItem = payload.new;
            if (newItem && newItem.is_active !== false) {
              notificationsList.unshift(newItem);
              NotificationEngine.showToast(newItem);
              NotificationEngine.triggerSystemNotification(newItem);
              updateBadge();
              renderNotificationDropdown();
            }
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
            NotificationEngine.fetchNotifications();
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (payload) => {
            notificationsList = notificationsList.filter(n => n.id !== payload.old.id);
            updateBadge();
            renderNotificationDropdown();
          })
          .subscribe();
      } catch (e) {
        console.warn('[NotificationEngine] Realtime subscribe error:', e);
      }
    },

    // Mobile Modal Trigger
    openMobileNotifModal() {
      let modal = document.getElementById('mobileNotifModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mobileNotifModal';
        modal.className = 'fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300';
        modal.innerHTML = `
          <div class="w-full sm:max-w-md bg-[#0A0D1E] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div class="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div class="flex items-center gap-2">
                <i class="bi bi-bell-fill text-[#FF7A29]"></i>
                <h3 class="text-sm font-bold text-white font-display">ศูนย์แจ้งเตือน</h3>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.NotificationEngine?.markAllRead()" class="text-xs font-mono text-[#FF7A29]">อ่านทั้งหมด</button>
                <button type="button" onclick="document.getElementById('mobileNotifModal').classList.add('hidden')" class="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
                  <i class="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            </div>
            <div id="mobileNotifItemsList" class="flex-grow overflow-y-auto divide-y divide-white/5 p-2"></div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
          if (e.target === modal) modal.classList.add('hidden');
        };
      }
      modal.classList.remove('hidden');
      renderMobileNotificationList();
    },

    // 7. Mount UI & Listeners
    mountUI() {
      setupNavbarDropdown();
      this.fetchNotifications();
      this.initRealtime();
    }
  };

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  function updateBadge() {
    const readIds = getReadIds();
    const unreadCount = notificationsList.filter(n => !readIds.includes(n.id)).length;

    const badges = document.querySelectorAll('.notification-badge, #notifUnreadBadge');
    badges.forEach(b => {
      if (unreadCount > 0) {
        b.textContent = unreadCount > 99 ? '99+' : unreadCount;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });
  }

  // Setup Bell Button Trigger
  function setupNavbarDropdown() {
    const bellBtn = document.getElementById('notifBellBtn');
    const dropdown = document.getElementById('notifCenterDropdown');
    const wrapper = document.getElementById('mainNotifBellWrapper');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
          dropdown.classList.remove('hidden');
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(dropdown, 
              { opacity: 0, y: -10, scale: 0.96 }, 
              { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "back.out(1.5)" }
            );
          }
          renderNotificationDropdown();
        } else {
          dropdown.classList.add('hidden');
        }
      });

      document.addEventListener('click', (e) => {
        if (wrapper && !wrapper.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
    }

    // Show Admin Link if logged in
    const adminEmail = (sessionStorage.getItem('COMED_KKU69_ADMIN_LOGGED_USER') || '').toLowerCase().trim();
    if (adminEmail) {
      const link = document.getElementById('linkNotifAdmin');
      if (link) link.classList.remove('hidden');
    }
  }

  function renderNotificationDropdown() {
    const listEl = document.getElementById('notificationItemsList');
    if (!listEl) return;

    if (notificationsList.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs space-y-2">
          <i class="bi bi-bell-slash text-2xl text-slate-600 block"></i>
          <p class="font-bold text-slate-300">ไม่มีการแจ้งเตือนใหม่</p>
          <p class="text-[11px] text-slate-500">คุณติดตามข่าวสารครบถ้วนแล้ว</p>
        </div>
      `;
      return;
    }

    const readIds = getReadIds();

    listEl.innerHTML = notificationsList.map(item => {
      const isUnread = !readIds.includes(item.id);
      const meta = getTypeMeta(item.type);
      const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'เมื่อสักครู่';

      const thumbImg = item.image_url ? `
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 relative">
          <img src="${item.image_url}" alt="Img" class="w-full h-full object-cover" onerror="this.parentElement.remove()">
        </div>
      ` : '';

      return `
        <div class="p-3.5 hover:bg-white/5 transition-colors flex gap-3 cursor-pointer ${isUnread ? 'bg-orange-500/[0.04]' : 'opacity-85'}"
          onclick="window.NotificationEngine.onItemClick('${item.id}', '${item.link || ''}')">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.iconColor} shadow-inner">
            <i class="bi ${meta.biIcon} text-sm"></i>
          </div>
          <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${meta.badgeClass}">${meta.tag}</span>
              <span class="text-[10px] text-slate-500 font-mono">${dateStr}</span>
            </div>
            <h4 class="text-xs font-bold text-white line-clamp-1 ${isUnread ? 'text-[#FF7A29]' : ''}">${item.title || 'ประกาศ'}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">${item.message || ''}</p>
          </div>
          ${thumbImg}
          ${isUnread ? '<div class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-2 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></div>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderMobileNotificationList() {
    const listEl = document.getElementById('mobileNotifItemsList');
    if (!listEl) return;
    renderNotificationDropdown();
    const desktopHtml = document.getElementById('notificationItemsList')?.innerHTML;
    if (desktopHtml) listEl.innerHTML = desktopHtml;
  }

  NotificationEngine.onItemClick = function (id, link) {
    markAsRead(id);
    const dropdown = document.getElementById('notifCenterDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const modal = document.getElementById('mobileNotifModal');
    if (modal) modal.classList.add('hidden');
    if (link) {
      window.location.href = link;
    }
  };

  window.NotificationEngine = NotificationEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationEngine.mountUI());
  } else {
    NotificationEngine.mountUI();
  }

})(window);
