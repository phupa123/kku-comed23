/**
 * =========================================================================
 * COMED23 REAL-TIME NOTIFICATION ENGINE (Client-Side)
 * - รองรับ Web Notification API / PWA Push
 * - ดึงและแจ้งเตือน Realtime จาก Supabase `notifications` table
 * - มี Fallback Broadcast & Local Cache เผื่อออฟไลน์
 * - In-app Glassmorphism Banner / Toast เด้งเตือนสด
 * - Notification Center Bell Dropdown บนแถบเมนู (Navbar)
 * =========================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_READ_KEY = 'COMED23_NOTIFICATIONS_READ_V1';
  const STORAGE_LOCAL_CACHE = 'COMED23_NOTIFICATIONS_CACHE_V1';
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
    }
  }

  function markAllAsRead() {
    const ids = notificationsList.map(n => n.id);
    localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(ids));
    updateBadge();
    renderNotificationDropdown();
  }

  const STORAGE_DISMISSED_PROMPT = 'COMED23_NOTIF_PROMPT_DISMISSED';
  const STORAGE_ONESIGNAL_APP_ID = 'COMED23_ONESIGNAL_APP_ID';
  // VAPID Public Key generated for COMED KKU
  const VAPID_PUBLIC_KEY = 'BEzlXgMuqgINsrzdcWJ5CQyXg83AKAlzvyruFr5BVJhwT_-oX7c2CIIUsiUZTJOm4emMbDtOF8hWpDNa6uvKUAk';

  // โหลด OneSignal SDK อัตโนมัติสำหรับ Background Push
  function initOneSignalSDK() {
    const OFFICIAL_APP_ID = '0bb74e88-0d82-463b-bc8d-ae5a27f659c3';
    const appId = localStorage.getItem(STORAGE_ONESIGNAL_APP_ID) || OFFICIAL_APP_ID;
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: appId,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' }
        });
        console.log('[OneSignal] Initialized with App ID:', appId);

        // เชื่อมโยงอีเมลของผู้ใช้เข้ากับ OneSignal (External ID) เพื่อให้ส่งเจาะจงรายคนได้
        let userEmail = '';
        try {
          const rawSession = sessionStorage.getItem('COMED_USER_SESSION') || localStorage.getItem('COMED_USER_SESSION') || '';
          if (rawSession.startsWith('{')) {
            const parsed = JSON.parse(rawSession);
            userEmail = (parsed.email || parsed.email_address || '').toLowerCase().trim();
          } else if (rawSession.includes('@')) {
            userEmail = rawSession.toLowerCase().trim();
          }
        } catch(errUser) {}

        if (userEmail && OneSignal.login) {
          await OneSignal.login(userEmail);
          console.log('[OneSignal] Logged in as:', userEmail);
        }
      } catch(e) {
        console.warn('[OneSignal] Init notice:', e);
      }
    });

    if (!document.getElementById('onesignal-sdk-script')) {
      const s = document.createElement('script');
      s.id = 'onesignal-sdk-script';
      s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  }

  initOneSignalSDK();

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const NotificationEngine = {
    // 1. ขอสิทธิ์ Web Notification และลงทะเบียน OneSignal + VAPID
    async requestPermission() {
      // 1. OneSignal Opt-in
      if (window.OneSignal) {
        try {
          await window.OneSignal.Notifications.requestPermission();
        } catch (e) {}
      }

      if (!('Notification' in window)) {
        return 'unsupported';
      }
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          // ลงทะเบียน VAPID Push Token กับ Google/Apple Push Service
          await this.subscribePushDevice();

          // ทดสอบแจ้งเตือนต้อนรับ 1 ครั้ง เพื่อให้มั่นใจว่าเครื่องเปิดรับระบบ
          this.triggerSystemNotification({
            id: 'welcome_test',
            title: 'เปิดการแจ้งเตือน COMED23 สำเร็จแล้ว!',
            message: 'คุณจะได้รับข้อความแจ้งเตือนด่วนแม้ปิดแอปหรือล็อกหน้าจอ',
            type: 'info'
          });
        }
        return perm;
      } catch (e) {
        console.warn('[NotificationEngine] Permission request error:', e);
        return 'denied';
      }
    },

    // บันทึก Token โทรศัพท์เข้าตาราง push_subscriptions ใน Supabase
    async subscribePushDevice() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey
          });
        }

        if (sub) {
          const subJson = sub.toJSON();
          const endpoint = sub.endpoint;
          const p256dh = subJson.keys?.p256dh;
          const auth = subJson.keys?.auth;

          if (endpoint && p256dh && auth) {
            const client = getClient();
            let userEmail = '';
            try {
              const rawSession = sessionStorage.getItem('COMED_USER_SESSION') || localStorage.getItem('COMED_USER_SESSION') || '';
              if (rawSession.startsWith('{')) {
                const parsed = JSON.parse(rawSession);
                userEmail = (parsed.email || parsed.email_address || '').toLowerCase().trim();
              } else if (rawSession.includes('@')) {
                userEmail = rawSession.toLowerCase().trim();
              }
            } catch(errUser) {}
            const deviceInfo = navigator.userAgent;

            if (client) {
              await client.from('push_subscriptions').upsert([{
                endpoint,
                p256dh,
                auth,
                user_email: userEmail || null,
                device_info: deviceInfo,
                updated_at: new Date().toISOString()
              }], { onConflict: 'endpoint' });
              console.log('[NotificationEngine] Push Subscription synced successfully');
            }
          }
        }
        return sub;
      } catch (err) {
        console.warn('[NotificationEngine] Push subscription registration note:', err);
        return null;
      }
    },

    getPermissionStatus() {
      if (!('Notification' in window)) return 'unsupported';
      return Notification.permission; // 'granted', 'denied', 'default'
    },

    // แสดงป๊อปอัปขออนุญาตรับการแจ้งเตือนอัตโนมัติเมื่อเข้าแอป/เว็บ
    promptPermissionModal() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') return;
      if (sessionStorage.getItem(STORAGE_DISMISSED_PROMPT)) return;
      if (document.getElementById('modalNotifPrompt')) return;

      const modal = document.createElement('div');
      modal.id = 'modalNotifPrompt';
      modal.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-[999999] animate-in fade-in slide-in-from-bottom-5 duration-300';
      
      modal.innerHTML = `
        <div class="rounded-3xl p-5 bg-slate-900/95 backdrop-blur-2xl border border-orange-500/40 shadow-2xl shadow-orange-500/20 text-white space-y-3.5">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
              <i data-lucide="bell-ring" class="w-5 h-5 animate-bounce"></i>
            </div>
            <div class="flex-grow min-w-0 pr-1">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  COMED KKU Alert
                </span>
              </div>
              <h4 class="text-sm font-bold text-white leading-snug">เปิดการแจ้งเตือนสำคัญของสาขา?</h4>
              <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                รับข่าวสารด่วน ตารางสอน เลื่อนคาบ และเตือนชำระเงิน แม้ปัดปิดแอปหรือล็อกหน้าจอ
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button id="btnNotifDismiss" type="button"
              class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition border border-white/10 text-center cursor-pointer">
              ไว้คราวหลัง
            </button>
            <button id="btnNotifAccept" type="button"
              class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>เปิดการแจ้งเตือน</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons({ root: modal });
      }

      modal.querySelector('#btnNotifDismiss').onclick = () => {
        sessionStorage.setItem(STORAGE_DISMISSED_PROMPT, 'true');
        modal.remove();
      };

      modal.querySelector('#btnNotifAccept').onclick = async () => {
        modal.remove();
        await NotificationEngine.requestPermission();
      };
    },

    // 2. ส่ง System Web Notification (ถ้าได้รับอนุญาต)
    async triggerSystemNotification(item) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const title = item.title || 'ประกาศจากสาขา COMED KKU';
      const options = {
        body: item.message || '',
        icon: '/logo.png',
        badge: '/favicon.png',
        tag: 'comed-notif-' + (item.id || Date.now()),
        data: { url: item.link || window.location.href },
        // สั่นกระตุ้นเตือนโทรศัพท์มือถือ (Vibrate pattern)
        vibrate: [300, 100, 400, 100, 300],
        renotify: true,
        requireInteraction: item.type === 'urgent',
        actions: [
          { action: 'open', title: 'เปิดดูทันที' }
        ]
      };

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            return;
          }
        }
        const n = new Notification(title, options);
        n.onclick = function () {
          window.focus();
          if (item.link) window.location.href = item.link;
          n.close();
        };
      } catch (e) {
        console.warn('[NotificationEngine] System notification error:', e);
      }
    },

    // 3. แสดง In-App Floating Toast
    showToast(item) {
      let container = document.getElementById('comed-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'comed-toast-container';
        container.className = 'fixed top-20 right-4 z-[99999] max-w-sm w-[90vw] sm:w-[380px] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto transform translate-y-[-20px] opacity-0 transition-all duration-300 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl border text-white flex gap-3.5 items-start cursor-pointer';

      let bgBorder = 'bg-slate-900/95 border-sky-500/40 shadow-sky-500/20';
      let iconColor = 'text-sky-400';
      let iconName = 'bell';
      let badgeTag = 'ทั่วไป';
      let badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

      if (item.type === 'urgent') {
        bgBorder = 'bg-rose-950/95 border-rose-500/60 shadow-rose-500/30';
        iconColor = 'text-rose-400';
        iconName = 'alert-triangle';
        badgeTag = 'ด่วนที่สุด';
        badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      } else if (item.type === 'warning') {
        bgBorder = 'bg-amber-950/95 border-amber-500/50 shadow-amber-500/20';
        iconColor = 'text-amber-400';
        iconName = 'alert-circle';
        badgeTag = 'สำคัญ';
        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      } else if (item.type === 'event') {
        bgBorder = 'bg-indigo-950/95 border-indigo-500/50 shadow-indigo-500/20';
        iconColor = 'text-indigo-400';
        iconName = 'calendar';
        badgeTag = 'กิจกรรม';
        badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      }

      toast.className += ` ${bgBorder}`;

      toast.innerHTML = `
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 ${iconColor}">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div class="flex-grow min-w-0 pr-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}">${badgeTag}</span>
            <span class="text-[10px] text-slate-400 font-mono">เมื่อสักครู่</span>
          </div>
          <h4 class="text-sm font-bold text-white leading-snug line-clamp-2">${item.title || 'มีการแจ้งเตือนใหม่'}</h4>
          <p class="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">${item.message || ''}</p>
          ${item.link ? `
            <div class="mt-2 text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1">
              <span>เปิดดูรายละเอียด</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </div>
          ` : ''}
        </div>
        <button class="text-slate-400 hover:text-white p-1 flex-shrink-0" title="ปิด">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      `;

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons({ root: toast });
      }

      toast.onclick = (e) => {
        if (e.target.closest('button')) {
          closeToast(toast);
          return;
        }
        markAsRead(item.id);
        if (item.link) {
          window.location.href = item.link;
        }
        closeToast(toast);
      };

      container.appendChild(toast);

      // Slide in animation
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-20px]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      // เสียงแจ้งเตือนเบาๆ
      playNotificationSound();

      // Auto dismiss after 6s
      const timer = setTimeout(() => {
        closeToast(toast);
      }, 7000);

      function closeToast(el) {
        clearTimeout(timer);
        el.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => el.remove(), 350);
      }
    },

    // 4. ดึงข้อมูลแจ้งเตือนทั้งหมด
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
            .limit(30);

          if (!error && Array.isArray(data)) {
            list = data;
            localStorage.setItem(STORAGE_LOCAL_CACHE, JSON.stringify(data));
          }
        } catch (e) {
          console.warn('[NotificationEngine] Fetch error, using fallback:', e);
        }
      }

      // ถ้าไม่มีการตอบกลับจาก Supabase ให้ใช้ Cache
      if (!list || list.length === 0) {
        try {
          const cached = localStorage.getItem(STORAGE_LOCAL_CACHE);
          if (cached) list = JSON.parse(cached);
        } catch (e) {}
      }

      notificationsList = list;
      updateBadge();
      renderNotificationDropdown();
      return list;
    },

    // 5. ติดตาม Realtime
    initRealtime() {
      const client = getClient();
      if (!client || realtimeSub) return;

      try {
        realtimeSub = client
          .channel('public:notifications')
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
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, () => {
            NotificationEngine.fetchNotifications();
          })
          .subscribe();
      } catch (e) {
        console.warn('[NotificationEngine] Realtime sub error:', e);
      }
    },

    // 6. เพิ่ม Component Bell เข้า Navbar อัตโนมัติ (หากมี container)
    mountUI() {
      renderBellButton();
      this.fetchNotifications();
      this.initRealtime();

      // ขออนุญาตเปิดการแจ้งเตือนอัตโนมัติเมื่อเข้าแอป/เว็บ
      setTimeout(() => {
        this.promptPermissionModal();
      }, 1200);
    }
  };

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
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

    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(b => {
      if (unreadCount > 0) {
        b.textContent = unreadCount > 99 ? '99+' : unreadCount;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });
  }

  function renderBellButton() {
    // หาจุดเชื่อมต่อใน Navbar (เช่น ข้างปุ่ม PWA หรือ Profile)
    const targetAreas = [
      document.querySelector('#navRightActions'),
      document.querySelector('header .flex.items-center.gap-3:last-child'),
      document.querySelector('header .flex.items-center.gap-2:last-child'),
      document.querySelector('nav .flex.items-center:last-child')
    ];

    const target = targetAreas.find(el => el !== null);
    if (!target || document.getElementById('btnNotificationTrigger')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-block';
    wrapper.id = 'comed-notification-wrapper';

    wrapper.innerHTML = `
      <button id="btnNotificationTrigger" type="button" aria-label="ศูนย์การแจ้งเตือน"
        class="relative p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="bell" class="w-4 h-4"></i>
        <span class="notification-badge hidden absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-lg shadow-rose-500/50 animate-pulse">
          0
        </span>
      </button>

      <!-- Dropdown Notification Center Panel -->
      <div id="notificationDropdown" class="hidden absolute right-0 mt-2 w-[340px] sm:w-[380px] max-w-[92vw] rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl z-[99999] overflow-hidden flex flex-col max-h-[500px]">
        <!-- Header -->
        <div class="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <i data-lucide="bell" class="w-3.5 h-3.5"></i>
            </div>
            <h3 class="text-xs font-black text-white">การแจ้งเตือนสาขา</h3>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnMarkAllRead" class="text-[11px] text-slate-400 hover:text-orange-400 transition font-medium">
              อ่านทั้งหมด
            </button>
            <button id="btnRequestPushPerm" title="เปิด Push Alert" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
              <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Body Items List -->
        <div id="notificationItemsList" class="flex-grow overflow-y-auto divide-y divide-white/5 max-h-[380px] custom-scroll">
          <div class="p-8 text-center text-slate-500 text-xs">
            กำลังโหลดข้อมูลการแจ้งเตือน...
          </div>
        </div>

        <!-- Footer -->
        <div class="p-2.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>COMED23 Live Alert Hub</span>
          <a href="notification-admin.html" id="linkNotifAdmin" class="text-orange-400 hover:text-orange-300 font-bold hidden flex items-center gap-1">
            <span>ส่งแจ้งเตือน (Admin)</span>
            <i data-lucide="chevron-right" class="w-3 h-3"></i>
          </a>
        </div>
      </div>
    `;

    target.prepend(wrapper);

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons({ root: wrapper });
    }

    // Toggle Dropdown
    const trigger = wrapper.querySelector('#btnNotificationTrigger');
    const dropdown = wrapper.querySelector('#notificationDropdown');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      if (!dropdown.classList.contains('hidden')) {
        renderNotificationDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Mark all read button
    wrapper.querySelector('#btnMarkAllRead').addEventListener('click', () => {
      markAllAsRead();
    });

    // Request Web Notification permission
    wrapper.querySelector('#btnRequestPushPerm').addEventListener('click', async () => {
      const res = await NotificationEngine.requestPermission();
      if (res === 'granted') {
        alert('เปิดการแจ้งเตือนบนอุปกรณ์เรียบร้อยแล้ว!');
      } else if (res === 'denied') {
        alert('กรุณาเปิดสิทธิ์ Notification ในการตั้งค่าเบราว์เซอร์');
      }
    });

    // Check if user is admin to show shortcut
    const adminEmail = (sessionStorage.getItem('COMED_KKU69_ADMIN_LOGGED_USER') || '').toLowerCase().trim();
    if (adminEmail) {
      const link = wrapper.querySelector('#linkNotifAdmin');
      if (link) link.classList.remove('hidden');
    }
  }

  function renderNotificationDropdown() {
    const listEl = document.getElementById('notificationItemsList');
    if (!listEl) return;

    if (notificationsList.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 text-xs">
          <i data-lucide="check-circle" class="w-8 h-8 text-emerald-400/50 mx-auto mb-2"></i>
          <p class="font-bold text-slate-300">ไม่มีการแจ้งเตือนใหม่</p>
          <p class="text-[11px] text-slate-500 mt-0.5">คุณติดตามข้อมูลข่าวสารครบถ้วนแล้ว</p>
        </div>
      `;
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons({ root: listEl });
      return;
    }

    const readIds = getReadIds();

    listEl.innerHTML = notificationsList.map(item => {
      const isUnread = !readIds.includes(item.id);
      let badgeTag = 'ทั่วไป';
      let badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      let iconName = 'info';

      if (item.type === 'urgent') {
        badgeTag = 'ด่วนที่สุด';
        badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        iconName = 'alert-triangle';
      } else if (item.type === 'warning') {
        badgeTag = 'สำคัญ';
        badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        iconName = 'alert-circle';
      } else if (item.type === 'event') {
        badgeTag = 'กิจกรรม';
        badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
        iconName = 'calendar';
      }

      const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'เมื่อสักครู่';

      return `
        <div class="p-3.5 hover:bg-white/5 transition flex gap-3 cursor-pointer ${isUnread ? 'bg-orange-500/[0.04]' : 'opacity-80'}"
          onclick="window.NotificationEngine.onItemClick('${item.id}', '${item.link || ''}')">
          <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-orange-400">
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
          </div>
          <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badgeClass}">${badgeTag}</span>
              <span class="text-[10px] text-slate-500 font-mono">${dateStr}</span>
            </div>
            <h4 class="text-xs font-bold text-white line-clamp-1 ${isUnread ? 'text-orange-300' : ''}">${item.title || 'ประกาศ'}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">${item.message || ''}</p>
          </div>
          ${isUnread ? '<div class="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-2"></div>' : ''}
        </div>
      `;
    }).join('');

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons({ root: listEl });
    }
  }

  NotificationEngine.onItemClick = function (id, link) {
    markAsRead(id);
    if (link) {
      window.location.href = link;
    }
  };

  // Expose to window
  window.NotificationEngine = NotificationEngine;

  // Auto mount when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationEngine.mountUI());
  } else {
    NotificationEngine.mountUI();
  }

})(window);
