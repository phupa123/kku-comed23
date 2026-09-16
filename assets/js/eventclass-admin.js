/**
 * =========================================================================
 * EVENT CLASS ADMIN CONTROLLER - assets/js/eventclass-admin.js
 * จัดการ 2 กิจกรรมใหญ่: ซุ้มพี่บัณฑิต และ งานวันเด็กแห่งชาติ (eventclass_69)
 * =========================================================================
 */

const EVENT_CLASS_ID = 'eventclass_69';

let currentClassEvent = null;
let activeAdminTrackId = 'track_grad'; // 'track_grad' | 'track_children'
let currentAdminRosterFilter = 'all'; // 'all' | 'grad' | 'children' | 'both' | 'pending'

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);

  renderHeaderAndStats();
  renderDeptsGrid();
  renderAdminRosterTable();
  populateAssignStudentPicker();

  // Cloud Sync
  try {
    await window.ComedEventManager.fetchCloudData(EVENT_CLASS_ID);
    currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
    refreshAdminUI();
  } catch(e) {}

  // Realtime
  if (window.ComedEventManager && typeof window.ComedEventManager.subscribeRealtime === 'function') {
    window.ComedEventManager.subscribeRealtime(EVENT_CLASS_ID, () => {
      refreshAdminUI();
    });
  }
});

function refreshAdminUI() {
  currentClassEvent = window.ComedEventManager.getActiveEvent(EVENT_CLASS_ID);
  renderHeaderAndStats();
  renderDeptsGrid();
  renderAdminRosterTable();
}

function renderHeaderAndStats() {
  if (!currentClassEvent) return;

  const pill = document.getElementById('classAdminStatusPill');
  const btnText = document.getElementById('btnToggleClassStatusText');

  if (currentClassEvent.status === 'open') {
    if (pill) {
      pill.textContent = "ONLINE";
      pill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
    if (btnText) btnText.textContent = "เปิดรับสมัครอยู่ (คลิกเพื่อปิด)";
  } else {
    if (pill) {
      pill.textContent = "CLOSED";
      pill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30";
    }
    if (btnText) btnText.textContent = "ปิดรับสมัครชั่วคราว (คลิกเพื่อเปิด)";
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
  const students = window.STUDENTS_DATA || [];

  const gradCount = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))).length;
  const childCount = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))).length;

  const bothCount = students.filter(st => {
    const hasG = regs.some(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const hasC = regs.some(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));
    return hasG && hasC;
  }).length;

  const pendingCount = students.filter(st => !regs.some(r => r.studentId === st.id)).length;

  document.getElementById('statGradCount').textContent = gradCount;
  document.getElementById('statChildCount').textContent = childCount;
  document.getElementById('statBothCount').textContent = bothCount;
  document.getElementById('statPendingCount').textContent = pendingCount;
}

function switchAdminTrack(trackId) {
  activeAdminTrackId = trackId;
  const btnGrad = document.getElementById('adminBtnGradTrack');
  const btnChild = document.getElementById('adminBtnChildTrack');

  if (trackId === 'track_grad') {
    btnGrad.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-500 text-slate-950 shadow-sm cursor-pointer flex items-center gap-1.5";
    btnChild.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5";
  } else {
    btnChild.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-sky-500 text-slate-950 shadow-sm cursor-pointer flex items-center gap-1.5";
    btnGrad.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5";
  }

  renderDeptsGrid();
}

function renderDeptsGrid() {
  const container = document.getElementById('adminDeptsGrid');
  if (!container || !currentClassEvent) return;

  const track = currentClassEvent.tracks?.find(t => t.id === activeAdminTrackId);
  if (!track || !track.departments) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500">ไม่พบฝ่าย</div>`;
    return;
  }

  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  container.innerHTML = track.departments.map(dept => {
    const deptRegs = regs.filter(r => (r.trackId === activeAdminTrackId || !r.trackId) && r.departmentId === dept.id);

    const rolesHtml = dept.roles.map(role => {
      const roleRegs = deptRegs.filter(r => r.roleId === role.id);
      const isOver = roleRegs.length > role.maxSeats;
      const isFull = roleRegs.length === role.maxSeats;

      const memberNames = roleRegs.map(r => `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200">
          <span>${r.nickname || r.studentName.split(' ')[0]}</span>
          <button onclick="adminRemoveMember('${r.studentId}', '${activeAdminTrackId}')" class="text-rose-400 hover:text-rose-300 font-bold ml-1 text-xs" title="ปลดออกจากตำแหน่ง">×</button>
        </span>
      `).join(' ');

      return `
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-white">${role.title}</span>
            <span class="font-mono font-bold ${isOver ? 'text-purple-400' : (isFull ? 'text-amber-400' : 'text-emerald-400')}">
              ${roleRegs.length}/${role.maxSeats} คน ${isOver ? '(ขยายรับเพิ่ม)' : ''}
            </span>
          </div>
          <div class="pt-1 flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-500 text-[10px]">สมาชิก:</span>
            ${roleRegs.length > 0 ? memberNames : '<span class="text-slate-600 text-[10px] italic">ยังไม่มี</span>'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <i data-lucide="${dept.icon || 'star'}" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">${dept.name}</h4>
              <p class="text-[11px] text-slate-400">${dept.description || ''}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
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

function setRosterFilter(filter) {
  currentAdminRosterFilter = filter;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-purple-600', 'text-white');
    btn.classList.add('text-slate-400');
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active', 'bg-purple-600', 'text-white');
    window.event.currentTarget.classList.remove('text-slate-400');
  }
  renderAdminRosterTable();
}

function renderAdminRosterTable() {
  const tbody = document.getElementById('adminRosterTbody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('adminRosterSearch')?.value || '').trim().toLowerCase();
  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

  let rows = students.map((st, idx) => {
    const grad = regs.find(r => r.studentId === st.id && (r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_'))));
    const child = regs.find(r => r.studentId === st.id && (r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_'))));

    const isGrad = !!grad;
    const isChild = !!child;
    const isBoth = isGrad && isChild;
    const isPending = !isGrad && !isChild;

    return {
      index: idx + 1,
      studentId: st.id,
      name: st.name,
      nickname: st.nickname || '-',
      gradRole: grad ? `${grad.roleTitle} (${grad.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      childRole: child ? `${child.roleTitle} (${child.departmentName.replace(/\[.*?\]\s*/, '')})` : null,
      isGrad,
      isChild,
      isBoth,
      isPending
    };
  });

  if (currentAdminRosterFilter === 'grad') rows = rows.filter(r => r.isGrad);
  else if (currentAdminRosterFilter === 'children') rows = rows.filter(r => r.isChild);
  else if (currentAdminRosterFilter === 'both') rows = rows.filter(r => r.isBoth);
  else if (currentAdminRosterFilter === 'pending') rows = rows.filter(r => r.isPending);

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
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">ไม่พบรายชื่อที่ตรงตามเงื่อนไข</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr class="hover:bg-slate-900/60 transition">
      <td class="p-3.5 text-slate-500 font-mono">${r.index}</td>
      <td class="p-3.5 font-mono text-slate-300 font-bold">${r.studentId}</td>
      <td class="p-3.5 text-white font-bold">${r.name}</td>
      <td class="p-3.5 text-orange-400 font-bold">${r.nickname}</td>
      <td class="p-3.5">
        ${r.gradRole ? `
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px]">${r.gradRole}</span>
            <button onclick="adminRemoveMember('${r.studentId}', 'track_grad')" class="p-1 text-rose-400 hover:text-rose-300 font-bold text-xs" title="ปลดออกจากซุ้มบัณฑิต">✕</button>
          </div>
        ` : '<span class="text-slate-600">-</span>'}
      </td>
      <td class="p-3.5">
        ${r.childRole ? `
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold text-[11px]">${r.childRole}</span>
            <button onclick="adminRemoveMember('${r.studentId}', 'track_children')" class="p-1 text-rose-400 hover:text-rose-300 font-bold text-xs" title="ปลดออกจากงานวันเด็ก">✕</button>
          </div>
        ` : '<span class="text-slate-600">-</span>'}
      </td>
      <td class="p-3.5 text-center">
        <button onclick="quickAssignToStudent('${r.studentId}')" class="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-[11px] font-bold transition">
          + จัดสรร
        </button>
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function adminRemoveMember(studentId, trackId) {
  const trackName = trackId === 'track_grad' ? 'ซุ้มพี่บัณฑิต' : 'งานวันเด็กแห่งชาติ';
  if (!confirm(`ยืนยันการปลดนักศึกษารหัส ${studentId} ออกจาก "${trackName}" ใช่หรือไม่?`)) return;

  try {
    await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, studentId, trackId);
    refreshAdminUI();
    alert(`✅ ปลดออกจาก ${trackName} เรียบร้อยแล้ว`);
  } catch(err) {
    alert("⚠️ เกิดข้อผิดพลาด: " + (err.message || ""));
  }
}

async function toggleClassEventStatus() {
  if (!currentClassEvent) return;
  const newStatus = currentClassEvent.status === 'open' ? 'closed' : 'open';
  const actionText = newStatus === 'open' ? 'เปิดรับสมัคร' : 'ปิดรับสมัครชั่วคราว';

  if (!confirm(`ต้องการเปลี่ยนสถานะกิจกรรมเป็น "${actionText}" ใช่หรือไม่?`)) return;

  currentClassEvent.status = newStatus;
  window.ComedEventManager.saveEvent(currentClassEvent);
  refreshAdminUI();
  alert(`✅ อัปเดตสถานะเป็น "${actionText}" เรียบร้อยแล้ว`);
}

// ================= ASSIGN MODAL =================
function populateAssignStudentPicker() {
  const sel = document.getElementById('assignStudentSelect');
  if (!sel) return;
  const list = window.STUDENTS_DATA || [];
  sel.innerHTML = '<option value="">-- เลือกนักศึกษา --</option>' + list.map(st => `
    <option value="${st.id}">${st.id} - ${st.name} (${st.nickname || 'ไม่มีชื่อเล่น'})</option>
  `).join('');
  updateAssignDeptOptions();
}

function updateAssignDeptOptions() {
  const trackId = document.getElementById('assignTrackSelect')?.value || 'track_grad';
  const deptSel = document.getElementById('assignDeptSelect');
  if (!deptSel || !currentClassEvent) return;

  const track = currentClassEvent.tracks?.find(t => t.id === trackId);
  if (!track || !track.departments) {
    deptSel.innerHTML = '<option value="">-- ไม่พบฝ่าย --</option>';
    return;
  }

  deptSel.innerHTML = '<option value="">-- เลือกฝ่าย --</option>' + track.departments.map(d => `
    <option value="${d.id}">${d.name}</option>
  `).join('');

  updateAssignRoleOptions();
}

function updateAssignRoleOptions() {
  const trackId = document.getElementById('assignTrackSelect')?.value || 'track_grad';
  const deptId = document.getElementById('assignDeptSelect')?.value;
  const roleSel = document.getElementById('assignRoleSelect');
  if (!roleSel || !currentClassEvent) return;

  const track = currentClassEvent.tracks?.find(t => t.id === trackId);
  const dept = track?.departments?.find(d => d.id === deptId);

  if (!dept || !dept.roles) {
    roleSel.innerHTML = '<option value="">-- กรุณาเลือกฝ่ายก่อน --</option>';
    return;
  }

  roleSel.innerHTML = '<option value="">-- เลือกตำแหน่ง --</option>' + dept.roles.map(r => `
    <option value="${r.id}">${r.title} (โควตา ${r.maxSeats} คน)</option>
  `).join('');
}

function openAssignModal() {
  const modal = document.getElementById('modalAssignRole');
  if (modal) modal.classList.remove('hidden');
}

function closeAssignModal() {
  const modal = document.getElementById('modalAssignRole');
  if (modal) modal.classList.add('hidden');
}

function quickAssignToStudent(studentId) {
  openAssignModal();
  const sel = document.getElementById('assignStudentSelect');
  if (sel) sel.value = studentId;
}

async function submitAssignRole() {
  const studentId = document.getElementById('assignStudentSelect')?.value;
  const trackId = document.getElementById('assignTrackSelect')?.value;
  const deptId = document.getElementById('assignDeptSelect')?.value;
  const roleId = document.getElementById('assignRoleSelect')?.value;

  if (!studentId || !trackId || !deptId || !roleId) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
    return;
  }

  const student = (window.STUDENTS_DATA || []).find(s => s.id === studentId);
  if (!student) return;

  try {
    await window.ComedEventManager.registerTrackRole(
      EVENT_CLASS_ID,
      {
        studentId: student.id,
        studentName: student.name,
        nickname: student.nickname || '',
        email: student.email,
        note: 'แอดมินจัดสรรตำแหน่งให้โดยตรง'
      },
      trackId,
      deptId,
      roleId
    );

    closeAssignModal();
    refreshAdminUI();
    alert(`✅ กำหนดตำแหน่งให้นักศึกษา ${student.name} เรียบร้อยแล้ว`);
  } catch(err) {
    alert("⚠️ " + (err.message || "ไม่สามารถกำหนดตำแหน่งได้"));
  }
}

// ================= EXPORT EXCEL (.XLSX) =================
function exportClassRosterExcel() {
  if (typeof XLSX === 'undefined') {
    alert("ไม่พบไลบรารีส่งออก Excel");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);

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

  // Grad
  const gradData = [["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "ฝ่าย", "ตำแหน่ง", "หมายเหตุ"]];
  const gradRegs = regs.filter(r => r.trackId === 'track_grad' || (r.departmentId && r.departmentId.startsWith('dept_grad_')));
  gradRegs.forEach((r, idx) => {
    gradData.push([idx + 1, r.studentId, r.studentName, r.nickname || '', r.departmentName, r.roleTitle, r.note || '']);
  });
  const wsGrad = XLSX.utils.aoa_to_sheet(gradData);
  XLSX.utils.book_append_sheet(wb, wsGrad, "ซุ้มพี่บัณฑิต");

  // Children
  const childData = [["ลำดับ", "รหัสนักศึกษา", "ชื่อ-สกุล", "ชื่อเล่น", "ฝ่าย", "ตำแหน่ง", "หมายเหตุ"]];
  const childRegs = regs.filter(r => r.trackId === 'track_children' || (r.departmentId && r.departmentId.startsWith('dept_child_')));
  childRegs.forEach((r, idx) => {
    childData.push([idx + 1, r.studentId, r.studentName, r.nickname || '', r.departmentName, r.roleTitle, r.note || '']);
  });
  const wsChild = XLSX.utils.aoa_to_sheet(childData);
  XLSX.utils.book_append_sheet(wb, wsChild, "งานวันเด็ก");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `รายชื่อกิจกรรม_COMED23_KKU63_ซุ้มบัณฑิต_วันเด็ก_${today}.xlsx`);
}

// =========================================================================
// 🤖 BOT SIMULATION & STRESS TEST ENGINE (จำลองเหตุการณ์แย่งฝ่ายเสมือนจริง)
// =========================================================================

let isSimulationRunning = false;
let simAbortController = false;

function getLoggedAdminInfo() {
  const adminEmail = (sessionStorage.getItem('COMED_KKU69_ADMIN_LOGGED_USER') || '').toLowerCase().trim();
  let adminStudent = null;
  if (window.STUDENTS_DATA && adminEmail) {
    adminStudent = window.STUDENTS_DATA.find(s => s.email.toLowerCase() === adminEmail);
  }
  return {
    email: adminEmail || 'admin@comed.kku',
    studentId: adminStudent ? adminStudent.id : null,
    name: adminStudent ? adminStudent.name : 'คุณ (ผู้ดูแลระบบ)'
  };
}

function openSimModal() {
  const modal = document.getElementById('modalSimulation');
  if (!modal) return;

  const adminInfo = getLoggedAdminInfo();
  const badge = document.getElementById('simExcludedAdminBadge');
  if (badge) {
    badge.textContent = adminInfo.studentId 
      ? `ยกเว้น: [${adminInfo.studentId}] ${adminInfo.name} (${adminInfo.email})`
      : `ยกเว้น: ${adminInfo.email}`;
  }

  // Ensure default state
  document.getElementById('simConfigSection')?.classList.remove('hidden');
  document.getElementById('simMonitorSection')?.classList.add('hidden');

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeSimModal() {
  const modal = document.getElementById('modalSimulation');
  if (modal) modal.classList.add('hidden');
}

function simLog(message, type = 'info') {
  const feed = document.getElementById('simConsoleFeed');
  if (!feed) return;

  const now = new Date().toLocaleTimeString('th-TH', { hour12: false });
  const row = document.createElement('div');
  row.className = 'flex items-start gap-2 py-0.5 leading-relaxed';

  let colorClass = 'text-slate-300';
  let prefixIcon = '•';

  if (type === 'join') {
    colorClass = 'text-sky-400 font-bold';
    prefixIcon = '👤';
  } else if (type === 'switch') {
    colorClass = 'text-amber-400 font-bold';
    prefixIcon = '🔄';
  } else if (type === 'cancel') {
    colorClass = 'text-rose-400';
    prefixIcon = '❌';
  } else if (type === 'rush') {
    colorClass = 'text-purple-300 font-bold';
    prefixIcon = '⚡';
  } else if (type === 'success') {
    colorClass = 'text-emerald-400 font-black';
    prefixIcon = '🎉';
  }

  row.innerHTML = `
    <span class="text-slate-600 select-none">[${now}]</span>
    <span class="${colorClass}">${prefixIcon} ${message}</span>
  `;

  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function setSimProgress(percent, statusText) {
  const pBar = document.getElementById('simProgressBar');
  const pText = document.getElementById('simProgressPercentText');
  const sText = document.getElementById('simProgressStatusText');

  const rounded = Math.min(100, Math.max(0, Math.round(percent)));
  if (pBar) pBar.style.width = `${rounded}%`;
  if (pText) pText.textContent = `${rounded}%`;
  if (sText && statusText) sText.textContent = statusText;
}

function stopBotSimulation() {
  if (!isSimulationRunning) return;
  simAbortController = true;
  simLog("⚠️ ได้รับคำสั่งให้หยุดการจำลองกลางคัน...", "cancel");
}

async function sleepSim(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: สุ่มลำดับอาเรย์
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Flatten all roles across tracks and departments
function getAllAvailableRoles(eventObj) {
  const list = [];
  if (!eventObj || !eventObj.tracks) return list;

  eventObj.tracks.forEach(track => {
    (track.departments || []).forEach(dept => {
      (dept.roles || []).forEach(role => {
        list.push({
          trackId: track.id,
          trackTitle: track.title,
          deptId: dept.id,
          deptName: dept.name,
          roleId: role.id,
          roleTitle: role.title,
          maxSeats: role.maxSeats || 10
        });
      });
    });
  });
  return list;
}

async function startBotSimulation() {
  if (isSimulationRunning) return;

  const botCount = parseInt(document.getElementById('simBotCountInput')?.value || '30', 10);
  const intensity = document.getElementById('simIntensitySelect')?.value || 'high';
  const speedMode = document.getElementById('simSpeedSelect')?.value || 'turbo';
  const targetChoice = document.getElementById('simTargetChoiceSelect')?.value || 'complete_all';

  let baseDelay = 30; // default turbo
  if (speedMode === 'instant') baseDelay = 0;
  else if (speedMode === 'turbo') baseDelay = 25;
  else if (speedMode === 'fast') baseDelay = 100;
  else if (speedMode === 'normal') baseDelay = 400;
  const adminInfo = getLoggedAdminInfo();

  // 1. คัดกรองนักศึกษาทั้งหมดที่ไม่ใช่เรา (Exclusion Guard)
  const allStudents = window.STUDENTS_DATA || [];
  const candidateStudents = allStudents.filter(st => {
    if (adminInfo.studentId && st.id === adminInfo.studentId) return false;
    if (adminInfo.email && st.email.toLowerCase() === adminInfo.email.toLowerCase()) return false;
    // ป้องกันแอดมินภูผาพิเศษ
    if (st.email.toLowerCase() === 'phupa5874@gmail.com' || st.email.toLowerCase() === 'thitiwut.a@kkumail.com') return false;
    return true;
  });

  if (candidateStudents.length === 0) {
    alert("ไม่พบบัญชีนักศึกษาสำหรับจำลองเหตุการณ์");
    return;
  }

  const selectedBots = shuffleArray(candidateStudents).slice(0, Math.min(botCount, candidateStudents.length));

  // 2. ปรับ UI เข้าสู่โหมดจำลองสด
  isSimulationRunning = true;
  simAbortController = false;

  document.getElementById('simConfigSection')?.classList.add('hidden');
  const monitorSec = document.getElementById('simMonitorSection');
  if (monitorSec) monitorSec.classList.remove('hidden');

  const feed = document.getElementById('simConsoleFeed');
  if (feed) feed.innerHTML = '';

  setSimProgress(0, `เตรียมปล่อยบอท ${selectedBots.length} คนเข้าสู่ระบบ...`);
  simLog(`🚀 เริ่มการจำลองระบบ: มีบอทเข้าร่วม ${selectedBots.length} คน (ไม่รวมบัญชีของคุณ)`, "rush");
  simLog(`🔒 บัญชีปลอดภัยของคุณ: [${adminInfo.studentId || '-'}] ${adminInfo.name} ได้รับการยกเว้น 100%`, "info");

  const allRoles = getAllAvailableRoles(currentClassEvent);
  if (allRoles.length === 0) {
    simLog("⚠️ ไม่พบข้อมูลฝ่ายและตำแหน่งในระบบ", "cancel");
    isSimulationRunning = false;
    return;
  }

  const totalActions = selectedBots.length * (intensity === 'high' ? 3 : (intensity === 'medium' ? 2 : 1));
  let completedActions = 0;

  try {
    // -------------------------------------------------------------
    // PHASE 1: การกรูกันเข้ามาแย่งเลือกตำแหน่ง (Rush & First Selection)
    // -------------------------------------------------------------
    simLog("--- 🏁 เฟส 1: เริ่มกรูเข้ามาเลือกฝ่ายและจองตำแหน่ง ---", "rush");

    for (let i = 0; i < selectedBots.length; i++) {
      if (simAbortController) break;

      const bot = selectedBots[i];
      // สุ่มตำแหน่งเริ่มต้น
      let regSuccess = false;
      try {
        await window.ComedEventManager.registerTrackRole(
          EVENT_CLASS_ID,
          {
            studentId: bot.id,
            studentName: bot.name,
            nickname: bot.nickname || '',
            email: bot.email,
            phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
            note: '🤖 บอทจำลองเหตุการณ์เสมือนจริง'
          },
          randomRole.trackId,
          randomRole.deptId,
          randomRole.roleId
        );
        regSuccess = true;
      } catch(regErr) {
        simLog(`❌ [${bot.id}] ${bot.name} แย่งตำแหน่ง "${randomRole.roleTitle}" ไม่ทัน! (${regErr.message})`, "cancel");
      }

      completedActions++;
      setSimProgress((completedActions / totalActions) * 100, `บอท ${bot.name} กำลังเลือกตำแหน่ง...`);
      if (regSuccess) {
        simLog(`[${bot.id}] ${bot.name} (${bot.nickname || 'บอท'}) จองตำแหน่ง "${randomRole.roleTitle}" ใน ${randomRole.deptName} สำเร็จ!`, "join");
      }

      refreshAdminUI();
      if (baseDelay > 0) {
        await sleepSim(baseDelay === 25 ? Math.random() * 25 + 15 : (baseDelay + Math.random() * 100));
      }
    }

    // -------------------------------------------------------------
    // PHASE 2: การเปลี่ยนใจ ลังเล สลับฝ่าย หรือยกเลิกไปมา (Chaotic / Stress)
    // -------------------------------------------------------------
    if (!simAbortController && intensity !== 'direct') {
      simLog("--- 🔄 เฟส 2: เกิดการแย่งชิงโควตา บางคนเปลี่ยนใจ / ยกเลิก / ย้ายฝ่าย ---", "rush");

      // สุ่มบอท 50-70% ให้สลับฝ่าย
      const shufflerBots = shuffleArray(selectedBots).slice(0, Math.floor(selectedBots.length * 0.65));

      for (let j = 0; j < shufflerBots.length; j++) {
        if (simAbortController) break;

        const bot = shufflerBots[j];
        // ดึงการลงทะเบียนเดิมของบอท
        const existingRegs = window.ComedEventManager.getAllStudentRegistrations(EVENT_CLASS_ID, bot.id);
        if (existingRegs.length === 0) continue;

        const curReg = existingRegs[0];
        const doCancelFirst = Math.random() > 0.45;

        if (doCancelFirst) {
          // จำลองการกดยกเลิก
          await window.ComedEventManager.cancelTrackRegistration(EVENT_CLASS_ID, bot.id, curReg.trackId);
          simLog(`[${bot.id}] ${bot.name} กดยกเลิกสิทธิ์ออกจาก "${curReg.roleTitle}" เพื่อเปลี่ยนฝ่ายใหม่`, "cancel");
          refreshAdminUI();
          if (baseDelay > 0) await sleepSim(baseDelay);
        }

        // ย้ายไปตำแหน่งใหม่คนละฝ่าย
        const alternativeRoles = allRoles.filter(r => r.roleId !== curReg.roleId);
        const newRole = alternativeRoles[Math.floor(Math.random() * alternativeRoles.length)];

        let switchSuccess = false;
        try {
          await window.ComedEventManager.registerTrackRole(
            EVENT_CLASS_ID,
            {
              studentId: bot.id,
              studentName: bot.name,
              nickname: bot.nickname || '',
              email: bot.email,
              phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
              note: '🤖 บอทจำลองเหตุการณ์ (ย้ายฝ่าย)'
            },
            newRole.trackId,
            newRole.deptId,
            newRole.roleId
          );
          switchSuccess = true;
        } catch(swErr) {
          simLog(`❌ [${bot.id}] ${bot.name} ย้ายไป "${newRole.roleTitle}" ไม่สำเร็จ (${swErr.message})`, "cancel");
        }

        completedActions++;
        setSimProgress((completedActions / totalActions) * 100, `บอท ${bot.name} กำลังย้ายฝ่าย...`);
        if (switchSuccess) {
          simLog(`[${bot.id}] ${bot.name} ย้ายไปลง "${newRole.roleTitle}" ฝ่าย ${newRole.deptName} แทน`, "switch");
        }

        refreshAdminUI();
        if (baseDelay > 0) {
          await sleepSim(baseDelay === 25 ? Math.random() * 25 + 15 : (baseDelay + Math.random() * 100));
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 3: จัดสรรตำแหน่งรอบสุดท้ายให้ลงครบถ้วน 100%
    // -------------------------------------------------------------
    if (!simAbortController && targetChoice === 'complete_all') {
      simLog("--- 🎯 เฟส 3: จัดสรรตำแหน่งให้บอททุกคนได้สังกัดครบ 100% ---", "rush");

      for (let k = 0; k < selectedBots.length; k++) {
        if (simAbortController) break;
        const bot = selectedBots[k];

        const hasReg = window.ComedEventManager.getAllStudentRegistrations(EVENT_CLASS_ID, bot.id);
        if (hasReg.length === 0) {
          // หาตำแหน่งที่ยังมีที่นั่งว่างจริง
          const currentRegs = window.ComedEventManager.getRegistrations(EVENT_CLASS_ID);
          const availableRoles = allRoles.filter(r => {
            const count = currentRegs.filter(reg => (reg.trackId === r.trackId || !reg.trackId) && reg.departmentId === r.deptId && reg.roleId === r.roleId).length;
            return count < r.maxSeats;
          });

          const safeRole = availableRoles.length > 0 ? availableRoles[0] : allRoles[k % allRoles.length];
          try {
            await window.ComedEventManager.registerTrackRole(
              EVENT_CLASS_ID,
              {
                studentId: bot.id,
                studentName: bot.name,
                nickname: bot.nickname || '',
                email: bot.email,
                phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
                note: '🤖 บอทจำลองเหตุการณ์ (จัดสรรรอบสุดท้าย)'
              },
              safeRole.trackId,
              safeRole.deptId,
              safeRole.roleId
            );
            simLog(`[${bot.id}] ${bot.name} ได้รับการจัดสรรเข้า "${safeRole.roleTitle}" สำเร็จ`, "join");
          } catch(e) {
            simLog(`⚠️ [${bot.id}] ${bot.name} ทุกตำแหน่งเต็มหมดแล้ว ไม่สามารถจัดสรรเพิ่มได้`, "cancel");
          }
          refreshAdminUI();
        }
      }
    }

    // -------------------------------------------------------------
    // OPTIONAL: สุ่มบอทบางส่วนให้ลงทั้ง 2 กิจกรรมพร้อมกัน (Multi-track)
    // -------------------------------------------------------------
    if (!simAbortController && targetChoice === 'random_both') {
      simLog("--- 🌟 เฟสพิเศษ: จำลองบอทเลือกลงครบทั้ง 2 กิจกรรมพร้อมกัน ---", "rush");
      const multiBots = shuffleArray(selectedBots).slice(0, Math.floor(selectedBots.length * 0.4));

      for (const mBot of multiBots) {
        if (simAbortController) break;
        const currentRegs = window.ComedEventManager.getAllStudentRegistrations(EVENT_CLASS_ID, mBot.id);
        const hasGrad = currentRegs.some(r => r.trackId === 'track_grad');
        const hasChild = currentRegs.some(r => r.trackId === 'track_children');

        const needTrack = !hasGrad ? 'track_grad' : (!hasChild ? 'track_children' : null);
        if (needTrack) {
          const trackRoles = allRoles.filter(r => r.trackId === needTrack);
          const pickRole = trackRoles[Math.floor(Math.random() * trackRoles.length)];

          await window.ComedEventManager.registerTrackRole(
            EVENT_CLASS_ID,
            {
              studentId: mBot.id,
              studentName: mBot.name,
              nickname: mBot.nickname || '',
              email: mBot.email,
              note: '🤖 บอทจำลองเหตุการณ์ (ร่วม 2 งาน)'
            },
            pickRole.trackId,
            pickRole.deptId,
            pickRole.roleId
          );
          simLog(`🌟 [${mBot.id}] ${mBot.name} เลือกร่วมเพิ่มอีก 1 กิจกรรม: "${pickRole.roleTitle}" (${pickRole.trackTitle})`, "join");
          refreshAdminUI();
          if (baseDelay > 0) await sleepSim(Math.max(10, baseDelay / 2));
        }
      }
    }

    // Finished
    setSimProgress(100, simAbortController ? "การจำลองถูกยกเลิกแล้ว" : "การจำลองเหตุการณ์เสร็จสิ้นสมบูรณ์ 100%!");
    if (!simAbortController) {
      simLog("🎉 การทดสอบความเสถียรของระบบ (Stress Test) สำเร็จเรียบร้อย! ข้อมูลถูกซิงค์และบันทึกลงตารางทันที", "success");
    }

  } catch(err) {
    simLog("⚠️ เกิดข้อผิดพลาดระหว่างจำลอง: " + err.message, "cancel");
  } finally {
    isSimulationRunning = false;
    refreshAdminUI();
  }
}

// ฟังก์ชันล้างข้อมูลการลงชื่อในกิจกรรมนี้ทั้งหมด เพื่อเตรียมทดสอบใหม่
async function resetClassRegistrationsQuick() {
  if (!confirm("⚠️ ต้องการล้างข้อมูลการลงชื่อทั้งหมดของกิจกรรมนี้ เพื่อเริ่มต้นทดสอบระบบใหม่ ใช่หรือไม่?")) return;

  try {
    if (window.ComedEventManager && typeof window.ComedEventManager.clearAllRegistrations === 'function') {
      await window.ComedEventManager.clearAllRegistrations(EVENT_CLASS_ID);
    } else {
      const key = `COMED_EVENT_REGISTRATIONS_V1_${EVENT_CLASS_ID}`;
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify([]));
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb) {
        await sb.from('event_registrations').delete().eq('event_id', EVENT_CLASS_ID);
      }
    }

    refreshAdminUI();
    alert("🧹 ล้างข้อมูลการลงชื่อทั้งหมดเรียบร้อยแล้ว พร้อมเริ่มทดสอบรอบใหม่!");
    const feed = document.getElementById('simConsoleFeed');
    if (feed) feed.innerHTML = '';
    setSimProgress(0, "ระบบพร้อมเริ่มทดสอบรอบใหม่");
  } catch(e) {
    alert("เกิดข้อผิดพลาดในการล้างข้อมูล: " + e.message);
  }
}
