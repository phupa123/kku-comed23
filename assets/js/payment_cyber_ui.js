/**
 * =========================================================================
 * PAYMENT CYBER UI ENGINE - assets/js/payment_cyber_ui.js
 * จัดการ Grid View 3D Cards, View Switcher, และ UI Interaction ล้ำสมัย
 * =========================================================================
 */

(function(window) {
  'use strict';

  let currentViewMode = localStorage.getItem('COMED_PAYMENT_VIEW_MODE') || 'cards'; // 'cards' | 'table'

  // Initialize View Switcher UI
  function initCyberViewSwitcher() {
    const tableContainer = document.querySelector('#tabContentStatus .overflow-x-auto');
    if (!tableContainer) return;

    // Check if controls already injected
    if (document.getElementById('cyberViewModeControls')) return;

    const controlBar = document.createElement('div');
    controlBar.id = 'cyberViewModeControls';
    controlBar.className = 'flex items-center justify-between gap-3 pb-3 border-b border-white/10 mb-4 flex-wrap';
    controlBar.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">รูปแบบการแสดงผล:</span>
        <div class="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10 text-xs shadow-inner">
          <button type="button" id="btnViewModeCards" onclick="window.PaymentCyberUI.setViewMode('cards')"
            class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${currentViewMode === 'cards' ? 'bg-[#E65A19] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
            <span>การ์ดโปรไฟล์ (3D Grid)</span>
          </button>
          <button type="button" id="btnViewModeTable" onclick="window.PaymentCyberUI.setViewMode('table')"
            class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${currentViewMode === 'table' ? 'bg-[#E65A19] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
            <i data-lucide="table" class="w-3.5 h-3.5"></i>
            <span>ตารางข้อมูล (Table)</span>
          </button>
        </div>
      </div>
      <div class="text-xs text-slate-400 font-mono">
        <span id="cyberRosterCounter">กำลังโหลด...</span>
      </div>
    `;

    tableContainer.parentNode.insertBefore(controlBar, tableContainer);

    // Create Cards Grid Container right after tableContainer
    let cardsGrid = document.getElementById('studentStatusCardsGrid');
    if (!cardsGrid) {
      cardsGrid = document.createElement('div');
      cardsGrid.id = 'studentStatusCardsGrid';
      cardsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-2';
      tableContainer.parentNode.insertBefore(cardsGrid, tableContainer.nextSibling);
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
    const tableContainer = document.querySelector('#tabContentStatus .overflow-x-auto');
    const cardsGrid = document.getElementById('studentStatusCardsGrid');
    const btnCards = document.getElementById('btnViewModeCards');
    const btnTable = document.getElementById('btnViewModeTable');

    if (btnCards && btnTable) {
      if (currentViewMode === 'cards') {
        btnCards.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all bg-[#E65A19] text-white shadow-sm cursor-pointer';
        btnTable.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
      } else {
        btnTable.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all bg-[#E65A19] text-white shadow-sm cursor-pointer';
        btnCards.className = 'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-slate-400 hover:text-white cursor-pointer';
      }
    }

    if (tableContainer && cardsGrid) {
      if (currentViewMode === 'cards') {
        tableContainer.classList.add('hidden');
        cardsGrid.classList.remove('hidden');
      } else {
        tableContainer.classList.remove('hidden');
        cardsGrid.classList.add('hidden');
      }
    }
  }

  function renderCyberCards() {
    const cardsGrid = document.getElementById('studentStatusCardsGrid');
    if (!cardsGrid) return;

    const students = window.STUDENTS_DATA || [];
    const paymentRecords = window.paymentRecords || {};
    const searchVal = (document.getElementById('tableSearchInput')?.value || '').toLowerCase().trim();
    const currentFilter = window.currentFilter || 'all';

    const list = students.filter(st => {
      const isPaid = paymentRecords[st.id] && paymentRecords[st.id].paid;
      if (currentFilter === 'paid' && !isPaid) return false;
      if (currentFilter === 'unpaid' && isPaid) return false;

      if (searchVal) {
        const matchString = `${st.id} ${st.name} ${st.nickname} ${st.email}`.toLowerCase();
        return matchString.includes(searchVal);
      }
      return true;
    });

    const counter = document.getElementById('cyberRosterCounter');
    if (counter) counter.textContent = `แสดง ${list.length} จาก 60 คน`;

    if (list.length === 0) {
      cardsGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-500 font-mono text-xs">
          <i data-lucide="user-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    cardsGrid.innerHTML = list.map((st, idx) => {
      const rec = paymentRecords[st.id];
      const isPaid = rec && rec.paid;
      const isEligible = window.ComedCampaignManager ? window.ComedCampaignManager.isStudentEligible(window.currentCampaign, st.id) : true;
      const isExempted = !isPaid && !isEligible;

      // Avatar
      const customProfile = (typeof getStudentProfileData === 'function') ? getStudentProfileData(st.email, st.id) : null;
      const avatarUrl = customProfile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(st.email || st.name)}`;

      let statusBadge = '';
      let cardBorder = 'border-white/10';
      if (isPaid) {
        statusBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30"><i data-lucide="check-circle" class="w-3 h-3"></i> จ่ายแล้ว</span>';
        cardBorder = 'border-emerald-500/30 hover:border-emerald-500/60';
      } else if (isExempted) {
        statusBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30"><i data-lucide="shield-check" class="w-3 h-3"></i> ยกเว้น</span>';
        cardBorder = 'border-amber-500/30';
      } else {
        statusBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30"><i data-lucide="clock" class="w-3 h-3"></i> ยังไม่จ่าย</span>';
        cardBorder = 'border-rose-500/20 hover:border-orange-500/40';
      }

      return `
        <div class="cyber-student-card p-4 flex flex-col justify-between border ${cardBorder} subtle-hover space-y-3 relative overflow-hidden group">
          <!-- Top Row -->
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] text-slate-500">#${String(idx + 1).padStart(2, '0')}</span>
            ${statusBadge}
          </div>

          <!-- Avatar & Identity -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-black/60 p-0.5 border border-white/10 overflow-hidden flex-shrink-0 relative group-hover:border-[#E65A19]/50 transition-colors">
              <img src="${avatarUrl}" alt="${st.name}" class="w-full h-full object-cover rounded-xl" loading="lazy">
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate group-hover:text-orange-300 transition-colors">${st.name}</h4>
              </div>
              <div class="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
                <span class="text-amber-300 font-bold">น้อง${st.nickname}</span>
                <span>•</span>
                <span class="truncate">${st.id}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Button -->
          <div class="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            ${isPaid
              ? `<button type="button" onclick="openStudentDetail('${st.id}')"
                  class="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer">
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>ดูหลักฐานสลิป</span>
                </button>`
              : `<button type="button" onclick="redirectToPayment('${st.id}')"
                  class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer">
                  <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
                  <span>ไปชำระเงิน</span>
                </button>`
            }
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Hook into existing payment engine render loop
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(initCyberViewSwitcher, 200);

    // Patch renderStatusTable to also render Cards Grid seamlessly
    if (typeof window.renderStatusTable === 'function') {
      const prevRender = window.renderStatusTable;
      window.renderStatusTable = function() {
        prevRender();
        initCyberViewSwitcher();
        renderCyberCards();
      };
    }
  });

  window.PaymentCyberUI = {
    init: initCyberViewSwitcher,
    setViewMode: setViewMode,
    renderCards: renderCyberCards
  };

})(window);
