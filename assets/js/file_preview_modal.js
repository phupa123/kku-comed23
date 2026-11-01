/**
 * COMED File Preview Modal Engine
 * assets/js/file_preview_modal.js
 * 
 * Provides in-browser preview for Images, PDFs, Videos, Audios, and text docs
 * with seamless one-click download.
 */

(function (window) {
  'use strict';

  function getFileExtension(filename = '', url = '') {
    const clean = (filename || url).split('?')[0].split('#')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function openFilePreview(fileUrl, fileName = 'เอกสารแนบ', fileSize = '') {
    if (!fileUrl) return;

    const ext = getFileExtension(fileName, fileUrl);
    let modal = document.getElementById('comedFilePreviewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'comedFilePreviewModal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300';
      document.body.appendChild(modal);
    }

    let previewContent = '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || fileUrl.includes('i.ibb.co') || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i);
    const isPdf = ext === 'pdf';
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);

    if (isImage) {
      previewContent = `
        <div class="relative w-full max-h-[75vh] flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden p-2">
          <img src="${fileUrl}" alt="${fileName}" class="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl transition transform hover:scale-[1.02] duration-300">
        </div>
      `;
    } else if (isPdf) {
      previewContent = `
        <div class="relative w-full h-[70vh] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
          <iframe src="${fileUrl}#toolbar=0" class="w-full h-full border-0" title="${fileName}"></iframe>
        </div>
      `;
    } else if (isVideo) {
      previewContent = `
        <div class="relative w-full max-h-[70vh] aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black" id="filePreviewVideoContainer"></div>
      `;
    } else {
      // Generic Doc or other format
      previewContent = `
        <div class="text-center py-12 px-6 space-y-4 bg-slate-900/60 rounded-2xl border border-white/10">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-3xl">
            <i class="bi bi-file-earmark-text"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-base font-bold text-white">${fileName}</h4>
            <p class="text-xs text-slate-400 font-mono">ไฟล์ประเภท .${ext.toUpperCase() || 'FILE'} ${fileSize ? `(${fileSize})` : ''}</p>
          </div>
          <p class="text-xs text-slate-300 max-w-sm mx-auto">
            รูปแบบไฟล์นี้สามารถดาวน์โหลดเพื่อเปิดดูบนอุปกรณ์ของท่านได้โดยตรง
          </p>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="relative w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transform scale-95 transition-transform duration-300" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-white/10 bg-slate-950/70 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B32B19] to-[#E65A19] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <i class="bi bi-eye-fill text-sm"></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-white truncate drop-shadow">${fileName}</h3>
              <p class="text-[10px] font-mono text-slate-400">${fileSize || 'ตัวอย่างไฟล์'}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <a href="${fileUrl}" target="_blank" download="${fileName}" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer">
              <i class="bi bi-download"></i>
              <span>ดาวน์โหลด</span>
            </a>
            <button type="button" onclick="window.closeFilePreview()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
              <i class="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-6 overflow-y-auto max-h-[78vh] flex items-center justify-center">
          ${previewContent}
        </div>

      </div>
    `;

    modal.onclick = () => window.closeFilePreview();
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    const inner = modal.querySelector('div');
    if (inner) {
      inner.classList.remove('scale-95');
      inner.classList.add('scale-100');
    }

    if (isVideo && typeof window.CyberVideoPlayer === 'function') {
      const vContainer = document.getElementById('filePreviewVideoContainer');
      if (vContainer) {
        new window.CyberVideoPlayer(vContainer, {
          src: fileUrl,
          title: fileName,
          autoplay: true
        });
      }
    }
  }

  function closeFilePreview() {
    const modal = document.getElementById('comedFilePreviewModal');
    if (!modal) return;
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('opacity-0', 'pointer-events-none');
    const inner = modal.querySelector('div');
    if (inner) {
      inner.classList.remove('scale-100');
      inner.classList.add('scale-95');
    }
  }

  window.openFilePreview = openFilePreview;
  window.closeFilePreview = closeFilePreview;

})(window);
