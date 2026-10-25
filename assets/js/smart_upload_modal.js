// Smart Upload Confirmation & PDF / Oversize Handler
function showUploadConfirmModal({
  title,
  message,
  fileName,
  fileSize,
  fileType,
  confirmText = 'อัปโหลดทันที',
  cancelText = 'ยกเลิก',
  showExternalHelp = false,
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
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl ${isOversized ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : isPdf ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-orange-500/20 text-[#E65A19] border border-orange-500/30'} flex items-center justify-center flex-shrink-0 shadow-inner">
          <i data-lucide="${isOversized ? 'alert-octagon' : isPdf ? 'file-text' : 'help-circle'}" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-base font-black text-white tracking-wide">${title}</h3>
          <p class="text-xs text-slate-400">ระบบตรวจสอบไฟล์ก่อนส่งขึ้น Cloud</p>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 mb-4">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ชื่อไฟล์:</span>
          <span class="font-mono font-bold text-white max-w-[200px] truncate" title="${fileName}">${fileName}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ขนาดไฟล์:</span>
          <span class="font-mono font-bold ${isOversized ? 'text-rose-400 animate-pulse' : 'text-slate-200'}">${sizeMb} MB ${isOversized ? '(เกินโควตา 200 MB)' : ''}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">ประเภทไฟล์:</span>
          <span class="uppercase font-bold text-xs px-2 py-0.5 rounded-md ${isPdf ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'}">${fileType}</span>
        </div>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed mb-4">${message}</p>

      ${showExternalHelp ? `
      <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 mb-4 space-y-1.5">
        <div class="font-bold flex items-center gap-1.5">
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>คำแนะนำการจัดการไฟล์ขนาดใหญ่:</span>
        </div>
        <p>• บีบอัดลดขนาด PDF ได้ฟรี 60-80% ที่ <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="underline text-amber-200 font-bold hover:text-white">iLovePDF Compress</a></p>
        <p>• หรืออัปโหลดเข้า Google Drive แล้วนำลิงก์แชร์มาใส่ในรายละเอียดงานได้ไม่จำกัดขนาด</p>
      </div>
      ` : ''}

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
        <button id="smartModalCancelBtn" type="button" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition">
          ${cancelText}
        </button>
        ${!isOversized ? `
        <button id="smartModalConfirmBtn" type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E65A19] to-[#B32B19] hover:from-[#f06828] hover:to-[#c4321e] text-white text-xs font-bold transition shadow-lg shadow-orange-950/40">
          ${confirmText}
        </button>
        ` : `
        <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5">
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          <span>ไปบีบอัดไฟล์ฟรี (iLovePDF)</span>
        </a>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const cancelBtn = modal.querySelector('#smartModalCancelBtn');
  const confirmBtn = modal.querySelector('#smartModalConfirmBtn');

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
}
