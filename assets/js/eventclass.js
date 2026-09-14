/**
 * =========================================================================
 * EVENT CLASS CONTROLLER - assets/js/eventclass.js
 * สำหรับกิจกรรมพิเศษรุ่น COMED KKU 69: ซุ้มพี่บัณฑิต & งานวันเด็กแห่งชาติ
 * รองรับการเลือกได้ทั้ง 2 กิจกรรม (Multi-Track) พร้อมโควตายืดหยุ่น > 30 คน
 * =========================================================================
 */

const EVENT_CLASS_ID = 'eventclass_69';

let currentClassEvent = null;
let activeTrackId = 'track_grad'; // 'track_grad' | 'track_children'
let currentStudent = null; // { studentId, studentName, nickname, email }
let pendingTrackSelection = null; // { trackId, deptId, roleId, trackTitle, deptName, roleTitle }
let currentRosterFilter = 'all'; // 'all' | 'grad' | 'children' | 'both' | 'pending'
let deptSearchQuery = '';
let currentMobileTab = 'tracks';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Init Icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 2. Load Event definition
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);

  // 3. Init User Session
  initUserSession();

  // 4. Render Initial UI
  updateTrackCardsHighlight();
  renderActiveTrackHeader();
  renderTrackDepartments();
  updateUserParticipationSummary();
  updateOverallStats();
  renderClassRosterTable();
  populateStudentPicker();

  // 5. Background Cloud Fetch
  try {
    await window.ComedEventManager.fetchCloudData(EVENT_CLASS_ID);
    currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
    refreshClassEventUI();
  } catch(e) {}

  // 6. Connect Real-time Live Sync
  startRealtimeLiveSync();

  // 7. Responsive Mobile Handling
  if (window.innerWidth < 1024) {
    switchMobileTab('tracks');
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      document.getElementById('bentoLeftPanel')?.classList.remove('hidden');
      document.getElementById('sectionDepartmentsView')?.classList.remove('hidden');
      document.getElementById('sectionRosterView')?.classList.remove('hidden');
    } else {
      switchMobileTab(currentMobileTab);
    }
  });
});

// ================= REALTIME SYNC =================
function startRealtimeLiveSync() {
  const badgeText = document.getElementById('classRealtimeStatusText');
  const badgeEl = document.getElementById('classRealtimeBadge');

  if (window.ComedEventManager && typeof window.ComedEventManager.subscribeRealtime === 'function') {
    window.ComedEventManager.subscribeRealtime(EVENT_CLASS_ID, (notice) => {
      console.log("[EventClass Client] 🔄 Realtime Notice:", notice);
      refreshClassEventUI();

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

function refreshClassEventUI() {
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
  updateTrackCardsHighlight();
  renderActiveTrackHeader();
  renderTrackDepartments();
  updateUserParticipationSummary();
  updateOverallStats();
  renderClassRosterTable();
}

// ================= USER SESSION =================
function initUserSession() {
  try {
    const stored = localStorage.getItem('COMED_USER_SESSION');
    if (stored) {
      const user = JSON.parse(stored);
      if (user && (user.studentId || user.email)) {
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
      }
    }
  } catch(e) {}
}

function updateAuthWidget() {
  const btnText = document.getElementById('authTriggerText');
  const btn = document.getElementById('btnAuthTrigger');
  const switchBtn = document.getElementById('btnSwitchUser');
  const userPrompt = document.getElementById('floatingUserPrompt');
  const userRole = document.getElementById('floatingUserRoleTitle');

  if (currentStudent && btnText) {
    btnText.textContent = `${currentStudent.nickname ? currentStudent.nickname + ' - ' : ''}${currentStudent.studentName}`;
    if (btn) {
      btn.classList.add('border-orange-500/50', 'bg-orange-500/10', 'text-orange-300');
    }
    if (switchBtn) switchBtn.classList.remove('hidden');
    if (userPrompt) userPrompt.textContent = `คุณ: ${currentStudent.nickname || currentStudent.studentName.split(' ')[0]}`;
  } else {
    if (btnText) btnText.textContent = "ระบุตัวตน";
    if (btn) {
      btn.classList.remove('border-orange-500/50', 'bg-orange-500/10', 'text-orange-300');
    }
    if (switchBtn) switchBtn.classList.add('hidden');
    if (userPrompt) userPrompt.textContent = "สถานะ: ยังไม่ระบุตัวตน";
    if (userRole) userRole.textContent = "กดปุ่มระบุตัวตนเพื่อลงชื่อ";
  }
}

function handleUserLogout() {
  if (confirm("คุณต้องการเปลี่ยนชื่อผู้ใช้ / ออกจากระบบ หรือไม่?")) {
    currentStudent = null;
    localStorage.removeItem('COMED_USER_SESSION');
    updateAuthWidget();
    refreshClassEventUI();
    alert("ออกจากระบบเรียบร้อยแล้ว คุณสามารถระบุตัวตนใหม่ได้");
  }
}

// ================= TRACK SELECTION CONTROLS =================
function selectActiveTrack(trackId) {
  activeTrackId = trackId;
  updateTrackCardsHighlight();
  renderActiveTrackHeader();
  renderTrackDepartments();

  // Scroll smoothly to departments section on desktop
  const deptSection = document.getElementById('sectionDepartmentsView');
  if (deptSection && window.innerWidth >= 1024) {
    deptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateTrackCardsHighlight() {
  const cardGrad = document.getElementById('cardTrackGrad');
  const cardChild = document.getElementById('cardTrackChildren');
  const btnGrad = document.getElementById('btnSwitchGrad');
  const btnChild = document.getElementById('btnSwitchChildren');

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const gradRegs = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_')));
  const childRegs = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_')));

  // Update Counters
  const elGradCount = document.getElementById('gradEnrolledCount');
  const elChildCount = document.getElementById('childrenEnrolledCount');
  if (elGradCount) elGradCount.textContent = gradRegs.length;
  if (elChildCount) elChildCount.textContent = childRegs.length;

  // Update Highlight active state
  if (activeTrackId === 'track_grad') {
    cardGrad?.classList.add('track-active');
    cardChild?.classList.remove('track-active');
    if (btnGrad) {
      btnGrad.className = "px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer bg-amber-500 text-slate-950 shadow-sm";
    }
    if (btnChild) {
      btnChild.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white";
    }
  } else {
    cardChild?.classList.add('track-active');
    cardGrad?.classList.remove('track-active');
    if (btnChild) {
      btnChild.className = "px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer bg-sky-500 text-slate-950 shadow-sm";
    }
    if (btnGrad) {
      btnGrad.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer text-slate-400 hover:text-white";
    }
  }

  // Update Status Pills on Top Cards
  if (currentStudent) {
    const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
    const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

    const gradPill = document.getElementById('gradUserRegStatusPill');
    const childPill = document.getElementById('childrenUserRegStatusPill');

    if (gradPill) {
      if (myGrad) {
        gradPill.className = "px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        gradPill.textContent = `✓ ลงแล้ว: ${myGrad.roleTitle}`;
      } else {
        gradPill.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400";
        gradPill.textContent = "ยังไม่ได้ลงชื่อในงานนี้";
      }
    }

    if (childPill) {
      if (myChild) {
        childPill.className = "px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        childPill.textContent = `✓ ลงแล้ว: ${myChild.roleTitle}`;
      } else {
        childPill.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400";
        childPill.textContent = "ยังไม่ได้ลงชื่อในงานนี้";
      }
    }
  }
}

function renderActiveTrackHeader() {
  const track = currentClassEvent?.tracks?.find(t => t.id === activeTrackId);
  if (!track) return;

  const iconContainer = document.getElementById('activeTrackIconContainer');
  const iconEl = document.getElementById('activeTrackIcon');
  const tagEl = document.getElementById('activeTrackTag');
  const dateEl = document.getElementById('activeTrackDate');
  const titleEl = document.getElementById('activeTrackTitle');
  const descEl = document.getElementById('activeTrackDescription');

  if (activeTrackId === 'track_grad') {
    if (iconContainer) iconContainer.className = "w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0";
    if (iconEl) iconEl.setAttribute('data-lucide', 'graduation-cap');
    if (tagEl) {
      tagEl.textContent = "ตัวเลือกที่ 1";
      tagEl.className = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
  } else {
    if (iconContainer) iconContainer.className = "w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0";
    if (iconEl) iconEl.setAttribute('data-lucide', 'sparkles');
    if (tagEl) {
      tagEl.textContent = "ตัวเลือกที่ 2";
      tagEl.className = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30";
    }
  }

  if (dateEl) dateEl.textContent = track.dateDisplay || '';
  if (titleEl) titleEl.textContent = `${track.title} (${track.location.split('(')[0].trim()})`;
  if (descEl) descEl.textContent = `${track.description} — โควตาแนะนำ ${track.targetCount} คน (หากมีเพื่อนสมัครเกินสามารถขยายรับเพิ่มได้)`;

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleTrackDeptSearch(val) {
  deptSearchQuery = String(val || '').trim().toLowerCase();
  renderTrackDepartments();
}

// ================= RENDER DEPARTMENTS & ROLES =================
function renderTrackDepartments() {
  const container = document.getElementById('trackDepartmentsContainer');
  if (!container || !currentClassEvent) return;

  const track = currentClassEvent.tracks?.find(t => t.id === activeTrackId);
  if (!track || !track.departments) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500">ไม่พบฝ่ายในกิจกรรมนี้</div>`;
    return;
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const myTrackReg = currentStudent ? window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, activeTrackId) : null;

  let filteredDepts = track.departments;
  if (deptSearchQuery) {
    filteredDepts = filteredDepts.map(dept => {
      const matchedRoles = dept.roles.filter(r => 
        r.title.toLowerCase().includes(deptSearchQuery) ||
        dept.name.toLowerCase().includes(deptSearchQuery) ||
        (dept.description && dept.description.toLowerCase().includes(deptSearchQuery))
      );
      return matchedRoles.length > 0 ? { ...dept, displayRoles: matchedRoles } : null;
    }).filter(Boolean);
  } else {
    filteredDepts = filteredDepts.map(d => ({ ...d, displayRoles: d.roles }));
  }

  if (filteredDepts.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-3xl p-12 text-center text-slate-400 border border-slate-800 space-y-2">
        <i data-lucide="search-x" class="w-8 h-8 mx-auto text-slate-500"></i>
        <p class="font-bold text-sm">ไม่พบฝ่ายหรือตำแหน่งที่ตรงกับคำค้นหา "${deptSearchQuery}"</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  container.innerHTML = filteredDepts.map(dept => {
    const deptRegs = regs.filter(r => (r.trackId === activeTrackId || !r.trackId) && r.departmentId === dept.id);
    const totalDeptBaseSeats = dept.roles.reduce((sum, r) => sum + r.maxSeats, 0);

    const rolesHtml = dept.displayRoles.map(role => {
      const roleRegs = deptRegs.filter(r => r.roleId === role.id);
      const isMyCurrentRole = myTrackReg && myTrackReg.departmentId === dept.id && myTrackReg.roleId === role.id;
      const isFull = roleRegs.length >= role.maxSeats;

      let actionButtonHtml = '';
      if (isMyCurrentRole) {
        actionButtonHtml = `
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> คุณเลือกตำแหน่งนี้
            </span>
            <button onclick="handleCancelTrackRole('${activeTrackId}')" class="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer" title="ยกเลิกการเลือก">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
      } else {
        actionButtonHtml = `
          <button onclick="openSelectRoleModal('${activeTrackId}', '${track.title}', '${dept.id}', '${dept.name}', '${role.id}', '${role.title}')"
            class="px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl ${isFull ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'} font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 flex-shrink-0">
            <span>${isFull ? '+ ลงชื่อเพิ่ม' : 'เลือกตำแหน่งนี้'}</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        `;
      }

      // Member avatars/tags
      const membersPills = roleRegs.map(reg => `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] text-slate-200">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          <strong class="text-orange-300">${reg.nickname || reg.studentName.split(' ')[0]}</strong>
          <span class="text-slate-400 text-[10px] font-mono">(${reg.studentId.substring(0, 8)})</span>
        </span>
      `).join('');

      return `
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border ${isMyCurrentRole ? 'border-emerald-500/50 bg-emerald-950/10 ring-1 ring-emerald-500/20' : 'border-slate-800/90 hover:border-slate-700'} transition space-y-2.5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h5 class="text-xs sm:text-sm font-black text-white">${role.title}</h5>
                <span class="px-2 py-0.2 rounded-md text-[10px] font-black ${roleRegs.length > role.maxSeats ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : (isFull ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300')}">
                  ${roleRegs.length}/${role.maxSeats} ${roleRegs.length > role.maxSeats ? '(ขยายรับเพิ่ม)' : 'คน'}
                </span>
              </div>
            </div>
            ${actionButtonHtml}
          </div>

          <!-- Enrolled members list -->
          <div class="pt-1 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-slate-500 font-bold">สมาชิก (${roleRegs.length}):</span>
            ${roleRegs.length > 0 ? membersPills : '<span class="text-[10px] text-slate-600 italic">ยังไม่มีเพื่อนลงตำแหน่งนี้</span>'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4 shadow-xl">
        <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${dept.color || 'from-orange-500 to-amber-500'} text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0">
              <i data-lucide="${dept.icon || 'star'}" class="w-5 h-5 sm:w-6 sm:h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm sm:text-base font-black text-white tracking-tight">${dept.name}</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${dept.badgeColor || 'bg-orange-500/10 text-orange-400 border border-orange-500/30'}">
                  ${deptRegs.length} คน
                </span>
              </div>
              <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2">${dept.description || ''}</p>
            </div>
          </div>
        </div>

        <div class="space-y-2 sm:space-y-2.5">
          ${rolesHtml}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= MODAL & ROLE SELECTION =================
function openSelectRoleModal(trackId, trackTitle, deptId, deptName, roleId, roleTitle) {
  if (!currentStudent) {
    pendingTrackSelection = { trackId, trackTitle, deptId, deptName, roleId, roleTitle };
    openStudentAuthModal();
    return;
  }

  pendingTrackSelection = { trackId, trackTitle, deptId, deptName, roleId, roleTitle };

  document.getElementById('confirmStudentName').textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
  document.getElementById('confirmStudentId').textContent = currentStudent.studentId;
  document.getElementById('confirmTrackTitle').textContent = trackTitle;
  document.getElementById('confirmDeptName').textContent = deptName;
  document.getElementById('confirmRoleTitle').textContent = roleTitle;
  document.getElementById('confirmRoleNote').value = '';

  const modal = document.getElementById('modalConfirmRole');
  if (modal) modal.classList.remove('hidden');
}

function closeConfirmRoleModal() {
  const modal = document.getElementById('modalConfirmRole');
  if (modal) modal.classList.add('hidden');
}

async function submitTrackRoleRegistration() {
  if (!currentStudent || !pendingTrackSelection) return;

  const btn = document.getElementById('btnSubmitRoleRegistration');
  const note = document.getElementById('confirmRoleNote')?.value.trim() || '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></span> กำลังบันทึก...`;
  }

  try {
    const studentPayload = {
      ...currentStudent,
      note: note
    };

    await window.ComedEventManager.registerTrackRole(
      EVENT_CLASS_ID,
      studentPayload,
      pendingTrackSelection.trackId,
      pendingTrackSelection.deptId,
      pendingTrackSelection.roleId
    );

    // Confetti effect
    if (typeof confetti !== 'undefined') {
      try {
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.65 } });
      } catch(e) {}
    }

    const saved = { ...pendingTrackSelection };
    closeConfirmRoleModal();
    refreshClassEventUI();
    openRoleSuccessPopup(saved);
  } catch(err) {
    alert("⚠️ " + (err.message || "ไม่สามารถลงทะเบียนได้"));
    refreshClassEventUI();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "ยืนยันการเลือกตำแหน่งนี้";
    }
  }
}

async function handleCancelTrackRole(trackId) {
  if (!currentStudent) return;
  const reg = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, trackId);
  if (!reg) return;

  const trackName = trackId === 'track_grad' ? 'ทำซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
  if (confirm(`คุณต้องการยกเลิกการเข้าร่วม "${trackName}" (ตำแหน่ง: ${reg.roleTitle}) ใช่หรือไม่?`)) {
    try {
      await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, trackId);
      refreshClassEventUI();
      alert(`✅ ยกเลิกการเข้าร่วม ${trackName} เรียบร้อยแล้ว`);
    } catch(err) {
      alert("⚠️ เกิดข้อผิดพลาด: " + (err.message || ""));
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
  const trackEl = document.getElementById('popupSuccessTrack');
  const deptEl = document.getElementById('popupSuccessDept');
  const roleEl = document.getElementById('popupSuccessRole');

  if (nameEl && currentStudent) nameEl.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
  if (trackEl) trackEl.textContent = selection.trackTitle || '-';
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
}

// ================= USER STATUS & OVERALL STATS =================
function updateUserParticipationSummary() {
  const displayNameEl = document.getElementById('userDisplayName');
  const badgeGrad = document.getElementById('badgeMyGradRole');
  const detailGrad = document.getElementById('detailMyGradRole');
  const actionGrad = document.getElementById('actionMyGradRole');

  const badgeChild = document.getElementById('badgeMyChildRole');
  const detailChild = document.getElementById('detailMyChildRole');
  const actionChild = document.getElementById('actionMyChildRole');

  const floatingRole = document.getElementById('floatingUserRoleTitle');
  const tabStatusText = document.getElementById('tabMyStatusText');

  if (!currentStudent) {
    if (displayNameEl) displayNameEl.textContent = "ยังไม่ได้ระบุตัวตน";
    if (badgeGrad) { badgeGrad.textContent = "ยังไม่ลง"; badgeGrad.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400"; }
    if (detailGrad) detailGrad.textContent = "กดเลือกตำแหน่งเพื่อเริ่มลงชื่อ";
    if (actionGrad) actionGrad.classList.add('hidden');

    if (badgeChild) { badgeChild.textContent = "ยังไม่ลง"; badgeChild.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400"; }
    if (detailChild) detailChild.textContent = "กดเลือกตำแหน่งเพื่อเริ่มลงชื่อ";
    if (actionChild) actionChild.classList.add('hidden');

    if (floatingRole) floatingRole.textContent = "เลือกซุ้มบัณฑิต / วันเด็ก";
    if (tabStatusText) tabStatusText.textContent = "สถานะฉัน";
    return;
  }

  const nameDisplay = `${currentStudent.studentName} (${currentStudent.nickname || 'ไม่มีชื่อเล่น'})`;
  if (displayNameEl) displayNameEl.textContent = nameDisplay;

  const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
  const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

  // Grad status
  if (myGrad) {
    if (badgeGrad) {
      badgeGrad.textContent = "ลงแล้ว ✓";
      badgeGrad.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    if (detailGrad) detailGrad.innerHTML = `<strong class="text-white">${myGrad.roleTitle}</strong> <span class="text-slate-400 text-[10px]">(${myGrad.departmentName.replace(/\[.*?\]\s*/, '')})</span>`;
    if (actionGrad) actionGrad.classList.remove('hidden');
  } else {
    if (badgeGrad) {
      badgeGrad.textContent = "ยังไม่ลง";
      badgeGrad.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400";
    }
    if (detailGrad) detailGrad.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    if (actionGrad) actionGrad.classList.add('hidden');
  }

  // Child status
  if (myChild) {
    if (badgeChild) {
      badgeChild.textContent = "ลงแล้ว ✓";
      badgeChild.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    if (detailChild) detailChild.innerHTML = `<strong class="text-white">${myChild.roleTitle}</strong> <span class="text-slate-400 text-[10px]">(${myChild.departmentName.replace(/\[.*?\]\s*/, '')})</span>`;
    if (actionChild) actionChild.classList.remove('hidden');
  } else {
    if (badgeChild) {
      badgeChild.textContent = "ยังไม่ลง";
      badgeChild.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400";
    }
    if (detailChild) detailChild.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    if (actionChild) actionChild.classList.add('hidden');
  }

  // Floating & Tab status text
  if (myGrad && myChild) {
    if (floatingRole) floatingRole.textContent = "ร่วม 2 กิจกรรมเรียบร้อย ✓";
    if (tabStatusText) tabStatusText.textContent = "ลงครบ 2 งาน ✓";
  } else if (myGrad) {
    if (floatingRole) floatingRole.textContent = `ซุ้มบัณฑิต: ${myGrad.roleTitle}`;
    if (tabStatusText) tabStatusText.textContent = "ซุ้มบัณฑิต ✓";
  } else if (myChild) {
    if (floatingRole) floatingRole.textContent = `งานวันเด็ก: ${myChild.roleTitle}`;
    if (tabStatusText) tabStatusText.textContent = "งานวันเด็ก ✓";
  } else {
    if (floatingRole) floatingRole.textContent = "ยังไม่ได้เลือกลงกิจกรรม";
    if (tabStatusText) tabStatusText.textContent = "ยังไม่เลือก";
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateOverallStats() {
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const students = window.STUDENTS_DATA || [];

  const gradCount = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))).length;
  const childCount = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))).length;

  // Both
  const bothCount = students.filter(st => {
    const hasGrad = regs.some(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const hasChild = regs.some(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));
    return hasGrad && hasChild;
  }).length;

  // Pending
  const pendingCount = students.filter(st => {
    return !regs.some(r => r.studentId === st.id);
  }).length;

  document.getElementById('statGradTotal').textContent = gradCount;
  document.getElementById('statChildrenTotal').textContent = childCount;
  document.getElementById('statBothTotal').textContent = bothCount;
  document.getElementById('statPendingTotal').textContent = pendingCount;

  document.getElementById('countFilterGrad').textContent = gradCount;
  document.getElementById('countFilterChildren').textContent = childCount;
  document.getElementById('countFilterBoth').textContent = bothCount;
  document.getElementById('countFilterPending').textContent = pendingCount;
}

// ================= ROSTER TABLE (60 STUDENTS) =================
function filterRosterTab(tab) {
  currentRosterFilter = tab;
  document.querySelectorAll('.roster-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-orange-500', 'text-white', 'font-black');
    btn.classList.add('text-slate-400', 'font-bold');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active', 'bg-orange-500', 'text-white', 'font-black');
    event.currentTarget.classList.remove('text-slate-400', 'font-bold');
  }
  renderClassRosterTable();
}

function renderClassRosterTable() {
  const tbody = document.getElementById('classRosterTableBody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('rosterSearchInput')?.value || '').trim().toLowerCase();
  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  let rows = students.map((st, idx) => {
    const gradReg = regs.find(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const childReg = regs.find(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

    const isGrad = !!gradReg;
    const isChild = !!childReg;
    const isBoth = isGrad && isChild;
    const isPending = !isGrad && !isChild;

    return {
      index: idx + 1,
      studentId: st.id,
      name: st.name,
      nickname: st.nickname || '-',
      email: st.email,
      gradRole: gradReg ? `${gradReg.roleTitle} (${gradReg.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      childRole: childReg ? `${childReg.roleTitle} (${childReg.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      isGrad,
      isChild,
      isBoth,
      isPending
    };
  });

  // Filter Tabs
  if (currentRosterFilter === 'grad') rows = rows.filter(r => r.isGrad);
  else if (currentRosterFilter === 'children') rows = rows.filter(r => r.isChild);
  else if (currentRosterFilter === 'both') rows = rows.filter(r => r.isBoth);
  else if (currentRosterFilter === 'pending') rows = rows.filter(r => r.isPending);

  // Search Filter
  if (searchQuery) {
    rows = rows.filter(r => 
      r.name.toLowerCase().includes(searchQuery) ||
      r.studentId.toLowerCase().includes(searchQuery) ||
      r.nickname.toLowerCase().includes(searchQuery) ||
      (r.gradRole && r.gradRole.toLowerCase().includes(searchQuery)) ||
      (r.childRole && r.childRole.toLowerCase().includes(searchQuery))
    );
  }

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-500">
          <i data-lucide="user-x" class="w-6 h-6 mx-auto mb-2 text-slate-600"></i>
          <span>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</span>
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
        ${r.gradRole ? `<span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px]">${r.gradRole}</span>` : '<span class="text-slate-600">-</span>'}
      </td>
      <td class="p-3.5">
        ${r.childRole ? `<span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold text-[11px]">${r.childRole}</span>` : '<span class="text-slate-600">-</span>'}
      </td>
      <td class="p-3.5 text-center">
        ${r.isBoth ? `
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
            🌟 ครบ 2 กิจกรรม
          </span>
        ` : (r.isGrad || r.isChild) ? `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
            1 กิจกรรม
          </span>
        ` : `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
            รอดำเนินการ
          </span>
        `}
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= EXPORT EXCEL (.XLSX) =================
function exportClassRosterExcel() {
  if (typeof XLSX === 'undefined') {
    alert("ไม่พบไลบรารีส่งออก Excel");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  // Sheet 1: Overall Model
  const overallData = [
    ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "อีเมล", "ซุ้มพี่บัณฑิต (20 ธ.ค.)", "งานวันเด็ก (9 ม.ค. 70)", "สถานะการร่วมกิจกรรม"]
  ];

  students.forEach((st, idx) => {
    const grad = regs.find(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const child = regs.find(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

    let status = "ยังไม่ได้เลือก";
    if (grad && child) status = "ร่วมทั้ง 2 กิจกรรม";
    else if (grad) status = "ร่วมซุ้มพี่บัณฑิต";
    else if (child) status = "ร่วมงานวันเด็ก";

    overallData.push([
      idx + 1,
      st.id,
      st.name,
      st.nickname || '',
      st.email,
      grad ? `${grad.roleTitle} (${grad.departmentName})` : "-",
      child ? `${child.roleTitle} (${child.departmentName})` : "-",
      status
    ]);
  });

  const wb = XLSX.utils.book_new();
  const wsOverall = XLSX.utils.aoa_to_sheet(overallData);
  XLSX.utils.book_append_sheet(wb, wsOverall, "ภาพรวม 60 คน");

  // Sheet 2: Grad Booth
  const gradData = [["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "ฝ่าย", "ตำแหน่ง", "เบอร์/ข้อความ"]];
  const gradRegs = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_')));
  gradRegs.forEach((r, idx) => {
    gradData.push([idx + 1, r.studentId, r.studentName, r.nickname || '', r.departmentName, r.roleTitle, r.note || '']);
  });
  const wsGrad = XLSX.utils.aoa_to_sheet(gradData);
  XLSX.utils.book_append_sheet(wb, wsGrad, "ซุ้มพี่บัณฑิต");

  // Sheet 3: Children Day
  const childData = [["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "ฝ่าย", "ตำแหน่ง", "เบอร์/ข้อความ"]];
  const childRegs = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_')));
  childRegs.forEach((r, idx) => {
    childData.push([idx + 1, r.studentId, r.studentName, r.nickname || '', r.departmentName, r.roleTitle, r.note || '']);
  });
  const wsChild = XLSX.utils.aoa_to_sheet(childData);
  XLSX.utils.book_append_sheet(wb, wsChild, "งานวันเด็ก");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายชื่อกิจกรรมรุ่น69_ซุ้มบัณฑิต_วันเด็ก_${today}.xlsx`);
}

// ================= AUTH MODAL & GOOGLE LOGIN =================
function populateStudentPicker() {
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
  refreshClassEventUI();

  if (pendingTrackSelection) {
    openSelectRoleModal(
      pendingTrackSelection.trackId,
      pendingTrackSelection.trackTitle,
      pendingTrackSelection.deptId,
      pendingTrackSelection.deptName,
      pendingTrackSelection.roleId,
      pendingTrackSelection.roleTitle
    );
  } else {
    openAuthSuccessPopup(currentStudent);
  }
}

function handleGoogleAuthResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = (payload.email || '').toLowerCase().trim();
    const isSpecialTester = (email === 'phupa5874@gmail.com' || email === 'thitiwut.a@kkumail.com');
    if (!email.endsWith('@kkumail.com') && !isSpecialTester) {
      alert("กรุณาใช้อีเมล @kkumail.com เท่านั้น");
      return;
    }
    const student = (window.STUDENTS_DATA || []).find(s => s.email.toLowerCase() === email);
    currentStudent = {
      studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : email.split('@')[0]),
      studentName: student ? student.name : (isSpecialTester ? 'ภูผา (ผู้ดูแลระบบ & ทดสอบ)' : payload.name),
      nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
      email: email,
      isSpecialTester: isSpecialTester
    };

    localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
    closeStudentAuthModal();
    updateAuthWidget();
    refreshClassEventUI();

    if (pendingTrackSelection) {
      openSelectRoleModal(
        pendingTrackSelection.trackId,
        pendingTrackSelection.trackTitle,
        pendingTrackSelection.deptId,
        pendingTrackSelection.deptName,
        pendingTrackSelection.roleId,
        pendingTrackSelection.roleTitle
      );
    } else {
      openAuthSuccessPopup(currentStudent);
    }
  } catch(e) {
    console.warn("Google Auth Parse Error:", e);
  }
}

// ================= MOBILE TAB SWITCHER =================
function switchMobileTab(tabName) {
  currentMobileTab = tabName;
  const btnTracks = document.getElementById('tabBtnTracks');
  const btnRoster = document.getElementById('tabBtnRoster');
  const btnMyStatus = document.getElementById('tabBtnMyStatus');

  const leftPanel = document.getElementById('bentoLeftPanel');
  const viewDepts = document.getElementById('sectionDepartmentsView');
  const viewRoster = document.getElementById('sectionRosterView');

  // Reset tab buttons
  [btnTracks, btnRoster, btnMyStatus].forEach(b => {
    if (b) {
      b.className = "mobile-segment-btn py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition";
    }
  });

  if (tabName === 'tracks') {
    btnTracks?.classList.remove('text-slate-400');
    btnTracks?.classList.add('active', 'bg-orange-500', 'text-white', 'font-black');
    viewDepts?.classList.remove('hidden');
    leftPanel?.classList.add('hidden');
    viewRoster?.classList.add('hidden');
  } else if (tabName === 'roster') {
    btnRoster?.classList.remove('text-slate-400');
    btnRoster?.classList.add('active', 'bg-orange-500', 'text-white', 'font-black');
    viewRoster?.classList.remove('hidden');
    viewDepts?.classList.add('hidden');
    leftPanel?.classList.add('hidden');
  } else if (tabName === 'mystatus') {
    btnMyStatus?.classList.remove('text-slate-400');
    btnMyStatus?.classList.add('active', 'bg-orange-500', 'text-white', 'font-black');
    leftPanel?.classList.remove('hidden');
    viewDepts?.classList.add('hidden');
    viewRoster?.classList.add('hidden');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}
