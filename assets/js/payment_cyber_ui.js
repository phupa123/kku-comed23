/**
 * =========================================================================
 * PAYMENT CYBER UI ENGINE - assets/js/payment_cyber_ui.js
 * COMED KKU UI/UX Redesign Engine (Desktop 3-Column Dashboard & Mobile Native)
 * =========================================================================
 */

(function(window) {
  'use strict';
  
  // Helper: Smart Token Matching for Thai, English, Student ID, Email
  function normalizeToken(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
      .replace(/[-\s_.,/]/g, ''); // strip hyphens, spaces, dots
  }

  function matchStudentSmart(st, rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return true;
    const qTrimmed = rawQuery.trim().toLowerCase();

    // Extract individual search tokens by whitespace, comma, or dash
    const rawTokens = qTrimmed.split(/[\s,]+/).filter(Boolean);
    if (rawTokens.length === 0) return true;

    // Student fields for matching
    const nameLower = (st.name || '').toLowerCase();
    const nickLower = (st.nickname || '').toLowerCase();
    const idRaw = (st.id || '').toLowerCase();
    const idClean = normalizeToken(st.id);
    const emailLower = (st.email || '').toLowerCase();
    const emailPrefix = emailLower.split('@')[0];

    // Every token must match at least one attribute of the student
    return rawTokens.every(token => {
      const tokenClean = normalizeToken(token);
      if (!tokenClean) return true;

      // 1. Check ID (raw with dash, or clean digits)
      if (idRaw.includes(token) || idClean.includes(tokenClean)) return true;

      // 2. Check Name (direct substring or clean)
      if (nameLower.includes(token) || normalizeToken(nameLower).includes(tokenClean)) return true;

      // 3. Check Nickname
      if (nickLower.includes(token) || normalizeToken(nickLower).includes(tokenClean)) return true;

      // 4. Check Email / Email Username prefix
      if (emailLower.includes(token) || emailPrefix.includes(token) || normalizeToken(emailPrefix).includes(tokenClean)) return true;

      // 5. Full combined string check
      const combined = `${idRaw} ${idClean} ${nameLower} ${nickLower} ${emailLower}`;
      return combined.includes(token);
    });
  }

  function getStudentsList() {
    if (typeof students !== 'undefined' && Array.isArray(students) && students.length > 0) return students;
    if (typeof window !== 'undefined') {
      if (Array.isArray(window.STUDENTS_DATA) && window.STUDENTS_DATA.length > 0) return window.STUDENTS_DATA;
      if (Array.isArray(window.studentDatabase) && window.studentDatabase.length > 0) return window.studentDatabase;
    }
    return [];
  }

  let currentViewMode = localStorage.getItem('COMED_PAYMENT_VIEW_MODE') || 'cards'; // 'cards' | 'table'

  // 1. Initialize View Switcher for Status Tab (3D Cards vs Table)
  function initCyberViewSwitcher() {
    const tableContainer = document.querySelector('#tabContentStatus .overflow-x-auto');
    if (!tableContainer) return;

    if (!document.getElementById('cyberViewModeControls')) {
      const controlBar = document.createElement('div');
      controlBar.id = 'cyberViewModeControls';
      controlBar.className = 'flex items-center justify-between gap-3 pb-3 border-b border-white/10 mb-4 flex-wrap';
      controlBar.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">มุมมองการแสดงผล:</span>
          <div class="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10 text-xs shadow-inner">
            <button type="button" id="btnViewModeCards" onclick="window.PaymentCyberUI.setViewMode('cards')"
              class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${currentViewMode === 'cards' ? 'bg-[#E65A19] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
              <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
              <span>การ์ด 3D Grid</span>
            </button>
            <button type="button" id="btnViewModeTable" onclick="window.PaymentCyberUI.setViewMode('table')"
              class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${currentViewMode === 'table' ? 'bg-[#E65A19] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
              <i data-lucide="table" class="w-3.5 h-3.5"></i>
              <span>ตาราง Table</span>
            </button>
          </div>
        </div>
        <div class="text-xs text-slate-400 font-mono">
          <span id="cyberRosterCounter">กำลังโหลดข้อมูล...</span>
        </div>
      `;

      tableContainer.parentNode.insertBefore(controlBar, tableContainer);

      let cardsGrid = document.getElementById('studentStatusCardsGrid');
      if (!cardsGrid) {
        cardsGrid = document.createElement('div');
        cardsGrid.id = 'studentStatusCardsGrid';
        cardsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-2';
        tableContainer.parentNode.insertBefore(cardsGrid, tableContainer.nextSibling);
      }
    }

    applyViewModeUI();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem('COMED_PAYMENT_VIEW_MODE', mode);
    applyViewModeUI();
    renderCyberCards();
  }

  function applyViewModeUI() {
    const tableContainer = document.getElementById('studentStatusTableWrapper') || document.querySelector('#tabContentStatus .overflow-x-auto');
    const cardsGrid = document.getElementById('studentStatusCardsGrid');
    const btnCards = document.getElementById('btnViewModeCards');
    const btnTable = document.getElementById('btnViewModeTable');

    if (btnCards && btnTable) {
      if (currentViewMode === 'cards') {
        btnCards.className = 'px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all bg-[#E65A19] text-white shadow-sm cursor-pointer';
        btnTable.className = 'px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
        if (tableContainer) tableContainer.classList.add('hidden');
        if (cardsGrid) cardsGrid.classList.remove('hidden');
      } else {
        btnTable.className = 'px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all bg-[#E65A19] text-white shadow-sm cursor-pointer';
        btnCards.className = 'px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (cardsGrid) cardsGrid.classList.add('hidden');
      }
    }
  }

  function renderCyberCards() {
    const cardsGrid = document.getElementById('studentStatusCardsGrid');
    const studentList = getStudentsList();
    if (!cardsGrid || studentList.length === 0) return;

    // Get current logged-in user session to highlight user account
    let loggedUser = null;
    try {
      const sStr = localStorage.getItem('COMED_USER_SESSION');
      if (sStr) loggedUser = JSON.parse(sStr);
    } catch(e) {}

    const myCleanSid = loggedUser && loggedUser.studentId ? loggedUser.studentId.replace(/[-\s]/g, '').trim().toLowerCase() : '';
    const myCleanEmail = loggedUser && loggedUser.email ? loggedUser.email.toLowerCase().trim() : '';

    const queryInput = document.getElementById('tableSearchInput');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';

    const filtered = studentList.filter(st => {
      const matchSearch = matchStudentSmart(st, query);
      const isPaid = window.paymentRecords && window.paymentRecords[st.id] && window.paymentRecords[st.id].paid;
      const currentFilter = window.currentFilter || 'all';
      if (currentFilter === 'paid' && !isPaid) return false;
      if (currentFilter === 'unpaid' && isPaid) return false;
      return matchSearch;
    });

    const counter = document.getElementById('cyberRosterCounter');
    if (counter) counter.textContent = `แสดง ${filtered.length} จาก ${studentList.length} คน`;

    cardsGrid.innerHTML = filtered.map((st, idx) => {
      const stCleanId = (st.id || '').replace(/[-\s]/g, '').trim().toLowerCase();
      const stCleanEmail = (st.email || '').toLowerCase().trim();
      const isCurrentUser = (myCleanSid && myCleanSid === stCleanId) || (myCleanEmail && myCleanEmail === stCleanEmail);

      const isPaid = window.paymentRecords && window.paymentRecords[st.id] && window.paymentRecords[st.id].paid;
      const avatarUrl = st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=1e293b&color=fdba74&bold=true`;

      let statusBadge = isPaid
        ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> จ่ายแล้ว</span>'
        : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> ยังไม่จ่าย</span>';

      const cardBorderClass = isCurrentUser
        ? 'border-2 border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/20'
        : 'border border-white/10 bg-slate-900/80';

      return `
        <div class="cyber-student-card p-4 flex flex-col justify-between ${cardBorderClass} subtle-hover space-y-3 relative overflow-hidden group">
          ${isCurrentUser ? `
            <div class="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/30 rounded-full blur-xl pointer-events-none"></div>
          ` : ''}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-[10px] ${isCurrentUser ? 'text-amber-300 font-black' : 'text-slate-400'}">#${String(idx + 1).padStart(2, '0')}</span>
              ${isCurrentUser ? `
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md ring-2 ring-amber-300/60 animate-pulse flex items-center gap-1">
                  <i data-lucide="check-circle-2" class="w-2.5 h-2.5 text-slate-950"></i> บัญชีของคุณ
                </span>
              ` : ''}
            </div>
            ${statusBadge}
          </div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-black/60 p-0.5 ${isCurrentUser ? 'border-2 border-amber-400 ring-2 ring-amber-400/30' : 'border border-white/10'} overflow-hidden flex-shrink-0 relative group-hover:border-[#E65A19]/50 transition-colors">
              <img src="${avatarUrl}" alt="${st.name}" class="w-full h-full object-cover rounded-xl" loading="lazy">
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold ${isCurrentUser ? 'text-white font-black' : 'text-white'} text-xs sm:text-sm group-hover:text-amber-300 transition-colors break-words leading-snug">
                ${st.name}
              </h4>
              <div class="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-1 flex-wrap">
                <span class="${isCurrentUser ? 'text-amber-300 font-black' : 'text-amber-400 font-bold'}">น้อง${st.nickname}</span>
                <span>•</span>
                <span class="${isCurrentUser ? 'text-amber-300 font-black' : 'text-slate-300'}">${st.id}</span>
              </div>
            </div>
          </div>
          <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            ${isPaid
              ? `<button type="button" onclick="openStudentDetail('${st.id}')"
                  class="w-full py-2 px-3 rounded-xl ${isCurrentUser ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 font-black ring-2 ring-amber-300/40' : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10'} text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer">
                  <i data-lucide="eye" class="w-3.5 h-3.5 ${isCurrentUser ? 'text-slate-950' : 'text-emerald-400'}"></i>
                  <span>${isCurrentUser ? 'ดูสลิปของฉัน' : 'ดูสลิป'}</span>
                </button>`
              : `<button type="button" onclick="window.PaymentCyberUI.selectStudentQuick('${st.id}')"
                  class="w-full py-2 px-3 rounded-xl ${isCurrentUser ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 font-black ring-2 ring-amber-300/50 shadow-md' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black'} text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
                  <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
                  <span>${isCurrentUser ? 'ชำระเงินของฉัน' : 'เลือกชำระเงิน'}</span>
                </button>`
            }
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // 2. COMED KKU Redesign: Quick Student Search List in Column 3 with Infinite Scroll
  let currentFilteredList = [];
  let currentVisibleCount = 15;
  let isLoadingMore = false;
  let scrollListenerAttached = false;

  function renderStudentListItemHtml(st, currentSelectedId) {
    const isPaid = window.paymentRecords && window.paymentRecords[st.id] && window.paymentRecords[st.id].paid;
    const isSelected = st.id === currentSelectedId;

    let loggedUser = null;
    try {
      const sStr = localStorage.getItem('COMED_USER_SESSION');
      if (sStr) loggedUser = JSON.parse(sStr);
    } catch(e) {}

    const myCleanSid = loggedUser && loggedUser.studentId ? loggedUser.studentId.replace(/[-\s]/g, '').trim().toLowerCase() : '';
    const myCleanEmail = loggedUser && loggedUser.email ? loggedUser.email.toLowerCase().trim() : '';
    const stCleanId = (st.id || '').replace(/[-\s]/g, '').trim().toLowerCase();
    const stCleanEmail = (st.email || '').toLowerCase().trim();
    const isCurrentUser = (myCleanSid && myCleanSid === stCleanId) || (myCleanEmail && myCleanEmail === stCleanEmail);

    return `
      <div onclick="window.PaymentCyberUI.selectStudentQuick('${st.id}')"
        class="p-2.5 sm:p-3 rounded-2xl cyber-student-list-item cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'selected' : ''} ${isCurrentUser ? 'border-2 border-orange-500/80 bg-orange-950/30' : ''}">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs sm:text-sm text-white break-words leading-tight">${st.name}</span>
            <span class="text-[10px] text-amber-300 font-bold flex-shrink-0">(${st.nickname})</span>
            ${isCurrentUser ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-orange-500 text-white animate-pulse">คุณ</span>' : ''}
          </div>
          <span class="font-mono text-[10px] ${isCurrentUser ? 'text-orange-400 font-bold' : 'text-slate-400'} block mt-0.5">${st.id}</span>
        </div>
        <div class="flex-shrink-0">
          ${isPaid
            ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">จ่ายแล้ว</span>`
            : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">ยังไม่จ่าย</span>`
          }
        </div>
      </div>
    `;
  }

  function renderQuickStudentList(query = '', resetPagination = true) {
    const container = document.getElementById('studentQuickListContainer');
    const studentList = getStudentsList();
    if (!container || studentList.length === 0) return;

    const q = (query || '').toLowerCase().trim();
    const currentSelectedId = window.currentSelectedStudent ? window.currentSelectedStudent.id : '';

    if (resetPagination) {
      currentFilteredList = studentList.filter(st => matchStudentSmart(st, q));
      currentVisibleCount = 15; // Initial batch
    }

    const matchCounter = document.getElementById('searchMatchCounter');
    if (matchCounter) matchCounter.textContent = `${currentFilteredList.length} คน`;

    if (currentFilteredList.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-400 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1.5">
          <i data-lucide="user-x" class="w-6 h-6 mx-auto text-slate-500"></i>
          <span class="block font-bold">ไม่พบข้อมูลนักศึกษาที่ค้นหา</span>
          <span class="text-[10px] text-slate-500">ลองพิมพ์ชื่อเล่น รหัสนักศึกษา หรืออีเมล</span>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const visibleItems = currentFilteredList.slice(0, currentVisibleCount);
    let html = visibleItems.map(st => renderStudentListItemHtml(st, currentSelectedId)).join('');

    // Append loading spinner if there are more students to load
    if (currentVisibleCount < currentFilteredList.length) {
      html += `
        <div id="quickListLoadingIndicator" class="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <svg class="animate-spin w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span class="font-mono text-[11px]">เลื่อนลงเพื่อดูเพิ่มเติม (${currentVisibleCount}/${currentFilteredList.length})...</span>
        </div>
      `;
    }

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Attach infinite scroll listener once
    if (!scrollListenerAttached) {
      container.addEventListener('scroll', handleQuickListScroll);
      scrollListenerAttached = true;
    }
  }

  function handleQuickListScroll(e) {
    const container = e.target;
    if (isLoadingMore) return;
    if (currentVisibleCount >= currentFilteredList.length) return;

    // Check if scrolled near bottom (within 40px)
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 40) {
      isLoadingMore = true;
      const indicator = document.getElementById('quickListLoadingIndicator');
      if (indicator) {
        indicator.innerHTML = `
          <svg class="animate-spin w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span class="font-bold text-orange-300 text-[11px]">กำลังโหลดรายชื่อเพิ่มเติม...</span>
        `;
      }

      setTimeout(() => {
        currentVisibleCount = Math.min(currentVisibleCount + 15, currentFilteredList.length);
        renderQuickStudentList(document.getElementById('smartSearchInput')?.value || '', false);
        isLoadingMore = false;
      }, 150);
    }
  }

  // Quick Select Student from List or Roster
  function selectStudentQuick(studentId) {
    const studentList = getStudentsList();
    const st = studentList.find(s => s.id === studentId);
    if (!st) return;

    if (typeof window.selectStudent === 'function') {
      window.selectStudent(st);
    }

    // Switch to payment tab if in status tab
    if (typeof window.switchMainTab === 'function') {
      window.switchMainTab('payment');
    }

    renderQuickStudentList(document.getElementById('smartSearchInput')?.value || '', false);
    updateDashboardUploadCard();

    // Smoothly scroll both Dashboard Upload Card and Detailed Profile Card into view
    setTimeout(() => {
      const uploadCard = document.getElementById('dashboardUploadCard');
      const profileCard = document.getElementById('studentProfileCard');

      if (profileCard && !profileCard.classList.contains('hidden')) {
        profileCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (uploadCard) {
        uploadCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // 3. Render Dashboard Upload Card matching Mockup Bottom-Right
  function updateDashboardUploadCard() {
    const card = document.getElementById('dashboardUploadCard');
    if (!card) return;

    const st = window.currentSelectedStudent;
    const rec = st && window.paymentRecords ? window.paymentRecords[st.id] : null;
    const isPaid = rec && rec.paid;
    const selectedPrice = window.currentSelectedShirtSize && window.currentSelectedShirtSize.price !== undefined ? Number(window.currentSelectedShirtSize.price) : null;
    const defaultAmount = (window.currentCampaign && window.currentCampaign.amount) !== undefined ? window.currentCampaign.amount : (window.TARGET_PAYMENT_PER_PERSON || 390);
    const amount = selectedPrice !== null ? selectedPrice : defaultAmount;

    if (!st) {
      // Empty state prompt
      card.innerHTML = `
        <div class="text-center py-6 sm:py-8 space-y-3">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
            <i data-lucide="user-search" class="w-7 h-7"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-black text-white">เลือกรายชื่อนักศึกษา</h4>
            <p class="text-xs text-slate-400 max-w-xs mx-auto">
              กรุณาค้นหาหรือเลือกชื่อของท่านจากรายการด้านบน เพื่อเริ่มขั้นตอนแนบหลักฐานการโอน
            </p>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    if (isPaid) {
      // Paid state matching mockup
      const slipUrl = rec.slipUrl || (rec.slips && rec.slips[0] ? (rec.slips[0].url || rec.slips[0]) : '');
      const displayUrl = typeof formatDriveImageUrl === 'function' ? formatDriveImageUrl(slipUrl) : slipUrl;

      card.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] text-slate-400 block font-medium">หลักฐานการชำระเงิน</span>
              <h4 class="text-sm font-black text-white break-words">${st.name} (${st.nickname})</h4>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 flex-shrink-0">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
              <span>สำเร็จ (Paid)</span>
            </span>
          </div>

          <!-- Slip Thumbnail Preview -->
          <div onclick="openFullscreenModal('${displayUrl}')"
            class="relative w-full h-44 sm:h-52 rounded-2xl bg-black/60 overflow-hidden flex items-center justify-center border border-white/10 shadow-inner cursor-pointer group">
            <img src="${displayUrl}" alt="หลักฐานสลิป" class="max-h-full max-w-full object-contain mx-auto rounded-xl transition transform duration-300 group-hover:scale-105" loading="lazy">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
              <i data-lucide="zoom-in" class="w-4 h-4 mr-1"></i> คลิกดูภาพขยาย
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button type="button" onclick="openFullscreenModal('${displayUrl}')"
              class="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>ดูสลิป</span>
            </button>
            <button type="button" onclick="openDeleteSlipForStudent('${st.id}')"
              class="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
              <span>ลบสลิปนี้</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // Unpaid state with QR Code preview & Big Solid Orange Button matching mockup
      card.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] text-slate-400 block font-medium">อัปโหลดหลักฐานสลิป</span>
              <h4 class="text-sm font-black text-white break-words">${st.name} (${st.nickname})</h4>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex-shrink-0">฿${amount}.00</span>
          </div>

          <!-- QR Code Trigger & Slip Dropzone slot -->
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <i data-lucide="qr-code" class="w-4 h-4"></i>
                </div>
                <div>
                  <span class="text-xs font-bold text-white block">สแกนชำระเงิน</span>
                  <span class="text-[10px] text-slate-400 font-mono">พร้อมเพย์ / ทุกธนาคาร</span>
                </div>
              </div>
              <button type="button" onclick="openCurrentQrFullscreen()"
                class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                <span>เปิด QR Code</span>
              </button>
            </div>

            <!-- Slip Upload Dropzone Slot -->
            <div id="dropzoneSlot" onclick="document.getElementById('slipFileInput').click()"
              class="border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/[0.03] hover:bg-orange-500/[0.08] p-5 rounded-2xl text-center cursor-pointer transition">
              <input type="file" id="slipFileInput" accept="image/*" class="hidden" onchange="handleFileSelect(event)">
              <div id="dropzoneSlotContent" class="space-y-1.5">
                <i data-lucide="image-plus" class="w-7 h-7 mx-auto text-orange-400 mb-1"></i>
                <span class="text-xs font-bold text-white block">ลากไฟล์สลิปมาวาง หรือคลิกเพื่อเลือกรูป</span>
                <span class="text-[10px] text-slate-400 block font-mono">รองรับ JPG, PNG, WEBP</span>
              </div>
            </div>
          </div>

          <!-- Prominent Solid KKU Orange CTA Button matching mockup -->
          <button type="button" onclick="document.getElementById('slipFileInput').click()"
            class="w-full py-3.5 px-6 cyber-btn-primary flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer">
            <i data-lucide="upload" class="w-5 h-5"></i>
            <span>แนบหลักฐานการโอน</span>
          </button>
        </div>
      `;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Synchronize dynamic campaign titles and countdown
  function syncDashboardCampaignMeta() {
    if (!window.currentCampaign) return;
    const camp = window.currentCampaign;

    const colTitle = document.getElementById('col1CampaignTitle');
    const colAmount = document.getElementById('col1CampaignAmount');
    const centerTitle = document.getElementById('centerCampaignTitle');

    if (colTitle) colTitle.textContent = camp.title;
    if (colAmount) colAmount.textContent = `฿${camp.amount}`;
    if (centerTitle) centerTitle.textContent = camp.subtitle || camp.title;
  }

  // Hook into App Lifecycle
  function startCyberUI() {
    initCyberViewSwitcher();
    renderQuickStudentList(document.getElementById('smartSearchInput')?.value || '');
    updateDashboardUploadCard();
    syncDashboardCampaignMeta();

    const searchInput = document.getElementById('smartSearchInput');
    if (searchInput && !searchInput.dataset.cyberBound) {
      searchInput.dataset.cyberBound = 'true';
      searchInput.addEventListener('input', (e) => {
        renderQuickStudentList(e.target.value);
      });
      searchInput.addEventListener('focus', () => {
        renderQuickStudentList(searchInput.value);
      });
    }
  }

  // Run on DOM ready or immediately if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCyberUI);
  } else {
    startCyberUI();
  }

  // Periodic poll to re-render if data is resolved asynchronously
  let pollCount = 0;
  const pollInterval = setInterval(() => {
    pollCount++;
    const list = getStudentsList();
    if (list.length > 0) {
      startCyberUI();
      if (pollCount >= 10) clearInterval(pollInterval);
    }
  }, 400);

  // Hook into selectStudent and refreshProgressStats
  function attachHooks() {
    if (typeof window.selectStudent === 'function' && !window.selectStudent._isCyberPatched) {
      const prevSelect = window.selectStudent;
      window.selectStudent = function(st) {
        prevSelect(st);
        renderQuickStudentList(document.getElementById('smartSearchInput')?.value || '', false);
        updateDashboardUploadCard();
      };
      window.selectStudent._isCyberPatched = true;
    }

    if (typeof window.refreshProgressStats === 'function' && !window.refreshProgressStats._isCyberPatched) {
      const prevRefresh = window.refreshProgressStats;
      window.refreshProgressStats = function() {
        prevRefresh();
        syncDashboardCampaignMeta();

        const paidEl = document.getElementById('totalPeoplePaid');
        const targetEl = document.getElementById('targetPeople');
        const badgeEl = document.getElementById('targetPeopleStat');
        const ratioEl = document.getElementById('peopleRatioText');

        if (paidEl && targetEl && badgeEl) {
          const paidNum = paidEl.textContent || '0';
          const match = (targetEl.textContent || '').match(/\d+/);
          const totalNum = match ? match[0] : '60';
          badgeEl.textContent = paidNum + ' / ' + totalNum + ' คน';
          if (ratioEl) ratioEl.textContent = paidNum + ' / ' + totalNum + ' คน';
        }
      };
      window.refreshProgressStats._isCyberPatched = true;
    }
  }

  setInterval(attachHooks, 500);

  window.PaymentCyberUI = {
    init: initCyberViewSwitcher,
    setViewMode: setViewMode,
    renderCards: renderCyberCards,
    renderQuickList: renderQuickStudentList,
    selectStudentQuick: selectStudentQuick,
    updateUploadCard: updateDashboardUploadCard
  };

})(window);


// Global Bridge for Status Filter Tabs and Auto Rerender
if (typeof window !== 'undefined') {
  window.setFilter = function(filter) {
    if (typeof window.filterStatusList === 'function') {
      window.filterStatusList(filter);
    } else {
      window.currentFilter = filter;
    }
    const btnAll = document.getElementById('filterBtnAll');
    const btnPaid = document.getElementById('filterBtnPaid');
    const btnUnpaid = document.getElementById('filterBtnUnpaid');
    [btnAll, btnPaid, btnUnpaid].forEach(b => {
      if (b) b.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition';
    });
    if (filter === 'all' && btnAll) btnAll.className = 'px-3 py-1.5 rounded-lg font-bold bg-[#E65A19] text-white shadow-sm transition';
    if (filter === 'paid' && btnPaid) btnPaid.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white shadow-sm transition';
    if (filter === 'unpaid' && btnUnpaid) btnUnpaid.className = 'px-3 py-1.5 rounded-lg font-bold bg-rose-600 text-white shadow-sm transition';

    if (window.PaymentCyberUI && typeof window.PaymentCyberUI.renderCards === 'function') {
      window.PaymentCyberUI.renderCards();
    }
  };
}


// =========================================================================
// DYNAMIC SVG DUAL-RING RADIAL PROGRESS & DECREMENT FLASH TRACKER
// =========================================================================
(function() {
  let prevSec = null;
  let prevMin = null;
  let prevHour = null;

  function triggerElementFlash(el, flashClass) {
    if (!el) return;
    el.classList.remove('cd-flash-red', 'cd-pulse-cyan');
    // Force reflow
    void el.offsetWidth;
    el.classList.add(flashClass);
    setTimeout(() => {
      el.classList.remove(flashClass);
    }, 650);
  }

  function updateRadialCountdown() {
    const cdSecs = document.getElementById('cdSecs');
    const cdMins = document.getElementById('cdMins');
    const cdHours = document.getElementById('cdHours');
    const circleOuter = document.getElementById('cyberTimerCircleOuter'); // Cyan (Days/Hours/Total)
    const circleInner = document.getElementById('cyberTimerCircleInner'); // Orange (Seconds/Minutes)

    if (!cdSecs) return;

    const currentSec = parseInt(cdSecs.textContent, 10);
    const currentMin = cdMins ? parseInt(cdMins.textContent, 10) : 0;
    const currentHour = cdHours ? parseInt(cdHours.textContent, 10) : 0;

    // 1. Seconds change flash (Cyan Pulse)
    if (!isNaN(currentSec) && prevSec !== null && currentSec !== prevSec) {
      triggerElementFlash(cdSecs, 'cd-pulse-cyan');
    }

    // 2. Minutes change flash (Red Flash)
    if (!isNaN(currentMin) && prevMin !== null && currentMin !== prevMin) {
      triggerElementFlash(cdMins, 'cd-flash-red');
    }

    // 3. Hours change flash (Red Flash)
    if (!isNaN(currentHour) && prevHour !== null && currentHour !== prevHour) {
      triggerElementFlash(cdHours, 'cd-flash-red');
    }

    // Update state
    if (!isNaN(currentSec)) prevSec = currentSec;
    if (!isNaN(currentMin)) prevMin = currentMin;
    if (!isNaN(currentHour)) prevHour = currentHour;

    // 4. Update SVG Radial Progress Rings
    // Inner Ring: 60-second loop (Circumference = 2 * PI * 76 = 477.52)
    if (circleInner && !isNaN(currentSec)) {
      const innerCircumference = 477.52;
      const secElapsed = (60 - currentSec) % 60;
      const innerOffset = innerCircumference - (secElapsed / 60) * innerCircumference;
      circleInner.style.strokeDashoffset = innerOffset.toFixed(2);
    }

    // Outer Ring: 60-minute loop (Circumference = 2 * PI * 90 = 565.48)
    if (circleOuter && !isNaN(currentMin)) {
      const outerCircumference = 565.48;
      const minElapsed = (60 - currentMin) % 60;
      const outerOffset = outerCircumference - (minElapsed / 60) * outerCircumference;
      circleOuter.style.strokeDashoffset = outerOffset.toFixed(2);
    }
  }

  // Interval check every 250ms to ensure immediate detection of timer ticks
  setInterval(updateRadialCountdown, 250);
})();
