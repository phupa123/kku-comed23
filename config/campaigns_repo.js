/**
 * =========================================================================
 * PAYMENT CAMPAIGNS CONFIGURATION & HYBRID REPOSITORY (Local + Supabase + Sheets)
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

const COMED_CAMPAIGNS_STORAGE_KEY = 'COMED_PAYMENT_CAMPAIGNS_V2';
const COMED_DELETED_CAMPAIGNS_KEY = 'COMED_DELETED_CAMPAIGNS_V2';

// 1. Initial Default Campaigns Repository
const DEFAULT_COMED_CAMPAIGNS = [
  {
    id: "shirt69",
    code: "SHIRT69",
    title: "ค่าเสื้อสาขาวิชาเอกคอมพิวเตอร์ศึกษา",
    subtitle: "เสื้อกิจกรรม & เสื้อเอกสาขาวิชาคอมพิวเตอร์ศึกษา (COMED KKU 69)",
    category: "เสื้อสาขาวิชาเอก (COMED 69)",
    amount: 390.00,
    currency: "THB",
    deadline: "2026-11-15T23:59:00+07:00",
    deadlineDisplay: "15 พ.ย. 2569 (23:59 น.)",
    bankName: "ธนาคารกสิกรไทย (KPlus)",
    accountNumber: "236-2-47817-3",
    accountName: "น.ส. พิชามญธุ์ สามสี",
    qrType: "auto", // 'auto' (dynamic locked PromptPay slip card) | 'custom' (static image)
    promptpayTarget: "2362478173",
    qrImage: "qr_payment.png",
    bgImage: "", // URL ภาพพื้นหลังแคมเปญ
    bannerImage: "",
    galleryImages: [],
    shirtSizes: [],
    targetMode: "all", // "all" = ทุกคนต้องชำระ (เว้นแต่จะอยู่ใน exemptedStudentIds), "specific" = เฉพาะคนที่เลือกใน eligibleStudentIds
    eligibleStudentIds: [], // รหัสที่ต้องชำระ (ใช้เมื่อ targetMode === "specific")
    exemptedStudentIds: [], // รหัสที่ได้รับการยกเว้น (ไม่ต้องชำระ)
    gasApiUrl: "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec",
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/1tD13_pZ4Vp27V8Z34wL2-Sample/edit",
    status: "open", // 'open' | 'completed' | 'temp_closed' | 'permanently_closed'
    closedReason: "",
    isDefault: true,
    showOnIndex: true,
    createdAt: "2026-10-16T00:00:00Z"
  },
  {
    id: "paimai69",
    code: "PAIMAI69",
    title: "ค่าทำป้ายสาขาวิชาเอก",
    subtitle: "สำหรับนักศึกษาชั้นปีที่ 1 ทั้งหมด 60 คน",
    category: "กิจกรรมชั้นปีที่ 1 (COMED 69)",
    amount: 190.00,
    currency: "THB",
    deadline: "2026-09-04T23:59:00+07:00",
    deadlineDisplay: "4 ก.ย. 2569 (23:59 น.)",
    bankName: "ธนาคารกสิกรไทย (KPlus)",
    accountNumber: "236-2-47817-3",
    accountName: "น.ส. พิชามญธุ์ สามสี",
    qrType: "auto",
    promptpayTarget: "2362478173",
    qrImage: "qr_payment.png",
    bgImage: "",
    bannerImage: "",
    galleryImages: [],
    shirtSizes: [],
    gasApiUrl: "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec",
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/1tD13_pZ4Vp27V8Z34wL2-Sample/edit",
    status: "completed",
    closedReason: "ชำระครบ 60/60 คนเรียบร้อยแล้ว",
    isDefault: false,
    showOnIndex: true,
    createdAt: "2026-08-30T00:00:00Z"
  }
];

// Helper Functions for Campaigns
window.ComedCampaignManager = {
  getDeletedIds: function() {
    try {
      const raw = localStorage.getItem(COMED_DELETED_CAMPAIGNS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) {
      return [];
    }
  },

  getAllCampaigns: function() {
    const deletedIds = this.getDeletedIds();
    try {
      const stored = localStorage.getItem(COMED_CAMPAIGNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(c => !String(c.id).startsWith("system_") && !deletedIds.includes(c.id));
        }
      }
    } catch(e) {}
    return DEFAULT_COMED_CAMPAIGNS.filter(c => !deletedIds.includes(c.id));
  },

  getCampaignById: function(id) {
    const list = this.getAllCampaigns();
    if (!id) return list[0] || DEFAULT_COMED_CAMPAIGNS[0];
    const cleanId = String(id).toLowerCase().trim();
    const found = list.find(c => (
      c.id.toLowerCase() === cleanId || 
      (c.code && c.code.toLowerCase() === cleanId) ||
      c.id.replace(/_/g, '') === cleanId.replace(/_/g, '')
    ));
    return found || list[0] || DEFAULT_COMED_CAMPAIGNS[0];
  },

  saveCampaigns: async function(campaigns) {
    const deletedIds = this.getDeletedIds();
    const filtered = (Array.isArray(campaigns) ? campaigns : []).filter(c => !String(c.id).startsWith("system_") && !deletedIds.includes(c.id));
    localStorage.setItem(COMED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(filtered));
    return await this.syncToSupabase(filtered);
  },

  updateCampaign: async function(updatedCampaign) {
    // If updating a previously deleted campaign, remove from deleted list
    let deletedIds = this.getDeletedIds();
    if (deletedIds.includes(updatedCampaign.id)) {
      deletedIds = deletedIds.filter(id => id !== updatedCampaign.id);
      localStorage.setItem(COMED_DELETED_CAMPAIGNS_KEY, JSON.stringify(deletedIds));
    }

    const list = this.getAllCampaigns();
    const idx = list.findIndex(c => c.id === updatedCampaign.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedCampaign };
    } else {
      list.unshift(updatedCampaign);
    }
    return await this.saveCampaigns(list);
  },

  deleteCampaign: async function(id) {
    if (!id) return;
    // 1. Add to permanent deleted list
    const deletedIds = this.getDeletedIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(COMED_DELETED_CAMPAIGNS_KEY, JSON.stringify(deletedIds));
    }

    // 2. Remove from active stored list
    let list = this.getAllCampaigns();
    list = list.filter(c => c.id !== id);
    localStorage.setItem(COMED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(list));

    // 3. Delete from Supabase and await completion
    await this.deleteFromSupabase(id);
  },

  deleteFromSupabase: async function(id) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb || !id) return;
      const { error } = await sb.from('campaigns').delete().eq('id', id);
      if (error) {
        console.warn("Supabase Delete Campaign Notice:", error);
      }
    } catch(e) {
      console.warn("Supabase Delete Campaign Error (will remain deleted locally):", e);
    }
  },

  // Fetch campaigns from Supabase if available
  fetchFromCloud: async function() {
    const deletedIds = this.getDeletedIds();
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb) {
        const { data, error } = await sb.from('campaigns').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const localList = this.getAllCampaigns();
          const mapped = data
            .filter(item => !String(item.id).startsWith("system_") && !deletedIds.includes(item.id))
            .map(item => {
              const matchedLocal = localList.find(loc => loc.id === item.id) || {};
                let extraMeta = {};
                if (item.closed_reason && item.closed_reason.startsWith('{')) {
                  try { extraMeta = JSON.parse(item.closed_reason); } catch(e) {}
                }
                return {
                  id: item.id,
                  code: item.code,
                  title: item.title,
                  subtitle: item.subtitle || '',
                  category: item.category || 'กิจกรรมสาขา',
                  amount: parseFloat(item.amount) || 0,
                  currency: item.currency || 'THB',
                  deadline: item.deadline,
                  deadlineDisplay: item.deadline_display || '',
                  bankName: item.bank_name || '',
                  accountNumber: item.account_number || '',
                  accountName: item.account_name || '',
                  qrType: extraMeta.qrType || item.qr_type || (item.qr_image && !item.qr_image.includes('qr_payment.png') ? 'custom' : 'auto'),
                  promptpayTarget: extraMeta.promptpayTarget || item.promptpay_target || (item.account_number || '').replace(/[^0-9]/g, ''),
                  qrImage: item.qr_image || 'qr_payment.png',
                  bgImage: extraMeta.bgImage || item.bg_image || '',
                  bannerImage: extraMeta.bannerImage || item.banner_image || '',
                  galleryImages: extraMeta.galleryImages || item.gallery_images || [],
                  shirtSizes: extraMeta.shirtSizes !== undefined ? extraMeta.shirtSizes : (item.shirt_sizes !== undefined ? item.shirt_sizes : []),
                  customAmounts: extraMeta.customAmounts || matchedLocal.customAmounts || {},
                  displayConfig: extraMeta.displayConfig || matchedLocal.displayConfig || { showBanner: true, showDetails: true, showOptionsSelector: true },
                  selectableOptions: extraMeta.selectableOptions !== undefined ? extraMeta.selectableOptions : (matchedLocal.selectableOptions || []),
                  targetMode: extraMeta.targetMode || item.target_mode || 'all',
                  eligibleStudentIds: extraMeta.eligibleStudentIds !== undefined ? extraMeta.eligibleStudentIds : (item.eligible_student_ids || matchedLocal.eligibleStudentIds || []),
                  exemptedStudentIds: extraMeta.exemptedStudentIds !== undefined ? extraMeta.exemptedStudentIds : (item.exempted_student_ids || matchedLocal.exemptedStudentIds || []),
                  status: item.status || 'open',
                  closedReason: item.closed_reason || '',
                  isDefault: item.is_default || false,
                  slipProvider: extraMeta.slipProvider || matchedLocal.slipProvider || 'catbox',
                  slipProviders: extraMeta.slipProviders || matchedLocal.slipProviders || ['catbox', 'imgbb', 'cloudinary'],
                  createdAt: item.created_at
                };
              });
          localStorage.setItem(COMED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch(e) {
      console.warn("Supabase Campaign Sync Error:", e);
    }
    return this.getAllCampaigns();
  },

  // Helper: ตรวจสอบว่านักศึกษาคนนี้ต้องชำระในแคมเปญนี้หรือไม่
  getStudentDueAmount: function(campaign, studentId) {
    if (!campaign) return 0;
    const defaultAmount = Number(campaign.amount || 0);
    if (!studentId) return defaultAmount;
    const cleanId = String(studentId).trim();
    const cleanIdNoDash = cleanId.replace(/-/g, '');

    if (campaign.customAmounts && typeof campaign.customAmounts === 'object') {
      if (campaign.customAmounts[cleanId] !== undefined) {
        const customVal = parseFloat(campaign.customAmounts[cleanId]);
        if (!isNaN(customVal)) return customVal;
      }
      if (campaign.customAmounts[cleanIdNoDash] !== undefined) {
        const customVal = parseFloat(campaign.customAmounts[cleanIdNoDash]);
        if (!isNaN(customVal)) return customVal;
      }
    }
    return defaultAmount;
  },

  isStudentEligible: function(campaign, studentId) {
    if (!campaign || !studentId) return true;
    const cleanId = String(studentId).trim();
    const cleanIdNoDash = cleanId.replace(/-/g, '');

    const exempted = Array.isArray(campaign.exemptedStudentIds) ? campaign.exemptedStudentIds : [];
    const isExempted = exempted.some(id => id === cleanId || id.replace(/-/g, '') === cleanIdNoDash);
    if (isExempted) return false;

    if (campaign.targetMode === 'specific') {
      const eligible = Array.isArray(campaign.eligibleStudentIds) ? campaign.eligibleStudentIds : [];
      return eligible.some(id => id === cleanId || id.replace(/-/g, '') === cleanIdNoDash);
    }

    return true; // default: all
  },

  // Sync single or all campaigns to Supabase
  syncToSupabase: async function(campaigns) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) {
        console.warn("Supabase client not initialized - campaign changes saved locally only");
        return { success: false, error: "Supabase client not available" };
      }
      const list = Array.isArray(campaigns) ? campaigns : [campaigns];
      let hasError = false;
      let lastErrorMessage = '';

      for (const c of list) {
        try {
          // Parse deadline safely: never throw RangeError on empty/invalid dates
          let validDeadlineIso = null;
          if (c.deadline) {
            try {
              const d = new Date(c.deadline);
              if (!isNaN(d.getTime())) {
                validDeadlineIso = d.toISOString();
              }
            } catch(e) {}
          }

          const payload = {
            id: c.id,
            code: c.code || c.id.toUpperCase(),
            title: c.title,
            subtitle: c.subtitle || '',
            category: c.category || 'กิจกรรม',
            amount: c.amount,
            currency: c.currency || 'THB',
            deadline: validDeadlineIso,
            deadline_display: c.deadlineDisplay || '',
            bank_name: c.bankName || '',
            account_number: c.accountNumber || '',
            account_name: c.accountName || '',
            qr_image: c.qrImage || 'qr_payment.png',
            status: c.status || 'open',
            closed_reason: c.closedReason || '',
            is_default: !!c.isDefault,
            updated_at: new Date().toISOString()
          };

          // Pack extra metadata safely into closed_reason so it syncs across devices even if DB lacks dedicated columns
          let metaClosedReason = c.closedReason || '';
          try {
            const parsedMeta = metaClosedReason && metaClosedReason.startsWith('{') ? JSON.parse(metaClosedReason) : {};
            if (c.exemptedStudentIds !== undefined) parsedMeta.exemptedStudentIds = c.exemptedStudentIds;
            if (c.eligibleStudentIds !== undefined) parsedMeta.eligibleStudentIds = c.eligibleStudentIds;
            if (c.targetMode !== undefined) parsedMeta.targetMode = c.targetMode;
            if (c.shirtSizes !== undefined) parsedMeta.shirtSizes = c.shirtSizes;
            if (c.qrType !== undefined) parsedMeta.qrType = c.qrType;
            if (c.promptpayTarget !== undefined) parsedMeta.promptpayTarget = c.promptpayTarget;
            if (c.bgImage !== undefined) parsedMeta.bgImage = c.bgImage;
            if (c.bannerImage !== undefined) parsedMeta.bannerImage = c.bannerImage;
            if (c.galleryImages !== undefined) parsedMeta.galleryImages = c.galleryImages;
            if (c.customAmounts !== undefined) parsedMeta.customAmounts = c.customAmounts;
            if (c.displayConfig !== undefined) parsedMeta.displayConfig = c.displayConfig;
            if (c.selectableOptions !== undefined) parsedMeta.selectableOptions = c.selectableOptions;
            if (c.slipProvider !== undefined) parsedMeta.slipProvider = c.slipProvider;
            if (c.slipProviders !== undefined) parsedMeta.slipProviders = c.slipProviders;
            metaClosedReason = JSON.stringify(parsedMeta);
          } catch(e) {}

          payload.closed_reason = metaClosedReason;
          c.closedReason = metaClosedReason;

          // Attempt upsert with core columns
          const { error: upsertErr } = await sb.from('campaigns').upsert(payload, { onConflict: 'id' });
          if (upsertErr) {
            hasError = true;
            lastErrorMessage = upsertErr.message || String(upsertErr);
            console.error(`Supabase upsert campaign error (${c.id}):`, lastErrorMessage);
          }
        } catch (innerErr) {
          hasError = true;
          lastErrorMessage = innerErr.message || String(innerErr);
          console.warn("Supabase upsert campaign exception:", innerErr);
        }
      }

      // Re-save list to localStorage so closedReason is preserved with latest JSON
      const deletedIds = this.getDeletedIds();
      const currentFiltered = this.getAllCampaigns().filter(c => !String(c.id).startsWith("system_") && !deletedIds.includes(c.id));
      localStorage.setItem(COMED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(currentFiltered));

      return { success: !hasError, error: lastErrorMessage || null };
    } catch(e) {
      console.warn("syncToSupabase error:", e);
      return { success: false, error: e.message || String(e) };
    }
  }
};
