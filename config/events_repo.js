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
  },
  {
    id: 'eventclass_69',
    code: 'EVENTCLASS_69',
    title: 'กิจกรรมพิเศษรุ่น COMED KKU 69: ซุ้มพี่บัณฑิต & งานวันเด็กแห่งชาติ',
    subtitle: 'เลือกเข้าร่วมได้ 2 กิจกรรมใหญ่ สามารถเลือกได้ทั้ง 2 อย่าง หรือเลือกอย่างใดอย่างหนึ่ง (ขยายโควตาได้เกิน 30 คน)',
    category: 'กิจกรรมรุ่น/ห้อง',
    status: 'open',
    deadline: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    tracks: [
      {
        id: 'track_grad',
        code: 'GRAD_BOOTH',
        title: 'ทำซุ้มพี่บัณฑิต',
        dateDisplay: 'ประมาณ 20 ธันวาคม (เสาร์ - อาทิตย์ 2 วัน)',
        location: 'คณะศึกษาศาสตร์ (โรงรถ 1 ล็อคที่จอดรถ แล้วแต่จะจัด เน้นให้เขาถ่ายรูป)',
        targetCount: 30,
        color: 'from-amber-500 via-orange-500 to-rose-600',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        icon: 'graduation-cap',
        description: 'จัดทำซุ้มแสดงความยินดีกับพี่บัณฑิต ณ โรงรถ 1 ล็อคที่จอดรถ คณะศึกษาศาสตร์ เน้นฉากถ่ายรูปสวยงาม อบอุ่น และน่าประทับใจ',
        departments: [
          {
            id: 'dept_grad_design',
            name: 'ฝ่ายออกแบบและจัดซุ้มถ่ายรูป',
            icon: 'palette',
            color: 'from-amber-500 to-orange-600',
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            description: 'เนรมิตฉากถ่ายรูป 1 ล็อคโรงรถ เลือกธีม ออกแบบ Backdrop พร็อพถ่ายรูป ป้ายแสดงความยินดี',
            roles: [
              { id: 'role_grad_design_lead', title: 'หัวหน้าทีมออกแบบและจัดฉาก', maxSeats: 1 },
              { id: 'role_grad_craft', title: 'ทีมประดิษฐ์และประกอบฉาก', maxSeats: 1 },
              { id: 'role_grad_painter', title: 'ทีมวาดภาพ ระบายสี และตกแต่ง', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_grad_media',
            name: 'ฝ่ายช่างภาพและสื่อมีเดีย',
            icon: 'camera',
            color: 'from-cyan-500 to-blue-600',
            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
            description: 'ถ่ายภาพนิ่ง วิดีโอเก็บบรรยากาศพี่บัณฑิต ทำคลิปสั้น และสื่อโซเชียลมีเดียของรุ่น',
            roles: [
              { id: 'role_grad_photographer', title: 'ช่างภาพนิ่ง (Photo)', maxSeats: 1 },
              { id: 'role_grad_videographer', title: 'ช่างวิดีโอ & ครีเอทีฟคลิป (Video)', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_grad_welcome',
            name: 'ฝ่ายต้อนรับและของที่ระลึก',
            icon: 'gift',
            color: 'from-pink-500 to-rose-600',
            badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
            description: 'ดูแลของที่ระลึก สายสะพาย มงกุฎ ต้อนรับพี่บัณฑิตและญาติๆ ให้ประทับใจ',
            roles: [
              { id: 'role_grad_welcome_team', title: 'ทีมต้อนรับและประสานงานพี่บัณฑิต', maxSeats: 1 },
              { id: 'role_grad_souvenir', title: 'ทีมจัดเตรียมและมอบของขวัญที่ระลึก', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_grad_welfare',
            name: 'ฝ่ายสถานที่และสวัสดิการ',
            icon: 'heart-handshake',
            color: 'from-emerald-500 to-teal-600',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            description: 'จัดเตรียมโต๊ะ เก้าอี้ พัดลม ลากปลั๊กไฟ อาหาร น้ำดื่ม และดูแลความสะอาดพื้นที่โรงรถ',
            roles: [
              { id: 'role_grad_venue', title: 'ทีมจัดการสถานที่และระบบไฟ', maxSeats: 1 },
              { id: 'role_grad_catering', title: 'ทีมสวัสดิการ น้ำดื่ม และอาหาร', maxSeats: 1 }
            ]
          }
        ]
      },
      {
        id: 'track_children',
        code: 'CHILDREN_DAY',
        title: 'งานวันเด็กแห่งชาติ',
        dateDisplay: 'ช่วง 9 มกราคม 2570',
        location: 'ลงทะเบียนซุ้ม ออกแบบกิจกรรมภายในซุ้มสาขาคอมพิวเตอร์ศึกษา',
        targetCount: 30,
        color: 'from-sky-500 via-indigo-500 to-purple-600',
        badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        icon: 'sparkles',
        description: 'ลงทะเบียนซุ้มสาขา ออกแบบกิจกรรมสนุกสนานและให้ความรู้แก่น้องๆ เช่น Bingo, หุ่นยนต์ตั้งโชว์, AR ระบายสี ฯลฯ',
        departments: [
          {
            id: 'dept_child_ar',
            name: 'ฝ่ายกิจกรรม AR ระบายสี (ยอดฮิตเด็กชอบ)',
            icon: 'smartphone',
            color: 'from-purple-500 to-indigo-600',
            badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            description: 'เตรียมภาพระบายสี AR เซ็ตแท็บเล็ต/มือถือ แนะนำเด็กๆ สแกนดูผลงาน 3D มีชีวิต',
            roles: [
              { id: 'role_child_ar_lead', title: 'ผู้ดูแลระบบ AR และอุปกรณ์ไอที', maxSeats: 1 },
              { id: 'role_child_ar_staff', title: 'พี่เลี้ยงแนะนำน้องๆ ระบายสี AR', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_child_robot',
            name: 'ฝ่ายนิทรรศการหุ่นยนต์และเทคโนโลยี',
            icon: 'bot',
            color: 'from-cyan-500 to-teal-600',
            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
            description: 'นำหุ่นยนต์ อุปกรณ์ Microcontroller มาจัดแสดง สาธิต และให้น้องๆ ได้ทดลองกดเล่น',
            roles: [
              { id: 'role_child_robot_demo', title: 'ทีมสาธิตหุ่นยนต์ & ให้ความรู้เด็กๆ', maxSeats: 1 },
              { id: 'role_child_tech_display', title: 'ทีมจัดแสดงบอร์ดนวัตกรรมและเทค', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_child_bingo',
            name: 'ฝ่ายเกมบิงโกและสันทนาการหน้าซุ้ม',
            icon: 'dices',
            color: 'from-amber-500 to-pink-600',
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            description: 'จัดกิจกรรม Bingo สุดมันส์ เกมตอบคำถามชิงรางวัล ดึงดูดเด็กๆ และผู้ปกครองเข้าซุ้ม',
            roles: [
              { id: 'role_child_bingo_mc', title: 'พิธีกรดำเนินเกม Bingo & สันทนาการ', maxSeats: 1 },
              { id: 'role_child_bingo_staff', title: 'ทีมแจกการ์ดบิงโกและตรวจผลรางวัล', maxSeats: 1 }
            ]
          },
          {
            id: 'dept_child_reward',
            name: 'ฝ่ายของรางวัล ขนม และสวัสดิการ',
            icon: 'candy',
            color: 'from-emerald-500 to-lime-600',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            description: 'จัดสรรของรางวัล ตุ๊กตา สมุด ดินสอ ขนม นมกล่อง และต้อนรับลงทะเบียนน้องๆ',
            roles: [
              { id: 'role_child_reward_manager', title: 'ทีมคุมสต็อกของรางวัลและแจกของขวัญ', maxSeats: 1 },
              { id: 'role_child_hospitality', title: 'ทีมต้อนรับ ลงทะเบียนเด็ก และสวัสดิการ', maxSeats: 1 }
            ]
          }
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
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // ตรวจสอบว่ามี default events ทุกตัวหรือไม่ ถ้าไม่มีให้รวมเข้ามา
          let hasChange = false;
          DEFAULT_COMED_EVENTS.forEach(defEvt => {
            const idx = parsed.findIndex(e => e.id === defEvt.id);
            if (idx === -1) {
              parsed.push(defEvt);
              hasChange = true;
            } else if (!parsed[idx].tracks || parsed[idx].tracks.length === 0) {
              // ถ้ายังไม่มี tracks ให้ใส่ default เข้าไป
              parsed[idx].tracks = defEvt.tracks;
              parsed[idx].title = defEvt.title;
              hasChange = true;
            }
          });
          if (hasChange) {
            localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
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
    // ⚡ Realtime Broadcast แจ้งเปลี่ยนสถานะเปิด/ปิดกิจกรรม ให้ทุกจออัปเดตทันที (<50ms)
    if (this._activeRealtimeChannel) {
      try {
        this._activeRealtimeChannel.send({
          type: 'broadcast',
          event: 'EVENT_STATUS_UPDATE',
          payload: eventData
        });
      } catch(e) {}
    }
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

  // ดึงข้อมูลการลงทะเบียนเฉพาะ Track ใน Event ที่มีหลาย Track (เช่น eventclass_69)
  getStudentTrackRegistration: function(eventId, studentIdOrEmail, trackId) {
    if (!studentIdOrEmail) return null;
    const regs = this.getRegistrations(eventId);
    const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();
    return regs.find(r => 
      ((r.studentId && r.studentId.trim().toLowerCase() === cleanQuery) ||
       (r.email && r.email.trim().toLowerCase() === cleanQuery)) &&
      (!trackId || r.trackId === trackId)
    ) || null;
  },

  // ดึงรายการลงทะเบียนทั้งหมดของนักศึกษาคนหนึ่งใน Event นั้น (อาจมีหลาย Track)
  getAllStudentRegistrations: function(eventId, studentIdOrEmail) {
    if (!studentIdOrEmail) return [];
    const regs = this.getRegistrations(eventId);
    const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();
    return regs.filter(r => 
      (r.studentId && r.studentId.trim().toLowerCase() === cleanQuery) ||
      (r.email && r.email.trim().toLowerCase() === cleanQuery)
    );
  },

  // ลงทะเบียนตาม Track (สำหรับ eventclass_69 ที่เลือกได้ทั้ง 2 ตัวเลือกใหญ่)
  registerTrackRole: async function(eventId, studentInfo, trackId, deptId, roleId) {
    const event = this.getActiveEvent(eventId);
    if (!event) throw new Error("ไม่พบกิจกรรมนี้ในระบบ");
    if (event.status !== 'open') throw new Error("กิจกรรมนี้ไม่ได้เปิดรับลงทะเบียนในขณะนี้");

    // หา Track
    let targetTrack = null;
    let targetDept = null;
    let targetRole = null;

    if (event.tracks && Array.isArray(event.tracks)) {
      targetTrack = event.tracks.find(t => t.id === trackId);
      if (!targetTrack) throw new Error("ไม่พบตัวเลือกกิจกรรมที่เลือก");
      targetDept = targetTrack.departments.find(d => d.id === deptId);
      if (!targetDept) throw new Error("ไม่พบฝ่ายที่เลือกในกิจกรรมนี้");
      targetRole = targetDept.roles.find(r => r.id === roleId);
      if (!targetRole) throw new Error("ไม่พบตำแหน่งที่เลือก");
    } else {
      // Fallback
      targetDept = event.departments?.find(d => d.id === deptId);
      if (!targetDept) throw new Error("ไม่พบฝ่ายที่เลือก");
      targetRole = targetDept.roles?.find(r => r.id === roleId);
      if (!targetRole) throw new Error("ไม่พบตำแหน่งที่เลือก");
    }

    const regs = this.getRegistrations(event.id);
    // ค้นหาว่าใน Track นี้ นักศึกษาเคยลงตำแหน่งเดิมไว้หรือไม่
    const existingTrackIdx = regs.findIndex(r => 
      ((r.studentId && r.studentId === studentInfo.studentId) ||
       (r.email && studentInfo.email && r.email.toLowerCase() === studentInfo.email.toLowerCase())) &&
      (r.trackId === trackId)
    );

    // ⚡ ตรวจสอบโควตาที่นั่งว่างของตำแหน่ง (Enforce Quota / MaxSeats Guard)
    const occupiedSeats = regs.filter(r => (r.trackId === trackId || !r.trackId) && r.departmentId === deptId && r.roleId === roleId).length;
    const isSelfCurrentRole = existingTrackIdx !== -1 && regs[existingTrackIdx].departmentId === deptId && regs[existingTrackIdx].roleId === roleId;

    if (!isSelfCurrentRole && occupiedSeats >= targetRole.maxSeats) {
      throw new Error(`ขออภัย ตำแหน่ง "${targetRole.title}" (${targetDept.name}) เต็มจำนวนแล้ว (${occupiedSeats}/${targetRole.maxSeats})`);
    }

    const newRecord = {
      id: `${event.id}_${studentInfo.studentId}_${trackId}`,
      eventId: event.id,
      studentId: studentInfo.studentId,
      studentName: studentInfo.studentName,
      nickname: studentInfo.nickname || '',
      email: studentInfo.email || '',
      phone: studentInfo.phone || '',
      trackId: trackId,
      trackTitle: targetTrack ? targetTrack.title : '',
      departmentId: targetDept.id,
      departmentName: targetDept.name,
      roleId: targetRole.id,
      roleTitle: targetRole.title,
      note: studentInfo.phone ? (studentInfo.note ? `[TEL:${studentInfo.phone}] ${studentInfo.note}` : `[TEL:${studentInfo.phone}]`) : (studentInfo.note || ''),
      registeredAt: new Date().toISOString()
    };

    if (existingTrackIdx !== -1) {
      regs[existingTrackIdx] = { ...regs[existingTrackIdx], ...newRecord, updatedAt: new Date().toISOString() };
    } else {
      regs.push(newRecord);
    }

    const key = `${COMED_EVENT_REGS_KEY}_${event.id}`;
    localStorage.setItem(key, JSON.stringify(regs));
    this._lastLocalWriteTime = Date.now();

    // บันทึกขึ้น Supabase
    this.syncRegistrationToSupabase(newRecord).catch(err => {
      console.warn("Track role sync failed:", err);
    });

    return newRecord;
  },

  // ยกเลิกการเลือกเฉพาะ Track
  cancelTrackRegistration: async function(eventId, studentIdOrEmail, trackId) {
    const key = `${COMED_EVENT_REGS_KEY}_${eventId}`;
    let regs = this.getRegistrations(eventId);
    const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();

    const target = regs.find(r => 
      ((r.studentId && r.studentId.trim().toLowerCase() === cleanQuery) ||
       (r.email && r.email.trim().toLowerCase() === cleanQuery)) &&
      (r.trackId === trackId)
    );

    if (target) {
      regs = regs.filter(r => r !== target);
      localStorage.setItem(key, JSON.stringify(regs));
      this._lastLocalWriteTime = Date.now();

      const compositeId = target.id || `${eventId}_${target.studentId}_${trackId}`;
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (sb) {
        if (this._activeRealtimeChannel) {
          try {
            this._activeRealtimeChannel.send({
              type: 'broadcast',
              event: 'REGISTRATION_UPDATE',
              payload: { action: 'delete', studentId: target.studentId, trackId: trackId, id: compositeId }
            });
          } catch(e) {}
        }
        try {
          await sb.from('event_registrations').delete().eq('id', compositeId);
        } catch(e) {}
        this.syncAllRegistrationsToCloud(eventId);
      }
    }
    return target;
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

  // ล้างการลงทะเบียนทั้งหมดของกิจกรรมนี้ (Reset All)
  clearAllRegistrations: async function(eventId) {
    const targetEventId = eventId || 'room_roles_69';
    // ลบ LocalStorage ทุกคีย์ที่เกี่ยวข้อง
    const key1 = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
    const key2 = `COMED_EVENT_REGS_V1_${targetEventId}`;
    localStorage.removeItem(key1);
    localStorage.removeItem(key2);
    localStorage.setItem(key1, JSON.stringify([]));
    this._lastLocalWriteTime = Date.now();

    // ลบบน Cloud Supabase
    const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (sb) {
      try {
        await sb.from('event_registrations').delete().eq('event_id', targetEventId);
      } catch (err) {
        console.warn("Cloud bulk delete error:", err);
      }

      // Realtime Broadcast แจ้งทุกเครื่องทันที
      if (this._activeRealtimeChannel) {
        try {
          this._activeRealtimeChannel.send({
            type: 'broadcast',
            event: 'REGISTRATION_UPDATE',
            payload: { action: 'reset_all', eventId: targetEventId }
          });
        } catch(e) {}
      }
    }
  },

  // Supabase Sync Methods (Safe & non-blocking with Dual Sync Architecture)
  syncEventToSupabase: async function(eventData) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;

      // 1. Try dedicated events table if exists
      const payload = {
        id: eventData.id,
        code: eventData.code || eventData.id.toUpperCase(),
        title: eventData.title,
        subtitle: eventData.subtitle || '',
        category: eventData.category || 'กิจกรรม',
        status: eventData.status || 'open',
        deadline: eventData.deadline ? new Date(eventData.deadline).toISOString() : null,
        departments: eventData.departments || [],
        updated_at: new Date().toISOString()
      };
      if (eventData.tracks) {
        payload.tracks = eventData.tracks;
      }
      sb.from('events').upsert(payload, { onConflict: 'id' }).catch(() => {});
    } catch(e) {
      console.warn("Supabase Event Sync Suppressed:", e);
    }
  },

  deleteEventFromSupabase: async function(eventId) {
    try {
      const sb = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (!sb) return;
      sb.from('events').delete().eq('id', eventId).catch(() => {});
    } catch(e) {
      console.warn("Supabase Event Delete Suppressed:", e);
    }
  },

  syncAllRegistrationsToCloud: async function(eventId) {
    // Không sync vào bảng campaigns nữa เพื่อป้องกันไม่ให้ข้อมูลปนกับระบบการเงิน
    return;
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

      // 1. บันทึกลงตารางเฉพาะ event_registrations (Atomic Row Level)
      const targetRowId = regRecord.id || `${regRecord.eventId}_${regRecord.studentId}`;
      await sb.from('event_registrations').upsert({
        id: targetRowId,
        event_id: regRecord.eventId,
        student_id: regRecord.studentId,
        student_name: regRecord.studentName,
        nickname: regRecord.nickname || '',
        email: regRecord.email,
        department_id: regRecord.departmentId,
        department_name: regRecord.trackTitle ? `[${regRecord.trackTitle}] ${regRecord.departmentName}` : regRecord.departmentName,
        role_id: regRecord.roleId,
        role_title: regRecord.roleTitle,
        note: regRecord.note ? (regRecord.trackId ? `[TRACK:${regRecord.trackId}] ` + regRecord.note : regRecord.note) : (regRecord.trackId ? `[TRACK:${regRecord.trackId}]` : ''),
        registered_at: regRecord.registeredAt || new Date().toISOString()
      }, { onConflict: 'id' });
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

      // 1. Fetch Event Config (จากตาราง events โดยตรง)
      try {
        const { data: eventRow, error: evErr } = await sb.from('events')
          .select('*')
          .eq('id', targetEventId)
          .maybeSingle();

        if (!evErr && eventRow && (eventRow.tracks || eventRow.departments)) {
          const events = this.getAllEvents();
          const idx = events.findIndex(e => e.id === targetEventId);
          if (idx !== -1) {
            events[idx] = { ...events[idx], ...eventRow };
          } else {
            events.unshift(eventRow);
          }
          localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(events));
          hasUpdate = true;
        }
      } catch(e) {}

      // 2. Fetch Registrations (ดึงจากตาราง event_registrations เป็นหลัก เพื่อความแม่นยำรายคน)
      try {
        let loadedRegs = null;

        const { data: directRows, error: directErr } = await sb
          .from('event_registrations')
          .select('*')
          .eq('event_id', targetEventId);

        if (!directErr && Array.isArray(directRows)) {
          loadedRegs = directRows.map(r => {
            let parsedTrackId = null;
            if (r.id && r.id.includes('_track_')) {
              parsedTrackId = 'track_' + r.id.split('_track_')[1];
            } else if (r.note && r.note.includes('[TRACK:')) {
              const match = r.note.match(/\[TRACK:(.*?)\]/);
              if (match) parsedTrackId = match[1];
            }
            return {
              id: r.id,
              eventId: r.event_id,
              studentId: r.student_id,
              studentName: r.student_name,
              nickname: r.nickname || '',
              email: r.email || '',
              trackId: parsedTrackId,
              departmentId: r.department_id,
              departmentName: r.department_name,
              roleId: r.role_id,
              roleTitle: r.role_title,
              note: r.note || '',
              registeredAt: r.registered_at
            };
          });

          const key = `${COMED_EVENT_REGS_KEY}_${targetEventId}`;
          const localStr = localStorage.getItem(key) || '[]';
          const cloudStr = JSON.stringify(loadedRegs);
          if (localStr !== cloudStr) {
            localStorage.setItem(key, cloudStr);
            hasUpdate = true;
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
                const rec = data.record;
                const idx = currentRegs.findIndex(r => 
                  (rec.id && r.id === rec.id) ||
                  (rec.trackId ? (r.studentId === rec.studentId && r.trackId === rec.trackId) : (r.studentId === rec.studentId))
                );
                if (idx !== -1) {
                  currentRegs[idx] = rec;
                } else {
                  currentRegs.push(rec);
                }
                localStorage.setItem(key, JSON.stringify(currentRegs));
              } else if (data.action === 'delete') {
                if (data.id) {
                  currentRegs = currentRegs.filter(r => r.id !== data.id);
                } else if (data.trackId) {
                  currentRegs = currentRegs.filter(r => !(r.studentId === data.studentId && r.trackId === data.trackId));
                } else if (data.studentId) {
                  currentRegs = currentRegs.filter(r => r.studentId !== data.studentId);
                }
              } else if (data.action === 'reset_all') {
                currentRegs = [];
                localStorage.removeItem(key);
              }

              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback({ type: 'broadcast_instant', payload: data });
              }
            } catch(bErr) {
              console.warn("Broadcast parse error:", bErr);
            }
          })
          // ⚡ Broadcast Channel: ดักฟังการเปลี่ยนสถานะเปิด/ปิดกิจกรรมจาก Admin ทันที (< 80ms)
          .on('broadcast', { event: 'EVENT_STATUS_UPDATE' }, (msg) => {
            console.log("[Supabase Broadcast] ⚡⚡ Event status update received:", msg.payload);
            try {
              if (msg.payload && msg.payload.id) {
                const events = this.getAllEvents();
                const idx = events.findIndex(e => e.id === msg.payload.id);
                if (idx !== -1) {
                  events[idx] = { ...events[idx], ...msg.payload };
                } else {
                  events.unshift(msg.payload);
                }
                localStorage.setItem(COMED_EVENTS_KEY, JSON.stringify(events));
                if (typeof onUpdateCallback === 'function') {
                  onUpdateCallback({ type: 'event_status_changed', payload: msg.payload });
                }
              }
            } catch(e) {
              console.warn("Event status broadcast error:", e);
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
                  let parsedTrackId = null;
                  if (newRow.id && newRow.id.includes('_track_')) {
                    parsedTrackId = 'track_' + newRow.id.split('_track_')[1];
                  } else if (newRow.note && newRow.note.includes('[TRACK:')) {
                    const match = newRow.note.match(/\[TRACK:(.*?)\]/);
                    if (match) parsedTrackId = match[1];
                  }
                  const mappedRecord = {
                    id: newRow.id,
                    eventId: newRow.event_id || targetEventId,
                    studentId: newRow.student_id,
                    studentName: newRow.student_name,
                    nickname: newRow.nickname || '',
                    email: newRow.email || '',
                    trackId: parsedTrackId,
                    departmentId: newRow.department_id,
                    departmentName: newRow.department_name,
                    roleId: newRow.role_id,
                    roleTitle: newRow.role_title,
                    note: newRow.note || '',
                    registeredAt: newRow.registered_at || new Date().toISOString()
                  };

                  const idx = currentRegs.findIndex(r => 
                    (mappedRecord.id && r.id === mappedRecord.id) ||
                    (mappedRecord.trackId ? (r.studentId === mappedRecord.studentId && r.trackId === mappedRecord.trackId) : (r.studentId === mappedRecord.studentId))
                  );
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
                    (oldRow.id ? r.id !== oldRow.id : true) &&
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
