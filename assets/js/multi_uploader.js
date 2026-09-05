/**
 * Universal Multi-Provider Image & File Uploader + File Management Engine
 * Supports:
 * 1. ImgBB (Free, Instant, 32MB limit, no expiration)
 * 2. Cloudinary (Direct Unsigned / Preset / API Key & Delete Management)
 * 3. FreeImage.host API (Free image host, permanent)
 * 4. Catbox.moe (Free, permanent file & image host, no account required)
 * 
 * Features:
 * - Automatic Failover (ลองเจ้าสำรองอัตโนมัติหากเจ้าแรกมีปัญหา)
 * - File History & Management System (บันทึกประวัติไฟล์ ดึงไฟล์ ดาวน์โหลด และสั่งลบไฟล์)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'COMED_MULTI_STORAGE_CONFIG_V1';
  const FILES_LOG_KEY = 'COMED_UPLOADED_FILES_CATALOG_V1';

  // Default keys and fallbacks
  const DEFAULT_CONFIG = {
    activeProvider: 'auto', // 'auto' | 'imgbb' | 'cloudinary' | 'freeimage' | 'catbox'
    enabledProviders: ['cloudinary', 'catbox', 'imgbb', 'freeimage'],
    providerPriority: ['cloudinary', 'catbox', 'imgbb', 'freeimage'],
    
    // Auto compression settings
    autoCompress: true,
    maxImageDimension: 1600, // max width/height in px
    compressionQuality: 0.82, // 82% quality (saves ~75% size with zero noticeable quality drop)
    maxFileSizeKB: 2048, // 2MB target threshold
    
    // 1. ImgBB API Key
    imgbbApiKey: localStorage.getItem('COMED_IMGBB_KEY') || '6d207e02198a847aa5ad8ac504ff3463',

    // 2. Cloudinary Config
    cloudinaryCloudName: localStorage.getItem('COMED_CLOUDINARY_NAME') || 'demo',
    cloudinaryUploadPreset: localStorage.getItem('COMED_CLOUDINARY_PRESET') || 'docs_upload_example_preset',
    cloudinaryApiKey: localStorage.getItem('COMED_CLOUDINARY_API_KEY') || '',
    cloudinaryApiSecret: localStorage.getItem('COMED_CLOUDINARY_API_SECRET') || '',

    // 3. FreeImage API Key
    freeimageApiKey: localStorage.getItem('COMED_FREEIMAGE_KEY') || '6d207e02198a847aa5ad8ac504ff3463',

    // 4. Catbox Userhash
    catboxUserHash: localStorage.getItem('COMED_CATBOX_HASH') || ''
  };

  class MultiCloudUploader {
    constructor() {
      this.config = this.loadConfig();
      this.fileCatalog = this.loadFileCatalog();
    }

    loadConfig() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
      } catch (e) {
        return { ...DEFAULT_CONFIG };
      }
    }

    saveConfig(newCfg) {
      this.config = { ...this.config, ...newCfg };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }

    loadFileCatalog() {
      try {
        const saved = localStorage.getItem(FILES_LOG_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }

    saveFileCatalog() {
      localStorage.setItem(FILES_LOG_KEY, JSON.stringify(this.fileCatalog.slice(0, 500)));
    }

    addToFileCatalog(record) {
      this.fileCatalog.unshift(record);
      this.saveFileCatalog();
    }

    getAllFiles() {
      return this.fileCatalog;
    }

    deleteFromCatalog(fileId) {
      this.fileCatalog = this.fileCatalog.filter(f => f.id !== fileId);
      this.saveFileCatalog();
    }

    /**
     * Upload an image file with multi-provider failover
     * @param {File|Blob|string} fileInput - File object or Base64 DataURL
     * @param {Object} options - { onProgress: function(percent, statusText), preferredProvider: string, customName: string }
     * @returns {Promise<{url: string, provider: string, publicId: string, success: boolean}>}
     */
    async upload(fileInput, options = {}) {
      const onProgress = options.onProgress || (() => {});
      const preferred = options.preferredProvider || this.config.activeProvider || 'auto';
      const fileName = options.customName || (fileInput.name ? fileInput.name : ('file_' + Date.now()));

      let fileObj = fileInput;
      let base64Clean = '';

      // Convert Base64 DataURL to File if needed
      if (typeof fileInput === 'string' && fileInput.startsWith('data:')) {
        fileObj = this.dataURLtoFile(fileInput, 'upload_' + Date.now() + '.png');
      }

      // Auto Smart Image Compression (Always compress image if enabled or if size > 1MB)
      const isImage = (fileObj && fileObj.type && fileObj.type.startsWith('image/')) || (typeof fileInput === 'string' && fileInput.startsWith('data:image/'));
      if (isImage && (this.config.autoCompress || fileObj.size > 1024 * 1024)) {
        try {
          onProgress(10, 'กำลังปรับขนาดและบีบอัดภาพให้อยู่ในเกณฑ์เหมาะสม...');
          const compressed = await this.compressImage(fileObj, {
            maxWidth: this.config.maxImageDimension || 1600,
            maxHeight: this.config.maxImageDimension || 1600,
            quality: this.config.compressionQuality || 0.80
          });
          if (compressed) {
            fileObj = compressed;
          }
        } catch (compErr) {
          console.warn("[MultiUploader] Image compression skipped:", compErr);
        }
      }

      // Convert compressed File back to Base64 DataURL / clean base64 if needed for providers
      if (fileObj && (!base64Clean || fileObj !== fileInput)) {
        try {
          const reader = new FileReader();
          const p = new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve('');
          });
          reader.readAsDataURL(fileObj);
          const dataUrl = await p;
          if (dataUrl && dataUrl.includes(',')) {
            base64Clean = dataUrl.split(',')[1];
          }
        } catch(e) {}
      }

      // Build Provider Sequence based on Admin Priority & Enabled settings
      let providers = [];
      const configuredPriority = Array.isArray(this.config.providerPriority) ? this.config.providerPriority : ['cloudinary', 'catbox', 'imgbb', 'freeimage'];
      const enabledList = Array.isArray(this.config.enabledProviders) ? this.config.enabledProviders : configuredPriority;

      if (preferred !== 'auto' && enabledList.includes(preferred)) {
        providers.push(preferred);
      }

      for (const p of configuredPriority) {
        if (enabledList.includes(p) && !providers.includes(p)) {
          providers.push(p);
        }
      }

      // If all disabled, fallback to any
      if (providers.length === 0) {
        providers = ['cloudinary', 'catbox', 'imgbb', 'freeimage'];
      }

      let lastError = null;

      for (const provider of providers) {
        try {
          onProgress(25, `กำลังเชื่อมต่อ ${this.getProviderName(provider)}...`);
          let uploadResult = null;

          if (provider === 'imgbb') {
            uploadResult = await this.uploadToImgBB(fileObj, base64Clean);
          } else if (provider === 'freeimage') {
            uploadResult = await this.uploadToFreeImage(fileObj, base64Clean);
          } else if (provider === 'catbox') {
            uploadResult = await this.uploadToCatbox(fileObj);
          } else if (provider === 'cloudinary') {
            uploadResult = await this.uploadToCloudinary(fileObj);
          }

          if (uploadResult && uploadResult.url) {
            onProgress(100, `อัปโหลดสำเร็จผ่าน ${this.getProviderName(provider)}!`);

            // Save to File Catalog for Full Management
            const uploaderInfo = options.uploader || {
              id: options.uploaderId || (sessionStorage.getItem('COMED_KKU69_USER_ID') || 'Anonymous'),
              name: options.uploaderName || (sessionStorage.getItem('COMED_KKU69_USER_NAME') || 'บุคคลทั่วไป'),
              email: options.uploaderEmail || (sessionStorage.getItem('COMED_KKU69_USER_EMAIL') || '-')
            };

            const fileItem = {
              id: 'FILE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: fileName,
              url: uploadResult.url,
              provider: provider,
              publicId: uploadResult.publicId || '',
              deleteToken: uploadResult.deleteToken || '',
              size: fileObj.size || 0,
              type: fileObj.type || 'image/png',
              category: options.category || 'สลิปการชำระเงิน',
              uploaderId: uploaderInfo.id,
              uploaderName: uploaderInfo.name,
              uploaderEmail: uploaderInfo.email,
              uploadedAt: new Date().toLocaleString('th-TH')
            };
            this.addToFileCatalog(fileItem);

            // Cloud sync to Supabase file log table if available
            if (window.getSupabaseClient) {
              const sb = window.getSupabaseClient();
              if (sb) {
                sb.from('admin_logs').insert({
                  admin_email: uploaderInfo.email || 'system',
                  action: `Upload [${provider}]`,
                  detail: JSON.stringify(fileItem)
                }).catch(() => {});
              }
            }

            return {
              url: uploadResult.url,
              provider: provider,
              publicId: uploadResult.publicId || '',
              fileItem: fileItem,
              success: true
            };
          }
        } catch (err) {
          console.warn(`[MultiUploader] Provider ${provider} failed:`, err);
          lastError = err;
          onProgress(40, `${this.getProviderName(provider)} ไม่ตอบสนอง กำลังสลับตัวสำรอง...`);
        }
      }

      throw new Error("ไม่สามารถอัปโหลดไฟล์ผ่านบริการใดๆ ได้: " + (lastError?.message || "Unknown error"));
    }

    /**
     * 1. ImgBB Upload
     */
    async uploadToImgBB(fileObj, base64Clean) {
      const apiKey = this.config.imgbbApiKey || '6d207e02198a847aa5ad8ac504ff3463';
      const formData = new FormData();
      if (base64Clean) {
        formData.append('image', base64Clean);
      } else {
        formData.append('image', fileObj);
      }

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        body: formData
      });

      const json = await response.json();
      if (json && json.data && json.data.url) {
        return {
          url: json.data.display_url || json.data.url,
          publicId: json.data.id || '',
          deleteToken: json.data.delete_url || ''
        };
      }
      throw new Error(json?.error?.message || "ImgBB upload rejected");
    }

    /**
     * 2. FreeImage.host API
     */
    async uploadToFreeImage(fileObj, base64Clean) {
      const apiKey = this.config.freeimageApiKey || '6d207e02198a847aa5ad8ac504ff3463';
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('action', 'upload');
      formData.append('format', 'json');

      if (base64Clean) {
        formData.append('source', base64Clean);
      } else {
        formData.append('source', fileObj);
      }

      const response = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: formData
      });

      const json = await response.json();
      if (json && json.image && json.image.url) {
        return {
          url: json.image.display_url || json.image.url,
          publicId: json.image.name || ''
        };
      }
      throw new Error(json?.error?.message || "FreeImage upload rejected");
    }

    /**
     * 3. Catbox.moe API
     */
    async uploadToCatbox(fileObj) {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      if (this.config.catboxUserHash) {
        formData.append('userhash', this.config.catboxUserHash);
      }
      formData.append('fileToUpload', fileObj);

      // Try multiple endpoints / proxies for Catbox
      const proxies = [
        'https://catbox.moe/user/api.php', // Direct (works in environments without strict preflight)
        'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://catbox.moe/user/api.php'),
        'https://thingproxy.freeboard.io/fetch/https://catbox.moe/user/api.php'
      ];

      let lastError = null;
      for (const targetUrl of proxies) {
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            body: formData
          });

          const text = (await response.text()).trim();
          if (text.startsWith('http://') || text.startsWith('https://')) {
            return {
              url: text.replace('http://', 'https://'),
              publicId: text.split('/').pop()
            };
          }
        } catch(e) {
          lastError = e;
        }
      }

      throw new Error("Catbox upload failed: " + (lastError?.message || "CORS proxy unreachable"));
    }

    /**
     * 4. Cloudinary Unsigned Upload
     */
    async uploadToCloudinary(fileObj) {
      const cloudName = (this.config.cloudinaryCloudName || 'demo').trim();
      const preset = (this.config.cloudinaryUploadPreset || 'docs_upload_example_preset').trim();
      
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('upload_preset', preset);

      const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const json = await response.json();
      if (json && json.secure_url) {
        return {
          url: json.secure_url,
          publicId: json.public_id || ''
        };
      }
      
      const errMsg = json?.error?.message || `Cloudinary rejected with status ${response.status}`;
      console.warn(`[MultiUploader] Cloudinary (${cloudName}/${preset}) failed:`, errMsg);
      throw new Error(errMsg);
    }

    /**
     * Delete File Operation
     */
    async deleteFile(fileItem) {
      if (!fileItem) return false;

      // 1. If Cloudinary with API Credentials
      if (fileItem.provider === 'cloudinary' && this.config.cloudinaryApiKey && this.config.cloudinaryApiSecret && fileItem.publicId) {
        try {
          const timestamp = Math.round(new Date().getTime() / 1000);
          const cloudName = this.config.cloudinaryCloudName;
          const apiKey = this.config.cloudinaryApiKey;
          const apiSecret = this.config.cloudinaryApiSecret;

          const toSign = `public_id=${fileItem.publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = await this.sha1(toSign);

          const formData = new FormData();
          formData.append('public_id', fileItem.publicId);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);

          await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, {
            method: 'POST',
            body: formData
          });
        } catch (e) {
          console.warn("Cloudinary delete error:", e);
        }
      }

      // Remove from catalog
      this.deleteFromCatalog(fileItem.id);
      return true;
    }

    async sha1(message) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getProviderName(p) {
      switch (p) {
        case 'imgbb': return 'ImgBB API';
        case 'freeimage': return 'FreeImage.host API';
        case 'catbox': return 'Catbox.moe';
        case 'cloudinary': return 'Cloudinary CDN';
        default: return 'Auto Smart Cloud';
      }
    }

    /**
     * Smart Image Compressor using Canvas
     * Resizes dimensions and adjusts JPEG/WebP compression quality
     */
    async compressImage(file, options = {}) {
      const maxWidth = options.maxWidth || 1600;
      const maxHeight = options.maxHeight || 1600;
      const quality = options.quality || 0.80;

      return new Promise((resolve) => {
        // If file is not image or already very small (< 250KB), no need to compress
        if (!file.type || !file.type.startsWith('image/') || file.size < 250 * 1024) {
          return resolve(file);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            // If image is over 5MB, aggressively scale down dimensions
            let targetMaxW = maxWidth;
            let targetMaxH = maxHeight;
            if (file.size > 8 * 1024 * 1024) {
              targetMaxW = Math.min(maxWidth, 1400);
              targetMaxH = Math.min(maxHeight, 1400);
            }

            // Calculate new dimensions respecting aspect ratio
            if (width > targetMaxW || height > targetMaxH) {
              if (width > height) {
                height = Math.round((height * targetMaxW) / width);
                width = targetMaxW;
              } else {
                width = Math.round((width * targetMaxH) / height);
                height = targetMaxH;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Draw with smooth interpolation
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Always use image/jpeg for large uploads (> 1MB) to ensure drastic size reduction
            const mimeType = (file.type === 'image/png' && file.size > 1024 * 1024) ? 'image/jpeg' : (file.type || 'image/jpeg');
            const targetQuality = file.size > 10 * 1024 * 1024 ? 0.75 : quality;

            canvas.toBlob((blob) => {
              if (!blob) {
                return resolve(file);
              }

              const newFileName = mimeType === 'image/jpeg' && !file.name.toLowerCase().endsWith('.jpg') && !file.name.toLowerCase().endsWith('.jpeg')
                ? file.name.replace(/\.[^/.]+$/, "") + ".jpg"
                : file.name;

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now()
              });

              console.log(`[MultiUploader] Compressed: ${(file.size/1024/1024).toFixed(2)}MB -> ${(compressedFile.size/1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size/file.size)*100)}% saved)`);
              resolve(compressedFile);
            }, mimeType, targetQuality);
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      });
    }

    dataURLtoFile(dataurl, filename) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }
  }

  // Expose global instance
  window.MultiCloudUploader = new MultiCloudUploader();

})(window);
