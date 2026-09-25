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
  const PROFILE_UPLOAD_CONFIG_KEY = 'COMED_PROFILE_UPLOAD_CONFIG_V1';

  let currentUser = null;
  let userPrefs = {
    theme: 'dark',
    notifyPayment: true,
    notifyEvent: true,
    notifyCloud: true,
    cloudAutoSave: true,
    publicProfile: true,
    avatarSeed: '',
    avatarFrame: 'none',     // 'none' | 'cyber' | 'gold' | 'neon' | 'emerald'
    avatarAnim: 'none'       // 'none' | 'pulse' | 'glow' | 'float' | 'bounce' | 'rainbow'
  };

  let adminUploadConfig = {
    allowUserUpload: true,
    strategy: 'priority',
    singleTarget: 'cloudinary',
    priority: ['cloudinary', 'catbox', 'imgbb'],
    maxSizeMB: 5,
    allowAnimations: true
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadAdminUploadPolicy();
    initUserSession();
    initTabs();
    initSettingsForm();
    initIssueForm();
    loadUserActivity();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Load Admin Upload & Storage Policy
  function loadAdminUploadPolicy() {
    try {
      const raw = localStorage.getItem(PROFILE_UPLOAD_CONFIG_KEY);
      if (raw) {
        adminUploadConfig = { ...adminUploadConfig, ...JSON.parse(raw) };
      }
    } catch (e) {}

    // Apply Admin Policy to User UI
    const uploadBox = document.getElementById('userUploadAvatarContainer');
    const disabledNotice = document.getElementById('userUploadDisabledNotice');
    const badgeStatus = document.getElementById('badgeUploadAllowedStatus');
    const animContainer = document.getElementById('userAvatarAnimationContainer');

    if (!adminUploadConfig.allowUserUpload) {
      if (uploadBox) uploadBox.classList.add('hidden');
      if (disabledNotice) disabledNotice.classList.remove('hidden');
      if (badgeStatus) {
        badgeStatus.textContent = 'ปิดรับไฟล์ชั่วคราว';
        badgeStatus.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      }
    } else {
      if (uploadBox) uploadBox.classList.remove('hidden');
      if (disabledNotice) disabledNotice.classList.add('hidden');
      if (badgeStatus) {
        badgeStatus.textContent = 'เปิดให้อัปโหลด';
        badgeStatus.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      }
    }

    if (!adminUploadConfig.allowAnimations && animContainer) {
      animContainer.classList.add('hidden');
    }
  }

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

    // Synchronize frame and anim from user object if stored there
    if (currentUser) {
      if (currentUser.avatarFrame) userPrefs.avatarFrame = currentUser.avatarFrame;
      if (currentUser.avatarAnim) userPrefs.avatarAnim = currentUser.avatarAnim;
    }

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
    highlightSelectedDecorations();
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
    const cFrame = document.getElementById('cardUserAvatarFrame');
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

    // Apply Decoration Frame
    if (cFrame) {
      // Remove all previous frame classes
      cFrame.classList.remove('avatar-frame-cyber', 'avatar-frame-gold', 'avatar-frame-neon', 'avatar-frame-emerald', 'avatar-frame-galaxy');
      const activeFrame = userPrefs.avatarFrame || 'none';
      if (activeFrame !== 'none') {
        cFrame.classList.add(`avatar-frame-${activeFrame}`);
      }
    }

    // Apply Animation Effect
    if (cAvatar) {
      // Remove all previous anim classes
      cAvatar.classList.remove('avatar-anim-pulse', 'avatar-anim-glow', 'avatar-anim-float', 'avatar-anim-bounce', 'avatar-anim-rainbow', 'avatar-anim-spin-slow');
      const activeAnim = userPrefs.avatarAnim || 'none';
      if (activeAnim !== 'none' && adminUploadConfig.allowAnimations !== false) {
        cAvatar.classList.add(`avatar-anim-${activeAnim}`);
      }
    }
  }

  function highlightSelectedDecorations() {
    // Frame buttons
    document.querySelectorAll('.btn-frame-opt').forEach(btn => {
      const val = btn.getAttribute('data-frame-val');
      if (val === (userPrefs.avatarFrame || 'none')) {
        btn.classList.add('border-sky-500', 'bg-sky-500/10');
      } else {
        btn.classList.remove('border-sky-500', 'bg-sky-500/10');
      }
    });

    // Animation buttons
    document.querySelectorAll('.btn-anim-opt').forEach(btn => {
      const val = btn.getAttribute('data-anim-val');
      if (val === (userPrefs.avatarAnim || 'none')) {
        btn.classList.add('border-sky-500', 'bg-sky-500/10');
      } else {
        btn.classList.remove('border-sky-500', 'bg-sky-500/10');
      }
    });
  }

  // 3. User Avatar Upload Handler
  window.handleUserAvatarUpload = async function (e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!adminUploadConfig.allowUserUpload) {
      showToast('ระบบปิดรับการอัปโหลดรูปโปรไฟล์จากภายนอกชั่วคราว', 'error');
      return;
    }

    // Check size limit
    const maxBytes = (adminUploadConfig.maxSizeMB || 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(`ขนาดไฟล์ภาพเกินกำหนด (สูงสุด ${adminUploadConfig.maxSizeMB || 5}MB)`, 'error');
      return;
    }

    const progressBox = document.getElementById('uploadAvatarProgressBox');
    const progressText = document.getElementById('uploadAvatarProgressText');
    const targetBadge = document.getElementById('uploadAvatarTargetBadge');

    if (progressBox) progressBox.classList.remove('hidden');

    try {
      // Determine strategy: Single Provider vs Priority
      let uploadedUrl = null;
      let usedProvider = 'Local/Cloud';

      if (window.MultiCloudUploader && typeof window.MultiCloudUploader.getInstance === 'function') {
        const uploader = window.MultiCloudUploader.getInstance();

        // Apply provider priority according to Admin settings
        if (adminUploadConfig.strategy === 'single') {
          uploader.config.activeProvider = adminUploadConfig.singleTarget || 'cloudinary';
          if (targetBadge) targetBadge.textContent = `Provider: ${adminUploadConfig.singleTarget}`;
        } else {
          uploader.config.activeProvider = 'auto';
          if (Array.isArray(adminUploadConfig.priority) && adminUploadConfig.priority.length > 0) {
            uploader.config.providerPriority = [...adminUploadConfig.priority];
          }
          if (targetBadge) targetBadge.textContent = `Priority: ${uploader.config.providerPriority.join(' → ')}`;
        }

        if (progressText) progressText.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>กำลังอัปโหลดขึ้น ${targetBadge ? targetBadge.textContent : 'Cloud'}...</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const uploadResult = await uploader.uploadFile(file, {
          folder: 'comed_user_avatars',
          tags: ['avatar', currentUser.email]
        });

        if (uploadResult && uploadResult.url) {
          uploadedUrl = uploadResult.url;
          usedProvider = uploadResult.provider || 'Cloud';
        }
      }

      // Fallback: If MultiCloudUploader is unavailable or failed, read as Data URL
      if (!uploadedUrl) {
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        usedProvider = 'DataURL';
      }

      // Update current user avatar
      currentUser.avatar = uploadedUrl;
      renderUserProfile();

      // Auto update in index.html user session if active
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));

      if (progressBox) progressBox.classList.add('hidden');
      showToast(`✨ อัปโหลดรูปโปรไฟล์ขึ้น ${usedProvider} สำเร็จแล้ว!`, 'success');

    } catch (err) {
      console.error("Avatar Upload Error", err);
      if (progressBox) progressBox.classList.add('hidden');
      showToast('เกิดข้อผิดพลาดในการอัปโหลดภาพ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  // Reset to default Dicebear avatar
  window.resetToDefaultAvatar = function () {
    if (!currentUser) return;
    currentUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.email)}`;
    renderUserProfile();
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
    showToast('รีเซ็ตรูปโปรไฟล์กลับเป็นค่าเริ่มต้นแล้ว', 'info');
  };

  // Select Avatar Frame
  window.selectAvatarFrame = function (frameName) {
    userPrefs.avatarFrame = frameName;
    if (currentUser) currentUser.avatarFrame = frameName;
    renderUserProfile();
    highlightSelectedDecorations();
    showToast(`เลือกกรอบรูป: ${frameName.toUpperCase()}`, 'info');
  };

  // Select Avatar Animation
  window.selectAvatarAnim = function (animName) {
    if (adminUploadConfig.allowAnimations === false && animName !== 'none') {
      showToast('ผู้ดูแลระบบปิดการแสดงแอนิเมชันชั่วคราว', 'error');
      return;
    }
    userPrefs.avatarAnim = animName;
    if (currentUser) currentUser.avatarAnim = animName;
    renderUserProfile();
    highlightSelectedDecorations();
    showToast(`เลือกแอนิเมชัน: ${animName.toUpperCase()}`, 'info');
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

      // Ensure decoration settings are saved in user session
      currentUser.avatarFrame = userPrefs.avatarFrame || 'none';
      currentUser.avatarAnim = userPrefs.avatarAnim || 'none';

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
        publicProfile: chkPublicProfile ? chkPublicProfile.checked : true,
        avatarFrame: userPrefs.avatarFrame,
        avatarAnim: userPrefs.avatarAnim
      };

      // Persist in LocalStorage
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));

      renderUserProfile();
      showToast('🎉 บันทึกการตั้งค่าโปรไฟล์และเอฟเฟกต์เรียบร้อยแล้ว!', 'success');
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
