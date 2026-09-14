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
      this.shares = this.loadData(STORAGE_SHARES_KEY, []); // [ { id, shareCode, targetType: 'file'|'folder', targetId, accessType: 'public'|'comed23'|'specific', allowedEmails: [], passwordHash, expiresAt, ... } ]
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
        tags: []
      };
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

    // ================= 4. ADVANCED SHARING ENGINE =================
    async createShareLink(options = {}) {
      const {
        targetType = 'file', // 'file' | 'folder'
        targetId,
        title = 'แชร์ไฟล์',
        accessType = 'public', // 'public' | 'comed23' | 'specific'
        allowedEmails = [],
        password = '',
        expiresInHours = 0, // 0 = no expiration
        creatorEmail = '',
        createdBy = ''
      } = options;
      const finalCreator = (creatorEmail || createdBy || '').toLowerCase().trim();
      const code = 's_' + Math.random().toString(36).substring(2, 8);
      const passHash = password ? await this.hashPassword(password) : null;

      let expiresAt = null;
      if (expiresInHours > 0) {
        expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
      }

      const shareRecord = {
        id: 'shr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        shareCode: code,
        targetType,
        targetId,
        title,
        accessType, // public, comed23, specific
        allowedEmails: (allowedEmails || []).map(e => e.toLowerCase().trim()),
        hasPassword: !!passHash,
        passwordHash: passHash,
        expiresAt,
        createdAt: new Date().toISOString(),
        creatorEmail: finalCreator,
        clicks: 0
      };

      this.shares.unshift(shareRecord);
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      return shareRecord;
    }

    getShareByCode(shareCode) {
      return this.shares.find(s => s.shareCode === shareCode);
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
      return share;
    }

    deleteShare(shareId) {
      this.shares = this.shares.filter(s => s.id !== shareId);
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      return true;
    }

    revokeShareForTarget(targetType, targetId) {
      this.shares = this.shares.filter(s => !(s.targetType === targetType && s.targetId === targetId));
      this.saveData(STORAGE_SHARES_KEY, this.shares);
      return true;
    }

    async verifyShareAccess(shareCode, currentUser, inputPassword = '') {
      const share = this.getShareByCode(shareCode);
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
      if (share.accessType === 'comed23') {
        if (!currentUser || !currentUser.email) {
          return { allowed: false, requireLogin: true, reason: 'เข้าถึงได้เฉพาะสมาชิก COMED23 เท่านั้น กรุณาเข้าสู่ระบบด้วย @kkumail.com' };
        }
        const email = currentUser.email.toLowerCase();
        const isComed = email.endsWith('@kkumail.com') || email === 'phupa5874@gmail.com';
        if (!isComed) {
          return { allowed: false, reason: 'ขออภัย ลิงก์นี้จำกัดเฉพาะสมาชิก COMED23' };
        }
      } else if (share.accessType === 'specific') {
        if (!currentUser || !currentUser.email) {
          return { allowed: false, requireLogin: true, reason: 'ลิงก์นี้จำกัดเฉพาะบุคคลที่กำหนด กรุณาเข้าสู่ระบบ' };
        }
        const email = currentUser.email.toLowerCase();
        const isAllowed = share.allowedEmails.includes(email) || share.creatorEmail === email || email === 'phupa5874@gmail.com';
        if (!isAllowed) {
          return { allowed: false, reason: `ขออภัย บัญชี "${currentUser.email}" ไม่ได้รับสิทธิ์เข้าถึงเนื้อหานี้` };
        }
      }

      // Increment click
      share.clicks = (share.clicks || 0) + 1;
      this.saveData(STORAGE_SHARES_KEY, this.shares);

      return { allowed: true, share };
    }
  }

  // Export to Global
  window.StorageDriveRepo = new StorageDriveRepo();

})(window);
