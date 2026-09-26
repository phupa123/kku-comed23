/**
 * =========================================================================
 * COMED CLOUD STORAGE & DRIVE REPOSITORY - assets/js/storage_drive_repo.js
 * ระบบคลาวด์ไดรฟ์ส่วนตัว/สาขา: โฟลเดอร์, การย้ายไฟล์, รหัสผ่านล็อค, 
 * การแชร์ลิงก์ (สาธารณะ / เฉพาะ COMED23 / เจาะจงคน / รหัสผ่าน / วันหมดอายุ)
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  const STORAGE_FOLDERS_KEY = 'COMED_DRIVE_FOLDERS_V1';
  const STORAGE_FILES_META_KEY = 'COMED_DRIVE_FILES_META_V1';
  const STORAGE_SHARES_KEY = 'COMED_DRIVE_SHARES_V1';
  const STORAGE_COMMENTS_KEY = 'COMED_DRIVE_COMMENTS_V1';

  // Default Folders for each new user
  const DEFAULT_USER_FOLDERS = [
    {
      id: 'fld_general',
      name: 'เอกสารทั่วไป',
      icon: 'folder',
      color: 'amber',
      passwordHash: null,
      isLocked: false,
      parentId: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fld_photos',
      name: 'คลังภาพกิจกรรม',
      icon: 'image',
      color: 'sky',
      passwordHash: null,
      isLocked: false,
      parentId: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fld_media',
      name: 'วิดีโอ & สื่อมัลติมีเดีย',
      icon: 'video',
      color: 'purple',
      passwordHash: null,
      isLocked: false,
      parentId: null,
      createdAt: new Date().toISOString()
    }
  ];

  class StorageDriveRepo {
    constructor() {
      this.folders = this.loadData(STORAGE_FOLDERS_KEY, []);
      this.filesMeta = this.loadData(STORAGE_FILES_META_KEY, {}); // { fileId: { folderId, isLocked, passwordHash, ... } }
      this.shares = this.loadData(STORAGE_SHARES_KEY, []); // [ { id, shareCode, targetType: 'file'|'folder', targetId, accessType: 'public'|'comed23'|'specific', allowedEmails: [], passwordHash, expiresAt, role: 'viewer'|'commenter'|'editor', ... } ]
      this.comments = this.loadData(STORAGE_COMMENTS_KEY, []); // [ { id, targetType, targetId, authorName, authorEmail, content, createdAt } ]
      this.hasSyncedCloud = false;
      this.initSync();
    }

    loadData(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    }

    saveData(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    // ================= SUPABASE CLOUD SYNC FOR SHARES =================
    async initSync() {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb) return;

        // Fetch from dedicated 'shortlinks' table
        const { data, error } = await sb
          .from('shortlinks')
          .select('*')
          .ilike('category', '%DriveShare%');

        if (!error && Array.isArray(data) && data.length > 0) {
          let hasNew = false;
          data.forEach(linkRow => {
            const code = linkRow.code;
            if (!code) return;

            let parsedMeta = {};
            try {
              if (linkRow.notes) parsedMeta = JSON.parse(linkRow.notes);
            } catch(e) {}

            const existingIdx = this.shares.findIndex(s => s.shareCode === code || s.id === linkRow.id);
            const shareRecord = {
              id: linkRow.id || ('shr_' + code),
              shareCode: code,
              targetType: parsedMeta.targetType || 'file',
              targetId: parsedMeta.targetId || '',
              title: linkRow.title ? linkRow.title.replace(/^\[แชร์ไดรฟ์\]\s*/, '') : 'แชร์ไฟล์',
              accessType: parsedMeta.accessType || 'public',
              role: parsedMeta.role || 'viewer', // 'viewer' | 'commenter' | 'editor'
              allowedEmails: parsedMeta.allowedEmails || [],
              hasPassword: !!parsedMeta.hasPassword,
              passwordHash: parsedMeta.passwordHash || null,
              expiresAt: parsedMeta.expiresAt || null,
              createdAt: linkRow.created_at || linkRow.createdAt || new Date().toISOString(),
              creatorEmail: parsedMeta.creatorEmail || (linkRow.created_by || ''),
              clicks: Number(linkRow.clicks) || 0,
              fileUrl: parsedMeta.fileUrl || '',
              fileName: parsedMeta.fileName || '',
              fileType: parsedMeta.fileType || '',
              fileSize: parsedMeta.fileSize || 0,
              folderFiles: Array.isArray(parsedMeta.folderFiles) ? parsedMeta.folderFiles : [],
              folderMeta: parsedMeta.folderMeta || null,
              comments: Array.isArray(parsedMeta.comments) ? parsedMeta.comments : [],
              updatedAt: linkRow.updated_at || new Date().toISOString()
            };

            // Sync comments back into this.comments cache if needed
            if (Array.isArray(shareRecord.comments) && shareRecord.comments.length > 0) {
              shareRecord.comments.forEach(cm => {
                if (!this.comments.some(c => c.id === cm.id)) {
                  this.comments.push(cm);
                }
              });
              this.saveData(STORAGE_COMMENTS_KEY, this.comments);
            }

            if (existingIdx >= 0) {
              this.shares[existingIdx] = { ...this.shares[existingIdx], ...shareRecord };
              hasNew = true;
            } else {
              this.shares.push(shareRecord);
              hasNew = true;
            }
          });

          // Reconcile: ตรวจสอบรายการใน Cloud เป็นหลัก
          const cloudCodes = new Set((data || []).map(r => r.code).filter(Boolean));
          // ถ้าบน Supabase ลบไปแล้ว ให้เอาออกจาก local ด้วย เพื่อไม่ให้ผีหลอกฟื้นคืนชีพ
          const beforeLen = this.shares.length;
          this.shares = this.shares.filter(s => cloudCodes.has(s.shareCode));
          if (this.shares.length !== beforeLen) {
            hasNew = true;
          }

          if (hasNew) {
            this.saveData(STORAGE_SHARES_KEY, this.shares);
          }
        } else if (!error && Array.isArray(data) && data.length === 0) {
          // ถ้าบน Cloud ไม่มีแถวใดๆ เลย แสดงว่าถูกลบหมดแล้ว
          this.shares = [];
          this.saveData(STORAGE_SHARES_KEY, this.shares);
        }
        this.hasSyncedCloud = true;
      } catch (e) {
        console.warn("[StorageDriveRepo] Supabase share initSync suppressed:", e);
      }
    }

    async syncShareToCloud(shareRecord) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !shareRecord || !shareRecord.shareCode) return;

        // Attach file metadata if available
        let fileUrl = shareRecord.fileUrl || '';
        let fileName = shareRecord.fileName || '';
        let fileType = shareRecord.fileType || '';
        let fileSize = shareRecord.fileSize || 0;

        if (shareRecord.targetType === 'file' && (!fileUrl || !fileName)) {
          const allFiles = window.MultiCloudUploader ? window.MultiCloudUploader.getAllFiles() : [];
          const f = allFiles.find(item => item.id === shareRecord.targetId);
          if (f) {
            fileUrl = f.url || '';
            fileName = f.originalName || f.name || '';
            fileType = f.type || '';
            fileSize = f.size || 0;
          }
        }

        // Gather folder files and meta if targetType === 'folder'
        let folderFiles = Array.isArray(shareRecord.folderFiles) ? shareRecord.folderFiles : [];
        let folderMeta = shareRecord.folderMeta || null;
        if (shareRecord.targetType === 'folder') {
          const folderObj = this.folders.find(f => f.id === shareRecord.targetId);
          if (folderObj) {
            folderMeta = {
              id: folderObj.id,
              name: folderObj.name,
              color: folderObj.color || 'amber',
              icon: folderObj.icon || 'folder'
            };
          }
          if (folderFiles.length === 0) {
            const allFiles = window.MultiCloudUploader ? window.MultiCloudUploader.getAllFiles() : [];
            folderFiles = allFiles.filter(item => {
              const meta = this.getFileMeta(item.id);
              return meta && meta.folderId === shareRecord.targetId;
            }).map(item => ({
              id: item.id,
              name: item.originalName || item.name || 'ไฟล์',
              url: item.url || '',
              size: item.size || 0,
              type: item.type || '',
              provider: item.provider || 'cloud',
              uploadedAt: item.uploadedAt || ''
            }));
          }
        }

        // Attach comments related to this target
        const relatedComments = this.getTargetComments(shareRecord.targetType, shareRecord.targetId);

        const metaObj = {
          targetType: shareRecord.targetType,
          targetId: shareRecord.targetId,
          accessType: shareRecord.accessType,
          role: shareRecord.role || 'viewer',
          allowedEmails: shareRecord.allowedEmails || [],
          hasPassword: !!shareRecord.hasPassword,
          passwordHash: shareRecord.passwordHash || null,
          expiresAt: shareRecord.expiresAt || null,
          creatorEmail: shareRecord.creatorEmail || '',
          fileUrl,
          fileName,
          fileType,
          fileSize,
          folderFiles,
          folderMeta,
          comments: relatedComments
        };

        const targetUrl = `${window.location.origin}/storage.html?share=${encodeURIComponent(shareRecord.shareCode)}`;

        // Sync to dedicated 'shortlinks' table
        const { data, error } = await sb.from('shortlinks').upsert({
          id: shareRecord.id || ('shr_' + shareRecord.shareCode),
          code: shareRecord.shareCode,
          title: `[แชร์ไดรฟ์] ${shareRecord.title || fileName || (folderMeta && folderMeta.name) || shareRecord.targetType}`,
          target_url: targetUrl,
          category: 'DriveShare',
          clicks: Number(shareRecord.clicks) || 0,
          is_active: true,
          notes: JSON.stringify(metaObj),
          created_by: shareRecord.creatorEmail || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'code' }).select();

        if (error) {
          console.error("[StorageDriveRepo] ❌ Supabase upsert error:", error);
          throw error;
        }
        console.log("[StorageDriveRepo] ✅ Synced share link to Supabase:", shareRecord.shareCode, data);
      } catch(err) {
        console.error("[StorageDriveRepo] Cloud share sync error:", err);
        throw err;
      }
    }

    async deleteShareFromCloud(shareCode) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !shareCode) return;
        const cleanCode = String(shareCode).trim();
        const { data, error } = await sb.from('shortlinks').delete().eq('code', cleanCode).select();
        if (error) {
          console.error("[StorageDriveRepo] ❌ Error deleting share link from Supabase:", error);
          throw error;
        }
        console.log("[StorageDriveRepo] 🗑️ Deleted share link from Supabase:", cleanCode, data);
      } catch (err) {
        console.error("[StorageDriveRepo] Cloud share delete error:", err);
        throw err;
      }
    }

    async fetchShareByCodeFromCloud(shareCode) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !shareCode) return null;

        const cleanCode = String(shareCode).trim();
        const { data, error } = await sb
          .from('shortlinks')
          .select('*')
          .eq('code', cleanCode)
          .maybeSingle();

        if (error || !data) return null;

        let parsedMeta = {};
        try {
          if (data.notes) parsedMeta = JSON.parse(data.notes);
        } catch(e) {}

        const shareRecord = {
          id: data.id || ('shr_' + data.code),
          shareCode: data.code || cleanCode,
          targetType: parsedMeta.targetType || 'file',
          targetId: parsedMeta.targetId || '',
          title: data.title ? data.title.replace(/^\[แชร์ไดรฟ์\]\s*/, '') : 'แชร์ไฟล์',
          accessType: parsedMeta.accessType || 'public',
          role: parsedMeta.role || 'viewer',
          allowedEmails: parsedMeta.allowedEmails || [],
          hasPassword: !!parsedMeta.hasPassword,
          passwordHash: parsedMeta.passwordHash || null,
          expiresAt: parsedMeta.expiresAt || null,
          createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          creatorEmail: parsedMeta.creatorEmail || (data.created_by || ''),
          clicks: Number(data.clicks) || 0,
          fileUrl: parsedMeta.fileUrl || '',
          fileName: parsedMeta.fileName || '',
          fileType: parsedMeta.fileType || '',
          fileSize: parsedMeta.fileSize || 0,
          folderFiles: Array.isArray(parsedMeta.folderFiles) ? parsedMeta.folderFiles : [],
          folderMeta: parsedMeta.folderMeta || null,
          comments: Array.isArray(parsedMeta.comments) ? parsedMeta.comments : [],
          updatedAt: data.updated_at || new Date().toISOString()
        };

        // Cache comments
        if (Array.isArray(shareRecord.comments) && shareRecord.comments.length > 0) {
          shareRecord.comments.forEach(cm => {
            if (!this.comments.some(c => c.id === cm.id)) {
              this.comments.push(cm);
            }
          });
          this.saveData(STORAGE_COMMENTS_KEY, this.comments);
        }

        const existingIdx = this.shares.findIndex(s => s.shareCode === shareRecord.shareCode);
        if (existingIdx >= 0) {
          this.shares[existingIdx] = shareRecord;
        } else {
          this.shares.push(shareRecord);
        }
        this.saveData(STORAGE_SHARES_KEY, this.shares);

        return shareRecord;
      } catch(err) {
        console.warn("[StorageDriveRepo] fetchShareByCodeFromCloud error:", err);
        return null;
      }
    }

    // ================= 1. HASH HELPER =================
    async hashPassword(password) {
      if (!password) return null;
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ================= 2. FOLDERS MANAGEMENT =================
    getUserFolders(userKey) {
      const uKey = (userKey || 'guest').toLowerCase().trim();
      let userFlds = this.folders.filter(f => (f.userKey || 'guest').toLowerCase() === uKey);
      
      // Auto seed default folders if user has none
      if (userFlds.length === 0 && uKey !== 'guest') {
        const seeded = DEFAULT_USER_FOLDERS.map(df => ({
          ...df,
          id: df.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userKey: uKey
        }));
        this.folders.push(...seeded);
        this.saveData(STORAGE_FOLDERS_KEY, this.folders);
        userFlds = seeded;
      }
      return userFlds;
    }

    async createFolder(arg1, arg2 = {}) {
      let uKey = 'guest';
      let options = {};

      if (typeof arg1 === 'string') {
        uKey = arg1;
        options = arg2 || {};
      } else if (arg1 && typeof arg1 === 'object') {
        options = arg1;
        uKey = options.userEmail || options.userKey || 'guest';
      }

      const { name = 'โฟลเดอร์ใหม่', color = 'amber', icon = 'folder', parentId = null, password = '' } = options;
      uKey = (uKey || 'guest').toLowerCase().trim();
      const passHash = password ? await this.hashPassword(password) : null;
      
      const newFolder = {
        id: 'fld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: (name || 'โฟลเดอร์ใหม่').trim(),
        userKey: uKey,
        color: color,
        icon: icon,
        parentId: parentId || null,
        passwordHash: passHash,
        isLocked: !!passHash,
        createdAt: new Date().toISOString()
      };

      this.folders.push(newFolder);
      this.saveData(STORAGE_FOLDERS_KEY, this.folders);
      return newFolder;
    }

    async updateFolder(folderId, options = {}) {
      const fld = this.folders.find(f => f.id === folderId);
      if (!fld) throw new Error('ไม่พบโฟลเดอร์');

      const { name, color, icon, password, removePassword, isLocked } = options;

      if (name !== undefined && name !== null) fld.name = String(name).trim();
      if (color !== undefined) fld.color = color;
      if (icon !== undefined) fld.icon = icon;

      if (removePassword || isLocked === false) {
        fld.passwordHash = null;
        fld.isLocked = false;
      } else if (password) {
        fld.passwordHash = await this.hashPassword(password);
        fld.isLocked = true;
      }

      this.saveData(STORAGE_FOLDERS_KEY, this.folders);
      return fld;
    }

    deleteFolder(folderId) {
      // Find all files in this folder and unassign them (move to root)
      for (const fId in this.filesMeta) {
        if (this.filesMeta[fId].folderId === folderId) {
          this.filesMeta[fId].folderId = null;
        }
      }
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);

      this.folders = this.folders.filter(f => f.id !== folderId);
      this.saveData(STORAGE_FOLDERS_KEY, this.folders);
      return true;
    }

    async checkFolderPassword(folderId, inputPassword) {
      const fld = this.folders.find(f => f.id === folderId);
      if (!fld || !fld.passwordHash) return true;
      const inputHash = await this.hashPassword(inputPassword);
      return inputHash === fld.passwordHash;
    }

    // ================= 3. FILE METADATA & MOVE FILE =================
    getFileMeta(fileId) {
      return this.filesMeta[fileId] || {
        folderId: null,
        isLocked: false,
        passwordHash: null,
        tags: [],
        isTrash: false,
        trashedAt: null,
        originalFolderId: null
      };
    }

    // ================= 3.0 RECYCLE BIN / TRASH SYSTEM =================
    async moveToTrash(fileId) {
      if (!this.filesMeta[fileId]) {
        this.filesMeta[fileId] = {
          folderId: null,
          isLocked: false,
          passwordHash: null,
          tags: [],
          isTrash: false,
          trashedAt: null,
          originalFolderId: null
        };
      }
      const meta = this.filesMeta[fileId];
      meta.originalFolderId = meta.folderId || null;
      meta.folderId = null; // Unlink from normal folder view
      meta.isTrash = true;
      meta.trashedAt = new Date().toISOString();
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return meta;
    }

    async batchMoveToTrash(fileIds = []) {
      for (const id of fileIds) {
        await this.moveToTrash(id);
      }
      return true;
    }

    async restoreFromTrash(fileId) {
      if (!this.filesMeta[fileId]) return null;
      const meta = this.filesMeta[fileId];
      meta.isTrash = false;
      meta.folderId = meta.originalFolderId || null;
      meta.trashedAt = null;
      meta.originalFolderId = null;
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return meta;
    }

    async batchRestoreFromTrash(fileIds = []) {
      for (const id of fileIds) {
        await this.restoreFromTrash(id);
      }
      return true;
    }

    async permanentDeleteFileMeta(fileId) {
      if (this.filesMeta[fileId]) {
        delete this.filesMeta[fileId];
        this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      }
      return true;
    }

    async moveFile(fileId, targetFolderId) {
      if (!this.filesMeta[fileId]) {
        this.filesMeta[fileId] = { folderId: null, isLocked: false, passwordHash: null, tags: [] };
      }
      this.filesMeta[fileId].folderId = targetFolderId || null;
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return this.filesMeta[fileId];
    }

    async batchMoveFiles(fileIds, targetFolderId) {
      fileIds.forEach(id => {
        if (!this.filesMeta[id]) {
          this.filesMeta[id] = { folderId: null, isLocked: false, passwordHash: null, tags: [] };
        }
        this.filesMeta[id].folderId = targetFolderId || null;
      });
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return true;
    }

    async setFileLock(fileId, arg1, arg2) {
      if (!this.filesMeta[fileId]) {
        this.filesMeta[fileId] = { folderId: null, isLocked: false, passwordHash: null, tags: [] };
      }

      let password = null;
      if (typeof arg1 === 'boolean') {
        password = arg1 ? arg2 : null;
      } else {
        password = arg1;
      }

      if (!password) {
        this.filesMeta[fileId].passwordHash = null;
        this.filesMeta[fileId].isLocked = false;
      } else {
        this.filesMeta[fileId].passwordHash = await this.hashPassword(password);
        this.filesMeta[fileId].isLocked = true;
      }
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return this.filesMeta[fileId];
    }

    async checkFilePassword(fileId, inputPassword) {
      const meta = this.filesMeta[fileId];
      if (!meta || !meta.passwordHash) return true;
      const inputHash = await this.hashPassword(inputPassword);
      return inputHash === meta.passwordHash;
    }

    // ================= 3.1 TAG MANAGEMENT =================
    getFileTags(fileId) {
      const meta = this.filesMeta[fileId];
      return (meta && Array.isArray(meta.tags)) ? [...meta.tags] : [];
    }

    async setFileTags(fileId, tags = []) {
      if (!this.filesMeta[fileId]) {
        this.filesMeta[fileId] = { folderId: null, isLocked: false, passwordHash: null, tags: [] };
      }
      const cleanTags = Array.isArray(tags)
        ? tags.map(t => String(t).trim()).filter(Boolean)
        : [];
      this.filesMeta[fileId].tags = [...new Set(cleanTags)];
      this.saveData(STORAGE_FILES_META_KEY, this.filesMeta);
      return this.filesMeta[fileId];
    }

    async addFileTag(fileId, tag) {
      if (!tag) return;
      const current = this.getFileTags(fileId);
      if (!current.includes(tag.trim())) {
        current.push(tag.trim());
        return this.setFileTags(fileId, current);
      }
      return this.filesMeta[fileId];
    }

    async removeFileTag(fileId, tag) {
      if (!tag) return;
      const current = this.getFileTags(fileId).filter(t => t !== tag.trim());
      return this.setFileTags(fileId, current);
    }

    getAllUserTags() {
      const tagsSet = new Set();
      for (const fId in this.filesMeta) {
        const itemTags = this.filesMeta[fId].tags;
        if (Array.isArray(itemTags)) {
          itemTags.forEach(t => tagsSet.add(t));
        }
      }
      return Array.from(tagsSet);
    }

    // ================= 4. ADVANCED SHARING ENGINE =================
    async createShareLink(options = {}) {
      const {
        targetType = 'file', // 'file' | 'folder'
        targetId,
        title = 'แชร์ไฟล์',
        accessType = 'public', // 'public' | 'comed23' | 'specific'
        role = 'viewer', // 'viewer' | 'commenter' | 'editor'
        allowedEmails = [],
        password = '',
        expiresInHours = 0, // 0 = no expiration
        creatorEmail = '',
        createdBy = ''
      } = options;
      const finalCreator = (creatorEmail || createdBy || '').toLowerCase().trim();

      // ตรวจสอบว่าไฟล์หรือโฟลเดอร์นี้มีลิงก์เดิมอยู่แล้วหรือไม่ ถ้ามีให้ใช้รหัสเดิมเพื่อไม่ให้ต้องส่งลิงก์ใหม่
      const existing = this.getShareByTarget(targetType, targetId);
      if (existing) {
        const updateData = {
          accessType,
          role,
          allowedEmails,
          expiresInHours
        };
        if (password) {
          updateData.password = password;
        }
        return await this.updateShare(existing.id, updateData);
      }

      const code = 's_' + Math.random().toString(36).substring(2, 8);
      const passHash = password ? await this.hashPassword(password) : null;

      let expiresAt = null;
      if (expiresInHours > 0) {
        expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
      }

      // ดึงข้อมูลไฟล์ตอนสร้าง share record เลย เพื่อให้เก็บลง Supabase ได้ทันที
      let fileUrl = '';
      let fileName = '';
      let fileType = '';
      let fileSize = 0;
      if (targetType === 'file' && targetId) {
        const allFiles = window.MultiCloudUploader ? window.MultiCloudUploader.getAllFiles() : [];
        const f = allFiles.find(item => item.id === targetId);
        if (f) {
          fileUrl = f.url || '';
          fileName = f.originalName || f.name || '';
          fileType = f.type || '';
          fileSize = f.size || 0;
        }
      }

      const shareRecord = {
        id: 'shr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        shareCode: code,
        targetType,
        targetId,
        title: title || fileName || 'แชร์ไฟล์',
        accessType, // public, comed23, specific
        role: role || 'viewer', // viewer, commenter, editor
        allowedEmails: (allowedEmails || []).map(e => e.toLowerCase().trim()),
        hasPassword: !!passHash,
        passwordHash: passHash,
        expiresAt,
        createdAt: new Date().toISOString(),
        creatorEmail: finalCreator,
        clicks: 0,
        // เก็บข้อมูลไฟล์ไว้ใน record เพื่อให้คนอื่นเข้าลิงก์แล้วดูไฟล์ได้
        fileUrl,
        fileName,
        fileType,
        fileSize
      };

      this.shares.unshift(shareRecord);
      this.saveData(STORAGE_SHARES_KEY, this.shares);

      // await เพื่อให้แน่ใจว่าขึ้น Supabase ก่อน return
      await this.syncShareToCloud(shareRecord);
      return shareRecord;
    }

    getShareByCode(shareCode) {
      if (!shareCode) return null;
      const clean = String(shareCode).trim();
      return this.shares.find(s => s.shareCode === clean);
    }

    async getShareByCodeAsync(shareCode) {
      const local = this.getShareByCode(shareCode);
      if (local) return local;
      return await this.fetchShareByCodeFromCloud(shareCode);
    }

    getShareByTarget(targetType, targetId) {
      return this.shares.find(s => s.targetType === targetType && s.targetId === targetId);
    }

    getUserShares(userEmail) {
      const email = (userEmail || '').toLowerCase().trim();
      if (!email) return [];
      return this.shares.filter(s => s.creatorEmail === email);
    }

    async updateShare(shareId, updateData = {}) {
      const share = this.shares.find(s => s.id === shareId);
      if (!share) return null;

      if (updateData.accessType !== undefined) share.accessType = updateData.accessType;
      if (updateData.role !== undefined) share.role = updateData.role;
      if (updateData.allowedEmails !== undefined) {
        share.allowedEmails = (updateData.allowedEmails || []).map(e => e.toLowerCase().trim());
      }
      if (updateData.expiresInHours !== undefined) {
        if (updateData.expiresInHours > 0) {
          share.expiresAt = new Date(Date.now() + updateData.expiresInHours * 60 * 60 * 1000).toISOString();
        } else {
          share.expiresAt = null;
        }
      }
      if (updateData.password !== undefined) {
        if (updateData.password) {
          share.passwordHash = await this.hashPassword(updateData.password);
          share.hasPassword = true;
        } else if (updateData.removePassword) {
          share.passwordHash = null;
          share.hasPassword = false;
        }
      }

      share.updatedAt = new Date().toISOString();
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      try {
        await this.syncShareToCloud(share);
      } catch (err) {
        console.warn("[StorageDriveRepo] Cloud sync on updateShare failed:", err);
      }
      return share;
    }

    // ================= COMMENTS ENGINE =================
    getTargetComments(targetType, targetId) {
      return this.comments.filter(c => c.targetType === targetType && c.targetId === targetId);
    }

    addComment(targetType, targetId, author, content) {
      const authorName = (author && (author.name || author.displayName || author.email)) || 'ผู้ใช้งาน';
      const authorEmail = (author && author.email) || '';
      const authorAvatar = (author && author.avatar) || '';

      const comment = {
        id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        targetType,
        targetId,
        authorName,
        authorEmail,
        authorAvatar,
        content: (content || '').trim(),
        createdAt: new Date().toISOString()
      };

      this.comments.unshift(comment);
      this.saveData(STORAGE_COMMENTS_KEY, this.comments);

      // Auto sync to cloud if there is a share record for this target
      const targetShares = this.shares.filter(s => s.targetType === targetType && s.targetId === targetId);
      targetShares.forEach(s => {
        this.syncShareToCloud(s).catch(() => {});
      });

      return comment;
    }

    deleteComment(commentId) {
      const found = this.comments.find(c => c.id === commentId);
      this.comments = this.comments.filter(c => c.id !== commentId);
      this.saveData(STORAGE_COMMENTS_KEY, this.comments);

      if (found) {
        const targetShares = this.shares.filter(s => s.targetType === found.targetType && s.targetId === found.targetId);
        targetShares.forEach(s => {
          this.syncShareToCloud(s).catch(() => {});
        });
      }
      return true;
    }

    async deleteShare(shareId) {
      const target = this.shares.find(s => s.id === shareId);
      this.shares = this.shares.filter(s => s.id !== shareId);
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      if (target && target.shareCode) {
        try {
          await this.deleteShareFromCloud(target.shareCode);
        } catch (err) {
          console.warn("[StorageDriveRepo] Delete share cloud sync error:", err);
        }
      }
      return true;
    }

    async revokeShareForTarget(targetType, targetId) {
      const targets = this.shares.filter(s => s.targetType === targetType && s.targetId === targetId);
      this.shares = this.shares.filter(s => !(s.targetType === targetType && s.targetId === targetId));
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      for (const t of targets) {
        if (t.shareCode) {
          try {
            await this.deleteShareFromCloud(t.shareCode);
          } catch (err) {
            console.warn("[StorageDriveRepo] Revoke share cloud sync error:", err);
          }
        }
      }
      return true;
    }

    async verifyShareAccess(shareCode, currentUser, inputPassword = '') {
      let share = this.getShareByCode(shareCode);
      if (!share) {
        share = await this.fetchShareByCodeFromCloud(shareCode);
      }
      if (!share) return { allowed: false, reason: 'ไม่พบลิงก์แชร์นี้' };

      // 1. Check expiration
      if (share.expiresAt) {
        if (new Date().getTime() > new Date(share.expiresAt).getTime()) {
          return { allowed: false, reason: 'ลิงก์แชร์นี้หมดอายุแล้ว' };
        }
      }

      // 2. Check password
      if (share.hasPassword) {
        if (!inputPassword) {
          return { allowed: false, requirePassword: true, reason: 'กรุณากรอกรหัสผ่านเพื่อเข้าถึง' };
        }
        const inputHash = await this.hashPassword(inputPassword);
        if (inputHash !== share.passwordHash) {
          return { allowed: false, requirePassword: true, reason: 'รหัสผ่านไม่ถูกต้อง' };
        }
      }

      // 3. Check access rights
      const userObj = currentUser && typeof currentUser === 'object' ? currentUser : {};
      const userEmail = (userObj.email || userObj.userEmail || (typeof currentUser === 'string' ? currentUser : '') || '').toLowerCase().trim();

      if (share.accessType === 'comed23') {
        if (!userEmail) {
          return { allowed: false, requireLogin: true, reason: 'เข้าถึงได้เฉพาะสมาชิก COMED23 เท่านั้น กรุณาเข้าสู่ระบบด้วย @kkumail.com' };
        }
        const isComed = userEmail.endsWith('@kkumail.com') || userEmail === 'phupa5874@gmail.com';
        if (!isComed) {
          return { allowed: false, reason: 'ขออภัย ลิงก์นี้จำกัดเฉพาะสมาชิก COMED23' };
        }
      } else if (share.accessType === 'specific') {
        if (!userEmail) {
          return { allowed: false, requireLogin: true, reason: 'ลิงก์นี้จำกัดเฉพาะบุคคลที่กำหนด กรุณาเข้าสู่ระบบ' };
        }
        const isAllowed = (share.allowedEmails || []).includes(userEmail) || share.creatorEmail === userEmail || userEmail === 'phupa5874@gmail.com';
        if (!isAllowed) {
          return { allowed: false, reason: `ขออภัย บัญชี "${userEmail}" ไม่ได้รับสิทธิ์เข้าถึงเนื้อหานี้` };
        }
      }

      // Increment click
      share.clicks = (share.clicks || 0) + 1;
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      this.syncShareToCloud(share).catch(() => {});

      return { allowed: true, share };
    }
  }

  // Export to Global
  const repoInstance = new StorageDriveRepo();
  window.StorageDriveRepo = repoInstance;

  // Ensure initSync is triggered once DOM and Supabase library are fully ready
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      repoInstance.initSync();
    });
    window.addEventListener('load', () => {
      repoInstance.initSync();
    });
  }

})(window);
