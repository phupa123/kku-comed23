/**
 * PWA Installer & Service Worker Registration Script
 * Automatically registers sw.js, handles beforeinstallprompt, and renders mobile install UI
 */

(function () {
  'use strict';

  let deferredPrompt = null;

  const STORAGE_INSTALLED_FLAG = 'COMED23_APP_INSTALLED';
  const STORAGE_DISMISSED_INSTALL = 'COMED23_APP_INSTALL_DISMISSED';

  // ตรวจสอบอย่างละเอียดว่าแอปถูกติดตั้งแล้ว หรือเปิดอยู่ในโหมด Standalone / Web App หรือ Native APK หรือไม่
  function isAppInstalled() {
    // ถ้าผู้ใช้เคยปิดหรือปัดทิ้ง ไม่ต้องบังคับผู้ใช้อีก
    if (localStorage.getItem(STORAGE_DISMISSED_INSTALL) === 'true') return true;

    // 0. ตรวจสอบโหมด Native App (Capacitor / Android WebView / Local Origin)
    const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const isLocalOrigin = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost';
    const isWebView = /wv|android.*version\/[0-9.]+/i.test(navigator.userAgent || '') && !/chrome\/[0-9.]+\s+mobile/i.test(navigator.userAgent || '');
    if (isCapacitor || isLocalOrigin || isWebView) return true;

    // 1. ตรวจสอบ display-mode standalone, fullscreen, minimal-ui
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // 2. ตรวจสอบ iOS Safari Standalone
    const isIosStandalone = ('standalone' in window.navigator) && (window.navigator.standalone === true);

    // 3. ตรวจสอบ Document Referrer หรือ URL parameter (เช่น ?source=pwa หรือเปิดจาก homescreen)
    const urlParams = new URLSearchParams(window.location.search);
    const isPwaParam = urlParams.get('source') === 'pwa' || urlParams.get('utm_source') === 'pwa';

    // 4. ตรวจสอบ Flag ที่บันทึกไว้ใน LocalStorage เมื่อเคยกดติดตั้งสำเร็จ
    const isInstalledFlag = localStorage.getItem(STORAGE_INSTALLED_FLAG) === 'true';

    return isStandaloneDisplay || isIosStandalone || isPwaParam || isInstalledFlag;
  }

  // 1. ซ่อนปุ่มติดตั้งทุกจุดในหน้าเว็บทันทีถ้าติดตั้งแล้ว
  function hideAllInstallButtons() {
    const triggers = document.querySelectorAll('.btn-pwa-install-trigger, [title*="ติดตั้งแอป"], button[onclick*="triggerPwaInstall"]');
    triggers.forEach(el => {
      el.style.display = 'none';
      el.classList.add('hidden');
    });

    const pill = document.getElementById('pwaInstallFloatingPill');
    if (pill) pill.remove();
  }

  // 2. Register Service Worker with Real-Time Update Detection
  let refreshing = false;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);

          // Check if a new service worker is waiting
          if (reg.waiting) {
            showUpdateNotification(reg.waiting);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdateNotification(newWorker);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  function showUpdateNotification(worker) {
    if (document.getElementById('swUpdatePill')) return;

    const pill = document.createElement('div');
    pill.id = 'swUpdatePill';
    pill.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#090D16]/95 border border-orange-500/40 text-white shadow-2xl backdrop-blur-2xl text-xs max-w-sm sm:max-w-md w-[92%] sm:w-auto animate-bounce-in';
    pill.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-orange-500/20 text-[#E65A19] flex items-center justify-center flex-shrink-0 border border-orange-500/30">
        <i data-lucide="sparkles" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-white text-xs">เวอร์ชันใหม่พร้อมใช้งาน</div>
        <div class="text-[11px] text-slate-400 truncate">อัปเดตระบบและปรับปรุงความเร็ว</div>
      </div>
      <button id="swUpdateBtn" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E65A19] to-[#B32B19] text-white font-bold text-xs hover:opacity-90 transition flex-shrink-0 shadow cursor-pointer">
        อัปเดตทันที
      </button>
      <button id="swDismissBtn" class="p-1 rounded-lg text-slate-400 hover:text-white transition flex-shrink-0 cursor-pointer" title="ปิด">
        &times;
      </button>
    `;

    document.body.appendChild(pill);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    pill.querySelector('#swUpdateBtn').onclick = () => {
      pill.querySelector('#swUpdateBtn').innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> กำลังโหลด...';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      worker.postMessage({ type: 'SKIP_WAITING' });
    };

    pill.querySelector('#swDismissBtn').onclick = () => {
      pill.remove();
    };
  }

  // 3. Capture install prompt (Chrome / Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    if (isAppInstalled()) {
      e.preventDefault();
      hideAllInstallButtons();
      return;
    }
    e.preventDefault();
    deferredPrompt = e;
    showPwaInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Application successfully installed');
    localStorage.setItem(STORAGE_INSTALLED_FLAG, 'true');
    deferredPrompt = null;
    hideAllInstallButtons();
  });

  // 4. Render PWA Install Floating Pill & Rich Modal
  function showPwaInstallBanner() {
    if (isAppInstalled()) {
      hideAllInstallButtons();
      return; // Already installed or in app mode
    }

    // Only show navbar button if really not installed yet
    document.querySelectorAll('.btn-pwa-install-trigger').forEach(el => {
      el.classList.remove('hidden');
    });

    if (document.getElementById('pwaInstallFloatingPill')) return;

    const pill = document.createElement('div');
    pill.id = 'pwaInstallFloatingPill';
    pill.className = 'fixed bottom-5 right-5 z-40 flex items-center gap-1.5 transition duration-300';
    pill.innerHTML = `
      <div class="flex items-center gap-1 p-1 bg-slate-900/95 border border-white/20 rounded-2xl shadow-xl backdrop-blur-xl">
        <button onclick="window.triggerPwaInstall()" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-white"><rect width="14" height="20" x="5" y="2" rx="2" rx="2"/><path d="M12 18h.01"/></svg>
          <span>ติดตั้งแอป</span>
        </button>
        <button onclick="window.dismissPwaInstallPill()" title="ไม่ต้องแสดงอีก" class="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(pill);
  }

  function hidePwaInstallBanner() {
    const pill = document.getElementById('pwaInstallFloatingPill');
    if (pill) pill.remove();
  }

  window.dismissPwaInstallPill = function () {
    localStorage.setItem(STORAGE_DISMISSED_INSTALL, 'true');
    hidePwaInstallBanner();
  };

  // Visual Interactive Install Guide Modal
  window.triggerPwaInstall = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
        }
        deferredPrompt = null;
        hidePwaInstallBanner();
      });
      return;
    }

    openPwaGuideModal();
  };

  function openPwaGuideModal() {
    const existing = document.getElementById('modalPwaGuide');
    if (existing) existing.remove();

    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isAndroid = /android/.test(window.navigator.userAgent.toLowerCase());
    const isDesktop = !isIos && !isAndroid;

    const modal = document.createElement('div');
    modal.id = 'modalPwaGuide';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200';
    
    let contentHtml = '';

    if (isIos) {
      // Step-by-step iOS Safari visual guide
      contentHtml = `
        <div class="space-y-4">
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
            <div>
              <h5 class="font-bold text-white text-xs">แตะปุ่ม "แชร์" (Share) ที่แถบล่าง Safari</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">มองหาไอคอนสี่เหลี่ยมที่มีลูกศรชี้ขึ้น <strong>[ ↑ ]</strong> ที่ขอบล่างของหน้าจอ</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <div>
              <h5 class="font-bold text-white text-xs">เลื่อนลงมาแล้วเลือก "เพิ่มไปยังหน้าจอโฮม"</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">เลือกเมนู <strong>"Add to Home Screen"</strong> (ไอคอนเครื่องหมายบวก)</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
            <div>
              <h5 class="font-bold text-white text-xs">แตะ "เพิ่ม" (Add) ที่มุมขวาบน</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">ไอคอนแอป COMED23 จะไปอยู่ที่หน้าจอโฮมมือถือ เปิดใช้งานได้เต็มจอทันที!</p>
            </div>
          </div>
        </div>
      `;
    } else if (isAndroid) {
      // Android Chrome Guide
      contentHtml = `
        <div class="space-y-4">
          <div class="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
            <div>
              <h5 class="font-bold text-white text-xs">แตะเมนูจุด 3 จุด (⋮)</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">อยู่ที่มุมขวาบนสุดของ Google Chrome</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <div>
              <h5 class="font-bold text-white text-xs">เลือก "ติดตั้งแอป" หรือ "เพิ่มลงหน้าจอหลัก"</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">เลือก <strong>Install App</strong> หรือ <strong>Add to Home screen</strong></p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
            <div>
              <h5 class="font-bold text-white text-xs">ยืนยันการติดตั้ง</h5>
              <p class="text-[11px] text-slate-300 mt-0.5">ระบบจะดาวน์โหลดและสร้างไอคอนแอปลงบนมือถือของคุณ</p>
            </div>
          </div>
        </div>
      `;
    } else {
      // Desktop / PC Guide with QR Code to open directly on phone
      const PUBLIC_ORIGIN = "https://kku-comed23.edspace.workers.dev";
      let shareUrl = window.location.href;
      try {
        const parsed = new URL(shareUrl);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.protocol === 'capacitor:') {
          shareUrl = PUBLIC_ORIGIN + (parsed.pathname === '/' ? '/index.html' : parsed.pathname) + parsed.search;
        }
      } catch (e) {}

      const currentUrl = encodeURIComponent(shareUrl);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${currentUrl}`;
      contentHtml = `
        <div class="text-center space-y-4">
          <p class="text-xs text-slate-300">
            คุณกำลังเปิดบนคอมพิวเตอร์ ใช้มือถือสแกน QR Code ด้านล่างนี้เพื่อเปิดและติดตั้งแอปลงในมือถือของคุณ:
          </p>
          <div class="p-3 bg-white rounded-2xl inline-block shadow-xl border border-white/20">
            <img src="${qrUrl}" alt="QR Code" class="w-36 h-36 mx-auto">
          </div>
          <p class="text-[11px] text-amber-400 font-bold">
            สแกนด้วยกล้องมือถือ เพื่อเปิดบน iPhone หรือ Android
          </p>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="glass-card rounded-3xl border border-white/15 max-w-sm w-full p-6 shadow-2xl relative space-y-5 bg-slate-900/95">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <img src="/logo.png" alt="COMED23" class="w-8 h-8 rounded-xl object-contain bg-slate-800 p-0.5 border border-white/10">
            <div>
              <h4 class="text-sm font-black text-white">วิธีติดตั้งแอป COMED23</h4>
              <span class="text-[10px] text-orange-400 font-bold">${isIos ? '📱 สำหรับ iPhone / iPad' : isAndroid ? '🤖 สำหรับ Android' : '💻 เปิดบนมือถือเพื่อติดตั้ง'}</span>
            </div>
          </div>
          <button onclick="this.closest('#modalPwaGuide').remove()" class="p-1 rounded-xl text-slate-400 hover:text-white">&times;</button>
        </div>

        ${contentHtml}

        <div class="pt-2 border-t border-white/10 text-center">
          <button onclick="this.closest('#modalPwaGuide').remove()" class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition">
            เข้าใจแล้ว ปิดหน้าต่าง
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Run immediately as script evaluates and when DOM is loaded
  if (isAppInstalled()) {
    hideAllInstallButtons();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (isAppInstalled()) hideAllInstallButtons();
    });
  }

  // Listen to display-mode changes (e.g. user launches standalone window)
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) hideAllInstallButtons();
    });
  } catch(e) {}

  // Check after window load
  window.addEventListener('load', () => {
    if (isAppInstalled()) {
      hideAllInstallButtons();
    } else {
      setTimeout(showPwaInstallBanner, 1500);
    }
  });

})();
