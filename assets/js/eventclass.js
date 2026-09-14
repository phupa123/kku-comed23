/**
 * =========================================================================
 * EVENT CLASS CONTROLLER (3-Step Wizard Flow) - assets/js/eventclass.js
 * ปรับปรุงใหม่: เรียบง่าย ตรงไปตรงมา ใช้งานง่ายที่สุดสำหรับคอมและมือถือ
 * Step 1: ระบุตัวตน (เลือกชื่อ 60 คน หรือ Google Login)
 * Step 2: เลือกฝ่ายและตำแหน่งใน 2 กิจกรรมใหญ่ (ซุ้มบัณฑิต / วันเด็ก)
 * Step 3: สรุปสถานะตนเอง และดูทำเนียบเพื่อนร่วมรุ่น (60 คน)
 * =========================================================================
 */

const EVENT_CLASS_ID = 'eventclass_69';

let currentClassEvent = null;
let activeTrackId = 'track_grad'; // 'track_grad' | 'track_children'
let currentStudent = null; // { studentId, studentName, nickname, email }
let pendingTrackSelection = null; // { trackId, deptId, roleId, trackTitle, deptName, roleTitle }
let currentRosterFilter = 'all'; // 'all' | 'grad' | 'children' | 'both' | 'pending'
let currentStepNumber = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 2. Load Event from repository
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);

  // 3. Populate student dropdown list
  populateStudentPickerStep1();

  // 4. Check existing session
  initUserSession();

  // 5. Initial render of departments & roster
  renderStep2Departments();
  updateStep2TrackSwitcher();
  updateUserSummaryStep3();
  renderClassRosterTable();

  // 6. Setup Google Login
  initGoogleAuthStep1();

  // 7. Cloud Fetch & Realtime sync
  try {
    await window.ComedEventManager.fetchCloudData(EVENT_CLASS_ID);
    currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
    refreshUI();
  } catch(e) {}

  startRealtimeLiveSync();

  // 8. Auto proceed to Step 2 if user is already logged in
  if (currentStudent && currentStudent.studentId) {
    goToStep(2);
  } else {
    goToStep(1);
  }
});

// ================= STEP WIZARD NAVIGATION =================
function goToStep(step) {
  currentStepNumber = step;

  const sec1 = document.getElementById('stepSection1');
  const sec2 = document.getElementById('stepSection2');
  const sec3 = document.getElementById('stepSection3');

  const btn1 = document.getElementById('stepBtn1');
  const btn2 = document.getElementById('stepBtn2');
  const btn3 = document.getElementById('stepBtn3');

  // Reset display
  sec1.classList.add('hidden');
  sec2.classList.add('hidden');
  sec3.classList.add('hidden');

  const inactiveBtnClass = "step-nav-btn py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-slate-800/80 text-slate-400";
  const activeBtnClass = "step-nav-btn py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 step-active";
  const completedBtnClass = "step-nav-btn py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 step-completed";

  [btn1, btn2, btn3].forEach(b => {
    if (b) b.className = inactiveBtnClass;
  });

  if (step === 1) {
    sec1.classList.remove('hidden');
    if (btn1) btn1.className = activeBtnClass;
  } else if (step === 2) {
    if (!currentStudent) {
      alert("กรุณาเลือกรหัสนักศึกษา/ชื่อของคุณในขั้นตอนที่ 1 ก่อนครับ");
      goToStep(1);
      return;
    }
    sec2.classList.remove('hidden');
    if (btn1) btn1.className = completedBtnClass;
    if (btn2) btn2.className = activeBtnClass;
    renderStep2Departments();
    updateStep2TrackSwitcher();
  } else if (step === 3) {
    sec3.classList.remove('hidden');
    if (btn1 && currentStudent) btn1.className = completedBtnClass;
    if (btn2) btn2.className = completedBtnClass;
    if (btn3) btn3.className = activeBtnClass;
    updateUserSummaryStep3();
    renderClassRosterTable();
  }

  // Scroll to top of step nicely
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= USER SESSION & STEP 1 =================
function populateStudentPickerStep1() {
  const sel = document.getElementById('step1StudentSelect');
  if (!sel) return;
  const list = window.STUDENTS_DATA || [];
  sel.innerHTML = '<option value="">-- แตะเพื่อเลือกรหัส/ชื่อของคุณ --</option>' + list.map(st => `
    <option value="${st.id}">${st.id} - ${st.name} (${st.nickname || 'ไม่มีชื่อเล่น'})</option>
  `).join('');
}

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
        updateProfileCards();
      }
    }
  } catch(e) {}
}

function handleStep1StudentChange(studentId) {
  if (!studentId) return;
  const student = (window.STUDENTS_DATA || []).find(s => s.id === studentId);
  if (!student) return;

  currentStudent = {
    studentId: student.id,
    studentName: student.name,
    nickname: student.nickname || '',
    email: student.email
  };

  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
  updateProfileCards();
}

function submitStep1AndContinue() {
  const sel = document.getElementById('step1StudentSelect');
  if (!currentStudent && sel && sel.value) {
    handleStep1StudentChange(sel.value);
  }

  if (!currentStudent) {
    alert("กรุณาเลือกรายชื่อของคุณก่อนเพื่อดำเนินการต่อ");
    return;
  }

  goToStep(2);
}

function updateProfileCards() {
  const card = document.getElementById('step1ProfileCard');
  const confirmedName = document.getElementById('step1ConfirmedName');
  const confirmedId = document.getElementById('step1ConfirmedId');
  const headerName = document.getElementById('headerUserName');
  const headerBadge = document.getElementById('headerUserBadge');
  const step2UserName = document.getElementById('step2UserName');
  const step3UserName = document.getElementById('step3UserName');
  const sel = document.getElementById('step1StudentSelect');

  if (currentStudent) {
    if (card) card.classList.remove('hidden');
    if (confirmedName) confirmedName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
    if (confirmedId) confirmedId.textContent = `รหัส: ${currentStudent.studentId}`;
    if (headerName) headerName.textContent = currentStudent.nickname || currentStudent.studentName.split(' ')[0];
    if (headerBadge) headerBadge.classList.remove('hidden');
    if (step2UserName) step2UserName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
    if (step3UserName) step3UserName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'}) | รหัส ${currentStudent.studentId}`;
    if (sel && currentStudent.studentId) sel.value = currentStudent.studentId;

    // Check my current registrations
    const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
    const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

    const gradText = document.getElementById('step1GradStatusText');
    const childText = document.getElementById('step1ChildStatusText');
    if (gradText) {
      gradText.textContent = myGrad ? `✓ ${myGrad.roleTitle}` : 'ยังไม่เลือกลง';
      gradText.className = myGrad ? 'font-bold text-emerald-400' : 'font-bold text-slate-500';
    }
    if (childText) {
      childText.textContent = myChild ? `✓ ${myChild.roleTitle}` : 'ยังไม่เลือกลง';
      childText.className = myChild ? 'font-bold text-emerald-400' : 'font-bold text-slate-500';
    }
  } else {
    if (card) card.classList.add('hidden');
    if (headerBadge) headerBadge.classList.add('hidden');
    if (sel) sel.value = '';
  }
}

function handleUserLogout() {
  if (confirm("ต้องการเปลี่ยนชื่อหรือเลือกใหม่อีกครั้งหรือไม่?")) {
    currentStudent = null;
    localStorage.removeItem('COMED_USER_SESSION');
    updateProfileCards();
    goToStep(1);
  }
}

function initGoogleAuthStep1() {
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "799199144896-9tft22kns4jjv40lk19oul9dp1mprmb4.apps.googleusercontent.com",
        callback: handleGoogleAuthResponse
      });
      google.accounts.id.renderButton(
        document.getElementById('googleAuthWrapperStep1'),
        { theme: "outline", size: "medium", width: 250, text: "signin_with", shape: "pill" }
      );
    }
  } catch(e) {}
}

function handleGoogleAuthResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email = (payload.email || '').toLowerCase().trim();
    const isSpecialTester = (email === 'phupa5874@gmail.com' || email === 'thitiwut.a@kkumail.com');

    if (!email.endsWith('@kkumail.com') && !isSpecialTester) {
      alert("กรุณาใช้อีเมล @kkumail.com เพื่อยืนยันตัวตน");
      return;
    }

    const student = (window.STUDENTS_DATA || []).find(s => s.email.toLowerCase() === email);
    currentStudent = {
      studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : email.split('@')[0]),
      studentName: student ? student.name : (isSpecialTester ? 'ภูผา (ทดสอบระบบ)' : payload.name),
      nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
      email: email
    };

    localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
    updateProfileCards();
    goToStep(2);
  } catch(e) {
    console.warn("Google Auth Error:", e);
  }
}

// ================= STEP 2: TRACK & DEPARTMENTS =================
function switchStep2Track(trackId) {
  activeTrackId = trackId;
  updateStep2TrackSwitcher();
  renderStep2Departments();
}

function updateStep2TrackSwitcher() {
  const btnGrad = document.getElementById('step2BtnGrad');
  const btnChild = document.getElementById('step2BtnChild');
  const bannerTitle = document.getElementById('activeTrackBannerTitle');
  const bannerDesc = document.getElementById('activeTrackBannerDesc');

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const gradRegs = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_')));
  const childRegs = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_')));

  document.getElementById('step2BadgeGradCount').textContent = `${gradRegs.length} / 30+ คน`;
  document.getElementById('step2BadgeChildCount').textContent = `${childRegs.length} / 30+ คน`;

  // Highlight active button
  if (activeTrackId === 'track_grad') {
    btnGrad.className = "p-3 rounded-xl border text-left transition relative cursor-pointer border-amber-500 bg-amber-500/15 text-white";
    btnChild.className = "p-3 rounded-xl border text-left transition relative cursor-pointer border-slate-800 bg-slate-900 text-slate-400 hover:text-white";
    if (bannerTitle) bannerTitle.innerHTML = `<i data-lucide="graduation-cap" class="w-4 h-4 text-amber-400"></i><span>ฝ่ายงาน: ทำซุ้มพี่บัณฑิต (ช่วง 20 ธ.ค. 2 วัน)</span>`;
    if (bannerDesc) bannerDesc.textContent = "สถานที่: โรงรถ 1 ล็อค คณะศึกษาศาสตร์ เน้นจัดฉากถ่ายรูปสวยงาม อบอุ่น และต้อนรับพี่บัณฑิต";
  } else {
    btnChild.className = "p-3 rounded-xl border text-left transition relative cursor-pointer border-sky-500 bg-sky-500/15 text-white";
    btnGrad.className = "p-3 rounded-xl border text-left transition relative cursor-pointer border-slate-800 bg-slate-900 text-slate-400 hover:text-white";
    if (bannerTitle) bannerTitle.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-sky-400"></i><span>ฝ่ายงาน: งานวันเด็กแห่งชาติ (ช่วง 9 ม.ค. 2570)</span>`;
    if (bannerDesc) bannerDesc.textContent = "ลงทะเบียนซุ้มสาขา ออกแบบกิจกรรมให้เด็กๆ เช่น Bingo, ระบายสี AR 3D, หุ่นยนต์ และแจกของขวัญ";
  }

  // Show "selected" badge on track if user enrolled
  if (currentStudent) {
    const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
    const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

    const gradBadge = document.getElementById('step2MyGradSelectedBadge');
    const childBadge = document.getElementById('step2MyChildSelectedBadge');
    if (gradBadge) {
      gradBadge.classList.toggle('hidden', !myGrad);
      if (myGrad) gradBadge.textContent = `✓ ลงแล้ว: ${myGrad.roleTitle}`;
    }
    if (childBadge) {
      childBadge.classList.toggle('hidden', !myChild);
      if (myChild) childBadge.textContent = `✓ ลงแล้ว: ${myChild.roleTitle}`;
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderStep2Departments() {
  const container = document.getElementById('step2DepartmentsContainer');
  if (!container || !currentClassEvent) return;

  const track = currentClassEvent.tracks?.find(t => t.id === activeTrackId);
  if (!track || !track.departments) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500">ไม่พบข้อมูลฝ่าย</div>`;
    return;
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const myTrackReg = currentStudent ? window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, activeTrackId) : null;

  container.innerHTML = track.departments.map(dept => {
    const deptRegs = regs.filter(r => (r.trackId === activeTrackId || !r.trackId) && r.departmentId === dept.id);

    const rolesHtml = dept.roles.map(role => {
      const roleRegs = deptRegs.filter(r => r.roleId === role.id);
      const isMyRole = myTrackReg && myTrackReg.departmentId === dept.id && myTrackReg.roleId === role.id;
      const isFull = roleRegs.length >= role.maxSeats;

      let actionBtn = '';
      if (isMyRole) {
        actionBtn = `
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> เลือกอยู่
            </span>
            <button onclick="handleCancelTrackRole('${activeTrackId}')" class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition cursor-pointer" title="ยกเลิก">
              ยกเลิก
            </button>
          </div>
        `;
      } else {
        actionBtn = `
          <button onclick="openSelectRoleModal('${activeTrackId}', '${track.title}', '${dept.id}', '${dept.name}', '${role.id}', '${role.title}')"
            class="px-3.5 py-1.5 rounded-xl ${isFull ? 'bg-amber-600 hover:bg-amber-500' : 'bg-orange-600 hover:bg-orange-500'} text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0">
            <span>${isFull ? '+ ลงเพิ่ม' : 'เลือกตำแหน่งนี้'}</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        `;
      }

      // Member names
      const memberNames = roleRegs.map(r => `
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-800">
          ${r.nickname || r.studentName.split(' ')[0]}
        </span>
      `).join(' ');

      return `
        <div class="p-3 rounded-xl bg-slate-950 border ${isMyRole ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800/80'} space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs sm:text-sm font-bold text-white">${role.title}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded ${isFull ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'} font-mono">
                  ${roleRegs.length}/${role.maxSeats} คน
                </span>
              </div>
            </div>
            ${actionBtn}
          </div>

          <!-- Members list -->
          <div class="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-500 text-[10px]">เพื่อนที่ลง (${roleRegs.length}):</span>
            ${roleRegs.length > 0 ? memberNames : '<span class="text-slate-600 italic text-[10px]">ยังไม่มี</span>'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="clean-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0">
              <i data-lucide="${dept.icon || 'star'}" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">${dept.name}</h4>
              <p class="text-[11px] text-slate-400 leading-tight">${dept.description || ''}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            ${deptRegs.length} คน
          </span>
        </div>

        <div class="space-y-2">
          ${rolesHtml}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= MODAL & CONFIRMATION =================
function openSelectRoleModal(trackId, trackTitle, deptId, deptName, roleId, roleTitle) {
  if (!currentStudent) {
    alert("กรุณาระบุตัวตนก่อนครับ");
    goToStep(1);
    return;
  }

  pendingTrackSelection = { trackId, trackTitle, deptId, deptName, roleId, roleTitle };

  document.getElementById('confirmStudentName').textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
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
    btn.textContent = "กำลังบันทึก...";
  }

  try {
    await window.ComedEventManager.registerTrackRole(
      EVENT_CLASS_ID,
      { ...currentStudent, note },
      pendingTrackSelection.trackId,
      pendingTrackSelection.deptId,
      pendingTrackSelection.roleId
    );

    if (typeof confetti !== 'undefined') {
      try { confetti({ particleCount: 30, spread: 60 }); } catch(e) {}
    }

    closeConfirmRoleModal();
    refreshUI();
    alert(`✅ บันทึกตำแหน่ง "${pendingTrackSelection.roleTitle}" เรียบร้อยแล้ว!`);
  } catch(err) {
    alert("⚠️ " + (err.message || "ไม่สามารถลงทะเบียนได้"));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "ยืนยัน";
    }
  }
}

async function handleCancelTrackRole(trackId) {
  if (!currentStudent) return;
  const reg = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, trackId);
  if (!reg) return;

  const trackName = trackId === 'track_grad' ? 'ทำซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
  if (confirm(`คุณต้องการยกเลิกการเข้าร่วม "${trackName}" ใช่หรือไม่?`)) {
    try {
      await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, trackId);
      refreshUI();
      alert(`✅ ยกเลิกการเข้าร่วมเรียบร้อยแล้ว`);
    } catch(err) {
      alert("⚠️ เกิดข้อผิดพลาด: " + (err.message || ""));
    }
  }
}

// ================= STEP 3: SUMMARY & ROSTER =================
function updateUserSummaryStep3() {
  const nameEl = document.getElementById('step3UserName');
  const badgeGrad = document.getElementById('step3BadgeGrad');
  const detailGrad = document.getElementById('step3DetailGrad');
  const actionGrad = document.getElementById('step3ActionGrad');

  const badgeChild = document.getElementById('step3BadgeChild');
  const detailChild = document.getElementById('step3DetailChild');
  const actionChild = document.getElementById('step3ActionChild');

  if (!currentStudent) {
    if (nameEl) nameEl.textContent = "ยังไม่ได้ระบุตัวตน";
    return;
  }

  const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
  const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

  if (myGrad) {
    badgeGrad.textContent = "ลงแล้ว ✓";
    badgeGrad.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    detailGrad.textContent = `${myGrad.roleTitle} (${myGrad.departmentName.replace(/\[.*?\]\s*/, '')})`;
    actionGrad.classList.remove('hidden');
  } else {
    badgeGrad.textContent = "ยังไม่ลง";
    badgeGrad.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    detailGrad.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    actionGrad.classList.add('hidden');
  }

  if (myChild) {
    badgeChild.textContent = "ลงแล้ว ✓";
    badgeChild.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    detailChild.textContent = `${myChild.roleTitle} (${myChild.departmentName.replace(/\[.*?\]\s*/, '')})`;
    actionChild.classList.remove('hidden');
  } else {
    badgeChild.textContent = "ยังไม่ลง";
    badgeChild.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    detailChild.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    actionChild.classList.add('hidden');
  }
}

function filterRosterTab(tab) {
  currentRosterFilter = tab;
  document.querySelectorAll('.roster-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-orange-600', 'text-white');
    btn.classList.add('text-slate-400');
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active', 'bg-orange-600', 'text-white');
    window.event.currentTarget.classList.remove('text-slate-400');
  }
  renderClassRosterTable();
}

function renderClassRosterTable() {
  const tbody = document.getElementById('classRosterTableBody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('rosterSearchInput')?.value || '').trim().toLowerCase();
  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  const gradCount = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))).length;
  const childCount = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))).length;
  
  const bothCount = students.filter(st => {
    const hasG = regs.some(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const hasC = regs.some(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));
    return hasG && hasC;
  }).length;

  const pendingCount = students.filter(st => !regs.some(r => r.studentId === st.id)).length;

  document.getElementById('countFilterGrad').textContent = gradCount;
  document.getElementById('countFilterChildren').textContent = childCount;
  document.getElementById('countFilterBoth').textContent = bothCount;
  document.getElementById('countFilterPending').textContent = pendingCount;

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
      gradRole: gradReg ? `${gradReg.roleTitle} (${gradReg.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      childRole: childReg ? `${childReg.roleTitle} (${childReg.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      isGrad,
      isChild,
      isBoth,
      isPending
    };
  });

  if (currentRosterFilter === 'grad') rows = rows.filter(r => r.isGrad);
  else if (currentRosterFilter === 'children') rows = rows.filter(r => r.isChild);
  else if (currentRosterFilter === 'both') rows = rows.filter(r => r.isBoth);
  else if (currentRosterFilter === 'pending') rows = rows.filter(r => r.isPending);

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
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">ไม่พบรายชื่อตามเงื่อนไขที่ค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr class="hover:bg-slate-900/60 transition">
      <td class="p-3 text-slate-500 font-mono">${r.index}</td>
      <td class="p-3 font-mono text-slate-300 font-bold">${r.studentId}</td>
      <td class="p-3 text-white font-medium">${r.name}</td>
      <td class="p-3 text-orange-400 font-bold">${r.nickname}</td>
      <td class="p-3">${r.gradRole ? `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px]">${r.gradRole}</span>` : '<span class="text-slate-600">-</span>'}</td>
      <td class="p-3">${r.childRole ? `<span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold text-[11px]">${r.childRole}</span>` : '<span class="text-slate-600">-</span>'}</td>
      <td class="p-3 text-center">
        ${r.isBoth ? `
          <span class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
            🌟 ครบ 2 งาน
          </span>
        ` : (r.isGrad || r.isChild) ? `
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
            1 งาน
          </span>
        ` : `
          <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
            ยังไม่ลง
          </span>
        `}
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= REALTIME & REFRESH =================
function startRealtimeLiveSync() {
  if (window.ComedEventManager && typeof window.ComedEventManager.subscribeRealtime === 'function') {
    window.ComedEventManager.subscribeRealtime(EVENT_CLASS_ID, () => {
      refreshUI();
    });
  }
}

function refreshUI() {
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
  updateProfileCards();
  updateStep2TrackSwitcher();
  renderStep2Departments();
  updateUserSummaryStep3();
  renderClassRosterTable();
}

// ================= EXCEL EXPORT =================
function exportClassRosterExcel() {
  if (typeof XLSX === 'undefined') {
    alert("ไม่พบโมดูลดาวน์โหลด Excel");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  const overallData = [
    ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "อีเมล", "ซุ้มพี่บัณฑิต (20 ธ.ค.)", "งานวันเด็ก (9 ม.ค. 70)", "สถานะ"]
  ];

  students.forEach((st, idx) => {
    const grad = regs.find(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const child = regs.find(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

    let status = "ยังไม่เลือกลง";
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
  const ws = XLSX.utils.aoa_to_sheet(overallData);
  XLSX.utils.book_append_sheet(wb, ws, "ทำเนียบ 60 คน");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายชื่อกิจกรรมรุ่น69_ซุ้มบัณฑิต_วันเด็ก_${today}.xlsx`);
}
