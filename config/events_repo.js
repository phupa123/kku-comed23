/**
 * =========================================================================
 * EVENTS REPOSITORY & SYNC MANAGER - config/events_repo.js
 * จัดการกิจกรรมและการเลือกฝ่ายนักศึกษา สาขาคอมพิวเตอร์ศึกษา (COMED KKU 69)
 * =========================================================================
 */

const COMED_EVENTS_KEY = 'COMED_EVENTS_LIST_V1';
const COMED_EVENT_REGS_KEY = 'COMED_EVENT_REGISTRATIONS_V1';

// ค่าเริ่มต้นของกิจกรรมเลือกฝ่ายภายในห้อง COMED KKU 69
const DEFAULT_COMED_EVENTS = [
  {
    id: 'room_roles_69',
    code: 'ROOM_ROLES_69',
    title: 'เลือกฝ่ายและคณะกรรมการดำเนินงานห้อง/รุ่น COMED KKU 69',
    subtitle: 'สำหรับนักศึกษาสาขาวิชาคอมพิวเตอร์ศึกษา ชั้นปีที่ 1 (รหัส 69) ทั้งหมด 60 คน',
    category: 'กิจกรรมภายในห้อง',
    status: 'open', // 'open' | 'temp_closed' | 'completed'
    deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    departments: [
      {
        id: 'dept_executive',
        name: 'ฝ่ายบริหาร',
        icon: 'crown',
        color: 'from-amber-500 to-orange-600',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        description: 'ผู้นำและผู้ประสานงานหลักในการบริหารจัดการห้องและกิจกรรมรุ่น',
        roles: [
          { id: 'role_head', title: 'หัวหน้าห้อง', maxSeats: 1 },
          { id: 'role_deputy', title: 'รองหัวหน้าห้อง', maxSeats: 2 },
          { id: 'role_secretary', title: 'เลขานุการ', maxSeats: 1 },
          { id: 'role_treasurer', title: 'เหรัญญิก', maxSeats: 1 },
          { id: 'role_assistant_treasurer', title: 'ผู้ช่วยเหรัญญิก', maxSeats: 1 }
        ]
      },
      {
        id: 'dept_academic',
        name: 'ฝ่ายวิชาการ',
        icon: 'book-open',
        color: 'from-blue-500 to-indigo-600',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        description: 'ดูแลและส่งเสริมงานวิชาการ การติว การจัดเตรียมเอกสาร และความรู้ของเพื่อนๆ',
        roles: [
          { id: 'role_academic_member', title: 'สมาชิกฝ่ายวิชาการ', maxSeats: 10 }
        ]
      },
      {
        id: 'dept_recreation',
        name: 'ฝ่ายนันทนาการ',
        icon: 'sparkles',
        color: 'from-pink-500 to-rose-600',
        badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        description: 'สร้างบรรยากาศความสนุกสนาน สันทนาการ และสานสัมพันธ์เพื่อนๆ ในสาขา',
        roles: [
          { id: 'role_recreation_member', title: 'สมาชิกฝ่ายนันทนาการ', maxSeats: 10 }
        ]
      },
      {
        id: 'dept_welfare',
        name: 'ฝ่ายสวัสดิการ',
        icon: 'heart-handshake',
        color: 'from-emerald-500 to-teal-600',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        description: 'ดูแลความเป็นอยู่ อาหารการกิน น้ำดื่ม ยาปฐมพยาบาล และความสะดวกของรุ่น',
        roles: [
          { id: 'role_welfare_member', title: 'สมาชิกฝ่ายสวัสดิการ', maxSeats: 10 }
        ]
      },
      {
        id: 'dept_tech',
        name: 'ฝ่ายเทคโนโลยีและสื่อ',
        icon: 'cpu',
        color: 'from-cyan-500 to-blue-600',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        description: 'รับผิดชอบงานกราฟิก สื่อดิจิทัล ดูแลระบบเทคโนโลยี อุปกรณ์ และภาพถ่ายกิจกรรม',
        roles: [
          { id: 'role_tech_member', title: 'สมาชิกฝ่ายเทคโนโลยีและสื่อ', maxSeats: 10 }
        ]
      },
      {
        id: 'dept_mc',
        name: 'ฝ่ายพิธีกรและปฏิคม',
        icon: 'mic',
        color: 'from-purple-500 to-violet-600',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        description: 'ดำเนินรายการ พิธีกรหน้าเวที ต้อนรับแขก อาจารย์ และประสานงานภายนอก',
        roles: [
          { id: 'role_mc_member', title: 'สมาชิกฝ่ายพิธีกรและปฏิคม', maxSeats: 10 }
        ]
      }
    ]
  }
];

window.ComedEventManager = {
  // ดึงรายการกิจกรรมทั้งหมด
  getAllEvents: function() {
    try {
      const stored = localStorage.getItem(COMED_EVENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(DEFAULT_COMED_EVENTS));
    return DEFAULT_COMED_EVENTS;
  },

  // ดึงกิจกรรมที่กำลังเปิดใช้งาน (Active Event)
  getActiveEvent: function(eventId) {
    const events = this.getAllEvents();
    if (eventId) {
      const found = events.find(e => e.id === eventId || e.code === eventId);
      if (found) return found;
    }
    return events[0] || DEFAULT_COMED_EVENTS[0];
  },

  // บันทึกกิจกรรม
  saveEvent: function(eventData) {
    const events = this.getAllEvents();
    const idx = events.findIndex(e => e.id === eventData.id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...eventData, updatedAt: new Date().toISOString() };
    } else {
      events.unshift({ ...eventData, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(events));
    this.syncEventToSupabase(eventData);
  },

  // ลบกิจกรรม
  deleteEvent: function(eventId) {
    let events = this.getAllEvents();
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(events));
    this.deleteEventFromSupabase(eventId);
  },

  // ดึงข้อมูลการลงทะเบียนทั้งหมดของ Event
  getRegistrations: function(eventId) {
    try {
      const key = `${COMED_EVENT_REGS_KEY}_${eventId || 'room_roles_69'}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [];
  },

  // ดึงการลงทะเบียนของนักศึกษาคนหนึ่ง
  getStudentRegistration: function(eventId, studentIdOrEmail) {
    if (!studentIdOrEmail) return null;
    const regs = this.getRegistrations(eventId);
    const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();
    return regs.find(r => 
      (r.studentId && r.studentId.trim().toLowerCase() === cleanQuery) ||
      (r.email && r.email.trim().toLowerCase() === cleanQuery)
    ) || null;
  },

  // ตรวจสอบจำนวนคนที่ลงใน Role นั้นแล้ว
  getRoleOccupiedCount: function(eventId, deptId, roleId) {
    const regs = this.getRegistrations(eventId);
    return regs.filter(r => r.departmentId === deptId && r.roleId === roleId).length;
  },

  // ลงทะเบียนเลือกฝ่าย
  registerRole: function(eventId, studentInfo, deptId, roleId) {
    const event = this.getActiveEvent(eventId);
    if (!event) throw new Error("ไม่พบกิจกรรมนี้ในระบบ");
    if (event.status !== 'open') throw new Error("กิจกรรมนี้ไม่ได้เปิดรับลงทะเบียนในขณะนี้");

    const dept = event.departments.find(d => d.id === deptId);
    if (!dept) throw new Error("ไม่พบฝ่ายที่เลือก");
    const role = dept.roles.find(r => r.id === roleId);
    if (!role) throw new Error("ไม่พบตำแหน่งที่เลือก");

    const regs = this.getRegistrations(event.id);
    const existingIdx = regs.findIndex(r => 
      (r.studentId && r.studentId === studentInfo.studentId) ||
      (r.email && r.email.toLowerCase() === studentInfo.email.toLowerCase())
    );

    // เช็คว่าที่นั่งเต็มหรือไม่ (ถ้าไม่ได้สลับตำแหน่งเดิมของตัวเอง)
    const occupiedSeats = regs.filter(r => r.departmentId === deptId && r.roleId === roleId).length;
    const isSelfCurrentRole = existingIdx !== -1 && regs[existingIdx].departmentId === deptId && regs[existingIdx].roleId === roleId;

    if (!isSelfCurrentRole && occupiedSeats >= role.maxSeats) {
      throw new Error(`ขออภัย ตำแหน่ง "${role.title}" (${dept.name}) เต็มจำนวนแล้ว (${role.maxSeats}/${role.maxSeats})`);
    }

    const newRecord = {
      eventId: event.id,
      studentId: studentInfo.studentId,
      studentName: studentInfo.studentName,
      nickname: studentInfo.nickname || '',
      email: studentInfo.email,
      departmentId: dept.id,
      departmentName: dept.name,
      roleId: role.id,
      roleTitle: role.title,
      note: studentInfo.note || '',
      registeredAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      regs[existingIdx] = { ...regs[existingIdx], ...newRecord, updatedAt: new Date().toISOString() };
    } else {
      regs.push(newRecord);
    }

    const key = `${COMED_EVENT_REGS_KEY}_${event.id}`;
    localStorage.setItem(key, JSON.stringify(regs));
    this.syncRegistrationToSupabase(newRecord);

    return newRecord;
  },

  // ยกเลิกการเลือกฝ่าย
  cancelRegistration: function(eventId, studentIdOrEmail) {
    const key = `${COMED_EVENT_REGS_KEY}_${eventId}`;
    let regs = this.getRegistrations(eventId);
    const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();
    
    const target = regs.find(r => 
      (r.studentId && r.studentId.trim().toLowerCase() === cleanQuery) ||
      (r.email && r.email.trim().toLowerCase() === cleanQuery)
    );

    if (target) {
      regs = regs.filter(r => r !== target);
      localStorage.setItem(key, JSON.stringify(regs));
      this.deleteRegistrationFromSupabase(eventId, target.studentId);
    }
    return target;
  },

  // Supabase Sync Methods (Safe & non-blocking with Dual Sync Architecture)
  syncEventToSupabase: async function(eventData) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;

      // 1. Try dedicated events table if exists
      sb.from('events').upsert({
        id: eventData.id,
        code: eventData.code || eventData.id.toUpperCase(),
        title: eventData.title,
        subtitle: eventData.subtitle || '',
        category: eventData.category || 'กิจกรรม',
        status: eventData.status || 'open',
        deadline: eventData.deadline ? new Date(eventData.deadline).toISOString() : null,
        departments: eventData.departments,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).catch(() => {});

      // 2. Reliable Cloud Sync via 'campaigns' table (confirmed public access)
      await sb.from('campaigns').upsert({
        id: `event_cfg_${eventData.id}`,
        code: `CFG_${eventData.id.toUpperCase()}`.substring(0, 30),
        title: `EVENT_CONFIG_${eventData.id}`,
        subtitle: eventData.title || '',
        status: eventData.status || 'open',
        closed_reason: JSON.stringify(eventData),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch(e) {
      console.warn("Supabase Event Sync Suppressed:", e);
    }
  },

  deleteEventFromSupabase: async function(eventId) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;
      sb.from('events').delete().eq('id', eventId).catch(() => {});
      await sb.from('campaigns').delete().eq('id', `event_cfg_${eventId}`);
      await sb.from('campaigns').delete().eq('id', `event_regs_${eventId}`);
    } catch(e) {
      console.warn("Supabase Event Delete Suppressed:", e);
    }
  },

  syncAllRegistrationsToCloud: async function(eventId) {
    const targetEventId = eventId || 'room_roles_69';
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;

      const regs = this.getRegistrations(targetEventId);
      await sb.from('campaigns').upsert({
        id: `event_regs_${targetEventId}`,
        code: `REGS_${targetEventId.toUpperCase()}`.substring(0, 30),
        title: `EVENT_REGISTRATIONS_${targetEventId}`,
        subtitle: `${regs.length} คนลงทะเบียนแล้ว`,
        closed_reason: JSON.stringify(regs),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch(e) {
      console.warn("Supabase Batch Regs Sync Suppressed:", e);
    }
  },

  syncRegistrationToSupabase: async function(regRecord) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;

      // 1. Try dedicated table if exists
      sb.from('event_registrations').upsert({
        id: `${regRecord.eventId}_${regRecord.studentId}`,
        event_id: regRecord.eventId,
        student_id: regRecord.studentId,
        student_name: regRecord.studentName,
        nickname: regRecord.nickname || '',
        email: regRecord.email,
        department_id: regRecord.departmentId,
        department_name: regRecord.departmentName,
        role_id: regRecord.roleId,
        role_title: regRecord.roleTitle,
        note: regRecord.note || '',
        registered_at: regRecord.registeredAt || new Date().toISOString()
      }, { onConflict: 'id' }).catch(() => {});

      // 2. Real-time Cloud Sync to 'campaigns' record for global broadcast
      await this.syncAllRegistrationsToCloud(regRecord.eventId);
    } catch(e) {
      console.warn("Supabase Registration Sync Suppressed:", e);
    }
  },

  deleteRegistrationFromSupabase: async function(eventId, studentId) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;
      const compositeId = `${eventId}_${studentId}`;
      sb.from('event_registrations').delete().eq('id', compositeId).catch(() => {});
      await this.syncAllRegistrationsToCloud(eventId);
    } catch(e) {
      console.warn("Supabase Registration Delete Suppressed:", e);
    }
  },

  // ดึงข้อมูล Real-time จาก Supabase เมื่อเปิดหน้าเว็บ หรือเมื่อมีการเปลี่ยนแปลง
  fetchCloudData: async function(eventId) {
    const targetEventId = eventId || 'room_roles_69';
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return false;

      let hasUpdate = false;

      // 1. Fetch Event Config (from campaigns cloud store)
      try {
        const { data: cfgRow } = await sb.from('campaigns')
          .select('closed_reason')
          .eq('id', `event_cfg_${targetEventId}`)
          .maybeSingle();

        if (cfgRow && cfgRow.closed_reason) {
          const parsedCfg = JSON.parse(cfgRow.closed_reason);
          if (parsedCfg && parsedCfg.departments) {
            const events = this.getAllEvents();
            const idx = events.findIndex(e => e.id === targetEventId);
            if (idx !== -1) {
              events[idx] = { ...events[idx], ...parsedCfg };
            } else {
              events.unshift(parsedCfg);
            }
            localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(events));
            hasUpdate = true;
          }
        }
      } catch(e) {}

      // 2. Fetch Registrations (from campaigns cloud store)
      try {
        const { data: regsRow } = await sb.from('campaigns')
          .select('closed_reason')
          .eq('id', `event_regs_${targetEventId}`)
          .maybeSingle();

        if (regsRow && regsRow.closed_reason) {
          const cloudRegs = JSON.parse(regsRow.closed_reason);
          if (Array.isArray(cloudRegs)) {
            const key = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
            const localStr = localStorage.getItem(key);
            const cloudStr = JSON.stringify(cloudRegs);
            if (localStr !== cloudStr) {
              localStorage.setItem(key, cloudStr);
              hasUpdate = true;
            }
          }
        } else {
          // If not in cloud yet, push local initial registrations to cloud
          const localRegs = this.getRegistrations(targetEventId);
          if (localRegs.length > 0) {
            this.syncAllRegistrationsToCloud(targetEventId);
          }
        }
      } catch(e) {}

      return hasUpdate;
    } catch(e) {
      console.warn("Supabase Fetch Cloud Data Suppressed:", e);
      return false;
    }
  },

  // สมัครรับการแจ้งเตือน Real-Time แบบทันที (Supabase Realtime Channel + Live Polling Fallback)
  subscribeRealtime: function(eventId, onUpdateCallback) {
    const targetEventId = eventId || 'room_roles_69';
    let isSubscribed = false;

    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb && typeof sb.channel === 'function') {
        const channelName = `realtime_event_${targetEventId}_${Date.now()}`;
        const channel = sb.channel(channelName);

        // Listen for changes in 'campaigns' table (which houses event_cfg and event_regs)
        channel
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'campaigns'
          }, async (payload) => {
            const rowId = payload?.new?.id || payload?.old?.id;
            if (rowId === `event_regs_${targetEventId}` || rowId === `event_cfg_${targetEventId}`) {
              await this.fetchCloudData(targetEventId);
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback({ type: 'cloud_change', payload });
              }
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              console.log(`[EventRealtime] ⚡ Connected to live channel: ${targetEventId}`);
            }
          });
      }
    } catch(e) {
      console.warn("[EventRealtime] Channel subscription warning:", e);
    }

    // High-frequency, lightweight polling backup (Every 4 seconds)
    // Ensures updates are 100% visible even if WebSocket disconnects
    const pollInterval = setInterval(async () => {
      try {
        const updated = await this.fetchCloudData(targetEventId);
        if (updated && typeof onUpdateCallback === 'function') {
          onUpdateCallback({ type: 'poll_update' });
        }
      } catch(e) {}
    }, 4000);

    return () => {
      clearInterval(pollInterval);
    };
  }
};
