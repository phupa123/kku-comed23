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
     * ตรวจสอบว่าไฟล์เป็นไฟล์ Code หรือ Text ที่สามารถเปิดพรีวิวแบบ IDE ได้หรือไม่
     */
    isCodeOrText(fileName = '', fileType = '') {
      const ext = ((fileName || '').split('.').pop() || '').toLowerCase();
      const codeExts = [
        'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
        'py', 'pyw',
        'html', 'htm', 'xhtml',
        'css', 'scss', 'sass', 'less',
        'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx',
        'json', 'xml', 'svg',
        'sql',
        'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1',
        'php', 'java', 'cs', 'go', 'rs', 'rb', 'lua', 'r', 'dart', 'swift', 'kt', 'kts',
        'md', 'markdown',
        'txt', 'text', 'log', 'env', 'yaml', 'yml', 'ini', 'toml', 'conf', 'config',
        'dockerfile', 'makefile'
      ];
      if (codeExts.includes(ext)) return true;
      const ft = (fileType || '').toLowerCase();
      if (ft.startsWith('text/') || ft.includes('javascript') || ft.includes('json') || ft.includes('xml') || ft.includes('python')) return true;
      return false;
    }

    /**
     * ดึงข้อมูลประเภทภาษา ไอคอน สี และแท็กระบุตัวตน
     */
    getLanguageMeta(fileName = '') {
      const ext = ((fileName || '').split('.').pop() || '').toLowerCase();
      const map = {
        c: { name: 'C', hljs: 'c', icon: 'file-code-2', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        cpp: { name: 'C++', hljs: 'cpp', icon: 'file-code-2', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        cc: { name: 'C++', hljs: 'cpp', icon: 'file-code-2', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        h: { name: 'C/C++ Header', hljs: 'c', icon: 'file-code-2', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        hpp: { name: 'C++ Header', hljs: 'cpp', icon: 'file-code-2', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        py: { name: 'Python', hljs: 'python', icon: 'file-code', color: '#38bdf8', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
        pyw: { name: 'Python GUI', hljs: 'python', icon: 'file-code', color: '#38bdf8', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
        html: { name: 'HTML5', hljs: 'html', icon: 'file-code-2', color: '#fb923c', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30', isWebRunnable: true },
        htm: { name: 'HTML', hljs: 'html', icon: 'file-code-2', color: '#fb923c', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30', isWebRunnable: true },
        css: { name: 'CSS3', hljs: 'css', icon: 'file-code-2', color: '#38bdf8', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
        scss: { name: 'SCSS', hljs: 'scss', icon: 'file-code-2', color: '#f472b6', badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
        sass: { name: 'SASS', hljs: 'scss', icon: 'file-code-2', color: '#f472b6', badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
        js: { name: 'JavaScript', hljs: 'javascript', icon: 'file-code', color: '#facc15', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        mjs: { name: 'ES Module JS', hljs: 'javascript', icon: 'file-code', color: '#facc15', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        cjs: { name: 'CommonJS', hljs: 'javascript', icon: 'file-code', color: '#facc15', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        ts: { name: 'TypeScript', hljs: 'typescript', icon: 'file-code', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        tsx: { name: 'React TSX', hljs: 'typescript', icon: 'file-code', color: '#60a5fa', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        jsx: { name: 'React JSX', hljs: 'javascript', icon: 'file-code', color: '#facc15', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        json: { name: 'JSON', hljs: 'json', icon: 'file-json', color: '#34d399', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
        xml: { name: 'XML', hljs: 'xml', icon: 'file-code', color: '#a78bfa', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
        svg: { name: 'SVG Vector', hljs: 'xml', icon: 'image', color: '#f43f5e', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30', isWebRunnable: true },
        sql: { name: 'SQL Query', hljs: 'sql', icon: 'database', color: '#c084fc', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
        sh: { name: 'Shell Script', hljs: 'bash', icon: 'terminal', color: '#4ade80', badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30' },
        bash: { name: 'Bash Script', hljs: 'bash', icon: 'terminal', color: '#4ade80', badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30' },
        zsh: { name: 'Zsh Script', hljs: 'bash', icon: 'terminal', color: '#4ade80', badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30' },
        php: { name: 'PHP', hljs: 'php', icon: 'file-code', color: '#818cf8', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
        java: { name: 'Java', hljs: 'java', icon: 'coffee', color: '#fb923c', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
        cs: { name: 'C#', hljs: 'csharp', icon: 'file-code', color: '#a855f7', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
        go: { name: 'Go Lang', hljs: 'go', icon: 'file-code', color: '#38bdf8', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
        rs: { name: 'Rust', hljs: 'rust', icon: 'file-code', color: '#fb923c', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        md: { name: 'Markdown', hljs: 'markdown', icon: 'file-text', color: '#38bdf8', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
        txt: { name: 'Plain Text', hljs: 'plaintext', icon: 'file-text', color: '#94a3b8', badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        log: { name: 'System Log', hljs: 'plaintext', icon: 'file-text', color: '#94a3b8', badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
        env: { name: 'Environment', hljs: 'bash', icon: 'settings', color: '#fbbf24', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
        yaml: { name: 'YAML', hljs: 'yaml', icon: 'file-code', color: '#fb7185', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
        yml: { name: 'YAML', hljs: 'yaml', icon: 'file-code', color: '#fb7185', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
      };

      return map[ext] || {
        name: (ext || 'CODE').toUpperCase(),
        hljs: 'plaintext',
        icon: 'file-code',
        color: '#94a3b8',
        badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
        isWebRunnable: false
      };
    }

    /**
     * โหลด Highlight.js อัตโนมัติหากหน้าเว็บยังไม่ได้ใส่ใน <head>
     */
    async ensureHighlightJs() {
      if (window.hljs && typeof window.hljs.highlight === 'function') {
        return window.hljs;
      }
      return new Promise((resolve) => {
        // Inject CSS theme if not present
        if (!document.getElementById('hljs-theme-css')) {
          const link = document.createElement('link');
          link.id = 'hljs-theme-css';
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
          document.head.appendChild(link);
        }

        // Inject JS library
        if (window.hljs) {
          resolve(window.hljs);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
        script.async = true;
        script.onload = () => resolve(window.hljs);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
    }

    /**
     * เรนเดอร์ตัวอย่างโค้ดและไฟล์ข้อความ (.c, .py, .html, .css, .js, .txt ฯลฯ)
     * รองรับ IDE dark theme, เลขบรรทัด, คัดลอกโค้ด, ปรับขนาดฟอนต์, ตัดคำ, และรันผลลัพธ์หน้าเว็บแบบ Live Preview
     */
    async renderCode(container, fileUrl, fileName = 'code.txt', options = {}) {
      if (!container) return;
      const meta = this.getLanguageMeta(fileName);
      this.renderLoading(container, fileName, `${meta.name} Source Code`);

      try {
        const buffer = await this.fetchArrayBuffer(fileUrl, fileName);
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawCode = textDecoder.decode(buffer);

        // Preload highlight.js
        await this.ensureHighlightJs();

        const uid = 'code_' + Math.random().toString(36).substr(2, 9);
        const heightClass = options.heightClass || 'min-h-[75vh] h-[80vh]';
        const lines = rawCode.split('\n');
        const lineCount = lines.length;
        const charCount = rawCode.length;
        const sizeFormatted = (buffer.byteLength < 1024) 
          ? `${buffer.byteLength} B` 
          : `${(buffer.byteLength / 1024).toFixed(1)} KB`;

        // Highlight code lines
        let highlightedCode = '';
        if (window.hljs) {
          try {
            if (meta.hljs && meta.hljs !== 'plaintext' && window.hljs.getLanguage(meta.hljs)) {
              highlightedCode = window.hljs.highlight(rawCode, { language: meta.hljs, ignoreIllegals: true }).value;
            } else {
              highlightedCode = window.hljs.highlightAuto(rawCode).value;
            }
          } catch (_) {
            highlightedCode = this.escapeHtml(rawCode);
          }
        } else {
          highlightedCode = this.escapeHtml(rawCode);
        }

        const highlightedLines = highlightedCode.split('\n');

        container.innerHTML = `
          <div class="w-full ${heightClass} flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl" id="${uid}_window">
            <!-- IDE Window Top Bar -->
            <div class="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 select-none">
              <!-- Left: Window Dots & File Info -->
              <div class="flex items-center gap-2.5 min-w-0">
                <!-- macOS Style Traffic Dots -->
                <div class="flex items-center gap-1.5 shrink-0 pl-1 pr-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block shadow-sm"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shadow-sm"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-sm"></span>
                </div>

                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0" style="color: ${meta.color}">
                    <i data-lucide="${meta.icon}" class="w-3.5 h-3.5"></i>
                  </span>
                  <span class="truncate max-w-[140px] sm:max-w-xs md:max-w-md font-mono font-bold text-white text-xs">${this.escapeHtml(fileName)}</span>
                  <span class="px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${meta.badgeColor} shrink-0">
                    ${meta.name}
                  </span>
                </div>
              </div>

              <!-- Center: Mode Switch (For HTML / SVG) -->
              ${meta.isWebRunnable ? `
                <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                  <button type="button" id="${uid}_tab_code" class="px-2.5 py-1 rounded-lg bg-orange-500 text-white shadow-sm flex items-center gap-1 transition cursor-pointer">
                    <i data-lucide="code" class="w-3 h-3"></i>
                    <span>โค้ด</span>
                  </button>
                  <button type="button" id="${uid}_tab_live" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer">
                    <i data-lucide="globe" class="w-3 h-3"></i>
                    <span>ดูผลลัพธ์เว็บ</span>
                  </button>
                </div>
              ` : ''}

              <!-- Right: Editor Controls & Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- Metrics -->
                <div class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>${lineCount.toLocaleString()} บรรทัด</span>
                  <span class="text-slate-600">•</span>
                  <span>${sizeFormatted}</span>
                </div>

                <!-- Word Wrap Toggle -->
                <button type="button" id="${uid}_btn_wrap" title="สลับการตัดบรรทัด (Word Wrap)" class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition border border-slate-700 cursor-pointer flex items-center gap-1">
                  <i data-lucide="wrap-text" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline text-[11px]">ตัดคำ</span>
                </button>

                <!-- Font Zoom -->
                <div class="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
                  <button type="button" id="${uid}_font_down" title="ย่อขนาดฟอนต์" class="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white font-mono font-bold transition">A-</button>
                  <button type="button" id="${uid}_font_up" title="ขยายขนาดฟอนต์" class="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white font-mono font-bold transition">A+</button>
                </div>

                <!-- Copy Code Button -->
                <button type="button" id="${uid}_btn_copy" class="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95">
                  <i data-lucide="copy" class="w-3.5 h-3.5" id="${uid}_copy_icon"></i>
                  <span id="${uid}_copy_text">คัดลอก</span>
                </button>

                <!-- Download Button -->
                <a href="${fileUrl}" target="_blank" download="${this.escapeHtml(fileName)}" class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition border border-slate-700" title="ดาวน์โหลดไฟล์">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                </a>
              </div>
            </div>

            <!-- Code Editor Body Area -->
            <div class="flex-1 w-full overflow-auto bg-slate-950 font-mono text-xs select-text relative" id="${uid}_view_code">
              <table class="w-full border-collapse text-left text-slate-200" id="${uid}_table">
                <tbody>
                  ${highlightedLines.map((lineHtml, idx) => `
                    <tr class="hover:bg-slate-800/40 transition-colors group">
                      <td class="select-none text-right pr-3 pl-3 text-slate-600 group-hover:text-slate-400 font-mono text-[11px] border-r border-slate-800/80 bg-slate-950/90 sticky left-0 z-10 w-12 align-top py-0.5">${idx + 1}</td>
                      <td class="pl-4 pr-6 font-mono whitespace-pre text-slate-200 code-cell py-0.5" style="tab-size: 2;">${lineHtml || '&nbsp;'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Live Sandbox Preview (For HTML / SVG) -->
            ${meta.isWebRunnable ? `
              <div class="flex-1 w-full hidden bg-white" id="${uid}_view_live">
                <iframe class="w-full h-full border-none" sandbox="allow-scripts allow-modals" id="${uid}_iframe" title="Web Preview"></iframe>
              </div>
            ` : ''}

            <!-- IDE Status Bar Footer -->
            <div class="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1 text-emerald-400 font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  <span>UTF-8 Ready</span>
                </span>
                <span class="hidden sm:inline text-slate-500">•</span>
                <span class="hidden sm:inline">${charCount.toLocaleString()} ตัวอักษร</span>
              </div>
              <div class="flex items-center gap-2">
                <span>Tab: 2 spaces</span>
                <span class="text-slate-500">•</span>
                <span class="font-bold text-slate-300">${meta.name}</span>
              </div>
            </div>
          </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // 1. Copy Code Listener
        const btnCopy = document.getElementById(`${uid}_btn_copy`);
        const copyText = document.getElementById(`${uid}_copy_text`);
        const copyIcon = document.getElementById(`${uid}_copy_icon`);
        if (btnCopy) {
          btnCopy.addEventListener('click', async () => {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(rawCode);
              } else {
                const ta = document.createElement('textarea');
                ta.value = rawCode;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              }
              btnCopy.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm';
              copyText.textContent = 'คัดลอกแล้ว!';
              setTimeout(() => {
                btnCopy.className = 'px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95';
                copyText.textContent = 'คัดลอก';
              }, 2000);
            } catch (err) {
              console.warn('[DocPreview] Copy failed:', err);
            }
          });
        }

        // 2. Word Wrap Toggle
        let isWrapped = false;
        const btnWrap = document.getElementById(`${uid}_btn_wrap`);
        const codeCells = container.querySelectorAll(`#${uid}_table .code-cell`);
        if (btnWrap) {
          btnWrap.addEventListener('click', () => {
            isWrapped = !isWrapped;
            btnWrap.className = isWrapped 
              ? 'p-1.5 rounded-xl bg-orange-600 text-white text-xs transition border border-orange-500 cursor-pointer flex items-center gap-1' 
              : 'p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition border border-slate-700 cursor-pointer flex items-center gap-1';
            codeCells.forEach(cell => {
              if (isWrapped) {
                cell.classList.remove('whitespace-pre');
                cell.classList.add('whitespace-pre-wrap', 'break-all');
              } else {
                cell.classList.remove('whitespace-pre-wrap', 'break-all');
                cell.classList.add('whitespace-pre');
              }
            });
          });
        }

        // 3. Font Zoom Controls
        let fontSizePx = 12;
        const fontDown = document.getElementById(`${uid}_font_down`);
        const fontUp = document.getElementById(`${uid}_font_up`);
        const table = document.getElementById(`${uid}_table`);
        if (fontDown && fontUp && table) {
          fontDown.addEventListener('click', () => {
            fontSizePx = Math.max(9, fontSizePx - 1);
            table.style.fontSize = fontSizePx + 'px';
          });
          fontUp.addEventListener('click', () => {
            fontSizePx = Math.min(20, fontSizePx + 1);
            table.style.fontSize = fontSizePx + 'px';
          });
        }

        // 4. Live Render Tabs (For HTML / SVG)
        if (meta.isWebRunnable) {
          const tabCode = document.getElementById(`${uid}_tab_code`);
          const tabLive = document.getElementById(`${uid}_tab_live`);
          const viewCode = document.getElementById(`${uid}_view_code`);
          const viewLive = document.getElementById(`${uid}_view_live`);
          const iframe = document.getElementById(`${uid}_iframe`);

          if (tabCode && tabLive && viewCode && viewLive) {
            tabCode.addEventListener('click', () => {
              tabCode.className = 'px-2.5 py-1 rounded-lg bg-orange-500 text-white shadow-sm flex items-center gap-1 transition cursor-pointer';
              tabLive.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer';
              viewCode.classList.remove('hidden');
              viewLive.classList.add('hidden');
            });

            tabLive.addEventListener('click', () => {
              tabLive.className = 'px-2.5 py-1 rounded-lg bg-sky-500 text-white shadow-sm flex items-center gap-1 transition cursor-pointer';
              tabCode.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer';
              viewCode.classList.add('hidden');
              viewLive.classList.remove('hidden');
              if (iframe && !iframe.srcdoc) {
                iframe.srcdoc = rawCode;
              }
            });
          }
        }

      } catch (err) {
        console.error('[DocPreview] Code render error:', err);
        this.renderFallback(container, fileUrl, fileName, `${meta.name} Code`, err.message);
      }
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
