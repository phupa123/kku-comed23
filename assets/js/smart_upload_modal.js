// Smart Upload Confirmation, PDF Auto-Compression & Oversize Handler
// Features: Client-Side PDF Optimizer, Real-Time Progress Bar, Pre/Post Size Comparison, Multi-Pass Compression for >200MB

function showUploadConfirmModal({
  title,
  message,
  fileName,
  fileSize,
  fileType,
  confirmText = 'อัปโหลดทันที',
  cancelText = 'ยกเลิก',
  showExternalHelp = false,
  showCompressAction = false,
  onCompressAndUpload = null,
  onConfirm,
  onCancel
}) {
  const existing = document.getElementById('smartUploadModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'smartUploadModal';
  modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in';
  
  const isPdf = fileType === 'pdf';
  const isOversized = fileSize > (200 * 1024 * 1024);
  const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);

  modal.innerHTML = `
    <div class="relative w-full max-w-md p-6 rounded-3xl bg-[#0B0F19]/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-left transform transition-all scale-100">
      
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl ${isOversized ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : isPdf ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-orange-500/20 text-[#E65A19] border border-orange-500/30'} flex items-center justify-center flex-shrink-0 shadow-inner">
          <i data-lucide="${isOversized ? 'alert-octagon' : isPdf ? 'file-text' : 'help-circle'}" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-base font-black text-white tracking-wide">${title}</h3>
          <p class="text-xs text-slate-400">ระบบตรวจสอบไฟล์ก่อนส่งขึ้น Cloud</p>
        </div>
      </div>

      <!-- File Details Card -->
      <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 mb-4">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ชื่อไฟล์:</span>
          <span class="font-mono font-bold text-white max-w-[200px] truncate" title="${fileName}">${fileName}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ขนาดไฟล์ปัจจุบัน:</span>
          <span id="smartModalSizeText" class="font-mono font-bold ${isOversized ? 'text-rose-400 animate-pulse' : 'text-slate-200'}">${sizeMb} MB ${isOversized ? '(เกินโควตา 200 MB)' : ''}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ประเภทไฟล์:</span>
          <span class="uppercase font-bold text-xs px-2 py-0.5 rounded-md ${isPdf ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'}">${fileType}</span>
        </div>
      </div>

      <p id="smartModalMessage" class="text-xs text-slate-300 leading-relaxed mb-4">${message}</p>

      <!-- Dynamic Compression Progress UI -->
      <div id="smartModalProgressBox" class="hidden space-y-2 p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 mb-4">
        <div class="flex items-center justify-between text-xs font-bold text-white">
          <span id="smartModalProgressStatus" class="flex items-center gap-1.5 text-amber-300">
            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
            <span>กำลังบีบอัดไฟล์...</span>
          </span>
          <span id="smartModalProgressPct" class="font-mono text-amber-400">0%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div id="smartModalProgressBar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200" style="width: 0%;"></div>
        </div>
        <p id="smartModalProgressSubtext" class="text-[11px] text-slate-400 font-mono">บีบอัดรูปภาพและปรับโครงสร้างเอกสาร...</p>
      </div>

      <!-- Compression Result Comparison Card (Hidden until complete) -->
      <div id="smartModalComparisonCard" class="hidden p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2 mb-4">
        <div class="font-bold text-emerald-400 flex items-center gap-1.5">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>บีบอัดไฟล์สำเร็จเรียบร้อย!</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-white/5 font-mono">
          <div>
            <div class="text-slate-400 text-[10px]">ขนาดเดิม:</div>
            <div id="smartModalOriginalSize" class="text-slate-300 font-bold">-</div>
          </div>
          <div>
            <div class="text-emerald-400 text-[10px]">ขนาดใหม่:</div>
            <div id="smartModalNewSize" class="text-emerald-300 font-bold">-</div>
          </div>
        </div>
        <p class="text-[11px] text-emerald-300/80">ระบบลดขนาดได้ <strong id="smartModalRatioText" class="text-white font-bold">-</strong> โดยคงความชัดของข้อความไว้</p>
      </div>

      <!-- External Help / Guide -->
      ${showExternalHelp ? `
      <div id="smartModalExternalHelp" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 mb-4 space-y-1.5">
        <div class="font-bold flex items-center gap-1.5">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>คำแนะนำการจัดการไฟล์ขนาดใหญ่:</span>
        </div>
        <p>• สามารถบีบอัดลดขนาด PDF ได้ฟรี 60-80% ที่ <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="underline text-amber-200 font-bold hover:text-white">iLovePDF Compress</a></p>
        <p>• หรืออัปโหลดเข้า Google Drive แล้วนำลิงก์แชร์มาใส่ในรายละเอียดงานได้ไม่จำกัดขนาด</p>
      </div>
      ` : ''}

      <!-- Actions -->
      <div id="smartModalActionRow" class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
        <button id="smartModalCancelBtn" type="button" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition">
          ${cancelText}
        </button>

        ${(isPdf || showCompressAction) ? `
        <button id="smartModalCompressBtn" type="button" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-1.5">
          <i data-lucide="file-archive" class="w-3.5 h-3.5"></i>
          <span>บีบอัด PDF ตอนนี้</span>
        </button>
        ` : ''}

        ${!isOversized ? `
        <button id="smartModalConfirmBtn" type="button" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E65A19] to-[#B32B19] hover:from-[#f06828] hover:to-[#c4321e] text-white text-xs font-bold transition shadow-lg shadow-orange-950/40">
          ${confirmText}
        </button>
        ` : `
        <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5">
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          <span>เครื่องมือบีบอัดภายนอก</span>
        </a>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const cancelBtn = modal.querySelector('#smartModalCancelBtn');
  const confirmBtn = modal.querySelector('#smartModalConfirmBtn');
  const compressBtn = modal.querySelector('#smartModalCompressBtn');

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.remove();
      if (onCancel) onCancel();
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      modal.remove();
      if (onConfirm) onConfirm();
    };
  }

  // Handle Client-Side PDF Compression Flow
  if (compressBtn) {
    compressBtn.onclick = async () => {
      const progressBox = modal.querySelector('#smartModalProgressBox');
      const progressBar = modal.querySelector('#smartModalProgressBar');
      const progressPct = modal.querySelector('#smartModalProgressPct');
      const progressStatus = modal.querySelector('#smartModalProgressStatus');
      const progressSubtext = modal.querySelector('#smartModalProgressSubtext');
      const actionRow = modal.querySelector('#smartModalActionRow');
      const comparisonCard = modal.querySelector('#smartModalComparisonCard');

      if (progressBox) progressBox.classList.remove('hidden');
      if (compressBtn) compressBtn.classList.add('hidden');
      if (confirmBtn) confirmBtn.classList.add('hidden');

      if (typeof onCompressAndUpload === 'function') {
        const updateProgress = (pct, text, subtext = '') => {
          if (progressBar) progressBar.style.width = pct + '%';
          if (progressPct) progressPct.textContent = Math.round(pct) + '%';
          if (progressStatus) progressStatus.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> <span>${escapeHtml(text)}</span>`;
          if (progressSubtext && subtext) progressSubtext.textContent = subtext;
          if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        try {
          const res = await onCompressAndUpload(updateProgress);
          if (res && res.compressedFile) {
            // Update comparison card
            if (progressBox) progressBox.classList.add('hidden');
            if (comparisonCard) {
              comparisonCard.classList.remove('hidden');
              modal.querySelector('#smartModalOriginalSize').textContent = (res.originalSize / (1024 * 1024)).toFixed(2) + ' MB';
              modal.querySelector('#smartModalNewSize').textContent = (res.newSize / (1024 * 1024)).toFixed(2) + ' MB';
              modal.querySelector('#smartModalRatioText').textContent = res.ratio + '% (' + res.passes + ' รอบ)';
            }

            // Replace action buttons with Upload Compressed button
            actionRow.innerHTML = `
              <button id="smartModalCancelBtn2" type="button" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition">
                ยกเลิก
              </button>
              <button id="smartModalUploadCompressedBtn" type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5">
                <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
                <span>อัปโหลดไฟล์ที่บีบอัดแล้ว (${(res.newSize / (1024 * 1024)).toFixed(1)} MB)</span>
              </button>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            actionRow.querySelector('#smartModalCancelBtn2').onclick = () => {
              modal.remove();
              if (onCancel) onCancel();
            };

            actionRow.querySelector('#smartModalUploadCompressedBtn').onclick = () => {
              modal.remove();
              if (onConfirm) onConfirm(res.compressedFile);
            };
          }
        } catch (err) {
          console.error("Compression failed in modal:", err);
          if (progressBox) progressBox.classList.add('hidden');
          if (confirmBtn) confirmBtn.classList.remove('hidden');
          alert("ไม่สามารถบีบอัดไฟล์ PDF ได้: " + err.message);
        }
      }
    };
  }
}
