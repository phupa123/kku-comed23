/**
 * =========================================================================
 * IN-APP AUTO UPDATER (DIRECT APK & PWA VERSION CHECKER)
 * ตรวจสอบเวอร์ชันล่าสุดของแอปอัตโนมัติ และเด้งป๊อปอัปให้กดอัปเดตไฟล์ APK ทันที
 * =========================================================================
 */

(function (window) {
  'use strict';

  // เวอร์ชันที่ฝังอยู่ในตัวแอปเวอร์ชันนี้
  const CURRENT_APP_VERSION = "1.0.1";
  const STORAGE_DISMISSED_KEY = "COMED_DISMISSED_UPDATE_VER";

  const AppUpdater = {
    currentVersion: CURRENT_APP_VERSION,

    async checkUpdate(force = false) {
      try {
        // ดึงไฟล์ version.json ล่าสุดจากเซิร์ฟเวอร์แบบ No-Cache
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (!res.ok) return;
        const remote = await res.json();

        if (this.isNewerVersion(CURRENT_APP_VERSION, remote.version)) {
          const dismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
          if (dismissed === remote.version && !force && !remote.mandatory) {
            return; // ผู้ใช้เคยกดเลื่อนการอัปเดตไปแล้ว
          }
          this.showUpdateDialog(remote);
        }
      } catch (err) {
        console.log('[AppUpdater] Check error (ignored):', err);
      }
    },

    isNewerVersion(current, remote) {
      const cParts = current.split('.').map(n => parseInt(n, 10) || 0);
      const rParts = remote.split('.').map(n => parseInt(n, 10) || 0);
      for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
        const c = cParts[i] || 0;
        const r = rParts[i] || 0;
        if (r > c) return true;
        if (r < c) return false;
      }
      return false;
    },

    showUpdateDialog(remote) {
      if (document.getElementById('modalAppUpdatePrompt')) return;

      const modal = document.createElement('div');
      modal.id = 'modalAppUpdatePrompt';
      modal.className = 'fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200';

      const changelogHtml = (remote.changelog || [])
        .map(item => `<li class="flex items-start gap-2"><span class="text-orange-400 font-bold">•</span><span>${item}</span></li>`)
        .join('');

      modal.innerHTML = `
        <div class="glass-card rounded-[32px] border border-orange-500/40 p-6 sm:p-7 max-w-sm w-full bg-slate-900/95 shadow-[0_25px_80px_rgba(249,115,22,0.25)] text-center space-y-5 animate-in zoom-in-95 duration-200">
          
          <!-- Animated Update Rocket Icon -->
          <div class="relative w-16 h-16 mx-auto">
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 blur-xl opacity-60 animate-pulse"></div>
            <div class="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-xl">
              <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 animate-bounce"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
              </div>
            </div>
          </div>

          <!-- Header Titles -->
          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
              NEW VERSION AVAILABLE
            </span>
            <h3 class="text-lg font-black text-white pt-1">
              พบการอัปเดตใหม่! (v${remote.version})
            </h3>
            <p class="text-xs text-slate-300">${remote.title || 'มีการปรับปรุงประสิทธิภาพและคุณสมบัติใหม่'}</p>
          </div>

          <!-- Changelog Box -->
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">สิ่งใหม่ในเวอร์ชันนี้:</span>
            <ul class="text-xs text-slate-200 space-y-1.5 leading-relaxed">
              ${changelogHtml}
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2 pt-1">
            <a href="${remote.downloadUrl || '/kku-comed23.apk'}" download="kku-comed23.apk" id="btnConfirmUpdate"
              class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs shadow-xl shadow-orange-500/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>ดาวน์โหลดและอัปเดตทันที (Direct)</span>
            </a>

            ${!remote.mandatory ? `
              <button onclick="window.AppUpdater.dismissUpdate('${remote.version}')"
                class="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white font-bold text-xs hover:bg-white/5 transition cursor-pointer">
                ไว้คราวหลัง
              </button>
            ` : ''}
          </div>

        </div>
      `;

      document.body.appendChild(modal);
    },

    dismissUpdate(ver) {
      localStorage.setItem(STORAGE_DISMISSED_KEY, ver);
      const m = document.getElementById('modalAppUpdatePrompt');
      if (m) m.remove();
    }
  };

  window.AppUpdater = AppUpdater;

  // เริ่มต้นตรวจเช็กเวอร์ชันเมื่อโหลดหน้าเว็บเรียบร้อยแล้ว
  window.addEventListener('load', () => {
    setTimeout(() => {
      AppUpdater.checkUpdate();
    }, 2000);
  });

})(window);
