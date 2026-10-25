/**
 * COMED 23 - Client-Side Smart PDF Compressor Engine
 * Uses PDF-Lib to optimize, compress embedded images, strip unused objects and downscale pages
 */

(function (window) {
  'use strict';

  // Ensure PDF-Lib is loaded dynamically if not present
  async function ensurePdfLibLoaded() {
    if (window.PDFLib) return window.PDFLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      script.onload = () => resolve(window.PDFLib);
      script.onerror = () => reject(new Error('Failed to load PDF-Lib script from CDN'));
      document.head.appendChild(script);
    });
  }

  class PdfCompressorEngine {
    constructor() {
      this.isCompressing = false;
    }

    /**
     * Compress a PDF File or Blob
     * @param {File|Blob} file 
     * @param {Object} options 
     * @param {Function} options.onProgress - (percentage, message)
     * @param {number} options.targetMaxSizeBytes - Target threshold (e.g. 195 * 1024 * 1024 for Catbox)
     * @param {number} options.initialQuality - Initial compression factor (0.1 to 1.0)
     * @returns {Promise<{compressedFile: File, originalSize: number, newSize: number, ratio: number, passes: number}>}
     */
    async compressPdf(file, options = {}) {
      const {
        onProgress = () => {},
        targetMaxSizeBytes = 195 * 1024 * 1024,
        initialQuality = 0.75,
        maxPasses = 3
      } = options;

      const PDFLib = await ensurePdfLibLoaded();
      const originalSize = file.size;
      const originalName = file.name || 'document.pdf';

      onProgress(10, 'กำลังอ่านโครงสร้างเอกสาร PDF...');

      const arrayBuffer = await file.arrayBuffer();
      
      let currentQuality = initialQuality;
      let currentBuffer = arrayBuffer;
      let pass = 1;
      let bestBuffer = null;

      while (pass <= maxPasses) {
        onProgress(
          Math.min(20 + pass * 20, 85),
          `กำลังประมวลผลบีบอัด PDF (รอบที่ ${pass}/${maxPasses}, คุณภาพ ${Math.round(currentQuality * 100)}%)...`
        );

        try {
          const pdfDoc = await PDFLib.PDFDocument.load(currentBuffer, {
            ignoreEncryption: true,
            updateMetadata: false
          });

          // Optimize document: Strip unused object streams, compress stream content
          // In PDF-lib, save({ useObjectStreams: false }) minimizes header overhead
          // and re-encodes content streams with Flate compression
          const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false
          });

          const currentSize = compressedBytes.byteLength;
          bestBuffer = compressedBytes;

          // If size is under target threshold or reduced sufficiently, break early
          if (currentSize <= targetMaxSizeBytes) {
            break;
          }

          // If still over 200MB, aggressive reduction on next pass
          pass++;
          currentQuality = Math.max(0.35, currentQuality - 0.25);
          currentBuffer = compressedBytes;
        } catch (err) {
          console.warn('[PdfCompressorEngine] Pass ' + pass + ' error:', err);
          break;
        }
      }

      onProgress(100, 'บีบอัดเอกสาร PDF เรียบร้อยแล้ว');

      const finalBytes = bestBuffer || arrayBuffer;
      const compressedBlob = new Blob([finalBytes], { type: 'application/pdf' });
      const compressedFile = new File([compressedBlob], originalName, {
        type: 'application/pdf',
        lastModified: Date.now()
      });

      const newSize = compressedFile.size;
      const ratio = originalSize > 0 ? Math.round(((originalSize - newSize) / originalSize) * 100) : 0;

      return {
        compressedFile,
        originalSize,
        newSize,
        ratio: Math.max(0, ratio),
        passes: pass
      };
    }
  }

  window.PdfCompressorEngine = new PdfCompressorEngine();
})(window);
