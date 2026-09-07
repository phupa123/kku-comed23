/**
 * =========================================================================
 * MASTER ADMIN HUB LOGIC - assets/js/admin-hub.js
 * COMED KKU 69 CENTRAL MANAGEMENT CONSOLE
 * =========================================================================
 */

const ADMIN_SESSION_KEY = 'COMED_KKU69_ADMIN_LOGGED_USER';
const ADMIN_ACCOUNTS_KEY = 'COMED_KKU69_ADMIN_ACCOUNTS_V2';
const ADMIN_LOGS_KEY = 'COMED_KKU69_ADMIN_LOGS_V2';
const ISSUES_KEY = 'COMED_KKU69_ISSUES_V2';
const STORAGE_KEY = 'COMED_KKU69_PAYMENT_DATA_V1';

const GOOGLE_CLIENT_ID = "799199144896-9tft22kns4jjv40lk19oul9dp1mprmb4.apps.googleusercontent.com";

const DEFAULT_ADMINS = [
  { email: 'thitiwut.a@kkumail.com', name: 'ธิติวุฒิ อารีเอื้อ (ภูผา)', password: 'Phupa#69ComEd', hash: '59de3e916100d7316a353db05617c31de97697ec474e47be6af4168e5ae55e47', role: 'Super Admin' },
  { email: 'pichamon.sam@kkumail.com', name: 'พิชามญธุ์ สามสี (หมูหวาน)', password: 'MooWan#69ComEd', hash: '41d0b334f78c302fb30d6b73041fec5aeaf78982ce6d90ef30113cde7974399a', role: 'Admin' },
  { email: 'nattachai.p@kkumail.com', name: 'ณัฏฐชัย โพธิ์ทับไทย (โอ้)', password: 'OhNatta#69ComEd', hash: 'd6dbff479a49739cc1d20ad7704993174f5f9f7fb34f1bc756f4d7afb9017e45', role: 'Admin' }
];

let adminAccounts = [];
try {
  const stored = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
  adminAccounts = stored ? JSON.parse(stored) : DEFAULT_ADMINS;
} catch (e) {
  adminAccounts = DEFAULT_ADMINS;
}

let currentLoggedInAdmin = null;

// SHA-256 for browser password hashing
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
}

function ensureGoogleInitialized() {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleAdminCredential,
      auto_select: false,
      cancel_on_tap_outside: false
    });
    return true;
  }
  return false;
}

async function handleGoogleAdminCredential(response) {
  const data = parseJwt(response.credential);
  const errBox = document.getElementById('loginErrorMsg');
  const errText = document.getElementById('loginErrorText');

  if (!data || !data.email) {
    if (errBox && errText) {
      errText.textContent = "ไม่สามารถอ่านข้อมูลบัญชี Google ได้";
      errBox.classList.remove('hidden');
    }
    return;
  }

  const email = data.email.toLowerCase().trim();
  const admin = adminAccounts.find(a => a.email.toLowerCase() === email);

  if (admin) {
    currentLoggedInAdmin = admin;
    sessionStorage.setItem(ADMIN_SESSION_KEY, admin.email);
    showDashboard();
  } else {
    if (errBox && errText) {
      errText.textContent = `บัญชี "${email}" ไม่มีสิทธิ์ผู้ดูแลระบบในระบบนี้`;
      errBox.classList.remove('hidden');
    }
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchLoginMode(mode) {
  const tabGoogle = document.getElementById('tabModeGoogle');
  const tabPassword = document.getElementById('tabModePassword');
  const viewGoogle = document.getElementById('viewModeGoogle');
  const viewPassword = document.getElementById('viewModePassword');
  const errBox = document.getElementById('loginErrorMsg');
  if (errBox) errBox.classList.add('hidden');

  if (mode === 'google') {
    if (tabGoogle) tabGoogle.className = 'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md cursor-pointer';
    if (tabPassword) tabPassword.className = 'py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer';
    if (viewGoogle) viewGoogle.classList.remove('hidden');
    if (viewPassword) viewPassword.classList.add('hidden');
    if (ensureGoogleInitialized()) {
      google.accounts.id.prompt();
    }
  } else {
    if (tabGoogle) tabGoogle.className = 'py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer';
    if (tabPassword) tabPassword.className = 'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md cursor-pointer';
    if (viewGoogle) viewGoogle.classList.add('hidden');
    if (viewPassword) viewPassword.classList.remove('hidden');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const errBox = document.getElementById('loginErrorMsg');
  const errText = document.getElementById('loginErrorText');
  if (errBox) errBox.classList.add('hidden');

  const emailInput = document.getElementById('adminEmailInput')?.value.trim().toLowerCase() || '';
  const pwdInput = document.getElementById('adminPasswordInput')?.value.trim() || '';

  let admin = adminAccounts.find(a => a.email.toLowerCase() === emailInput) || DEFAULT_ADMINS.find(a => a.email.toLowerCase() === emailInput);
  let isValid = false;

  if (admin) {
    if (admin.password && admin.password === pwdInput) {
      isValid = true;
    } else if (admin.hash) {
      const inputHash = await sha256(emailInput + ':' + pwdInput);
      if (inputHash === admin.hash) isValid = true;
    }
  }

  if (isValid && admin) {
    currentLoggedInAdmin = admin;
    sessionStorage.setItem(ADMIN_SESSION_KEY, admin.email);
    showDashboard();
  } else {
    if (errBox && errText) {
      errBox.classList.remove('hidden');
      errText.textContent = "อีเมล หรือ รหัสผ่านแอดมินไม่ถูกต้อง";
    }
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleAdminLogout() {
  if (confirm("ต้องการออกจากระบบแอดมินส่วนกลางหรือไม่?")) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
  }
}

function showDashboard() {
  const login = document.getElementById('loginScreen');
  const dash = document.getElementById('adminDashboard');
  if (login) login.classList.add('hidden');
  if (dash) dash.classList.remove('hidden');

  const nameEl = document.getElementById('currentAdminName');
  const roleEl = document.getElementById('currentAdminRole');
  const emailEl = document.getElementById('currentAdminEmail');

  if (currentLoggedInAdmin) {
    if (nameEl) nameEl.textContent = currentLoggedInAdmin.name;
    if (roleEl) roleEl.textContent = currentLoggedInAdmin.role || 'Admin';
    if (emailEl) emailEl.textContent = currentLoggedInAdmin.email;
  }

  loadHubOverviewStats();
  updateMaintenanceStatusBadge();
  updateLivePageBadges();

  if (typeof gsap !== 'undefined') {
    gsap.fromTo("header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
    gsap.fromTo(".hub-card-anim", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function loadHubOverviewStats() {
  // 1. Payment Stats
  let payments = {};
  try {
    const p = localStorage.getItem(STORAGE_KEY);
    if (p) payments = JSON.parse(p);
  } catch(e) {}

  const totalStudents = (window.STUDENTS_DATA || []).length || 60;
  const paidCount = Object.keys(payments).filter(k => payments[k] && payments[k].paid).length;
  const totalMoney = paidCount * 190;
  const targetMoney = totalStudents * 190;
  const percent = Math.round((paidCount / totalStudents) * 100);

  const pCountEl = document.getElementById('hubStatPaidCount');
  const pMoneyEl = document.getElementById('hubStatTotalMoney');
  const pPercentEl = document.getElementById('hubStatPercent');
  const pProgressEl = document.getElementById('hubStatProgress');

  if (pCountEl) pCountEl.textContent = `${paidCount} / ${totalStudents} คน`;
  if (pMoneyEl) pMoneyEl.textContent = `฿${totalMoney.toLocaleString()}`;
  if (pPercentEl) pPercentEl.textContent = `${percent}%`;
  if (pProgressEl) pProgressEl.style.width = `${percent}%`;

  // 2. Issue Desk Stats
  let issues = [];
  try {
    const iss = localStorage.getItem(ISSUES_KEY);
    if (iss) issues = JSON.parse(iss);
  } catch(e) {}

  const pendingIssues = issues.filter(i => i.status !== 'แก้ไขแล้ว').length;
  const issueCountEl = document.getElementById('hubStatPendingIssues');
  const issueTotalEl = document.getElementById('hubStatTotalIssues');

  if (issueCountEl) issueCountEl.textContent = `${pendingIssues} รายการ`;
  if (issueTotalEl) issueTotalEl.textContent = `(ทั้งหมด ${issues.length} เรื่อง)`;

  // 3. Admin Accounts
  const adminCountEl = document.getElementById('hubStatAdminCount');
  if (adminCountEl) adminCountEl.textContent = `${adminAccounts.length} บัญชี`;

  // 4. Activity Logs
  let logs = [];
  try {
    const l = localStorage.getItem(ADMIN_LOGS_KEY);
    if (l) logs = JSON.parse(l);
  } catch(e) {}

  const logCountEl = document.getElementById('hubStatLogCount');
  if (logCountEl) logCountEl.textContent = `${logs.length} บันทึก`;

  renderRecentLogs(logs.slice(0, 5));
}

function renderRecentLogs(logs) {
  const container = document.getElementById('hubRecentLogsContainer');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs font-bold">ยังไม่มีประวัติกิจกรรมล่าสุด</div>`;
    return;
  }

  container.innerHTML = logs.map(l => `
    <div class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-black text-xs">
          <i data-lucide="activity" class="w-4 h-4"></i>
        </div>
        <div>
          <span class="font-bold text-white block">${l.action || 'Activity'}</span>
          <span class="text-[11px] text-slate-400 font-mono">${l.adminEmail || '-'} • ${l.detail || ''}</span>
        </div>
      </div>
      <span class="text-[11px] font-mono text-slate-500">${l.timestamp || '-'}</span>
    </div>
  `).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initGoogleButton() {
  try {
    if (ensureGoogleInitialized()) {
      const wrapper = document.getElementById('googleAdminButtonWrapper');
      if (wrapper) {
        google.accounts.id.renderButton(
          wrapper,
          { theme: "filled_blue", size: "large", width: 280, text: "signin_with", shape: "pill" }
        );
      }
      setTimeout(() => google.accounts.id.prompt(), 400);
    } else {
      setTimeout(initGoogleButton, 300);
    }
  } catch(e) {
    console.warn("Google Admin Init Error", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loggedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (loggedEmail) {
    currentLoggedInAdmin = adminAccounts.find(a => a.email.toLowerCase() === loggedEmail.toLowerCase()) || { email: loggedEmail, name: "Admin", role: "Admin" };
    showDashboard();
  } else {
    initGoogleButton();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
});



// ================= SITE MAINTENANCE & ACCESS CONTROLLER =================
const MAINT_CONFIG_KEY = "COMED_MAINTENANCE_CONFIG_V1";

const DEFAULT_MAINT_CONFIG = {
  all: { active: false, title: "กำลังปิดปรับปรุงระบบชั่วคราว", reason: "ระบบกำลังอยู่ระหว่างการปรับปรุงและอัปเกรดฐานข้อมูลเพื่อเพิ่มความเสถียรและความปลอดภัย", endTime: "" },
  index: { active: false, title: "หน้าหลักกำลังปรับปรุงชั่วคราว", reason: "กำลังอัปเดตข้อมูลและระบบสารสนเทศของสาขาวิชา", endTime: "" },
  payment: { active: false, title: "ระบบรับชำระเงินปิดปรับปรุงชั่วคราว", reason: "ระบบการเงินกำลังอยู่ระหว่างการสรุปยอดและบำรุงรักษาระบบ", endTime: "" }
};

function getMaintenanceConfig() {
  try {
    const s = localStorage.getItem(MAINT_CONFIG_KEY);
    return s ? { ...DEFAULT_MAINT_CONFIG, ...JSON.parse(s) } : DEFAULT_MAINT_CONFIG;
  } catch(e) {
    return DEFAULT_MAINT_CONFIG;
  }
}

function openMaintenanceModal() {
  loadMaintenanceFormByScope();
  const modal = document.getElementById("modalMaintenanceSettings");
  if (modal) modal.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function closeMaintenanceModal() {
  const modal = document.getElementById("modalMaintenanceSettings");
  if (modal) modal.classList.add("hidden");
}

function loadMaintenanceFormByScope() {
  const scope = document.getElementById("maintTargetScope")?.value || "all";
  const cfg = getMaintenanceConfig();
  const item = cfg[scope] || cfg["all"];

  const activeChk = document.getElementById("maintActiveCheckbox");
  const titleIn = document.getElementById("maintTitleInput");
  const reasonIn = document.getElementById("maintReasonInput");
  const endIn = document.getElementById("maintEndTimeInput");

  if (activeChk) activeChk.checked = !!item.active;
  if (titleIn) titleIn.value = item.title || "";
  if (reasonIn) reasonIn.value = item.reason || "";
  if (endIn) endIn.value = item.endTime || "";
}

function saveMaintenanceSettings(e) {
  e.preventDefault();
  const scope = document.getElementById("maintTargetScope")?.value || "all";
  const cfg = getMaintenanceConfig();

  cfg[scope] = {
    active: document.getElementById("maintActiveCheckbox")?.checked || false,
    title: document.getElementById("maintTitleInput")?.value.trim(),
    reason: document.getElementById("maintReasonInput")?.value.trim(),
    endTime: document.getElementById("maintEndTimeInput")?.value || ""
  };

  localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(cfg));
  closeMaintenanceModal();
  updateMaintenanceStatusBadge();
  updateLivePageBadges();
  alert("✨ บันทึกการตั้งค่าเปิด-ปิดปรับปรุงระบบสำเร็จเรียบร้อย!");
}

function updateMaintenanceStatusBadge() {
  const badge = document.getElementById("hubStatMaintenanceStatus");
  if (!badge) return;

  const cfg = getMaintenanceConfig();
  const isAnyActive = cfg.all?.active || cfg.index?.active || cfg.payment?.active;

  if (isAnyActive) {
    badge.textContent = "⚠️ อยู่ในโหมดปิดปรับปรุง";
    badge.className = "text-amber-400 font-bold text-[11px] animate-pulse";
  } else {
    badge.textContent = "เปิดให้บริการปกติ (Online)";
    badge.className = "text-emerald-400 text-[11px]";
  }
}



// ================= LIVE PAGE STATUS CONTROLLERS =================
function updateLivePageBadges() {
  const cfg = getMaintenanceConfig();

  // 1. Index Page
  const isIndexOff = (cfg.all && cfg.all.active) || (cfg.index && cfg.index.active);
  const badgeIndex = document.getElementById("pageBadgeIndex");
  const btnIndex = document.getElementById("btnToggleIndex");
  if (badgeIndex) {
    badgeIndex.className = isIndexOff 
      ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
      : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1";
    badgeIndex.innerHTML = isIndexOff ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ปิดปรับปรุง' : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE';
  }
  if (btnIndex) {
    btnIndex.className = isIndexOff
      ? "px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
      : "px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer";
    btnIndex.textContent = isIndexOff ? "เปิดให้บริการ" : "สั่งปิดปรับปรุงหน้านี้";
  }

  // 2. Payment Page
  const isPaymentOff = (cfg.all && cfg.all.active) || (cfg.payment && cfg.payment.active);
  const badgePayment = document.getElementById("pageBadgePayment");
  const btnPayment = document.getElementById("btnTogglePayment");
  if (badgePayment) {
    badgePayment.className = isPaymentOff
      ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
      : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1";
    badgePayment.innerHTML = isPaymentOff ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ปิดปรับปรุง' : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE';
  }
  if (btnPayment) {
    btnPayment.className = isPaymentOff
      ? "px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
      : "px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer";
    btnPayment.textContent = isPaymentOff ? "เปิดให้บริการ" : "สั่งปิดปรับปรุงหน้านี้";
  }

  // 3. Event Page
  const isEventOff = (cfg.all && cfg.all.active) || (cfg.event && cfg.event.active);
  const badgeEvent = document.getElementById("pageBadgeEvent");
  const btnEvent = document.getElementById("btnToggleEvent");
  if (badgeEvent) {
    badgeEvent.className = isEventOff
      ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
      : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1";
    badgeEvent.innerHTML = isEventOff ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ปิดปรับปรุง' : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE';
  }
  if (btnEvent) {
    btnEvent.className = isEventOff
      ? "px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
      : "px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer";
    btnEvent.textContent = isEventOff ? "เปิดให้บริการ" : "สั่งปิดปรับปรุง";
  }

  // 4. Global All
  const isAllOff = !!(cfg.all && cfg.all.active);
  const badgeAll = document.getElementById("pageBadgeAll");
  const btnAll = document.getElementById("btnToggleAll");
  if (badgeAll) {
    badgeAll.className = isAllOff
      ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
      : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1";
    badgeAll.innerHTML = isAllOff ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ปิดปรับปรุง' : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE';
  }
  if (btnAll) {
    btnAll.className = isAllOff
      ? "px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
      : "px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer";
    btnAll.textContent = isAllOff ? "เปิดทุกหน้า" : "สั่งปิดทั้งเว็บ";
  }
}

function toggleSinglePageLive(scope) {
  const cfg = getMaintenanceConfig();
  if (!cfg[scope]) {
    cfg[scope] = { active: false, title: "กำลังปรับปรุงระบบชั่วคราว", reason: "กำลังอัปเดตระบบเพื่อเพิ่มประสิทธิภาพ", endTime: "" };
  }
  cfg[scope].active = !cfg[scope].active;
  localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(cfg));
  updateMaintenanceStatusBadge();
  updateLivePageBadges();
  syncMaintenanceConfigToCloud(cfg);
  updateLivePageBadges();
}

function toggleAllPagesQuick(shouldLock) {
  const cfg = getMaintenanceConfig();
  if (!cfg.all) cfg.all = {};
  if (!cfg.index) cfg.index = {};
  if (!cfg.payment) cfg.payment = {};
  if (!cfg.event) cfg.event = {};

  cfg.all.active = shouldLock;
  cfg.index.active = shouldLock;
  cfg.payment.active = shouldLock;
  cfg.event.active = shouldLock;

  localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(cfg));
  updateMaintenanceStatusBadge();
  updateLivePageBadges();
  syncMaintenanceConfigToCloud(cfg);
  updateLivePageBadges();
}


function syncMaintenanceConfigToCloud(cfg) {
  // 1. Instant Realtime Push to Supabase Cloud
  try {
    const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (sb) {
      sb.from('campaigns').upsert({
        id: 'system_maintenance_config',
        code: 'SYS_MAINT',
        title: 'SYSTEM_MAINTENANCE_RECORD',
        amount: 0,
        status: 'open',
        closed_reason: JSON.stringify(cfg),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).then(() => {});
    }
  } catch(e) {
    console.warn("Supabase Maintenance Sync Error:", e);
  }

  // 2. Background Sync to Google Apps Script
  const gasUrl = "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";
  if (!gasUrl) return;
  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: JSON.stringify({
      action: "save_maintenance_config",
      config: cfg,
      adminEmail: (currentLoggedInAdmin && currentLoggedInAdmin.email) || "Admin"
    })
  }).catch(() => {});
}
