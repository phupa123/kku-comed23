/**
 * =========================================================================
 * COMED IN-BROWSER DOCUMENT PREVIEW ENGINE - assets/js/doc_preview_engine.js
 * ตัวแสดงตัวอย่างเอกสารในเบราว์เซอร์ 100% (Client-Side Rendering)
 * รองรับ: Excel (.xlsx, .xls, .csv), Word (.docx), PDF
 * โดยไม่ต้องพึ่งพา Google Drive / Google Docs Viewer หมดปัญหา 401 Unauthorized
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  class DocPreviewEngine {
    constructor() {
      this.cachedBuffers = new Map();
    }

    /**
     * ดึง ArrayBuffer ของไฟล์อย่างปลอดภัย (มี fallback ผ่าน CORS / Worker Proxy)
     */
    async fetchArrayBuffer(fileUrl, fileName = 'document') {
      if (this.cachedBuffers.has(fileUrl)) {
        return this.cachedBuffers.get(fileUrl);
      }

      // 1. Direct fetch
      try {
        const res = await fetch(fileUrl, { mode: 'cors' });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          this.cachedBuffers.set(fileUrl, buf);
          return buf;
        }
      } catch (e) {
        console.warn('[DocPreview] Direct fetch failed, trying proxy...', e);
      }

      // 2. Local / Worker Proxy
      try {
        const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;
        const pRes = await fetch(proxyUrl);
        if (pRes.ok) {
          const buf = await pRes.arrayBuffer();
          this.cachedBuffers.set(fileUrl, buf);
          return buf;
        }
      } catch (e) {
        console.warn('[DocPreview] Worker proxy fetch failed...', e);
      }

      // 3. AllOrigins fallback for public files
      try {
        const corsAnywhere = `https://api.allorigins.win/raw?url=${encodeURIComponent(fileUrl)}`;
        const cRes = await fetch(corsAnywhere);
        if (cRes.ok) {
          const buf = await cRes.arrayBuffer();
          this.cachedBuffers.set(fileUrl, buf);
          return buf;
        }
      } catch (e) {
        console.warn('[DocPreview] AllOrigins fetch failed...', e);
      }

      throw new Error('ไม่สามารถดึงข้อมูลไฟล์มาแสดงตัวอย่างได้ (CORS หรือสิทธิ์เข้าถึง)');
    }

    /**
     * เรนเดอร์ตัวอย่าง Excel (.xlsx, .xls, .csv)
     */
    async renderExcel(container, fileUrl, fileName = 'Spreadsheet.xlsx', options = {}) {
      if (!container) return;
      
      this.renderLoading(container, fileName, 'Excel Spreadsheet');

      try {
        const buffer = await this.fetchArrayBuffer(fileUrl, fileName);

        if (typeof XLSX === 'undefined') {
          throw new Error('SheetJS library is not loaded');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          throw new Error('ไม่พบแผ่นงาน (Sheet) ในไฟล์นี้');
        }

        // Generate container layout with Sheet Tabs & Table
        const uid = 'excel_' + Math.random().toString(36).substr(2, 9);
        const heightClass = options.heightClass || 'min-h-[70vh] h-[75vh]';

        container.innerHTML = `
          <div class="w-full ${heightClass} flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <!-- Header Bar -->
            <div class="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 select-none">
              <div class="flex items-center gap-2 font-bold min-w-0">
                <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <i data-lucide="table" class="w-3.5 h-3.5"></i>
                </span>
                <span class="truncate max-w-[200px] sm:max-w-md font-mono text-white text-xs">${this.escapeHtml(fileName)}</span>
                <span class="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Client-Side SheetJS</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a href="${fileUrl}" target="_blank" download="${this.escapeHtml(fileName)}" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 text-xs transition border border-slate-700">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>ดาวน์โหลด</span>
                </a>
              </div>
            </div>

            <!-- Sheet Tabs (If multiple sheets) -->
            ${sheetNames.length > 1 ? `
              <div class="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs" id="${uid}_tabs">
                ${sheetNames.map((name, idx) => `
                  <button type="button" data-sheet-idx="${idx}" class="sheet-tab-btn px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${idx === 0 ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}">
                    ${this.escapeHtml(name)}
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Table View Area -->
            <div class="flex-1 w-full overflow-auto bg-slate-900/60 p-3 sm:p-4 text-slate-200" id="${uid}_body">
              <div class="excel-table-container rounded-xl overflow-x-auto shadow-inner bg-slate-950/90 border border-slate-800">
                ${this.renderSheetTable(workbook, sheetNames[0])}
              </div>
            </div>
          </div>
        `;

        // Handle Tab Switching
        if (sheetNames.length > 1) {
          const tabWrap = document.getElementById(`${uid}_tabs`);
          const bodyWrap = document.getElementById(`${uid}_body`);
          if (tabWrap && bodyWrap) {
            tabWrap.querySelectorAll('.sheet-tab-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                tabWrap.querySelectorAll('.sheet-tab-btn').forEach(b => {
                  b.className = 'sheet-tab-btn px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer bg-slate-900 text-slate-400 hover:text-slate-200';
                });
                btn.className = 'sheet-tab-btn px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer bg-emerald-600 text-white shadow';
                
                const sIdx = Number(btn.getAttribute('data-sheet-idx'));
                const targetSheet = sheetNames[sIdx];
                bodyWrap.innerHTML = `
                  <div class="excel-table-container rounded-xl overflow-x-auto shadow-inner bg-slate-950/90 border border-slate-800">
                    ${this.renderSheetTable(workbook, targetSheet)}
                  </div>
                `;
                this.applyTableStyles(bodyWrap);
              });
            });
          }
        }

        this.applyTableStyles(container);
        if (typeof lucide !== 'undefined') lucide.createIcons();

      } catch (err) {
        console.error('[DocPreview] Excel render error:', err);
        this.renderFallback(container, fileUrl, fileName, 'Excel Spreadsheet', err.message);
      }
    }

    renderSheetTable(workbook, sheetName) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return `<div class="p-8 text-center text-slate-400 text-xs">ไม่พบข้อมูลในแผ่นงานนี้</div>`;
      }

      // Convert sheet to styled HTML table
      let html = XLSX.utils.sheet_to_html(worksheet, { id: 'excel_raw_tbl', editable: false });
      
      // Inject dark sleek styling classes into table
      html = html.replace('<table', '<table class="min-w-full border-collapse text-left text-xs font-sans"');
      return html;
    }

    applyTableStyles(container) {
      const table = container.querySelector('table');
      if (!table) return;

      table.classList.add('w-full', 'border-collapse', 'text-xs', 'text-slate-300');
      
      const ths = table.querySelectorAll('th, tr:first-child td');
      ths.forEach(th => {
        th.classList.add('bg-slate-900', 'text-emerald-400', 'font-black', 'p-2.5', 'border', 'border-slate-800', 'whitespace-nowrap', 'text-[11px]');
      });

      const tds = table.querySelectorAll('tr:not(:first-child) td');
      tds.forEach(td => {
        td.classList.add('p-2.5', 'border', 'border-slate-800/80', 'whitespace-nowrap', 'hover:bg-slate-800/50', 'transition-colors');
      });
    }

    /**
     * เรนเดอร์ตัวอย่าง Word (.docx)
     */
    async renderWord(container, fileUrl, fileName = 'Document.docx', options = {}) {
      if (!container) return;

      this.renderLoading(container, fileName, 'Word Document');

      try {
        const buffer = await this.fetchArrayBuffer(fileUrl, fileName);

        if (typeof mammoth === 'undefined') {
          throw new Error('Mammoth.js library is not loaded');
        }

        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const htmlContent = result.value || '<p class="text-slate-400 text-sm italic">เอกสารนี้ไม่มีข้อความ</p>';
        const heightClass = options.heightClass || 'min-h-[70vh] h-[75vh]';

        container.innerHTML = `
          <div class="w-full ${heightClass} flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <!-- Header Bar -->
            <div class="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 select-none">
              <div class="flex items-center gap-2 font-bold min-w-0">
                <span class="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                </span>
                <span class="truncate max-w-[200px] sm:max-w-md font-mono text-white text-xs">${this.escapeHtml(fileName)}</span>
                <span class="hidden sm:inline-block px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">Client-Side Mammoth</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a href="${fileUrl}" target="_blank" download="${this.escapeHtml(fileName)}" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 text-xs transition border border-slate-700">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>ดาวน์โหลด</span>
                </a>
              </div>
            </div>

            <!-- Paper Document Body -->
            <div class="flex-1 w-full overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex justify-center">
              <div class="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-12 min-h-full font-serif leading-relaxed prose prose-slate max-w-none docx-rendered-content">
                ${htmlContent}
              </div>
            </div>
          </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

      } catch (err) {
        console.error('[DocPreview] Word render error:', err);
        this.renderFallback(container, fileUrl, fileName, 'Word Document', err.message);
      }
    }

    /**
     * เรนเดอร์ PDF (.pdf) ผ่าน browser native embed/iframe
     */
    renderPdf(container, fileUrl, fileName = 'Document.pdf', options = {}) {
      if (!container) return;
      const heightClass = options.heightClass || 'min-h-[75vh] h-[80vh]';

      container.innerHTML = `
        <div class="w-full ${heightClass} flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <div class="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 select-none">
            <span class="flex items-center gap-2 font-bold truncate max-w-md">
              <span class="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              </span>
              <span class="text-white truncate font-mono text-xs">${this.escapeHtml(fileName)}</span>
            </span>
            <a href="${fileUrl}" target="_blank" download="${this.escapeHtml(fileName)}" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold flex items-center gap-1.5 text-xs transition border border-slate-700">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>ดาวน์โหลด</span>
            </a>
          </div>
          <iframe src="${fileUrl}#toolbar=1" class="w-full flex-1 border-none bg-white" title="${this.escapeHtml(fileName)}"></iframe>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * หน้าจอ Loading ระหว่างโหลดและแปลงเอกสาร
     */
    renderLoading(container, fileName, fileTypeLabel) {
      container.innerHTML = `
        <div class="p-10 sm:p-14 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 max-w-md w-full shadow-2xl backdrop-blur-xl">
          <div class="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
            <i data-lucide="file-spreadsheet" class="w-7 h-7 text-orange-400 animate-pulse"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-white text-base truncate">${this.escapeHtml(fileName)}</h4>
            <p class="text-xs text-slate-400">กำลังประมวลผลเปิดตัวอย่าง ${fileTypeLabel} ในเครื่อง...</p>
          </div>
          <div class="text-[11px] text-slate-500 font-mono">100% In-Browser Rendering • ปลอดภัยไม่ผ่านเซิร์ฟเวอร์ภายนอก</div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * หน้า Fallback เมื่อไฟล์ติดปัญหา CORS หรือฟอร์แมตรองรับไม่ได้
     */
    renderFallback(container, fileUrl, fileName, fileTypeLabel, errorMsg = '') {
      container.innerHTML = `
        <div class="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 max-w-md w-full shadow-2xl">
          <div class="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <i data-lucide="file-question" class="w-10 h-10"></i>
          </div>
          <div class="space-y-1.5">
            <h4 class="font-bold text-white text-base truncate">${this.escapeHtml(fileName)}</h4>
            <p class="text-xs text-slate-400">แสดงพรีวิวแบบเรียลไทม์ไม่ได้เนื่องจากนโยบายความปลอดภัยของไฟล์ (CORS/Permissions)</p>
            ${errorMsg ? `<p class="text-[11px] text-rose-400/90 font-mono bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 break-all">${this.escapeHtml(errorMsg)}</p>` : ''}
          </div>
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="${fileUrl}" target="_blank" download="${this.escapeHtml(fileName)}" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>ดาวน์โหลดไฟล์แทน</span>
            </a>
            <a href="${fileUrl}" target="_blank" class="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto border border-slate-700">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              <span>เปิดลิงก์ไฟล์</span>
            </a>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m]));
    }
  }

  window.DocPreviewEngine = new DocPreviewEngine();
})(window);
