/**
 * settings-user.js
 * User Personal Settings & Profile Controller for COMED23 KKU63
 */

(function () {
  'use strict';

  // Storage Keys
  const USER_SESSION_KEY = 'COMED_USER_SESSION';
  const USER_PREFS_KEY = 'COMED_USER_PREFERENCES';
  const STORAGE_KEY_ISSUES = 'COMED_USER_REPORTED_ISSUES';

  let currentUser = null;
  let userPrefs = {
    theme: 'dark',
    notifyPayment: true,
    notifyEvent: true,
    notifyCloud: true,
    cloudAutoSave: true,
    publicProfile: true,
    avatarSeed: ''
  };

  document.addEventListener('DOMContentLoaded', () => {
    initUserSession();
    initTabs();
    initSettingsForm();
    initIssueForm();
    loadUserActivity();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // 1. Session & Auth Gate
  function initUserSession() {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      if (raw) {
        currentUser = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to parse user session", e);
    }

    // Load saved preferences
    try {
      const prefRaw = localStorage.getItem(USER_PREFS_KEY);
      if (prefRaw) {
        userPrefs = { ...userPrefs, ...JSON.parse(prefRaw) };
      }
    } catch (e) {}

    // Check if user is logged in
    const guestState = document.getElementById('userSettingsGuestNotice');
    const contentState = document.getElementById('userSettingsMainContent');
    const headerProfile = document.getElementById('userHeaderProfile');

    if (!currentUser || !currentUser.email) {
      if (guestState) guestState.classList.remove('hidden');
      if (contentState) contentState.classList.add('hidden');
      if (headerProfile) headerProfile.classList.add('hidden');
      return;
    }

    if (guestState) guestState.classList.add('hidden');
    if (contentState) contentState.classList.remove('hidden');
    if (headerProfile) headerProfile.classList.remove('hidden');

    renderUserProfile();
    populateFormValues();
  }

  function renderUserProfile() {
    if (!currentUser) return;

    // Header Info
    const hName = document.getElementById('userHeaderName');
    const hEmail = document.getElementById('userHeaderEmail');
    const hAvatar = document.getElementById('userHeaderAvatar');
    if (hName) hName.textContent = currentUser.nickname ? `${currentUser.name} (${currentUser.nickname})` : currentUser.name;
    if (hEmail) hEmail.textContent = currentUser.email;
    if (hAvatar) hAvatar.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`;

    // Profile Card
    const cAvatar = document.getElementById('cardUserAvatar');
    const cName = document.getElementById('cardUserName');
    const cEmail = document.getElementById('cardUserEmail');
    const cId = document.getElementById('cardUserId');
    const cBadge = document.getElementById('cardUserBadge');

    if (cAvatar) cAvatar.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`;
    if (cName) cName.textContent = currentUser.name;
    if (cEmail) cEmail.textContent = currentUser.email;
    if (cId) cId.textContent = currentUser.studentId || 'ไม่ระบุรหัสประจำตัว';
    if (cBadge) {
      if (currentUser.isSpecialTester) {
        cBadge.textContent = 'ผู้ดูแล & ทดสอบ';
        cBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
      } else {
        cBadge.textContent = 'นักศึกษา COMED23';
        cBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30';
      }
    }
  }

  function populateFormValues() {
    if (!currentUser) return;

    const inputName = document.getElementById('prefDisplayName');
    const inputNick = document.getElementById('prefNickname');
    const inputPhone = document.getElementById('prefPhone');
    const inputBio = document.getElementById('prefBio');
    const inputStudentId = document.getElementById('prefStudentId');
    const inputEmail = document.getElementById('prefEmail');

    if (inputName) inputName.value = currentUser.name || '';
    if (inputNick) inputNick.value = currentUser.nickname || '';
    if (inputPhone) inputPhone.value = currentUser.phone || '';
    if (inputBio) inputBio.value = currentUser.bio || '';
    if (inputStudentId) inputStudentId.value = currentUser.studentId || '';
    if (inputEmail) inputEmail.value = currentUser.email || '';

    // Checkboxes & Preferences
    const chkNotifyPay = document.getElementById('chkNotifyPayment');
    const chkNotifyEvent = document.getElementById('chkNotifyEvent');
    const chkNotifyCloud = document.getElementById('chkNotifyCloud');
    const chkCloudAuto = document.getElementById('chkCloudAutoSave');
    const chkPublicProfile = document.getElementById('chkPublicProfile');

    if (chkNotifyPay) chkNotifyPay.checked = userPrefs.notifyPayment;
    if (chkNotifyEvent) chkNotifyEvent.checked = userPrefs.notifyEvent;
    if (chkNotifyCloud) chkNotifyCloud.checked = userPrefs.notifyCloud;
    if (chkCloudAuto) chkCloudAuto.checked = userPrefs.cloudAutoSave;
    if (chkPublicProfile) chkPublicProfile.checked = userPrefs.publicProfile;
  }

  // 2. Tab Navigation
  function initTabs() {
    const tabs = document.querySelectorAll('[data-user-tab]');
    const tabContents = document.querySelectorAll('.user-tab-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.getAttribute('data-user-tab');

        tabs.forEach(t => {
          t.classList.remove('bg-sky-500', 'text-white', 'shadow-lg', 'shadow-sky-500/25');
          t.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-900/60');
        });
        tab.classList.add('bg-sky-500', 'text-white', 'shadow-lg', 'shadow-sky-500/25');
        tab.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-900/60');

        tabContents.forEach(pane => {
          pane.classList.add('hidden');
        });

        const activePane = document.getElementById(`tabPane-${target}`);
        if (activePane) {
          activePane.classList.remove('hidden');
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(activePane, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
          }
        }
      });
    });

    // Check URL parameters for tab
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get('tab');
    if (requestedTab) {
      const match = document.querySelector(`[data-user-tab="${requestedTab}"]`);
      if (match) match.click();
    }
  }

  // 3. Avatar Generators & Choices
  window.changeAvatarSeed = function (seed) {
    if (!currentUser) return;
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    currentUser.avatar = newAvatar;
    renderUserProfile();
    showToast('เปลี่ยนรูปแบบอวาตาร์ชั่วคราวแล้ว กด "บันทึกข้อมูล" เพื่อยืนยัน', 'info');
  };

  window.generateRandomAvatar = function () {
    const randomSeed = Math.random().toString(36).substring(7);
    window.changeAvatarSeed(randomSeed);
  };

  // 4. Save User Profile Form
  function initSettingsForm() {
    const form = document.getElementById('userProfileForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) return;

      const inputName = document.getElementById('prefDisplayName');
      const inputNick = document.getElementById('prefNickname');
      const inputPhone = document.getElementById('prefPhone');
      const inputBio = document.getElementById('prefBio');
      const inputStudentId = document.getElementById('prefStudentId');

      if (inputName) currentUser.name = inputName.value.trim();
      if (inputNick) currentUser.nickname = inputNick.value.trim();
      if (inputPhone) currentUser.phone = inputPhone.value.trim();
      if (inputBio) currentUser.bio = inputBio.value.trim();
      if (inputStudentId) currentUser.studentId = inputStudentId.value.trim();

      // Save Preferences
      const chkNotifyPay = document.getElementById('chkNotifyPayment');
      const chkNotifyEvent = document.getElementById('chkNotifyEvent');
      const chkNotifyCloud = document.getElementById('chkNotifyCloud');
      const chkCloudAuto = document.getElementById('chkCloudAutoSave');
      const chkPublicProfile = document.getElementById('chkPublicProfile');

      userPrefs = {
        theme: 'dark',
        notifyPayment: chkNotifyPay ? chkNotifyPay.checked : true,
        notifyEvent: chkNotifyEvent ? chkNotifyEvent.checked : true,
        notifyCloud: chkNotifyCloud ? chkNotifyCloud.checked : true,
        cloudAutoSave: chkCloudAuto ? chkCloudAuto.checked : true,
        publicProfile: chkPublicProfile ? chkPublicProfile.checked : true
      };

      // Persist in LocalStorage
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));

      renderUserProfile();
      showToast('บันทึกการตั้งค่าโปรไฟล์ส่วนตัวเรียบร้อยแล้ว!', 'success');
    });
  }

  // 5. Help & Bug Report Form
  function initIssueForm() {
    const form = document.getElementById('userReportIssueForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const topicEl = document.getElementById('issueTopic');
      const detailEl = document.getElementById('issueDetail');

      if (!topicEl || !detailEl || !detailEl.value.trim()) {
        showToast('กรุณากรอกรายละเอียดปัญหาหรือข้อเสนอแนะ', 'error');
        return;
      }

      const newIssue = {
        id: 'ISSUE-' + Date.now(),
        topic: topicEl.value,
        detail: detailEl.value.trim(),
        reporterEmail: currentUser ? currentUser.email : 'guest@kkumail.com',
        reporterName: currentUser ? currentUser.name : 'ผู้ใช้งานทั่วไป',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      try {
        let issues = [];
        const raw = localStorage.getItem(STORAGE_KEY_ISSUES);
        if (raw) issues = JSON.parse(raw);
        issues.unshift(newIssue);
        localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify(issues));

        detailEl.value = '';
        showToast('ส่งข้อเสนอแนะ/แจ้งปัญหาไปยังผู้ดูแลระบบเรียบร้อยแล้ว ขอบคุณครับ', 'success');
      } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการส่งข้อมูล', 'error');
      }
    });
  }

  // 6. User Activity History
  function loadUserActivity() {
    const listContainer = document.getElementById('userActivityList');
    if (!listContainer) return;

    if (!currentUser) {
      listContainer.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">กรุณาเข้าสู่ระบบเพื่อดูประวัติ</div>`;
      return;
    }

    // Read stored payments / links / events for this user
    let activities = [];

    // Check payment history
    try {
      const paymentsRaw = localStorage.getItem('COMED_KKU69_PAYMENT_DB');
      if (paymentsRaw) {
        const payments = JSON.parse(paymentsRaw);
        const myPay = payments.filter(p => p.email && p.email.toLowerCase() === currentUser.email.toLowerCase());
        myPay.forEach(p => {
          activities.push({
            title: `ชำระเงิน ${p.amount || '190'} บาท`,
            desc: `สถานะ: ${p.status || 'เสร็จสมบูรณ์'} • สลิป: ${p.slipVerified ? 'ยืนยันแล้ว' : 'รอตรวจสอบ'}`,
            time: p.createdAt || p.payTime || 'เร็วๆ นี้',
            icon: 'credit-card',
            color: 'emerald'
          });
        });
      }
    } catch (e) {}

    // Add Login Timestamp
    if (currentUser.loggedInAt) {
      activities.push({
        title: 'เข้าสู่ระบบด้วย Google KKU Mail',
        desc: `บัญชี ${currentUser.email}`,
        time: currentUser.loggedInAt,
        icon: 'log-in',
        color: 'sky'
      });
    }

    if (activities.length === 0) {
      listContainer.innerHTML = `
        <div class="p-8 text-center text-slate-500 text-xs space-y-2">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-600"></i>
          <p>ยังไม่มีประวัติกิจกรรมล่าสุดในระบบ</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = activities.map(act => `
        <div class="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-${act.color}-500/10 text-${act.color}-400 flex items-center justify-center flex-shrink-0">
              <i data-lucide="${act.icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <span class="font-bold text-white block truncate">${act.title}</span>
              <span class="text-slate-400 text-[11px] block truncate">${act.desc}</span>
            </div>
          </div>
          <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">${formatDate(act.time)}</span>
        </div>
      `).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function formatDate(dStr) {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return dStr;
    }
  }

  // Simple Notification Toast
  function showToast(msg, type = 'info') {
    const existing = document.getElementById('userSettingsToast');
    if (existing) existing.remove();

    const colors = {
      success: 'bg-emerald-500 text-white shadow-emerald-500/30',
      error: 'bg-rose-500 text-white shadow-rose-500/30',
      info: 'bg-sky-500 text-white shadow-sky-500/30'
    };

    const toast = document.createElement('div');
    toast.id = 'userSettingsToast';
    toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transform transition-all duration-300 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>${msg}</span>`;

    document.body.appendChild(toast);

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(toast, { opacity: 0, y: 30, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
    }

    setTimeout(() => {
      if (typeof gsap !== 'undefined') {
        gsap.to(toast, {
          opacity: 0,
          y: 20,
          duration: 0.3,
          onComplete: () => toast.remove()
        });
      } else {
        toast.remove();
      }
    }, 3500);
  }

  // Logout helper
  window.handleUserLogout = function () {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem(USER_SESSION_KEY);
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  };

})();
