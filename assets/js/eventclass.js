/**
 * =========================================================================
 * EVENT CLASS CONTROLLER (4-Step Wizard Flow) - assets/js/eventclass.js
 * สาขาวิชาคอมพิวเตอร์ศึกษา COMED23 | รุ่นในมหาวิทยาลัย KKU63
 * Step-1: ระบุตัวตน + ตรวจสอบข้อมูลติดต่อ (เช่น เบอร์โทรศัพท์)
 * Step-2: เลือกกิจกรรม (สามารถเลือกได้ทั้ง 2 กิจกรรม หรือเลือก 1 กิจกรรม)
 * Step-3: เลือกฝ่ายในกิจกรรมที่เลือก
 * Step-4: ทำเนียบเพื่อน (สามารถแก้ไข/เปลี่ยนของตัวเองได้จนกว่าระบบจะปิด)
 * =========================================================================
 */

const EVENT_CLASS_ID = 'eventclass_69';

let currentClassEvent = null;
let activeTrackId = 'track_grad'; // 'track_grad' | 'track_children'
let currentStudent = null; // { studentId, studentName, nickname, email, phone }
let pendingTrackSelection = null; // { trackId, deptId, roleId, trackTitle, deptName, roleTitle }
let currentRosterFilter = 'all'; // 'all' | 'grad' | 'children' | 'both' | 'pending'
let currentStepNumber = 1;

// Multi-select state for Step-2
let selectedTrackIds = ['track_grad']; // array of selected track IDs, e.g. ['track_grad'], ['track_children'], or both

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 1. Load Event
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);

  // 2. Populate Dropdown list
  populateStudentPickerStep1();

  // 3. Check Session
  initUserSession();

  // 4. Initialize selectedTrackIds based on user registrations or defaults
  initSelectedTracks();

  // 5. Check system open status & update banners
  updateSystemStatusBanner();

  // 6. Initial Renderings
  renderStep2TrackCards();
  renderStep3Departments();
  updateUserSummaryStep4();
  renderClassRosterTable();

  // 7. Setup Google Login
  initGoogleAuthStep1();

  // 8. Background Cloud Sync
  try {
    await window.ComedEventManager.fetchCloudData(EVENT_CLASS_ID);
    currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
    refreshUI();
  } catch(e) {}

  startRealtimeLiveSync();

  // 9. Auto step placement
  if (currentStudent && currentStudent.studentId) {
    initSelectedTracks();
    const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
    const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');
    
    // ถ้าผู้ใช้ลงทะเบียนไว้แล้ว ให้พาไป Step 4 (ทำเนียบเพื่อนและดูบัตร) ทันที
    // ถ้ายังไม่เคยลงทะเบียน และระบบเปิด ให้ไป Step 2 (เลือกกิจกรรม)
    if (myGrad || myChild || !isSystemOpen()) {
      goToStep(4);
    } else {
      goToStep(2);
    }
  } else {
    goToStep(1);
  }
});

function isSystemOpen() {
  return currentClassEvent && currentClassEvent.status === 'open';
}

function initSelectedTracks() {
  if (!currentStudent) {
    selectedTrackIds = ['track_grad'];
    return;
  }
  const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
  const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

  selectedTrackIds = [];
  if (myGrad) selectedTrackIds.push('track_grad');
  if (myChild) selectedTrackIds.push('track_children');

  if (selectedTrackIds.length === 0) {
    selectedTrackIds = ['track_grad']; // default
  }
}

function updateSystemStatusBanner() {
  const banner = document.getElementById('systemClosedBanner');
  const lockBadge = document.getElementById('step4LockNoticeBadge');
  const btnEdit = document.getElementById('btnStep4EditMore');

  if (!isSystemOpen()) {
    if (banner) banner.classList.remove('hidden');
    if (lockBadge) {
      lockBadge.textContent = "🔒 ระบบปิดรับสมัครชั่วคราว (ไม่อนุญาตให้แก้ไข)";
      lockBadge.className = "text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold";
    }
    if (btnEdit) {
      btnEdit.classList.add('hidden');
    }
  } else {
    if (banner) banner.classList.add('hidden');
    if (lockBadge) {
      lockBadge.textContent = "✓ ระบบเปิดให้แก้ไขได้";
      lockBadge.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold";
    }
    if (btnEdit) {
      btnEdit.classList.remove('hidden');
    }
  }
}

// ================= 4-STEP WIZARD NAVIGATION =================
function goToStep(step) {
  // Guard for Step 2 & 3: Cannot enter if system is closed
  if ((step === 2 || step === 3) && !isSystemOpen()) {
    alert("⚠️ ระบบปิดรับสมัครชั่วคราวในขณะนี้ คุณสามารถดูสรุปสถานะและทำเนียบเพื่อนได้ที่ Step-4 ครับ");
    goToStep(4);
    return;
  }

  // Guard: Must identify in Step 1 first
  if (step > 1 && !currentStudent) {
    alert("กรุณาเลือกรหัส/ชื่อของคุณใน Step-1 ก่อนครับ");
    goToStep(1);
    return;
  }

  currentStepNumber = step;

  const sec1 = document.getElementById('stepSection1');
  const sec2 = document.getElementById('stepSection2');
  const sec3 = document.getElementById('stepSection3');
  const sec4 = document.getElementById('stepSection4');

  const btn1 = document.getElementById('stepBtn1');
  const btn2 = document.getElementById('stepBtn2');
  const btn3 = document.getElementById('stepBtn3');
  const btn4 = document.getElementById('stepBtn4');

  // Hide all sections
  [sec1, sec2, sec3, sec4].forEach(s => s?.classList.add('hidden'));

  const baseInactive = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 bg-slate-800/80 text-slate-400 cursor-pointer";
  const baseCompleted = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 step-completed cursor-pointer";

  [btn1, btn2, btn3, btn4].forEach(b => {
    if (b) b.className = baseInactive;
  });

  if (!isSystemOpen()) {
    if (btn2) { btn2.classList.add('step-disabled'); btn2.title = "ระบบปิดรับสมัคร"; }
    if (btn3) { btn3.classList.add('step-disabled'); btn3.title = "ระบบปิดรับสมัคร"; }
  }

  if (step === 1) {
    sec1?.classList.remove('hidden');
    if (btn1) btn1.className = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 step-active-1 cursor-pointer";
  } else if (step === 2) {
    sec2?.classList.remove('hidden');
    if (btn1) btn1.className = baseCompleted;
    if (btn2) btn2.className = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 step-active-2 cursor-pointer";
    renderStep2TrackCards();
  } else if (step === 3) {
    // If activeTrackId is not among selectedTrackIds, pick the first selected
    if (selectedTrackIds.length > 0 && !selectedTrackIds.includes(activeTrackId)) {
      activeTrackId = selectedTrackIds[0];
    }
    sec3?.classList.remove('hidden');
    if (btn1) btn1.className = baseCompleted;
    if (btn2) btn2.className = baseCompleted;
    if (btn3) btn3.className = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 step-active-3 cursor-pointer";
    renderStep3Departments();
  } else if (step === 4) {
    sec4?.classList.remove('hidden');
    if (btn1 && currentStudent) btn1.className = baseCompleted;
    if (btn2 && currentStudent) btn2.className = baseCompleted;
    if (btn3 && currentStudent) btn3.className = baseCompleted;
    if (btn4) btn4.className = "step-nav-btn py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 step-active-4 cursor-pointer";
    updateUserSummaryStep4();
    renderClassRosterTable();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= STEP 1: ระบุตัวตน + ตรวจสอบเบอร์โทร =================
function populateStudentPickerStep1() {
  const sel = document.getElementById('step1StudentSelect');
  if (!sel) return;
  const list = window.STUDENTS_DATA || [];
  sel.innerHTML = '<option value="">-- แตะเพื่อเลือกรหัส/ชื่อของคุณ (COMED23) --</option>' + list.map(st => `
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

        let detectedPhone = user.phone || '';
        if (!detectedPhone && st) {
          const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
          const found = regs.find(r => r.studentId === st.id && (r.phone || (r.note && r.note.includes('TEL:'))));
          if (found) {
            detectedPhone = found.phone || (found.note ? (found.note.match(/\[TEL:(.*?)\]/) || [])[1] : '');
          }
        }

        currentStudent = {
          studentId: user.studentId || (st ? st.id : ''),
          studentName: user.studentName || user.name || (st ? st.name : 'นักศึกษา'),
          nickname: user.nickname || (st ? st.nickname : ''),
          email: user.email || (st ? st.email : ''),
          phone: detectedPhone
        };
        updateProfileCardsStep1();
      }
    }
  } catch(e) {}
}

function handleStep1StudentChange(studentId) {
  if (!studentId) return;
  const student = (window.STUDENTS_DATA || []).find(s => s.id === studentId);
  if (!student) return;

  let detectedPhone = '';
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const found = regs.find(r => r.studentId === student.id && (r.phone || (r.note && r.note.includes('TEL:'))));
  if (found) {
    detectedPhone = found.phone || (found.note ? (found.note.match(/\[TEL:(.*?)\]/) || [])[1] : '');
  }

  currentStudent = {
    studentId: student.id,
    studentName: student.name,
    nickname: student.nickname || '',
    email: student.email,
    phone: detectedPhone || ''
  };

  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
  initSelectedTracks();
  updateProfileCardsStep1();
}

function saveUserPhone() {
  if (!currentStudent) {
    alert("กรุณาเลือกรายชื่อนักศึกษาก่อนบันทึกเบอร์");
    return;
  }
  const input = document.getElementById('step1PhoneInput');
  const val = (input?.value || '').trim();

  if (val && !/^[0-9\-+ ]{9,12}$/.test(val)) {
    alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)");
    return;
  }

  currentStudent.phone = val;
  localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
  updateProfileCardsStep1();
  alert(val ? "✅ บันทึกเบอร์โทรศัพท์เรียบร้อยแล้ว" : "บันทึกข้อมูลเรียบร้อย");
}

function updateProfileCardsStep1() {
  const card = document.getElementById('step1ProfileCard');
  const confirmedName = document.getElementById('step1ConfirmedName');
  const confirmedId = document.getElementById('step1ConfirmedId');
  const headerName = document.getElementById('headerUserName');
  const headerBadge = document.getElementById('headerUserBadge');
  const step2UserName = document.getElementById('step2UserName');
  const step4UserName = document.getElementById('step4UserName');
  const sel = document.getElementById('step1StudentSelect');
  const phoneInput = document.getElementById('step1PhoneInput');
  const alertBox = document.getElementById('phoneCheckAlertBox');
  const phoneBadge = document.getElementById('phoneStatusBadge');

  if (currentStudent) {
    if (card) card.classList.remove('hidden');
    if (confirmedName) confirmedName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
    if (confirmedId) confirmedId.textContent = `รหัส: ${currentStudent.studentId}`;
    if (headerName) headerName.textContent = `${currentStudent.nickname || currentStudent.studentName.split(' ')[0]} (COMED23)`;
    if (headerBadge) headerBadge.classList.remove('hidden');
    if (step2UserName) step2UserName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'}) | ${currentStudent.studentId}`;
    if (step4UserName) step4UserName.textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'}) | รหัส ${currentStudent.studentId}`;
    if (sel && currentStudent.studentId) sel.value = currentStudent.studentId;
    if (phoneInput) phoneInput.value = currentStudent.phone || '';

    // Verify if phone is missing
    if (!currentStudent.phone) {
      if (alertBox) {
        alertBox.className = "p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs space-y-1";
        alertBox.innerHTML = `
          <div class="flex items-center gap-2 text-amber-400 font-bold">
            <i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0"></i>
            <span>ยังไม่ได้บันทึก: เบอร์โทรศัพท์</span>
          </div>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            ระบบตรวจพบว่าคุณยังไม่มีเบอร์โทรในฐานข้อมูล กรุณากรอกเบอร์โทรศัพท์ในช่องด้านล่างเพื่อความสะดวกในการประสานงานซุ้ม
          </p>
        `;
      }
      if (phoneBadge) {
        phoneBadge.textContent = "ยังไม่ได้ระบุ (แนะนำให้กรอก)";
        phoneBadge.className = "text-[10px] font-bold text-amber-400";
      }
    } else {
      if (alertBox) {
        alertBox.className = "p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-xs space-y-1";
        alertBox.innerHTML = `
          <div class="flex items-center gap-2 text-emerald-400 font-bold">
            <i data-lucide="check-circle" class="w-4 h-4 flex-shrink-0"></i>
            <span>ข้อมูลครบถ้วน: มีเบอร์ติดต่อแล้ว (${currentStudent.phone})</span>
          </div>
        `;
      }
      if (phoneBadge) {
        phoneBadge.textContent = "✓ บันทึกเรียบร้อย";
        phoneBadge.className = "text-[10px] font-bold text-emerald-400";
      }
    }
  } else {
    if (card) card.classList.add('hidden');
    if (headerBadge) headerBadge.classList.add('hidden');
    if (sel) sel.value = '';
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
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

  const phoneVal = (document.getElementById('step1PhoneInput')?.value || '').trim();
  if (phoneVal) {
    currentStudent.phone = phoneVal;
    localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
  }

  if (!isSystemOpen()) {
    goToStep(4);
  } else {
    goToStep(2);
  }
}

function handleUserLogout() {
  if (confirm("ต้องการเปลี่ยนชื่อนักศึกษาหรือไม่?")) {
    currentStudent = null;
    localStorage.removeItem('COMED_USER_SESSION');
    updateProfileCardsStep1();
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
      alert("กรุณาใช้อีเมล @kkumail.com");
      return;
    }

    const student = (window.STUDENTS_DATA || []).find(s => s.email.toLowerCase() === email);
    currentStudent = {
      studentId: student ? student.id : (isSpecialTester ? 'ADMIN-TESTER' : email.split('@')[0]),
      studentName: student ? student.name : (isSpecialTester ? 'ภูผา (ทดสอบระบบ)' : payload.name),
      nickname: student ? student.nickname : (isSpecialTester ? 'ภูผา' : ''),
      email: email,
      phone: ''
    };

    localStorage.setItem('COMED_USER_SESSION', JSON.stringify(currentStudent));
    initSelectedTracks();
    updateProfileCardsStep1();

    if (isSystemOpen()) {
      goToStep(2);
    } else {
      goToStep(4);
    }
  } catch(e) {}
}

// ================= STEP 2: เลือกกิจกรรม (สามารถเลือก 2 กิจกรรมได้เลย) =================
function toggleTrackSelection(trackId) {
  const index = selectedTrackIds.indexOf(trackId);
  if (index > -1) {
    selectedTrackIds.splice(index, 1);
  } else {
    selectedTrackIds.push(trackId);
  }
  renderStep2TrackCards();
}

function renderStep2TrackCards() {
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const gradRegs = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_')));
  const childRegs = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_')));

  document.getElementById('step2GradEnrolledCount').textContent = `${gradRegs.length} / 30+ คน`;
  document.getElementById('step2ChildEnrolledCount').textContent = `${childRegs.length} / 30+ คน`;

  const cardGrad = document.getElementById('cardTrackSelectGrad');
  const cardChild = document.getElementById('cardTrackSelectChild');
  const checkGrad = document.getElementById('checkIndicatorGrad');
  const checkChild = document.getElementById('checkIndicatorChild');
  const badgeGrad = document.getElementById('step2GradSelectionBadge');
  const badgeChild = document.getElementById('step2ChildSelectionBadge');

  const isGradSelected = selectedTrackIds.includes('track_grad');
  const isChildSelected = selectedTrackIds.includes('track_children');

  // Grad Card UI
  if (cardGrad) {
    if (isGradSelected) {
      cardGrad.className = "p-5 rounded-2xl border transition cursor-pointer relative space-y-3 shadow-lg group bg-grad-theme-selected";
      if (checkGrad) checkGrad.className = "w-6 h-6 rounded-lg border-2 border-amber-400 bg-amber-500 text-slate-950 flex items-center justify-center font-black transition flex-shrink-0 shadow-sm";
      checkGrad?.querySelector('svg, i')?.classList.remove('hidden');
      if (badgeGrad) badgeGrad.innerHTML = `<span class="text-amber-300 font-black">✓ เลือกเข้าร่วมงานนี้</span>`;
    } else {
      cardGrad.className = "p-5 rounded-2xl border transition cursor-pointer relative space-y-3 shadow-lg group bg-grad-theme-unselected";
      if (checkGrad) checkGrad.className = "w-6 h-6 rounded-lg border-2 border-amber-500/40 bg-slate-950 flex items-center justify-center text-white transition flex-shrink-0";
      checkGrad?.querySelector('svg, i')?.classList.add('hidden');
      if (badgeGrad) badgeGrad.innerHTML = `<span class="text-amber-400/80">แตะเพื่อเลือก</span>`;
    }
  }

  // Child Card UI
  if (cardChild) {
    if (isChildSelected) {
      cardChild.className = "p-5 rounded-2xl border transition cursor-pointer relative space-y-3 shadow-lg group bg-child-theme-selected";
      if (checkChild) checkChild.className = "w-6 h-6 rounded-lg border-2 border-sky-400 bg-sky-500 text-slate-950 flex items-center justify-center font-black transition flex-shrink-0 shadow-sm";
      checkChild?.querySelector('svg, i')?.classList.remove('hidden');
      if (badgeChild) badgeChild.innerHTML = `<span class="text-sky-300 font-black">✓ เลือกเข้าร่วมงานนี้</span>`;
    } else {
      cardChild.className = "p-5 rounded-2xl border transition cursor-pointer relative space-y-3 shadow-lg group bg-child-theme-unselected";
      if (checkChild) checkChild.className = "w-6 h-6 rounded-lg border-2 border-sky-500/40 bg-slate-950 flex items-center justify-center text-white transition flex-shrink-0";
      checkChild?.querySelector('svg, i')?.classList.add('hidden');
      if (badgeChild) badgeChild.innerHTML = `<span class="text-sky-400/80">แตะเพื่อเลือก</span>`;
    }
  }

  // Check user registration status
  if (currentStudent) {
    const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
    const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

    const gradPill = document.getElementById('step2GradMyStatusPill');
    const childPill = document.getElementById('step2ChildMyStatusPill');

    if (gradPill) {
      gradPill.textContent = myGrad ? `ลงตำแหน่งแล้ว: ${myGrad.roleTitle}` : 'ยังไม่เคยลงตำแหน่ง';
      gradPill.className = myGrad ? "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    }

    if (childPill) {
      childPill.textContent = myChild ? `ลงตำแหน่งแล้ว: ${myChild.roleTitle}` : 'ยังไม่เคยลงตำแหน่ง';
      childPill.className = myChild ? "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    }
  }

  // Summary Text & Button
  const summaryText = document.getElementById('step2SummaryText');
  const btnText = document.getElementById('btnConfirmStep2Text');
  const btnConfirm = document.getElementById('btnConfirmStep2');

  const count = selectedTrackIds.length;
  if (count === 2) {
    if (summaryText) summaryText.innerHTML = `<span class="text-purple-400 font-black">🌟 เลือกครบ 2 กิจกรรม</span> (ซุ้มพี่บัณฑิต + งานวันเด็ก)`;
    if (btnText) btnText.textContent = "ยืนยัน 2 กิจกรรม (ไปเลือกฝ่ายใน Step-3)";
    if (btnConfirm) btnConfirm.className = "px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer";
  } else if (count === 1) {
    const singleName = selectedTrackIds[0] === 'track_grad' ? 'ซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
    if (summaryText) summaryText.innerHTML = `<span class="text-amber-400 font-bold">เลือก 1 กิจกรรม:</span> ${singleName}`;
    if (btnText) btnText.textContent = "ยืนยัน 1 กิจกรรม หรือไม่? (ไปเลือกฝ่ายใน Step-3)";
    if (btnConfirm) btnConfirm.className = "px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer";
  } else {
    if (summaryText) summaryText.innerHTML = `<span class="text-rose-400 font-bold">ยังไม่ได้เลือกกิจกรรม</span> (กรุณาแตะเลือกอย่างน้อย 1 กิจกรรม)`;
    if (btnText) btnText.textContent = "กรุณาแตะเลือกกิจกรรมด้านบน";
    if (btnConfirm) btnConfirm.className = "px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-not-allowed";
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function confirmStep2Selection() {
  if (!isSystemOpen()) {
    alert("ระบบปิดรับสมัครชั่วคราว");
    goToStep(4);
    return;
  }

  const count = selectedTrackIds.length;
  if (count === 0) {
    alert("กรุณาแตะเลือกกิจกรรมที่คุณต้องการเข้าร่วมอย่างน้อย 1 กิจกรรมครับ (สามารถเลือก 2 กิจกรรมได้เลย)");
    return;
  }

  if (count === 1) {
    const singleName = selectedTrackIds[0] === 'track_grad' ? 'ซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
    const otherName = selectedTrackIds[0] === 'track_grad' ? 'งานวันเด็กแห่งชาติ' : 'ซุ้มพี่บัณฑิต';
    const agree = confirm(`คุณเลือกเข้าร่วม 1 กิจกรรม: "${singleName}"\n\n(คุณสามารถเลือกทั้ง 2 กิจกรรมได้ หากต้องการเข้าร่วม ${otherName} ด้วย สามารถกดยกเลิกแล้วติ๊กเพิ่มได้ครับ)\n\nต้องการ "ยืนยัน 1 กิจกรรม หรือไม่" เพื่อไปเลือกฝ่าย?`);
    if (!agree) return;
  }

  // Set default activeTrackId for Step-3
  activeTrackId = selectedTrackIds[0];
  goToStep(3);
}

// ================= STEP 3: เลือกฝ่าย & ตำแหน่ง =================
function switchStep3Track(trackId) {
  activeTrackId = trackId;
  renderStep3Departments();
}

function renderStep3Departments() {
  const btnGrad = document.getElementById('step3BtnGrad');
  const btnChild = document.getElementById('step3BtnChild');
  const bannerTitle = document.getElementById('step3BannerTitle');
  const bannerDesc = document.getElementById('step3BannerDesc');
  const bannerStatusBadge = document.getElementById('step3CurrentTrackStatusBadge');
  const container = document.getElementById('step3DepartmentsContainer');

  // Update button visibility & selection state
  if (btnGrad) {
    const isGradInSelection = selectedTrackIds.includes('track_grad');
    btnGrad.style.display = isGradInSelection ? 'inline-flex' : 'none';
  }
  if (btnChild) {
    const isChildInSelection = selectedTrackIds.includes('track_children');
    btnChild.style.display = isChildInSelection ? 'inline-flex' : 'none';
  }

  const isGrad = (activeTrackId === 'track_grad');
  const headerCard = document.getElementById('step3HeaderCard');
  const bannerBox = document.getElementById('step3TrackBanner');

  if (isGrad) {
    if (btnGrad) btnGrad.className = "px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 bg-amber-500 text-slate-950 font-black cursor-pointer shadow-md";
    if (btnChild) btnChild.className = "px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 text-slate-400 hover:text-white font-bold cursor-pointer";
    if (bannerTitle) bannerTitle.textContent = "กำลังดูฝ่าย: ทำซุ้มพี่บัณฑิต (ช่วง 20 ธ.ค. 2 วัน)";
    if (bannerDesc) bannerDesc.textContent = "โรงรถ 1 ล็อค คณะศึกษาศาสตร์ เน้นจัดฉากถ่ายรูปสวยงามและต้อนรับพี่บัณฑิต";
    if (headerCard) {
      headerCard.style.background = "radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 50%), #0f172a";
      headerCard.style.borderColor = "rgba(245, 158, 11, 0.35)";
    }
    if (bannerBox) {
      bannerBox.style.background = "linear-gradient(135deg, rgba(120, 53, 15, 0.25), rgba(15, 23, 42, 0.95))";
      bannerBox.style.borderColor = "rgba(245, 158, 11, 0.3)";
    }
  } else {
    if (btnChild) btnChild.className = "px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 bg-sky-500 text-slate-950 font-black cursor-pointer shadow-md";
    if (btnGrad) btnGrad.className = "px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 text-slate-400 hover:text-white font-bold cursor-pointer";
    if (bannerTitle) bannerTitle.textContent = "กำลังดูฝ่าย: งานวันเด็กแห่งชาติ (ช่วง 9 ม.ค. 2570)";
    if (bannerDesc) bannerDesc.textContent = "ลงทะเบียนซุ้ม ออกแบบกิจกรรม Bingo, หุ่นยนต์, ระบายสี AR 3D และแจกของขวัญ";
    if (headerCard) {
      headerCard.style.background = "radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 50%), #0f172a";
      headerCard.style.borderColor = "rgba(14, 165, 233, 0.35)";
    }
    if (bannerBox) {
      bannerBox.style.background = "linear-gradient(135deg, rgba(12, 74, 110, 0.25), rgba(15, 23, 42, 0.95))";
      bannerBox.style.borderColor = "rgba(14, 165, 233, 0.3)";
    }
  }

  // Track status badge
  if (currentStudent && bannerStatusBadge) {
    const myCurrent = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, activeTrackId);
    if (myCurrent) {
      bannerStatusBadge.textContent = `✓ ลงตำแหน่ง: ${myCurrent.roleTitle}`;
      bannerStatusBadge.className = "text-[10px] px-2.5 py-1 rounded-lg font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    } else {
      bannerStatusBadge.textContent = "ยังไม่ได้เลือกฝ่ายในงานนี้";
      bannerStatusBadge.className = isGrad ? "text-[10px] px-2.5 py-1 rounded-lg font-bold bg-amber-950/40 text-amber-300/80 border border-amber-800/40" : "text-[10px] px-2.5 py-1 rounded-lg font-bold bg-sky-950/40 text-sky-300/80 border border-sky-800/40";
    }
  }

  if (!container || !currentClassEvent) return;
  const track = currentClassEvent.tracks?.find(t => t.id === activeTrackId);
  if (!track || !track.departments) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500">ไม่พบข้อมูลฝ่าย</div>`;
    return;
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const myTrackReg = currentStudent ? window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, activeTrackId) : null;

  const deptCardBg = isGrad 
    ? "background: linear-gradient(145deg, rgba(120, 53, 15, 0.08), rgba(15, 23, 42, 0.95)); border-color: rgba(245, 158, 11, 0.25);"
    : "background: linear-gradient(145deg, rgba(12, 74, 110, 0.08), rgba(15, 23, 42, 0.95)); border-color: rgba(14, 165, 233, 0.25);";

  const deptIconBg = isGrad ? "bg-amber-500/20 text-amber-400" : "bg-sky-500/20 text-sky-400";
  const deptCountBadge = isGrad ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20";
  const roleSelectBtnClass = isGrad ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-sky-600 hover:bg-sky-500 text-white";

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
      } else if (isFull) {
        actionBtn = `
          <button onclick="alert('⚠️ ขออภัยครับ ตำแหน่ง ${role.title} เต็มจำนวนแล้ว (${roleRegs.length}/${role.maxSeats} คน)')"
            class="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold border border-slate-700/80 transition flex items-center gap-1 cursor-not-allowed flex-shrink-0 shadow-sm opacity-85">
            <i data-lucide="lock" class="w-3.5 h-3.5 text-rose-400"></i>
            <span>เต็มแล้ว (${roleRegs.length}/${role.maxSeats})</span>
          </button>
        `;
      } else {
        actionBtn = `
          <button onclick="openSelectRoleModal('${activeTrackId}', '${track.title}', '${dept.id}', '${dept.name}', '${role.id}', '${role.title}')"
            class="px-3.5 py-1.5 rounded-xl ${roleSelectBtnClass} text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-sm">
            <span>เลือกตำแหน่งนี้</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        `;
      }

      const memberPills = roleRegs.map(r => `
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-800">
          ${r.nickname || r.studentName.split(' ')[0]}
        </span>
      `).join(' ');

      return `
        <div class="p-3 rounded-xl bg-slate-950 border ${isMyRole ? 'border-emerald-500/50 bg-emerald-950/15' : 'border-slate-800/80'} space-y-2">
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

          <div class="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-500 text-[10px]">เพื่อนที่ลง (${roleRegs.length}):</span>
            ${roleRegs.length > 0 ? memberPills : '<span class="text-slate-600 italic text-[10px]">ยังไม่มี</span>'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="clean-card rounded-2xl p-4 sm:p-5 space-y-3 transition" style="${deptCardBg}">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg ${deptIconBg} flex items-center justify-center font-bold flex-shrink-0">
              <i data-lucide="${dept.icon || 'star'}" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">${dept.name}</h4>
              <p class="text-[11px] text-slate-400 leading-tight">${dept.description || ''}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold ${deptCountBadge} px-2 py-0.5 rounded border">
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

// ================= MODAL & CONFIRM ROLE REGISTRATION =================
function openSelectRoleModal(trackId, trackTitle, deptId, deptName, roleId, roleTitle) {
  if (!isSystemOpen()) {
    alert("⚠️ ระบบปิดรับสมัครชั่วคราว ไม่สามารถเลือกตำแหน่งได้ในขณะนี้");
    goToStep(4);
    return;
  }
  if (!currentStudent) {
    alert("กรุณาระบุตัวตนก่อนครับ");
    goToStep(1);
    return;
  }

  // Pre-check Quota ก่อนเปิด Modal
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const myTrackReg = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, trackId);
  const isMyCurrentRole = myTrackReg && myTrackReg.departmentId === deptId && myTrackReg.roleId === roleId;
  const targetTrack = currentClassEvent?.tracks?.find(t => t.id === trackId);
  const targetDept = targetTrack?.departments?.find(d => d.id === deptId);
  const targetRole = targetDept?.roles?.find(r => r.id === roleId);

  if (targetRole) {
    const roleRegs = regs.filter(r => (r.trackId === trackId || !r.trackId) && r.departmentId === deptId && r.roleId === roleId);
    if (!isMyCurrentRole && roleRegs.length >= targetRole.maxSeats) {
      alert(`⚠️ ขออภัยครับ ตำแหน่ง "${roleTitle}" เต็มจำนวนแล้ว (${roleRegs.length}/${targetRole.maxSeats} คน)\nกรุณาเลือกตำแหน่งอื่นที่ยังมีที่ว่างครับ`);
      renderStep3Departments();
      return;
    }
  }

  pendingTrackSelection = { trackId, trackTitle, deptId, deptName, roleId, roleTitle };

  document.getElementById('confirmStudentName').textContent = `${currentStudent.studentName} (${currentStudent.nickname || '-'})`;
  document.getElementById('confirmStudentPhone').textContent = currentStudent.phone || '(ยังไม่ระบุเบอร์)';
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

  if (!isSystemOpen()) {
    alert("ขออภัย ระบบได้ปิดรับสมัครชั่วคราวแล้ว");
    closeConfirmRoleModal();
    goToStep(4);
    return;
  }

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

    // Check if user selected 2 tracks and still hasn't registered the other track
    const otherTrackId = pendingTrackSelection.trackId === 'track_grad' ? 'track_children' : 'track_grad';
    const otherTrackName = otherTrackId === 'track_grad' ? 'ซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
    const otherReg = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, otherTrackId);

    if (selectedTrackIds.includes(otherTrackId) && !otherReg) {
      const chooseNext = confirm(`✅ บันทึกตำแหน่ง "${pendingTrackSelection.roleTitle}" เรียบร้อยแล้ว!\n\nคุณได้เลือก "${otherTrackName}" ไว้ด้วย ต้องการสลับไปเลือกฝ่ายในงาน ${otherTrackName} เลยหรือไม่?`);
      if (chooseNext) {
        activeTrackId = otherTrackId;
        renderStep3Departments();
        return;
      }
    } else {
      alert(`✅ บันทึกตำแหน่ง "${pendingTrackSelection.roleTitle}" เรียบร้อยแล้ว!`);
      // Open ID card modal for instant preview and download
      setTimeout(() => {
        openIdCardModal(currentStudent.studentId);
      }, 400);
    }

    goToStep(4);
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
  if (!isSystemOpen()) {
    alert("⚠️ ไม่สามารถยกเลิกหรือเปลี่ยนแปลงได้เนื่องจากระบบปิดรับสมัครแล้ว");
    return;
  }
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

// ================= STEP 4: ทำเนียบเพื่อน (แก้ไขได้จนกว่าระบบจะปิด) =================
function updateUserSummaryStep4() {
  const nameEl = document.getElementById('step4UserName');
  const badgeGrad = document.getElementById('step4BadgeGrad');
  const detailGrad = document.getElementById('step4DetailGrad');
  const actionGrad = document.getElementById('step4ActionGrad');

  const badgeChild = document.getElementById('step4BadgeChild');
  const detailChild = document.getElementById('step4DetailChild');
  const actionChild = document.getElementById('step4ActionChild');

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
    if (isSystemOpen()) actionGrad?.classList.remove('hidden');
    else actionGrad?.classList.add('hidden');
  } else {
    badgeGrad.textContent = "ยังไม่ลง";
    badgeGrad.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    detailGrad.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    actionGrad?.classList.add('hidden');
  }

  if (myChild) {
    badgeChild.textContent = "ลงแล้ว ✓";
    badgeChild.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    detailChild.textContent = `${myChild.roleTitle} (${myChild.departmentName.replace(/\[.*?\]\s*/, '')})`;
    if (isSystemOpen()) actionChild?.classList.remove('hidden');
    else actionChild?.classList.add('hidden');
  } else {
    badgeChild.textContent = "ยังไม่ลง";
    badgeChild.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
    detailChild.textContent = "ยังไม่ได้เลือกฝ่ายในกิจกรรมนี้";
    actionChild?.classList.add('hidden');
  }

  // Update ID Card & Reset button visibility in Step 4
  const btnViewIdCard = document.getElementById('btnStep4ViewIdCard');
  const btnResetMy = document.getElementById('btnResetMyRegistration');
  const hasAnyReg = !!(myGrad || myChild);

  if (btnViewIdCard) {
    if (hasAnyReg) btnViewIdCard.classList.remove('hidden');
    else btnViewIdCard.classList.add('hidden');
  }

  if (btnResetMy) {
    if (hasAnyReg && isSystemOpen()) btnResetMy.classList.remove('hidden');
    else btnResetMy.classList.add('hidden');
  }
}

async function handleResetMyRegistration() {
  if (!isSystemOpen()) {
    alert("⚠️ ไม่สามารถรีเซ็ตได้เนื่องจากระบบปิดรับสมัครแล้ว");
    return;
  }
  if (!currentStudent) return;

  if (confirm(`⚠️ ยืนยันการรีเซ็ตข้อมูลการเลือกฝ่ายของคุณทั้งหมด?\n\nตำแหน่งที่คุณสังกัดอยู่จะถูกปล่อยว่างให้เพื่อนคนอื่นเลือกได้ทันที`)) {
    try {
      const myGrad = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
      const myChild = window.ComedEventManager.getStudentTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');

      if (myGrad) {
        await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_grad');
      }
      if (myChild) {
        await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, currentStudent.studentId, 'track_children');
      }

      refreshUI();
      alert("✅ รีเซ็ตการเลือกกิจกรรมของคุณเรียบร้อยแล้ว คุณสามารถเลือกใหม่ได้ทันที");
      goToStep(2);
    } catch(err) {
      alert("⚠️ เกิดข้อผิดพลาด: " + (err.message || ''));
    }
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
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-500">ไม่พบรายชื่อตามเงื่อนไขที่ค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const hasReg = r.isGrad || r.isChild;
    return `
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
      <td class="p-3 text-center">
        ${hasReg ? `
          <button onclick="openIdCardModal('${r.studentId}')"
            class="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer">
            <i data-lucide="contact" class="w-3 h-3"></i>
            <span>ดูบัตร</span>
          </button>
        ` : `
          <span class="text-slate-600 text-xs">-</span>
        `}
      </td>
    </tr>
    `;
  }).join('');

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
  initSelectedTracks();
  updateSystemStatusBanner();
  updateProfileCardsStep1();
  renderStep2TrackCards();
  renderStep3Departments();
  updateUserSummaryStep4();
  renderClassRosterTable();
}

// ================= EXPORT EXCEL (.XLSX) =================
function exportClassRosterExcel() {
  if (typeof XLSX === 'undefined') {
    alert("ไม่พบโมดูลดาวน์โหลด Excel");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  const overallData = [
    ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "อีเมล", "เบอร์โทร", "ซุ้มพี่บัณฑิต (20 ธ.ค.)", "งานวันเด็ก (9 ม.ค. 70)", "สถานะ (COMED23 KKU63)"]
  ];

  students.forEach((st, idx) => {
    const grad = regs.find(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const child = regs.find(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

    const phone = (grad && grad.phone) || (child && child.phone) || (grad && grad.note && (grad.note.match(/\[TEL:(.*?)\]/) || [])[1]) || (child && child.note && (child.note.match(/\[TEL:(.*?)\]/) || [])[1]) || "-";

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
      phone,
      grad ? `${grad.roleTitle} (${grad.departmentName})` : "-",
      child ? `${child.roleTitle} (${child.departmentName})` : "-",
      status
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(overallData);
  XLSX.utils.book_append_sheet(wb, ws, "ทำเนียบ 60 คน COMED23");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายชื่อกิจกรรมCOMED23_KKU63_ซุ้มบัณฑิต_วันเด็ก_${today}.xlsx`);
}

// ================= EVENTCLASS ID CARD / PASS BADGE =================
function openIdCardModal(targetStudentId = null) {
  const modal = document.getElementById('modalEventClassIdCard');
  if (!modal) return;

  const stId = targetStudentId || (currentStudent ? currentStudent.studentId : null);
  if (!stId) {
    alert("กรุณาระบุตัวตนก่อนดูบัตรประจำตัว");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const student = students.find(s => s.id === stId) || (currentStudent && currentStudent.studentId === stId ? currentStudent : null);
  if (!student) {
    alert("ไม่พบข้อมูลนักศึกษา");
    return;
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const gradReg = regs.find(r => r.studentId === stId && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
  const childReg = regs.find(r => r.studentId === stId && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

  // Determine phone number
  const studentPhone = (gradReg && gradReg.phone) || 
                       (childReg && childReg.phone) || 
                       (currentStudent && currentStudent.studentId === stId && currentStudent.phone) || 
                       (gradReg && gradReg.note && (gradReg.note.match(/\[TEL:(.*?)\]/) || [])[1]) || 
                       (childReg && childReg.note && (childReg.note.match(/\[TEL:(.*?)\]/) || [])[1]) || 
                       '-';

  // 1. Populate Basic Info
  const serialNo = 'ED69-' + stId.replace(/[^0-9]/g, '').slice(-4);
  document.getElementById('idCardSerialNo').textContent = `#${serialNo}`;
  document.getElementById('idCardName').textContent = student.name || '-';
  document.getElementById('idCardNickname').textContent = student.nickname ? `น้อง${student.nickname}` : '-';
  document.getElementById('idCardStudentId').textContent = student.id || '-';
  document.getElementById('idCardEmail').textContent = student.email || `${stId}@kkumail.com`;
  document.getElementById('idCardPhone').textContent = studentPhone && studentPhone !== '-' ? `📞 ${studentPhone}` : '📞 ยังไม่ระบุเบอร์โทร';

  // Avatar Initials
  const avatarText = document.getElementById('idCardAvatarText');
  if (avatarText) {
    const initial = student.nickname ? student.nickname.charAt(0) : (student.name ? student.name.charAt(0) : 'E');
    avatarText.textContent = initial;
  }

  // 2. Populate Track Roles
  const boxGrad = document.getElementById('idCardTrackGradBox');
  const gradRole = document.getElementById('idCardGradRole');
  const gradDept = document.getElementById('idCardGradDept');
  const gradStatus = document.getElementById('idCardGradStatus');

  const boxChild = document.getElementById('idCardTrackChildBox');
  const childRole = document.getElementById('idCardChildRole');
  const childDept = document.getElementById('idCardChildDept');
  const childStatus = document.getElementById('idCardChildStatus');

  const trackCountBadge = document.getElementById('idCardTrackCountBadge');

  let activeCount = 0;

  if (gradReg) {
    activeCount++;
    if (boxGrad) boxGrad.classList.remove('opacity-40');
    if (gradRole) gradRole.textContent = gradReg.roleTitle || 'สมาชิกฝ่าย';
    if (gradDept) gradDept.textContent = gradReg.departmentName || 'ฝ่ายทั่วไป';
    if (gradStatus) {
      gradStatus.textContent = 'สังกัดแล้ว ✓';
      gradStatus.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  } else {
    if (boxGrad) boxGrad.classList.add('opacity-40');
    if (gradRole) gradRole.textContent = 'ยังไม่ได้เลือกลงกิจกรรมนี้';
    if (gradDept) gradDept.textContent = 'ซุ้มพี่บัณฑิต (20 ธ.ค.)';
    if (gradStatus) {
      gradStatus.textContent = 'ไม่ได้เข้าร่วม';
      gradStatus.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-500';
    }
  }

  if (childReg) {
    activeCount++;
    if (boxChild) boxChild.classList.remove('opacity-40');
    if (childRole) childRole.textContent = childReg.roleTitle || 'สมาชิกฝ่าย';
    if (childDept) childDept.textContent = childReg.departmentName || 'ฝ่ายทั่วไป';
    if (childStatus) {
      childStatus.textContent = 'สังกัดแล้ว ✓';
      childStatus.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  } else {
    if (boxChild) boxChild.classList.add('opacity-40');
    if (childRole) childRole.textContent = 'ยังไม่ได้เลือกลงกิจกรรมนี้';
    if (childDept) childDept.textContent = 'งานวันเด็กแห่งชาติ (9 ม.ค. 70)';
    if (childStatus) {
      childStatus.textContent = 'ไม่ได้เข้าร่วม';
      childStatus.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-500';
    }
  }

  if (trackCountBadge) {
    if (activeCount >= 2) {
      trackCountBadge.textContent = '🌟 ร่วมทั้ง 2 กิจกรรม';
      trackCountBadge.className = 'text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30';
    } else if (activeCount === 1) {
      trackCountBadge.textContent = '1 กิจกรรม';
      trackCountBadge.className = 'text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30';
    } else {
      trackCountBadge.textContent = 'ยังไม่ลงกิจกรรม';
      trackCountBadge.className = 'text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold';
    }
  }

  // 3. Security Code & Dynamic QR Code
  const hashStr = `COMED23-${serialNo}-${stId.slice(-3)}`;
  const hashEl = document.getElementById('idCardSecurityHash');
  if (hashEl) hashEl.textContent = hashStr;

  // Generate QR Code URL via reliable QuickChart QR API
  const qrImg = document.getElementById('idCardQrImg');
  if (qrImg) {
    const qrData = encodeURIComponent(`https://kku.world/comed23-event?sid=${stId}&serial=${serialNo}`);
    qrImg.src = `https://quickchart.io/qr?text=${qrData}&size=140&margin=1&ecLevel=M`;
  }

  // Show Modal
  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeIdCardModal() {
  const modal = document.getElementById('modalEventClassIdCard');
  if (modal) modal.classList.add('hidden');
}

async function downloadIdCardAsPng() {
  const cardElement = document.getElementById('idCardBadgeElement');
  const btn = document.getElementById('btnDownloadIdCardPng');
  if (!cardElement) return;

  if (typeof html2canvas === 'undefined') {
    alert("⚠️ กำลังโหลดไลบรารีบันทึกรูปภาพ กรุณารอสักครู่แล้วลองอีกครั้ง");
    return;
  }

  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>กำลังสร้างภาพบัตร...</span>
    `;
  }

  try {
    const studentIdText = document.getElementById('idCardStudentId')?.textContent?.trim() || 'student';
    const nicknameText = document.getElementById('idCardNickname')?.textContent?.replace(/[^a-zA-Z0-9ก-๙]/g, '') || '';

    const canvas = await html2canvas(cardElement, {
      scale: 3, // High-resolution output for crisp retina printing
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // preserve rounded transparent corners
      logging: false
    });

    const link = document.createElement('a');
    link.download = `COMED23_Badge_${nicknameText}_${studentIdText}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof confetti !== 'undefined') {
      try { confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } }); } catch(e) {}
    }
  } catch (err) {
    console.error("Error generating ID card image:", err);
    alert("⚠️ เกิดข้อผิดพลาดในการบันทึกรูปภาพ: " + (err.message || ''));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}
