/**
 * =========================================================================
 * SHORTLINK CORE ENGINE & REPOSITORY - assets/js/shortlink_repo.js
 * จัดการระบบย่อลิงก์ (Short URL), สถิติคลิก, QR Code และ Cloud Sync
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  const SHORTLINKS_STORAGE_KEY = 'COMED_SHORTLINKS_DATA_V1';

  // Seed default shortlinks
  const DEFAULT_LINKS = [
    {
      id: 'lnk_pay',
      code: 'pay',
      title: 'ระบบชำระเงินค่ากิจกรรม COMED KKU 69',
      targetUrl: 'https://kku-comed23.edspace.workers.dev/payment.html',
      clicks: 142,
      category: 'การเงิน',
      isActive: true,
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
      createdBy: 'Super Admin'
    },
    {
      id: 'lnk_event',
      code: 'event',
      title: 'เลือกรอบกิจกรรม ซุ้มพี่บัณฑิต & วันเด็ก',
      targetUrl: 'https://kku-comed23.edspace.workers.dev/eventclass.html',
      clicks: 98,
      category: 'กิจกรรม',
      isActive: true,
      createdAt: '2026-09-02T09:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
      createdBy: 'Super Admin'
    },
    {
      id: 'lnk_dept',
      code: 'dept',
      title: 'เลือกฝ่ายและคณะกรรมการดำเนินงานรุ่น',
      targetUrl: 'https://kku-comed23.edspace.workers.dev/event.html',
      clicks: 76,
      category: 'กิจกรรม',
      isActive: true,
      createdAt: '2026-09-03T09:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
      createdBy: 'Super Admin'
    },
    {
      id: 'lnk_upload',
      code: 'upload',
      title: 'ระบบอัปโหลดไฟล์ Multi-Cloud',
      targetUrl: 'https://kku-comed23.edspace.workers.dev/upload.html',
      clicks: 54,
      category: 'เครื่องมือ',
      isActive: true,
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-14T10:00:00.000Z',
      createdBy: 'Super Admin'
    }
  ];

  class ShortlinkRepo {
    constructor() {
      this.links = this.loadLocalLinks();
      this.hasSyncedCloud = false;
      this.initSync();
    }

    loadLocalLinks() {
      try {
        const saved = localStorage.getItem(SHORTLINKS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Error parsing local links:", e);
      }
      this.saveLocalLinks(DEFAULT_LINKS);
      return [...DEFAULT_LINKS];
    }

    saveLocalLinks(items) {
      this.links = items;
      try {
        localStorage.setItem(SHORTLINKS_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("[ShortlinkRepo] Error writing localStorage:", e);
      }
    }

    getAll() {
      return [...this.links];
    }

    getByCode(code) {
      if (!code) return null;
      const cleanCode = String(code).trim().toLowerCase();
      return this.links.find(l => String(l.code).trim().toLowerCase() === cleanCode);
    }

    getById(id) {
      if (!id) return null;
      return this.links.find(l => l.id === id);
    }

    generateCode(length = 6) {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Check collision
      if (this.getByCode(result)) {
        return this.generateCode(length);
      }
      return result;
    }

    async createLink(data) {
      let code = (data.code || '').trim().toLowerCase();
      if (!code) {
        code = this.generateCode(5);
      } else {
        // Validate code alphanumeric and hyphens only
        code = code.replace(/[^a-z0-9-_]/g, '');
        const existing = this.getByCode(code);
        if (existing) {
          throw new Error(`รหัสย่อ "${code}" นี้ถูกใช้งานไปแล้ว กรุณาเลือกรหัสอื่น`);
        }
      }

      let targetUrl = (data.targetUrl || '').trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      const newLink = {
        id: 'lnk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        code: code,
        title: (data.title || 'ลิงก์ย่อ ' + code).trim(),
        targetUrl: targetUrl,
        clicks: 0,
        category: (data.category || 'ทั่วไป').trim(),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: data.createdBy || 'ผู้ดูแลระบบ',
        notes: (data.notes || '').trim()
      };

      this.links.unshift(newLink);
      this.saveLocalLinks(this.links);
      this.syncToSupabase(newLink).catch(() => {});
      return newLink;
    }

    async updateLink(id, updates) {
      const idx = this.links.findIndex(l => l.id === id);
      if (idx === -1) throw new Error("ไม่พบข้อมูลลิงก์ที่ต้องการแก้ไข");

      const existing = this.links[idx];

      if (updates.code && updates.code !== existing.code) {
        const cleanCode = updates.code.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
        const duplicate = this.links.find(l => l.code === cleanCode && l.id !== id);
        if (duplicate) {
          throw new Error(`รหัสย่อ "${cleanCode}" นี้มีอยู่แล้วในระบบ`);
        }
        updates.code = cleanCode;
      }

      if (updates.targetUrl) {
        let tUrl = updates.targetUrl.trim();
        if (!tUrl.startsWith('http://') && !tUrl.startsWith('https://')) {
          tUrl = 'https://' + tUrl;
        }
        updates.targetUrl = tUrl;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.links[idx] = updated;
      this.saveLocalLinks(this.links);
      this.syncToSupabase(updated).catch(() => {});
      return updated;
    }

    async deleteLink(id) {
      const target = this.getById(id);
      this.links = this.links.filter(l => l.id !== id);
      this.saveLocalLinks(this.links);
      if (target) {
        this.deleteFromSupabase(target).catch(() => {});
      }
      return true;
    }

    async recordClick(code) {
      const link = this.getByCode(code);
      if (!link) return false;

      link.clicks = (link.clicks || 0) + 1;
      link.lastClickedAt = new Date().toISOString();
      this.saveLocalLinks(this.links);

      // Background cloud sync
      this.syncToSupabase(link).catch(() => {});
      return link;
    }

    /**
     * Supabase Cloud Synchronization (ตาราง shortlinks โดยเฉพาะ 100%)
     */
    async initSync() {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb) return;

        const { data, error } = await sb
          .from('shortlinks')
          .select('*')
          .neq('category', 'DriveShare');

        if (!error && Array.isArray(data) && data.length > 0) {
          let hasNew = false;
          data.forEach(linkRow => {
            const code = linkRow.code;
            if (!code) return;

            const linkData = {
              id: linkRow.id || ('lnk_' + code),
              code: code,
              title: linkRow.title || ('ลิงก์ย่อ ' + code),
              targetUrl: linkRow.target_url || '',
              category: linkRow.category || 'Shortlink',
              clicks: Number(linkRow.clicks) || 0,
              isActive: linkRow.is_active !== false,
              createdAt: linkRow.created_at || new Date().toISOString(),
              updatedAt: linkRow.updated_at || new Date().toISOString(),
              createdBy: linkRow.created_by || 'ผู้ดูแลระบบ',
              notes: linkRow.notes || ''
            };

            const localIdx = this.links.findIndex(l => l.id === linkData.id || l.code === linkData.code);
            if (localIdx >= 0) {
              const local = this.links[localIdx];
              if ((linkData.clicks || 0) > (local.clicks || 0) || new Date(linkData.updatedAt) > new Date(local.updatedAt)) {
                this.links[localIdx] = linkData;
                hasNew = true;
              }
            } else {
              this.links.push(linkData);
              hasNew = true;
            }
          });

          if (hasNew) {
            this.saveLocalLinks(this.links);
          }
        }
        this.hasSyncedCloud = true;
      } catch (e) {
        console.warn("[ShortlinkRepo] Supabase initial sync suppressed:", e);
      }
    }

    async syncToSupabase(link) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !link || !link.code) return;

        await sb.from('shortlinks').upsert({
          id: link.id || ('lnk_' + link.code),
          code: link.code,
          title: link.title || ('ลิงก์ย่อ ' + link.code),
          target_url: link.targetUrl,
          category: link.category || 'Shortlink',
          clicks: Number(link.clicks) || 0,
          is_active: link.isActive !== false,
          notes: link.notes || '',
          created_by: link.createdBy || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'code' }).catch(() => {});
      } catch (e) {
        console.warn("[ShortlinkRepo] Cloud sync error:", e);
      }
    }

    async deleteFromSupabase(link) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !link) return;
        await sb.from('shortlinks').delete().eq('code', link.code).catch(() => {});
      } catch (e) {
        console.warn("[ShortlinkRepo] Cloud delete error:", e);
      }
    }
  }

  // Export Singleton
  window.ShortlinkRepo = new ShortlinkRepo();

})(window);
