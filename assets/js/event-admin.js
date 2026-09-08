/**
 * =========================================================================
 * EVENT ADMIN LOGIC - assets/js/event-admin.js
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

let activeEvent = null;
let currentTableFilter = 'all';
let targetAssignStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  activeEvent = window.ComedEventManager.getActiveEvent('room_roles_69');

  renderHeaderAndStats();
  renderDeptsGrid();
  renderAdminTable();

  // Sync latest from Supabase
  try {
    await window.ComedEventManager.fetchCloudData(activeEvent.id);
    refreshAdminUI();
  } catch(e) {}

  // Subscribe to Real-Time Live updates for Admin
  if (window.ComedEventManager && typeof window.ComedEventManager.subscribeRealtime === 'function') {
    window.ComedEventManager.subscribeRealtime(activeEvent.id, () => {
      refreshAdminUI();
    });
  }
});

function refreshAdminUI() {
  renderHeaderAndStats();
  renderDeptsGrid();
  renderAdminTable();
}

function renderHeaderAndStats() {
  if (!activeEvent) return;
  document.getElementById('adminEventTitle').textContent = activeEvent.title;
  document.getElementById('adminEventSubtitle').textContent = activeEvent.subtitle || '';

  const pill = document.getElementById('adminEventStatusPill');
  const btnToggle = document.getElementById('btnToggleEventStatusText');
  if (activeEvent.status === 'open') {
    pill.textContent = "ONLINE";
    pill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    if (btnToggle) btnToggle.textContent = "เปิดรับสมัครอยู่ (คลิกเพื่อปิด)";
  } else {
    pill.textContent = "CLOSED";
    pill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30";
    if (btnToggle) btnToggle.textContent = "ปิดรับสมัครชั่วคราว (คลิกเพื่อเปิด)";
  }

  const regs = window.ComedEventManager.getRegistrations(activeEvent.id);
  const total = (window.STUDENTS_DATA || []).length || 60;
  const regCount = regs.length;
  const pendingCount = Math.max(0, total - regCount);
  const pct = Math.round((regCount / total) * 100);

  // Total roles count
  let rolesCount = 0;
  (activeEvent.departments || []).forEach(d => rolesCount += (d.roles || []).length);

  document.getElementById('adminStatRegistered').textContent = regCount;
  document.getElementById('adminStatPending').textContent = pendingCount;
  document.getElementById('adminStatRolesCount').textContent = rolesCount;
  document.getElementById('adminStatProgress').textContent = `${pct}%`;
}

function renderDeptsGrid() {
  const container = document.getElementById('adminDeptsGrid');
  if (!container || !activeEvent || !activeEvent.departments) return;

  const regs = window.ComedEventManager.getRegistrations(activeEvent.id);

  container.innerHTML = activeEvent.departments.map(dept => {
    const deptRegs = regs.filter(r => r.departmentId === dept.id);
    const totalSeats = dept.roles.reduce((s, r) => s + r.maxSeats, 0);

    const rolesBreakdown = dept.roles.map(role => {
      const occupied = deptRegs.filter(r => r.roleId === role.id).length;
      return `
        <div class="flex justify-between items-center text-xs text-slate-300 py-1 border-b border-slate-800/50">
          <span>${role.title}</span>
          <span class="font-mono font-bold ${occupied >= role.maxSeats ? 'text-amber-400' : 'text-emerald-400'}">
            ${occupied}/${role.maxSeats}
          </span>
        </div>
      `;
    }).join('');

    return `
      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${dept.color || 'from-orange-500 to-amber-500'} text-white flex items-center justify-center font-bold">
              <i data-lucide="${dept.icon || 'star'}" class="w-4 h-4"></i>
            </div>
            <h4 class="font-bold text-white text-sm">${dept.name}</h4>
          </div>
          <span class="px-2 py-0.5 rounded-lg text-xs font-bold ${dept.badgeColor || 'bg-slate-800 text-slate-300'}">
            ${deptRegs.length}/${totalSeats} คน
          </span>
        </div>
        <div class="space-y-0.5 pt-1">
          ${rolesBreakdown}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterAdminTable(tab) {
  currentTableFilter = tab;
  document.querySelectorAll('.admin-tab').forEach(b => {
    b.classList.remove('bg-orange-500', 'text-white', 'active');
    b.classList.add('bg-slate-900', 'text-slate-400');
  });
  event.target.classList.add('bg-orange-500', 'text-white', 'active');
  event.target.classList.remove('bg-slate-900', 'text-slate-400');
  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('adminSearchInput')?.value || '').trim().toLowerCase();
  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(activeEvent ? activeEvent.id : 'room_roles_69');

  let rows = students.map((st, idx) => {
    const reg = regs.find(r => r.studentId === st.id);
    return {
      index: idx + 1,
      studentId: st.id,
      name: st.name,
      nickname: st.nickname || '-',
      email: st.email,
      departmentId: reg ? reg.departmentId : null,
      departmentName: reg ? reg.departmentName : null,
      roleId: reg ? reg.roleId : null,
      roleTitle: reg ? reg.roleTitle : null,
      registeredAt: reg ? reg.registeredAt : null,
      isRegistered: !!reg
    };
  });

  if (currentTableFilter === 'registered') rows = rows.filter(r => r.isRegistered);
  else if (currentTableFilter === 'pending') rows = rows.filter(r => !r.isRegistered);

  if (searchQuery) {
    rows = rows.filter(r => 
      r.name.toLowerCase().includes(searchQuery) ||
      r.studentId.toLowerCase().includes(searchQuery) ||
      r.nickname.toLowerCase().includes(searchQuery) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(searchQuery)) ||
      (r.roleTitle && r.roleTitle.toLowerCase().includes(searchQuery))
    );
  }

  const summary = document.getElementById('adminTableSummaryCount');
  if (summary) summary.textContent = `แสดง ${rows.length} จาก 60 คน`;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-500">ไม่พบข้อมูล</td></tr>`;
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
        ${r.roleTitle ? `<span class="text-emerald-400 font-bold text-xs">${r.roleTitle}</span>` : '<span class="text-slate-600 text-[11px]">ยังไม่ระบุ</span>'}
      </td>
      <td class="p-3.5 text-[11px] font-mono text-slate-400">
        ${r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('th-TH') : '-'}
      </td>
      <td class="p-3.5 text-center">
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="openManualAssignModal('${r.studentId}')" title="กำหนดฝ่าย/แก้ไข"
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i>
          </button>
          ${r.isRegistered ? `
            <button onclick="resetStudentRole('${r.studentId}', '${r.name}')" title="ล้างการเลือก"
              class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleEventStatus() {
  if (!activeEvent) return;
  const newStatus = activeEvent.status === 'open' ? 'temp_closed' : 'open';
  activeEvent.status = newStatus;
  window.ComedEventManager.saveEvent(activeEvent);
  renderHeaderAndStats();
  alert(`✨ เปลี่ยนสถานะกิจกรรมเป็น: ${newStatus === 'open' ? 'เปิดรับลงทะเบียน' : 'ปิดรับชั่วคราว'} เรียบร้อย!`);
}

function openEditEventModal() {
  if (!activeEvent) return;
  document.getElementById('editEventTitleInput').value = activeEvent.title;
  document.getElementById('editEventSubtitleInput').value = activeEvent.subtitle || '';
  document.getElementById('editEventStatusSelect').value = activeEvent.status || 'open';
  
  if (activeEvent.deadline) {
    const d = new Date(activeEvent.deadline);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('editEventDeadlineInput').value = localIso;
  }

  const modal = document.getElementById('modalEditEvent');
  if (modal) modal.classList.remove('hidden');
}

function closeEditEventModal() {
  const modal = document.getElementById('modalEditEvent');
  if (modal) modal.classList.add('hidden');
}

function handleSaveEventConfig(e) {
  e.preventDefault();
  if (!activeEvent) return;

  activeEvent.title = document.getElementById('editEventTitleInput').value.trim();
  activeEvent.subtitle = document.getElementById('editEventSubtitleInput').value.trim();
  activeEvent.status = document.getElementById('editEventStatusSelect').value;
  
  const dlVal = document.getElementById('editEventDeadlineInput').value;
  if (dlVal) activeEvent.deadline = new Date(dlVal).toISOString();

  window.ComedEventManager.saveEvent(activeEvent);
  closeEditEventModal();
  renderHeaderAndStats();
  alert("✨ บันทึกการตั้งค่ากิจกรรมเรียบร้อยแล้ว!");
}

// Manual Assign Modal
function openManualAssignModal(studentId) {
  const student = (window.STUDENTS_DATA || []).find(s => s.id === studentId);
  if (!student || !activeEvent) return;

  targetAssignStudent = student;
  document.getElementById('assignStudentName').textContent = `${student.name} (${student.nickname || '-'})`;
  document.getElementById('assignStudentId').textContent = student.id;

  const select = document.getElementById('assignDeptRoleSelect');
  const currentReg = window.ComedEventManager.getStudentRegistration(activeEvent.id, studentId);

  let optionsHtml = '';
  activeEvent.departments.forEach(dept => {
    dept.roles.forEach(role => {
      const isSelected = currentReg && currentReg.departmentId === dept.id && currentReg.roleId === role.id;
      optionsHtml += `
        <option value="${dept.id}:::${role.id}" ${isSelected ? 'selected' : ''}>
          ${dept.name} - ${role.title} (จำกัด ${role.maxSeats} คน)
        </option>
      `;
    });
  });

  select.innerHTML = optionsHtml;

  const modal = document.getElementById('modalManualAssign');
  if (modal) modal.classList.remove('hidden');
}

function closeManualAssignModal() {
  const modal = document.getElementById('modalManualAssign');
  if (modal) modal.classList.add('hidden');
}

function submitManualAssign() {
  if (!targetAssignStudent || !activeEvent) return;
  const val = document.getElementById('assignDeptRoleSelect').value;
  if (!val) return;

  const [deptId, roleId] = val.split(':::');

  try {
    window.ComedEventManager.registerRole(activeEvent.id, {
      studentId: targetAssignStudent.id,
      studentName: targetAssignStudent.name,
      nickname: targetAssignStudent.nickname || '',
      email: targetAssignStudent.email,
      note: 'แอดมินกำหนดให้'
    }, deptId, roleId);

    closeManualAssignModal();
    renderHeaderAndStats();
    renderDeptsGrid();
    renderAdminTable();
    alert(`✅ บันทึกฝ่ายและตำแหน่งให้ ${targetAssignStudent.name} เรียบร้อยแล้ว`);
  } catch(err) {
    alert("⚠️ " + err.message);
  }
}

function resetStudentRole(studentId, name) {
  if (confirm(`คุณต้องการลบ/รีเซ็ตการเลือกตำแหน่งของ "${name}" ใช่หรือไม่?`)) {
    window.ComedEventManager.cancelRegistration(activeEvent.id, studentId);
    renderHeaderAndStats();
    renderDeptsGrid();
    renderAdminTable();
    alert("🗑️ ล้างข้อมูลเรียบร้อยแล้ว");
  }
}

// ================= EXPORT TO EXCEL (.XLSX) =================
function exportRosterExcel() {
  if (typeof XLSX === 'undefined') {
    alert("กำลังโหลดไลบรารี Excel กรุณาลองใหม่อีกครั้ง");
    return;
  }

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(activeEvent ? activeEvent.id : 'room_roles_69');

  const excelRows = students.map((st, idx) => {
    const reg = regs.find(r => r.studentId === st.id);
    return {
      "ลำดับ": idx + 1,
      "รหัสนักศึกษา": st.id,
      "ชื่อ - นามสกุล": st.name,
      "ชื่อเล่น": st.nickname || "-",
      "อีเมล KKU": st.email,
      "ฝ่ายที่เลือก": reg ? reg.departmentName : "ยังไม่เลือก",
      "ตำแหน่ง": reg ? reg.roleTitle : "-",
      "วันเวลาที่ลงทะเบียน": reg && reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('th-TH') : "-",
      "หมายเหตุ": reg ? reg.note || "" : ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายชื่อเลือกฝ่าย_COMED69");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `COMED69_Room_Roles_${todayStr}.xlsx`);
}
