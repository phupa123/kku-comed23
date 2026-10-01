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
        passwordHash: data.passwordHash || (data.password ? this.hashPassword(data.password) : null),
        expiresAt: data.expiresAt || null,
        clickStats: data.clickStats || { devices: {}, browsers: {}, referrers: {}, daily: {} },
        qrSettings: data.qrSettings || {
          colorDark: '#ea580c',
          colorLight: '#ffffff',
          logoEnabled: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: data.createdBy || 'ผู้ดูแลระบบ',
        notes: (data.notes || '').trim()
      };

      this.links.unshift(newLink);
      this.saveLocalLinks(this.links);
      try {
        await this.syncToSupabase(newLink);
      } catch (err) {
        console.warn("[ShortlinkRepo] Warning: Initial cloud sync deferred:", err);
      }
      return newLink;
    }

    // Password helper (Simple fast hash + salt for frontend obfuscation)
    hashPassword(pw) {
      if (!pw) return null;
      let hash = 0;
      const str = 'comed69_' + String(pw).trim();
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'pw_' + Math.abs(hash).toString(16);
    }

    verifyPassword(link, inputPw) {
      if (!link || !link.passwordHash) return true;
      if (!inputPw) return false;
      const testHash = this.hashPassword(inputPw);
      return link.passwordHash === testHash;
    }

    isExpired(link) {
      if (!link || !link.expiresAt) return false;
      return new Date(link.expiresAt) < new Date();
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

      if (updates.password !== undefined) {
        if (updates.password === '') {
          updates.passwordHash = null;
        } else {
          updates.passwordHash = this.hashPassword(updates.password);
        }
        delete updates.password;
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

    async recordClick(code, clientMeta = {}) {
      const link = this.getByCode(code);
      if (!link) return false;

      link.clicks = (link.clicks || 0) + 1;
      link.lastClickedAt = new Date().toISOString();

      // Deep Analytics Breakdown
      if (!link.clickStats) {
        link.clickStats = { devices: {}, browsers: {}, referrers: {}, daily: {} };
      }

      const device = clientMeta.device || this.detectDevice();
      const browser = clientMeta.browser || this.detectBrowser();
      const referrer = clientMeta.referrer || (document.referrer ? new URL(document.referrer).hostname : 'Direct / App');
      const today = new Date().toISOString().split('T')[0];

      link.clickStats.devices = link.clickStats.devices || {};
      link.clickStats.devices[device] = (link.clickStats.devices[device] || 0) + 1;

      link.clickStats.browsers = link.clickStats.browsers || {};
      link.clickStats.browsers[browser] = (link.clickStats.browsers[browser] || 0) + 1;

      link.clickStats.referrers = link.clickStats.referrers || {};
      link.clickStats.referrers[referrer] = (link.clickStats.referrers[referrer] || 0) + 1;

      link.clickStats.daily = link.clickStats.daily || {};
      link.clickStats.daily[today] = (link.clickStats.daily[today] || 0) + 1;

      this.saveLocalLinks(this.links);

      // Background cloud sync
      this.syncToSupabase(link).catch(() => {});
      return link;
    }

    detectDevice() {
      const ua = navigator.userAgent || '';
      if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
      if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)) return 'Mobile';
      return 'Desktop';
    }

    detectBrowser() {
      const ua = navigator.userAgent || '';
      if (ua.includes('Edg/')) return 'Edge';
      if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
      if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
      if (ua.includes('Firefox/')) return 'Firefox';
      if (ua.includes('Line/')) return 'LINE in-app';
      return 'Other';
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
              passwordHash: linkRow.password_hash || null,
              expiresAt: linkRow.expires_at || null,
              clickStats: linkRow.click_stats || { devices: {}, browsers: {}, referrers: {}, daily: {} },
              qrSettings: linkRow.qr_settings || { colorDark: '#ea580c', colorLight: '#ffffff', logoEnabled: true },
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
        } else if (!error && Array.isArray(data) && data.length === 0) {
          // ตารางใน Supabase ยังว่างเปล่า -> ทำการ Seed ลิงก์เริ่มต้นขึ้น Supabase ทันที
          console.log("[ShortlinkRepo] Supabase shortlinks table is empty. Seeding defaults...");
          for (const item of this.links) {
            await this.syncToSupabase(item);
          }
        }
        this.hasSyncedCloud = true;
      } catch (e) {
        console.warn("[ShortlinkRepo] Supabase initial sync suppressed:", e);
      }
    }

    /**
     * Report, Suspension, and Appeal Core Engine
     */
    getReportsStorageKey() {
      return 'COMED_SHORTLINK_REPORTS_V1';
    }

    getAppealsStorageKey() {
      return 'COMED_SHORTLINK_APPEALS_V1';
    }

    getAllReports() {
      try {
        const raw = localStorage.getItem(this.getReportsStorageKey());
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    async submitReport(code, reportData = {}) {
      const link = this.getByCode(code);
      const reports = this.getAllReports();
      const newReport = {
        id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        code: code,
        linkId: link ? link.id : null,
        title: link ? link.title : 'ลิงก์ /s/' + code,
        targetUrl: link ? link.targetUrl : '',
        topic: reportData.topic || 'เนื้อหาไม่ปลอดภัย / หลอกลวง (Phishing/Scam)',
        details: reportData.details || '',
        reporterEmail: reportData.reporterEmail || 'guest',
        reporterContact: reportData.reporterContact || '',
        status: 'pending', // pending, reviewed, actioned, dismissed
        createdAt: new Date().toISOString()
      };
      reports.unshift(newReport);
      localStorage.setItem(this.getReportsStorageKey(), JSON.stringify(reports));

      // Attempt sync to Supabase table 'shortlink_reports' if available
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (sb) {
          await sb.from('shortlink_reports').insert({
            id: newReport.id,
            code: newReport.code,
            topic: newReport.topic,
            details: newReport.details,
            reporter_contact: newReport.reporterContact,
            status: newReport.status,
            created_at: newReport.createdAt
          });
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Supabase report insert fallback:", e);
      }
      return newReport;
    }

    async updateReportStatus(reportId, status, resolution = '') {
      const reports = this.getAllReports();
      const idx = reports.findIndex(r => r.id === reportId);
      if (idx !== -1) {
        reports[idx].status = status;
        reports[idx].resolution = resolution;
        reports[idx].resolvedAt = new Date().toISOString();
        localStorage.setItem(this.getReportsStorageKey(), JSON.stringify(reports));
      }
      return true;
    }

    getAllAppeals() {
      try {
        const raw = localStorage.getItem(this.getAppealsStorageKey());
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    async submitAppeal(data = {}) {
      const appeals = this.getAllAppeals();
      const newAppeal = {
        id: 'apl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        code: data.code || '',
        targetUrl: data.targetUrl || '',
        userEmail: data.userEmail || '',
        applicantName: data.applicantName || 'ผู้ขอปลดระงับ',
        applicantContact: data.applicantContact || '',
        reason: data.reason || '',
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString()
      };
      appeals.unshift(newAppeal);
      localStorage.setItem(this.getAppealsStorageKey(), JSON.stringify(appeals));

      // Try Supabase if table exists
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (sb) {
          await sb.from('shortlink_appeals').insert({
            id: newAppeal.id,
            code: newAppeal.code,
            user_email: newAppeal.userEmail,
            applicant_name: newAppeal.applicantName,
            applicant_contact: newAppeal.applicantContact,
            reason: newAppeal.reason,
            status: newAppeal.status,
            created_at: newAppeal.createdAt
          });
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Supabase appeal insert fallback:", e);
      }
      return newAppeal;
    }

    async updateAppealStatus(appealId, status, note = '') {
      const appeals = this.getAllAppeals();
      const idx = appeals.findIndex(a => a.id === appealId);
      if (idx !== -1) {
        appeals[idx].status = status;
        appeals[idx].adminNote = note;
        appeals[idx].reviewedAt = new Date().toISOString();
        localStorage.setItem(this.getAppealsStorageKey(), JSON.stringify(appeals));

        // If approved, lift suspension on corresponding link
        if (status === 'approved' && appeals[idx].code) {
          const link = this.getByCode(appeals[idx].code);
          if (link) {
            await this.updateLink(link.id, {
              isSuspended: false,
              suspendReason: null,
              suspendedUntil: null
            });
          }
        }
      }
      return true;
    }

    // Check if link or domain is suspended
    checkSuspension(link) {
      if (!link) return { suspended: false };

      if (link.isSuspended) {
        // Check if temporary ban has expired
        if (link.suspendedUntil) {
          const expiry = new Date(link.suspendedUntil);
          if (new Date() > expiry) {
            // Auto unban
            link.isSuspended = false;
            this.saveLocalLinks(this.links);
            return { suspended: false };
          }
        }
        return {
          suspended: true,
          reason: link.suspendReason || 'ลิงก์นี้ถูกระงับการใช้งานเนื่องจากละเมิดนโยบายความปลอดภัย',
          until: link.suspendedUntil || null,
          scope: link.suspendScope || 'link',
          code: link.code,
          createdBy: link.createdBy
        };
      }
      return { suspended: false };
    }

    // Claim guest links when a user logs in
    claimGuestLinks(userEmail, userName = '') {
      if (!userEmail) return 0;
      let count = 0;
      try {
        const guestIdsRaw = localStorage.getItem('COMED_GUEST_SHORTLINK_IDS');
        let guestIds = guestIdsRaw ? JSON.parse(guestIdsRaw) : [];
        if (Array.isArray(guestIds) && guestIds.length > 0) {
          this.links.forEach(l => {
            if (guestIds.includes(l.id) && (!l.createdBy || l.createdBy === 'ผู้ดูแลระบบ' || l.createdBy === 'guest' || l.createdBy.includes('ทั่วไป'))) {
              l.createdBy = userEmail;
              l.creatorName = userName || userEmail;
              count++;
            }
          });
          if (count > 0) {
            this.saveLocalLinks(this.links);
            localStorage.removeItem('COMED_GUEST_SHORTLINK_IDS');
          }
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Error claiming guest links:", e);
      }
      return count;
    }

    async syncToSupabase(link) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !link || !link.code) return;

        const { data, error } = await sb.from('shortlinks').upsert({
          id: link.id || ('lnk_' + link.code),
          code: link.code,
          title: link.title || ('ลิงก์ย่อ ' + link.code),
          target_url: link.targetUrl,
          category: link.category || 'Shortlink',
          clicks: Number(link.clicks) || 0,
          is_active: link.isActive !== false,
          password_hash: link.passwordHash || null,
          expires_at: link.expiresAt || null,
          click_stats: link.clickStats || { devices: {}, browsers: {}, referrers: {}, daily: {} },
          qr_settings: link.qrSettings || {},
          notes: link.notes || '',
          created_by: link.createdBy || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'code' });

        if (error) {
          console.error("[ShortlinkRepo] Error upserting to Supabase:", error);
          throw error;
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Cloud sync error:", e);
        throw e;
      }
    }

    async deleteFromSupabase(link) {
      try {
        const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
        if (!sb || !link) return;
        const { error } = await sb.from('shortlinks').delete().eq('code', link.code);
        if (error) {
          console.error("[ShortlinkRepo] Error deleting from Supabase:", error);
          throw error;
        }
      } catch (e) {
        console.warn("[ShortlinkRepo] Cloud delete error:", e);
        throw e;
      }
    }
  }

  // Export Singleton
  window.ShortlinkRepo = new ShortlinkRepo();

})(window);
