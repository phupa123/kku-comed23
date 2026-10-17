/**
 * =========================================================================
 * PAYMENT PAGE LOGIC - assets/js/payment.js
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

// ================= DYNAMIC MULTI-CAMPAIGN CONTEXT =================
const urlParams = new URLSearchParams(window.location.search);
const currentCampaignId = urlParams.get("camp") || urlParams.get("id") || "shirt69";
let currentCampaign = (window.ComedCampaignManager ? window.ComedCampaignManager.getCampaignById(currentCampaignId) : null) || {
  id: "shirt69",
  title: "ค่าเสื้อสาขาวิชาเอกคอมพิวเตอร์ศึกษา",
  amount: 390,
  deadline: "2026-11-15T23:59:00+07:00",
  gasApiUrl: "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec"
};

let TARGET_PAYMENT_PER_PERSON = currentCampaign.amount || 190;
let STORAGE_KEY = `COMED_PAYMENT_DATA_${currentCampaign.id.toUpperCase()}`;
let CLOUD_URL_KEY = `COMED_CLOUD_URL_${currentCampaign.id.toUpperCase()}`;
let googleAppsScriptUrl = currentCampaign.gasApiUrl || localStorage.getItem(CLOUD_URL_KEY) || "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";

// Deadline: Dynamic from campaign
let DEADLINE_DATE = new Date(currentCampaign.deadline || '2026-09-04T23:59:00+07:00').getTime();

let studentDatabase = [];
let paymentRecords = {}; // { studentId: { paid: true, timestamp: "...", slipUrl: "...", refCode: "..." } }
let currentSelectedStudent = null;
let tempSlipDataUrl = null;
let currentStudentPaidSlip = null;
let currentFilter = 'all';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  runIntroAnimation();
  await initApp();
});

function runIntroAnimation() {
  const splash = document.getElementById('introSplashOverlay');
  const pBar = document.getElementById('introProgressBar');
  if (!splash) return;

  // Don't replay intro animation if already seen in current browsing session
  const introSeen = sessionStorage.getItem('COMED_INTRO_SEEN_V1');
  if (introSeen) {
    splash.remove();
    return;
  }

  // Mark intro as seen for this session
  sessionStorage.setItem('COMED_INTRO_SEEN_V1', 'true');

  setTimeout(() => {
    if (pBar) pBar.style.width = '100%';
  }, 100);

  setTimeout(() => {
    if (typeof gsap !== 'undefined') {
      gsap.to(".intro-logo-anim", { scale: 1.1, opacity: 0, duration: 0.4 });
      gsap.to(".intro-text-anim", { y: -20, opacity: 0, duration: 0.4 });
      gsap.to(splash, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          splash.remove();
        }
      });
    } else {
      splash.remove();
    }
  }, 1200);
}

// --- ISSUE REPORTING (HELP DESK) ---
function openIssueModal() {
  const modal = document.getElementById('modalReportIssue');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeIssueModal() {
  const modal = document.getElementById('modalReportIssue');
  if (modal) modal.classList.add('hidden');
}

function openIssueConfirmModal() {
  const studentInput = document.getElementById('issueStudentInput')?.value.trim() || '';
  const contactInput = document.getElementById('issueContactInput')?.value.trim() || '';
  const category = document.getElementById('issueCategorySelect')?.value || '';
  const detail = document.getElementById('issueDetailInput')?.value.trim() || '';
  const evidence = document.getElementById('issueEvidenceUrlInput')?.value.trim() || '';

  if (!studentInput) {
    alert("⚠️ กรุณากรอกรหัสนักศึกษา หรือชื่อของคุณก่อน");
    return;
  }
  if (!contactInput) {
    alert("⚠️ กรุณากรอกช่องทางติดต่อกลับก่อน");
    return;
  }

  const sEl = document.getElementById('confirmIssueStudent');
  const cEl = document.getElementById('confirmIssueContact');
  const catEl = document.getElementById('confirmIssueCategory');
  const dEl = document.getElementById('confirmIssueDetail');

  if (sEl) sEl.textContent = studentInput;
  if (cEl) cEl.textContent = contactInput;
  if (catEl) catEl.textContent = category;
  if (dEl) dEl.textContent = detail || '(ไม่ได้ระบุ)';

  const evRow = document.getElementById('confirmIssueEvidenceRow');
  const evText = document.getElementById('confirmIssueEvidence');
  if (evidence) {
    if (evText) evText.textContent = evidence;
    if (evRow) evRow.classList.remove('hidden');
  } else {
    if (evRow) evRow.classList.add('hidden');
  }

  const actionArea = document.getElementById('issueSubmitActionArea');
  const loadingState = document.getElementById('issueSubmitLoadingState');
  const modal = document.getElementById('modalConfirmIssue');

  if (actionArea) actionArea.classList.remove('hidden');
  if (loadingState) loadingState.classList.add('hidden');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeIssueConfirmModal() {
  const modal = document.getElementById('modalConfirmIssue');
  if (modal) modal.classList.add('hidden');
}

async function executeIssueSubmission() {
  const actionArea = document.getElementById('issueSubmitActionArea');
  const loadingState = document.getElementById('issueSubmitLoadingState');

  if (actionArea) actionArea.classList.add('hidden');
  if (loadingState) loadingState.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const issueId = "ISSUE-" + Date.now();
  const timeStr = new Date().toLocaleString('th-TH');

  const payload = {
    action: "report_issue",
    issueId: issueId,
    id: issueId,
    studentId: document.getElementById('issueStudentInput')?.value.trim() || '',
    name: document.getElementById('issueStudentInput')?.value.trim() || '',
    contact: document.getElementById('issueContactInput')?.value.trim() || '',
    category: document.getElementById('issueCategorySelect')?.value || '',
    detail: document.getElementById('issueDetailInput')?.value.trim() || "-",
    evidenceUrl: document.getElementById('issueEvidenceUrlInput')?.value.trim() || "-",
    status: "รอดำเนินการ",
    timestamp: timeStr
  };

  // บันทึกลง LocalStorage Issues เพื่อให้หลังบ้านเห็นทันที
  try {
    const stored = localStorage.getItem('COMED_KKU69_ISSUES_V2');
    const list = stored ? JSON.parse(stored) : [];
    list.unshift(payload);
    localStorage.setItem('COMED_KKU69_ISSUES_V2', JSON.stringify(list));
  } catch (err) { }

  // ส่งขึ้น Cloud Google Apps Script
  if (googleAppsScriptUrl) {
    try {
      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) { }
  }

  // หน่วงเวลาให้เห็น Animation เล็กน้อยเพื่อความราบรื่น
  await new Promise(r => setTimeout(r, 900));

  closeIssueConfirmModal();
  closeIssueModal();

  // Reset form
  const sInput = document.getElementById('issueStudentInput');
  const cInput = document.getElementById('issueContactInput');
  const dInput = document.getElementById('issueDetailInput');
  const eInput = document.getElementById('issueEvidenceUrlInput');

  if (sInput) sInput.value = '';
  if (cInput) cInput.value = '';
  if (dInput) dInput.value = '';
  if (eInput) eInput.value = '';

  showFrontendToast("✅ ส่งข้อมูลแจ้งปัญหาสำเร็จแล้ว! ทีมแอดมินจะรีบตรวจสอบครับ");
}

async function initApp() {
  // 0. Cloud Sync: Fetch fresh campaigns list from Supabase
  if (window.ComedCampaignManager && typeof window.ComedCampaignManager.fetchFromCloud === 'function') {
    try {
      await window.ComedCampaignManager.fetchFromCloud();
      currentCampaign = window.ComedCampaignManager.getCampaignById(currentCampaignId) || currentCampaign;
      TARGET_PAYMENT_PER_PERSON = currentCampaign.amount || 190;
      STORAGE_KEY = `COMED_PAYMENT_DATA_${currentCampaign.id.toUpperCase()}`;
      CLOUD_URL_KEY = `COMED_CLOUD_URL_${currentCampaign.id.toUpperCase()}`;
      DEADLINE_DATE = new Date(currentCampaign.deadline || '2026-09-04T23:59:00+07:00').getTime();
    } catch (e) {}
  }

  // Render Campaign Selector / Switcher Grid
  renderCampaignsNav();
  applyCampaignDetailsToUI();

  // 1. Load initial dataset
  if (typeof window.studentDatabaseRaw !== 'undefined') {
    studentDatabase = window.studentDatabaseRaw;
  } else if (Array.isArray(window.STUDENTS_DATA)) {
    studentDatabase = window.STUDENTS_DATA;
  } else {
    studentDatabase = getFallbackStudents();
  }

  // 2. Fetch payments from Supabase / Google Apps Script / LocalStorage
  await loadPaymentRecords();

  // 3. Setup UI & Listeners
  setupSearchInputListener();
  setupCountdownTimer();
  refreshProgressStats();
  renderStatusTable();
  checkPaymentUserSession();

  // GSAP Page Entrance Animation
  if (typeof gsap !== 'undefined') {
    gsap.from("header", { y: -30, opacity: 0, duration: 0.6, ease: "power3.out" });
    gsap.from("#campaignSelectorSection", { y: 20, opacity: 0, duration: 0.6, delay: 0.1, ease: "power3.out" });
    gsap.from(".hero-card-animate", { y: 25, opacity: 0, duration: 0.7, delay: 0.2, ease: "power3.out" });
    gsap.from(".search-card-animate", { y: 25, opacity: 0, duration: 0.7, delay: 0.3, ease: "power3.out" });
  }

  // If URL has tab=status or auto=pay, handle accordingly
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab');
  const autoPay = urlParams.get('auto');
  if (targetTab === 'status') {
    switchMainTab('status');
  } else if (autoPay === 'pay') {
    switchMainTab('payment');
    setTimeout(() => {
      const payForm = document.getElementById('searchContainer') || document.getElementById('smartSearchInput');
      if (payForm) payForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }

  // Init Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Helper to smoothly scroll down or up to campaign selector
window.scrollToCampaignSelector = function(event) {
  if (event) event.preventDefault();
  const target = document.getElementById('campaignSelectorSection');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Smooth Page Transition Swapper for Campaigns & Tab Switching
window.switchCampaignWithAnimation = function(targetCampId, event, extraTab = '') {
  if (event) event.preventDefault();
  if (!targetCampId) return;

  const isSameCampaign = (targetCampId.toLowerCase() === currentCampaign.id.toLowerCase());
  
  if (isSameCampaign) {
    // If clicking on the currently selected campaign's buttons
    if (extraTab.includes('tab=status')) {
      switchMainTab('status');
      const statusEl = document.getElementById('tabContentStatus');
      if (statusEl) statusEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (extraTab.includes('auto=pay') || extraTab === '') {
      switchMainTab('payment');
      const payForm = document.getElementById('searchContainer') || document.getElementById('smartSearchInput') || document.getElementById('bankQrCardSection');
      if (payForm) payForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  const main = document.querySelector('main');
  const targetUrl = `payment.html?camp=${encodeURIComponent(targetCampId)}${extraTab ? `&${extraTab}` : ''}`;

  if (typeof gsap !== 'undefined' && main) {
    gsap.to(main, {
      opacity: 0,
      y: -18,
      scale: 0.985,
      duration: 0.28,
      ease: "power2.inOut",
      onComplete: () => {
        window.location.href = targetUrl;
      }
    });
  } else {
    window.location.href = targetUrl;
  }
};

// Render dynamic campaign switcher cards
function renderCampaignsNav() {
  const container = document.getElementById('campaignsNavGrid');
  const countBadge = document.getElementById('campaignsTotalCountBadge');
  const headerPillsContainer = document.getElementById('headerCampaignPillsContainer');
  if (!window.ComedCampaignManager) return;

  const allCampaigns = window.ComedCampaignManager.getAllCampaigns();
  if (countBadge) countBadge.textContent = `${allCampaigns.length} รายการ`;

  // 1. Render Header Quick Pills
  if (headerPillsContainer) {
    headerPillsContainer.innerHTML = allCampaigns.map(camp => {
      const isSelected = (camp.id.toLowerCase() === currentCampaign.id.toLowerCase());
      return `
        <a href="payment.html?camp=${encodeURIComponent(camp.id)}" 
          onclick="switchCampaignWithAnimation('${camp.id}', event)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 ${
            isSelected 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30' 
              : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 shadow-2xs'
          }">
          <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-orange-400'}"></span>
          <span class="truncate max-w-[150px] sm:max-w-none">${camp.title}</span>
          <span class="text-[10px] font-mono opacity-85 px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}">฿${camp.amount}</span>
        </a>
      `;
    }).join('');
  }

  // 2. Render Main Cards Grid
  if (container) {
    container.innerHTML = allCampaigns.map(camp => {
      const isSelected = (camp.id.toLowerCase() === currentCampaign.id.toLowerCase());
      let statusPill = '';

      if (camp.status === 'completed') {
        statusPill = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><i data-lucide="check-check" class="w-3 h-3"></i> ชำระครบแล้ว</span>';
      } else if (camp.status === 'open') {
        statusPill = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> เปิดรับ</span>';
      } else {
        statusPill = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">ปิดรับชั่วคราว</span>';
      }

      const payLink = `payment.html?camp=${encodeURIComponent(camp.id)}&auto=pay`;
      const checkLink = `payment.html?camp=${encodeURIComponent(camp.id)}&tab=status`;

      return `
        <div onclick="switchCampaignWithAnimation('${camp.id}', event)" 
          class="p-4 rounded-3xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer hover-elevate group ${
            isSelected 
              ? 'bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-white border-2 border-orange-500 active-campaign-glow ring-2 ring-orange-500/30' 
              : 'bg-white hover:bg-orange-50/40 border border-slate-200/90 hover:border-orange-300 shadow-sm'
          }">
          ${isSelected ? '<div class="absolute top-0 right-0 bg-gradient-to-l from-orange-600 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> รายการที่เลือก</div>' : ''}
          
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">${camp.category || 'กิจกรรม'}</span>
              <div class="pt-0.5">${statusPill}</div>
            </div>
            <h3 class="font-black text-sm sm:text-base text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">${camp.title}</h3>
            <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">${camp.subtitle || 'คณะศึกษาศาสตร์ มข.'}</p>
            
            <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-400 text-[11px]">ยอดชำระต่อคน</span>
              <span class="font-black text-orange-600 font-mono text-base">฿${Number(camp.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="mt-3.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2" onclick="event.stopPropagation()">
            <a href="${payLink}" 
              onclick="switchCampaignWithAnimation('${camp.id}', event, 'auto=pay')"
              class="py-2 px-3 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-1.5 transition active:scale-95 ${
                isSelected 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25' 
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200'
              }">
              <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
              <span>ชำระเงิน</span>
            </a>
            <a href="${checkLink}" 
              onclick="switchCampaignWithAnimation('${camp.id}', event, 'tab=status')"
              class="py-2 px-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95">
              <i data-lucide="users" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>เช็ครายชื่อ</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

let currentSelectedShirtSize = null;

// Update Hero, Bank Details, Shirt Showcase & Background according to current campaign
function applyCampaignDetailsToUI() {
  const c = currentCampaign;
  if (!c) return;

  const titleEl = document.getElementById('heroCampaignTitle');
  const subEl = document.getElementById('heroCampaignSubtitle');
  const amtText = document.getElementById('heroAmountText');
  const catText = document.getElementById('heroCategoryText');
  const dlineText = document.getElementById('heroDeadlineText');
  const targetMoney = document.getElementById('targetMoney');
  const headTitle = document.getElementById('headerDynamicTitle');

  if (headTitle) headTitle.textContent = c.title ? `ระบบชำระเงิน${c.title}` : "ระบบชำระเงินสาขาวิชาคอมพิวเตอร์ศึกษา";
  if (titleEl) titleEl.textContent = c.title || "ระบบชำระเงิน";
  if (subEl) subEl.textContent = c.subtitle || "สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มข.";
  if (amtText) amtText.textContent = `${c.title} คนละ ฿${Number(c.amount).toLocaleString()}`;
  if (catText) catText.textContent = c.category || "COMED 69";
  if (dlineText) dlineText.textContent = `ถึง ${c.deadlineDisplay || c.deadline || "กำหนดการปิดรับ"}`;
  
  const totalTarget = (c.amount || 190) * 60;
  if (targetMoney) targetMoney.textContent = `/ ฿${totalTarget.toLocaleString()} (เป้าหมาย)`;

  // Dynamic Custom Background Wallpaper
  const heroBg = document.getElementById('heroCustomBgLayer');
  const heroTint = document.getElementById('heroCustomBgTint');
  if (heroBg) {
    if (c.bgImage && c.bgImage.trim()) {
      heroBg.style.backgroundImage = `url('${c.bgImage.trim()}')`;
      heroBg.classList.remove('opacity-0');
      heroBg.classList.add('opacity-40');
      if (heroTint) heroTint.classList.remove('hidden');
    } else {
      heroBg.style.backgroundImage = 'none';
      heroBg.classList.add('opacity-0');
      heroBg.classList.remove('opacity-40');
      if (heroTint) heroTint.classList.add('hidden');
    }
  }

  // Bank Info Update
  const bTitle = document.getElementById('bankDetailTitle');
  const bAmt = document.getElementById('bankDetailAmount');
  const bBank = document.getElementById('bankDetailBankName');
  const bAccNum = document.getElementById('bankDetailAccountNum');
  const bAccName = document.getElementById('bankDetailAccountName');
  const bAmtHi = document.getElementById('bankAmountHighlight');

  if (bTitle) bTitle.textContent = `${c.title} (COMED KKU 69)`;
  if (bAmt) bAmt.textContent = `฿${Number(c.amount).toFixed(2)} บาท / คน`;
  if (bBank) bBank.textContent = c.bankName || "ธนาคารกสิกรไทย (KPlus)";
  if (bAccNum) bAccNum.textContent = c.accountNumber || "236-2-47817-3";
  if (bAccName) bAccName.textContent = c.accountName || "น.ส. พิชามญธุ์ สามสี";
  if (bAmtHi) bAmtHi.textContent = `฿${Number(c.amount).toLocaleString()} บาท`;
  const dzAmt = document.getElementById('slipDropZoneTargetAmount');
  if (dzAmt) dzAmt.textContent = `฿${Number(c.amount).toFixed(2)} บาท`;

  // Dynamic QR Code Generation (Auto Locked PromptPay vs Custom Image)
  renderCurrentCampaignQrCode(c.amount);

  // Render Shirt Showcase UI (If banner or shirt sizes available)
  renderShirtShowcaseUI(c);
}

let currentGeneratedDynamicQrDataUrl = null;
let currentEffectiveAmount = null;

// Dynamically generate Thai QR Payment with locked amount or use custom image
async function renderCurrentCampaignQrCode(amountOverride) {
  const c = currentCampaign;
  if (!c) return;

  const bQr = document.getElementById('bankQrImage');
  const spinner = document.getElementById('qrLoadingSpinner');
  const amtToLock = (amountOverride !== undefined && amountOverride !== null) ? Number(amountOverride) : Number(c.amount || 190);
  currentEffectiveAmount = amtToLock;

  // Helper: show image, hide spinner
  function showQrImg(src) {
    if (bQr) { bQr.src = src; bQr.classList.remove('hidden'); }
    if (spinner) spinner.classList.add('hidden');
  }

  // Show spinner while loading
  if (bQr) bQr.classList.add('hidden');
  if (spinner) spinner.classList.remove('hidden');

  // If campaign specifies qrType === 'custom' OR has an uploaded custom image (not default qr_payment.png)
  const isCustomImage = (c.qrType === 'custom') || (c.qrImage && c.qrImage.trim() && !c.qrImage.includes('qr_payment.png'));
  if (isCustomImage && c.qrImage && c.qrImage.trim()) {
    currentGeneratedDynamicQrDataUrl = c.qrImage;
    showQrImg(c.qrImage);
    return;
  }

  // Otherwise, automatically generate standard Thai QR Payment PromptPay slip card with locked amount!
  if (window.ThaiQrEngine && typeof window.ThaiQrEngine.generatePromptPaySlipCard === 'function') {
    try {
      const cleanAcc = (c.promptpayTarget || c.accountNumber || '2362478173').replace(/[^0-9]/g, '');
      const cardDataUrl = await window.ThaiQrEngine.generatePromptPaySlipCard({
        target: cleanAcc || '2362478173',
        amount: amtToLock,
        accountName: c.accountName || 'น.ส. พิชามญธุ์ สามสี',
        accountNumber: c.accountNumber || '236-2-47817-3',
        refCode: c.code ? `KKU${c.code}69` : '004999250006870'
      });
      currentGeneratedDynamicQrDataUrl = cardDataUrl;
      showQrImg(cardDataUrl);
      return;
    } catch(err) {
      console.warn("ThaiQrEngine slip generation failed, falling back to static QR image:", err);
    }
  }

  // Fallback to static qrImage or default
  if (c.qrImage) {
    currentGeneratedDynamicQrDataUrl = c.qrImage;
    showQrImg(c.qrImage);
  } else {
    // Last resort — show qr_payment.png
    showQrImg('qr_payment.png');
  }
}

function renderShirtShowcaseUI(campaign) {
  const showcaseSection = document.getElementById('campaignShirtShowcaseSection');
  if (!showcaseSection) return;

  const hasSizes = Array.isArray(campaign.shirtSizes) && campaign.shirtSizes.length > 0;

  // If campaign does not have sizes configured, hide all shirt showcase and student shirt size selector!
  if (!hasSizes) {
    showcaseSection.classList.add('hidden');
    const studentShirtBox = document.getElementById('studentShirtSizeCard');
    if (studentShirtBox) studentShirtBox.classList.add('hidden');
    return;
  }

  showcaseSection.classList.remove('hidden');

  // 1. Banner Image & Price
  const bannerImg = document.getElementById('showcaseMainBannerImg');
  const bannerUrl = campaign.bannerImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80';
  if (bannerImg) bannerImg.src = bannerUrl;

  const priceTag = document.getElementById('showcasePriceTag');
  if (priceTag) priceTag.textContent = `฿${Number(campaign.amount || 390).toLocaleString()}.-`;

  const singlePriceEl = document.getElementById('showcaseSinglePriceText');
  if (singlePriceEl) singlePriceEl.textContent = `฿${Number(campaign.amount || 390).toLocaleString()}`;

  const titleEl = document.getElementById('showcaseTitleText');
  if (titleEl) titleEl.textContent = campaign.title;

  const subEl = document.getElementById('showcaseSubtitleText');
  if (subEl) subEl.textContent = campaign.subtitle || 'เสื้อกิจกรรมและเสื้อเอกประจำรุ่น สวมใส่สบาย ระบายอากาศดี';

  const catPill = document.getElementById('showcaseCategoryPill');
  if (catPill) catPill.textContent = campaign.category || 'เสื้อสาขาวิชาเอก';

  // 2. Thumbnails Gallery (if galleryImages provided)
  const thumbRow = document.getElementById('showcaseThumbnailsRow');
  const gallery = Array.isArray(campaign.galleryImages) && campaign.galleryImages.length > 0
    ? campaign.galleryImages
    : (hasBanner ? [bannerUrl] : []);

  if (thumbRow) {
    if (gallery.length > 1) {
      thumbRow.classList.remove('hidden');
      thumbRow.innerHTML = gallery.map((imgUrl, i) => `
        <div onclick="switchShowcaseBanner('${escapeHtmlAttr(imgUrl)}')" class="w-16 h-12 rounded-xl overflow-hidden border-2 border-orange-300 hover:border-orange-500 cursor-pointer flex-shrink-0 transition-transform hover:scale-105 shadow-xs">
          <img src="${escapeHtmlAttr(imgUrl)}" alt="thumb ${i+1}" class="w-full h-full object-cover">
        </div>
      `).join('');
    } else {
      thumbRow.classList.add('hidden');
    }
  }

  // 3. Sizes Grid
  const sizes = hasSizes ? campaign.shirtSizes : [
    { size: "S", chest: "36\"", length: "26\"", price: campaign.amount || 290 },
    { size: "M", chest: "38\"", length: "27\"", price: campaign.amount || 290 },
    { size: "L", chest: "40\"", length: "28\"", price: campaign.amount || 290 },
    { size: "XL", chest: "42\"", length: "29\"", price: campaign.amount || 290 },
    { size: "2XL", chest: "44\"", length: "30\"", price: (campaign.amount || 290) + 20 },
    { size: "3XL", chest: "48\"", length: "31\"", price: (campaign.amount || 290) + 40 }
  ];

  // Default selection: L or first
  if (!currentSelectedShirtSize) {
    currentSelectedShirtSize = sizes.find(s => s.size === 'L') || sizes[0];
  }

  renderSizeButtons(sizes);

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function escapeHtmlAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function switchShowcaseBanner(imgUrl) {
  const bannerImg = document.getElementById('showcaseMainBannerImg');
  if (bannerImg && imgUrl) {
    bannerImg.src = imgUrl;
  }
}

function openCurrentShirtBannerFullscreen() {
  const bannerImg = document.getElementById('showcaseMainBannerImg');
  const url = bannerImg ? bannerImg.src : (currentCampaign.bannerImage || 'logo.png');
  openFullscreenModal(url);
}

function renderSizeButtons(sizes) {
  const showcaseGrid = document.getElementById('showcaseSizesGrid');
  const studentGrid = document.getElementById('studentSizeButtonsContainer');
  const studentShirtBox = document.getElementById('studentShirtSizeCard');

  if (studentShirtBox) {
    studentShirtBox.classList.remove('hidden');
  }

  const renderBtns = (container, isStudentCard) => {
    if (!container) return;
    container.innerHTML = sizes.map(s => {
      const isSelected = currentSelectedShirtSize && (currentSelectedShirtSize.size === s.size);
      return `
        <button type="button" onclick="selectShirtSize('${s.size}')"
          class="p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 text-center ${
            isSelected
              ? 'bg-gradient-to-tr from-orange-500 to-amber-500 border-orange-500 text-white shadow-md shadow-orange-500/30 font-black'
              : 'bg-white hover:bg-orange-50/60 border-slate-200 text-slate-800 font-bold hover:border-orange-300'
          }">
          <span class="text-sm font-black block">${s.size}</span>
          <span class="text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-500'} block">อก ${s.chest}</span>
          <span class="text-[9px] ${isSelected ? 'text-amber-200' : 'text-orange-600 font-bold'} block mt-0.5">฿${s.price || currentCampaign.amount}</span>
        </button>
      `;
    }).join('');
  };

  renderBtns(showcaseGrid, false);
  renderBtns(studentGrid, true);
  updateSelectedSizeUI();
}

function selectShirtSize(sizeName) {
  const c = currentCampaign;
  const sizes = (c && Array.isArray(c.shirtSizes) && c.shirtSizes.length > 0)
    ? c.shirtSizes
    : [
      { size: "S", chest: "36\"", length: "26\"", price: c.amount || 290 },
      { size: "M", chest: "38\"", length: "27\"", price: c.amount || 290 },
      { size: "L", chest: "40\"", length: "28\"", price: c.amount || 290 },
      { size: "XL", chest: "42\"", length: "29\"", price: c.amount || 290 },
      { size: "2XL", chest: "44\"", length: "30\"", price: (c.amount || 290) + 20 },
      { size: "3XL", chest: "48\"", length: "31\"", price: (c.amount || 290) + 40 }
    ];

  const found = sizes.find(s => s.size === sizeName) || sizes[0];
  currentSelectedShirtSize = found;

  renderSizeButtons(sizes);
}

function updateSelectedSizeUI() {
  if (!currentSelectedShirtSize) return;

  const notice = document.getElementById('showcaseSelectedSizeNotice');
  const label = document.getElementById('showcaseSelectedSizeLabel');
  const price = document.getElementById('showcaseSelectedSizePrice');
  const studentBadge = document.getElementById('studentSelectedSizePriceBadge');

  if (notice) notice.classList.remove('hidden');
  if (label) label.textContent = `ไซส์ที่เลือก: ${currentSelectedShirtSize.size} (รอบอก ${currentSelectedShirtSize.chest} ยาว ${currentSelectedShirtSize.length})`;
  if (price) price.textContent = `฿${Number(currentSelectedShirtSize.price).toLocaleString()}`;
  if (studentBadge) studentBadge.textContent = `ไซส์ ${currentSelectedShirtSize.size} (฿${Number(currentSelectedShirtSize.price).toLocaleString()})`;

  // Also update bank detail amount if size has custom price
  const bAmtHi = document.getElementById('bankAmountHighlight');
  const bAmt = document.getElementById('bankDetailAmount');
  if (bAmtHi) bAmtHi.textContent = `฿${Number(currentSelectedShirtSize.price).toLocaleString()} บาท`;
  if (bAmt) bAmt.textContent = `฿${Number(currentSelectedShirtSize.price).toFixed(2)} บาท / คน (ไซส์ ${currentSelectedShirtSize.size})`;
  const dzAmt = document.getElementById('slipDropZoneTargetAmount');
  if (dzAmt) dzAmt.textContent = `฿${Number(currentSelectedShirtSize.price).toFixed(2)} บาท`;

  // Re-generate locked QR Code for this exact selected size amount!
  if (typeof renderCurrentCampaignQrCode === 'function') {
    renderCurrentCampaignQrCode(currentSelectedShirtSize.price);
  }
}

function openCurrentQrFullscreen() {
  const qrImg = document.getElementById('bankQrImage');
  const qr = currentGeneratedDynamicQrDataUrl || (qrImg ? qrImg.src : '') || currentCampaign.qrImage || 'qr_payment.png';
  openFullscreenModal(qr);
}

// --- REAL API & CLOUD SYNC (Supabase First, GAS Fallback, LocalStorage Fallback) ---
async function loadPaymentRecords() {
  // Priority 1: Supabase (Ultra-Fast PostgreSQL Realtime Database)
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (sb) {
    try {
      const { data, error } = await sb.from('payments').select('*').eq('campaign_id', currentCampaign.id);
      if (!error && Array.isArray(data)) {
        paymentRecords = {};
        data.forEach(item => {
          let slips = [];
          if (Array.isArray(item.slips)) {
            slips = item.slips;
          } else if (typeof item.slips === 'string' && item.slips.startsWith('[')) {
            try { slips = JSON.parse(item.slips); } catch(e){}
          }
          if (slips.length === 0 && item.slip_url) {
            if (item.slip_url.startsWith('[') && item.slip_url.endsWith(']')) {
              try { slips = JSON.parse(item.slip_url); } catch(e){}
            } else {
              slips = [{ url: item.slip_url, timestamp: item.timestamp || '', amount: item.amount || currentCampaign.amount }];
            }
          }
          // Pick the most recent slip as primarySlip
          const latestSlip = slips.length > 0 ? slips[slips.length - 1] : null;
          const primarySlip = latestSlip ? (latestSlip.url || latestSlip) : (item.slip_url || '');

          paymentRecords[item.student_id] = {
            studentId: item.student_id,
            studentName: item.student_name || '',
            name: item.student_name || '',
            nickname: item.student_nickname || '',
            email: item.student_email || '',
            paid: !!item.paid,
            timestamp: item.timestamp || '',
            slipUrl: primarySlip,
            slips: slips,
            refCode: item.ref_code || '',
            amount: item.amount || currentCampaign.amount
          };
        });
        saveLocalBackup();
        return;
      }
    } catch(e) {
      console.warn("Supabase load payments warning:", e);
    }
  }

  // Priority 2: Google Apps Script Web App (Production Cloud Database)
  if (googleAppsScriptUrl) {
    try {
      const res = await fetch(googleAppsScriptUrl);
      if (res.ok) {
        paymentRecords = await res.json();
        saveLocalBackup();
        return;
      }
    } catch (e) {
      console.warn("Cloud Google Apps Script fetch failed", e);
    }
  }

  // Priority 3: Localhost Development Server only
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        paymentRecords = await res.json();
        saveLocalBackup();
        return;
      }
    } catch (e) {}
  }

  // Priority 4: LocalStorage Backup
  loadFromLocal();
}

function loadFromLocal() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    paymentRecords = stored ? JSON.parse(stored) : {};
  } catch (e) {
    paymentRecords = {};
  }
}

async function manualRefreshData() {
  const icon = document.getElementById('refreshIcon');

  // หมุนไอคอนอย่างนุ่มนวลด้วย GSAP
  if (icon && typeof gsap !== 'undefined') {
    gsap.to(icon, { rotation: "+=360", duration: 0.6, ease: "power2.inOut" });
  }

  await loadPaymentRecords();
  refreshProgressStats();
  renderStatusTable();

  if (currentSelectedStudent) {
    selectStudent(currentSelectedStudent);
  }

  // แสดง Popup แจ้งเตือนว่ารีเฟรชข้อมูลล่าสุดสำเร็จแล้ว
  showFrontendToast("✨ รีเฟรชและอัปเดตข้อมูลล่าสุดสำเร็จแล้ว!");
}

function showFrontendToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-2xl border border-orange-500/40 flex items-center gap-2.5 backdrop-blur-xl';
  toast.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(toast, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.5)" });
    setTimeout(() => {
      gsap.to(toast, { opacity: 0, y: 20, scale: 0.9, duration: 0.3, onComplete: () => toast.remove() });
    }, 2500);
  } else {
    setTimeout(() => toast.remove(), 2500);
  }
}

function saveLocalBackup() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentRecords));
  } catch (e) { }
}

// --- COUNTDOWN TIMER ---
function setupCountdownTimer() {
  function updateTimer() {
    const now = new Date().getTime();
    const distance = DEADLINE_DATE - now;

    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMins = document.getElementById('cdMins');
    const cdSecs = document.getElementById('cdSecs');
    const badge = document.getElementById('countdownStatusBadge');

    if (distance < 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMins) cdMins.textContent = '00';
      if (cdSecs) cdSecs.textContent = '00';
      if (badge) {
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> สิ้นสุดเวลารับชำระแล้ว';
        badge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1';
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(minutes).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// --- STATS & PROGRESS CALCULATION ---
function refreshProgressStats() {
  const allStudents = studentDatabase || [];
  const exemptedList = Array.isArray(currentCampaign.exemptedStudentIds) ? currentCampaign.exemptedStudentIds : [];
  
  // Eligible students = นักเรียนที่ไม่ได้รับการยกเว้น
  const eligibleStudents = allStudents.filter(st => {
    return !exemptedList.includes(st.id) && !exemptedList.includes(st.id.replace(/-/g, ''));
  });

  const totalCount = eligibleStudents.length; // จำนวนคนที่ต้องชำระจริง
  let paidCount = 0;

  eligibleStudents.forEach(st => {
    if (paymentRecords[st.id] && paymentRecords[st.id].paid) {
      paidCount++;
    }
  });

  const totalTargetMoney = totalCount * TARGET_PAYMENT_PER_PERSON;
  const currentMoney = paidCount * TARGET_PAYMENT_PER_PERSON;

  const peoplePercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const moneyPercent = totalTargetMoney > 0 ? Math.round((currentMoney / totalTargetMoney) * 100) : 0;

  // Update Money UI
  const totalMoneyEl = document.getElementById('totalMoneyPaid');
  const targetMoneyEl = document.getElementById('targetMoney');
  const moneyPercentBadgeEl = document.getElementById('moneyPercentBadge');
  const moneyProgressBarEl = document.getElementById('moneyProgressBar');

  if (totalMoneyEl) totalMoneyEl.textContent = `฿${currentMoney.toLocaleString()}`;
  if (targetMoneyEl) targetMoneyEl.textContent = `/ ฿${totalTargetMoney.toLocaleString()} (เป้าหมาย)`;
  if (moneyPercentBadgeEl) moneyPercentBadgeEl.textContent = `${moneyPercent}%`;
  if (moneyProgressBarEl) moneyProgressBarEl.style.width = `${moneyPercent}%`;

  // Update People UI
  const totalPeopleEl = document.getElementById('totalPeoplePaid');
  const targetPeopleEl = document.getElementById('targetPeople');
  const peoplePercentBadgeEl = document.getElementById('peoplePercentBadge');
  const peopleProgressBarEl = document.getElementById('peopleProgressBar');

  if (totalPeopleEl) totalPeopleEl.textContent = `${paidCount}`;
  if (targetPeopleEl) targetPeopleEl.textContent = `/ ${totalCount} คนที่ต้องชำระ`;
  if (peoplePercentBadgeEl) peoplePercentBadgeEl.textContent = `${peoplePercent}%`;
  if (peopleProgressBarEl) peopleProgressBarEl.style.width = `${peoplePercent}%`;

  // Filter Counts
  const countAllEl = document.getElementById('countAllFilter');
  const countPaidEl = document.getElementById('countPaidFilter');
  const countUnpaidEl = document.getElementById('countUnpaidFilter');

  if (countAllEl) countAllEl.textContent = allStudents.length;
  if (countPaidEl) countPaidEl.textContent = paidCount;
  if (countUnpaidEl) countUnpaidEl.textContent = (totalCount - paidCount);
}

// --- AUTO-FORMATTING & SMART SEARCH ---
function setupSearchInputListener() {
  const input = document.getElementById('smartSearchInput');
  const clearBtn = document.getElementById('btnClearSearch');
  const dropdown = document.getElementById('autocompleteDropdown');
  const searchContainer = document.getElementById('searchContainer');

  if (!input || !dropdown) return;

  // Click outside to close dropdown
  document.addEventListener('click', (e) => {
    if (searchContainer && !searchContainer.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  input.addEventListener('input', (e) => {
    let value = input.value;
    if (clearBtn) clearBtn.classList.toggle('hidden', value.length === 0);

    // Auto formatting 693050XXX-X
    const rawDigits = value.replace(/\D/g, '');
    if (/^\d+$/.test(value.replace(/-/g, '')) && rawDigits.length >= 2) {
      if (rawDigits.length <= 9) {
        input.value = rawDigits;
      } else {
        input.value = rawDigits.slice(0, 9) + '-' + rawDigits.slice(9, 10);
      }
      value = input.value;
    }

    performSearch(value.trim());
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0) {
      performSearch(input.value.trim());
    }
  });
}

function clearSearchInput() {
  const input = document.getElementById('smartSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('btnClearSearch');
  const dropdown = document.getElementById('autocompleteDropdown');
  const hint = document.getElementById('matchCountHint');

  if (clearBtn) clearBtn.classList.add('hidden');
  if (dropdown) dropdown.classList.add('hidden');
  if (hint) hint.classList.add('hidden');
  if (input) input.focus();
}

function clearSelectedStudent() {
  currentSelectedStudent = null;
  tempSlipDataUrl = null;
  const fileInput = document.getElementById('slipFileInput');
  const preview = document.getElementById('slipPreviewContainer');
  const card = document.getElementById('studentProfileCard');

  if (fileInput) fileInput.value = '';
  if (preview) preview.classList.add('hidden');
  
  if (card && typeof gsap !== 'undefined') {
    gsap.to(card, { opacity: 0, y: -15, duration: 0.25, onComplete: () => {
      card.classList.add('hidden');
    }});
  } else if (card) {
    card.classList.add('hidden');
  }

  const input = document.getElementById('smartSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  const clearBtn = document.getElementById('btnClearSearch');
  const dropdown = document.getElementById('autocompleteDropdown');
  const hint = document.getElementById('matchCountHint');

  if (clearBtn) clearBtn.classList.add('hidden');
  if (dropdown) dropdown.classList.add('hidden');
  if (hint) hint.classList.add('hidden');
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      const input = document.getElementById('smartSearchInput');
      if (!input) return;
      const rawDigits = text.trim().replace(/\D/g, '');
      if (rawDigits.length === 10 && rawDigits.startsWith('69')) {
        input.value = rawDigits.slice(0, 9) + '-' + rawDigits.slice(9, 10);
      } else {
        input.value = text.trim();
      }
      input.dispatchEvent(new Event('input'));
    }
  } catch (err) {
    alert("กรุณากดวาง (Ctrl+V หรือ Cmd+V) ในช่องค้นหา");
  }
}

function performSearch(query) {
  const dropdown = document.getElementById('autocompleteDropdown');
  const hint = document.getElementById('matchCountHint');

  if (!dropdown) return;

  if (!query) {
    dropdown.classList.add('hidden');
    if (hint) hint.classList.add('hidden');
    return;
  }

  const q = query.toLowerCase().replace(/-/g, '');
  const matches = studentDatabase.filter(st => {
    const idClean = st.id.toLowerCase().replace(/-/g, '');
    const nameClean = st.name.toLowerCase();
    const nickClean = st.nickname.toLowerCase();
    const emailClean = st.email.toLowerCase();

    return idClean.includes(q) ||
      nameClean.includes(q) ||
      nickClean.includes(q) ||
      emailClean.includes(q);
  });

  const exactMatch = studentDatabase.find(st =>
    st.id === query ||
    st.id.replace(/-/g, '') === query.replace(/-/g, '') ||
    st.email.toLowerCase() === query.toLowerCase()
  );

  if (matches.length > 0) {
    if (hint) {
      hint.textContent = `พบ ${matches.length} รายการ`;
      hint.classList.remove('hidden');
    }
    renderAutocompleteList(matches);
    dropdown.classList.remove('hidden');
  } else {
    if (hint) {
      hint.textContent = `ไม่พบข้อมูลที่ตรงกัน`;
      hint.classList.remove('hidden');
    }
    dropdown.innerHTML = `
      <div class="p-4 text-center text-slate-400 text-xs font-semibold">
        ไม่พบรายชื่อที่ตรงกับ "${query}"
      </div>
    `;
    dropdown.classList.remove('hidden');
  }

  // Auto-select ONLY when full 11-char student ID (e.g. 693050120-5) or full email is typed
  if (exactMatch && (query === exactMatch.id || (query.length === 11 && query.replace(/-/g, '') === exactMatch.id.replace(/-/g, '')) || query.toLowerCase() === exactMatch.email.toLowerCase())) {
    selectStudent(exactMatch);
    dropdown.classList.add('hidden');
  }
}

function renderAutocompleteList(list) {
  const dropdown = document.getElementById('autocompleteDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = list.map(st => {
    const isPaid = paymentRecords[st.id] && paymentRecords[st.id].paid;
    const isEligible = window.ComedCampaignManager ? window.ComedCampaignManager.isStudentEligible(currentCampaign, st.id) : true;
    const isExempted = !isPaid && !isEligible;

    let badgeHtml = '';
    if (isPaid) {
      badgeHtml = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> จ่ายแล้ว</span>';
    } else if (isExempted) {
      badgeHtml = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> ได้รับการยกเว้น</span>';
    } else {
      badgeHtml = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ยังไม่จ่าย</span>';
    }

    return `
      <div onclick="handleAutocompleteSelect('${st.id}')" class="p-3.5 sm:p-4 hover:bg-orange-50/90 cursor-pointer flex items-center justify-between transition-all duration-200 group search-item-hover rounded-xl m-1 border border-transparent hover:border-orange-200/80 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/25 border-2 border-white flex-shrink-0 group-hover:scale-105 transition-transform">
            ${st.nickname.slice(0, 1) || st.name.slice(0, 1)}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-black text-slate-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors">${st.name}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-orange-100/80 text-orange-800 font-extrabold border border-orange-200/60 shadow-3xs">
                น้อง${st.nickname}
              </span>
            </div>
            <div class="text-[11px] sm:text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
              <span class="font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">${st.id}</span>
              <span class="text-slate-300">•</span>
              <span class="text-slate-500 truncate max-w-[150px] sm:max-w-none">${st.email}</span>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 ml-2">
          ${badgeHtml}
        </div>
      </div>
    `;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleAutocompleteSelect(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  if (st) {
    const input = document.getElementById('smartSearchInput');
    const dropdown = document.getElementById('autocompleteDropdown');
    if (input) input.value = st.id;
    if (dropdown) dropdown.classList.add('hidden');
    selectStudent(st);
  }
}

// --- STUDENT PROFILE DISPLAY ---
function selectStudent(st) {
  currentSelectedStudent = st;
  tempSlipDataUrl = null;
  const preview = document.getElementById('slipPreviewContainer');
  if (preview) preview.classList.add('hidden');

  // Populate Card
  const avatarText = document.getElementById('profileAvatarText');
  const fullName = document.getElementById('profileFullName');
  const nickname = document.getElementById('profileNickname');
  const studentId = document.getElementById('profileStudentId');
  const email = document.getElementById('profileEmail');

  if (avatarText) avatarText.textContent = st.nickname.slice(0, 1) || st.name.slice(0, 1);
  if (fullName) fullName.textContent = st.name;
  if (nickname) nickname.textContent = `ชื่อเล่น: น้อง${st.nickname}`;
  if (studentId) studentId.textContent = st.id;
  if (email) email.textContent = st.email;

  const record = paymentRecords[st.id];
  const isPaid = record && record.paid;
  
  // Check if student is exempted from current campaign
  const isEligible = window.ComedCampaignManager ? window.ComedCampaignManager.isStudentEligible(currentCampaign, st.id) : true;
  const isExempted = !isPaid && !isEligible;

  const statusBadgeContainer = document.getElementById('profileStatusBadgeContainer');
  const unpaidSection = document.getElementById('unpaidSection');
  const paidSection = document.getElementById('paidSection');
  const exemptedSection = document.getElementById('exemptedSection');

  if (isPaid) {
    if (statusBadgeContainer) {
      statusBadgeContainer.innerHTML = `
        <div class="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
          <span>ชำระเงินเรียบร้อยแล้ว</span>
        </div>
        <button type="button" onclick="clearSelectedStudent()" class="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200 cursor-pointer">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
          <span>เปลี่ยนคน</span>
        </button>
      `;
    }
    const pTime = document.getElementById('paidTimestampText');
    const pRef = document.getElementById('paidRefCode');
    const pAmtEl = document.getElementById('paidAmountDisplay');
    if (pTime) pTime.textContent = record.timestamp || '-';
    if (pRef) pRef.textContent = record.refCode || 'TXN-COMED-' + st.id.replace(/\D/g, '');
    const paidAmtNum = record.amount || currentCampaign.amount || 190;
    if (pAmtEl) pAmtEl.textContent = `฿${Number(paidAmtNum).toFixed(2)} บาท`;

    currentStudentPaidSlip = record.slipUrl || '';
    const driveLinkEl = document.getElementById('paidSectionDriveLink');
    const wrapperEl = document.getElementById('paidSectionIframeWrapper');

    let drivePreviewUrl = currentStudentPaidSlip;
    if (currentStudentPaidSlip.includes('drive.google.com')) {
      const idMatch = currentStudentPaidSlip.match(/[-\w]{25,}/);
      if (idMatch) {
        drivePreviewUrl = `https://drive.google.com/file/d/${idMatch[0]}/preview`;
      }
    }

    if (driveLinkEl) {
      driveLinkEl.href = currentStudentPaidSlip || '#';
    }
    if (wrapperEl) {
      const displayUrl = formatDriveImageUrl(currentStudentPaidSlip);
      const isDirect = currentStudentPaidSlip.startsWith('data:image') ||
        currentStudentPaidSlip.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
        currentStudentPaidSlip.includes('cloudinary') ||
        currentStudentPaidSlip.includes('catbox');

      if (isDirect) {
        wrapperEl.innerHTML = `<img src="${displayUrl}" alt="สลิปโอนเงิน" class="max-h-full max-w-full object-contain mx-auto rounded-xl cursor-pointer hover:opacity-95 transition" onclick="openFullscreenModal('${displayUrl}')" title="คลิกเพื่อดูรูปขยายเต็มจอ">`;
      } else if (drivePreviewUrl) {
        wrapperEl.innerHTML = `<iframe src="${drivePreviewUrl}" class="w-full h-full border-0 rounded-xl" allow="autoplay" loading="lazy"></iframe>`;
      } else {
        wrapperEl.innerHTML = `<span class="text-xs text-slate-400 font-medium">ไม่มีภาพสลิป</span>`;
      }
    }
    // Multi-slip rendering
    const slipsList = Array.isArray(record.slips) && record.slips.length > 0 
      ? record.slips 
      : (record.slipUrl ? [{ url: record.slipUrl, timestamp: record.timestamp || '', amount: record.amount }] : []);

    const counterBadge = document.getElementById('paidSlipCounterBadge');
    if (counterBadge) {
      counterBadge.textContent = `${slipsList.length} ใบ`;
    }

    const multiContainer = document.getElementById('paidMultiSlipsContainer');
    const multiCount = document.getElementById('paidMultiSlipsCount');
    const multiList = document.getElementById('paidMultiSlipsList');

    if (multiContainer && multiList) {
      if (slipsList.length > 1) {
        multiContainer.classList.remove('hidden');
        if (multiCount) multiCount.textContent = slipsList.length;
        multiList.innerHTML = slipsList.map((sItem, sIdx) => {
          const rawSUrl = typeof sItem === 'string' ? sItem : (sItem.url || '');
          const sDisplayUrl = formatDriveImageUrl(rawSUrl);
          const sTime = typeof sItem === 'object' && sItem.timestamp ? sItem.timestamp : '';
          const isDirectImg = rawSUrl.startsWith('data:image') || rawSUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || rawSUrl.includes('cloudinary') || rawSUrl.includes('catbox');
          return `
            <div onclick="openFullscreenModal('${sDisplayUrl}')" class="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition cursor-pointer group flex flex-col items-center">
              <div class="w-full h-24 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-slate-100 shadow-xs mb-1.5">
                ${isDirectImg 
                  ? `<img src="${sDisplayUrl}" alt="สลิป ${sIdx+1}" class="max-h-full max-w-full object-contain">`
                  : `<iframe src="${sDisplayUrl}" class="w-full h-full pointer-events-none border-0" loading="lazy"></iframe>`
                }
              </div>
              <div class="w-full flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span class="font-bold text-slate-700">ใบที่ #${sIdx+1}</span>
                <span class="text-orange-600 font-bold group-hover:underline">ดูรูป</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        multiContainer.classList.add('hidden');
      }
    }

    if (unpaidSection) unpaidSection.classList.add('hidden');
    if (paidSection) paidSection.classList.remove('hidden');
    if (exemptedSection) exemptedSection.classList.add('hidden');
  } else if (isExempted) {
    if (statusBadgeContainer) {
      statusBadgeContainer.innerHTML = `
        <div class="px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <i data-lucide="shield-check" class="w-4 h-4 text-amber-600"></i>
          <span>ได้รับการยกเว้นไม่ต้องชำระ</span>
        </div>
        <button type="button" onclick="clearSelectedStudent()" class="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200 cursor-pointer">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
          <span>เปลี่ยนคน</span>
        </button>
      `;
    }
    const exCampNotice = document.getElementById('exemptedNoticeCampaignName');
    if (exCampNotice) exCampNotice.textContent = `รายการ "${currentCampaign.title}" แอดมินได้ยกเว้นค่าใช้จ่ายให้คุณ`;

    if (unpaidSection) unpaidSection.classList.add('hidden');
    if (paidSection) paidSection.classList.add('hidden');
    if (exemptedSection) exemptedSection.classList.remove('hidden');
  } else {
    const currentPrice = currentSelectedShirtSize && currentSelectedShirtSize.price ? currentSelectedShirtSize.price : (currentCampaign.amount || 190);
    if (statusBadgeContainer) {
      statusBadgeContainer.innerHTML = `
        <div class="px-4 py-2 rounded-2xl bg-rose-100 text-rose-900 border border-rose-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600"></i>
          <span>ยังไม่ได้ชำระเงิน (฿${currentPrice.toLocaleString()})</span>
        </div>
      `;
    }
    if (unpaidSection) unpaidSection.classList.remove('hidden');
    if (paidSection) paidSection.classList.add('hidden');
    if (exemptedSection) exemptedSection.classList.add('hidden');
  }

  // Show Card with GSAP Animation & Smooth Auto-Scroll
  const card = document.getElementById('studentProfileCard');
  if (card) {
    card.classList.remove('hidden');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(card, 
        { opacity: 0, y: 30, scale: 0.98 }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.5, 
          ease: "back.out(1.4)",
          onComplete: () => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      );
    } else {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- FILE UPLOAD & PREVIEW HANDLERS ---
function handleDragOver(e) {
  e.preventDefault();
  const dz = document.getElementById('slipDropZone');
  if (dz) dz.classList.add('border-orange-500', 'bg-orange-50/60');
}

function handleDragLeave(e) {
  e.preventDefault();
  const dz = document.getElementById('slipDropZone');
  if (dz) dz.classList.remove('border-orange-500', 'bg-orange-50/60');
}

function handleDrop(e) {
  e.preventDefault();
  handleDragLeave(e);
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    processUploadedFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files[0]) {
    processUploadedFile(e.target.files[0]);
  }
}

function processUploadedFile(file) {
  if (!file.type.startsWith('image/')) {
    alert("⚠️ กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)");
    return;
  }

  // ตรวจสอบขนาดไฟล์ไม่เกิน 10MB (10 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    alert(`⚠️ ขนาดไฟล์ของคุณ (${sizeInMb} MB) เกินขีดจำกัดที่กำหนด 10 MB!\nกรุณาเลือกไฟล์สลิปที่มีขนาดไม่เกิน 10 MB`);
    const fi = document.getElementById('slipFileInput');
    if (fi) fi.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    tempSlipDataUrl = event.target.result;

    const mediumImg = document.getElementById('mediumSlipImg');
    if (mediumImg) mediumImg.src = tempSlipDataUrl;

    const previewContainer = document.getElementById('slipPreviewContainer');
    if (previewContainer) {
      previewContainer.classList.remove('hidden');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(previewContainer, { opacity: 0, y: 15, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" });
      }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };
  reader.readAsDataURL(file);
}

function cancelSelectedSlip() {
  tempSlipDataUrl = null;
  const fi = document.getElementById('slipFileInput');
  const preview = document.getElementById('slipPreviewContainer');
  if (fi) fi.value = '';
  if (preview) preview.classList.add('hidden');
}

// --- CONFIRMATION MODAL & SUBMISSION (CLOUD + BACKEND) ---
function openConfirmModal() {
  if (!currentSelectedStudent) {
    alert("กรุณาเลือกนักศึกษาก่อน");
    return;
  }
  if (!tempSlipDataUrl) {
    alert("กรุณาเลือกหรือแนบรูปภาพสลิปก่อน");
    return;
  }

  // If campaign has shirt sizes configured, ensure student selected a size
  const hasShirtSizes = Array.isArray(currentCampaign.shirtSizes) && currentCampaign.shirtSizes.length > 0;
  if (hasShirtSizes && !currentSelectedShirtSize) {
    alert("⚠️ กรุณาเลือกไซส์เสื้อของคุณก่อนส่งสลิปหลักฐาน");
    const sizeCard = document.getElementById('studentShirtSizeCard');
    if (sizeCard) {
      sizeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizeCard.classList.add('ring-4', 'ring-orange-500/50');
      setTimeout(() => sizeCard.classList.remove('ring-4', 'ring-orange-500/50'), 1500);
    }
    return;
  }

  const mCampaignTitle = document.getElementById('modalConfirmCampaignTitle');
  const mName = document.getElementById('modalConfirmName');
  const mId = document.getElementById('modalConfirmId');
  const mAmount = document.getElementById('modalConfirmAmount');
  const mSizeRow = document.getElementById('modalConfirmSizeRow');
  const mSelectedSize = document.getElementById('modalConfirmSelectedSize');
  const mImg = document.getElementById('modalConfirmSlipImg');

  if (mCampaignTitle) mCampaignTitle.textContent = currentCampaign.title || 'ชำระเงินสาขา';
  if (mName) mName.textContent = `${currentSelectedStudent.name} (${currentSelectedStudent.nickname})`;
  if (mId) mId.textContent = currentSelectedStudent.id;
  
  const finalAmount = currentSelectedShirtSize && currentSelectedShirtSize.price
    ? currentSelectedShirtSize.price
    : (currentCampaign.amount || 190);
  if (mAmount) mAmount.textContent = `฿${finalAmount.toLocaleString()}`;

  if (hasShirtSizes && currentSelectedShirtSize) {
    if (mSizeRow) mSizeRow.classList.remove('hidden');
    if (mSelectedSize) {
      mSelectedSize.textContent = `${currentSelectedShirtSize.size} (รอบอก ${currentSelectedShirtSize.chest}" ความยาว ${currentSelectedShirtSize.length}")`;
    }
  } else {
    if (mSizeRow) mSizeRow.classList.add('hidden');
  }

  if (mImg) mImg.src = tempSlipDataUrl;

  // Reset Modal UI state
  const actionArea = document.getElementById('slipActionButtonsArea');
  const progressState = document.getElementById('slipUploadingProgressState');
  const bar = document.getElementById('uploadAnimatedBar');
  const title = document.getElementById('uploadStatusTitle');
  const subtitle = document.getElementById('uploadStatusSubtitle');

  if (actionArea) actionArea.classList.remove('hidden');
  if (progressState) progressState.classList.add('hidden');
  if (bar) bar.style.width = '0%';
  if (title) title.textContent = 'กำลังส่งข้อมูลและอัปโหลดรูปสลิป...';
  if (subtitle) subtitle.textContent = 'กรุณารอสักครู่ ระบบกำลังประมวลผลขึ้นสู่ Google Cloud';

  const modal = document.getElementById('modalConfirmUpload');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeConfirmModal() {
  const modal = document.getElementById('modalConfirmUpload');
  if (modal) modal.classList.add('hidden');

  // Reset modal controls for next submission
  const actionArea = document.getElementById('slipActionButtonsArea');
  const progressState = document.getElementById('slipUploadingProgressState');
  const bar = document.getElementById('uploadAnimatedBar');
  const title = document.getElementById('uploadStatusTitle');
  const subtitle = document.getElementById('uploadStatusSubtitle');

  if (actionArea) actionArea.classList.remove('hidden');
  if (progressState) progressState.classList.add('hidden');
  if (bar) bar.style.width = '0%';
  if (title) title.textContent = 'กำลังส่งข้อมูลและอัปโหลดรูปสลิป...';
  if (subtitle) subtitle.textContent = 'กรุณารอสักครู่ ระบบกำลังประมวลผลขึ้นสู่ Google Cloud';
}

async function executeSlipSubmission() {
  if (!currentSelectedStudent || !tempSlipDataUrl) return;

  const actionArea = document.getElementById('slipActionButtonsArea');
  const progressState = document.getElementById('slipUploadingProgressState');
  const bar = document.getElementById('uploadAnimatedBar');
  const title = document.getElementById('uploadStatusTitle');
  const subtitle = document.getElementById('uploadStatusSubtitle');

  if (actionArea) actionArea.classList.add('hidden');
  if (progressState) progressState.classList.remove('hidden');
  if (bar) bar.style.width = '35%';

  const studentId = currentSelectedStudent.id;
  const finalAmount = currentSelectedShirtSize && currentSelectedShirtSize.price
    ? currentSelectedShirtSize.price
    : (currentCampaign.amount || 190);
  const selectedShirtSizeStr = currentSelectedShirtSize ? currentSelectedShirtSize.size : null;

  // Use Thai Timezone Formatting
  let thaiTimestamp = window.SlipVerificationEngine
    ? window.SlipVerificationEngine.formatThaiDateTime(new Date())
    : new Date().toLocaleString('th-TH');
  let refCode = "TXN-COMED-" + Math.floor(100000 + Math.random() * 900000);
  let isVerifiedAuto = false;

  // 1. Slip Verification (SlipOK / Multi-provider auto scan or manual mode)
  if (window.SlipVerificationEngine) {
    if (title) title.textContent = '🔍 กำลังตรวจสอบสลิปและยอดเงิน...';
    if (subtitle) subtitle.textContent = 'ระบบกำลังวิเคราะห์ QR Code และยอดเงินในสลิป';
    if (bar) bar.style.width = '25%';

    try {
      const verifyRes = await window.SlipVerificationEngine.verifySlip(tempSlipDataUrl, finalAmount, currentSelectedStudent);
      if (!verifyRes.success) {
        // Verification failed (Amount Mismatch or Duplicate Slip)
        if (progressState) progressState.classList.add('hidden');
        if (actionArea) actionArea.classList.remove('hidden');
        if (bar) bar.style.width = '0%';
        alert(`❌ การตรวจสอบสลิปล้มเหลว!\n\n${verifyRes.message || 'สลิปไม่ถูกต้องหรือยอดเงินไม่ตรง'}\n\nกรุณาตรวจสอบสลิปโอนเงิน หรือติดต่อแอดมินสาขา`);
        return;
      }

      if (verifyRes.verified) {
        isVerifiedAuto = true;
        if (verifyRes.transRef) refCode = verifyRes.transRef;
        if (verifyRes.timestamp) thaiTimestamp = verifyRes.timestamp;
      }
    } catch (vErr) {
      console.warn("Slip verification warning, falling back to manual:", vErr);
    }
  }

  const payload = {
    studentId: studentId,
    name: currentSelectedStudent.name,
    nickname: currentSelectedStudent.nickname,
    email: currentSelectedStudent.email,
    slipBase64: tempSlipDataUrl,
    timestamp: thaiTimestamp,
    refCode: refCode,
    shirtSize: selectedShirtSizeStr,
    amount: finalAmount,
    autoVerified: isVerifiedAuto
  };

  let uploadedSlipUrl = tempSlipDataUrl;
  let resolvedSlipProvider = 'local';

  // Upload slip to Cloud Providers specified by Admin for this campaign (with Failover)
  if (window.MultiCloudUploader) {
    try {
      const allowedProviders = Array.isArray(currentCampaign.slipProviders) && currentCampaign.slipProviders.length > 0
        ? currentCampaign.slipProviders
        : (currentCampaign.slipProvider ? [currentCampaign.slipProvider] : ['catbox', 'imgbb', 'cloudinary']);

      const firstProvider = allowedProviders[0];
      const providerName = window.MultiCloudUploader.getProviderName(firstProvider);
      if (title) title.textContent = `☁️ กำลังส่งสลิปไปยัง ${providerName}...`;

      const cloudRes = await window.MultiCloudUploader.upload(tempSlipDataUrl, {
        preferredProvider: firstProvider,
        priorityProviders: allowedProviders,
        customName: `Slip_${currentSelectedStudent.id}_${currentCampaign.id}.png`,
        category: `สลิป: ${currentCampaign.title || 'ชำระเงิน'}`,
        uploaderId: currentSelectedStudent.id,
        uploaderName: currentSelectedStudent.name,
        uploaderEmail: currentSelectedStudent.email,
        onProgress: (pct, msg) => {
          if (subtitle) subtitle.textContent = msg;
        }
      });
      if (cloudRes && cloudRes.url) {
        uploadedSlipUrl = cloudRes.url;
        resolvedSlipProvider = cloudRes.provider || firstProvider;
      }
    } catch (cErr) {
      console.warn("MultiCloud slip upload fallback:", cErr);
    }
  }

  // Collect and preserve previous slips if this student has uploaded before
  const existingRecord = paymentRecords[studentId] || {};
  let updatedSlips = [];
  if (Array.isArray(existingRecord.slips) && existingRecord.slips.length > 0) {
    updatedSlips = [...existingRecord.slips];
  } else if (existingRecord.slipUrl) {
    updatedSlips = [{
      url: existingRecord.slipUrl,
      timestamp: existingRecord.timestamp || '',
      amount: existingRecord.amount || finalAmount,
      provider: existingRecord.slipProvider || 'cloud'
    }];
  }

  // Push the newly uploaded slip
  updatedSlips.push({
    url: uploadedSlipUrl,
    timestamp: thaiTimestamp,
    refCode: refCode,
    amount: finalAmount,
    provider: resolvedSlipProvider
  });

  // บันทึกลงหน่วยความจำและ LocalStorage ทันที
  const recordData = {
    studentId: studentId,
    studentName: currentSelectedStudent.name,
    name: currentSelectedStudent.name,
    nickname: currentSelectedStudent.nickname,
    email: currentSelectedStudent.email,
    paid: true,
    timestamp: thaiTimestamp,
    slipUrl: uploadedSlipUrl, // Most recent slip as primary
    slips: updatedSlips,
    slipProvider: resolvedSlipProvider,
    refCode: refCode,
    shirtSize: selectedShirtSizeStr || existingRecord.shirtSize,
    amount: finalAmount,
    autoVerified: isVerifiedAuto
  };

  paymentRecords[studentId] = recordData;
  saveLocalBackup();

  // Sync to index.html personal cache (COMED_LOCAL_PAYMENTS) so both student and index are in sync
  try {
    const localPay = JSON.parse(localStorage.getItem('COMED_LOCAL_PAYMENTS') || '{}');
    const cleanId = studentId.replace(/-/g, '').trim();
    localPay[studentId] = recordData;
    if (cleanId) localPay[cleanId] = recordData;
    localStorage.setItem('COMED_LOCAL_PAYMENTS', JSON.stringify(localPay));
  } catch (cErr) {}

  if (bar) bar.style.width = '60%';

  // 1. Send to Supabase Database (Realtime Cloud Database)
  const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (sb) {
    try {
      // Primary payload: store serialized updatedSlips directly inside slip_url so that
      // even if Supabase table schema lacks a dedicated 'slips' column, all multi-slips are 100% preserved
      const payloadWithAllSlips = {
        campaign_id: currentCampaign.id,
        student_id: studentId,
        student_name: currentSelectedStudent.name,
        student_nickname: selectedShirtSizeStr ? `${currentSelectedStudent.nickname} [ไซส์: ${selectedShirtSizeStr}]` : currentSelectedStudent.nickname,
        student_email: currentSelectedStudent.email,
        amount: finalAmount,
        paid: true,
        timestamp: thaiTimestamp,
        slip_url: JSON.stringify(updatedSlips),
        ref_code: refCode,
        verified: isVerifiedAuto
      };

      const { error: sbErr } = await sb.from('payments').upsert(payloadWithAllSlips, { onConflict: 'campaign_id,student_id' });
      if (sbErr) {
        console.warn("Supabase upsert payment notice, attempting simple slip_url fallback:", sbErr);
        // Fallback: simple primary string url
        await sb.from('payments').upsert({
          ...payloadWithAllSlips,
          slip_url: uploadedSlipUrl
        }, { onConflict: 'campaign_id,student_id' });
      }
    } catch(err) {
      console.warn("Supabase insert payment warning:", err);
    }
  }

  // 2. Send to Google Apps Script (Cloud)
  if (googleAppsScriptUrl) {
    try {
      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Cloud Sync warning", e);
    }
  }

  // 2. Send to Local Backend Server (if available)
  try {
    fetch('/api/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) { }

  if (bar) bar.style.width = '100%';
  if (title) title.textContent = '✨ อัปโหลดและบันทึกข้อมูลเสร็จสิ้น!';
  if (subtitle) subtitle.textContent = 'ยอดเงินและหลักฐานสลิปถูกบันทึกเรียบร้อยแล้ว';

  await new Promise(r => setTimeout(r, 600));

  closeConfirmModal();

  // Reset upload area
  tempSlipDataUrl = null;
  const fi = document.getElementById('slipFileInput');
  const preview = document.getElementById('slipPreviewContainer');
  if (fi) fi.value = '';
  if (preview) preview.classList.add('hidden');

  // Confetti Celebration
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  }

  // Refresh Stats & View
  refreshProgressStats();
  selectStudent(currentSelectedStudent);
  renderStatusTable();

  showFrontendToast("🎉 บันทึกการชำระเงินและแนบสลิปเรียบร้อยแล้ว!");
}

async function promptResetPayment() {
  if (!currentSelectedStudent) return;
  const stId = currentSelectedStudent.id;
  if (confirm(`คุณต้องการยกเลิกสถานะการชำระเงินของ "${currentSelectedStudent.name}" เพื่อส่งสลิปใหม่หรือไม่?`)) {
    // 1. Delete from Supabase
    const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (sb && currentCampaign && currentCampaign.id) {
      try {
        await sb.from('payments').delete().match({
          campaign_id: currentCampaign.id,
          student_id: stId
        });
      } catch(e) {
        console.warn("Supabase reset payment error:", e);
      }
    }

    // 2. Clear local caches
    try {
      const localPay = JSON.parse(localStorage.getItem('COMED_LOCAL_PAYMENTS') || '{}');
      const cleanId = stId.replace(/-/g, '').trim();
      delete localPay[stId];
      if (cleanId) delete localPay[cleanId];
      localStorage.setItem('COMED_LOCAL_PAYMENTS', JSON.stringify(localPay));
    } catch (e) { }

    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: stId })
      });
    } catch (e) { }

    delete paymentRecords[stId];
    saveLocalBackup();
    refreshProgressStats();
    selectStudent(currentSelectedStudent);
    renderStatusTable();
    showFrontendToast("ยกเลิกสถานะและพร้อมส่งสลิปใหม่แล้ว");
  }
}

// --- FULLSCREEN SLIP VIEWER ---
function openFullscreenModal(imageUrl) {
  if (!imageUrl) return;
  const fsImg = document.getElementById('fullscreenImg');
  const modal = document.getElementById('modalFullscreenSlip');
  if (fsImg) fsImg.src = imageUrl;
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeFullscreenModal() {
  const modal = document.getElementById('modalFullscreenSlip');
  if (modal) modal.classList.add('hidden');
}

// --- CLOUD SYNC CONFIG MODAL ---
function openCloudModal() {
  const input = document.getElementById('cloudWebappUrlInput');
  const modal = document.getElementById('modalCloudSync');
  if (input) input.value = googleAppsScriptUrl;
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCloudModal() {
  const modal = document.getElementById('modalCloudSync');
  if (modal) modal.classList.add('hidden');
}

function saveCloudUrl() {
  const input = document.getElementById('cloudWebappUrlInput');
  if (!input) return;
  const url = input.value.trim();
  googleAppsScriptUrl = url;
  localStorage.setItem(CLOUD_URL_KEY, url);
  closeCloudModal();
  alert("บันทึกการเชื่อมต่อ Google Cloud เรียบร้อยแล้ว ระบบจะซิงค์ข้อมูลกับ Google Sheets และ Google Drive อัตโนมัติ!");
  loadPaymentRecords();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFullscreenModal();
    closeConfirmModal();
    closeStudentDetailModal();
    closeCloudModal();
  }
});

// --- STATUS TABLE (TAB 2) ---
function renderStatusTable() {
  const tbody = document.getElementById('studentStatusTableBody');
  if (!tbody) return;
  const searchVal = (document.getElementById('tableSearchInput')?.value || '').toLowerCase().trim();

  let list = studentDatabase.filter(st => {
    const isPaid = paymentRecords[st.id] && paymentRecords[st.id].paid;
    if (currentFilter === 'paid' && !isPaid) return false;
    if (currentFilter === 'unpaid' && isPaid) return false;

    if (searchVal) {
      const matchString = `${st.id} ${st.name} ${st.nickname} ${st.email}`.toLowerCase();
      return matchString.includes(searchVal);
    }
    return true;
  });

  const emptyMsg = document.getElementById('tableEmptyMessage');
  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }
  if (emptyMsg) emptyMsg.classList.add('hidden');

  tbody.innerHTML = list.map((st, index) => {
    const isPaid = paymentRecords[st.id] && paymentRecords[st.id].paid;
    const rec = paymentRecords[st.id];
    const sizeBadge = rec && rec.shirtSize 
      ? `<span class="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">ไซส์ ${rec.shirtSize}</span>`
      : '';
    const isEligible = window.ComedCampaignManager ? window.ComedCampaignManager.isStudentEligible(currentCampaign, st.id) : true;
    const isExempted = !isPaid && !isEligible;

    let statusPill = '';
    if (isPaid) {
      statusPill = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-xs"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> จ่ายแล้ว</span>';
    } else if (isExempted) {
      statusPill = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300 shadow-xs"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> ได้รับการยกเว้น</span>';
    } else {
      statusPill = '<span class="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-100/90 px-3 py-1 rounded-full border border-rose-300 shadow-xs"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ยังไม่จ่าย</span>';
    }

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="p-4 text-center text-slate-400 font-mono text-xs">${index + 1}</td>
        <td class="p-4 font-mono font-bold text-slate-800">${st.id}</td>
        <td class="p-4">
          <div class="font-bold text-slate-900">${st.name}</div>
          ${sizeBadge}
        </td>
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 text-xs font-black border border-orange-200/80 shadow-xs">
            น้อง${st.nickname}
          </span>
        </td>
        <td class="p-4 hidden md:table-cell text-slate-500 font-mono text-xs">${st.email}</td>
        <td class="p-4 text-center">
          ${statusPill}
        </td>
        <td class="p-4 text-center">
          ${isPaid
        ? `<button onclick="openStudentDetail('${st.id}')" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 mx-auto shadow-xs cursor-pointer">
                <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500"></i> ดูหลักฐาน
               </button>`
        : `<button onclick="redirectToPayment('${st.id}')" class="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-black rounded-xl transition flex items-center gap-1.5 mx-auto border border-orange-200 shadow-xs cursor-pointer">
                <i data-lucide="credit-card" class="w-3.5 h-3.5"></i> ไปหน้าจ่าย
               </button>`
      }
        </td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleTableSearch(val) {
  renderStatusTable();
}

function filterStatusList(filter) {
  currentFilter = filter;

  const btnAll = document.getElementById('filterBtnAll');
  const btnPaid = document.getElementById('filterBtnPaid');
  const btnUnpaid = document.getElementById('filterBtnUnpaid');

  [btnAll, btnPaid, btnUnpaid].forEach(b => {
    if (b) b.className = 'px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 transition font-bold';
  });

  if (filter === 'all' && btnAll) {
    btnAll.className = 'px-4 py-2 rounded-xl bg-white text-slate-900 shadow-sm font-black transition';
  } else if (filter === 'paid' && btnPaid) {
    btnPaid.className = 'px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-sm font-black transition';
  } else if (filter === 'unpaid' && btnUnpaid) {
    btnUnpaid.className = 'px-4 py-2 rounded-xl bg-rose-600 text-white shadow-sm font-black transition';
  }

  renderStatusTable();
}

function redirectToPayment(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  if (!st) return;

  switchMainTab('payment');
  const input = document.getElementById('smartSearchInput');
  if (input) input.value = st.id;
  selectStudent(st);

  const card = document.getElementById('studentProfileCard');
  if (card) {
    window.scrollTo({
      top: card.offsetTop - 80,
      behavior: 'smooth'
    });
  }
}

function formatDriveImageUrl(url) {
  if (!url) return '';
  // 1. Google Drive direct thumbnail
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) {
      return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1200`;
    }
  }
  // 2. Catbox.moe / Direct Image Hosts: use original HTTPS URL directly
  // Do NOT wrap in wsrv.nl/weserv.nl because they return 404 on catbox.moe DNS
  return url;
}

// --- SLIP & QR DOWNLOAD HANDLERS (Direct Device Download) ---
async function triggerFileDownload(url, filename = 'slip-payment.png') {
  if (!url) return;

  // 1. If it's a data URL or Blob URL, trigger direct anchor download immediately
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);
    return;
  }

  // 2. If it's Google Drive link, extract direct download URL
  let downloadUrl = url;
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${idMatch[0]}`;
    }
  }

  // 3. Attempt direct fetch as Blob to trigger native Save As / Download
  try {
    const res = await fetch(downloadUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        a.remove();
      }, 1000);
      return;
    }
  } catch (err) {
    console.warn("Direct blob download fetch failed (CORS or network), falling back to anchor:", err);
  }

  // 4. Fallback: Hidden anchor with target and download attribute
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 200);
}

// Download current generated/custom QR Code image
async function downloadCurrentQrImage() {
  const qrImg = document.getElementById('bankQrImage');
  const src = (currentGeneratedDynamicQrDataUrl || (qrImg ? qrImg.src : '') || currentCampaign.qrImage || 'qr_payment.png');
  const filename = `PromptPay-QR-${currentCampaign.code || currentCampaign.id || 'KKU'}-${currentEffectiveAmount || currentCampaign.amount || 190}THB.png`;
  await triggerFileDownload(src, filename);
}

function downloadCurrentSlip() {
  if (!currentStudentPaidSlip) {
    alert("ไม่พบข้อมูลรูปภาพสลิป");
    return;
  }
  const fname = `Slip-${currentSelectedStudent ? currentSelectedStudent.id : 'COMED69'}.png`;
  triggerFileDownload(currentStudentPaidSlip, fname);
}

function downloadFullscreenSlip() {
  const fsImg = document.getElementById('fullscreenImg');
  if (!fsImg) return;
  const src = fsImg.src;
  triggerFileDownload(src, 'Slip-COMED69-Full.png');
}

function openStudentDetail(studentId) {
  const st = studentDatabase.find(s => s.id === studentId);
  const record = paymentRecords[studentId];
  if (!st) return;

  const isPaid = record && record.paid;
  const rawSlipUrl = record?.slipUrl || '';
  const previewImgUrl = formatDriveImageUrl(rawSlipUrl);

  const content = document.getElementById('studentDetailModalContent');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20">
          ${st.nickname.slice(0, 1)}
        </div>
        <div>
          <h4 class="font-black text-slate-900 text-lg">${st.name} (น้อง${st.nickname})</h4>
          <p class="text-xs text-slate-500 font-mono">${st.id} • ${st.email}</p>
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
        <div class="flex justify-between items-center">
          <span class="text-slate-500">สถานะ:</span>
          <span class="font-black ${isPaid ? 'text-emerald-600' : 'text-rose-600'}">
            ${isPaid ? `ชำระเงินแล้ว (฿${(record?.amount || currentCampaign.amount || 190).toLocaleString()})` : 'ยังไม่ได้ชำระเงิน'}
          </span>
        </div>
        ${(isPaid && record?.shirtSize) ? `
          <div class="flex justify-between items-center">
            <span class="text-slate-500">ไซส์เสื้อที่เลือก:</span>
            <span class="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 font-extrabold text-xs border border-orange-300">
              ไซส์ ${record.shirtSize}
            </span>
          </div>
        ` : ''}
        ${isPaid ? `
          <div class="flex justify-between">
            <span class="text-slate-500">วันที่-เวลาที่บันทึก:</span>
            <span class="font-mono font-bold text-slate-700">${record.timestamp || '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">รหัสอ้างอิง:</span>
            <span class="font-mono text-slate-500">${record.refCode || '-'}</span>
          </div>
        ` : ''}
      </div>

      ${(isPaid && (rawSlipUrl || (record.slips && record.slips.length > 0))) ? `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 block">ภาพสลิปหลักฐาน (${(record.slips && record.slips.length) || 1} ใบ):</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-orange-400 border border-slate-700 flex items-center gap-1">
              <i data-lucide="cloud" class="w-3 h-3 text-orange-400"></i>
              <span>จัดเก็บบน: ${window.MultiCloudUploader ? window.MultiCloudUploader.getProviderName(record.slipProvider || 'cloudinary') : (record.slipProvider || 'Cloud')}</span>
            </span>
          </div>

          <div class="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            ${((record.slips && record.slips.length > 0) ? record.slips : [{ url: rawSlipUrl, timestamp: record.timestamp }]).map((slItem, slIdx) => {
              const slUrl = typeof slItem === 'string' ? slItem : (slItem.url || '');
              const slTime = typeof slItem === 'object' && slItem.timestamp ? slItem.timestamp : record.timestamp;
              const isImg = slUrl.startsWith('data:image') || slUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || slUrl.includes('cloudinary') || slUrl.includes('catbox');
              let slPreview = slUrl;
              if (slUrl.includes('drive.google.com')) {
                const idMatch = slUrl.match(/[-\w]{25,}/);
                if (idMatch) slPreview = `https://drive.google.com/file/d/${idMatch[0]}/preview`;
              }

                const displaySlUrl = formatDriveImageUrl(slUrl);
                return `
                <div class="p-3 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-700 flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-black">#${slIdx+1}</span>
                      สลิปใบที่ ${slIdx+1}
                    </span>
                    <span class="text-slate-400 font-mono text-[11px]">${slTime || '-'}</span>
                  </div>
                  <div class="w-full h-72 sm:h-80 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    ${isImg
                      ? `<img src="${displaySlUrl}" alt="สลิป ${slIdx+1}" class="max-h-full max-w-full object-contain mx-auto rounded-lg">`
                      : `<iframe src="${slPreview}" class="w-full h-full border-0" loading="lazy"></iframe>`
                    }
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button type="button" onclick="triggerFileDownload('${slUrl}', 'Slip-${st.id}-${slIdx+1}.png')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
                      <i data-lucide="download" class="w-3.5 h-3.5"></i>
                      <span>ดาวน์โหลดสลิป</span>
                    </button>
                    <a href="${displaySlUrl}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-md active:scale-95">
                      <i data-lucide="external-link" class="w-3.5 h-3.5"></i> 
                      <span>เปิดดูรูปเต็ม</span>
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="flex justify-end pt-2">
        <button onclick="closeStudentDetailModal()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  `;
  const modal = document.getElementById('modalStudentDetail');
  if (modal) modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Function to allow uploading additional slip (เช่น กรณีโอนไม่ครบ หรือโอนเพิ่ม)
function openAddExtraSlipModal() {
  if (!currentSelectedStudent) {
    alert("กรุณาเลือกนักศึกษาก่อน");
    return;
  }
  
  // Show upload zone directly so the user can pick a new slip
  const unpaidSection = document.getElementById('unpaidSection');
  const paidSection = document.getElementById('paidSection');
  
  if (unpaidSection) {
    unpaidSection.classList.remove('hidden');
    unpaidSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (paidSection) {
    paidSection.classList.add('hidden');
  }

  showFrontendToast("📎 กรุณาเลือกไฟล์สลิปเพิ่มเติมเพื่ออัปโหลดแนบเข้ากับรายการเดิม");
}

function closeStudentDetailModal() {
  const modal = document.getElementById('modalStudentDetail');
  if (modal) modal.classList.add('hidden');
}

// --- TAB SWITCHER WITH GSAP SPRING & FADE TRANSITIONS ---
function switchMainTab(tab) {
  const tabPayment = document.getElementById('tabContentPayment');
  const tabStatus = document.getElementById('tabContentStatus');
  const navPayment = document.getElementById('navTabPayment');
  const navStatus = document.getElementById('navTabStatus');
  const mobPayment = document.getElementById('mobileNavPayment');
  const mobStatus = document.getElementById('mobileNavStatus');

  // Update browser URL query params without reloading
  try {
    const url = new URL(window.location.href);
    if (tab === 'status') {
      url.searchParams.set('tab', 'status');
      url.searchParams.delete('auto');
    } else {
      url.searchParams.delete('tab');
      url.searchParams.delete('auto');
    }
    window.history.replaceState({}, '', url.toString());
  } catch(e) {
    // ignore
  }

  if (tab === 'payment') {
    if (tabPayment) {
      tabPayment.classList.remove('hidden');
      tabPayment.style.display = 'block';
    }
    if (tabStatus) {
      tabStatus.classList.add('hidden');
      tabStatus.style.display = 'none';
    }

    if (navPayment) {
      navPayment.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-white text-orange-600 shadow-sm cursor-pointer';
    }
    if (navStatus) {
      navStatus.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900 cursor-pointer';
    }

    // Hero/Section Tab Bar Buttons
    const campBtnPay = document.getElementById('campaignTabBtnPayment');
    const campBtnStat = document.getElementById('campaignTabBtnStatus');
    if (campBtnPay) {
      campBtnPay.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 cursor-pointer active:scale-95';
    }
    if (campBtnStat) {
      campBtnStat.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer active:scale-95';
    }

    if (mobPayment) {
      mobPayment.className = 'flex-1 py-1.5 px-1 rounded-2xl text-orange-400 bg-white/10 font-black text-[11px] transition-all flex flex-col items-center gap-1';
    }
    if (mobStatus) {
      mobStatus.className = 'flex-1 py-1.5 px-1 rounded-2xl text-slate-400 font-bold text-[11px] transition-all flex flex-col items-center gap-1 hover:text-white';
    }

    // GSAP Bouncy Spring Slide-Up Fade
    if (typeof gsap !== 'undefined' && tabPayment) {
      gsap.fromTo(tabPayment,
        { opacity: 0, y: 15, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "power2.out" }
      );
    }
  } else {
    if (tabPayment) {
      tabPayment.classList.add('hidden');
      tabPayment.style.display = 'none';
    }
    if (tabStatus) {
      tabStatus.classList.remove('hidden');
      tabStatus.style.display = 'block';
    }

    if (navStatus) {
      navStatus.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-white text-orange-600 shadow-sm cursor-pointer';
    }
    if (navPayment) {
      navPayment.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900 cursor-pointer';
    }

    // Hero/Section Tab Bar Buttons
    const campBtnPay = document.getElementById('campaignTabBtnPayment');
    const campBtnStat = document.getElementById('campaignTabBtnStatus');
    if (campBtnPay) {
      campBtnPay.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer active:scale-95';
    }
    if (campBtnStat) {
      campBtnStat.className = 'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 cursor-pointer active:scale-95';
    }

    if (mobPayment) {
      mobPayment.className = 'flex-1 py-1.5 px-1 rounded-2xl text-slate-400 font-bold text-[11px] transition-all flex flex-col items-center gap-1 hover:text-white';
    }
    if (mobStatus) {
      mobStatus.className = 'flex-1 py-1.5 px-1 rounded-2xl text-emerald-400 bg-white/10 font-black text-[11px] transition-all flex flex-col items-center gap-1';
    }

    if (typeof renderStatusTable === 'function') {
      renderStatusTable();
    }
    // GSAP Bouncy Spring Slide-Up Fade
    if (typeof gsap !== 'undefined' && tabStatus) {
      gsap.fromTo(tabStatus,
        { opacity: 0, y: 15, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "power2.out" }
      );
    }
  }
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function getFallbackStudents() {
  return [
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
}

// ================= USER SESSION & PAYMENT SYNC =================
function checkPaymentUserSession() {
  try {
    const session = localStorage.getItem('COMED_USER_SESSION');
    const guestNav = document.getElementById('navUserGuest');
    const loggedNav = document.getElementById('navUserLoggedIn');
    const avatarEl = document.getElementById('navUserAvatar');
    const nameEl = document.getElementById('navUserName');

    if (session) {
      const user = JSON.parse(session);
      if (guestNav) guestNav.classList.add('hidden');
      if (loggedNav) {
        loggedNav.classList.remove('hidden');
        loggedNav.classList.add('flex');
      }
      if (avatarEl) {
        avatarEl.src = user.avatar;
        avatarEl.className = 'w-7 h-7 rounded-xl object-cover border border-orange-300 transition-all duration-300';
        if (user.avatarFrame && user.avatarFrame !== 'none') {
          avatarEl.classList.add(`avatar-frame-${user.avatarFrame}`);
        }
        if (user.avatarAnim && user.avatarAnim !== 'none') {
          avatarEl.classList.add(`avatar-anim-${user.avatarAnim}`);
        }
      }
      if (nameEl) nameEl.textContent = user.nickname ? `${user.name} (${user.nickname})` : user.name;

      // Check if already paid
      syncUserPaymentTag(user);

      // Auto-select user in student search dropdown if not yet selected
      autoSelectStudentForUser(user);
    } else {
      if (guestNav) guestNav.classList.remove('hidden');
      if (loggedNav) {
        loggedNav.classList.add('hidden');
        loggedNav.classList.remove('flex');
      }
    }
  } catch(e) {}
}

function syncUserPaymentTag(user) {
  const tagEl = document.getElementById('navUserPaymentTag');
  if (!tagEl) return;

  const myId = (user.studentId || '').replace(/-/g, '').trim();
  const myEmail = (user.email || '').toLowerCase().trim();
  const myName = (user.name || '').trim();

  const rec = (typeof paymentRecords !== 'undefined') ? (paymentRecords[user.studentId] || paymentRecords[myId]) : null;
  const isPaid = (rec && rec.paid) || (window.cachedSubmissions || []).some(s => {
    const sEmail = (s.email || '').toLowerCase().trim();
    const sId = (s.studentId || '').replace(/-/g, '').trim();
    const sName = (s.studentName || '').trim();
    return (myEmail && sEmail === myEmail) ||
           (myId && sId && sId === myId) ||
           (myName && sName && sName.includes(myName));
  });

  const payAmt = (rec && rec.amount) || (currentCampaign && currentCampaign.amount) || 190;
  if (isPaid) {
    tagEl.className = "text-[10px] text-emerald-600 font-bold block leading-tight flex items-center gap-1";
    tagEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>ชำระเงินแล้ว ฿${Number(payAmt).toLocaleString()}`;
  } else {
    tagEl.className = "text-[10px] text-amber-600 font-bold block leading-tight flex items-center gap-1";
    tagEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>ยังไม่ชำระเงิน';
  }
}

function autoSelectStudentForUser(user) {
  if (!user) return;
  const myId = (user.studentId || '').replace(/-/g, '').trim();
  const myEmail = (user.email || '').toLowerCase().trim();
  const myName = (user.name || '').trim();

  const stList = (typeof studentDatabase !== 'undefined' && studentDatabase.length > 0) 
                 ? studentDatabase 
                 : (typeof getFallbackStudents === 'function' ? getFallbackStudents() : []);

  const student = stList.find(st => {
    const sid = (st.id || '').replace(/-/g, '').trim();
    const semail = (st.email || '').toLowerCase().trim();
    const sname = (st.name || '').trim();
    return (myId && sid === myId) || 
           (myEmail && semail === myEmail) || 
           (myName && sname.includes(myName));
  });

  if (student && typeof selectStudent === 'function') {
    const searchInput = document.getElementById('smartSearchInput');
    if (searchInput) searchInput.value = `${student.id} - ${student.name}`;
    selectStudent(student);
    
    // If query has auto=pay, scroll once and clean query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto') === 'pay') {
      setTimeout(() => {
        scrollToUploadForm();
        // Clean URL param so user can switch tabs freely without loop
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }, 400);
    }
  }
}

function scrollToUploadForm() {
  closeMyProfileModal();
  if (typeof switchMainTab === 'function') {
    switchMainTab('payment');
  }
  
  setTimeout(() => {
    const uploadArea = document.getElementById('dropZone') || document.getElementById('slipUploadSection') || document.getElementById('studentProfileCard');
    if (uploadArea) {
      uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      uploadArea.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2');
      setTimeout(() => {
        uploadArea.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2');
      }, 2000);
    }
  }, 150);
}

function openMyProfileModal() {
  const session = localStorage.getItem('COMED_USER_SESSION');
  if (!session) return;
  const user = JSON.parse(session);
  const modal = document.getElementById('modalMyPaymentProfile');
  const card = document.getElementById('myPaymentProfileCard');

  const avatar = document.getElementById('myProfileModalAvatar');
  const name = document.getElementById('myProfileModalName');
  const nickname = document.getElementById('myProfileModalNickname');
  const sid = document.getElementById('myProfileModalID');
  const email = document.getElementById('myProfileModalEmail');

  if (avatar) avatar.src = user.avatar;
  if (name) name.textContent = user.name || '-';
  if (nickname) nickname.textContent = user.nickname ? `น้อง${user.nickname}` : '-';
  if (sid) sid.textContent = user.studentId || '-';
  if (email) email.textContent = user.email || '-';

  const myId = (user.studentId || '').replace(/-/g, '').trim();
  const myEmail = (user.email || '').toLowerCase().trim();
  const rec = (typeof paymentRecords !== 'undefined') ? (paymentRecords[user.studentId] || paymentRecords[myId]) : null;
  const isPaid = (rec && rec.paid) || (window.cachedSubmissions || []).some(s => {
    return ((s.email || '').toLowerCase().trim() === myEmail) ||
           ((s.studentId || '').replace(/-/g, '').trim() === myId);
  });
  const payAmt = (rec && rec.amount) || (currentCampaign && currentCampaign.amount) || 190;

  const badge = document.getElementById('myProfileModalStatusBadge');
  if (badge) {
    if (isPaid) {
      badge.className = "font-black text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300";
      badge.textContent = `ชำระเงินเรียบร้อยแล้ว (฿${Number(payAmt).toFixed(2)})`;
    } else {
      badge.className = "font-black text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300";
      badge.textContent = "ยังไม่ได้ชำระเงิน (รอแนบสลิป)";
    }
  }

  if (modal) modal.classList.remove('hidden');
  if (typeof gsap !== 'undefined' && card) {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.8, y: 30 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeMyProfileModal() {
  const modal = document.getElementById('modalMyPaymentProfile');
  if (modal) modal.classList.add('hidden');
}

function handlePaymentLogout() {
  if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
    localStorage.removeItem('COMED_USER_SESSION');
    window.location.reload();
  }
}

// ================= GOOGLE AUTHENTICATION SYSTEM (KKUMAIL ONLY) =================
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

function openGoogleLoginModal() {
  const modal = document.getElementById('modalGoogleLogin');
  const card = document.getElementById('googleLoginCard');
  if (!modal || !card) return;

  modal.classList.remove('hidden');
  const authErr = document.getElementById('googleAuthError');
  if (authErr) authErr.classList.add('hidden');
  
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.8, y: 30, rotationX: 10 }, 
      { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: 0.45, ease: "back.out(1.6)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Render Official Google Sign-in Button
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true
      });
      const btnWrapper = document.getElementById('googleButtonWrapper');
      if (btnWrapper) {
        google.accounts.id.renderButton(
          btnWrapper,
          { theme: "outline", size: "large", width: 280, text: "signin_with", shape: "pill" }
        );
      }
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

function handleGoogleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  const errBox = document.getElementById('googleAuthError');
  const errText = document.getElementById('googleAuthErrorText');

  if (!data || !data.email) {
    if (errBox && errText) {
      errText.textContent = "ไม่สามารถดึงข้อมูลบัญชีจาก Google ได้";
      errBox.classList.remove('hidden');
    }
    return;
  }

  const emailLower = data.email.toLowerCase().trim();
  const isSpecialTester = (emailLower === 'phupa5874@gmail.com');
  if (!emailLower.endsWith('@kkumail.com') && !isSpecialTester) {
    if (errBox && errText) {
      errText.textContent = `บัญชี "${data.email}" ไม่ใช่ @kkumail.com จึงไม่สามารถเข้าสู่ระบบได้`;
      errBox.classList.remove('hidden');
    }
    return;
  }

  const student = (studentDatabase || []).find(st => st.email.toLowerCase() === emailLower);
  const userSession = {
    email: emailLower,
    name: student ? student.name : (isSpecialTester ? 'ภูผา (ผู้ดูแลระบบ & ทดสอบระบบ)' : (data.name || emailLower)),
    nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
    studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : ''),
    avatar: data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${emailLower}`,
    isSpecialTester: isSpecialTester,
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(userSession));
  closeGoogleLoginModal();
  checkPaymentUserSession();
  openLoginSuccessModal(userSession);
}

function openLoginSuccessModal(user) {
  const modal = document.getElementById('modalLoginSuccess');
  const card = document.getElementById('loginSuccessCard');
  if (!modal || !card) {
    showFrontendToast(`🎉 ยินดีต้อนรับคุณ ${user.name} เข้าสู่ระบบสำเร็จ`);
    return;
  }

  const avatar = document.getElementById('loginSuccessAvatar');
  const title = document.getElementById('loginSuccessTitle');
  const name = document.getElementById('loginSuccessName');
  const sid = document.getElementById('loginSuccessId');
  const email = document.getElementById('loginSuccessEmail');

  if (avatar) avatar.src = user.avatar;
  if (title) title.textContent = user.nickname ? `ยินดีต้อนรับ น้อง${user.nickname}!` : `ยินดีต้อนรับ!`;
  if (name) name.textContent = user.nickname ? `${user.name} (${user.nickname})` : user.name;
  if (sid) sid.textContent = user.studentId || '-';
  if (email) email.textContent = user.email || '-';

  modal.classList.remove('hidden');
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(card, 
      { opacity: 0, scale: 0.8, y: 30 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }
    );
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeLoginSuccessModal(autoScroll) {
  const modal = document.getElementById('modalLoginSuccess');
  const card = document.getElementById('loginSuccessCard');
  if (!modal || !card) return;

  const doClose = () => {
    modal.classList.add('hidden');
    if (autoScroll) {
      setTimeout(() => {
        scrollToUploadForm();
      }, 100);
    }
  };

  if (typeof gsap !== 'undefined') {
    gsap.to(card, {
      opacity: 0,
      scale: 0.85,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: doClose
    });
  } else {
    doClose();
  }
}

// Run user auth & payment sync on page load and table render
document.addEventListener('DOMContentLoaded', () => {
  checkPaymentUserSession();
});

if (typeof renderStatusTable === 'function') {
  const originalRenderStatusTable = renderStatusTable;
  renderStatusTable = function() {
    originalRenderStatusTable();
    checkPaymentUserSession();
  };
}
