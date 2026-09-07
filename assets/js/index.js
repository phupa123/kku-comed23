
// ================= APPLY DYNAMIC CMS & CAMPAIGN CONFIGS =================
function applyDynamicCMS() {
  try {
    const storedCfg = localStorage.getItem("COMED_KKU69_INDEX_CONFIG_V1");
    if (storedCfg) {
      const cfg = JSON.parse(storedCfg);
      // Top Announcement
      const annWrap = document.getElementById("topAnnouncementWrap");
      const annText = document.getElementById("topAnnouncementText");
      if (annWrap && annText) {
        if (cfg.announcementActive && cfg.announcementText) {
          annText.textContent = cfg.announcementText;
          annWrap.classList.remove("hidden");
        } else {
          annWrap.classList.add("hidden");
        }
      }
    }
  } catch(e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  applyDynamicCMS();
});

/**
 * =========================================================================
 * INDEX PAGE LOGIC - assets/js/index.js
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

// Initialize Lucide Icons
if (typeof lucide !== 'undefined' && lucide.createIcons) {
  lucide.createIcons();
}

// ================= GOOGLE AUTHENTICATION SYSTEM (KKUMAIL ONLY) =================
const GOOGLE_CLIENT_ID = "799199144896-9tft22kns4jjv40lk19oul9dp1mprmb4.apps.googleusercontent.com";

function openGoogleLoginModal() {
  const modal = document.getElementById('modalGoogleLogin');
  const card = document.getElementById('googleLoginCard');
  if (!modal || !card) return;

  modal.classList.remove('hidden');
  const authErr = document.getElementById('googleAuthError');
  if (authErr) authErr.classList.add('hidden');
  
  // GSAP Spring Entrance Animation
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.8, y: 30, rotationX: 10 }, 
      { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: 0.45, ease: "back.out(1.6)" }
    );
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Render Official Google Sign-in Button & Reset Prompt
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
      });

      const btnWrapper = document.getElementById('googleButtonWrapper');
      if (btnWrapper) {
        btnWrapper.innerHTML = ''; // Clear old instance
        google.accounts.id.renderButton(
          btnWrapper,
          { theme: "outline", size: "large", width: 280, text: "signin_with", shape: "pill", logo_alignment: "left" }
        );
      }

      // Prompt account selection
      google.accounts.id.prompt();
    }
  } catch (e) {
    console.warn("Google One-Tap Init", e);
  }
}

function closeGoogleLoginModal() {
  const modal = document.getElementById('modalGoogleLogin');
  const card = document.getElementById('googleLoginCard');
  if (!modal || !card) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.85,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

// Decode JWT from Google
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

function handleGoogleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  if (!data || !data.email) {
    showAuthError("ไม่สามารถดึงข้อมูลบัญชีจาก Google ได้");
    return;
  }

  validateAndSetUser(data.email, data.name || data.email, data.picture || "");
}

function validateAndSetUser(email, name, avatarUrl) {
  const emailLower = email.toLowerCase().trim();

  // CRITICAL CHECK: MUST BE @kkumail.com (ยกเว้น phupa5874@gmail.com กรณีพิเศษสำหรับทดสอบระบบ/แอดมิน)
  const isSpecialTester = (emailLower === 'phupa5874@gmail.com');
  if (!emailLower.endsWith('@kkumail.com') && !isSpecialTester) {
    closeGoogleLoginModal();
    showAuthErrorPopup(emailLower);
    return;
  }

  // Check if student is in COMED 69 database
  const student = (window.STUDENTS_DATA || []).find(st => st.email.toLowerCase() === emailLower);

  const userSession = {
    email: emailLower,
    name: student ? student.name : (isSpecialTester ? 'ภูผา (ผู้ดูแลระบบ & ทดสอบระบบ)' : name),
    nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
    studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : ''),
    avatar: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${emailLower}`,
    isSpecialTester: isSpecialTester,
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(userSession));
  updateUserUI(userSession);
  closeGoogleLoginModal();
  
  // Trigger Luxury Welcome Success Popup
  showLoginSuccessPopup(userSession);
}

function showLoginSuccessPopup(user) {
  const modal = document.getElementById('modalLoginSuccess');
  const card = document.getElementById('loginSuccessCard');
  const avatar = document.getElementById('welcomeSuccessAvatar');
  const name = document.getElementById('welcomeSuccessName');
  const email = document.getElementById('welcomeSuccessEmail');

  if (!modal || !card) return;

  if (avatar) avatar.src = user.avatar;
  if (name) name.textContent = user.nickname ? `${user.name} (น้อง${user.nickname})` : user.name;
  if (email) email.textContent = user.email;

  modal.classList.remove('hidden');
  
  // GSAP Pop & Spring Animation
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.6, y: 50 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" }
    );
  }

  // Confetti Explosion
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeLoginSuccessModal() {
  const modal = document.getElementById('modalLoginSuccess');
  const card = document.getElementById('loginSuccessCard');
  if (!modal || !card) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.8,
      y: -30,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

function showAuthError(msg) {
  const errBox = document.getElementById('googleAuthError');
  const errText = document.getElementById('googleAuthErrorText');
  if (errText) errText.textContent = msg;
  if (errBox) errBox.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function showAuthErrorPopup(invalidEmail) {
  const modal = document.getElementById('modalAuthErrorPopup');
  const card = document.getElementById('authErrorCard');
  const emailEl = document.getElementById('authErrorPopupEmail');

  if (!modal || !card) return;

  if (emailEl) emailEl.textContent = invalidEmail;
  modal.classList.remove('hidden');

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.6, y: 50 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.8)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeAuthErrorPopup() {
  const modal = document.getElementById('modalAuthErrorPopup');
  const card = document.getElementById('authErrorCard');
  if (!modal || !card) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.8,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

function retryGoogleLoginWithKku() {
  closeAuthErrorPopup();
  setTimeout(() => {
    openGoogleLoginModal();
  }, 300);
}

function updateUserUI(user) {
  const guestNav = document.getElementById('navUserGuest');
  const loggedNav = document.getElementById('navUserLoggedIn');
  const avatarEl = document.getElementById('navUserAvatar');
  const nameEl = document.getElementById('navUserName');
  const emailEl = document.getElementById('navUserEmail');

  if (user && user.email) {
    if (guestNav) guestNav.classList.add('hidden');
    if (loggedNav) {
      loggedNav.classList.remove('hidden');
      loggedNav.classList.add('flex');
    }
    if (avatarEl) avatarEl.src = user.avatar;
    if (nameEl) nameEl.textContent = user.nickname ? `${user.name} (${user.nickname})` : user.name;
    if (emailEl) emailEl.textContent = user.email;

    // Auto Enrich Student Info from window.STUDENTS_DATA if missing
    if (!user.studentId && window.STUDENTS_DATA) {
      const st = window.STUDENTS_DATA.find(s => s.email.toLowerCase() === user.email.toLowerCase());
      if (st) {
        user.studentId = st.id;
        user.name = st.name;
        user.nickname = st.nickname;
        localStorage.setItem('COMED_USER_SESSION', JSON.stringify(user));
      }
    }

    // Fetch Real-time Payment Status from Cloud
    checkUserPaymentStatus(user);
  } else {
    if (guestNav) guestNav.classList.remove('hidden');
    if (loggedNav) {
      loggedNav.classList.add('hidden');
      loggedNav.classList.remove('flex');
    }
    resetPaymentCardStatus();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Check Cloud Payment Record
async function checkUserPaymentStatus(user) {
  const box = document.getElementById('card1UserStatusBox');
  const icon = document.getElementById('card1StatusIcon');
  const title = document.getElementById('card1StatusTitle');
  const sub = document.getElementById('card1StatusSubtitle');
  const btn = document.getElementById('card1StatusActionBtn');
  const payBtn = document.getElementById('card1PayBtn');

  if (!user || !box) return;

  const myId = (user.studentId || '').replace(/-/g, '').trim();
  const myEmail = (user.email || '').toLowerCase().trim();
  const myName = (user.name || '').trim();
  const userNickOrName = user.nickname ? `น้อง${user.nickname}` : (user.name ? user.name.split(' ')[0] : 'คุณ');

  // 1. Initial State: "กำลังค้นหาข้อมูลการชำระเงิน..." with smooth pulse animation
  box.className = "p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 text-xs flex items-center justify-between shadow-xs transition-all duration-300";
  if (icon) {
    icon.className = "w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold";
    icon.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
  }
  if (title) title.innerHTML = `<span class="font-extrabold text-slate-800 block text-xs">กำลังค้นหาการชำระเงิน (${userNickOrName})</span>`;
  if (sub) sub.textContent = "กำลังค้นหาข้อมูลการชำระเงินของคุณ...";
  if (btn) {
    btn.className = "px-3 py-1.5 bg-slate-100 text-slate-400 font-bold text-[11px] rounded-xl transition shadow-xs flex items-center gap-1 cursor-wait";
    btn.innerHTML = '<span class="animate-pulse">กำลังโหลด...</span>';
    btn.onclick = null;
  }

  if (payBtn) {
    payBtn.className = "flex-grow py-3 px-4 rounded-2xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm text-center shadow-xs transition flex items-center justify-center gap-2 cursor-wait";
    payBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>กำลังค้นหาข้อมูลของคุณ...</span>';
    payBtn.onclick = (e) => e.preventDefault();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Check local cache first (instant response if available)
  const localCache = JSON.parse(localStorage.getItem('COMED_LOCAL_PAYMENTS') || '{}');
  let cachedSlip = null;
  if (myId && localCache[myId] && localCache[myId].paid) cachedSlip = localCache[myId];
  if (!cachedSlip && user.studentId && localCache[user.studentId] && localCache[user.studentId].paid) cachedSlip = localCache[user.studentId];

  if (cachedSlip) {
    applyPaidUI(user, cachedSlip, box, icon, title, sub, btn, payBtn);
  }

  const cloudUrl = localStorage.getItem('COMED_GOOGLE_SHEETS_URL') || "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";

  try {
    const res = await fetch(`${cloudUrl}?t=${Date.now()}`);
    if (res.ok) {
      const result = await res.json();
      let slips = [];
      
      if (Array.isArray(result)) {
        slips = result;
      } else if (result.data && Array.isArray(result.data)) {
        slips = result.data;
      } else if (typeof result === 'object' && result !== null) {
        Object.keys(result).forEach(k => {
          if (!k.startsWith('_') && result[k] && typeof result[k] === 'object') {
            if (result[k].paid !== false) slips.push(result[k]);
          }
        });
      }
      
      // Match by Student ID, Email, or Full Name
      const userSlip = slips.find(s => {
        const sEmail = (s.email || '').toLowerCase().trim();
        const sId = (s.studentId || s.id || '').replace(/-/g, '').trim();
        const sName = (s.name || s.studentName || '').trim();

        return (myEmail && sEmail === myEmail) ||
               (myId && sId && sId === myId) ||
               (myName && sName && (sName.includes(myName) || myName.includes(sName)));
      });

      if (userSlip) {
        applyPaidUI(user, userSlip, box, icon, title, sub, btn, payBtn);
      } else {
        // Not paid yet -> Animate in the "Pending Payment" state
        applyUnpaidUI(user, box, icon, title, sub, btn, payBtn);
      }
    } else {
      if (!cachedSlip) applyUnpaidUI(user, box, icon, title, sub, btn, payBtn);
    }
  } catch (err) {
    console.warn("Cloud sync status check warning:", err);
    if (!cachedSlip) applyUnpaidUI(user, box, icon, title, sub, btn, payBtn);
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyPaidUI(user, userSlip, box, icon, title, sub, btn, payBtn) {
  window.currentUserPaymentRecord = userSlip;
  if (box) box.className = "p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs flex items-center justify-between shadow-sm transition-all duration-300";
  if (icon) {
    icon.className = "w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20";
    icon.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
  }
  if (title) title.innerHTML = '<span class="text-emerald-900 font-extrabold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>ชำระเงินเรียบร้อยแล้ว</span>';
  if (sub) sub.textContent = `ยอด ฿190.00 | บันทึกเมื่อ ${userSlip.timestamp || 'ล่าสุด'}`;
  if (btn) {
    btn.className = "px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer";
    btn.innerHTML = '<i data-lucide="file-text" class="w-3.5 h-3.5"></i><span>ดูรายละเอียด</span>';
    btn.onclick = () => openPaymentDetailsModal(user, userSlip);
  }

  if (payBtn) {
    payBtn.className = "flex-grow py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm text-center shadow-md transition flex items-center justify-center gap-2 cursor-pointer";
    payBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>คุณชำระเงินแล้ว (ดูข้อมูล)</span>';
    payBtn.onclick = (e) => {
      e.preventDefault();
      openPaymentDetailsModal(user, userSlip);
    };
  }

  // Smooth GSAP Pop Animation on load finish
  if (typeof gsap !== 'undefined' && box) {
    gsap.fromTo(box, 
      { scale: 0.96, opacity: 0.8 }, 
      { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyUnpaidUI(user, box, icon, title, sub, btn, payBtn) {
  const userNickOrName = user.nickname ? `น้อง${user.nickname}` : (user.name ? user.name.split(' ')[0] : 'คุณ');
  if (box) box.className = "p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs flex items-center justify-between shadow-xs transition-all duration-300";
  if (icon) {
    icon.className = "w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold";
    icon.innerHTML = '<i data-lucide="clock" class="w-4 h-4"></i>';
  }
  if (title) title.innerHTML = `<span class="font-extrabold text-slate-800 block text-xs">รอการชำระเงิน (${userNickOrName})</span>`;
  if (sub) sub.textContent = "ยังไม่พบข้อมูลการชำระเงินของคุณ";
  if (btn) {
    btn.className = "px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] rounded-xl transition shadow-sm cursor-pointer";
    btn.innerHTML = '<span>ไปชำระเงิน</span>';
    btn.onclick = () => window.location.href = "payment.html?auto=pay";
  }

  if (payBtn) {
    payBtn.className = "flex-grow py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm text-center shadow-md shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer";
    payBtn.innerHTML = '<i data-lucide="upload" class="w-4 h-4"></i><span>คลิกเพื่อแนบสลิปชำระเงิน</span>';
    payBtn.onclick = () => window.location.href = "payment.html?auto=pay";
  }

  // Smooth GSAP Pop Animation on load finish
  if (typeof gsap !== 'undefined' && box) {
    gsap.fromTo(box, 
      { scale: 0.96, opacity: 0.8 }, 
      { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function resetPaymentCardStatus() {
  const box = document.getElementById('card1UserStatusBox');
  const icon = document.getElementById('card1StatusIcon');
  const title = document.getElementById('card1StatusTitle');
  const sub = document.getElementById('card1StatusSubtitle');
  const btn = document.getElementById('card1StatusActionBtn');
  const payBtn = document.getElementById('card1PayBtn');

  if (!box) return;
  box.className = "p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between";
  if (icon) {
    icon.className = "w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold";
    icon.innerHTML = '<i data-lucide="lock" class="w-4 h-4"></i>';
  }
  if (title) title.textContent = "สถานะของฉัน";
  if (sub) sub.textContent = "กรุณาเข้าสู่ระบบเพื่อเช็คสถานะ";
  if (btn) {
    btn.className = "px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-800 font-bold text-[11px] rounded-xl transition shadow-sm cursor-pointer";
    btn.textContent = "เข้าสู่ระบบ";
    btn.onclick = openGoogleLoginModal;
  }

  if (payBtn) {
    payBtn.className = "flex-grow py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm text-center shadow-md shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer";
    payBtn.innerHTML = '<i data-lucide="upload" class="w-4 h-4"></i><span>คลิกเพื่อแนบสลิปชำระเงิน</span>';
    payBtn.onclick = () => window.location.href = "payment.html?auto=pay";
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Payment Details Modal Handler
function openPaymentDetailsModal(user, record) {
  const modal = document.getElementById('modalPaymentDetails');
  const card = document.getElementById('paymentDetailsCard');
  if (!modal || !card) return;
  
  const dName = document.getElementById('detailStudentName');
  const dId = document.getElementById('detailStudentID');
  const dEmail = document.getElementById('detailStudentEmail');
  const dTime = document.getElementById('detailPayTime');

  if (dName) dName.textContent = user.name ? `${user.name} (น้อง${user.nickname || '-'})` : (record.studentName || '-');
  if (dId) dId.textContent = user.studentId || record.studentId || '-';
  if (dEmail) dEmail.textContent = user.email || record.email || '-';
  if (dTime) dTime.textContent = record.timestamp || 'บันทึกเรียบร้อย';

  modal.classList.remove('hidden');
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.8, y: 30 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closePaymentDetailsModal() {
  const modal = document.getElementById('modalPaymentDetails');
  const card = document.getElementById('paymentDetailsCard');
  if (!modal || !card) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.85,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

// Logout Popups
function handleGoogleLogout() {
  const modal = document.getElementById('modalLogoutConfirm');
  const card = document.getElementById('logoutConfirmCard');
  if (!modal || !card) return;

  modal.classList.remove('hidden');
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.75, y: 40 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeLogoutModal() {
  const modal = document.getElementById('modalLogoutConfirm');
  const card = document.getElementById('logoutConfirmCard');
  if (!modal || !card) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.85,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

function confirmGoogleLogoutAction() {
  closeLogoutModal();
  localStorage.removeItem('COMED_USER_SESSION');
  updateUserUI(null);
}

// Check existing session on load
function checkUserSession() {
  try {
    const session = localStorage.getItem('COMED_USER_SESSION');
    if (session) {
      const user = JSON.parse(session);
      updateUserUI(user);
    }
  } catch(e) {}
}

// Render Students Roster
function renderRoster(students) {
  const grid = document.getElementById('rosterGrid');
  if (!grid) return;

  if (!students || students.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500 text-sm">ไม่พบรายชื่อที่ตรงกับคำค้นหา</div>';
    return;
  }

  grid.innerHTML = students.map((st, idx) => {
    return `
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 transition-all group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:scale-105 transition">
            ${st.nickname.slice(0, 1) || st.name.slice(0, 1)}
          </div>
          <div class="min-w-0 flex-grow">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-white text-xs truncate">${st.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold flex-shrink-0">น้อง${st.nickname}</span>
            </div>
            <div class="text-[11px] text-slate-500 font-mono mt-0.5 truncate">${st.id}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterRoster() {
  const searchInput = document.getElementById('rosterSearchInput');
  if (!searchInput) return;
  const q = searchInput.value.toLowerCase().trim();
  const allStudents = window.STUDENTS_DATA || [];
  if (!q) {
    renderRoster(allStudents);
    return;
  }
  const filtered = allStudents.filter(st => 
    st.name.toLowerCase().includes(q) ||
    st.nickname.toLowerCase().includes(q) ||
    st.id.replace(/-/g, '').includes(q.replace(/-/g, '')) ||
    st.email.toLowerCase().includes(q)
  );
  renderRoster(filtered);
}

// ================= DYNAMIC CAMPAIGNS RENDERING FOR INDEX.HTML =================
async function renderIndexCampaigns() {
  const container = document.getElementById('indexCampaignsContainer');
  if (!container) return;

  // 1. Fetch fresh campaigns from Supabase if available
  if (window.ComedCampaignManager && typeof window.ComedCampaignManager.fetchFromCloud === 'function') {
    try {
      await window.ComedCampaignManager.fetchFromCloud();
    } catch (e) {}
  }

  const campaigns = (window.ComedCampaignManager ? window.ComedCampaignManager.getAllCampaigns() : [])
    .filter(c => !String(c.id).startsWith("system_"));

  if (!campaigns || campaigns.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 text-sm">
        ยังไม่มีรายการเรียกเก็บเงินที่เปิดใช้งานในขณะนี้
      </div>
    `;
    return;
  }

  // Check login session for individual card status
  let userSession = null;
  try {
    const rawUser = localStorage.getItem('COMED_USER_SESSION');
    if (rawUser) userSession = JSON.parse(rawUser);
  } catch (e) {}

  // Fetch all payment records for campaigns from Supabase / Local
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  let allPaymentsData = [];
  if (sb) {
    try {
      const { data, error } = await sb.from('payments').select('*');
      if (!error && Array.isArray(data)) {
        allPaymentsData = data;
      }
    } catch (e) {}
  }

  const myId = userSession?.studentId ? userSession.studentId.replace(/-/g, '').trim() : '';
  const myEmail = (userSession?.email || '').toLowerCase().trim();

  container.innerHTML = campaigns.map((camp, idx) => {
    const isCompleted = (camp.status === 'completed');
    const isOpen = (camp.status === 'open' || !camp.status);
    const amount = Number(camp.amount) || 0;
    const targetTotalAmount = amount * 60;

    // Filter payments for this campaign
    const campPayments = allPaymentsData.filter(p => p.campaign_id === camp.id && p.paid);
    const paidCount = campPayments.length;
    const paidAmount = paidCount * amount;
    const remainingCount = Math.max(0, 60 - paidCount);
    const percent = targetTotalAmount > 0 ? Math.min(100, Math.round((paidAmount / targetTotalAmount) * 100)) : 0;

    // Check if current user has paid this campaign
    let userHasPaid = false;
    let userSlipInfo = null;
    if (userSession) {
      userSlipInfo = campPayments.find(p => {
        const pId = (p.student_id || '').replace(/-/g, '').trim();
        const pEmail = (p.email || '').toLowerCase().trim();
        return (myId && pId && pId === myId) || (myEmail && pEmail && pEmail === myEmail);
      });
      if (userSlipInfo) userHasPaid = true;
    }

    // Status Badge Top Right
    let topBadge = '';
    if (isCompleted) {
      topBadge = '<div class="absolute top-0 right-0 bg-emerald-600 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1"><i data-lucide="check-check" class="w-3.5 h-3.5"></i> ครบตามเป้าแล้ว</div>';
    } else if (isOpen) {
      topBadge = '<div class="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> เปิดรับชำระอยู่</div>';
    } else {
      topBadge = '<div class="absolute top-0 right-0 bg-slate-600 text-white text-[11px] font-black px-4 py-1 rounded-bl-2xl shadow-sm">ปิดรับชั่วคราว</div>';
    }

    // Personal user status strip
    let userStatusBox = '';
    if (userSession) {
      if (userHasPaid) {
        userStatusBox = `
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
                <i data-lucide="check" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="font-black text-emerald-900 block text-xs">คุณชำระเงินแล้ว</span>
                <span class="text-[11px] text-emerald-700">${userSlipInfo?.timestamp || 'มีบันทึกในระบบแล้ว'}</span>
              </div>
            </div>
            <a href="payment.html?camp=${encodeURIComponent(camp.id)}&tab=status" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition shadow-sm">
              ดูสลิป
            </a>
          </div>
        `;
      } else {
        userStatusBox = `
          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </div>
              <div>
                <span class="font-bold text-slate-800 block text-xs">รอการชำระเงิน</span>
                <span class="text-[11px] text-slate-500">ยอดที่ต้องชำระ ฿${amount.toLocaleString()}</span>
              </div>
            </div>
            <a href="payment.html?camp=${encodeURIComponent(camp.id)}&auto=pay" class="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] rounded-xl transition shadow-sm">
              ชำระเงิน
            </a>
          </div>
        `;
      }
    } else {
      userStatusBox = `
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="font-bold text-slate-800 block text-xs">สถานะของฉัน</span>
              <span class="text-[11px] text-slate-500">กรุณาเข้าสู่ระบบเพื่อเช็คสถานะ</span>
            </div>
          </div>
          <button onclick="openGoogleLoginModal()" class="px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-800 font-bold text-[11px] rounded-xl transition shadow-sm cursor-pointer">
            เข้าสู่ระบบ
          </button>
        </div>
      `;
    }

    // Action button
    let actionBtn = '';
    if (userHasPaid) {
      actionBtn = `
        <div class="pt-1 flex items-center gap-2">
          <a href="payment.html?camp=${encodeURIComponent(camp.id)}" class="flex-grow py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm text-center shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>คุณชำระเงินแล้ว (ดูรายละเอียด)</span>
          </a>
        </div>
      `;
    } else {
      actionBtn = `
        <div class="pt-1 flex items-center gap-2">
          <a href="payment.html?camp=${encodeURIComponent(camp.id)}&auto=pay" class="flex-grow py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm text-center shadow-md shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="upload" class="w-4 h-4"></i>
            <span>คลิกเพื่อแนบสลิปชำระเงิน</span>
          </a>
          <a href="payment.html?camp=${encodeURIComponent(camp.id)}&tab=status" class="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center" title="ดูรายชื่อ">
            <i data-lucide="clipboard-list" class="w-4 h-4"></i>
          </a>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-3xl p-6 sm:p-7 border-2 ${isOpen ? 'border-orange-300 shadow-xl shadow-orange-500/10 hover:border-orange-500' : 'border-slate-200 opacity-95'} space-y-4 relative overflow-hidden group transition-all">
        ${topBadge}

        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 p-1.5 flex items-center justify-center flex-shrink-0 border border-orange-200 shadow-sm">
            <img src="${camp.qrImage && !camp.qrImage.includes('data:') ? camp.qrImage : 'logo.png'}" alt="Logo" class="w-full h-full object-contain">
          </div>
          <div class="pr-12">
            <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">${camp.category || 'กิจกรรมสาขาวิชา'}</span>
            <h3 class="text-base font-black text-slate-900 leading-tight">${camp.title}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${camp.subtitle || 'คณะศึกษาศาสตร์ มข.'}</p>
          </div>
        </div>

        <!-- Basic Info Box -->
        <div class="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500 flex items-center gap-1.5"><i data-lucide="tag" class="w-3.5 h-3.5 text-orange-500"></i> ยอดที่ต้องชำระ:</span>
            <span class="font-black text-slate-900 text-base text-orange-600">฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5 text-rose-500"></i> กำหนดชำระ:</span>
            <span class="font-bold text-rose-600">${camp.deadlineDisplay || camp.deadline || 'ตามที่สาขากำหนด'}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 flex items-center gap-1.5"><i data-lucide="credit-card" class="w-3.5 h-3.5 text-slate-400"></i> บัญชีปลายทาง:</span>
            <span class="font-semibold text-slate-700 truncate max-w-[180px]">${camp.bankName || ''} ${camp.accountNumber || ''}</span>
          </div>
        </div>

        <!-- Progress Stats -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-slate-50 border border-orange-200/90 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 flex items-center gap-1">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-orange-500"></i>
              <span>ความคืบหน้าการชำระเงิน</span>
            </span>
            <span class="text-[10px] font-extrabold text-orange-600">${percent}%</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="bg-white/80 p-2 rounded-xl border border-orange-100">
              <span class="text-[10px] font-semibold text-slate-500 block">ยอดชำระแล้ว</span>
              <div class="flex items-baseline gap-1 mt-0.5">
                <span class="text-sm font-black text-orange-600">฿${paidAmount.toLocaleString()}</span>
                <span class="text-[9px] text-slate-400">/ ฿${targetTotalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="bg-white/80 p-2 rounded-xl border border-emerald-100">
              <span class="text-[10px] font-semibold text-slate-500 block">จำนวนผู้ชำระ</span>
              <div class="flex items-baseline gap-1 mt-0.5">
                <span class="text-sm font-black text-emerald-600">${paidCount} คน</span>
                <span class="text-[9px] text-slate-400">/ 60</span>
              </div>
            </div>
          </div>

          <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div class="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-700" style="width: ${percent}%;"></div>
          </div>
        </div>

        <!-- Personal User Status Widget -->
        ${userStatusBox}

        <!-- Action Button -->
        ${actionBtn}
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= REAL-TIME STATS CALCULATION & SYNC =================
async function fetchIndexRealtimeStats() {
  const refreshIcon = document.getElementById('statsRefreshIcon');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');

  const cloudUrl = localStorage.getItem('COMED_GOOGLE_SHEETS_URL') || "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";
  const totalStudentsCount = (window.STUDENTS_DATA || []).length || 60;
  const targetTotalAmount = totalStudentsCount * 190.00; // ฿11,400.00

  try {
    const res = await fetch(`${cloudUrl}?t=${Date.now()}`);
    if (res.ok) {
      const result = await res.json();
      let slips = [];
      
      if (Array.isArray(result)) {
        slips = result;
      } else if (result.data && Array.isArray(result.data)) {
        slips = result.data;
      } else if (typeof result === 'object' && result !== null) {
        // Convert dictionary { "693050120-5": { paid: true, ... } }
        Object.keys(result).forEach(k => {
          if (!k.startsWith('_') && result[k] && typeof result[k] === 'object') {
            if (result[k].paid !== false) {
              slips.push(result[k]);
            }
          }
        });
      }
      
      // Calculate unique paid count
      const uniquePaid = new Set();
      slips.forEach(s => {
        const key = (s.studentId || s.id || s.name || s.studentName || s.email || '').trim();
        if (key) uniquePaid.add(key);
      });

      // Check if local cache has more submissions
      const localCache = JSON.parse(localStorage.getItem('COMED_LOCAL_PAYMENTS') || '{}');
      Object.keys(localCache).forEach(k => {
        if (localCache[k] && localCache[k].paid) uniquePaid.add(k);
      });

      const paidCount = uniquePaid.size;
      const paidAmount = paidCount * 190.00;
      const remainingCount = Math.max(0, totalStudentsCount - paidCount);

      const studentPercent = ((paidCount / totalStudentsCount) * 100).toFixed(1);
      const amountPercent = ((paidAmount / targetTotalAmount) * 100).toFixed(1);

      // Update UI Elements with Smooth Transition
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
      
      const timeEl = document.getElementById('statsLastUpdatedText');
      if (timeEl) timeEl.textContent = `${dateStr} ${timeStr} น.`;
      
      // Stat 1: Amount
      const amtPaidEl = document.getElementById('statAmountPaid');
      if (amtPaidEl) {
        amtPaidEl.classList.remove('animate-pulse');
        amtPaidEl.textContent = `฿${paidAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
      }
      
      const amtTargetEl = document.getElementById('statAmountTarget');
      if (amtTargetEl) amtTargetEl.textContent = `/ 11.4k`;

      const amtBadgeEl = document.getElementById('statAmountPercentBadge');
      if (amtBadgeEl) {
        amtBadgeEl.classList.remove('animate-pulse');
        amtBadgeEl.textContent = `${Math.round(amountPercent)}%`;
      }

      const amtTextEl = document.getElementById('statAmountPercentText');
      if (amtTextEl) {
        amtTextEl.classList.remove('animate-pulse');
        amtTextEl.textContent = `${amountPercent}% ของเป้าหมาย`;
      }

      const amtBarEl = document.getElementById('statAmountProgressBar');
      if (amtBarEl) amtBarEl.style.width = `${Math.min(100, Math.max(2, amountPercent))}%`;

      // Stat 2: Students
      const stuPaidEl = document.getElementById('statStudentsPaid');
      if (stuPaidEl) {
        stuPaidEl.classList.remove('animate-pulse');
        stuPaidEl.textContent = `${paidCount}`;
      }

      const stuRemEl = document.getElementById('statStudentsRemaining');
      if (stuRemEl) {
        stuRemEl.classList.remove('animate-pulse');
        stuRemEl.textContent = `${remainingCount}`;
      }

      const stuPercentText = document.getElementById('statStudentPercentText');
      if (stuPercentText) stuPercentText.textContent = `${paidCount}/${totalStudentsCount} คน`;

      // Trigger GSAP Pop Animation on the stats boxes
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(['#statAmountPaid', '#statStudentsPaid'], 
          { scale: 0.9, opacity: 0.7 }, 
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
      }
    }
  } catch (e) {
    console.warn("Realtime stats fetch error", e);
    // Fallback calculation from local state
    const localCache = JSON.parse(localStorage.getItem('COMED_LOCAL_PAYMENTS') || '{}');
    const paidCount = Object.keys(localCache).filter(k => localCache[k]?.paid).length;
    const paidAmount = paidCount * 190.00;
    const remainingCount = Math.max(0, totalStudentsCount - paidCount);
    const amountPercent = ((paidAmount / targetTotalAmount) * 100).toFixed(1);

    const amtPaidEl = document.getElementById('statAmountPaid');
    if (amtPaidEl) {
      amtPaidEl.classList.remove('animate-pulse');
      amtPaidEl.textContent = `฿${paidAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    }
    const stuPaidEl = document.getElementById('statStudentsPaid');
    if (stuPaidEl) {
      stuPaidEl.classList.remove('animate-pulse');
      stuPaidEl.textContent = `${paidCount}`;
    }
    const stuRemEl = document.getElementById('statStudentsRemaining');
    if (stuRemEl) {
      stuRemEl.classList.remove('animate-pulse');
      stuRemEl.textContent = `${remainingCount}`;
    }
    const amtBadgeEl = document.getElementById('statAmountPercentBadge');
    if (amtBadgeEl) {
      amtBadgeEl.classList.remove('animate-pulse');
      amtBadgeEl.textContent = `${Math.round(amountPercent)}%`;
    }
    const amtTextEl = document.getElementById('statAmountPercentText');
    if (amtTextEl) {
      amtTextEl.classList.remove('animate-pulse');
      amtTextEl.textContent = `${amountPercent}% ของเป้าหมาย`;
    }
    const amtBarEl = document.getElementById('statAmountProgressBar');
    if (amtBarEl) amtBarEl.style.width = `${Math.min(100, amountPercent)}%`;

    const dateNow = new Date();
    const timeEl = document.getElementById('statsLastUpdatedText');
    if (timeEl) timeEl.textContent = `${dateNow.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} (พร้อมใช้)`;
  } finally {
    if (refreshIcon) {
      setTimeout(() => refreshIcon.classList.remove('animate-spin'), 600);
    }
  }
}

// ================= MODERN STICKY NAVBAR CONTROLLER =================
function initNavbarScrollEffect() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) return;

  function handleScroll() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('transparent-top');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('transparent-top');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check
}

function toggleMobileNavMenu() {
  const drawer = document.getElementById('mobileMenuDrawer');
  if (!drawer) return;

  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(drawer, 
        { opacity: 0, y: -15 }, 
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  } else {
    drawer.classList.add('hidden');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Initial render & Google One-Tap Setup
document.addEventListener('DOMContentLoaded', () => {
  // 1. Page Fade-in Animation
  const body = document.getElementById('mainBody');
  if (body) {
    body.classList.remove('opacity-0');
    body.classList.add('opacity-100');
  }

  // Initialize Modern Navbar Scroll Effect
  initNavbarScrollEffect();

  checkUserSession();
  renderRoster(window.STUDENTS_DATA || []);
  
  // 2. Render all dynamic campaigns from Cloud/Repository
  renderIndexCampaigns();
  
  // 3. Fetch Real-time Progress Stats
  fetchIndexRealtimeStats();

  // Auto-trigger Google One-Tap Top-Right Prompt if user is not logged in
  const session = localStorage.getItem('COMED_USER_SESSION');
  if (!session) {
    setTimeout(() => {
      try {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false
          });
          // Prompt Top-Right Floating Google Account Selector
          google.accounts.id.prompt();
        }
      } catch(e) {
        console.warn("One-Tap Auto Prompt error", e);
      }
    }, 800);
  }
});
