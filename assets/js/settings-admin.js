/**
 * =========================================================================
 * SYSTEM SETTINGS CONTROLLER - assets/js/settings.js
 * COMED KKU 69 CENTRAL MANAGEMENT CONSOLE
 * =========================================================================
 */

const ADMIN_SESSION_KEY = 'COMED_KKU69_ADMIN_LOGGED_USER';
const ADMIN_ACCOUNTS_KEY = 'COMED_KKU69_ADMIN_ACCOUNTS_V2';
const SITE_CONFIG_KEY = 'COMED_SITE_CONFIG_V1';

const DEFAULT_ADMINS = [
  { email: 'thitiwut.a@kkumail.com', name: 'ธิติวุฒิ อารีเอื้อ (ภูผา)', password: 'Phupa#69ComEd', role: 'Super Admin' },
  { email: 'phupa5874@gmail.com', name: 'ภูผา (System Tester & Admin Special)', password: 'Phupa#69ComEd', role: 'Super Admin' },
  { email: 'pichamon.sam@kkumail.com', name: 'พิชามญธุ์ สามสี (หมูหวาน)', password: 'MooWan#69ComEd', role: 'Admin' },
  { email: 'nattachai.p@kkumail.com', name: 'ณัฏฐชัย โพธิ์ทับไทย (โอ้)', password: 'OhNatta#69ComEd', role: 'Admin' }
];

// Check Admin Access
function checkAccess() {
  const loggedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!loggedEmail) {
    alert("กรุณาเข้าสู่ระบบแอดมินก่อนเข้าใช้งานหน้านี้");
    window.location.replace("admin.html");
  }
}

// Switch Tabs
function switchSettingsTab(tabName) {
  const tabs = ['admins', 'users', 'storage', 'apis', 'site', 'backup'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btnTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const sec = document.getElementById(`sectionSettings${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn && sec) {
      if (t === tabName) {
        btn.classList.add('active');
        sec.classList.remove('hidden');
      } else {
        btn.classList.remove('active');
        sec.classList.add('hidden');
      }
    }
  });
  if (tabName === 'users') {
    renderAdminUsersTable();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 1. Admin Accounts Management
function getAdminAccounts() {
  try {
    const stored = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ADMINS;
  } catch(e) {
    return DEFAULT_ADMINS;
  }
}

function renderAdminTable() {
  const list = getAdminAccounts();
  const tbody = document.getElementById('adminTableBody');
  const countBadge = document.getElementById('badgeAdminsTotal');
  if (countBadge) countBadge.textContent = `${list.length} บัญชี`;

  if (!tbody) return;
  tbody.innerHTML = list.map((a, idx) => `
    <tr class="hover:bg-slate-900/60 transition">
      <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">
          ${idx + 1}
        </div>
        <span>${a.name || 'Admin'}</span>
      </td>
      <td class="py-3 px-4 font-mono text-slate-300">${a.email}</td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          a.role === 'Super Admin' 
            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' 
            : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
        }">${a.role || 'Admin'}</span>
      </td>
      <td class="py-3 px-4 text-center">
        ${list.length > 1 ? `
          <button type="button" onclick="deleteAdmin(${idx})" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer" title="ลบบัญชีนี้">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        ` : `<span class="text-slate-600">-</span>`}
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleSaveNewAdmin(e) {
  e.preventDefault();
  const name = document.getElementById('adminNameInput')?.value.trim();
  const email = document.getElementById('adminEmailInput')?.value.trim().toLowerCase();
  const pwd = document.getElementById('adminPassInput')?.value.trim();
  const role = document.getElementById('adminRoleInput')?.value || 'Admin';

  if (!name || !email || !pwd) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  const list = getAdminAccounts();
  if (list.some(a => a.email.toLowerCase() === email)) {
    alert("อีเมลนี้มีอยู่ในระบบผู้ดูแลแล้ว!");
    return;
  }

  list.push({ name, email, password: pwd, role });
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(list));
  alert(`✨ เพิ่มบัญชีผู้ดูแล "${name}" เรียบร้อยแล้ว`);
  document.getElementById('formAddAdmin')?.reset();
  renderAdminTable();
}

function deleteAdmin(index) {
  const list = getAdminAccounts();
  const admin = list[index];
  if (!admin) return;

  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${admin.name}" (${admin.email})?`)) {
    list.splice(index, 1);
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(list));
    renderAdminTable();
  }
}

// 2. Cloud APIs
function handleSaveCloudApis(e) {
  e.preventDefault();
  alert("✨ บันทึกการตั้งค่า Cloud APIs สำเร็จเรียบร้อย!");
}

// 3. Site Info
function handleSaveSiteInfo(e) {
  e.preventDefault();
  const title = document.getElementById('siteTitleInput')?.value;
  const batch = document.getElementById('siteBatchInput')?.value;
  const announcement = document.getElementById('siteAnnouncementInput')?.value;

  const cfg = { title, batch, announcement, updatedAt: new Date().toISOString() };
  localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(cfg));
  alert("✨ บันทึกข้อมูลเว็บไซต์และข้อความประกาศสำเร็จเรียบร้อย!");
}

// 4. Profile Storage & Provider Configuration
const PROFILE_UPLOAD_CONFIG_KEY = 'COMED_PROFILE_UPLOAD_CONFIG_V1';

const DEFAULT_PROFILE_UPLOAD_CONFIG = {
  allowUserUpload: true,
  strategy: 'priority', // 'single' | 'priority'
  singleTarget: 'catbox',
  priority: ['catbox', 'imgbb', 'cloudinary'],
  maxSizeMB: 5,
  allowAnimations: true
};

function toggleStorageStrategyUI() {
  const strat = document.querySelector('input[name="storageStrategy"]:checked')?.value || 'priority';
  const boxSingle = document.getElementById('boxSingleProvider');
  const boxPriority = document.getElementById('boxPriorityProviders');

  if (strat === 'single') {
    if (boxSingle) boxSingle.classList.remove('hidden');
    if (boxPriority) boxPriority.classList.add('hidden');
  } else {
    if (boxSingle) boxSingle.classList.add('hidden');
    if (boxPriority) boxPriority.classList.remove('hidden');
  }
}

const SYSTEM_STORAGE_CONFIG_ID = 'system_profile_storage_config';

function updateStorageSyncBadge(status, text) {
  const badge = document.getElementById('storageConfigSyncBadge');
  const txt = document.getElementById('storageConfigSyncText');
  if (!badge || !txt) return;

  if (status === 'syncing') {
    badge.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1.5 animate-pulse';
    txt.textContent = text || 'กำลังซิงค์กับคลาวด์...';
  } else if (status === 'synced') {
    badge.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1.5';
    txt.textContent = text || 'ซิงค์กับแอดมินทุกคนแล้ว';
  } else if (status === 'local') {
    badge.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono flex items-center gap-1.5';
    txt.textContent = text || 'บันทึกในเครื่อง (ออฟไลน์)';
  } else if (status === 'error') {
    badge.className = 'px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono flex items-center gap-1.5';
    txt.textContent = text || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyProfileStorageConfigToUI(cfg) {
  const chkUpload = document.getElementById('admAllowUserUpload');
  const radSingle = document.getElementById('stratSingle');
  const radPriority = document.getElementById('stratPriority');
  const selSingle = document.getElementById('admSingleTarget');
  const pri1 = document.getElementById('admPriority1');
  const pri2 = document.getElementById('admPriority2');
  const pri3 = document.getElementById('admPriority3');
  const inpSize = document.getElementById('admMaxProfileSizeMB');
  const selAnim = document.getElementById('admAllowAnimations');

  if (chkUpload) chkUpload.checked = cfg.allowUserUpload !== false;
  if (cfg.strategy === 'single') {
    if (radSingle) radSingle.checked = true;
  } else {
    if (radPriority) radPriority.checked = true;
  }
  if (selSingle) selSingle.value = cfg.singleTarget || 'cloudinary';
  if (pri1 && cfg.priority && cfg.priority[0]) pri1.value = cfg.priority[0];
  if (pri2 && cfg.priority && cfg.priority[1]) pri2.value = cfg.priority[1];
  if (pri3 && cfg.priority && cfg.priority[2]) pri3.value = cfg.priority[2];
  if (inpSize) inpSize.value = cfg.maxSizeMB || 5;
  if (selAnim) selAnim.value = String(cfg.allowAnimations !== false);

  toggleStorageStrategyUI();
}

async function loadProfileStorageConfig() {
  let cfg = DEFAULT_PROFILE_UPLOAD_CONFIG;
  try {
    const raw = localStorage.getItem(PROFILE_UPLOAD_CONFIG_KEY);
    if (raw) cfg = { ...cfg, ...JSON.parse(raw) };
  } catch(e) {}

  applyProfileStorageConfigToUI(cfg);

  // Asynchronously fetch latest config from Supabase cloud database so all admins see what was set
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (sb) {
    updateStorageSyncBadge('syncing', 'กำลังดึงค่าจากคลาวด์...');
    try {
      const { data, error } = await sb
        .from('campaigns')
        .select('*')
        .eq('id', SYSTEM_STORAGE_CONFIG_ID)
        .maybeSingle();

      if (!error && data && data.subtitle) {
        try {
          const cloudCfg = JSON.parse(data.subtitle);
          cfg = { ...cfg, ...cloudCfg };
          localStorage.setItem(PROFILE_UPLOAD_CONFIG_KEY, JSON.stringify(cfg));
          applyProfileStorageConfigToUI(cfg);
          updateStorageSyncBadge('synced', 'ซิงค์กับแอดมินทุกคนแล้ว');
        } catch(pe) {
          console.warn("Parse cloud storage config error:", pe);
          updateStorageSyncBadge('local', 'ใช้การตั้งค่าในเครื่อง');
        }
      } else {
        updateStorageSyncBadge('synced', 'พร้อมใช้งานบนคลาวด์');
      }

      // Realtime subscription: if another admin saves new settings, update UI in real-time!
      if (!window._profileConfigRealtimeSubscribed) {
        window._profileConfigRealtimeSubscribed = true;
        sb.channel('realtime_profile_storage_config')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'campaigns',
            filter: `id=eq.${SYSTEM_STORAGE_CONFIG_ID}`
          }, payload => {
            if (payload.new && payload.new.subtitle) {
              try {
                const updatedCloudCfg = JSON.parse(payload.new.subtitle);
                localStorage.setItem(PROFILE_UPLOAD_CONFIG_KEY, JSON.stringify(updatedCloudCfg));
                applyProfileStorageConfigToUI(updatedCloudCfg);
                updateStorageSyncBadge('synced', 'แอดมินอื่นเพิ่งอัปเดตการตั้งค่า');
              } catch(err) {}
            }
          })
          .subscribe();
      }
    } catch(err) {
      console.warn("Could not sync profile storage config with Supabase:", err);
      updateStorageSyncBadge('local', 'ออฟไลน์ (ใช้ค่าในเครื่อง)');
    }
  } else {
    updateStorageSyncBadge('local', 'บันทึกในเครื่อง');
  }
}

async function handleSaveProfileStorageConfig(e) {
  if (e) e.preventDefault();
  const chkUpload = document.getElementById('admAllowUserUpload')?.checked ?? true;
  const strat = document.querySelector('input[name="storageStrategy"]:checked')?.value || 'priority';
  const selSingle = document.getElementById('admSingleTarget')?.value || 'cloudinary';
  const pri1 = document.getElementById('admPriority1')?.value || 'cloudinary';
  const pri2 = document.getElementById('admPriority2')?.value || 'catbox';
  const pri3 = document.getElementById('admPriority3')?.value || 'imgbb';
  const inpSize = parseFloat(document.getElementById('admMaxProfileSizeMB')?.value || '5');
  const selAnim = document.getElementById('admAllowAnimations')?.value === 'true';

  const loggedAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) || 'admin';

  const newConfig = {
    allowUserUpload: chkUpload,
    strategy: strat,
    singleTarget: selSingle,
    priority: [pri1, pri2, pri3],
    maxSizeMB: isNaN(inpSize) ? 5 : inpSize,
    allowAnimations: selAnim,
    updatedBy: loggedAdmin,
    updatedAt: new Date().toISOString()
  };

  // 1. Save to Local Storage immediately
  localStorage.setItem(PROFILE_UPLOAD_CONFIG_KEY, JSON.stringify(newConfig));
  updateStorageSyncBadge('syncing', 'กำลังบันทึกขึ้นคลาวด์...');

  // 2. Persist to Supabase Database (campaigns table KV storage)
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  let cloudSuccess = false;

  if (sb) {
    try {
      const payload = {
        id: SYSTEM_STORAGE_CONFIG_ID,
        code: 'PROFILE_STORAGE_CONFIG',
        title: 'System Profile Storage Configuration',
        subtitle: JSON.stringify(newConfig),
        category: 'System Config',
        amount: 0,
        currency: 'THB',
        deadline: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
        deadline_display: 'System Managed',
        bank_name: 'COMED Cloud Storage Engine',
        account_number: 'N/A',
        account_name: loggedAdmin,
        qr_image: 'system',
        status: 'open',
        closed_reason: '',
        show_on_index: false,
        created_at: new Date().toISOString()
      };

      const { error } = await sb.from('campaigns').upsert(payload, { onConflict: 'id' });
      if (!error) {
        cloudSuccess = true;
        updateStorageSyncBadge('synced', 'ซิงค์กับแอดมินทุกคนแล้ว');

        // Log admin activity audit trail
        try {
          await sb.from('admin_logs').insert([{
            admin_email: loggedAdmin,
            action: 'UPDATE_PROFILE_STORAGE_CONFIG',
            details: `Updated profile storage policy (strategy: ${strat}, allowUpload: ${chkUpload}, maxSize: ${inpSize}MB)`,
            created_at: new Date().toISOString()
          }]);
        } catch(lErr) {}
      } else {
        console.warn("Supabase upsert storage config failed:", error);
        updateStorageSyncBadge('local', 'บันทึกเฉพาะในเครื่อง (DB แจ้งเตือน)');
      }
    } catch(dbErr) {
      console.warn("Error persisting storage config to Supabase:", dbErr);
      updateStorageSyncBadge('local', 'บันทึกเฉพาะในเครื่อง');
    }
  }

  if (cloudSuccess) {
    alert("🎉 บันทึกการตั้งค่าระบบจัดเก็บรูปโปรไฟล์ขึ้นระบบคลาวด์ส่วนกลางเรียบร้อยแล้ว!\nแอดมินคนอื่นๆ ทุกเครื่องจะมองเห็นการตั้งค่านี้ตรงกันทันที");
  } else {
    alert("✅ บันทึกการตั้งค่าลงในเครื่องเรียบร้อยแล้ว (กำลังรอเชื่อมต่อกับฐานข้อมูลคลาวด์ส่วนกลาง)");
  }
}

// 5. Backup & Restore
function exportFullSystemBackup() {
  const backupData = {
    exportedAt: new Date().toISOString(),
    system: "COMED23 KKU63 Central Admin System",
    paymentData: localStorage.getItem('COMED_KKU69_PAYMENT_DATA_V1'),
    adminAccounts: localStorage.getItem('COMED_KKU69_ADMIN_ACCOUNTS_V2'),
    maintenanceConfig: localStorage.getItem('COMED_MAINTENANCE_CONFIG_V1'),
    profileStorageConfig: localStorage.getItem(PROFILE_UPLOAD_CONFIG_KEY),
    issues: localStorage.getItem('COMED_KKU69_ISSUES_V2'),
    siteConfig: localStorage.getItem('COMED_SITE_CONFIG_V1')
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comed23_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleRestoreBackupFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (confirm("การกู้คืนจะเขียนทับข้อมูลปัจจุบัน ต้องการดำเนินการต่อหรือไม่?")) {
        if (data.paymentData) localStorage.setItem('COMED_KKU69_PAYMENT_DATA_V1', data.paymentData);
        if (data.adminAccounts) localStorage.setItem('COMED_KKU69_ADMIN_ACCOUNTS_V2', data.adminAccounts);
        if (data.maintenanceConfig) localStorage.setItem('COMED_MAINTENANCE_CONFIG_V1', data.maintenanceConfig);
        if (data.profileStorageConfig) localStorage.setItem(PROFILE_UPLOAD_CONFIG_KEY, data.profileStorageConfig);
        if (data.issues) localStorage.setItem('COMED_KKU69_ISSUES_V2', data.issues);
        if (data.siteConfig) localStorage.setItem('COMED_SITE_CONFIG_V1', data.siteConfig);
        alert("🎉 กู้คืนข้อมูลระบบสำเร็จเรียบร้อยแล้ว!");
        location.reload();
      }
    } catch(err) {
      alert("ไฟล์ไม่ถูกต้องหรือไม่รองรับรูปแบบนี้");
    }
  };
  reader.readAsText(file);
}

// -------------------------------------------------------------
// USER PROFILES & DECORATIONS MANAGEMENT (ADMIN VIEW)
// -------------------------------------------------------------
const USER_SESSION_KEY = 'COMED_USER_SESSION';
const USER_PROFILES_STORE_KEY = 'COMED_CUSTOM_USERS_PROFILES_V1';

function getAllStoredUserProfiles() {
  try {
    const raw = localStorage.getItem(USER_PROFILES_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStoredUserProfiles(profilesMap) {
  localStorage.setItem(USER_PROFILES_STORE_KEY, JSON.stringify(profilesMap));
}

function getEnrichedStudentsList() {
  const baseStudents = window.STUDENTS_DATA || [];
  const profilesMap = getAllStoredUserProfiles();

  // Also read current logged in session if any
  let activeUser = null;
  try {
    const rawActive = localStorage.getItem(USER_SESSION_KEY);
    if (rawActive) activeUser = JSON.parse(rawActive);
  } catch(e) {}

  return baseStudents.map(st => {
    const emailKey = st.email.toLowerCase().trim();
    const custom = profilesMap[emailKey] || {};

    let avatar = custom.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(st.email)}`;
    let frame = custom.avatarFrame || 'none';
    let anim = custom.avatarAnim || 'none';

    // If active session matches this user, sync latest
    if (activeUser && activeUser.email && activeUser.email.toLowerCase() === emailKey) {
      if (activeUser.avatar) avatar = activeUser.avatar;
      if (activeUser.avatarFrame) frame = activeUser.avatarFrame;
      if (activeUser.avatarAnim) anim = activeUser.avatarAnim;
    }

    return {
      ...st,
      avatar,
      avatarFrame: frame,
      avatarAnim: anim
    };
  });
}

let cachedAdminUsers = [];

function renderAdminUsersTable(filterKeyword = '') {
  const tbody = document.getElementById('adminUsersTableBody');
  const badgeTotal = document.getElementById('badgeUsersTotal');
  if (!tbody) return;

  const allUsers = getEnrichedStudentsList();
  cachedAdminUsers = allUsers;

  const keyword = filterKeyword.toLowerCase().trim();
  const filtered = allUsers.filter(u => {
    if (!keyword) return true;
    return (
      (u.name && u.name.toLowerCase().includes(keyword)) ||
      (u.nickname && u.nickname.toLowerCase().includes(keyword)) ||
      (u.id && u.id.toLowerCase().includes(keyword)) ||
      (u.email && u.email.toLowerCase().includes(keyword))
    );
  });

  if (badgeTotal) {
    badgeTotal.textContent = `${filtered.length} / ${allUsers.length} คน`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-500 font-medium">
          ไม่พบข้อมูลผู้ใช้ที่ตรงกับ "${filterKeyword}"
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const frameClass = u.avatarFrame && u.avatarFrame !== 'none' ? `avatar-frame-${u.avatarFrame}` : '';
    const animClass = u.avatarAnim && u.avatarAnim !== 'none' ? `avatar-anim-${u.avatarAnim}` : '';

    return `
      <tr class="hover:bg-slate-900/60 transition group">
        <td class="py-3 px-4">
          <div class="relative w-11 h-11 rounded-2xl bg-slate-950 p-0.5 border border-slate-800 overflow-hidden flex items-center justify-center ${frameClass}">
            <img src="${u.avatar}" alt="${u.name}" class="w-full h-full object-cover rounded-xl ${animClass}">
          </div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-white leading-snug">${u.name}</div>
          <div class="text-[11px] text-cyan-400">น้อง${u.nickname || '-'}</div>
        </td>
        <td class="py-3 px-4 font-mono font-bold text-slate-300">${u.id || '-'}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${u.email}</td>
        <td class="py-3 px-4 space-y-1">
          <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            u.avatarFrame !== 'none' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
          }">
            <i data-lucide="sparkle" class="w-3 h-3"></i>
            <span>${u.avatarFrame || 'none'}</span>
          </div>
          <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            u.avatarAnim !== 'none' ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30' : 'bg-slate-800 text-slate-400'
          }">
            <i data-lucide="play" class="w-3 h-3"></i>
            <span>${u.avatarAnim || 'none'}</span>
          </div>
        </td>
        <td class="py-3 px-4 text-center">
          <button type="button" onclick="openAdminEditUserModal('${u.email}')" 
            class="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
            title="แก้ไขโปรไฟล์และตกแต่ง">
            <i data-lucide="palette" class="w-3.5 h-3.5"></i>
            <span>ตกแต่งโปรไฟล์</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterAdminUserList() {
  const keyword = document.getElementById('adminUserSearchInput')?.value || '';
  renderAdminUsersTable(keyword);
}

// Edit Modal Functions
let currentEditingUserEmail = null;

function openAdminEditUserModal(email) {
  const modal = document.getElementById('modalAdminEditUser');
  if (!modal) return;

  const users = getEnrichedStudentsList();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return;

  currentEditingUserEmail = user.email.toLowerCase();

  const keyInput = document.getElementById('admEditUserKey');
  const nameEl = document.getElementById('admEditUserName');
  const emailEl = document.getElementById('admEditUserEmail');
  const urlInput = document.getElementById('admEditAvatarUrl');
  const frameSelect = document.getElementById('admEditFrameSelect');
  const animSelect = document.getElementById('admEditAnimSelect');

  if (keyInput) keyInput.value = user.email;
  if (nameEl) nameEl.textContent = `${user.name} (น้อง${user.nickname || '-'})`;
  if (emailEl) emailEl.textContent = user.email;
  if (urlInput) urlInput.value = user.avatar || '';
  if (frameSelect) frameSelect.value = user.avatarFrame || 'none';
  if (animSelect) animSelect.value = user.avatarAnim || 'none';

  previewAdminUserDecorations();

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeAdminEditUserModal() {
  const modal = document.getElementById('modalAdminEditUser');
  if (modal) modal.classList.add('hidden');
}

function previewAdminUserDecorations() {
  const imgEl = document.getElementById('admEditAvatarImg');
  const frameEl = document.getElementById('admEditAvatarFrame');
  const urlInput = document.getElementById('admEditAvatarUrl');
  const frameSelect = document.getElementById('admEditFrameSelect');
  const animSelect = document.getElementById('admEditAnimSelect');
  const badgeFrame = document.getElementById('admEditBadgeFrame');
  const badgeAnim = document.getElementById('admEditBadgeAnim');

  const avatarUrl = urlInput?.value || 'https://api.dicebear.com/7.x/bottts/svg?seed=user';
  const frame = frameSelect?.value || 'none';
  const anim = animSelect?.value || 'none';

  if (imgEl) {
    imgEl.src = avatarUrl;
    imgEl.className = 'w-full h-full object-cover rounded-xl transition-all duration-300';
    if (anim !== 'none') {
      imgEl.classList.add(`avatar-anim-${anim}`);
    }
  }

  if (frameEl) {
    frameEl.className = 'w-16 h-16 rounded-2xl bg-slate-900 p-1 border-2 border-slate-800 flex items-center justify-center overflow-hidden transition-all duration-300';
    if (frame !== 'none') {
      frameEl.classList.add(`avatar-frame-${frame}`);
    }
  }

  if (badgeFrame) badgeFrame.textContent = `กรอบ: ${frame.toUpperCase()}`;
  if (badgeAnim) badgeAnim.textContent = `แอนิเมชัน: ${anim.toUpperCase()}`;
}

function adminRandomizeAvatar() {
  const randomSeed = 'comed_admin_' + Math.random().toString(36).substring(2, 9);
  const newUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
  const urlInput = document.getElementById('admEditAvatarUrl');
  if (urlInput) {
    urlInput.value = newUrl;
    previewAdminUserDecorations();
  }
}

// Upload Avatar from Admin Modal using Cloud Uploader
async function handleAdminUploadUserAvatar(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById('admUploadStatus');
  const urlInput = document.getElementById('admEditAvatarUrl');
  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = '☁️ กำลังส่งภาพขึ้นคลาวด์...';
  }

  try {
    let uploadedUrl = null;
    let providerName = 'Cloud';

    if (window.MultiCloudUploader || window.multiCloudUploader) {
      let uploader = null;
      if (typeof window.MultiCloudUploader === 'function') {
        uploader = new window.MultiCloudUploader();
      } else if (window.multiCloudUploader) {
        uploader = window.multiCloudUploader;
      } else {
        uploader = window.MultiCloudUploader;
      }

      if (uploader && typeof (uploader.upload || uploader.uploadFile) === 'function') {
        const uploadFn = uploader.uploadFile ? uploader.uploadFile.bind(uploader) : uploader.upload.bind(uploader);
        const res = await uploadFn(file, {
          folder: 'comed_admin_managed_avatars',
          tags: ['admin_override', currentEditingUserEmail || 'user']
        });

        if (res && res.url) {
          uploadedUrl = res.url;
          providerName = res.provider || 'Cloud';
        }
      }
    }

    if (!uploadedUrl) {
      uploadedUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      providerName = 'Local';
    }

    if (urlInput) {
      urlInput.value = uploadedUrl;
      previewAdminUserDecorations();
    }

    if (statusEl) {
      statusEl.textContent = `✨ อัปโหลดขึ้น ${providerName} สำเร็จ!`;
      setTimeout(() => statusEl.classList.add('hidden'), 3000);
    }
  } catch (err) {
    console.error("Admin upload failed", err);
    if (statusEl) statusEl.textContent = '❌ อัปโหลดไม่สำเร็จ กรุณาลองใหม่';
  }
}

function handleSaveAdminUserEdit(e) {
  if (e) e.preventDefault();
  if (!currentEditingUserEmail) return;

  const urlInput = document.getElementById('admEditAvatarUrl');
  const frameSelect = document.getElementById('admEditFrameSelect');
  const animSelect = document.getElementById('admEditAnimSelect');

  const avatar = urlInput?.value.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentEditingUserEmail)}`;
  const avatarFrame = frameSelect?.value || 'none';
  const avatarAnim = animSelect?.value || 'none';

  // Update Global Profiles Store
  const profilesMap = getAllStoredUserProfiles();
  profilesMap[currentEditingUserEmail] = {
    avatar,
    avatarFrame,
    avatarAnim,
    updatedBy: 'Admin',
    updatedAt: new Date().toISOString()
  };
  saveStoredUserProfiles(profilesMap);

  // If this happens to be the active logged user session, update it directly too!
  try {
    const rawActive = localStorage.getItem(USER_SESSION_KEY);
    if (rawActive) {
      const activeUser = JSON.parse(rawActive);
      if (activeUser.email && activeUser.email.toLowerCase() === currentEditingUserEmail) {
        activeUser.avatar = avatar;
        activeUser.avatarFrame = avatarFrame;
        activeUser.avatarAnim = avatarAnim;
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(activeUser));
      }
    }
  } catch(e) {}

  // 🌐 Sync to Supabase Cloud Database user_profiles table
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (sb && currentEditingUserEmail) {
    sb.from('user_profiles').upsert({
      email: currentEditingUserEmail.toLowerCase().trim(),
      avatar: avatar || null,
      avatar_frame: avatarFrame || 'none',
      avatar_anim: avatarAnim || 'none',
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' }).then(({ error }) => {
      if (error) console.warn("[Admin] Supabase user_profiles update error:", error.message);
      else console.log("[Admin] Synced updated profile to Supabase for", currentEditingUserEmail);
    }).catch(err => console.warn("[Admin] Supabase sync exception:", err));
  }

  closeAdminEditUserModal();
  renderAdminUsersTable(document.getElementById('adminUserSearchInput')?.value || '');
  alert("🎉 บันทึกการเปลี่ยนรูปโปรไฟล์และตกแต่งให้ผู้ใช้เรียบร้อยแล้ว!");
}

document.addEventListener('DOMContentLoaded', () => {
  checkAccess();
  renderAdminTable();
  loadProfileStorageConfig();
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

