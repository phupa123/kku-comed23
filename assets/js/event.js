/**
 * =========================================================================
 * EVENT CLIENT SCRIPT - assets/js/event.js
 * จัดการหน้าเลือกฝ่ายนักศึกษา COMED KKU 69
 * =========================================================================
 */

let currentEvent = null;
let currentStudent = null; // { studentId, studentName, nickname, email }
let pendingSelection = null; // { deptId, roleId }
let currentRosterFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial Lucide
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 2. Load Active Event from Manager
  currentEvent = window.ComedEventManager.getActiveEvent('room_roles_69');

  // 3. Check Session / Local Login
  initUserSession();

  // 4. Render Initial UI
  renderEventHeader();
  renderDeptFilterChips();
  renderDepartmentsGrid();
  renderStats();
  renderRosterTable();
  populateStudentSelect();

  // 5. Background Initial Cloud Fetch
  try {
    await window.ComedEventManager.fetchCloudData(currentEvent.id);
    refreshEventUI();
  } catch(e) {}

  // 6. Connect Real-Time Live Sync (No refresh needed!)
  startRealtimeLiveSync();
});

function refreshEventUI() {
  renderDeptFilterChips();
  renderDepartmentsGrid();
  renderStats();
  renderRosterTable();
  checkCurrentUserStatus();
}

function startRealtimeLiveSync() {
  const badgeText = document.getElementById('eventRealtimeStatusText');
  const badgeEl = document.getElementById('eventRealtimeBadge');

  if (window.ComedEventManager && typeof window.ComedEventManager.subscribeRealtime === 'function') {
    window.ComedEventManager.subscribeRealtime(currentEvent.id, (eventNotice) => {
      console.log("[Event Client] 🔄 Realtime Update received:", eventNotice);
      
      // Update UI instantaneously
      refreshEventUI();

      // Pulse highlight effect on live badge
      if (badgeEl) {
        badgeEl.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-500/30');
        if (badgeText) badgeText.textContent = "⚡ มีการอัปเดตสด!";
        setTimeout(() => {
          badgeEl.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-500/30');
          if (badgeText) badgeText.textContent = "⚡ Real-Time ซิงค์สด";
        }, 1800);
      }
    });
  }
}

function initUserSession() {
  try {
    const stored = localStorage.getItem('COMED_USER_SESSION');
    if (stored) {
      const user = JSON.parse(stored);
      if (user && (user.studentId || user.email)) {
        // ค้นหาข้อมูลจาก STUDENTS_DATA เผื่อชื่อไม่ตรง
        let st = null;
        if (window.STUDENTS_DATA) {
          st = window.STUDENTS_DATA.find(s => 
            (user.studentId && s.id === user.studentId) ||
            (user.email && s.email.toLowerCase() === user.email.toLowerCase())
          );
        }

        currentStudent = {
          studentId: user.studentId || (st ? st.id : ''),
          studentName: user.studentName || user.name || (st ? st.name : 'นักศึกษา'),
          nickname: user.nickname || (st ? st.nickname : ''),
          email: user.email || (st ? st.email : '')
        };
        updateAuthWidget();
        checkCurrentUserStatus();
      }
    }
  } catch(e) {}
}

function updateAuthWidget() {
  const btnText = document.getElementById('authTriggerText');
  const btn = document.getElementById('btnAuthTrigger');
  const switchBtn = document.getElementById('btnSwitchUser');
  if (currentStudent && btnText) {
    btnText.textContent = `${currentStudent.nickname ? currentStudent.nickname + ' - ' : ''}${currentStudent.studentName}`;
    if (btn) {
      btn.classList.add('border-orange-500/50', 'bg-orange-500/10', 'text-orange-300');
    }
    if (switchBtn) switchBtn.classList.remove('hidden');
  } else {
    if (btnText) btnText.textContent = "ระบุตัวตน / เข้าสู่ระบบ";
    if (btn) {
      btn.classList.remove('border-orange-500/50', 'bg-orange-500/10', 'text-orange-300');
    }
    if (switchBtn) switchBtn.classList.add('hidden');
  }
}

function handleUserLogout() {
  if (confirm("คุณต้องการเปลี่ยนชื่อผู้ใช้ / ออกจากระบบ หรือไม่?")) {
    currentStudent = null;
    localStorage.removeItem('COMED_USER_SESSION');
    updateAuthWidget();
    checkCurrentUserStatus();
    renderDepartmentsGrid();
    renderRosterTable();
    alert("ออกจากระบบเรียบร้อยแล้ว คุณสามารถเลือกระบุตัวตนใหม่ได้");
  }
}

function checkCurrentUserStatus() {
  const card = document.getElementById('userCurrentStatusCard');
  if (!card) return;

  if (!currentStudent) {
    card.classList.add('hidden');
    return;
  }

  const reg = window.ComedEventManager.getStudentRegistration(currentEvent.id, currentStudent.studentId);
  if (reg) {
    document.getElementById('userRegisteredRoleTitle').textContent = reg.roleTitle;
    document.getElementById('userRegisteredDeptName').textContent = `สังกัด: ${reg.departmentName}`;
    card.classList.remove('hidden');
  } else {
    card.classList.add('hidden');
  }
}

function renderEventHeader() {
  if (!currentEvent) return;
  document.getElementById('eventMainTitle').textContent = currentEvent.title;
  document.getElementById('eventSubtitle').textContent = currentEvent.subtitle;

  const deadlineEl = document.getElementById('eventDeadlineText');
  if (deadlineEl && currentEvent.deadline) {
    const d = new Date(currentEvent.deadline);
    deadlineEl.textContent = `ปิดรับ: ${d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.`;
  }

  const badge = document.getElementById('eventStatusBadge');
  if (badge) {
    if (currentEvent.status === 'open') {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>เปิดรับลงทะเบียน</span>`;
      badge.className = "px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5";
    } else {
      badge.innerHTML = `<i data-lucide="lock" class="w-3.5 h-3.5 text-rose-400"></i><span>ปิดรับลงทะเบียนชั่วคราว</span>`;
      badge.className = "px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5";
    }
  }
}

let activeDeptCategory = 'all';

function renderStats() {
  const regs = window.ComedEventManager.getRegistrations(currentEvent.id);
  const totalStudents = (window.STUDENTS_DATA || []).length || 60;
  const registeredCount = regs.length;
  const unregisteredCount = Math.max(0, totalStudents - registeredCount);
  const pct = Math.round((registeredCount / totalStudents) * 100);

  const regEl = document.getElementById('statRegisteredCount');
  const unregEl = document.getElementById('statUnregisteredCount');
  const deptsEl = document.getElementById('statTotalDepts');
  const pctEl = document.getElementById('statProgressPercent');
  const barEl = document.getElementById('statProgressBar');

  if (regEl) regEl.textContent = registeredCount;
  if (unregEl) unregEl.textContent = unregisteredCount;
  if (deptsEl) deptsEl.textContent = (currentEvent.departments || []).length;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (barEl) barEl.style.width = `${pct}%`;
}

function renderDeptFilterChips() {
  const container = document.getElementById('deptFilterChips');
  if (!container || !currentEvent || !currentEvent.departments) return;

  const regs = window.ComedEventManager.getRegistrations(currentEvent.id);

  let chipsHtml = `
    <button onclick="filterDeptCategory('all')" 
      class="dept-chip ${activeDeptCategory === 'all' ? 'active bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'} flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
      <i data-lucide="layers" class="w-3.5 h-3.5"></i>
      <span>ทุกฝ่าย (${currentEvent.departments.length})</span>
    </button>
  `;

  chipsHtml += currentEvent.departments.map(dept => {
    const deptRegs = regs.filter(r => r.departmentId === dept.id);
    const totalDeptSeats = dept.roles.reduce((sum, r) => sum + r.maxSeats, 0);
    const isSelected = activeDeptCategory === dept.id;

    return `
      <button onclick="filterDeptCategory('${dept.id}')"
        class="dept-chip ${isSelected ? 'active bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'} flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="${dept.icon || 'circle'}" class="w-3.5 h-3.5"></i>
        <span>${dept.name}</span>
        <span class="px-1.5 py-0.2 rounded-md text-[10px] ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'}">
          ${deptRegs.length}/${totalDeptSeats}
        </span>
      </button>
    `;
  }).join('');

  container.innerHTML = chipsHtml;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterDeptCategory(deptId) {
  activeDeptCategory = deptId;
  renderDeptFilterChips();
  renderDepartmentsGrid();
}

function renderDepartmentsGrid() {
  const container = document.getElementById('departmentsContainer');
  if (!container || !currentEvent || !currentEvent.departments) return;

  const regs = window.ComedEventManager.getRegistrations(currentEvent.id);
  const myReg = currentStudent ? window.ComedEventManager.getStudentRegistration(currentEvent.id, currentStudent.studentId) : null;

  const filteredDepts = activeDeptCategory === 'all' 
    ? currentEvent.departments 
    : currentEvent.departments.filter(d => d.id === activeDeptCategory);

  if (filteredDepts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 text-sm">
        ไม่พบฝ่ายที่ตรงกับตัวกรอง
      </div>
    `;
    return;
  }

  container.innerHTML = filteredDepts.map(dept => {
    // คำนวณยอดรวมของฝ่าย
    const deptRegs = regs.filter(r => r.departmentId === dept.id);
    const totalDeptSeats = dept.roles.reduce((sum, r) => sum + r.maxSeats, 0);
    const isDeptFull = deptRegs.length >= totalDeptSeats;

    const rolesHtml = dept.roles.map(role => {
      const roleRegs = deptRegs.filter(r => r.roleId === role.id);
      const isFull = roleRegs.length >= role.maxSeats;
      const isMyRole = myReg && myReg.departmentId === dept.id && myReg.roleId === role.id;
      const availableSeats = Math.max(0, role.maxSeats - roleRegs.length);

      // รายชื่อคนที่ลงตำแหน่งนี้
      const membersPills = roleRegs.map(m => `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-[11px] text-slate-200">
          <i data-lucide="user" class="w-3 h-3 text-orange-400"></i>
          <span class="font-bold">${m.nickname ? m.nickname : m.studentName.split(' ')[0]}</span>
          <span class="text-[10px] text-slate-400">(${m.studentName})</span>
        </span>
      `).join('');

      return `
        <div class="p-3 sm:p-4 rounded-2xl bg-slate-900/95 border ${isMyRole ? 'border-orange-500 ring-1 ring-orange-500/50 bg-gradient-to-r from-orange-500/10 to-transparent' : 'border-slate-800/90 hover:border-slate-700/80'} space-y-2.5 transition">
          <div class="flex items-start justify-between gap-2.5">
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-black text-white text-xs sm:text-sm tracking-tight">${role.title}</span>
                ${isMyRole ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-orange-500 text-white font-black animate-pulse">คุณอยู่ตำแหน่งนี้</span>' : ''}
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <span class="text-[11px] font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'} flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-400'}"></span>
                  ${isFull ? 'เต็มแล้ว' : `ว่าง ${availableSeats} ที่`} (${roleRegs.length}/${role.maxSeats})
                </span>
              </div>
            </div>

            <!-- Action Button (Mobile-optimized thumb touch target) -->
            <div class="flex-shrink-0">
              ${isMyRole ? `
                <button onclick="handleCancelMyRole()" class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>ยกเลิก</span>
                </button>
              ` : (isFull ? `
                <button disabled class="px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-500 text-xs font-bold cursor-not-allowed border border-slate-700/50">
                  เต็ม
                </button>
              ` : `
                <button onclick="handleSelectRoleClick('${dept.id}', '${role.id}', '${dept.name}', '${role.title}')"
                  class="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r ${myReg ? 'from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500' : 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500'} text-white text-xs font-black shadow-md shadow-orange-600/20 transition cursor-pointer active:scale-95 flex items-center gap-1">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>${myReg ? 'ย้ายมาที่นี่' : 'เลือก'}</span>
                </button>
              `)}
            </div>
          </div>

          <!-- Members List Preview -->
          ${roleRegs.length > 0 ? `
            <div class="pt-2 border-t border-slate-800/70 flex flex-wrap gap-1.5 items-center">
              <span class="text-[10px] text-slate-400 font-bold mr-0.5">เพื่อนในตำแหน่ง:</span>
              ${membersPills}
            </div>
          ` : `
            <div class="pt-1 text-[10px] text-slate-500 italic">
              ✨ ยังไม่มีผู้เลือกตำแหน่งนี้ สามารถกดเลือกได้ทันที
            </div>
          `}
        </div>
      `;
    }).join('');

    return `
      <div class="glass-card rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 space-y-3.5 sm:space-y-4 border border-slate-800 hover:border-slate-700 transition">
        <!-- Dept Header -->
        <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${dept.color || 'from-orange-500 to-amber-500'} text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0">
              <i data-lucide="${dept.icon || 'star'}" class="w-5 h-5 sm:w-6 sm:h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm sm:text-base font-black text-white tracking-tight">${dept.name}</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${isDeptFull ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : (dept.badgeColor || 'bg-orange-500/10 text-orange-400 border border-orange-500/30')}">
                  ${deptRegs.length}/${totalDeptSeats} คน
                </span>
              </div>
              <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2">${dept.description || ''}</p>
            </div>
          </div>
        </div>

        <!-- Roles List -->
        <div class="space-y-2 sm:space-y-2.5">
          ${rolesHtml}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleSelectRoleClick(deptId, roleId, deptName, roleTitle) {
  // Check if user is identified
  if (!currentStudent) {
    pendingSelection = { deptId, roleId, deptName, roleTitle };
    openStudentAuthModal();
    return;
  }

  // Open Confirmation Modal
  document.getElementById('confirmStudentName').textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
  document.getElementById('confirmStudentId').textContent = currentStudent.studentId;
  document.getElementById('confirmDeptName').textContent = deptName;
  document.getElementById('confirmRoleTitle').textContent = roleTitle;
  document.getElementById('confirmRoleNote').value = '';

  pendingSelection = { deptId, roleId, deptName, roleTitle };

  const modal = document.getElementById('modalConfirmRole');
  if (modal) modal.classList.remove('hidden');
}

function closeConfirmRoleModal() {
  const modal = document.getElementById('modalConfirmRole');
  if (modal) modal.classList.add('hidden');
}

async function submitRoleRegistration() {
  if (!currentStudent || !pendingSelection) return;

  const btn = document.getElementById('btnSubmitRoleRegistration');
  const note = document.getElementById('confirmRoleNote')?.value.trim() || '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></span> กำลังบันทึกและแย่งที่นั่ง...`;
  }

  try {
    const studentPayload = {
      ...currentStudent,
      note: note
    };

    // Await server / atomic registration
    await window.ComedEventManager.registerRole(currentEvent.id, studentPayload, pendingSelection.deptId, pendingSelection.roleId);

    // ปรับลดเอฟเฟกต์พลุเบาๆ (Confetti) ให้เหลือเพียง 20 ชิ้น ไม่กระตุกแม้เครื่องไม่แรง
    if (typeof confetti !== 'undefined') {
      try {
        confetti({
          particleCount: 20,
          spread: 45,
          ticks: 120,
          origin: { y: 0.65 }
        });
      } catch(e) {}
    }

    const savedSelection = { ...pendingSelection };
    closeConfirmRoleModal();
    refreshEventUI();

    // แสดง Custom Popup ลงทะเบียนสำเร็จแทน alert ธรรมดา
    openRoleSuccessPopup(savedSelection);
  } catch(err) {
    alert("⚠️ " + (err.message || "ไม่สามารถลงทะเบียนได้"));
    // Refresh to get latest seats count
    refreshEventUI();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "ยืนยันการเลือกตำแหน่งนี้";
    }
  }
}

// ================= POPUP CONTROLLERS =================
function openAuthSuccessPopup(student) {
  const popup = document.getElementById('popupAuthSuccess');
  const nameEl = document.getElementById('popupAuthName');
  const idEl = document.getElementById('popupAuthId');
  if (nameEl) nameEl.textContent = `${student.studentName} (${student.nickname || '-'})`;
  if (idEl) idEl.textContent = `รหัสนักศึกษา: ${student.studentId}`;
  if (popup) {
    popup.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function closeAuthSuccessPopup() {
  const popup = document.getElementById('popupAuthSuccess');
  if (popup) popup.classList.add('hidden');
}

function openRoleSuccessPopup(selection) {
  const popup = document.getElementById('popupRoleSuccess');
  const nameEl = document.getElementById('popupSuccessStudentName');
  const deptEl = document.getElementById('popupSuccessDept');
  const roleEl = document.getElementById('popupSuccessRole');

  if (nameEl && currentStudent) nameEl.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
  if (deptEl) deptEl.textContent = selection.deptName || '-';
  if (roleEl) roleEl.textContent = selection.roleTitle || '-';

  if (popup) {
    popup.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function closeRoleSuccessPopup() {
  const popup = document.getElementById('popupRoleSuccess');
  if (popup) popup.classList.add('hidden');
  scrollToLiveRoster();
}

async function handleCancelMyRole() {
  if (!currentStudent) return;
  const reg = window.ComedEventManager.getStudentRegistration(currentEvent.id, currentStudent.studentId);
  if (!reg) return;

  if (confirm(`คุณต้องการยกเลิกการเลือกตำแหน่ง "${reg.roleTitle}" (${reg.departmentName}) ใช่หรือไม่?`)) {
    try {
      await window.ComedEventManager.cancelRegistration(currentEvent.id, currentStudent.studentId);
      refreshEventUI();
      alert("✅ ยกเลิกการเลือกตำแหน่งเรียบร้อยแล้ว คุณสามารถเลือกตำแหน่งใหม่ได้ทันที");
    } catch(err) {
      alert("⚠️ เกิดข้อผิดพลาดในการยกเลิก: " + (err.message || ""));
    }
  }
}

// ================= ROSTER TABLE =================
function filterRoster(tab) {
  currentRosterFilter = tab;
  document.querySelectorAll('.roster-tab').forEach(b => {
    b.classList.remove('bg-orange-500', 'text-white', 'active');
    b.classList.add('bg-slate-900', 'text-slate-400');
  });
  event.target.classList.add('bg-orange-500', 'text-white', 'active');
  event.target.classList.remove('bg-slate-900', 'text-slate-400');
  renderRosterTable();
}

function renderRosterTable() {
  const tbody = document.getElementById('rosterTableBody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('rosterSearchInput')?.value || '').trim().toLowerCase();
  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(currentEvent ? currentEvent.id : 'room_roles_69');

  let rows = students.map((st, idx) => {
    const reg = regs.find(r => r.studentId === st.id);
    return {
      index: idx + 1,
      studentId: st.id,
      name: st.name,
      nickname: st.nickname || '-',
      email: st.email,
      departmentName: reg ? reg.departmentName : null,
      roleTitle: reg ? reg.roleTitle : null,
      registeredAt: reg ? reg.registeredAt : null,
      isRegistered: !!reg
    };
  });

  // Filter Tab
  if (currentRosterFilter === 'registered') {
    rows = rows.filter(r => r.isRegistered);
  } else if (currentRosterFilter === 'pending') {
    rows = rows.filter(r => !r.isRegistered);
  }

  // Search filter
  if (searchQuery) {
    rows = rows.filter(r => 
      r.name.toLowerCase().includes(searchQuery) ||
      r.studentId.toLowerCase().includes(searchQuery) ||
      r.nickname.toLowerCase().includes(searchQuery) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(searchQuery)) ||
      (r.roleTitle && r.roleTitle.toLowerCase().includes(searchQuery))
    );
  }

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-500">
          <i data-lucide="user-x" class="w-6 h-6 mx-auto mb-2 text-slate-600"></i>
          <span>ไม่พบข้อมูลที่ค้นหา</span>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr class="hover:bg-slate-900/50 transition">
      <td class="p-3.5 text-slate-500 font-mono">${r.index}</td>
      <td class="p-3.5 font-mono text-slate-300 font-bold">${r.studentId}</td>
      <td class="p-3.5 text-white font-bold">${r.name}</td>
      <td class="p-3.5 text-orange-400 font-bold">${r.nickname}</td>
      <td class="p-3.5">
        ${r.departmentName ? `<span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[11px]">${r.departmentName}</span>` : '<span class="text-slate-600">-</span>'}
      </td>
      <td class="p-3.5">
        ${r.roleTitle ? `<span class="text-emerald-400 font-bold text-xs">${r.roleTitle}</span>` : '<span class="text-slate-600 text-[11px]">ยังไม่ได้เลือก</span>'}
      </td>
      <td class="p-3.5 text-center">
        ${r.isRegistered ? `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> เรียบร้อย
          </span>
        ` : `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
            รอดำเนินการ
          </span>
        `}
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function scrollToLiveRoster() {
  const el = document.getElementById('rosterSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ================= AUTH MODAL & PICKER =================
function populateStudentSelect() {
  const sel = document.getElementById('authStudentSelect');
  if (!sel) return;
  const list = window.STUDENTS_DATA || [];
  sel.innerHTML = '<option value="">-- กรุณาเลือกรายชื่อของคุณ --</option>' + list.map(st => `
    <option value="${st.id}">${st.id} - ${st.name} (${st.nickname || 'ไม่มีชื่อเล่น'})</option>
  `).join('');
}

function openStudentAuthModal() {
  const modal = document.getElementById('modalAuth');
  if (modal) modal.classList.remove('hidden');

  // Render Google Button if available
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "799199144896-9tft22kns4jjv40lk19oul9dp1mprmb4.apps.googleusercontent.com",
        callback: handleGoogleAuthResponse
      });
      google.accounts.id.renderButton(
        document.getElementById('googleAuthWrapper'),
        { theme: "outline", size: "large", width: 260, text: "signin_with", shape: "pill" }
      );
    }
  } catch(e) {}
}

function closeStudentAuthModal() {
  const modal = document.getElementById('modalAuth');
  if (modal) modal.classList.add('hidden');
}

function confirmStudentPickerAuth() {
  const sel = document.getElementById('authStudentSelect');
  const stId = sel?.value;
  if (!stId) {
    alert("กรุณาเลือกรายชื่อนักศึกษา");
    return;
  }
  const student = (window.STUDENTS_DATA || []).find(s => s.id === stId);
  if (!student) return;

  currentStudent = {
    studentId: student.id,
    studentName: student.name,
    nickname: student.nickname || '',
    email: student.email
  };

  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
  closeStudentAuthModal();
  updateAuthWidget();
  checkCurrentUserStatus();
  renderDepartmentsGrid();

  if (pendingSelection) {
    handleSelectRoleClick(pendingSelection.deptId, pendingSelection.roleId, pendingSelection.deptName, pendingSelection.roleTitle);
  } else {
    // แสดง Popup ต้อนรับเข้าสู่ระบบ
    openAuthSuccessPopup(currentStudent);
  }
}

function handleGoogleAuthResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = (payload.email || '').toLowerCase().trim();
    const isSpecialTester = (email === 'phupa5874@gmail.com');
    if (!email.endsWith('@kkumail.com') && !isSpecialTester) {
      alert("กรุณาใช้อีเมล @kkumail.com เท่านั้น");
      return;
    }
    const student = (window.STUDENTS_DATA || []).find(s => s.email.toLowerCase() === email);
    currentStudent = {
      studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : email.split('@')[0]),
      studentName: student ? student.name : (isSpecialTester ? 'ภูผา (ผู้ดูแลระบบ & ทดสอบระบบ)' : payload.name),
      nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
      email: email,
      isSpecialTester: isSpecialTester
    };

    localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
    closeStudentAuthModal();
    updateAuthWidget();
    checkCurrentUserStatus();
    renderDepartmentsGrid();

    if (pendingSelection) {
      handleSelectRoleClick(pendingSelection.deptId, pendingSelection.roleId, pendingSelection.deptName, pendingSelection.roleTitle);
    } else {
      openAuthSuccessPopup(currentStudent);
    }
  } catch(e) {
    console.warn("Google Auth Parse Error:", e);
  }
}
