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
    avatarAnim: 'none',      // 'none' | 'pulse' | 'glow' | 'float' | 'bounce' | 'rainbow'
    avatarTransform: {
      rotate: 0,
      scale: 1,
      flipX: false,
      flipY: false
    }
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
    initDoodleDropZone();
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

    // Synchronize frame and anim from user object or admin overridden store
    if (currentUser && currentUser.email) {
      try {
        const storedProfiles = JSON.parse(localStorage.getItem('COMED_CUSTOM_USERS_PROFILES_V1') || '{}');
        const custom = storedProfiles[currentUser.email.toLowerCase().trim()];
        if (custom) {
          if (custom.avatar) currentUser.avatar = custom.avatar;
          if (custom.avatarFrame) {
            currentUser.avatarFrame = custom.avatarFrame;
            userPrefs.avatarFrame = custom.avatarFrame;
          }
          if (custom.avatarAnim) {
            currentUser.avatarAnim = custom.avatarAnim;
            userPrefs.avatarAnim = custom.avatarAnim;
          }
        }
      } catch(e) {}

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

    // Sync transform controls with loaded user preferences
    const tf = userPrefs.avatarTransform || { rotate: 0, scale: 1, flipX: false, flipY: false };
    const zoomSlider = document.getElementById('avatarZoomSlider');
    const zoomVal = document.getElementById('avatarZoomValue');
    const btnFlipX = document.getElementById('btnFlipX');
    const btnFlipY = document.getElementById('btnFlipY');

    if (zoomSlider) zoomSlider.value = tf.scale || 1;
    if (zoomVal) zoomVal.textContent = `${Math.round((tf.scale || 1) * 100)}%`;
    if (btnFlipX) btnFlipX.classList.toggle('border-sky-500', !!tf.flipX);
    if (btnFlipY) btnFlipY.classList.toggle('border-sky-500', !!tf.flipY);
  }

  // Tab Navigation Controller
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

    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get('tab');
    if (requestedTab) {
      const match = document.querySelector(`[data-user-tab="${requestedTab}"]`);
      if (match) match.click();
    }

    if (urlParams.get('drawer') === 'avatar' || urlParams.get('edit') === 'avatar') {
      setTimeout(() => {
        if (typeof window.openAvatarDrawer === 'function') {
          window.openAvatarDrawer();
        }
      }, 300);
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

    if (chkNotifyPay) chkNotifyPay.checked = userPrefs.notifyPayment !== false;
    if (chkNotifyEvent) chkNotifyEvent.checked = userPrefs.notifyEvent !== false;
    if (chkNotifyCloud) chkNotifyCloud.checked = userPrefs.notifyCloud !== false;
    if (chkCloudAuto) chkCloudAuto.checked = userPrefs.cloudAutoSave !== false;
    if (chkPublicProfile) chkPublicProfile.checked = userPrefs.publicProfile !== false;
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

    // Profile Card & Drawer Mirror
    const cAvatar = document.getElementById('cardUserAvatar');
    const cAnimWrapper = document.getElementById('cardUserAvatarAnimWrapper');
    const cFrame = document.getElementById('cardUserAvatarFrame');
    const cName = document.getElementById('cardUserName');
    const cEmail = document.getElementById('cardUserEmail');
    const cId = document.getElementById('cardUserId');
    const cBadge = document.getElementById('cardUserBadge');

    const dAvatar = document.getElementById('drawerUserAvatar');
    const dAnimWrapper = document.getElementById('drawerUserAvatarAnimWrapper');
    const dFrame = document.getElementById('drawerUserAvatarFrame');
    const dName = document.getElementById('drawerUserName');
    const dEmail = document.getElementById('drawerUserEmail');
    const dBadgeFrame = document.getElementById('drawerActiveFrameBadge');

    const avatarSrc = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`;
    if (cAvatar) cAvatar.src = avatarSrc;
    if (dAvatar) dAvatar.src = avatarSrc;

    if (cName) cName.textContent = currentUser.name;
    if (dName) dName.textContent = currentUser.name;

    if (cEmail) cEmail.textContent = currentUser.email;
    if (dEmail) dEmail.textContent = currentUser.email;

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
    const activeFrame = userPrefs.avatarFrame || 'none';
    if (dBadgeFrame) dBadgeFrame.textContent = `Frame: ${activeFrame.toUpperCase()}`;

    [cFrame, dFrame].forEach(frameEl => {
      if (!frameEl) return;
      frameEl.classList.remove('avatar-frame-cyber', 'avatar-frame-gold', 'avatar-frame-neon', 'avatar-frame-emerald', 'avatar-frame-galaxy');
      if (activeFrame !== 'none') {
        frameEl.classList.add(`avatar-frame-${activeFrame}`);
      }
    });

    // Apply Animation Effect (on Wrapper so transform is NOT overridden)
    const activeAnim = userPrefs.avatarAnim || 'none';
    const animWrappers = [cAnimWrapper, dAnimWrapper];
    const animClasses = ['avatar-anim-pulse', 'avatar-anim-glow', 'avatar-anim-float', 'avatar-anim-bounce', 'avatar-anim-rainbow', 'avatar-anim-spin-slow'];

    animWrappers.forEach(wrapperEl => {
      if (!wrapperEl) return;
      wrapperEl.classList.remove(...animClasses);
      if (activeAnim !== 'none' && adminUploadConfig.allowAnimations !== false) {
        wrapperEl.classList.add(`avatar-anim-${activeAnim}`);
      }
    });

    // Apply Dimension Matrix (Rotate, Zoom, Flip) directly on inner <img>
    const tf = userPrefs.avatarTransform || { rotate: 0, scale: 1, flipX: false, flipY: false };
    const scaleX = (tf.flipX ? -1 : 1) * (tf.scale || 1);
    const scaleY = (tf.flipY ? -1 : 1) * (tf.scale || 1);
    const rotate = tf.rotate || 0;
    const transformStr = `scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)`;

    [cAvatar, dAvatar].forEach(avatarEl => {
      if (!avatarEl) return;
      // Clean any accidental anim class on img
      avatarEl.classList.remove(...animClasses);
      avatarEl.style.transform = transformStr;
    });
  }

  function highlightSelectedDecorations() {
    // Frame buttons
    document.querySelectorAll('.btn-frame-opt').forEach(btn => {
      const val = btn.getAttribute('data-frame-val');
      const isSelected = (val === (userPrefs.avatarFrame || 'none'));
      if (isSelected) {
        btn.classList.add('border-sky-500', 'bg-sky-500/10', 'ring-1', 'ring-sky-500/50');
        if (!btn.querySelector('.active-check-badge')) {
          const badge = document.createElement('span');
          badge.className = 'active-check-badge text-sky-400 text-xs mt-1 block';
          badge.innerHTML = '<i class="bi bi-check-circle-fill"></i> ใช้งานอยู่';
          btn.appendChild(badge);
        }
      } else {
        btn.classList.remove('border-sky-500', 'bg-sky-500/10', 'ring-1', 'ring-sky-500/50');
        const badge = btn.querySelector('.active-check-badge');
        if (badge) badge.remove();
      }
    });

    // Animation buttons
    document.querySelectorAll('.btn-anim-opt').forEach(btn => {
      const val = btn.getAttribute('data-anim-val');
      const isSelected = (val === (userPrefs.avatarAnim || 'none'));
      if (isSelected) {
        btn.classList.add('border-sky-500', 'bg-sky-500/10', 'ring-1', 'ring-sky-500/50');
        if (!btn.querySelector('.active-check-badge')) {
          const badge = document.createElement('span');
          badge.className = 'active-check-badge text-sky-400 text-xs mt-1 block';
          badge.innerHTML = '<i class="bi bi-check-circle-fill"></i> ใช้งานอยู่';
          btn.appendChild(badge);
        }
      } else {
        btn.classList.remove('border-sky-500', 'bg-sky-500/10', 'ring-1', 'ring-sky-500/50');
        const badge = btn.querySelector('.active-check-badge');
        if (badge) badge.remove();
      }
    });
  }

  // =========================================================================
  // UIVERSE COMBINED PROGRESS MODAL CONTROLLER & ABORT CONTROLLER
  // =========================================================================
  let currentAbortController = null;
  let isProgressActive = false;

  window.openProgressModal = function (title = 'กำลังดำเนินการ...', onCancelCallback = null) {
    const modal = document.getElementById('uiverseProgressModal');
    const titleEl = document.getElementById('uiverseModalTitle');
    const activeView = document.getElementById('uiverseProgressActiveView');
    const successView = document.getElementById('uiverseProgressSuccessView');
    const failView = document.getElementById('uiverseProgressFailView');
    const bar = document.getElementById('uiverseProgressBar');
    const percentEl = document.getElementById('uiverseProgressPercent');
    const stepEl = document.getElementById('uiverseProgressStep');
    const subtextEl = document.getElementById('uiverseProgressSubtext');
    const statusEl = document.getElementById('uiverseProgressStatus');
    const bytesEl = document.getElementById('uiverseProgressBytes');

    if (!modal) return;

    currentAbortController = new AbortController();
    isProgressActive = true;

    if (titleEl) titleEl.innerHTML = `<i class="bi bi-arrow-repeat animate-spin text-sky-400"></i><span>${title}</span>`;
    if (activeView) activeView.classList.remove('hidden');
    if (successView) successView.classList.add('hidden');
    if (failView) failView.classList.add('hidden');

    if (bar) bar.style.width = '0%';
    if (percentEl) percentEl.textContent = '0%';
    if (stepEl) stepEl.textContent = 'กำลังเตรียมข้อมูล...';
    if (subtextEl) subtextEl.textContent = 'กรุณารอสักครู่ ระบบกำลังประมวลผล';
    if (statusEl) statusEl.textContent = 'พร้อมส่ง...';
    if (bytesEl) bytesEl.textContent = '';

    modal.classList.remove('hidden');
    window._onProgressCancelCallback = onCancelCallback;
  };

  window.updateProgressModal = function (percent, stepText = '', statusText = '', bytesText = '') {
    const bar = document.getElementById('uiverseProgressBar');
    const percentEl = document.getElementById('uiverseProgressPercent');
    const stepEl = document.getElementById('uiverseProgressStep');
    const statusEl = document.getElementById('uiverseProgressStatus');
    const bytesEl = document.getElementById('uiverseProgressBytes');

    const cleanPct = Math.min(100, Math.max(0, Math.round(percent)));
    if (bar) bar.style.width = `${cleanPct}%`;
    if (percentEl) percentEl.textContent = `${cleanPct}%`;
    if (stepEl && stepText) stepEl.textContent = stepText;
    if (statusEl && statusText) statusEl.textContent = statusText;
    if (bytesEl && bytesText) bytesEl.textContent = bytesText;
  };

  window.showProgressSuccess = function (title = 'ดำเนินการสำเร็จเรียบร้อย!', msg = 'ข้อมูลและอวาตาร์ของคุณได้รับการบันทึกแล้ว') {
    isProgressActive = false;
    currentAbortController = null;
    const activeView = document.getElementById('uiverseProgressActiveView');
    const successView = document.getElementById('uiverseProgressSuccessView');
    const failView = document.getElementById('uiverseProgressFailView');
    const successTitle = document.getElementById('uiverseSuccessTitle');
    const successMsg = document.getElementById('uiverseSuccessMsg');

    if (activeView) activeView.classList.add('hidden');
    if (failView) failView.classList.add('hidden');
    if (successView) {
      successView.classList.remove('hidden');
      if (successTitle) successTitle.textContent = title;
      if (successMsg) successMsg.textContent = msg;
    }

    setTimeout(() => {
      closeProgressModal();
    }, 2500);
  };

  window.showProgressError = function (title = 'เกิดข้อผิดพลาด', reason = 'ไม่สามารถดำเนินการให้สำเร็จได้') {
    isProgressActive = false;
    currentAbortController = null;
    const activeView = document.getElementById('uiverseProgressActiveView');
    const successView = document.getElementById('uiverseProgressSuccessView');
    const failView = document.getElementById('uiverseProgressFailView');
    const failTitle = document.getElementById('uiverseFailTitle');
    const failReason = document.getElementById('uiverseFailReason');

    if (activeView) activeView.classList.add('hidden');
    if (successView) successView.classList.add('hidden');
    if (failView) {
      failView.classList.remove('hidden');
      if (failTitle) failTitle.textContent = title;
      if (failReason) failReason.textContent = reason;
    }
  };

  window.cancelCurrentProgress = function () {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    isProgressActive = false;
    if (typeof window._onProgressCancelCallback === 'function') {
      try { window._onProgressCancelCallback(); } catch (e) {}
    }
    closeProgressModal();
    showToast('ยกเลิกการทำงานแล้ว', 'info');
  };

  window.closeProgressModal = function () {
    const modal = document.getElementById('uiverseProgressModal');
    if (modal) modal.classList.add('hidden');
    isProgressActive = false;
  };

  // Wire Doodle Drag & Drop Zone
  function initDoodleDropZone() {
    const dropZone = document.getElementById('doodleDropZone');
    const fileInput = document.getElementById('userProfileFileInput');
    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('ring-4', 'ring-sky-400', 'scale-105');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('ring-4', 'ring-sky-400', 'scale-105');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt?.files;
      if (files && files.length > 0) {
        processUploadedAvatarFile(files[0]);
      }
    });
  }

  // 3. User Avatar Upload Handler
  window.handleUserAvatarUpload = function (e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedAvatarFile(file);
    e.target.value = ''; // Reset input to allow re-uploading same file
  };

  async function processUploadedAvatarFile(file) {
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

    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // Launch Uiverse Combined Progress Modal
    openProgressModal('กำลังอัปโหลดรูปโปรไฟล์...', () => {
      console.log('Upload cancelled by user.');
    });
    updateProgressModal(10, 'กำลังอ่านไฟล์รูปภาพ...', 'เตรียมข้อมูล...', fileSizeStr);

    try {
      let uploadedUrl = null;
      let usedProvider = 'Local/Cloud';

      if (window.MultiCloudUploader) {
        const uploader = typeof window.MultiCloudUploader.getInstance === 'function' 
          ? window.MultiCloudUploader.getInstance() 
          : window.MultiCloudUploader;

        if (adminUploadConfig.strategy === 'single') {
          if (uploader.config) uploader.config.activeProvider = adminUploadConfig.singleTarget || 'cloudinary';
        } else {
          if (uploader.config) {
            uploader.config.activeProvider = 'auto';
            if (Array.isArray(adminUploadConfig.priority) && adminUploadConfig.priority.length > 0) {
              uploader.config.providerPriority = [...adminUploadConfig.priority];
            }
          }
        }

        updateProgressModal(25, `กำลังเชื่อมต่อระบบ Cloud Multi-Storage...`, 'กำลังส่งไบต์...', fileSizeStr);

        // Upload with real progress callbacks
        const uploadResult = await uploader.upload(file, {
          folder: 'comed_user_avatars',
          tags: ['avatar', currentUser.email],
          uploaderEmail: currentUser.email,
          signal: currentAbortController ? currentAbortController.signal : undefined,
          onProgress: (percent, msg) => {
            const mappedPct = Math.round(25 + ((percent || 0) * 0.65));
            updateProgressModal(mappedPct, msg || 'กำลังส่งข้อมูลไปยังคลาวด์...', `${Math.round(percent || 0)}%`, fileSizeStr);
          }
        });

        if (uploadResult && uploadResult.url) {
          uploadedUrl = uploadResult.url;
          usedProvider = uploadResult.provider || 'Cloud';
        }
      }

      if (!isProgressActive) return; // User cancelled

      // Fallback: If cloud upload is unavailable or failed, compress heavily before DataURL
      if (!uploadedUrl) {
        updateProgressModal(92, 'กำลังแปลงและบีบอัดรูปภาพโปรไฟล์...', 'ประมวลผลในเบราว์เซอร์...', fileSizeStr);
        uploadedUrl = await compressImageToDataUrl(file, 256, 256, 0.75);
        usedProvider = 'Local Optimized';
      }

      if (!isProgressActive) return; // User cancelled

      updateProgressModal(100, 'บันทึกรูปภาพโปรไฟล์เรียบร้อย!', '100%', fileSizeStr);

      // Update current user avatar
      currentUser.avatar = uploadedUrl;
      renderUserProfile();

      // Safe update in localStorage (Prevent QuotaExceededError)
      safeSaveUserSession(currentUser);
      syncCustomProfileToStorage();

      // Show Success State inside Modal
      showProgressSuccess(
        'อัปโหลดรูปภาพสำเร็จ!',
        `รูปโปรไฟล์ถูกอัปโหลดขึ้น ${usedProvider} เรียบร้อยแล้วและพร้อมใช้งานทันที`
      );
      showToast(`✨ อัปโหลดรูปโปรไฟล์ขึ้น ${usedProvider} สำเร็จแล้ว!`, 'success');

    } catch (err) {
      console.error("Avatar Upload Error", err);
      if (err.name === 'AbortError' || !isProgressActive) {
        // Cancelled by user
        return;
      }
      showProgressError(
        'อัปโหลดรูปภาพไม่สำเร็จ',
        err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยังเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
      showToast('เกิดข้อผิดพลาดในการอัปโหลดภาพ: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'), 'error');
    }
  }

  // Helper to compress image to compact DataURL
  function compressImageToDataUrl(file, maxWidth = 300, maxHeight = 300, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Safe LocalStorage Saving
  function safeSaveUserSession(user) {
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        console.warn("LocalStorage Quota exceeded, saving lightweight user session without heavy data url");
        const lightUser = { ...user };
        // If avatar is heavy data URL, avoid breaking localStorage
        if (lightUser.avatar && lightUser.avatar.startsWith('data:') && lightUser.avatar.length > 50000) {
          lightUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`;
        }
        try {
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(lightUser));
        } catch(e2) {
          console.error("Unable to save user session even with light avatar", e2);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // AVATAR DIMENSION STUDIO: ROTATE, ZOOM, FLIP CONTROLS
  // -------------------------------------------------------------------------
  window.adjustAvatarTransform = function (type, val) {
    if (!userPrefs.avatarTransform) {
      userPrefs.avatarTransform = { rotate: 0, scale: 1, flipX: false, flipY: false };
    }

    const tf = userPrefs.avatarTransform;

    if (type === 'rotate') {
      tf.rotate = ((tf.rotate || 0) + val) % 360;
    } else if (type === 'scale') {
      tf.scale = Math.max(0.5, Math.min(2.5, val));
      const valEl = document.getElementById('avatarZoomValue');
      const drawerValEl = document.getElementById('drawerZoomValue');
      const pctStr = `${Math.round(tf.scale * 100)}%`;
      if (valEl) valEl.textContent = pctStr;
      if (drawerValEl) drawerValEl.textContent = pctStr;

      const zoomSlider = document.getElementById('avatarZoomSlider');
      const drawerZoomSlider = document.getElementById('drawerZoomSlider');
      if (zoomSlider) zoomSlider.value = tf.scale;
      if (drawerZoomSlider) drawerZoomSlider.value = tf.scale;
    } else if (type === 'flipX') {
      tf.flipX = !tf.flipX;
      const btn = document.getElementById('btnFlipX');
      const btnDrawer = document.getElementById('btnDrawerFlipX');
      if (btn) btn.classList.toggle('border-sky-500', tf.flipX);
      if (btnDrawer) btnDrawer.classList.toggle('border-sky-500', tf.flipX);
    } else if (type === 'flipY') {
      tf.flipY = !tf.flipY;
      const btn = document.getElementById('btnFlipY');
      const btnDrawer = document.getElementById('btnDrawerFlipY');
      if (btn) btn.classList.toggle('border-sky-500', tf.flipY);
      if (btnDrawer) btnDrawer.classList.toggle('border-sky-500', tf.flipY);
    }

    if (currentUser) {
      currentUser.avatarTransform = { ...tf };
    }

    renderUserProfile();
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
  };

  window.resetAvatarTransforms = function () {
    userPrefs.avatarTransform = { rotate: 0, scale: 1, flipX: false, flipY: false };
    if (currentUser) {
      currentUser.avatarTransform = { ...userPrefs.avatarTransform };
    }

    const zoomSlider = document.getElementById('avatarZoomSlider');
    const zoomVal = document.getElementById('avatarZoomValue');
    const drawerZoomSlider = document.getElementById('drawerZoomSlider');
    const drawerZoomVal = document.getElementById('drawerZoomValue');
    const btnFlipX = document.getElementById('btnFlipX');
    const btnFlipY = document.getElementById('btnFlipY');
    const btnDrawerFlipX = document.getElementById('btnDrawerFlipX');
    const btnDrawerFlipY = document.getElementById('btnDrawerFlipY');

    if (zoomSlider) zoomSlider.value = 1;
    if (zoomVal) zoomVal.textContent = '100%';
    if (drawerZoomSlider) drawerZoomSlider.value = 1;
    if (drawerZoomVal) drawerZoomVal.textContent = '100%';

    if (btnFlipX) btnFlipX.classList.remove('border-sky-500');
    if (btnFlipY) btnFlipY.classList.remove('border-sky-500');
    if (btnDrawerFlipX) btnDrawerFlipX.classList.remove('border-sky-500');
    if (btnDrawerFlipY) btnDrawerFlipY.classList.remove('border-sky-500');

    renderUserProfile();
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
    showToast('รีเซ็ตการปรับแต่งรูปโปรไฟล์แล้ว', 'info');
  };

  // -------------------------------------------------------------------------
  // AVATAR DRESSING ROOM SLIDE DRAWER CONTROLLERS (SLIDE FROM RIGHT)
  // -------------------------------------------------------------------------
  window.openAvatarDrawer = function () {
    const backdrop = document.getElementById('avatarDrawerBackdrop');
    const panel = document.getElementById('avatarDrawerPanel');
    if (!backdrop || !panel) return;

    renderUserProfile();
    highlightSelectedDecorations();

    // Sync drawer controls with current preferences
    const tf = userPrefs.avatarTransform || { rotate: 0, scale: 1, flipX: false, flipY: false };
    const drawerZoomSlider = document.getElementById('drawerZoomSlider');
    const drawerZoomVal = document.getElementById('drawerZoomValue');
    const btnDrawerFlipX = document.getElementById('btnDrawerFlipX');
    const btnDrawerFlipY = document.getElementById('btnDrawerFlipY');

    if (drawerZoomSlider) drawerZoomSlider.value = tf.scale || 1;
    if (drawerZoomVal) drawerZoomVal.textContent = `${Math.round((tf.scale || 1) * 100)}%`;
    if (btnDrawerFlipX) btnDrawerFlipX.classList.toggle('border-sky-500', !!tf.flipX);
    if (btnDrawerFlipY) btnDrawerFlipY.classList.toggle('border-sky-500', !!tf.flipY);

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden';
  };

  window.closeAvatarDrawer = function (e) {
    if (e && e.target && e.target !== document.getElementById('avatarDrawerBackdrop')) {
      // If clicking inside drawer, do nothing unless clicking close button
    }
    const backdrop = document.getElementById('avatarDrawerBackdrop');
    const panel = document.getElementById('avatarDrawerPanel');
    if (!backdrop || !panel) return;

    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  };

  // Random and Seed Avatar Helpers
  window.generateRandomAvatar = function () {
    if (!currentUser) return;
    const randomSeed = 'comed_' + Math.random().toString(36).substring(2, 9);
    userPrefs.avatarSeed = randomSeed;
    currentUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    renderUserProfile();
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
    showToast('🎲 สุ่มรูปอวาตาร์ใหม่เรียบร้อยแล้ว!', 'info');
  };

  window.changeAvatarSeed = function (seed) {
    if (!currentUser) return;
    userPrefs.avatarSeed = seed;
    currentUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    renderUserProfile();
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
    showToast(`เลือกอวาตาร์: ${seed}`, 'info');
  };

  // Reset to default Dicebear avatar
  window.resetToDefaultAvatar = function () {
    if (!currentUser) return;
    currentUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.email)}`;
    renderUserProfile();
    safeSaveUserSession(currentUser);
    syncCustomProfileToStorage();
    showToast('รีเซ็ตรูปโปรไฟล์กลับเป็นค่าเริ่มต้นแล้ว', 'info');
  };

  // Sync User Profile for Public Roster & Directory Display
  function syncCustomProfileToStorage() {
    if (!currentUser || !currentUser.email) return;
    try {
      const profilesKey = 'COMED_CUSTOM_USERS_PROFILES_V1';
      const storedProfiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
      const emailKey = currentUser.email.toLowerCase().trim();
      storedProfiles[emailKey] = {
        name: currentUser.name,
        nickname: currentUser.nickname,
        phone: currentUser.phone,
        bio: currentUser.bio,
        studentId: currentUser.studentId,
        avatar: currentUser.avatar,
        avatarFrame: currentUser.avatarFrame || userPrefs.avatarFrame || 'none',
        avatarAnim: currentUser.avatarAnim || userPrefs.avatarAnim || 'none',
        avatarTransform: currentUser.avatarTransform || userPrefs.avatarTransform || { rotate: 0, scale: 1, flipX: false, flipY: false },
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(profilesKey, JSON.stringify(storedProfiles));
    } catch (e) {
      console.warn("syncCustomProfileToStorage failed", e);
    }
  }

  // Select Avatar Frame
  window.selectAvatarFrame = function (frameName) {
    userPrefs.avatarFrame = frameName;
    if (currentUser) currentUser.avatarFrame = frameName;
    renderUserProfile();
    highlightSelectedDecorations();
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
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
    safeSaveUserSession(currentUser);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));
    syncCustomProfileToStorage();
    showToast(`เลือกแอนิเมชัน: ${animName.toUpperCase()}`, 'info');
  };

  // 4. Save User Profile Form
  function initSettingsForm() {
    const form = document.getElementById('userProfileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
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
      currentUser.avatarTransform = userPrefs.avatarTransform || { rotate: 0, scale: 1, flipX: false, flipY: false };

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
        avatarAnim: userPrefs.avatarAnim,
        avatarTransform: userPrefs.avatarTransform
      };

      // Show Uiverse Multi-stage Progress Modal
      openProgressModal('กำลังบันทึกข้อมูลโปรไฟล์...');
      updateProgressModal(25, 'กำลังตรวจสอบข้อมูลส่วนตัว...', 'ตรวจสอบความถูกต้อง...', '1/3');

      try {
        await new Promise(r => setTimeout(r, 400));
        if (!isProgressActive) return;

        updateProgressModal(65, 'กำลังซิงค์และบันทึกอวาตาร์ & กรอบ...', 'กำลังเขียนข้อมูล...', '2/3');

        // Persist in LocalStorage
        safeSaveUserSession(currentUser);
        localStorage.setItem(USER_PREFS_KEY, JSON.stringify(userPrefs));

        // Save into COMED_CUSTOM_USERS_PROFILES_V1 for ecosystem sync
        try {
          const profilesKey = 'COMED_CUSTOM_USERS_PROFILES_V1';
          const storedProfiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
          if (currentUser.email) {
            storedProfiles[currentUser.email.toLowerCase().trim()] = {
              name: currentUser.name,
              nickname: currentUser.nickname,
              phone: currentUser.phone,
              bio: currentUser.bio,
              studentId: currentUser.studentId,
              avatar: currentUser.avatar,
              avatarFrame: currentUser.avatarFrame,
              avatarAnim: currentUser.avatarAnim,
              avatarTransform: currentUser.avatarTransform,
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem(profilesKey, JSON.stringify(storedProfiles));
          }
        } catch (e) {
          console.warn("Could not sync to custom profiles table", e);
        }

        await new Promise(r => setTimeout(r, 400));
        if (!isProgressActive) return;

        updateProgressModal(100, 'อัปเดตข้อมูลสำเร็จแล้ว!', '100%', '3/3');
        renderUserProfile();

        showProgressSuccess(
          'บันทึกข้อมูลสำเร็จ!',
          'ข้อมูลโปรไฟล์ อวาตาร์ และเอฟเฟกต์แอนิเมชันถูกบันทึกเรียบร้อยแล้ว'
        );
        showToast('🎉 บันทึกการตั้งค่าโปรไฟล์และเอฟเฟกต์เรียบร้อยแล้ว!', 'success');

      } catch (err) {
        console.error("Save profile error", err);
        showProgressError('บันทึกข้อมูลไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        showToast('เกิดข้อผิดพลาด: ' + (err.message || 'บันทึกไม่สำเร็จ'), 'error');
      }
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
