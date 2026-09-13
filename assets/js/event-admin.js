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
    const totalSeats = (dept.roles || []).reduce((s, r) => s + (parseInt(r.maxSeats) || 0), 0);

    const rolesBreakdown = (dept.roles || []).map(role => {
      const occupied = deptRegs.filter(r => r.roleId === role.id).length;
      return `
        <div class="flex justify-between items-center text-xs text-slate-300 py-1.5 border-b border-slate-800/50">
          <span class="truncate pr-2">${role.title}</span>
          <span class="font-mono font-bold flex-shrink-0 ${occupied >= role.maxSeats ? 'text-amber-400' : 'text-emerald-400'}">
            ${occupied}/${role.maxSeats}
          </span>
        </div>
      `;
    }).join('');

    return `
      <div class="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition space-y-3.5 shadow-lg flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${dept.color || 'from-orange-500 to-amber-500'} text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <i data-lucide="${dept.icon || 'star'}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-white text-sm truncate">${dept.name}</h4>
                <span class="text-[11px] text-slate-400 block truncate">${dept.description || 'ไม่มีคำอธิบาย'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 ${dept.badgeColor || 'bg-slate-800 text-slate-300'}">
              ${deptRegs.length}/${totalSeats} คน
            </span>
          </div>
          <div class="space-y-0.5 pt-1">
            ${rolesBreakdown || '<span class="text-xs text-slate-500 italic block py-2">ยังไม่มีตำแหน่งงาน</span>'}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
          <button onclick="openEditDeptModal('${dept.id}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer">
            <i data-lucide="edit-2" class="w-3.5 h-3.5 text-orange-400"></i>
            <span>แก้ไขฝ่าย & ตำแหน่ง</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================= DEPARTMENT & ROLES CRUD CONTROLLERS =================
let editingDeptId = null;

function openAddDeptModal() {
  editingDeptId = null;
  document.getElementById('deptModalTitle').textContent = "เพิ่มฝ่ายใหม่ในกิจกรรม";
  document.getElementById('deptEditId').value = '';
  document.getElementById('deptEditName').value = '';
  document.getElementById('deptEditDesc').value = '';
  document.getElementById('deptEditIcon').value = 'star';
  document.getElementById('btnDeleteDept').classList.add('hidden');

  const container = document.getElementById('deptRolesRowsContainer');
  container.innerHTML = '';
  // Default first role row
  addDeptRoleRow('สมาชิกฝ่าย', 10);

  const modal = document.getElementById('modalDeptEditor');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function openEditDeptModal(deptId) {
  if (!activeEvent || !activeEvent.departments) return;
  const dept = activeEvent.departments.find(d => d.id === deptId);
  if (!dept) return;

  editingDeptId = deptId;
  document.getElementById('deptModalTitle').textContent = `แก้ไขฝ่าย: ${dept.name}`;
  document.getElementById('deptEditId').value = dept.id;
  document.getElementById('deptEditName').value = dept.name;
  document.getElementById('deptEditDesc').value = dept.description || '';
  document.getElementById('deptEditIcon').value = dept.icon || 'star';
  document.getElementById('btnDeleteDept').classList.remove('hidden');

  const container = document.getElementById('deptRolesRowsContainer');
  container.innerHTML = '';
  (dept.roles || []).forEach(role => {
    addDeptRoleRow(role.title, role.maxSeats, role.id);
  });

  const modal = document.getElementById('modalDeptEditor');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function closeDeptModal() {
  const modal = document.getElementById('modalDeptEditor');
  if (modal) modal.classList.add('hidden');
}

function addDeptRoleRow(title = '', maxSeats = 1, roleId = '') {
  const container = document.getElementById('deptRolesRowsContainer');
  if (!container) return;

  const rowId = 'role_row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const row = document.createElement('div');
  row.id = rowId;
  row.className = "flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs";
  row.innerHTML = `
    <input type="hidden" class="role-id-input" value="${roleId}">
    <div class="flex-grow">
      <input type="text" placeholder="ชื่อตำแหน่ง เช่น สมาชิกฝ่าย..." value="${title}" required
        class="role-title-input w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500">
    </div>
    <div class="w-24 flex items-center gap-1">
      <span class="text-slate-400 text-[11px] font-bold">รับ:</span>
      <input type="number" min="1" max="60" value="${maxSeats}" required
        class="role-seats-input w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs text-center font-mono outline-none focus:border-orange-500">
      <span class="text-slate-400 text-[11px]">คน</span>
    </div>
    <button type="button" onclick="document.getElementById('${rowId}').remove()" title="ลบตำแหน่งนี้"
      class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer">
      <i data-lucide="trash" class="w-3.5 h-3.5"></i>
    </button>
  `;
  container.appendChild(row);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleSaveDept(e) {
  e.preventDefault();
  if (!activeEvent) return;

  const name = document.getElementById('deptEditName').value.trim();
  const desc = document.getElementById('deptEditDesc').value.trim();
  const icon = document.getElementById('deptEditIcon').value;

  const roleRows = document.querySelectorAll('#deptRolesRowsContainer > div');
  if (roleRows.length === 0) {
    alert("⚠️ กรุณากำหนดตำแหน่งงานในฝ่ายอย่างน้อย 1 ตำแหน่ง");
    return;
  }

  const roles = [];
  roleRows.forEach((row, idx) => {
    const title = row.querySelector('.role-title-input').value.trim();
    const seats = parseInt(row.querySelector('.role-seats-input').value) || 1;
    let rId = row.querySelector('.role-id-input').value.trim();
    if (!rId) {
      rId = 'role_' + Date.now().toString(36) + '_' + idx;
    }
    roles.push({
      id: rId,
      title: title,
      maxSeats: seats
    });
  });

  if (!activeEvent.departments) activeEvent.departments = [];

  if (editingDeptId) {
    const deptIdx = activeEvent.departments.findIndex(d => d.id === editingDeptId);
    if (deptIdx !== -1) {
      activeEvent.departments[deptIdx] = {
        ...activeEvent.departments[deptIdx],
        name: name,
        description: desc,
        icon: icon,
        roles: roles
      };
    }
  } else {
    const newDeptId = 'dept_' + Date.now().toString(36);
    activeEvent.departments.push({
      id: newDeptId,
      name: name,
      description: desc,
      icon: icon,
      color: 'from-orange-500 to-amber-600',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      roles: roles
    });
  }

  window.ComedEventManager.saveEvent(activeEvent);
  closeDeptModal();
  refreshAdminUI();
  alert("✨ บันทึกข้อมูลฝ่ายและตำแหน่งงานเรียบร้อยแล้ว!");
}

function handleDeleteDept() {
  if (!editingDeptId || !activeEvent) return;
  const dept = activeEvent.departments.find(d => d.id === editingDeptId);
  if (!dept) return;

  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบฝ่าย "${dept.name}" ออกจากกิจกรรม?`)) {
    activeEvent.departments = activeEvent.departments.filter(d => d.id !== editingDeptId);
    window.ComedEventManager.saveEvent(activeEvent);
    closeDeptModal();
    refreshAdminUI();
    alert(`🗑️ ลบฝ่าย "${dept.name}" เรียบร้อยแล้ว`);
  }
}

// ================= RANDOM / AUTO ASSIGNMENT CONTROLLERS =================
function openRandomAssignModal() {
  if (!activeEvent || !activeEvent.departments) return;

  const students = window.STUDENTS_DATA || [];
  const regs = window.ComedEventManager.getRegistrations(activeEvent.id);
  const pendingCount = students.filter(st => !regs.some(r => r.studentId === st.id)).length;

  let totalAvailableSeats = 0;
  activeEvent.departments.forEach(dept => {
    (dept.roles || []).forEach(role => {
      const occupied = regs.filter(r => r.departmentId === dept.id && r.roleId === role.id).length;
      totalAvailableSeats += Math.max(0, role.maxSeats - occupied);
    });
  });

  const targetLabel = document.getElementById('randomTargetCount');
  const seatsLabel = document.getElementById('randomAvailableSeatsCount');
  if (targetLabel) targetLabel.textContent = `${pendingCount} คน (คนที่ยังไม่เลือก)`;
  if (seatsLabel) seatsLabel.textContent = `${totalAvailableSeats} ที่ว่าง`;

  const modal = document.getElementById('modalRandomAssign');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function closeRandomAssignModal() {
  const modal = document.getElementById('modalRandomAssign');
  if (modal) modal.classList.add('hidden');
}

async function executeRandomAssignment() {
  if (!activeEvent || !activeEvent.departments) return;

  const mode = document.querySelector('input[name="randomMode"]:checked')?.value || 'pending_only';
  const students = [...(window.STUDENTS_DATA || [])];
  let regs = [...window.ComedEventManager.getRegistrations(activeEvent.id)];

  let targetStudents = [];

  if (mode === 'all_students') {
    if (!confirm("⚠️ คำเตือน: คุณเลือก 'สุ่มใหม่ทั้งหมด 60 คน' ข้อมูลการเลือกฝ่ายเดิมทั้งหมดจะถูกแทนที่ใหม่ คุณต้องการดำเนินการต่อหรือไม่?")) {
      return;
    }
    regs = [];
    targetStudents = students;
  } else {
    // pending only
    targetStudents = students.filter(st => !regs.some(r => r.studentId === st.id));
    if (targetStudents.length === 0) {
      alert("👏 นักศึกษาทุกคน (60 คน) มีฝ่ายครบหมดแล้ว ไม่มีใครที่ยังไม่เลือก");
      closeRandomAssignModal();
      return;
    }
  }

  // Shuffle students randomly (Fisher-Yates Shuffle)
  for (let i = targetStudents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targetStudents[i], targetStudents[j]] = [targetStudents[j], targetStudents[i]];
  }

  // Create available seats pool
  let seatsPool = [];
  activeEvent.departments.forEach(dept => {
    (dept.roles || []).forEach(role => {
      const occupied = regs.filter(r => r.departmentId === dept.id && r.roleId === role.id).length;
      const freeSeats = Math.max(0, role.maxSeats - occupied);
      for (let s = 0; s < freeSeats; s++) {
        seatsPool.push({
          deptId: dept.id,
          deptName: dept.name,
          roleId: role.id,
          roleTitle: role.title
        });
      }
    });
  });

  // Shuffle seats pool
  for (let i = seatsPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seatsPool[i], seatsPool[j]] = [seatsPool[j], seatsPool[i]];
  }

  if (seatsPool.length < targetStudents.length) {
    if (!confirm(`⚠️ จำนวนที่นั่งว่าง (${seatsPool.length} ที่) น้อยกว่าจำนวนนักศึกษาที่ต้องจัดสรร (${targetStudents.length} คน)\nจะมีนักศึกษา ${targetStudents.length - seatsPool.length} คนที่ไม่ได้รับการสุ่มจัดสรร ต้องการดำเนินการต่อหรือไม่?`)) {
      return;
    }
  }

  const assignedCount = Math.min(targetStudents.length, seatsPool.length);

  for (let i = 0; i < assignedCount; i++) {
    const st = targetStudents[i];
    const seat = seatsPool[i];

    const record = {
      eventId: activeEvent.id,
      studentId: st.id,
      studentName: st.name,
      nickname: st.nickname || '',
      email: st.email,
      departmentId: seat.deptId,
      departmentName: seat.deptName,
      roleId: seat.roleId,
      roleTitle: seat.roleTitle,
      note: 'ระบบสุ่มให้อัตโนมัติ (Random)',
      registeredAt: new Date().toISOString()
    };

    const exIdx = regs.findIndex(r => r.studentId === st.id);
    if (exIdx !== -1) {
      regs[exIdx] = record;
    } else {
      regs.push(record);
    }
  }

  // Save to Local Cache & Batch Sync to Cloud
  const key = `COMED_EVENT_REGISTRATIONS_V1_${activeEvent.id}`;
  localStorage.setItem(key, JSON.stringify(regs));

  // Sync to Cloud
  try {
    await window.ComedEventManager.syncAllRegistrationsToCloud(activeEvent.id);
  } catch(e) {}

  closeRandomAssignModal();
  refreshAdminUI();
  alert(`🎲 สุ่มจัดสรรฝ่ายและตำแหน่งให้นักศึกษาสำเร็จ ${assignedCount} คน เรียบร้อยแล้ว!`);
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
  
  if (activeEvent.startTime) {
    const d = new Date(activeEvent.startTime);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('editEventStartTimeInput').value = localIso;
  } else {
    document.getElementById('editEventStartTimeInput').value = '';
  }

  if (activeEvent.deadline) {
    const d = new Date(activeEvent.deadline);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('editEventDeadlineInput').value = localIso;
  } else {
    document.getElementById('editEventDeadlineInput').value = '';
  }

  const modal = document.getElementById('modalEditEvent');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
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
  
  const startVal = document.getElementById('editEventStartTimeInput').value;
  activeEvent.startTime = startVal ? new Date(startVal).toISOString() : null;

  const dlVal = document.getElementById('editEventDeadlineInput').value;
  activeEvent.deadline = dlVal ? new Date(dlVal).toISOString() : null;

  window.ComedEventManager.saveEvent(activeEvent);
  closeEditEventModal();
  renderHeaderAndStats();
  alert("✨ บันทึกการตั้งค่ากิจกรรมและเวลานับถอยหลังเรียบร้อยแล้ว!");
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

async function submitManualAssign() {
  if (!targetAssignStudent || !activeEvent) return;
  const val = document.getElementById('assignDeptRoleSelect').value;
  if (!val) return;

  const [deptId, roleId] = val.split(':::');

  try {
    await window.ComedEventManager.registerRole(activeEvent.id, {
      studentId: targetAssignStudent.id,
      studentName: targetAssignStudent.name,
      nickname: targetAssignStudent.nickname || '',
      email: targetAssignStudent.email,
      note: 'แอดมินกำหนดให้'
    }, deptId, roleId);

    closeManualAssignModal();
    refreshAdminUI();
    alert(`✅ บันทึกฝ่ายและตำแหน่งให้ ${targetAssignStudent.name} เรียบร้อยแล้ว`);
  } catch(err) {
    alert("⚠️ " + (err.message || "เกิดข้อผิดพลาด"));
  }
}

async function resetStudentRole(studentId, name) {
  if (confirm(`คุณต้องการลบ/รีเซ็ตการเลือกตำแหน่งของ "${name}" ใช่หรือไม่?`)) {
    try {
      await window.ComedEventManager.cancelRegistration(activeEvent.id, studentId);
      refreshAdminUI();
      alert("🗑️ ล้างข้อมูลเรียบร้อยแล้ว");
    } catch(err) {
      alert("⚠️ เกิดข้อผิดพลาด: " + (err.message || ""));
    }
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
