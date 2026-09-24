/**
 * =========================================================================
 * COMED23 QR SUITE - assets/js/qr_suite.js
 * Comprehensive QR Code Generator & Scanner Suite
 * 1. QR Code Display / Page Sharing Modal (ให้เพื่อนสแกนเข้าหน้าเว็บ / ดาวน์โหลด / คัดลอก)
 * 2. QR Code Scanner Modal (เปิดกล้องสแกนสด + อัปโหลดรูปภาพ QR Code สแกน)
 * =========================================================================
 */

(function(window) {
  'use strict';

  // Global instance placeholder
  const QRSuite = {
    scannerInstance: null,
    activeCameraId: null,
    isScanning: false,

    /**
     * สร้าง container modal ใน DOM หากยังไม่มี
     */
    ensureModalsExist() {
      if (!document.getElementById('qrSuiteShareModal')) {
        const shareModalHtml = `
        <div id="qrSuiteShareModal" class="hidden fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button onclick="window.QRSuite.closeShareModal()" class="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>

            <div class="space-y-1 pt-1">
              <span id="qrSuiteShareBadge" class="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <i data-lucide="qr-code" class="w-3 h-3"></i>
                <span id="qrSuiteShareBadgeText">SCAN TO VISIT</span>
              </span>
              <h4 id="qrSuiteShareTitle" class="text-base font-black text-white truncate px-4">สแกนเปิดหน้าเว็บ</h4>
              <p id="qrSuiteShareSubtitle" class="text-xs text-slate-400 font-sans">ให้เพื่อนสแกนเพื่อเข้าใช้งานหน้านี้ได้ทันที</p>
            </div>

            <!-- Switcher: Public User vs Admin Page (If applicable) -->
            <div id="qrSuitePageSwitchWrapper" class="hidden">
              <div class="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                <button id="qrSuiteBtnUserPage" onclick="window.QRSuite.switchShareTarget('user')" class="flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 bg-orange-600 text-white shadow-sm">
                  <i data-lucide="users" class="w-3.5 h-3.5"></i>
                  <span>หน้าผู้ใช้ (User)</span>
                </button>
                <button id="qrSuiteBtnAdminPage" onclick="window.QRSuite.switchShareTarget('admin')" class="flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-slate-400 hover:text-white">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                  <span>หน้าแอดมิน</span>
                </button>
              </div>
            </div>

            <!-- QR Code Canvas Display -->
            <div class="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border-4 border-white">
              <div id="qrSuiteShareQrContainer" class="w-48 h-48 flex items-center justify-center overflow-hidden"></div>
            </div>

            <div class="space-y-2 pt-1 text-left">
              <label class="text-[11px] font-bold text-slate-400 block px-1">ลิงก์ URL สำหรับเข้าใช้งาน:</label>
              <div class="relative">
                <input type="text" id="qrSuiteShareUrlInput" readonly class="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-orange-400 font-mono text-xs outline-none select-all truncate">
                <button onclick="window.QRSuite.copyShareUrl()" title="คัดลอกลิงก์" class="absolute right-2 top-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button onclick="window.QRSuite.copyShareUrl()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <i data-lucide="copy" class="w-3.5 h-3.5 text-orange-400"></i>
                  <span>คัดลอกลิงก์</span>
                </button>
                <button onclick="window.QRSuite.downloadShareQr()" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>บันทึกรูป QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', shareModalHtml);
      }

      if (!document.getElementById('qrSuiteScannerModal')) {
        const scannerModalHtml = `
        <div id="qrSuiteScannerModal" class="hidden fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button onclick="window.QRSuite.closeScannerModal()" class="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>

            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                <i data-lucide="scan-line" class="w-3.5 h-3.5"></i>
                <span>QR CODE SCANNER</span>
              </div>
              <h4 id="qrSuiteScannerTitle" class="text-base font-black text-white">สแกน QR Code</h4>
              <p class="text-xs text-slate-400">รองรับทั้งเปิดกล้องสแกนสด และเลือกรูปภาพ QR จากเครื่อง</p>
            </div>

            <!-- Mode Switcher: Camera vs Image File -->
            <div class="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button id="qrSuiteScannerTabCamera" onclick="window.QRSuite.switchScannerTab('camera')" class="flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-orange-600 text-white shadow-sm cursor-pointer">
                <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                <span>เปิดกล้องสแกน</span>
              </button>
              <button id="qrSuiteScannerTabFile" onclick="window.QRSuite.switchScannerTab('file')" class="flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer">
                <i data-lucide="image" class="w-3.5 h-3.5"></i>
                <span>อัปโหลดรูปภาพ QR</span>
              </button>
            </div>

            <!-- Camera View Container -->
            <div id="qrSuiteCameraPanel" class="space-y-3">
              <div class="relative w-full aspect-square max-w-[280px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <div id="qrSuiteReaderVideo" class="w-full h-full object-cover"></div>
                <div id="qrSuiteCameraOverlay" class="pointer-events-none absolute inset-0 border-2 border-orange-500/40 rounded-2xl flex items-center justify-center">
                  <div class="w-48 h-48 border-2 border-orange-500 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <div class="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-0.5 -ml-0.5"></div>
                    <div class="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-0.5 -mr-0.5"></div>
                    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-0.5 -ml-0.5"></div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-0.5 -mr-0.5"></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs px-2 text-slate-400">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> กล้องกำลังทำงาน
                </span>
                <button onclick="window.QRSuite.toggleCameraFacing()" class="text-orange-400 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                  <i data-lucide="switch-camera" class="w-3.5 h-3.5"></i> สลับกล้องหน้า/หลัง
                </button>
              </div>
            </div>

            <!-- File Upload Scan Container -->
            <div id="qrSuiteFilePanel" class="hidden space-y-3">
              <label for="qrSuiteFileInput" class="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 bg-slate-950/60 cursor-pointer group">
                <div class="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition">
                  <i data-lucide="qr-code" class="w-7 h-7"></i>
                </div>
                <div>
                  <span class="text-xs font-bold text-white block">คลิกเลือกรูปภาพ หรือสกรีนช็อต QR Code</span>
                  <span class="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG, WebP</span>
                </div>
                <input type="file" id="qrSuiteFileInput" accept="image/*" class="hidden" onchange="window.QRSuite.handleImageFileScan(event)">
              </label>
              <div id="qrSuiteFileLoading" class="hidden text-xs text-orange-400 font-bold py-2">
                ⏳ กำลังวิเคราะห์รูปภาพ QR Code...
              </div>
            </div>

            <!-- Scan Result Display Box -->
            <div id="qrSuiteResultBox" class="hidden p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-left space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ตรวจพบข้อมูล QR Code
                </span>
                <button onclick="window.QRSuite.resetScanResult()" class="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                  สแกนใหม่
                </button>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono break-all max-h-24 overflow-y-auto" id="qrSuiteResultText">
                -
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1" id="qrSuiteResultActions">
                <button onclick="window.QRSuite.copyScanResult()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <i data-lucide="copy" class="w-3.5 h-3.5 text-orange-400"></i>
                  <span>คัดลอกข้อความ</span>
                </button>
                <a id="qrSuiteOpenLinkBtn" href="#" target="_blank" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>เปิดลิงก์ทันที</span>
                </a>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', scannerModalHtml);
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    currentShareData: null,
    currentShareMode: 'user', // 'user' | 'admin'

    /**
     * เปิดหน้าต่างแสดง QR Code ให้เพื่อนสแกน
     */
    openPageQrModal(options = {}) {
      this.ensureModalsExist();
      const currentLoc = window.location;
      const origin = currentLoc.origin || (window.location.protocol + '//' + window.location.host);
      
      // Default URL calculation
      let userUrl = options.userUrl || window.location.href;
      let adminUrl = options.adminUrl || window.location.href;

      this.currentShareData = {
        title: options.title || document.title.split('|')[0].trim() || 'หน้าเว็บสาขาวิชา',
        subtitle: options.subtitle || 'ให้เพื่อนสแกน QR Code นี้เพื่อเปิดหน้าเว็บได้ทันที',
        userUrl: userUrl,
        adminUrl: adminUrl,
        hasBoth: Boolean(options.userUrl && options.adminUrl && options.userUrl !== options.adminUrl),
        badgeText: options.badgeText || 'SCAN TO VISIT'
      };

      this.currentShareMode = (options.defaultMode === 'admin' && this.currentShareData.hasBoth) ? 'admin' : 'user';

      const switchWrapper = document.getElementById('qrSuitePageSwitchWrapper');
      if (this.currentShareData.hasBoth) {
        switchWrapper.classList.remove('hidden');
      } else {
        switchWrapper.classList.add('hidden');
      }

      this.renderShareQr();
      document.getElementById('qrSuiteShareModal').classList.remove('hidden');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    switchShareTarget(mode) {
      this.currentShareMode = mode;
      const btnUser = document.getElementById('qrSuiteBtnUserPage');
      const btnAdmin = document.getElementById('qrSuiteBtnAdminPage');
      if (mode === 'user') {
        btnUser.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 bg-orange-600 text-white shadow-sm';
        btnAdmin.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-slate-400 hover:text-white';
      } else {
        btnAdmin.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm';
        btnUser.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 text-slate-400 hover:text-white';
      }
      this.renderShareQr();
    },

    renderShareQr() {
      if (!this.currentShareData) return;
      const data = this.currentShareData;
      const targetUrl = (this.currentShareMode === 'admin') ? data.adminUrl : data.userUrl;
      const title = (this.currentShareMode === 'admin') ? `${data.title} (Admin)` : data.title;

      document.getElementById('qrSuiteShareTitle').textContent = title;
      document.getElementById('qrSuiteShareSubtitle').textContent = data.subtitle;
      document.getElementById('qrSuiteShareUrlInput').value = targetUrl;
      document.getElementById('qrSuiteShareBadgeText').textContent = (this.currentShareMode === 'admin') ? 'ADMIN ACCESS QR' : data.badgeText;

      const container = document.getElementById('qrSuiteShareQrContainer');
      container.innerHTML = '';

      if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
          text: targetUrl,
          width: 192,
          height: 192,
          colorDark: "#090d16",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } else {
        container.innerHTML = `<div class="text-xs text-rose-500 font-bold p-4">กำลังโหลดไลบรารี QRCode...</div>`;
      }
    },

    closeShareModal() {
      const modal = document.getElementById('qrSuiteShareModal');
      if (modal) modal.classList.add('hidden');
    },

    copyShareUrl() {
      const input = document.getElementById('qrSuiteShareUrlInput');
      if (!input) return;
      input.select();
      navigator.clipboard.writeText(input.value);
      alert("📋 คัดลอกลิงก์สำหรับสแกนเรียบร้อยแล้ว!");
    },

    downloadShareQr() {
      const container = document.getElementById('qrSuiteShareQrContainer');
      const img = container ? container.querySelector('img') : null;
      const canvas = container ? container.querySelector('canvas') : null;

      let dataUrl = null;
      if (img && img.src) {
        dataUrl = img.src;
      } else if (canvas) {
        dataUrl = canvas.toDataURL("image/png");
      }

      if (!dataUrl) {
        alert("ไม่สามารถบันทึกรูปภาพ QR Code ได้");
        return;
      }

      const a = document.createElement('a');
      a.href = dataUrl;
      const slug = (this.currentShareData?.title || 'page').toLowerCase().replace(/[^a-z0-9]/gi, '_');
      a.download = `qrcode_${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    // ==========================================
    // QR SCANNER LOGIC
    // ==========================================
    onScanSuccessCallback: null,
    currentFacingMode: "environment", // "environment" (หลัง) | "user" (หน้า)

    openScannerModal(options = {}) {
      this.ensureModalsExist();
      this.onScanSuccessCallback = options.onScanSuccess || null;
      if (options.title) {
        document.getElementById('qrSuiteScannerTitle').textContent = options.title;
      }

      this.resetScanResult();
      document.getElementById('qrSuiteScannerModal').classList.remove('hidden');
      this.switchScannerTab('camera');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    closeScannerModal() {
      this.stopCameraScanner();
      const modal = document.getElementById('qrSuiteScannerModal');
      if (modal) modal.classList.add('hidden');
    },

    switchScannerTab(tab) {
      const tabCamera = document.getElementById('qrSuiteScannerTabCamera');
      const tabFile = document.getElementById('qrSuiteScannerTabFile');
      const camPanel = document.getElementById('qrSuiteCameraPanel');
      const filePanel = document.getElementById('qrSuiteFilePanel');

      if (tab === 'camera') {
        tabCamera.className = 'flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-orange-600 text-white shadow-sm cursor-pointer';
        tabFile.className = 'flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer';
        camPanel.classList.remove('hidden');
        filePanel.classList.add('hidden');
        this.startCameraScanner();
      } else {
        tabFile.className = 'flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-orange-600 text-white shadow-sm cursor-pointer';
        tabCamera.className = 'flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer';
        filePanel.classList.remove('hidden');
        camPanel.classList.add('hidden');
        this.stopCameraScanner();
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    startCameraScanner() {
      if (typeof Html5Qrcode === 'undefined') {
        console.warn('Html5Qrcode library not loaded.');
        return;
      }

      if (this.isScanning) return;

      const videoElementId = "qrSuiteReaderVideo";
      if (!this.scannerInstance) {
        this.scannerInstance = new Html5Qrcode(videoElementId);
      }

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      this.isScanning = true;
      this.scannerInstance.start(
        { facingMode: this.currentFacingMode },
        config,
        (decodedText, decodedResult) => {
          this.handleScanFound(decodedText);
        },
        (errorMessage) => {
          // ignore parsing frame failure
        }
      ).catch(err => {
        console.error("Failed to start camera scanner:", err);
        this.isScanning = false;
        // fallback to file panel or notify user
      });
    },

    toggleCameraFacing() {
      this.currentFacingMode = (this.currentFacingMode === "environment") ? "user" : "environment";
      this.stopCameraScanner().then(() => {
        this.startCameraScanner();
      });
    },

    async stopCameraScanner() {
      if (this.scannerInstance && this.isScanning) {
        try {
          await this.scannerInstance.stop();
        } catch(e) {}
        this.isScanning = false;
      }
    },

    handleImageFileScan(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const loading = document.getElementById('qrSuiteFileLoading');
      if (loading) loading.classList.remove('hidden');

      if (typeof Html5Qrcode === 'undefined') {
        alert("ไลบรารีสแกนเนอร์ยังไม่พร้อมใช้งาน");
        if (loading) loading.classList.add('hidden');
        return;
      }

      const scanner = this.scannerInstance || new Html5Qrcode("qrSuiteReaderVideo");
      scanner.scanFile(file, true)
        .then(decodedText => {
          if (loading) loading.classList.add('hidden');
          this.handleScanFound(decodedText);
        })
        .catch(err => {
          if (loading) loading.classList.add('hidden');
          alert("ไม่พบ QR Code ในรูปภาพที่เลือก หรือภาพไม่ชัดเจน กรุณาลองใหม่");
        });
    },

    handleScanFound(text) {
      // Beep sound feedback
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880; // A5 note
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch(e) {}

      // Pause camera on find
      this.stopCameraScanner();

      const resultBox = document.getElementById('qrSuiteResultBox');
      const resultText = document.getElementById('qrSuiteResultText');
      const openBtn = document.getElementById('qrSuiteOpenLinkBtn');

      if (resultBox && resultText) {
        resultBox.classList.remove('hidden');
        resultText.textContent = text;
      }

      const isUrl = /^https?:\/\//i.test(text.trim());
      if (openBtn) {
        if (isUrl) {
          openBtn.href = text.trim();
          openBtn.classList.remove('hidden');
        } else {
          openBtn.classList.add('hidden');
        }
      }

      if (typeof this.onScanSuccessCallback === 'function') {
        try {
          this.onScanSuccessCallback(text);
        } catch(err) {
          console.error("Callback error:", err);
        }
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    resetScanResult() {
      const resultBox = document.getElementById('qrSuiteResultBox');
      if (resultBox) resultBox.classList.add('hidden');
      const fileInput = document.getElementById('qrSuiteFileInput');
      if (fileInput) fileInput.value = '';
      
      const tabCamera = document.getElementById('qrSuiteScannerTabCamera');
      if (tabCamera && tabCamera.classList.contains('bg-orange-600')) {
        this.startCameraScanner();
      }
    },

    copyScanResult() {
      const resultText = document.getElementById('qrSuiteResultText');
      if (!resultText) return;
      navigator.clipboard.writeText(resultText.textContent.trim());
      alert("📋 คัดลอกข้อมูลเรียบร้อยแล้ว!");
    }
  };

  // Expose to window
  window.QRSuite = QRSuite;

  // Auto initialize when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    QRSuite.ensureModalsExist();
  });

})(window);
