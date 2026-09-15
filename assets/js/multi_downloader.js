/**
 * =========================================================================
 * MULTI-DOWNLOADER & ZIP ARCHIVER ENGINE - assets/js/multi_downloader.js
 * รองรับการดาวน์โหลดไฟล์เดี่ยว, ดาวน์โหลดทีละไฟล์ (Sequential),
 * และดาวน์โหลดรวมเป็นไฟล์ ZIP (โฟลเดอร์) ฝั่ง Client ด้วย JSZip
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  class MultiDownloader {
    constructor() {
      this.isDownloading = false;
    }

    /**
     * ดาวน์โหลดไฟล์เดี่ยวลงเครื่องโดยตรง
     */
    async downloadSingleFile(fileUrl, fileName = 'download') {
      try {
        const response = await fetch(fileUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const blob = await response.blob();
        this.saveBlob(blob, fileName);
        return true;
      } catch (err) {
        // Fallback using direct anchor click
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      }
    }

    /**
     * ดาวน์โหลดทีละไฟล์แบบวนซ้ำ (Individual Sequential Downloads)
     * @param {Array<{url: string, name: string}>} fileList 
     * @param {Function} onProgress (currentIndex, total, currentFileName)
     */
    async downloadFilesSequentially(fileList = [], onProgress = null) {
      if (!fileList || fileList.length === 0) return;
      this.isDownloading = true;

      for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i];
        if (onProgress) onProgress(i + 1, fileList.length, item.name);
        await this.downloadSingleFile(item.url, item.name);
        // Add small pause between downloads so browser doesn't block spam
        await new Promise(res => setTimeout(res, 600));
      }

      this.isDownloading = false;
    }

    /**
     * ดาวน์โหลดไฟล์ทั้งหมดรวมเป็นโฟลเดอร์ ZIP
     * @param {Array<{url: string, name: string}>} fileList 
     * @param {string} zipName 
     * @param {Function} onProgress (percent, statusText)
     */
    async downloadAsZip(fileList = [], zipName = 'comed_files.zip', onProgress = null) {
      if (!fileList || fileList.length === 0) return;

      if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library is not loaded. Please include jszip.min.js in page header.');
      }

      this.isDownloading = true;
      const zip = new JSZip();
      const total = fileList.length;
      let loadedCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i];
        if (onProgress) {
          const pct = Math.round((i / total) * 80);
          onProgress(pct, `กำลังดึงไฟล์ (${i + 1}/${total}): ${item.name}`);
        }

        try {
          const res = await fetch(item.url, { mode: 'cors' });
          if (!res.ok) throw new Error('Fetch failed');
          const blob = await res.blob();
          // Ensure unique filename inside zip
          const safeName = this.makeSafeFileName(zip, item.name);
          zip.file(safeName, blob);
          loadedCount++;
        } catch (e) {
          console.warn(`[MultiDownloader] Could not fetch ${item.url} for ZIP:`, e);
          // Try adding a text file noting the failure
          zip.file(`${item.name}.txt`, `ไม่สามารถดาวน์โหลดไฟล์นี้เข้า ZIP ได้โดยตรงเนื่องจาก CORS หรือเซิร์ฟเวอร์ปลายทาง: ${item.url}`);
        }
      }

      if (onProgress) onProgress(85, 'กำลังบีบอัดไฟล์ ZIP...');

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        if (onProgress) {
          const p = 85 + Math.round(metadata.percent * 0.15);
          onProgress(p, `กำลังแพ็ก ZIP: ${Math.round(metadata.percent)}%`);
        }
      });

      const finalName = zipName.toLowerCase().endsWith('.zip') ? zipName : (zipName + '.zip');
      this.saveBlob(zipBlob, finalName);
      this.isDownloading = false;

      if (onProgress) onProgress(100, 'ดาวน์โหลดสำเร็จ!');
      return true;
    }

    makeSafeFileName(zip, originalName) {
      let name = originalName || 'file';
      if (!zip.file(name)) return name;

      const dotIdx = name.lastIndexOf('.');
      const base = dotIdx !== -1 ? name.substring(0, dotIdx) : name;
      const ext = dotIdx !== -1 ? name.substring(dotIdx) : '';
      let counter = 1;

      while (zip.file(`${base}_${counter}${ext}`)) {
        counter++;
      }
      return `${base}_${counter}${ext}`;
    }

    saveBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }
  }

  window.MultiDownloader = new MultiDownloader();

})(window);
