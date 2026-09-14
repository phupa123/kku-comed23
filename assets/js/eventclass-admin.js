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
  XLSX.writeFile(wb, `รายชื่อกิจกรรมรุ่น69_ซุ้มบัณฑิต_วันเด็ก_${today}.xlsx`);
}
