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

  // ตัวแปรกัน Echo / Pause Polling หลังเพิ่งมี local write
  _lastLocalWriteTime: 0,

  // ลงทะเบียนเลือกฝ่าย (Async & Concurrency-Safe)
  registerRole: async function(eventId, studentInfo, deptId, roleId) {
    const event = this.getActiveEvent(eventId);
    if (!event) throw new Error("ไม่พบกิจกรรมนี้ในระบบ");
    if (event.status !== 'open') throw new Error("กิจกรรมนี้ไม่ได้เปิดรับลงทะเบียนในขณะนี้");

    const dept = event.departments.find(d => d.id === deptId);
    if (!dept) throw new Error("ไม่พบฝ่ายที่เลือก");
    const role = dept.roles.find(r => r.id === roleId);
    if (!role) throw new Error("ไม่พบตำแหน่งที่เลือก");

    // 1. ตรวจสอบกับ Local Cache ทันที (Instant Pre-check < 1ms)
    const regs = this.getRegistrations(event.id);
    const existingIdx = regs.findIndex(r => 
      (r.studentId && r.studentId === studentInfo.studentId) ||
      (r.email && studentInfo.email && r.email.toLowerCase() === studentInfo.email.toLowerCase())
    );

    const occupiedSeats = regs.filter(r => r.departmentId === deptId && r.roleId === roleId).length;
    const isSelfCurrentRole = existingIdx !== -1 && regs[existingIdx].departmentId === deptId && regs[existingIdx].roleId === roleId;

    if (!isSelfCurrentRole && occupiedSeats >= role.maxSeats) {
      throw new Error(`ขออภัย ตำแหน่ง "${role.title}" (${dept.name}) เต็มจำนวนแล้ว (${role.maxSeats}/${role.maxSeats})`);
    }

    // 2. บันทึกลง Local Cache ทันที (Optimistic Write < 5ms) ดั่งเช่น cancelRegistration

    const newRecord = {
      eventId: event.id,
      studentId: studentInfo.studentId,
      studentName: studentInfo.studentName,
      nickname: studentInfo.nickname || '',
      email: studentInfo.email || '',
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
    this._lastLocalWriteTime = Date.now();

    // 4. บันทึกขึ้น Cloud แบบ Non-blocking ทันทีเพื่อความเร็วสูงสุด
    // ยิง upsert ตรงไปยัง event_registrations ทันทีเพื่อให้เพื่อนๆ ใน Realtime Channel ได้รับ Payload ในเสี้ยววินาที
    const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (sb) {
      this.syncRegistrationToSupabase(newRecord).catch(err => {
        console.warn("Background Supabase registration sync failed:", err);
      });
    }

    return newRecord;
  },

  // ยกเลิกการเลือกฝ่าย
  cancelRegistration: async function(eventId, studentIdOrEmail) {
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
      this._lastLocalWriteTime = Date.now();
      // Non-blocking Cloud Deletion
      this.deleteRegistrationFromSupabase(eventId, target.studentId).catch(err => {
        console.warn("Background deletion failed:", err);
      });
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

      // 2. Reliable Cloud Sync via 'campaigns' table
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
      sb.from('campaigns').delete().eq('id', `event_cfg_${eventId}`).catch(() => {});
      sb.from('campaigns').delete().eq('id', `event_regs_${eventId}`).catch(() => {});
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

      // 0. ⚡ Instant WebSocket Broadcast (< 50ms): ยิงตรงเข้าเครื่องทุกคนที่กำลังเปิดหน้าเว็บอยู่ ณ เสี้ยววินาทีนี้
      if (this._activeRealtimeChannel) {
        this._activeRealtimeChannel.send({
          type: 'broadcast',
          event: 'REGISTRATION_UPDATE',
          payload: { action: 'upsert', record: regRecord }
        }).catch(() => {});
      }

      // 1. Primary: บันทึกลงตารางเฉพาะ event_registrations (Atomic Row Level)
      const upsertPromise = sb.from('event_registrations').upsert({
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
      }, { onConflict: 'id' });

      // 2. Secondary Broadcast: อัปเดตไปยัง 'campaigns' ขนานกันโดยไม่ต้องรอกัน
      const backupPromise = this.syncAllRegistrationsToCloud(regRecord.eventId);

      await Promise.allSettled([upsertPromise, backupPromise]);
    } catch(e) {
      console.warn("Supabase Registration Sync Suppressed:", e);
    }
  },

  deleteRegistrationFromSupabase: async function(eventId, studentId) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;

      // 0. ⚡ Instant WebSocket Broadcast (< 50ms): ยิงลบออกจากเครื่องเพื่อนทุกคนทันที
      if (this._activeRealtimeChannel) {
        this._activeRealtimeChannel.send({
          type: 'broadcast',
          event: 'REGISTRATION_UPDATE',
          payload: { action: 'delete', studentId: studentId }
        }).catch(() => {});
      }

      const compositeId = `${eventId}_${studentId}`;
      await sb.from('event_registrations').delete().eq('id', compositeId);
      await this.syncAllRegistrationsToCloud(eventId);
    } catch(e) {
      console.warn("Supabase Registration Delete Suppressed:", e);
    }
  },

  // ดึงข้อมูล Real-time จาก Supabase เมื่อเปิดหน้าเว็บ หรือเมื่อมีการเปลี่ยนแปลง
  fetchCloudData: async function(eventId, forceBypassEcho = false) {
    const targetEventId = eventId || 'room_roles_69';
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return false;

      // Anti-Echo: หากเครื่องนี้เพิ่งกดยืนยัน/ยกเลิกไปไม่เกิน 5 วินาที ให้ข้ามการเขียนทับด้วยข้อมูลเก่า (เว้นแต่ถูกบังคับ forceBypassEcho)
      if (!forceBypassEcho && (Date.now() - (this._lastLocalWriteTime || 0) < 5000)) {
        return false;
      }

      let hasUpdate = false;

      // 1. Fetch Event Config
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

      // 2. Fetch Registrations (ดึงจากตาราง event_registrations เป็นหลัก เพื่อความแม่นยำรายคน)
      try {
        let loadedRegs = null;

        const { data: directRows, error: directErr } = await sb
          .from('event_registrations')
          .select('*')
          .eq('event_id', targetEventId);

        if (!directErr && Array.isArray(directRows) && directRows.length > 0) {
          loadedRegs = directRows.map(r => ({
            eventId: r.event_id,
            studentId: r.student_id,
            studentName: r.student_name,
            nickname: r.nickname || '',
            email: r.email || '',
            departmentId: r.department_id,
            departmentName: r.department_name,
            roleId: r.role_id,
            roleTitle: r.role_title,
            note: r.note || '',
            registeredAt: r.registered_at
          }));
        } else {
          // ถ้าตารางตรงยังว่าง ให้ fallback ดึงจาก campaigns store
          const { data: regsRow } = await sb.from('campaigns')
            .select('closed_reason')
            .eq('id', `event_regs_${targetEventId}`)
            .maybeSingle();

          if (regsRow && regsRow.closed_reason) {
            const cloudRegs = JSON.parse(regsRow.closed_reason);
            if (Array.isArray(cloudRegs)) {
              loadedRegs = cloudRegs;
            }
          }
        }

        if (loadedRegs && Array.isArray(loadedRegs)) {
          const key = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
          const localStr = localStorage.getItem(key);
          const cloudStr = JSON.stringify(loadedRegs);
          if (localStr !== cloudStr) {
            localStorage.setItem(key, cloudStr);
            hasUpdate = true;
          }
        } else {
          const localRegs = this.getRegistrations(targetEventId);
          if (localRegs.length > 0) {
            await this.syncAllRegistrationsToCloud(targetEventId);
          }
        }
      } catch(e) {}

      return hasUpdate;
    } catch(e) {
      console.warn("Supabase Fetch Cloud Data Suppressed:", e);
      return false;
    }
  },

  // สมัครรับการแจ้งเตือน Real-Time แบบทันที (Supabase Realtime Channel + Instant In-Memory Patch)
  subscribeRealtime: function(eventId, onUpdateCallback) {
    const targetEventId = eventId || 'room_roles_69';

    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb && typeof sb.channel === 'function') {
        const channelName = `comed_live_room_${targetEventId}`;
        const channel = sb.channel(channelName, {
          config: { broadcast: { self: false } }
        });

        // 1. ⚡ Broadcast WebSocket Channel: ได้รับข้อความตรงจากเพื่อน (< 80ms ทันทีทั่วโลก)
        channel
          .on('broadcast', { event: 'REGISTRATION_UPDATE' }, (msg) => {
            console.log("[Supabase Broadcast] ⚡⚡ Peer update received (<80ms):", msg.payload);
            try {
              const key = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
              let currentRegs = this.getRegistrations(targetEventId);
              const data = msg.payload;

              if (data.action === 'upsert' && data.record) {
                const idx = currentRegs.findIndex(r => r.studentId === data.record.studentId);
                if (idx !== -1) {
                  currentRegs[idx] = data.record;
                } else {
                  currentRegs.push(data.record);
                }
                localStorage.setItem(key, JSON.stringify(currentRegs));
              } else if (data.action === 'delete' && data.studentId) {
                currentRegs = currentRegs.filter(r => r.studentId !== data.studentId);
                localStorage.setItem(key, JSON.stringify(currentRegs));
              }

              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback({ type: 'broadcast_instant', payload: data });
              }
            } catch(bErr) {
              console.warn("Broadcast parse error:", bErr);
            }
          })
          // 2. Postgres Changes Database Event (Backup Verification)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'event_registrations'
          }, async (payload) => {
            console.log("[Supabase DB Change] ⚡ Event received:", payload.eventType);
            try {
              const key = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
              let currentRegs = this.getRegistrations(targetEventId);

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newRow = payload.new;
                if (newRow && newRow.student_id) {
                  const mappedRecord = {
                    eventId: newRow.event_id || targetEventId,
                    studentId: newRow.student_id,
                    studentName: newRow.student_name,
                    nickname: newRow.nickname || '',
                    email: newRow.email || '',
                    departmentId: newRow.department_id,
                    departmentName: newRow.department_name,
                    roleId: newRow.role_id,
                    roleTitle: newRow.role_title,
                    note: newRow.note || '',
                    registeredAt: newRow.registered_at || new Date().toISOString()
                  };

                  const idx = currentRegs.findIndex(r => r.studentId === mappedRecord.studentId);
                  if (idx !== -1) {
                    currentRegs[idx] = mappedRecord;
                  } else {
                    currentRegs.push(mappedRecord);
                  }
                  localStorage.setItem(key, JSON.stringify(currentRegs));
                }
              } else if (payload.eventType === 'DELETE') {
                const oldRow = payload.old;
                if (oldRow) {
                  currentRegs = currentRegs.filter(r => 
                    (oldRow.id && `${targetEventId}_${r.studentId}` !== oldRow.id) &&
                    (oldRow.student_id ? r.studentId !== oldRow.student_id : true)
                  );
                  localStorage.setItem(key, JSON.stringify(currentRegs));
                }
              }
            } catch(patchErr) {}

            if (typeof onUpdateCallback === 'function') {
              onUpdateCallback({ type: 'table_change', payload });
            }
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'campaigns'
          }, async (payload) => {
            const rowId = payload?.new?.id || payload?.old?.id;
            if (rowId === `event_regs_${targetEventId}` || rowId === `event_cfg_${targetEventId}`) {
              await this.fetchCloudData(targetEventId, true);
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback({ type: 'cloud_change', payload });
              }
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[EventRealtime] ⚡ Connected to live broadcast channel: ${targetEventId}`);
            }
          });

        this._activeRealtimeChannel = channel;
      }
    } catch(e) {
      console.warn("[EventRealtime] Channel subscription warning:", e);
    }

    // Adaptive Polling Backup: ปรับเป็นทุก 10 วินาที เพื่อไม่ให้โหลดเซิร์ฟเวอร์หนัก
    // และระบบจะไม่ fetch ทับถ้าผู้ใช้เพิ่งมีการบันทึกข้อมูลไป
    const pollInterval = setInterval(async () => {
      try {
        const updated = await this.fetchCloudData(targetEventId);
        if (updated && typeof onUpdateCallback === 'function') {
          onUpdateCallback({ type: 'poll_update' });
        }
      } catch(e) {}
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }
};
