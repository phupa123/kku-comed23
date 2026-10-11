/**
 * PWA Installer & Service Worker Registration Script
 * Automatically registers sw.js, handles beforeinstallprompt, and renders mobile install UI
 */

(function () {
  'use strict';

  let deferredPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Capture install prompt (Chrome / Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPwaInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Application successfully installed');
    deferredPrompt = null;
    hidePwaInstallBanner();
  });

  // 3. Render PWA Install Banner & Modal
  function showPwaInstallBanner() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return; // Already in standalone app mode
    }

    if (document.getElementById('pwaInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300';
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 flex-shrink-0">
          <img src="/logo.png" alt="COMED23" class="w-full h-full object-contain rounded-[14px]">
        </div>
        <div>
          <h4 class="text-xs font-black text-white">ติดตั้งแอป COMED23</h4>
          <p class="text-[11px] text-slate-300">เข้าใช้งานสะดวกแบบแอปเต็มจอบนมือถือ</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <button id="btnPwaInstallAction" class="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs shadow-md transition transform active:scale-95 cursor-pointer">
          ติดตั้ง
        </button>
        <button id="btnPwaCloseBanner" class="p-1 rounded-xl text-slate-400 hover:text-white" title="ปิด">
          &times;
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('btnPwaInstallAction').onclick = () => {
      triggerPwaInstall();
    };

    document.getElementById('btnPwaCloseBanner').onclick = () => {
      hidePwaInstallBanner();
    };
  }

  function hidePwaInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
  }

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
    } else {
      // Guide for iOS Safari or browsers without beforeinstallprompt
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        alert("📲 วิธีติดตั้งแอปบน iPhone / iPad:\n\n1. แตะปุ่ม 'แชร์' (ไอคอนสี่เหลี่ยมลูกศรชี้ขึ้น ที่แถบล่างของ Safari)\n2. เลื่อนลงมาแล้วเลือก 'เพิ่มไปยังหน้าจอหลัก' (Add to Home Screen)\n3. แตะ 'เพิ่ม' (Add)");
      } else {
        alert("📲 วิธีติดตั้งแอป:\n\nแตะที่เมนู 3 จุดของเบราว์เซอร์ (มุมบนขวา) แล้วเลือก 'ติดตั้งแอปพลิเคชัน' หรือ 'เพิ่มไปยังหน้าจอหลัก' (Add to Home Screen)");
      }
    }
  };

})();
