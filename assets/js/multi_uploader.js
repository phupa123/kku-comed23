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
  const MEMBER_SETTINGS_KEY = 'COMED_MEMBER_STORAGE_SETTINGS_V1';

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
    imgbbApiKey: localStorage.getItem('COMED_IMGBB_KEY') || '9977cfe63fa98c01f79336c5497b975e',

    // 2. Cloudinary Config (From .env)
    cloudinaryCloudName: localStorage.getItem('COMED_CLOUDINARY_NAME') || 'deykwl5q3',
    cloudinaryUploadPreset: localStorage.getItem('COMED_CLOUDINARY_PRESET') || 'KKUComed23',
    cloudinaryApiKey: localStorage.getItem('COMED_CLOUDINARY_API_KEY') || '181817825627181',
    cloudinaryApiSecret: localStorage.getItem('COMED_CLOUDINARY_API_SECRET') || '_2O_SpzP8bqbLaBwYt-k21duqDs',

    // 3. FreeImage API Key
    freeimageApiKey: localStorage.getItem('COMED_FREEIMAGE_KEY') || '6d207e02198a847aa98d0a2a901485a5',

    // 4. Catbox Userhash
    catboxUserHash: localStorage.getItem('COMED_CATBOX_HASH') || '4f0c883945e2fe8d067b3dd12'
  };

  const DEFAULT_MEMBER_SETTINGS = {
    global: {
      quotaGB: 5,               // 5 GB default
      maxDimension: 1600,       // 1600px default
      quality: 0.82,            // 82% quality
      autoCompress: true        // enable smart compression
    },
    userOverrides: {} // Keyed by studentId or lowercase email
  };

  class MultiCloudUploader {
    constructor() {
      this.config = this.loadConfig();
      this.fileCatalog = this.loadFileCatalog();
      this.memberSettings = this.loadMemberSettings();
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

    loadMemberSettings() {
      try {
        const saved = localStorage.getItem(MEMBER_SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            global: { ...DEFAULT_MEMBER_SETTINGS.global, ...(parsed.global || {}) },
            userOverrides: parsed.userOverrides || {}
          };
        }
      } catch (e) {
        console.warn("[MultiUploader] Failed to parse member settings:", e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_MEMBER_SETTINGS));
    }

    saveMemberSettings(newSettings) {
      if (newSettings) {
        this.memberSettings = {
          global: { ...this.memberSettings.global, ...(newSettings.global || {}) },
          userOverrides: newSettings.userOverrides || this.memberSettings.userOverrides
        };
      }
      localStorage.setItem(MEMBER_SETTINGS_KEY, JSON.stringify(this.memberSettings));
    }

    /**
     * Get storage quota and image resolution setting for a specific user.
     * Fallbacks to global settings if no individual override exists.
     * @param {string|Object} userIdentifier - studentId, email, or user object
     */
    getUserSettings(userIdentifier) {
      const globalCfg = this.memberSettings?.global || DEFAULT_MEMBER_SETTINGS.global;
      if (!userIdentifier) return { ...globalCfg, isOverride: false };

      let id = '';
      let email = '';
      if (typeof userIdentifier === 'object') {
        id = (userIdentifier.studentId || userIdentifier.id || '').trim();
        email = (userIdentifier.email || '').trim().toLowerCase();
      } else if (typeof userIdentifier === 'string') {
        const str = userIdentifier.trim();
        if (str.includes('@')) email = str.toLowerCase();
        else id = str;
      }

      const overrides = this.memberSettings?.userOverrides || {};
      let override = null;

      if (id && overrides[id]) {
        override = overrides[id];
      } else if (email && overrides[email]) {
        override = overrides[email];
      } else {
        // Also check if any override matches studentId / email within stored objects
        for (const k in overrides) {
          const item = overrides[k];
          if ((id && item.studentId === id) || (email && (item.email || '').toLowerCase() === email)) {
            override = item;
            break;
          }
        }
      }

      if (override) {
        return {
          quotaGB: Number(override.quotaGB !== undefined ? override.quotaGB : globalCfg.quotaGB),
          maxDimension: Number(override.maxDimension !== undefined ? override.maxDimension : globalCfg.maxDimension),
          quality: Number(override.quality !== undefined ? override.quality : globalCfg.quality),
          autoCompress: override.autoCompress !== undefined ? Boolean(override.autoCompress) : globalCfg.autoCompress,
          isOverride: true,
          overrideNote: override.note || ''
        };
      }

      // Check backward compatibility with COMED_CUSTOM_QUOTAS_V1
      try {
        const legacyQuotas = JSON.parse(localStorage.getItem('COMED_CUSTOM_QUOTAS_V1') || '{}');
        const legacyVal = (email && legacyQuotas[email]) || (id && legacyQuotas[id]);
        if (legacyVal) {
          return {
            quotaGB: Number(legacyVal),
            maxDimension: globalCfg.maxDimension,
            quality: globalCfg.quality,
            autoCompress: globalCfg.autoCompress,
            isOverride: true,
            overrideNote: 'Legacy Quota'
          };
        }
      } catch (e) {}

      // Default for Super Admin / Special Tester (phupa5874@gmail.com)
      const isSuper = (email === 'phupa5874@gmail.com') || (typeof userIdentifier === 'object' && userIdentifier.isSpecialTester);
      if (isSuper) {
        return {
          quotaGB: 100, // 100 GB default for Super Admin
          maxDimension: 4000,
          quality: 1.0,
          autoCompress: false,
          isOverride: true,
          overrideNote: 'Super Admin / Tester'
        };
      }

      return { ...globalCfg, isOverride: false };
    }

    /**
     * Set individual override for a user
     */
    setUserOverride(identifierKey, customData) {
      if (!this.memberSettings.userOverrides) this.memberSettings.userOverrides = {};
      if (!customData || customData.remove) {
        delete this.memberSettings.userOverrides[identifierKey];
      } else {
        this.memberSettings.userOverrides[identifierKey] = {
          ...this.memberSettings.userOverrides[identifierKey],
          ...customData,
          updatedAt: new Date().toISOString()
        };
      }
      this.saveMemberSettings();
    }

    /**
     * Set global default settings for all members
     */
    setGlobalSettings(globalData) {
      if (!this.memberSettings.global) this.memberSettings.global = { ...DEFAULT_MEMBER_SETTINGS.global };
      this.memberSettings.global = {
        ...this.memberSettings.global,
        ...globalData
      };
      this.saveMemberSettings();
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

      // Resolve user settings (Quota & Image resolution)
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('COMED_USER_SESSION') || 'null');
      } catch(e) {}
      const userKey = options.uploaderId || (storedUser?.studentId || options.uploaderEmail || storedUser?.email || '');
      const userSettings = this.getUserSettings(userKey);

      // Auto Smart Image Compression (Custom resolution / quality per member or global setting)
      // Can be explicitly bypassed if user turns off compression (skipCompression = true)
      const isImage = (fileObj && fileObj.type && fileObj.type.startsWith('image/')) || (typeof fileInput === 'string' && fileInput.startsWith('data:image/'));
      const shouldCompress = !options.skipCompression && userSettings.quality < 1.0 && (userSettings.autoCompress || fileObj.size > 1024 * 1024);

      if (isImage && shouldCompress) {
        try {
          const dim = userSettings.maxDimension || this.config.maxImageDimension || 1600;
          const qual = userSettings.quality !== undefined ? userSettings.quality : (this.config.compressionQuality || 0.82);
          onProgress(5, `กำลังปรับความคมชัดภาพ (สูงสุด ${dim}px, คุณภาพ ${Math.round(qual * 100)}%)...`, { phase: 'compress' });
          const compressed = await this.compressImage(fileObj, {
            maxWidth: dim,
            maxHeight: dim,
            quality: qual
          });
          if (compressed) {
            fileObj = compressed;
          }
        } catch (compErr) {
          console.warn("[MultiUploader] Image compression skipped:", compErr);
        }
      } else if (isImage && options.skipCompression) {
        onProgress(5, `⚡ โหมดไม่บีบอัดภาพ: กำลังเตรียมไฟล์ต้นฉบับความละเอียด 100%...`, { phase: 'prepare' });
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
          const providerName = this.getProviderName(provider);
          onProgress(10, `กำลังเชื่อมต่อไปยัง ${providerName}...`, { phase: 'connecting', provider });
          let uploadResult = null;

          // Wire real-time network progress callback (10% - 95%)
          const onNetProgress = (pct, loadedBytes, totalBytes) => {
            const mappedPct = Math.min(95, Math.max(10, Math.round(10 + (pct * 0.85))));
            let sizeMsg = '';
            if (loadedBytes && totalBytes) {
              const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
              const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
              sizeMsg = ` (${loadedMb}/${totalMb} MB)`;
            }
            onProgress(mappedPct, `กำลังส่งข้อมูลไปยัง ${providerName}${sizeMsg}... ${pct}%`, {
              phase: 'uploading',
              provider,
              percent: pct,
              loadedBytes,
              totalBytes
            });
          };

          if (provider === 'imgbb') {
            uploadResult = await this.uploadToImgBB(fileObj, base64Clean, onNetProgress);
          } else if (provider === 'freeimage') {
            uploadResult = await this.uploadToFreeImage(fileObj, base64Clean, onNetProgress);
          } else if (provider === 'catbox') {
            uploadResult = await this.uploadToCatbox(fileObj, onNetProgress);
          } else if (provider === 'cloudinary') {
            uploadResult = await this.uploadToCloudinary(fileObj, onNetProgress);
          }

          if (uploadResult && uploadResult.url) {
            onProgress(100, `อัปโหลดสำเร็จผ่าน ${this.getProviderName(provider)}!`);

            // Save to File Catalog for Full Management
            let storedUser = null;
            try {
              storedUser = JSON.parse(localStorage.getItem('COMED_USER_SESSION') || 'null');
            } catch(e) {}

            const uploaderInfo = options.uploader || {
              id: options.uploaderId || (storedUser?.studentId || sessionStorage.getItem('COMED_KKU69_USER_ID') || 'Anonymous'),
              name: options.uploaderName || (storedUser?.name || sessionStorage.getItem('COMED_KKU69_USER_NAME') || 'บุคคลทั่วไป'),
              email: options.uploaderEmail || (storedUser?.email || sessionStorage.getItem('COMED_KKU69_USER_EMAIL') || '-')
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
              category: options.category || 'อัปโหลดทั่วไป',
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
     * 1. ImgBB Upload with Real-time Progress
     */
    async uploadToImgBB(fileObj, base64Clean, onProgress) {
      const apiKey = this.config.imgbbApiKey || '6d207e02198a847aa5ad8ac504ff3463';
      const formData = new FormData();
      if (base64Clean) {
        formData.append('image', base64Clean);
      } else {
        formData.append('image', fileObj);
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`);

        if (xhr.upload && typeof onProgress === 'function') {
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              onProgress(pct, evt.loaded, evt.total);
            }
          };
        }

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && json && json.data && json.data.url) {
              resolve({
                url: json.data.display_url || json.data.url,
                publicId: json.data.id || '',
                deleteToken: json.data.delete_url || ''
              });
            } else {
              reject(new Error(json?.error?.message || `ImgBB upload failed (HTTP ${xhr.status})`));
            }
          } catch(err) {
            reject(new Error("ImgBB response parse error: " + err.message));
          }
        };

        xhr.onerror = () => reject(new Error("ImgBB network error"));
        xhr.send(formData);
      });
    }

    /**
     * 2. FreeImage.host API
     */
    async uploadToFreeImage(fileObj, base64Clean, onProgress) {
      const apiKey = this.config.freeimageApiKey || '6d207e02198a847aa98d0a2a901485a5';
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('action', 'upload');
      formData.append('format', 'json');

      if (base64Clean) {
        formData.append('source', base64Clean);
      } else {
        formData.append('source', fileObj);
      }

      const endpoints = [
        '/api/freeimage-proxy',
        'https://kku-comed23.edspace.workers.dev/api/freeimage-proxy'
      ];

      let lastErr = null;
      for (const ep of endpoints) {
        try {
          const response = await fetch(ep, {
            method: 'POST',
            body: formData
          });

          if (response.status === 400 || response.status === 403) {
            const errData = await response.json().catch(() => null);
            if (errData?.error?.code === 103 || errData?.error?.message?.includes('forbidden')) {
              throw new Error("FreeImage.host บล็อกการเชื่อมต่อจาก Cloudflare Worker Proxy (Error 103 Forbidden)");
            }
          }

          const json = await response.json().catch(() => null);
          if (json && json.image && json.image.url) {
            return {
              url: json.image.display_url || json.image.url,
              publicId: json.image.name || ''
            };
          }
        } catch(e) {
          lastErr = e;
        }
      }

      throw new Error("FreeImage upload rejected: " + (lastErr?.message || "เซิร์ฟเวอร์ FreeImage ปิดกั้นการเข้าถึง"));
    }

    /**
     * 3. Catbox.moe API with Real-time Progress
     */
    async uploadToCatbox(fileObj, onProgress) {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      if (this.config.catboxUserHash) {
        formData.append('userhash', this.config.catboxUserHash);
      }
      formData.append('fileToUpload', fileObj);

      const proxies = [
        '/api/catbox-proxy', // Internal Cloudflare Worker proxy (Zero CORS issues)
        'https://kku-comed23.edspace.workers.dev/api/catbox-proxy',
        'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://catbox.moe/user/api.php')
      ];

      let lastError = null;
      for (const targetUrl of proxies) {
        try {
          const res = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', targetUrl);

            if (xhr.upload && typeof onProgress === 'function') {
              xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                  const pct = Math.round((evt.loaded / evt.total) * 100);
                  onProgress(pct, evt.loaded, evt.total);
                }
              };
            }

            xhr.onload = () => {
              const text = (xhr.responseText || '').trim();
              if (xhr.status >= 200 && xhr.status < 300 && (text.startsWith('http://') || text.startsWith('https://'))) {
                resolve({
                  url: text.replace('http://', 'https://'),
                  publicId: text.split('/').pop()
                });
              } else {
                reject(new Error(text || `HTTP ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error("Catbox connection error"));
            xhr.send(formData);
          });

          if (res && res.url) return res;
        } catch(e) {
          lastError = e;
        }
      }

      throw new Error("Catbox upload failed: " + (lastError?.message || "CORS proxy unreachable"));
    }

    /**
     * 4. Cloudinary Unsigned Upload with Real-time Progress
     */
    async uploadToCloudinary(fileObj, onProgress) {
      const cloudName = (this.config.cloudinaryCloudName || 'demo').trim();
      const preset = (this.config.cloudinaryUploadPreset || 'docs_upload_example_preset').trim();
      
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('upload_preset', preset);

      const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);

        if (xhr.upload && typeof onProgress === 'function') {
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              onProgress(pct, evt.loaded, evt.total);
            }
          };
        }

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && json && json.secure_url) {
              resolve({
                url: json.secure_url,
                publicId: json.public_id || ''
              });
            } else {
              const errMsg = json?.error?.message || `Cloudinary rejected with HTTP ${xhr.status}`;
              reject(new Error(errMsg));
            }
          } catch(err) {
            reject(new Error("Cloudinary response parse error: " + err.message));
          }
        };

        xhr.onerror = () => reject(new Error("Cloudinary network error"));
        xhr.send(formData);
      });
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
