/**
 * =========================================================================
 * COMED23 PLATFORM RUNTIME & VERSION WATERMARK
 * =========================================================================
 * แสดงเวอร์ชันเล็กๆ บริเวณมุมขวาล่าง แบบ subtle / minimalist:
 * - V_W_10101 (Website / Web Browser)
 * - V_P_10101 (PWA Installed / Standalone)
 * - V_A_10101 (Android APK Direct Native)
 * - V_I_10101 (iOS Native / Future)
 * =========================================================================
 */

(function () {
  'use strict';

  const BUILD_NUMBER = "10102"; // รหัสเวอร์ชันแอปปัจจุบัน

  function detectRuntimeCode() {
    const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const isAndroid = /android/i.test(navigator.userAgent || '');
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent || '');

    // 1. Android APK Direct Native
    if (isCapacitor && isAndroid) return `V_A_${BUILD_NUMBER}`;
    
    // 2. iOS Native (Future)
    if (isCapacitor && isIos) return `V_I_${BUILD_NUMBER}`;

    // 3. PWA Standalone Mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         ('standalone' in window.navigator && window.navigator.standalone === true);
    if (isStandalone) {
      if (isAndroid) return `V_A_PWA_${BUILD_NUMBER}`;
      if (isIos) return `V_I_PWA_${BUILD_NUMBER}`;
      return `V_P_${BUILD_NUMBER}`;
    }

    // 4. Default: Website Browser
    return `V_W_${BUILD_NUMBER}`;
  }

  function mountVersionBadge() {
    if (document.getElementById('comedAppVersionBadge')) return;

    const vCode = detectRuntimeCode();
    const badge = document.createElement('div');
    badge.id = 'comedAppVersionBadge';
    badge.className = 'fixed bottom-2 right-2.5 z-40 pointer-events-none select-none opacity-40 hover:opacity-100 transition-opacity duration-300';
    badge.innerHTML = `
      <span class="text-[9px] font-mono tracking-widest text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-white/5 backdrop-blur-xs">
        ${vCode}
      </span>
    `;

    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountVersionBadge);
  } else {
    mountVersionBadge();
  }
})();
