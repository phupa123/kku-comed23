/**
 * =========================================================================
 * ADMIN DASHBOARD LOGIC - assets/js/admin.js
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

// ================= DYNAMIC MULTI-CAMPAIGN CONTEXT =================
const urlParams = new URLSearchParams(window.location.search);
const currentCampaignId = urlParams.get("camp") || urlParams.get("id") || "paimai69";
let currentAdminCampaign = (window.ComedCampaignManager ? window.ComedCampaignManager.getCampaignById(currentCampaignId) : null) || {
  id: "paimai69",
  title: "ค่าทำป้ายสาขาวิชาเอก",
  amount: 190,
  deadline: "2026-09-04T23:59:00+07:00",
  gasApiUrl: "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec"
};

const STORAGE_KEY = `COMED_KKU69_PAYMENT_DATA_${currentAdminCampaign.id.toUpperCase()}`;
const ADMIN_SESSION_KEY = 'COMED_KKU69_ADMIN_LOGGED_USER';
const ADMIN_ACCOUNTS_KEY = 'COMED_KKU69_ADMIN_ACCOUNTS_V2';
const ADMIN_LOGS_KEY = 'COMED_KKU69_ADMIN_LOGS_V2';
const ISSUES_KEY = 'COMED_KKU69_ISSUES_V2';

// Helper: คำนวณ SHA-256 ใน Browser
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ฟังก์ชันสุ่มรหัสผ่านปลอดภัย
function generateSecurePassword(length = 10) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@!";
  let ret = "";
  for (let i = 0; i < length; i++) {
    ret += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return ret;
}

// Initial default admin accounts
const DEFAULT_ADMINS = [
  { email: 'thitiwut.a@kkumail.com', name: 'ธิติวุฒิ อารีเอื้อ (ภูผา)', password: 'Phupa#69ComEd', hash: '59de3e916100d7316a353db05617c31de97697ec474e47be6af4168e5ae55e47', role: 'Super Admin' },
  { email: 'pichamon.sam@kkumail.com', name: 'พิชามญธุ์ สามสี (หมูหวาน)', password: 'MooWan#69ComEd', hash: '41d0b334f78c302fb30d6b73041fec5aeaf78982ce6d90ef30113cde7974399a', role: 'Admin' },
  { email: 'nattachai.p@kkumail.com', name: 'ณัฏฐชัย โพธิ์ทับไทย (โอ้)', password: 'OhNatta#69ComEd', hash: 'd6dbff479a49739cc1d20ad7704993174f5f9f7fb34f1bc756f4d7afb9017e45', role: 'Admin' }
];

let adminAccounts = [];
try {
  const storedAdmins = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
  adminAccounts = storedAdmins ? JSON.parse(storedAdmins) : DEFAULT_ADMINS;
} catch (e) {
  adminAccounts = DEFAULT_ADMINS;
}

let adminLogs = [];
try {
  const storedLogs = localStorage.getItem(ADMIN_LOGS_KEY);
  adminLogs = storedLogs ? JSON.parse(storedLogs) : [];
} catch (e) {
  adminLogs = [];
}

let userIssues = [];
try {
  const storedIssues = localStorage.getItem(ISSUES_KEY);
  userIssues = storedIssues ? JSON.parse(storedIssues) : [];
} catch (e) {
  userIssues = [];
}

let currentLoggedInAdmin = null;
let loginAttempts = 0;
let lockoutUntil = 0;

// รายชื่อนักศึกษาทั้ง 60 คน
const DEFAULT_STUDENTS = [
  { "id": "693050120-5", "name": "กชกร แสนอินทร์", "nickname": "มิวสิค", "email": "kodchakon.sa@kkumail.com" },
  { "id": "693050121-3", "name": "กนกพร คำพิทูล", "nickname": "โดนัท", "email": "kanokporn.kump@kkumail.com" },
  { "id": "693050122-1", "name": "กรกต บรรเจิดวัฒนกุล", "nickname": "โนว่า", "email": "korakod.b@kkumail.com" },
  { "id": "693050123-9", "name": "กัญชณิกา นันททิพักษ์", "nickname": "โบนัส", "email": "kanchaniga.n@kkumail.com" },
  { "id": "693050124-7", "name": "กิตติชัย สิงเนิน", "nickname": "น้ำเต้า", "email": "Kittichai.si@kkumail.com" },
  { "id": "693050125-5", "name": "ขลุ่ยไทย เคนมี", "nickname": "ขลุ่ย", "email": "kruithai.k@kkumail.com" },
  { "id": "693050126-3", "name": "จิรทีปต์ ชัยศรี", "nickname": "บีน", "email": "jirathip.c@kkumail.com" },
  { "id": "693050127-1", "name": "ชัยพงค์ วรรณทวี", "nickname": "มาร์ค", "email": "chaiyaphong.w@kkumail.com" },
  { "id": "693050128-9", "name": "ธัญชนก สุตะโคตร", "nickname": "เค้ก", "email": "thanchanok.sut@kkumail.com" },
  { "id": "693050129-7", "name": "ธันยนันท์ สุวัฒนะ", "nickname": "วาน", "email": "thanyanan.su@kkumail.com" },
  { "id": "693050130-2", "name": "ธีรดนย์ ศรีโพธิ์ชัย", "nickname": "ยูโร", "email": "theeradon.sr@kkumail.com" },
  { "id": "693050131-0", "name": "บุญญรัตน์ ชะนะพาล", "nickname": "อันอัน", "email": "bunyarat.c@kkumail.com" },
  { "id": "693050132-8", "name": "ปภาดา เพิ่มพูล", "nickname": "แตงโม", "email": "papada.ph@kkumail.com" },
  { "id": "693050133-6", "name": "ปุณเมศ บุญสง", "nickname": "คิว", "email": "punnamet.b@kkumail.com" },
  { "id": "693050134-4", "name": "พรหมพิริยะ หอมจันทร์", "nickname": "โอปอน", "email": "phromphiriya.h@kkumail.com" },
  { "id": "693050135-2", "name": "พิชชาพร เดชกุล", "nickname": "แพนนี่", "email": "phitchaphon.d@kkumail.com" },
  { "id": "693050136-0", "name": "พีระพัฒน์ เกียมา", "nickname": "ต้นกล้า", "email": "Phiraphat.ki@kkumail.com" },
  { "id": "693050137-8", "name": "ภาณุวิชญ์ ขัตติสอน", "nickname": "ไกด์", "email": "panuvich.k@kkumail.com" },
  { "id": "693050138-6", "name": "ภูธเนศ วงษ์ชาดี", "nickname": "ภู", "email": "phuthanet.wo@kkumail.com" },
  { "id": "693050139-4", "name": "วชรพล อินธิกาย", "nickname": "เนคไท", "email": "Wacharaphol.i@kkumail.com" },
  { "id": "693050140-9", "name": "วชิรวิทย์ ทรัพย์เพิ่ม", "nickname": "นิว", "email": "Wachirawit.sap@kkumail.com" },
  { "id": "693050141-7", "name": "วชิรวิทย์ บุญขันธ์", "nickname": "คิว", "email": "wachirawit.boonk@kkumail.com" },
  { "id": "693050142-5", "name": "วัชรากร บุญโสม", "nickname": "ออย", "email": "watcharakon.bu@kkumail.com" },
  { "id": "693050143-3", "name": "ศุกลวัฒน์ พาพลงาม", "nickname": "เปรม", "email": "sukollawat.p@kkumail.com" },
  { "id": "693050144-1", "name": "อธิชา พิมพ์ทอง", "nickname": "ไอคิว", "email": "athicha.pi@kkumail.com" },
  { "id": "693050145-9", "name": "เขมนิจ บุตรชน", "nickname": "เขม", "email": "kemmanit.b@kkumail.com" },
  { "id": "693050146-7", "name": "เพ็ญพิชชา โกมลวรรค", "nickname": "นานา", "email": "panphitcha.k@kkumail.com" },
  { "id": "693050157-5", "name": "แก่นพนม เฉลิมวงศ์วิวัฒน", "nickname": "ข้าวเหนียว", "email": "kaenpanom.c@kkumail.com" },
  { "id": "693050148-3", "name": "โสภิตรา หุนสุวงค์", "nickname": "เค้ก", "email": "Sopitra.h@kkumail.com" },
  { "id": "693050383-3", "name": "ฉัตรรดา กะไรยะ", "nickname": "ฟ่าง", "email": "chatrada.k@kkumail.com" },
  { "id": "693050384-1", "name": "ชลากร กุลสอนนาน", "nickname": "ต้น", "email": "chalakorn.k@kkumail.com" },
  { "id": "693050385-9", "name": "ฐิติกานต์ บุญสอน", "nickname": "มะปราง", "email": "thitikan.boo@kkumail.com" },
  { "id": "693050386-7", "name": "ณัฏฐชัย โพธิ์ทับไทย", "nickname": "โอ้", "email": "nattachai.p@kkumail.com" },
  { "id": "693050387-5", "name": "ณิชคุณ ชำนาญ", "nickname": "นาโน", "email": "Nichakhun.c@kkumail.com" },
  { "id": "693050388-3", "name": "ธนาธิป ภูนาเหนือ", "nickname": "ซี", "email": "thanathip.p@kkumail.com" },
  { "id": "693050389-1", "name": "ธิติวุฒิ อารีเอื้อ", "nickname": "ภูผา", "email": "Thitiwut.a@kkumail.com" },
  { "id": "693050390-6", "name": "ธีระพล บัวรัตน์", "nickname": "แม็กมิน", "email": "Thiraphon.b@kkumail.com" },
  { "id": "693050391-4", "name": "ประกฤษฎิ์ เหยียดชัยภูมิ", "nickname": "ต้นกล้า", "email": "prakrit.y@kkumail.com" },
  { "id": "693050393-0", "name": "พิชามญธุ์ สามสี", "nickname": "หมูหวาน", "email": "pichamon.sam@kkumail.com" },
  { "id": "693050394-8", "name": "ภูวกร มูลเหลา", "nickname": "เฟส", "email": "phuwakorn.m@kkumail.com" },
  { "id": "693050395-6", "name": "รัชชานนท์ แสงสว่าง", "nickname": "ภูมิ", "email": "ratchanon.saen@kkumail.com" },
  { "id": "693050396-4", "name": "วรัญญา อามาตย์", "nickname": "อุ้ม", "email": "waranya.ar@kkumail.com" },
  { "id": "693050397-2", "name": "วริศรา งามประเสริฐ", "nickname": "นุ่น", "email": "waritsara.ng@kkumail.com" },
  { "id": "693050398-0", "name": "วิมลสิริ วงศ์คำชาว", "nickname": "แพรวา", "email": "wimonsiri.w@kkumail.com" },
  { "id": "693050399-8", "name": "วีรภัทร เพชรอ้อม", "nickname": "ตะวัน", "email": "wiraphat.phe@kkumail.com" },
  { "id": "693050400-9", "name": "สิรวิชญ์ บุญหล้า", "nickname": "อั้ม", "email": "sirawit.b@kkumail.com" },
  { "id": "693050401-7", "name": "เบญญาภา มีสวัสดิ์", "nickname": "บัวชมพู", "email": "benyapa.mee@kkumail.com" },
  { "id": "693050534-8", "name": "กัลยรัตน์ ไชยเดช", "nickname": "อเล็ก", "email": "kanyarat.chaid@kkumail.com" },
  { "id": "693050535-6", "name": "กิตติพัฒน์ เพียรยิ่ง", "nickname": "ปอนด์", "email": "kttiphat.pi@kkumail.com" },
  { "id": "693050537-2", "name": "ทิติภา มาสุข", "nickname": "ดีดี้", "email": "thitipha.m@kkumail.com" },
  { "id": "693050538-0", "name": "ภริดา เด่นไชยรัตน์", "nickname": "ต้นอ้อ", "email": "pharida.d@kkumail.com" },
  { "id": "693050539-8", "name": "ภูมรินทร์ บุญมี", "nickname": "ภูมิ", "email": "poommarin.b@kkumail.com" },
  { "id": "693050540-3", "name": "รณชัย สายเนตร์", "nickname": "น็อต", "email": "ronnachai.sa@kkumail.com" },
  { "id": "693050541-1", "name": "อัษฎากร ศรีสังข์", "nickname": "บาส", "email": "adsadakorn.s@kkumail.com" },
  { "id": "693050562-3", "name": "ชิษณุพงศ์ แสงสีงาม", "nickname": "ไผ่", "email": "chitsanupong.sae@kkumail.com" },
  { "id": "693050563-1", "name": "ธาราทิพย์ การร้อย", "nickname": "บีม", "email": "tharathip.ka@kkumail.com" },
  { "id": "693050564-9", "name": "ปุณยพัฒน์ สินโพธิ์", "nickname": "โบนัส", "email": "punyaphat.s@kkumail.com" },
  { "id": "693050565-7", "name": "พิยดา สารทอง", "nickname": "โซอี้", "email": "phiyada.san@kkumail.com" },
  { "id": "693050566-5", "name": "สุธีกานต์ บัตเลอร์", "nickname": "เจสซี่", "email": "suthikan.b@kkumail.com" },
  { "id": "693050567-3", "name": "อาภัสรา นากลาง", "nickname": "เป้ย", "email": "apassara.n@kkumail.com" }
];

let googleAppsScriptUrl = "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";
let studentDatabase = DEFAULT_STUDENTS;
let paymentRecords = {};
let trashRecords = {};
let currentFilter = 'all';

const GOOGLE_CLIENT_ID = "799199144896-9tft22kns4jjv40lk19oul9dp1mprmb4.apps.googleusercontent.com";

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
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
    // Authorized Admin Login
    currentLoggedInAdmin = admin;
    sessionStorage.setItem(ADMIN_SESSION_KEY, admin.email);
    await logAdminAction("Google Login Success", `ผู้ดูแล ${admin.name} เข้าสู่ระบบด้วย Google Account (${email})`);
    showDashboard();
  } else {
    // Not an authorized admin
    if (errBox && errText) {
      errText.textContent = `บัญชี "${email}" ไม่มีสิทธิ์ผู้ดูแลระบบ (Admin) ในระบบนี้`;
      errBox.classList.remove('hidden');
    }
  }
}

// Ensure Google Identity SDK is fully initialized
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
    triggerGoogleOneTapPrompt();
  } else {
    if (tabGoogle) tabGoogle.className = 'py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer';
    if (tabPassword) tabPassword.className = 'py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md cursor-pointer';
    if (viewGoogle) viewGoogle.classList.add('hidden');
    if (viewPassword) viewPassword.classList.remove('hidden');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function triggerGoogleOneTapPrompt() {
  try {
    if (ensureGoogleInitialized()) {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log("One-tap dismissed/suppressed, rendering standard button.");
        }
      });
    }
  } catch(e) {
    console.warn("One-Tap Trigger Error", e);
  }
}

// Explicit OAuth Login Popup (Triggered when clicking the primary button)
function triggerGooglePopupAuth() {
  try {
    if (ensureGoogleInitialized()) {
      google.accounts.id.prompt();
    } else {
      alert("กำลังเชื่อมต่อ Google Service กรุณารอสักครู่...");
    }
  } catch(e) {
    console.warn("Google Auth Trigger", e);
  }
}

function initGoogleAdminButton() {
  try {
    if (ensureGoogleInitialized()) {
      const wrapper = document.getElementById('googleAdminButtonWrapper');
      if (wrapper) {
        google.accounts.id.renderButton(
          wrapper,
          { theme: "filled_blue", size: "large", width: 280, text: "signin_with", shape: "pill" }
        );
      }
      
      // Auto prompt Google One-Tap account selector at top-right
      setTimeout(() => {
        google.accounts.id.prompt();
      }, 500);
    } else {
      setTimeout(initGoogleAdminButton, 300);
    }
  } catch(e) {
    console.warn("Google Admin One-Tap Error", e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loggedEmail = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (loggedEmail) {
    currentLoggedInAdmin = adminAccounts.find(a => a.email.toLowerCase() === loggedEmail.toLowerCase()) || { email: loggedEmail, name: "Admin" };
    showDashboard();
  } else {
    showLoginScreen();
    initGoogleAdminButton();
  }
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Silent Auto-refresh background polling every 20s
  setInterval(async () => {
    const dash = document.getElementById('adminDashboard');
    if (dash && !dash.classList.contains('hidden')) {
      await loadAllPayments(true);
      renderStats();
      if (currentFilter !== 'admins') {
        renderAdminTable();
      }
    }
  }, 20000);
});

function fillAdminCreds(email, pwd) {
  const emailEl = document.getElementById('adminEmailInput');
  const pwdEl = document.getElementById('adminPasswordInput');
  if (emailEl) emailEl.value = email;
  if (pwdEl) pwdEl.value = pwd;
  const errBox = document.getElementById('loginErrorMsg');
  if (errBox) errBox.classList.add('hidden');
}

function togglePasswordVisibility(inputId, iconWrapperId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const isPwd = (input.type === 'password');
  input.type = isPwd ? 'text' : 'password';

  const wrap = document.getElementById(iconWrapperId);
  if (wrap) {
    if (isPwd) {
      wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
    } else {
      wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  }
}

function showLoginScreen() {
  const login = document.getElementById('loginScreen');
  const dash = document.getElementById('adminDashboard');
  if (login) login.classList.remove('hidden');
  if (dash) dash.classList.add('hidden');
}

async function showDashboard() {
  const login = document.getElementById('loginScreen');
  const dash = document.getElementById('adminDashboard');
  if (login) login.classList.add('hidden');
  if (dash) dash.classList.remove('hidden');

  // 0. Cloud Sync: Fetch fresh campaigns list from Supabase
  if (window.ComedCampaignManager && typeof window.ComedCampaignManager.fetchFromCloud === 'function') {
    try {
      await window.ComedCampaignManager.fetchFromCloud();
      currentAdminCampaign = window.ComedCampaignManager.getCampaignById(currentCampaignId);
    } catch (e) {}
  }

  // Render Campaigns Switcher Hub
  renderAdminCampaignsNav();

  studentDatabase = (typeof window.STUDENTS_DATA !== 'undefined' && window.STUDENTS_DATA.length > 0) ? window.STUDENTS_DATA : DEFAULT_STUDENTS;
  
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try { paymentRecords = JSON.parse(local); } catch(e) {}
  }
  const localTrash = localStorage.getItem('COMED_KKU69_TRASH_RECORDS');
  if (localTrash) {
    try { trashRecords = JSON.parse(localTrash); } catch(e) {}
  }

  renderStats();
  renderAdminTable();

  try {
    if (typeof gsap !== 'undefined') {
      gsap.fromTo("header", { y: -25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".admin-stat-card", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" });
      gsap.fromTo("#adminTableContainer", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: "power3.out" });
    }
  } catch(e) {}

  await loadAllPayments();
  renderStats();
  renderAdminTable();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function logAdminAction(action, detail) {
  const email = currentLoggedInAdmin ? currentLoggedInAdmin.email : "Unknown";
  const timestamp = new Date().toLocaleString('th-TH');
  const newLog = { timestamp, adminEmail: email, action, detail };
  adminLogs.unshift(newLog);
  localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(adminLogs.slice(0, 200)));

  if (googleAppsScriptUrl) {
    try {
      fetch(googleAppsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "log_admin",
          adminEmail: email,
          logAction: action,
          logDetail: detail
        })
      });
    } catch (e) { }
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const errBox = document.getElementById('loginErrorMsg');
  const errText = document.getElementById('loginErrorText');
  if (errBox) errBox.classList.add('hidden');

  const emailInput = document.getElementById('adminEmailInput')?.value.trim().toLowerCase() || '';
  const pwdInput = document.getElementById('adminPasswordInput')?.value.trim() || '';

  // Find in storage or default list
  let admin = adminAccounts.find(a => a.email.toLowerCase() === emailInput);
  if (!admin) {
    admin = DEFAULT_ADMINS.find(a => a.email.toLowerCase() === emailInput);
  }

  let isValid = false;

  if (admin) {
    if (admin.password && admin.password === pwdInput) {
      isValid = true;
    } else if (admin.hash) {
      const inputHash = await sha256(emailInput + ':' + pwdInput);
      if (inputHash === admin.hash) {
        isValid = true;
      }
    }
  }

  // Special fallback for default 3 admins
  if (!isValid) {
    const matchedDefault = DEFAULT_ADMINS.find(a => a.email.toLowerCase() === emailInput && a.password === pwdInput);
    if (matchedDefault) {
      admin = matchedDefault;
      isValid = true;
    }
  }

  if (isValid && admin) {
    loginAttempts = 0;
    currentLoggedInAdmin = admin;
    sessionStorage.setItem(ADMIN_SESSION_KEY, admin.email);
    logAdminAction("เข้าสู่ระบบ (Login)", `เข้าสู่ระบบสำเร็จจากอีเมล ${admin.email}`);
    showDashboard();
  } else {
    if (errBox && errText) {
      errBox.classList.remove('hidden');
      errText.textContent = "อีเมล หรือ รหัสผ่านแอดมินไม่ถูกต้อง (โปรดตรวจสอบตัวพิมพ์เล็ก-ใหญ่)";
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function handleAdminLogout() {
  if (confirm("ต้องการออกจากระบบผู้ดูแลระบบหรือไม่?")) {
    logAdminAction("ออกจากระบบ (Logout)", `แอดมิน ${currentLoggedInAdmin?.email || ''} ออกจากระบบ`);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
  }
}

// ================= CAMPAIGN MANAGEMENT LOGIC (ADMIN) =================
function renderAdminCampaignsNav() {
  const container = document.getElementById('adminCampaignsNav');
  const countBadge = document.getElementById('adminCampaignCountBadge');
  if (!container || !window.ComedCampaignManager) return;

  const allCampaigns = window.ComedCampaignManager.getAllCampaigns();
  if (countBadge) countBadge.textContent = `${allCampaigns.length} รายการ`;

  container.innerHTML = allCampaigns.map(camp => {
    const isSelected = (camp.id.toLowerCase() === currentAdminCampaign.id.toLowerCase());
    let statusPill = '';

    if (camp.status === 'completed') {
      statusPill = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><i data-lucide="check-check" class="w-3 h-3"></i> ครบแล้ว/ปิดรับ</span>';
    } else if (camp.status === 'open') {
      statusPill = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span> กำลังเปิดรับ</span>';
    } else {
      statusPill = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700">ปิดชั่วคราว</span>';
    }

    const adminLink = `payment-admin.html?camp=${encodeURIComponent(camp.id)}`;

    return `
      <div class="p-3.5 rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-slate-900 border-2 border-orange-500 shadow-lg'
          : 'bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 shadow-xs'
      }">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-orange-400">${camp.category || 'กิจกรรม'}</span>
            ${statusPill}
          </div>
          <h4 class="font-black text-xs text-white line-clamp-1">${camp.title}</h4>
          <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>เป้าหมายคนละ:</span>
            <span class="font-bold text-orange-400 font-mono">฿${Number(camp.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          ${isSelected 
            ? '<span class="text-[10px] font-black text-orange-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ใช้งานอยู่นี้</span>'
            : `<a href="${adminLink}" class="text-[10px] font-bold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition">สลับมาดูรายการนี้</a>`
          }

          <div class="flex items-center gap-1">
            <button onclick="openEditCampaignModal('${camp.id}')" class="text-[9px] px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold transition flex items-center gap-1" title="แก้ไขรายละเอียดแคมเปญ">
              <i data-lucide="edit-3" class="w-3 h-3"></i>
              <span>แก้ไข</span>
            </button>
            <button onclick="toggleCampaignStatus('${camp.id}')" class="text-[9px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="เปิด/ปิดการชำระเงิน">
              ${camp.status === 'open' ? 'ปิดรับ' : 'เปิดรับ'}
            </button>
            <a href="payment.html?camp=${encodeURIComponent(camp.id)}" target="_blank" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-orange-400" title="ดูหน้าชำระเงินของนศ.">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleQrFileUpload(event, previewImgId, inputId) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    alert("⚠️ ขนาดไฟล์ภาพใหญ่เกินไป กรุณาเลือกภาพขนาดไม่เกิน 20MB");
    event.target.value = "";
    return;
  }

  // 1. Show local preview immediately
  const preview = document.getElementById(previewImgId);
  const input = document.getElementById(inputId);
  const localUrl = URL.createObjectURL(file);
  if (preview) preview.src = localUrl;

  // 2. Upload to Cloud Provider explicitly chosen by Admin
  if (window.MultiCloudUploader) {
    const selectedProvider = document.getElementById('campQrProviderSelect')?.value || 'cloudinary';
    const providerLabel = window.MultiCloudUploader.getProviderName(selectedProvider);

    if (typeof showToastNotification === 'function') {
      showToastNotification(`☁️ กำลังส่งขึ้น ${providerLabel}...`);
    }
    try {
      const res = await window.MultiCloudUploader.upload(file, {
        preferredProvider: selectedProvider,
        category: 'QR Code รับชำระเงิน',
        onProgress: (pct, msg) => {
          if (typeof showToastNotification === 'function' && pct < 100) {
            showToastNotification(`☁️ ${msg}`);
          }
        }
      });

      if (res && res.url) {
        if (input) input.value = res.url;
        if (preview) preview.src = res.url;
        if (typeof showToastNotification === 'function') {
          showToastNotification(`🎉 อัปโหลดขึ้น ${window.MultiCloudUploader.getProviderName(res.provider)} สำเร็จแล้ว!`);
        }
        return;
      }
    } catch (err) {
      console.warn("MultiCloud upload error, fallback to base64:", err);
      if (typeof showToastNotification === 'function') {
        showToastNotification("⚠️ คลาวด์ภายนอกมีปัญหา กำลังบันทึกเป็น Base64 สำรอง...");
      }
    }
  }

  // Fallback to Base64 data URL
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    if (preview) preview.src = dataUrl;
    if (input) input.value = dataUrl;
    if (typeof showToastNotification === 'function') {
      showToastNotification("📸 โหลดรูปภาพ QR Code พร้อมใช้งานแล้ว!");
    }
  };
  reader.readAsDataURL(file);
}

function updateQrPreviewFromUrl(url, previewImgId) {
  const preview = document.getElementById(previewImgId);
  if (!preview) return;
  if (!url || !url.trim()) {
    preview.src = "qr_payment.png";
    return;
  }
  preview.src = url.trim();
}

function openCreateCampaignModal() {
  const form = document.getElementById('createCampaignForm');
  if (form) form.reset();
  
  const editIdInput = document.getElementById('campEditId');
  if (editIdInput) editIdInput.value = '';

  const codeInput = document.getElementById('campCodeInput');
  if (codeInput) codeInput.readOnly = false;

  const modalTitle = document.getElementById('modalCampaignTitle');
  if (modalTitle) {
    modalTitle.innerHTML = `
      <i data-lucide="plus-circle" class="w-5 h-5 text-orange-400"></i>
      <span>สร้างรายการเก็บเงินใหม่ (New Campaign)</span>
    `;
  }

  const qrPreview = document.getElementById('campQrPreviewImg');
  if (qrPreview) qrPreview.src = 'qr_payment.png';
  const qrInput = document.getElementById('campQrImageInput');
  if (qrInput) qrInput.value = 'qr_payment.png';

  const modal = document.getElementById('modalCreateCampaign');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openEditCampaignModal(campId) {
  if (!window.ComedCampaignManager) return;
  const camp = window.ComedCampaignManager.getCampaignById(campId);
  if (!camp) return;

  const editIdInput = document.getElementById('campEditId');
  if (editIdInput) editIdInput.value = camp.id;

  const titleInput = document.getElementById('campTitleInput');
  if (titleInput) titleInput.value = camp.title || '';

  const codeInput = document.getElementById('campCodeInput');
  if (codeInput) {
    codeInput.value = camp.id;
    codeInput.readOnly = true; // Protect ID from breaking relationship
  }

  const amountInput = document.getElementById('campAmountInput');
  if (amountInput) amountInput.value = camp.amount || 0;

  const subtitleInput = document.getElementById('campSubtitleInput');
  if (subtitleInput) subtitleInput.value = camp.subtitle || '';

  const categoryInput = document.getElementById('campCategoryInput');
  if (categoryInput) categoryInput.value = camp.category || '';

  const deadlineInput = document.getElementById('campDeadlineInput');
  if (deadlineInput && camp.deadline) {
    try {
      const dt = new Date(camp.deadline);
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      deadlineInput.value = localIso;
    } catch(e) {
      deadlineInput.value = '';
    }
  }

  const bankNameInput = document.getElementById('campBankNameInput');
  if (bankNameInput) bankNameInput.value = camp.bankName || '';

  const accountNumInput = document.getElementById('campAccountNumInput');
  if (accountNumInput) accountNumInput.value = camp.accountNumber || '';

  const accountNameInput = document.getElementById('campAccountNameInput');
  if (accountNameInput) accountNameInput.value = camp.accountName || '';

  const qrInput = document.getElementById('campQrImageInput');
  if (qrInput) qrInput.value = camp.qrImage || 'qr_payment.png';

  const qrPreview = document.getElementById('campQrPreviewImg');
  if (qrPreview) qrPreview.src = camp.qrImage || 'qr_payment.png';

  const slipProviderSelect = document.getElementById('campSlipProviderSelect');
  if (slipProviderSelect) slipProviderSelect.value = camp.slipProvider || 'cloudinary';

  const statusOpenInput = document.getElementById('campStatusOpenInput');
  if (statusOpenInput) statusOpenInput.checked = (camp.status === 'open');

  const modalTitle = document.getElementById('modalCampaignTitle');
  if (modalTitle) {
    modalTitle.innerHTML = `
      <i data-lucide="edit-3" class="w-5 h-5 text-orange-400"></i>
      <span>แก้ไขรายการเก็บเงิน: ${camp.title}</span>
    `;
  }

  const modal = document.getElementById('modalCreateCampaign');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCreateCampaignModal() {
  const modal = document.getElementById('modalCreateCampaign');
  if (modal) modal.classList.add('hidden');
}

async function handleSaveCampaignSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('campEditId')?.value.trim();
  const title = document.getElementById('campTitleInput')?.value.trim();
  const code = (editId || document.getElementById('campCodeInput')?.value.trim() || '').toLowerCase();
  const amount = parseFloat(document.getElementById('campAmountInput')?.value) || 0;
  const subtitle = document.getElementById('campSubtitleInput')?.value.trim() || '';
  const category = document.getElementById('campCategoryInput')?.value.trim() || 'กิจกรรมสาขา';
  const deadline = document.getElementById('campDeadlineInput')?.value || '';
  const bankName = document.getElementById('campBankNameInput')?.value.trim() || 'ธนาคารกสิกรไทย';
  const accountNumber = document.getElementById('campAccountNumInput')?.value.trim() || '236-2-47817-3';
  const accountName = document.getElementById('campAccountNameInput')?.value.trim() || 'น.ส. พิชามญธุ์ สามสี';
  const slipProvider = document.getElementById('campSlipProviderSelect')?.value || 'cloudinary';
  
  const qrInputVal = document.getElementById('campQrImageInput')?.value.trim();
  const qrPreviewSrc = document.getElementById('campQrPreviewImg')?.src || 'qr_payment.png';
  const qrImage = qrInputVal || qrPreviewSrc;
  const isOpen = document.getElementById('campStatusOpenInput')?.checked;

  if (!title || !code || amount <= 0) {
    alert("⚠️ กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ชื่อรายการ, รหัส ID, และยอดเงิน)");
    return;
  }

  let existingCampaign = editId && window.ComedCampaignManager ? window.ComedCampaignManager.getCampaignById(editId) : null;

  const campaignPayload = {
    ...(existingCampaign || {}),
    id: code,
    code: code.toUpperCase(),
    title: title,
    subtitle: subtitle,
    category: category,
    amount: amount,
    currency: "THB",
    deadline: deadline || (existingCampaign ? existingCampaign.deadline : new Date(Date.now() + 7*24*3600*1000).toISOString()),
    deadlineDisplay: deadline ? new Date(deadline).toLocaleDateString('th-TH') : (existingCampaign ? existingCampaign.deadlineDisplay : ''),
    bankName: bankName,
    accountNumber: accountNumber,
    accountName: accountName,
    qrImage: qrImage,
    slipProvider: slipProvider,
    status: isOpen ? 'open' : (existingCampaign && existingCampaign.status === 'completed' ? 'completed' : 'temp_closed'),
    updatedAt: new Date().toISOString()
  };

  if (!editId) {
    campaignPayload.createdAt = new Date().toISOString();
    campaignPayload.isDefault = false;
  }

  // 1. Save in local & sync to Supabase
  if (window.ComedCampaignManager) {
    window.ComedCampaignManager.updateCampaign(campaignPayload);
  }

  // 2. Log Admin Action
  const actionName = editId ? "แก้ไขรายการเก็บเงิน" : "สร้างรายการเก็บเงินใหม่";
  await logAdminAction(actionName, `${actionName} "${title}" (฿${amount}) รหัส ID: ${code}`);

  closeCreateCampaignModal();
  alert(`✨ บันทึกรายการ "${title}" เรียบร้อยแล้ว!`);

  // Reload or redirect to active campaign dashboard
  window.location.href = `payment-admin.html?camp=${encodeURIComponent(code)}`;
}

function toggleCampaignStatus(campId) {
  if (!window.ComedCampaignManager) return;
  const camp = window.ComedCampaignManager.getCampaignById(campId);
  if (!camp) return;

  const newStatus = (camp.status === 'open') ? 'temp_closed' : 'open';
  camp.status = newStatus;
  window.ComedCampaignManager.updateCampaign(camp);
  logAdminAction("เปลี่ยนสถานะรายการชำระ", `เปลี่ยนสถานะ "${camp.title}" เป็น ${newStatus}`);
  renderAdminCampaignsNav();
  alert(`✨ เปลี่ยนสถานะของ "${camp.title}" เป็น ${newStatus === 'open' ? 'เปิดรับชำระ' : 'ปิดชั่วคราว'} เรียบร้อย!`);
}

async function loadAllPayments(silent = false) {
  // Priority 1: Supabase
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (sb) {
    try {
      const { data, error } = await sb.from('payments').select('*').eq('campaign_id', currentAdminCampaign.id);
      if (!error && Array.isArray(data)) {
        paymentRecords = {};
        data.forEach(item => {
          paymentRecords[item.student_id] = {
            paid: !!item.paid,
            timestamp: item.timestamp || '',
            slipUrl: item.slip_url || '',
            refCode: item.ref_code || '',
            amount: item.amount || currentAdminCampaign.amount
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
        return;
      }
    } catch(err) {
      console.warn("Supabase fetch warning in admin:", err);
    }
  }

  // Priority 2: Google Apps Script Web App
  if (googleAppsScriptUrl) {
    try {
      const res = await fetch(googleAppsScriptUrl);
      if (res.ok) {
        const raw = await res.json();
        if (raw._trash) {
          trashRecords = raw._trash;
          delete raw._trash;
        }
        if (raw._issues) {
          userIssues = raw._issues;
          localStorage.setItem(ISSUES_KEY, JSON.stringify(userIssues));
          delete raw._issues;
        }
        if (raw._logs && Array.isArray(raw._logs) && raw._logs.length > 0) {
          adminLogs = raw._logs;
          localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(adminLogs));
          delete raw._logs;
        }
        paymentRecords = raw;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
        localStorage.setItem('COMED_KKU69_TRASH_RECORDS', JSON.stringify(trashRecords));
        return;
      }
    } catch (err) { }
  }

  const local = localStorage.getItem(STORAGE_KEY);
  paymentRecords = local ? JSON.parse(local) : {};
  const localTrash = localStorage.getItem('COMED_KKU69_TRASH_RECORDS');
  trashRecords = localTrash ? JSON.parse(localTrash) : {};
}

function renderStats() {
  const total = studentDatabase.length;
  let paidCount = 0;

  studentDatabase.forEach(st => {
    if (paymentRecords[st.id] && paymentRecords[st.id].paid) {
      paidCount++;
    }
  });

  const targetAmount = currentAdminCampaign.amount || 190;
  const unpaidCount = total - paidCount;
  const moneyReceived = paidCount * targetAmount;
  const unpaidMoney = unpaidCount * targetAmount;
  const totalTarget = total * targetAmount;
  const moneyPercent = totalTarget > 0 ? Math.round((moneyReceived / totalTarget) * 100) : 0;
  const paidPercent = total > 0 ? Math.round((paidCount / total) * 100) : 0;

  const elMoneyRec = document.getElementById('statMoneyReceived');
  const elMoneyPct = document.getElementById('statMoneyPercent');
  const elPaidCnt = document.getElementById('statPaidCount');
  const elPaidPct = document.getElementById('statPaidPercent');
  const elUnpaidCnt = document.getElementById('statUnpaidCount');
  const elUnpaidMon = document.getElementById('statUnpaidMoney');

  if (elMoneyRec) elMoneyRec.textContent = `฿${moneyReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  if (elMoneyPct) elMoneyPct.textContent = `${moneyPercent}%`;

  if (elPaidCnt) elPaidCnt.innerHTML = `${paidCount} <span class="text-xs font-normal text-slate-400">คน</span>`;
  if (elPaidPct) elPaidPct.textContent = `${paidPercent}%`;

  if (elUnpaidCnt) elUnpaidCnt.innerHTML = `${unpaidCount} <span class="text-xs font-normal text-slate-400">คน</span>`;
  if (elUnpaidMon) elUnpaidMon.textContent = `฿${unpaidMoney.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

  const cFPaid = document.getElementById('countFPaid');
  const cFUnpaid = document.getElementById('countFUnpaid');
  const cFTrash = document.getElementById('countFTrash');
  const cFIssues = document.getElementById('countFIssues');

  if (cFPaid) cFPaid.textContent = paidCount;
  if (cFUnpaid) cFUnpaid.textContent = unpaidCount;
  if (cFTrash) cFTrash.textContent = Object.keys(trashRecords).length;
  if (cFIssues) cFIssues.textContent = userIssues.length;
}

function setFilter(filter) {
  currentFilter = filter;
  const btnMap = {
    all: 'fBtnAll',
    paid: 'fBtnPaid',
    unpaid: 'fBtnUnpaid',
    trash: 'fBtnTrash',
    issues: 'fBtnIssues',
    admins: 'fBtnAdmins',
    logs: 'fBtnLogs'
  };

  Object.keys(btnMap).forEach(key => {
    const el = document.getElementById(btnMap[key]);
    if (!el) return;
    if (key === filter) {
      el.className = 'px-3.5 py-2 rounded-xl bg-orange-600 text-white font-bold shadow-sm transition flex items-center gap-1 cursor-pointer';
    } else {
      el.className = 'px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition flex items-center gap-1 cursor-pointer';
    }
  });

  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  const tableHead = tbody.previousElementSibling;
  const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();

  // ================= VIEW: ISSUES TAB =================
  if (currentFilter === 'issues') {
    if (tableHead) {
      tableHead.innerHTML = `
        <tr class="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
          <th class="p-3.5 text-center w-12">#</th>
          <th class="p-3.5">รหัส / ผู้แจ้ง</th>
          <th class="p-3.5">ช่องทางติดต่อ</th>
          <th class="p-3.5">หัวข้อปัญหา</th>
          <th class="p-3.5">รายละเอียด</th>
          <th class="p-3.5 text-center">หลักฐาน</th>
          <th class="p-3.5 text-center">สถานะ</th>
          <th class="p-3.5 text-center w-36">จัดการ</th>
        </tr>
      `;
    }
    if (userIssues.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-slate-500 text-xs font-bold">ไม่มีรายการแจ้งปัญหาในขณะนี้</td></tr>`;
      return;
    }
    tbody.innerHTML = userIssues.map((iss, idx) => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-3.5 text-center text-slate-500 font-mono text-xs">${idx + 1}</td>
        <td class="p-3.5 whitespace-nowrap">
          <span class="font-mono font-bold text-orange-400 block">${iss.studentId}</span>
          <span class="text-xs text-slate-300">${iss.name || ''}</span>
        </td>
        <td class="p-3.5 font-bold text-sky-400 text-xs whitespace-nowrap">${iss.contact}</td>
        <td class="p-3.5 font-bold text-amber-300 text-xs">${iss.category}</td>
        <td class="p-3.5 text-xs text-slate-300 max-w-xs break-words">${iss.detail || '-'}</td>
        <td class="p-3.5 text-center whitespace-nowrap">
          ${iss.evidenceUrl && iss.evidenceUrl !== '-'
        ? `<a href="${iss.evidenceUrl}" target="_blank" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold inline-flex items-center gap-1 border border-slate-700 active:scale-95 transition"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> ดูหลักฐาน</a>`
        : '<span class="text-slate-600 text-xs">-</span>'
      }
        </td>
        <td class="p-3.5 text-center whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${iss.status === 'แก้ไขแล้ว' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
            ${iss.status || 'รอดำเนินการ'}
          </span>
        </td>
        <td class="p-3.5 text-center whitespace-nowrap">
          ${iss.status === 'แก้ไขแล้ว'
        ? '<span class="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1"><i data-lucide="check-circle-2" class="w-4 h-4"></i> แก้ไขแล้ว</span>'
        : `<button onclick="resolveIssue('${iss.id || iss.studentId}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer">
                ทำเครื่องหมายว่าแก้แล้ว
               </button>`
      }
        </td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // ================= VIEW: ADMIN ACCOUNTS TAB =================
  if (currentFilter === 'admins') {
    if (tableHead) {
      tableHead.innerHTML = `
        <tr class="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
          <th class="p-4 text-center w-16">#</th>
          <th class="p-4">ชื่อ - นามสกุล</th>
          <th class="p-4">อีเมลแอดมิน (KKU Mail)</th>
          <th class="p-4">ตำแหน่ง / สิทธิ์</th>
          <th class="p-4">รหัสผ่าน</th>
          <th class="p-4 text-center w-40">
            <button onclick="openAddAdminModal()" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 mx-auto transition cursor-pointer">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> เพิ่ม Admin
            </button>
          </th>
        </tr>
      `;
    }
    tbody.innerHTML = adminAccounts.map((adm, idx) => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-4 text-center text-slate-500 font-mono text-xs">${idx + 1}</td>
        <td class="p-4 font-bold text-white">${adm.name}</td>
        <td class="p-4 font-mono text-xs text-sky-400">${adm.email}</td>
        <td class="p-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${adm.role === 'Super Admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-slate-800 text-slate-300'}">
            ${adm.role || 'Admin'}
          </span>
        </td>
        <td class="p-4 font-mono text-xs">
          <div class="flex items-center gap-2">
            <span id="adminPwdText_${idx}" class="text-slate-400">••••••••••</span>
            <button onclick="revealAdminPassword('${adm.email}', 'adminPwdText_${idx}')" class="text-slate-400 hover:text-white p-1 cursor-pointer" title="ดูรหัสผ่าน">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="regenerateAdminPassword('${adm.email}')" class="text-indigo-400 hover:text-indigo-300 p-1 cursor-pointer" title="สุ่มรหัสผ่านใหม่">
              <i data-lucide="dice-5" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
        <td class="p-4 text-center">
          ${adm.role !== 'Super Admin' ? `
            <button onclick="deleteAdminAccount('${adm.email}')" class="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer">
              ลบสิทธิ์
            </button>
          ` : '<span class="text-xs text-slate-600">หลัก</span>'}
        </td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // ================= VIEW: LOGS TAB =================
  if (currentFilter === 'logs') {
    if (tableHead) {
      tableHead.innerHTML = `
        <tr class="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
          <th class="p-4 text-center w-16">#</th>
          <th class="p-4 w-44">วัน - เวลา</th>
          <th class="p-4">อีเมลแอดมิน</th>
          <th class="p-4">กิจกรรม (Action)</th>
          <th class="p-4">รายละเอียด</th>
        </tr>
      `;
    }
    if (adminLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-500 text-xs font-bold">ยังไม่มีประวัติ Logs ในระบบ</td></tr>`;
      return;
    }
    tbody.innerHTML = adminLogs.map((log, idx) => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-4 text-center text-slate-500 font-mono text-xs">${idx + 1}</td>
        <td class="p-4 font-mono text-xs text-slate-400">${log.timestamp}</td>
        <td class="p-4 font-mono text-xs font-bold text-sky-400">${log.adminEmail}</td>
        <td class="p-4 font-bold text-amber-300 text-xs">${log.action}</td>
        <td class="p-4 text-xs text-slate-300">${log.detail}</td>
      </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // Restore Standard Student Table Header
  if (tableHead) {
    tableHead.innerHTML = `
      <tr class="text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-800">
        <th class="p-4 text-center w-16">ลำดับ</th>
        <th class="p-4">รหัสนักศึกษา</th>
        <th class="p-4">ชื่อ - นามสกุล</th>
        <th class="p-4">ชื่อเล่น</th>
        <th class="p-4 hidden md:table-cell">อีเมล</th>
        <th class="p-4 text-center">สถานะ</th>
        <th class="p-4 text-center">หลักฐานสลิป</th>
        <th class="p-4 text-center w-40">จัดการ</th>
      </tr>
    `;
  }

  // VIEW TRASH TAB
  if (currentFilter === 'trash') {
    const trashKeys = Object.keys(trashRecords);
    if (trashKeys.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-slate-500 text-xs font-bold">ไม่มีข้อมูลในถังขยะ</td></tr>`;
      return;
    }

    tbody.innerHTML = trashKeys.map((id, idx) => {
      const item = trashRecords[id];
      return `
        <tr class="hover:bg-amber-950/20 transition bg-amber-950/10">
          <td class="p-4 text-center text-slate-500 font-mono text-xs">${idx + 1}</td>
          <td class="p-4 font-mono font-bold text-amber-300">${item.studentId}</td>
          <td class="p-4 font-bold text-slate-200">${item.name || '-'}</td>
          <td class="p-4"><span class="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">น้อง${item.nickname || '-'}</span></td>
          <td class="p-4 hidden md:table-cell text-slate-400 font-mono text-xs">${item.email || '-'}</td>
          <td class="p-4 text-center"><span class="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> อยู่ในถังขยะ</span></td>
          <td class="p-4 text-center">
            ${item.slipUrl
          ? `<button onclick="inspectSlipDirect('${item.studentId}', '${item.name}', '${item.nickname}', '${item.slipUrl}', '${item.timestamp}', '${item.refCode}')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition flex items-center gap-1 mx-auto border border-slate-700 cursor-pointer">
                  <i data-lucide="image" class="w-3.5 h-3.5"></i> ดูสลิป
                 </button>`
          : '<span class="text-xs text-slate-600">-</span>'
        }
          </td>
          <td class="p-4 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="adminRestoreFromTrash('${item.studentId}')" class="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition cursor-pointer" title="กู้คืน">
                กู้คืน
              </button>
              <button onclick="adminDeletePermanently('${item.studentId}')" class="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer" title="ลบถาวร">
                ลบถาวร
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // VIEW NORMAL TABS (ALL, PAID, UNPAID)
  let list = studentDatabase.filter(st => {
    const isPaid = paymentRecords[st.id] && paymentRecords[st.id].paid;
    if (currentFilter === 'paid' && !isPaid) return false;
    if (currentFilter === 'unpaid' && isPaid) return false;

    if (searchVal) {
      const matchStr = `${st.id} ${st.name} ${st.nickname} ${st.email}`.toLowerCase();
      return matchStr.includes(searchVal);
    }
    return true;
  });

  tbody.innerHTML = list.map((st, idx) => {
    const record = paymentRecords[st.id];
    const isPaid = record && record.paid;
    const slipUrl = record?.slipUrl || '';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-4 text-center text-slate-500 font-mono text-xs">${idx + 1}</td>
        <td class="p-4 font-mono font-bold text-white">${st.id}</td>
        <td class="p-4 font-bold text-slate-200">${st.name}</td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs border border-orange-500/20">
            น้อง${st.nickname}
          </span>
        </td>
        <td class="p-4 hidden md:table-cell text-slate-400 font-mono text-xs">${st.email}</td>
        <td class="p-4 text-center">
          ${isPaid
        ? '<span class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><i data-lucide="check" class="w-3.5 h-3.5"></i> จ่ายแล้ว (฿190)</span>'
        : '<span class="inline-flex items-center gap-1 text-[11px] font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20"><i data-lucide="x" class="w-3.5 h-3.5"></i> ยังไม่จ่าย</span>'
      }
        </td>
        <td class="p-4 text-center">
          ${isPaid && slipUrl
        ? `<button onclick="inspectSlip('${st.id}')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition flex items-center gap-1 mx-auto border border-slate-700 cursor-pointer">
                <i data-lucide="image" class="w-3.5 h-3.5"></i> ดูสลิป
               </button>`
        : '<span class="text-xs text-slate-600">-</span>'
      }
        </td>
        <td class="p-4 text-center">
          ${isPaid
        ? `<button onclick="adminMoveToTrash('${st.id}')" class="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 mx-auto cursor-pointer">
                <i data-lucide="trash-2" class="w-3 h-3"></i> ย้ายไปถังขยะ
               </button>`
        : `<button onclick="openAdminUploadModal('${st.id}')" class="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 mx-auto cursor-pointer">
                <i data-lucide="upload" class="w-3 h-3"></i> ยืนยันชำระ (แนบสลิป)
               </button>`
      }
        </td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= ADMIN MANUAL PAYMENT WITH SLIP =================
let currentAdminTargetStudent = null;
let adminTempSlipBase64 = null;

function openAdminUploadModal(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  if (!st) return;
  currentAdminTargetStudent = st;
  adminTempSlipBase64 = null;

  const infoEl = document.getElementById('adminModalStudentInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="flex justify-between"><span class="text-slate-400">ชื่อ-นามสกุล:</span><span class="font-bold text-white">${st.name} (น้อง${st.nickname})</span></div>
      <div class="flex justify-between"><span class="text-slate-400">รหัสนักศึกษา:</span><span class="font-mono text-orange-400 font-bold">${st.id}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">ยอดชำระ:</span><span class="font-bold text-emerald-400">฿190 บาท</span></div>
    `;
  }

  const promptEl = document.getElementById('adminSlipUploadPrompt');
  const prevEl = document.getElementById('adminSlipPreviewContainer');
  const fi = document.getElementById('adminSlipFileInput');
  const modal = document.getElementById('modalAdminUploadSlip');

  if (promptEl) promptEl.classList.remove('hidden');
  if (prevEl) prevEl.classList.add('hidden');
  if (fi) fi.value = '';
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeAdminUploadModal() {
  const modal = document.getElementById('modalAdminUploadSlip');
  if (modal) modal.classList.add('hidden');
}

function handleAdminSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert("⚠️ ขนาดไฟล์ภาพเกิน 10 MB กรุณาเลือกไฟล์ใหม่");
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    adminTempSlipBase64 = ev.target.result;
    const prevImg = document.getElementById('adminSlipPreviewImg');
    const promptEl = document.getElementById('adminSlipUploadPrompt');
    const prevEl = document.getElementById('adminSlipPreviewContainer');

    if (prevImg) prevImg.src = adminTempSlipBase64;
    if (promptEl) promptEl.classList.add('hidden');
    if (prevEl) prevEl.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function submitAdminManualPayment() {
  if (!currentAdminTargetStudent) return;
  if (!adminTempSlipBase64) {
    alert("⚠️ กรุณาแนบภาพสลิปหลักฐานก่อนกดยืนยัน");
    return;
  }

  const btn = document.getElementById('btnAdminConfirmPay');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>กำลังอัปโหลดขึ้น Drive & Sheets...</span>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const studentId = currentAdminTargetStudent.id;
  const timestamp = new Date().toLocaleString('th-TH');
  const refCode = "ADMIN-VERIFIED-" + Date.now();

  paymentRecords[studentId] = {
    paid: true,
    timestamp: timestamp,
    slipUrl: adminTempSlipBase64,
    refCode: refCode,
    amount: 190
  };

  if (googleAppsScriptUrl) {
    try {
      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          name: currentAdminTargetStudent.name,
          nickname: currentAdminTargetStudent.nickname,
          email: currentAdminTargetStudent.email,
          slipBase64: adminTempSlipBase64,
          timestamp: timestamp,
          refCode: refCode,
          source: "Admin Manual Verified"
        })
      });
    } catch (err) { }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
  logAdminAction("ยืนยันการชำระเงิน", `แอดมินยืนยันยอดเงิน ฿190 พร้อมแนบสลิปให้ ${currentAdminTargetStudent.name} (${studentId})`);

  closeAdminUploadModal();
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันและอัปโหลดขึ้น Cloud</span>`;
  }
  renderStats();
  renderAdminTable();
  showToastNotification(`✅ บันทึกและอัปโหลดสลิปของ ${currentAdminTargetStudent.name} ขึ้น Cloud สำเร็จ!`);
}

// ================= ADMIN ACCOUNT MANAGEMENT =================
function openAddAdminModal() {
  const nIn = document.getElementById('newAdminNameInput');
  const eIn = document.getElementById('newAdminEmailInput');
  const pIn = document.getElementById('newAdminPasswordInput');
  const modal = document.getElementById('modalAddAdmin');

  if (nIn) nIn.value = '';
  if (eIn) eIn.value = '';
  if (pIn) pIn.value = generateSecurePassword(10);
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeAddAdminModal() {
  const modal = document.getElementById('modalAddAdmin');
  if (modal) modal.classList.add('hidden');
}

function generateRandomPasswordForNewAdmin() {
  const pIn = document.getElementById('newAdminPasswordInput');
  if (pIn) pIn.value = generateSecurePassword(10);
}

function handleCreateAdminSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newAdminNameInput')?.value.trim() || '';
  const email = document.getElementById('newAdminEmailInput')?.value.trim().toLowerCase() || '';
  const password = document.getElementById('newAdminPasswordInput')?.value.trim() || '';

  if (adminAccounts.some(a => a.email.toLowerCase() === email)) {
    alert("⚠️ อีเมลนี้มีอยู่ในระบบผู้ดูแลระบบแล้ว");
    return;
  }

  const newAdmin = { email, name, password, role: 'Admin' };
  adminAccounts.push(newAdmin);
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(adminAccounts));
  logAdminAction("เพิ่มผู้ดูแลระบบ", `เพิ่มแอดมินใหม่: ${name} (${email})`);

  closeAddAdminModal();
  renderAdminTable();
  showToastNotification(`✨ เพิ่มผู้ดูแลระบบ "${name}" สำเร็จเรียบร้อย!`);
}

function revealAdminPassword(email, elementId) {
  const adm = adminAccounts.find(a => a.email === email);
  if (!adm) return;
  const el = document.getElementById(elementId);
  if (!el) return;
  if (el.textContent.includes('•')) {
    el.textContent = adm.password || '(รหัสเข้ารหัส SHA-256)';
    el.classList.remove('text-slate-400');
    el.classList.add('text-emerald-400', 'font-bold');
  } else {
    el.textContent = '••••••••••';
    el.classList.remove('text-emerald-400', 'font-bold');
    el.classList.add('text-slate-400');
  }
}

function regenerateAdminPassword(email) {
  const adm = adminAccounts.find(a => a.email === email);
  if (!adm) return;
  const newPwd = generateSecurePassword(10);
  if (confirm(`คุณต้องการสุ่มรหัสผ่านใหม่ให้กับ "${adm.name}" หรือไม่?\n\nรหัสผ่านใหม่ที่จะตั้งคือ: ${newPwd}`)) {
    adm.password = newPwd;
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(adminAccounts));
    logAdminAction("เปลี่ยนรหัสผ่านแอดมิน", `สุ่มรหัสผ่านใหม่ให้กับ ${adm.email}`);
    renderAdminTable();
    alert(`✅ รหัสผ่านใหม่ของ ${adm.name} คือ:\n\n${newPwd}\n\n(โปรดแจ้งรหัสนี้ให้กับผู้ใช้)`);
  }
}

function deleteAdminAccount(email) {
  if (confirm(`คุณต้องการลบสิทธิ์ผู้ดูแลระบบของอีเมล "${email}" ใช่หรือไม่?`)) {
    adminAccounts = adminAccounts.filter(a => a.email !== email);
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(adminAccounts));
    logAdminAction("ลบผู้ดูแลระบบ", `ลบสิทธิ์แอดมิน ${email}`);
    renderAdminTable();
    showToastNotification(`ลบสิทธิ์แอดมิน ${email} เรียบร้อยแล้ว`);
  }
}

async function resolveIssue(issueId) {
  const iss = userIssues.find(i => (i.id === issueId || i.studentId === issueId));
  if (iss) {
    iss.status = 'แก้ไขแล้ว';
    localStorage.setItem(ISSUES_KEY, JSON.stringify(userIssues));
    if (googleAppsScriptUrl) {
      try {
        fetch(googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: "update_issue_status", issueId: iss.id || issueId, newStatus: "แก้ไขแล้ว" })
        });
      } catch (e) { }
    }
    logAdminAction("แก้ไขปัญหาผู้ใช้", `ทำเครื่องหมายปัญหาของ ${iss.studentId} (${iss.name || ''}) ว่าแก้ไขแล้ว`);
    renderStats();
    renderAdminTable();
    showToastNotification(`✅ ทำเครื่องหมายว่าแก้ไขปัญหาเรียบร้อยแล้ว`);
  }
}

// 1. Move to Trash
async function adminMoveToTrash(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  const name = st ? st.name : studentId;

  if (confirm(`คุณต้องการยกเลิกสถานะของ "${name}" และย้ายไปยังถังขยะใช่หรือไม่?\n\n• แถวในชีตจะย้ายไปแท็บ "Trash_ถังขยะ"\n• ไฟล์สลิปใน Drive จะย้ายไปโฟลเดอร์ "Trash_Slips_ถังขยะ"`)) {
    const record = paymentRecords[studentId] || {};
    const slipUrl = record.slipUrl || '';

    trashRecords[studentId] = {
      studentId: studentId,
      name: st?.name || '',
      nickname: st?.nickname || '',
      email: st?.email || '',
      slipUrl: slipUrl,
      timestamp: new Date().toLocaleString('th-TH'),
      refCode: record.refCode || ''
    };
    delete paymentRecords[studentId];

    if (googleAppsScriptUrl) {
      try {
        fetch(googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: "move_to_trash",
            studentId: studentId,
            name: st?.name || '',
            nickname: st?.nickname || '',
            email: st?.email || '',
            slipUrl: slipUrl
          })
        });
      } catch (e) { }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
    localStorage.setItem('COMED_KKU69_TRASH_RECORDS', JSON.stringify(trashRecords));
    logAdminAction("ย้ายไปถังขยะ", `ย้ายข้อมูลของ ${name} (${studentId}) ไปถังขยะ`);
    renderStats();
    renderAdminTable();
    showToastNotification(`ย้ายข้อมูลของ ${name} ไปถังขยะเรียบร้อย`);
  }
}

// 2. Restore from Trash
async function adminRestoreFromTrash(studentId) {
  const item = trashRecords[studentId];
  if (!item) return;

  if (confirm(`ต้องการกู้คืนข้อมูลของ "${item.name}" กลับสู่รายการชำระเงินปกติใช่หรือไม่?`)) {
    paymentRecords[studentId] = {
      paid: true,
      timestamp: item.timestamp || new Date().toLocaleString('th-TH'),
      slipUrl: item.slipUrl || '',
      refCode: item.refCode || '',
      amount: 190
    };
    delete trashRecords[studentId];

    if (googleAppsScriptUrl) {
      try {
        fetch(googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: "restore",
            studentId: studentId
          })
        });
      } catch (e) { }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
    localStorage.setItem('COMED_KKU69_TRASH_RECORDS', JSON.stringify(trashRecords));
    logAdminAction("กู้คืนข้อมูล", `กู้คืนข้อมูลของ ${item.name} (${studentId}) จากถังขยะ`);
    renderStats();
    renderAdminTable();
    showToastNotification(`กู้คืนข้อมูลของ ${item.name} สำเร็จ`);
  }
}

// 3. Delete Permanently
async function adminDeletePermanently(studentId) {
  const item = trashRecords[studentId];
  if (!item) return;

  if (confirm(`⚠️ คำเตือน: คุณต้องการลบข้อมูลของ "${item.name}" อย่างถาวรใช่หรือไม่?\n\n• แถวข้อมูลในชีตถังขยะจะถูกลบ\n• ไฟล์สลิปใน Google Drive จะถูกลบทันที`)) {
    delete trashRecords[studentId];

    if (googleAppsScriptUrl) {
      try {
        fetch(googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: "delete_permanently",
            studentId: studentId
          })
        });
      } catch (e) { }
    }

    localStorage.setItem('COMED_KKU69_TRASH_RECORDS', JSON.stringify(trashRecords));
    logAdminAction("ลบถาวร", `ลบข้อมูลและสลิปของ ${item.name} (${studentId}) ถาวร`);
    renderStats();
    renderAdminTable();
    showToastNotification(`ลบข้อมูลของ ${item.name} อย่างถาวรแล้ว`);
  }
}

function inspectSlipDirect(studentId, name, nickname, slipUrl, timestamp, refCode) {
  let drivePreviewUrl = slipUrl;
  let driveViewUrl = slipUrl;
  if (slipUrl.includes('drive.google.com')) {
    const idMatch = slipUrl.match(/[-\w]{25,}/);
    if (idMatch) {
      drivePreviewUrl = `https://drive.google.com/file/d/${idMatch[0]}/preview`;
      driveViewUrl = `https://drive.google.com/file/d/${idMatch[0]}/view?usp=sharing`;
    }
  }

  const content = document.getElementById('inspectorContent');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div class="flex justify-between"><span class="text-slate-500">ชื่อ-นามสกุล:</span><span class="font-bold text-white">${name} (น้อง${nickname})</span></div>
        <div class="flex justify-between"><span class="text-slate-500">รหัสนักศึกษา:</span><span class="font-mono text-orange-400 font-bold">${studentId}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">วัน-เวลา:</span><span class="text-slate-300 font-mono">${timestamp || '-'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">รหัสอ้างอิง:</span><span class="text-slate-400 font-mono">${refCode || '-'}</span></div>
      </div>
      <div class="w-full h-96 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col relative">
        <iframe src="${drivePreviewUrl}" class="w-full h-full border-0 rounded-2xl" allow="autoplay" loading="lazy"></iframe>
      </div>
      <div class="flex items-center justify-between gap-2 pt-1">
        <a href="${driveViewUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/25">
          <i data-lucide="external-link" class="w-4 h-4"></i><span>เปิดดูรูปเต็มบน Google Drive</span>
        </a>
        <button onclick="closeInspectorModal()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">ปิดหน้าต่าง</button>
      </div>
    </div>
  `;
  const modal = document.getElementById('modalSlipInspector');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function inspectSlip(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  const record = paymentRecords[studentId];
  if (!st || !record) return;

  const rawSlipUrl = record.slipUrl || '';
  let drivePreviewUrl = rawSlipUrl;
  let driveViewUrl = rawSlipUrl;

  if (rawSlipUrl.includes('drive.google.com')) {
    const idMatch = rawSlipUrl.match(/[-\w]{25,}/);
    if (idMatch) {
      const fileId = idMatch[0];
      drivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      driveViewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
  }

  const content = document.getElementById('inspectorContent');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">ชื่อ-นามสกุล:</span>
          <span class="font-bold text-white">${st.name} (น้อง${st.nickname})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">รหัสนักศึกษา:</span>
          <span class="font-mono text-orange-400 font-bold">${st.id}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">วัน-เวลาที่ส่ง:</span>
          <span class="text-slate-300 font-mono">${record.timestamp || '-'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">รหัสอ้างอิง:</span>
          <span class="text-slate-400 font-mono">${record.refCode || '-'}</span>
        </div>
      </div>

      <div class="w-full h-96 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col relative">
        <iframe 
          src="${drivePreviewUrl}" 
          class="w-full h-full border-0 rounded-2xl" 
          allow="autoplay"
          loading="lazy"
        ></iframe>
      </div>

      <div class="flex items-center justify-between gap-2 pt-1">
        <a href="${driveViewUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/25">
          <i data-lucide="external-link" class="w-4 h-4"></i>
          <span>เปิดดูรูปเต็มบน Google Drive</span>
        </a>
        <button onclick="closeInspectorModal()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  `;

  const modal = document.getElementById('modalSlipInspector');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeInspectorModal() {
  const modal = document.getElementById('modalSlipInspector');
  if (modal) modal.classList.add('hidden');
}

async function refreshDataFromCloud() {
  const icon = document.getElementById('adminRefreshIcon');
  if (icon && typeof gsap !== 'undefined') {
    gsap.to(icon, { rotation: "+=360", duration: 0.6, ease: "power2.inOut" });
  }

  // Showing animated loading toast popup
  const loadingToast = showLoadingToast("🔄 กำลังดึงและซิงค์ข้อมูลล่าสุดจาก Google Cloud...");

  await loadAllPayments();
  renderStats();
  renderAdminTable();

  setTimeout(() => {
    if (loadingToast) loadingToast.remove();
    showToastNotification("✨ ซิงค์ข้อมูลล่าสุดจาก Google Cloud สำเร็จเรียบร้อยแล้ว!");
  }, 500);
}

function showLoadingToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900/90 text-sky-300 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-2xl border border-sky-500/40 flex items-center gap-2.5 backdrop-blur-xl';
  toast.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin text-sky-400"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(toast, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
  }
  return toast;
}

function showToastNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-2.5 backdrop-blur-xl';
  toast.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-white"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(toast, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.5)" });
    setTimeout(() => {
      gsap.to(toast, { opacity: 0, y: 20, scale: 0.9, duration: 0.3, onComplete: () => toast.remove() });
    }, 3000);
  } else {
    setTimeout(() => toast.remove(), 3000);
  }
}

function openExportModal() {
  const modal = document.getElementById('modalExportExcelConfig');
  const card = document.getElementById('exportModalCard');
  if (!modal) return;
  modal.classList.remove('hidden');
  if (typeof gsap !== 'undefined' && card) {
    gsap.fromTo(card,
      { opacity: 0, scale: 0.85, y: 25 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExportModal() {
  const modal = document.getElementById('modalExportExcelConfig');
  if (modal) modal.classList.add('hidden');
}

async function executeCustomExcelExport() {
  // Get User Selections
  const sortOpt = document.querySelector('input[name="exportSortOption"]:checked')?.value || 'default';
  const colorStyle = document.querySelector('input[name="exportColorStyle"]:checked')?.value || 'highlight';

  closeExportModal();

  // 1. Show loading toast
  const loadingToast = (typeof showLoadingToast === 'function') 
    ? showLoadingToast("📊 กำลังประมวลผลข้อมูลและสร้างไฟล์ Excel แท้ (.xlsx)...") 
    : null;

  // 2. Fetch fresh real-time data from Cloud & LocalStorage
  try {
    await loadAllPayments(true);
  } catch(e) {}

  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) paymentRecords = JSON.parse(local);
  } catch(e) {}

  // 3. Prepare base dataset
  let dataset = studentDatabase.map((st, idx) => {
    const record = paymentRecords[st.id];
    const isPaid = !!(record && record.paid);
    return {
      originalIndex: idx + 1,
      id: st.id,
      name: st.name,
      nickname: `น้อง${st.nickname}`,
      email: st.email,
      isPaid: isPaid,
      statusText: isPaid ? "ชำระเงินแล้ว" : "ยังไม่ชำระเงิน",
      statusVisual: isPaid ? "✔ ชำระเงินแล้ว" : "✖ ยังไม่ชำระเงิน",
      amount: isPaid ? (record.amount || 190) : 0,
      timestamp: record?.timestamp || "-",
      refCode: record?.refCode || "-",
      slipUrl: record?.slipUrl || "-"
    };
  });

  // 4. Apply Custom Filtering and Sorting
  if (sortOpt === 'paid_top') {
    dataset.sort((a, b) => (b.isPaid - a.isPaid));
  } else if (sortOpt === 'paid_bottom') {
    dataset.sort((a, b) => (a.isPaid - b.isPaid));
  } else if (sortOpt === 'paid_only') {
    dataset = dataset.filter(d => d.isPaid);
  } else if (sortOpt === 'unpaid_only') {
    dataset = dataset.filter(d => !d.isPaid);
  }

  // 5. Generate True Binary XLSX Workbook with Style (xlsx-js-style)
  if (typeof XLSX === 'undefined') {
    alert("ไม่พบโมดูล XLSX สำหรับดาวน์โหลด");
    if (loadingToast) loadingToast.remove();
    return;
  }

  const wb = XLSX.utils.book_new();

  const headers = [
    "ลำดับ",
    "รหัสนักศึกษา",
    "ชื่อ - นามสกุล",
    "ชื่อเล่น",
    "อีเมล (KKU Mail)",
    "สถานะการชำระเงิน",
    "ยอดเงิน (บาท)",
    "วัน-เวลาที่ชำระ",
    "รหัสอ้างอิง",
    "ลิงก์ภาพสลิป"
  ];

  let paidCount = 0;
  let totalAmount = 0;

  const rows = dataset.map((item, idx) => {
    if (item.isPaid) {
      paidCount++;
      totalAmount += item.amount;
    }

    const statusDisplay = (colorStyle === 'highlight') ? item.statusVisual : item.statusText;

    return [
      idx + 1,
      item.id,
      item.name,
      item.nickname,
      item.email,
      statusDisplay,
      item.amount,
      item.timestamp,
      item.refCode,
      item.slipUrl
    ];
  });

  const sheetData = [headers, ...rows];
  const wsPayments = XLSX.utils.aoa_to_sheet(sheetData);

  // Set Column Widths
  wsPayments['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 16 }, // รหัสนักศึกษา
    { wch: 28 }, // ชื่อ - นามสกุล
    { wch: 12 }, // ชื่อเล่น
    { wch: 32 }, // อีเมล
    { wch: 20 }, // สถานะ
    { wch: 14 }, // ยอดเงิน
    { wch: 24 }, // วันเวลา
    { wch: 20 }, // รหัสอ้างอิง
    { wch: 45 }  // ลิงก์สลิป
  ];

  // Style Table Cells (Header Dark Navy + Row Colors for Highlights)
  const range = XLSX.utils.decode_range(wsPayments['!ref']);

  // 1. Style Header Row
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!wsPayments[cellRef]) continue;
    wsPayments[cellRef].s = {
      font: { name: "Prompt", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "334155" } },
        bottom: { style: "medium", color: { rgb: "334155" } },
        left: { style: "thin", color: { rgb: "334155" } },
        right: { style: "thin", color: { rgb: "334155" } }
      }
    };
  }

  // 2. Style Data Rows
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const item = dataset[R - 1];
    const isPaid = item?.isPaid;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsPayments[cellRef]) continue;

      // Default styling
      const cellStyle = {
        font: { name: "Prompt", sz: 10, color: { rgb: "0F172A" } },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } }
        },
        alignment: { vertical: "center" }
      };

      // Alignment rules
      if (C === 0 || C === 1 || C === 3 || C === 5 || C === 7 || C === 8) {
        cellStyle.alignment.horizontal = "center";
      } else if (C === 6) {
        cellStyle.alignment.horizontal = "right";
      }

      // Student ID formatting
      if (C === 1) {
        cellStyle.font.bold = true;
        wsPayments[cellRef].t = 's'; // Force string so dashes and zeros are preserved
      }

      // Highlight Mode Colors
      if (colorStyle === 'highlight') {
        if (C === 5) {
          // Status Column: Green for Paid, Red for Unpaid
          cellStyle.fill = { fgColor: { rgb: isPaid ? "DCFCE7" : "FEE2E2" } };
          cellStyle.font = { name: "Prompt", sz: 10, bold: true, color: { rgb: isPaid ? "15803D" : "B91C1C" } };
        } else if (C === 6 && isPaid) {
          cellStyle.font.color = { rgb: "15803D" };
          cellStyle.font.bold = true;
        }
      }

      // Slip Link formatting
      if (C === 9 && item?.slipUrl && item.slipUrl !== '-') {
        cellStyle.font = { name: "Prompt", sz: 10, color: { rgb: "EA580C" }, underline: true };
      }

      wsPayments[cellRef].s = cellStyle;
    }
  }

  XLSX.utils.book_append_sheet(wb, wsPayments, "รายชื่อและการชำระเงิน");

  // 6. Summary Sheet
  const summaryData = [
    { "รายการ": "สาขาวิชา", "รายละเอียด": "คอมพิวเตอร์ศึกษา (รหัส 69) คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น" },
    { "รายการ": "โครงการ / รายการ", "รายละเอียด": "ค่าทำป้ายสาขาวิชาเอก คนละ ฿190" },
    { "รายการ": "รูปแบบรายงาน", "รายละเอียด": getExportModeTitle(sortOpt) },
    { "รายการ": "รูปแบบสี", "รายละเอียด": colorStyle === 'highlight' ? "แบบ Highlight สี (เขียว=จ่ายแล้ว, แดง=ยังไม่จ่าย)" : "แบบปกติ (Clean)" },
    { "รายการ": "จำนวนรายการในรายงาน", "รายละเอียด": `${rows.length} คน` },
    { "รายการ": "ชำระเงินแล้ว (ในรายงาน)", "รายละเอียด": `${paidCount} คน` },
    { "รายการ": "ยังไม่ชำระเงิน (ในรายงาน)", "รายละเอียด": `${rows.length - paidCount} คน` },
    { "รายการ": "ยอดเงินรวมในรายงาน", "รายละเอียด": `฿${totalAmount.toLocaleString()} บาท` },
    { "รายการ": "วันที่ส่งออกรายงาน (Export Date)", "รายละเอียด": new Date().toLocaleString('th-TH') }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 70 }];
  
  // Style Summary Sheet Header
  const summaryRange = XLSX.utils.decode_range(wsSummary['!ref']);
  for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (wsSummary[cellRef]) {
      wsSummary[cellRef].s = {
        font: { name: "Prompt", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0F172A" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปภาพรวม");

  // 7. Write and Download True Native .xlsx File
  const nowStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ComEd69_Report_${sortOpt}_${nowStr}.xlsx`);

  if (loadingToast) loadingToast.remove();
  if (typeof showToastNotification === 'function') {
    showToastNotification(`✨ ส่งออกไฟล์ Excel แท้ (.xlsx) สำเร็จ (${rows.length} รายการ)`);
  }
}

function getExportModeTitle(opt) {
  switch(opt) {
    case 'paid_top': return 'เรียงคนที่ชำระเงินแล้วไว้ด้านบน';
    case 'paid_bottom': return 'เรียงคนที่ชำระเงินแล้วไว้ด้านล่าง';
    case 'paid_only': return 'เฉพาะผู้ที่ชำระเงินแล้ว';
    case 'unpaid_only': return 'เฉพาะผู้ที่ยังไม่ชำระเงิน';
    default: return 'ปกติ (เรียงตามลำดับรหัสนักศึกษา 60 คน)';
  }
}

// Default fallback
async function exportToExcel() {
  openExportModal();
}
