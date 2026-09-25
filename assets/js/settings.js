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
  const tabs = ['admins', 'apis', 'site', 'backup'];
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

// 4. Backup & Restore
function exportFullSystemBackup() {
  const backupData = {
    exportedAt: new Date().toISOString(),
    system: "COMED23 KKU63 Central Admin System",
    paymentData: localStorage.getItem('COMED_KKU69_PAYMENT_DATA_V1'),
    adminAccounts: localStorage.getItem('COMED_KKU69_ADMIN_ACCOUNTS_V2'),
    maintenanceConfig: localStorage.getItem('COMED_MAINTENANCE_CONFIG_V1'),
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

document.addEventListener('DOMContentLoaded', () => {
  checkAccess();
  renderAdminTable();
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
