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

  const BUILD_NUMBER = "10103"; // รหัสเวอร์ชันแอปปัจจุบัน v1.0.3

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
    badge.style.cssText = 'position:fixed;bottom:8px;right:10px;z-index:999999;user-select:none;font-family:monospace;cursor:pointer;';
    badge.title = 'แตะเพื่อตรวจสอบการอัปเดตเวอร์ชันล่าสุด';
    badge.innerHTML = `
      <span style="font-size:10px;font-weight:bold;letter-spacing:1px;color:#f97316;background:rgba(15,23,42,0.85);padding:3px 9px;border-radius:10px;border:1px solid rgba(249,115,22,0.35);box-shadow:0 2px 10px rgba(0,0,0,0.5);display:inline-flex;align-items:center;gap:4px;transition:all 0.2s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
        <span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
        ${vCode}
      </span>
    `;

    badge.onclick = () => {
      if (window.AppUpdater && typeof window.AppUpdater.checkUpdate === 'function') {
        window.AppUpdater.checkUpdate(true);
      } else {
        window.location.href = 'download.html';
      }
    };

    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountVersionBadge);
  } else {
    mountVersionBadge();
  }
})();
