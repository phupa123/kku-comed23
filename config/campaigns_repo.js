/**
 * =========================================================================
 * PAYMENT CAMPAIGNS CONFIGURATION & HYBRID REPOSITORY (Local + Supabase + Sheets)
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

const COMED_CAMPAIGNS_STORAGE_KEY = 'COMED_PAYMENT_CAMPAIGNS_V2';

// 1. Initial Default Campaigns Repository
const DEFAULT_COMED_CAMPAIGNS = [
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
    qrImage: "qr_payment.png",
    
    gasApiUrl: "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec",
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/1tD13_pZ4Vp27V8Z34wL2-Sample/edit",
    
    status: "completed", // 'open' | 'completed' | 'temp_closed' | 'permanently_closed'
    closedReason: "ชำระครบ 60/60 คนเรียบร้อยแล้ว",
    isDefault: true,
    showOnIndex: true,
    createdAt: "2026-08-30T00:00:00Z"
  }
];

// Helper Functions for Campaigns
window.ComedCampaignManager = {
  getAllCampaigns: function() {
    try {
      const stored = localStorage.getItem(COMED_CAMPAIGNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(c => !String(c.id).startsWith("system_"));
        }
      }
    } catch(e) {}
    return DEFAULT_COMED_CAMPAIGNS;
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

  saveCampaigns: function(campaigns) {
    const filtered = (Array.isArray(campaigns) ? campaigns : []).filter(c => !String(c.id).startsWith("system_"));
    localStorage.setItem(COMED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(filtered));
    this.syncToSupabase(filtered);
  },

  updateCampaign: function(updatedCampaign) {
    const list = this.getAllCampaigns();
    const idx = list.findIndex(c => c.id === updatedCampaign.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedCampaign };
    } else {
      list.unshift(updatedCampaign);
    }
    this.saveCampaigns(list);
  },

  deleteCampaign: function(id) {
    let list = this.getAllCampaigns();
    list = list.filter(c => c.id !== id);
    this.saveCampaigns(list);
    this.deleteFromSupabase(id);
  },

  deleteFromSupabase: async function(id) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb || !id) return;
      await sb.from('campaigns').delete().eq('id', id);
    } catch(e) {
      console.warn("Supabase Delete Campaign Error (will remain deleted locally):", e);
    }
  },

  // Fetch campaigns from Supabase if available
  fetchFromCloud: async function() {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb) {
        const { data, error } = await sb.from('campaigns').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const localList = this.getAllCampaigns();
          const mapped = data
            .filter(item => !String(item.id).startsWith("system_"))
            .map(item => {
              const matchedLocal = localList.find(loc => loc.id === item.id) || {};
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
                qrImage: item.qr_image || 'qr_payment.png',
                status: item.status || 'open',
                closedReason: item.closed_reason || '',
                isDefault: item.is_default || false,
                slipProvider: matchedLocal.slipProvider || 'cloudinary',
                slipProviders: matchedLocal.slipProviders || ['cloudinary'],
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

  // Sync single or all campaigns to Supabase
  syncToSupabase: async function(campaigns) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;
      const list = Array.isArray(campaigns) ? campaigns : [campaigns];
      for (const c of list) {
        try {
          await sb.from('campaigns').upsert({
            id: c.id,
            code: c.code || c.id.toUpperCase(),
            title: c.title,
            subtitle: c.subtitle || '',
            category: c.category || 'กิจกรรม',
            amount: c.amount,
            currency: c.currency || 'THB',
            deadline: c.deadline ? new Date(c.deadline).toISOString() : null,
            deadline_display: c.deadlineDisplay || '',
            bank_name: c.bankName || '',
            account_number: c.accountNumber || '',
            account_name: c.accountName || '',
            qr_image: c.qrImage || 'qr_payment.png',
            status: c.status || 'open',
            closed_reason: c.closedReason || '',
            is_default: !!c.isDefault,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (innerErr) {
          console.warn(`Supabase Upsert skipped for campaign ${c.id}:`, innerErr);
        }
      }
    } catch(e) {
      console.warn("Supabase Upsert Campaign Error:", e);
    }
  }
};
