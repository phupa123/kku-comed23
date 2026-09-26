/**
 * COMED Suite - Universal Page Intro Controller (Blackboard Games & Cosmic Style)
 * Automatically renders a unique themed intro screen on Page Reload (F5/Refresh)
 * or first visit per session, tailored to each specific page's purpose and style.
 */
(function () {
  // Page Configuration Registry
  const PAGE_CONFIGS = {
    'index.html': {
      theme: 'cyber',
      icon: 'sparkles',
      badge: 'COMED 23 CENTRAL PORTAL',
      titleMain: 'COMED',
      titleSpan: 'PORTAL',
      subtitle: 'ระบบศูนย์รวมบริการสารสนเทศและกิจกรรมดิจิทัล • สาขาวิชาคอมพิวเตอร์ศึกษา',
      accentColor: '#f97316',
      accentGradient: 'from-orange-500 via-amber-400 to-sky-400',
      steps: [
        { at: 25, status: 'INITIALIZING ECOSYSTEM...' },
        { at: 60, status: 'VERIFYING STUDENT SESSIONS...' },
        { at: 90, status: 'PREPARING DASHBOARD...' },
        { at: 100, status: 'WELCOME TO COMED 23!' }
      ]
    },
    'index-admin.html': {
      theme: 'admin',
      icon: 'shield-check',
      badge: 'COMMAND CENTER & METRICS',
      titleMain: 'PORTAL',
      titleSpan: 'ADMIN',
      subtitle: 'แผงควบคุมระบบส่วนกลาง การจัดการสิทธิ์และภาพรวมสถิติ',
      accentColor: '#ef4444',
      accentGradient: 'from-rose-500 via-orange-500 to-amber-400',
      steps: [
        { at: 25, status: 'AUTHENTICATING ADMIN PRIVILEGES...' },
        { at: 60, status: 'CHECKING SYSTEM HEALTH...' },
        { at: 90, status: 'SYNCING EVENT LOGS...' },
        { at: 100, status: 'ADMIN ACCESS GRANTED' }
      ]
    },
    'upload.html': {
      theme: 'cloud',
      icon: 'upload-cloud',
      badge: 'CLOUD UPLOAD & MEDIA VAULT',
      titleMain: 'MEDIA',
      titleSpan: 'UPLOADER',
      subtitle: 'ระบบส่งสลิป บิลค่าใช้จ่าย และคลังจัดเก็บไฟล์ความเร็วสูง',
      accentColor: '#38bdf8',
      accentGradient: 'from-sky-500 via-blue-500 to-indigo-500',
      steps: [
        { at: 25, status: 'CONNECTING STORAGE CDNs...' },
        { at: 60, status: 'PREPARING MULTI-PROVIDER ENGINE...' },
        { at: 90, status: 'READY FOR FILE QUEUE...' },
        { at: 100, status: 'UPLOADER ONLINE' }
      ]
    },
    'upload-admin.html': {
      theme: 'admin',
      icon: 'database',
      badge: 'STORAGE ADMIN & VERIFICATION',
      titleMain: 'UPLOAD',
      titleSpan: 'AUDIT',
      subtitle: 'ตรวจสอบไฟล์อัปโหลด สลิปหลักฐาน และความจุโควตาผู้ใช้',
      accentColor: '#f59e0b',
      accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
      steps: [
        { at: 25, status: 'QUERYING MEDIA RECORDS...' },
        { at: 60, status: 'SCANNING STORAGE PROVIDERS...' },
        { at: 90, status: 'UPDATING VERIFIED LOGS...' },
        { at: 100, status: 'AUDIT REPOSITORIES LOADED' }
      ]
    },
    'payment.html': {
      theme: 'finance',
      icon: 'wallet',
      badge: 'TREASURY & EXPENSE TRACKER',
      titleMain: 'TREASURY',
      titleSpan: 'PAYMENT',
      subtitle: 'ระบบบันทึกเงินกองกลาง รายรับ-รายจ่าย โปร่งใส ตรวจสอบได้',
      accentColor: '#10b981',
      accentGradient: 'from-emerald-500 via-teal-400 to-cyan-400',
      steps: [
        { at: 25, status: 'SYNCING TREASURY LEDGER...' },
        { at: 60, status: 'CALCULATING ROSTER BALANCES...' },
        { at: 90, status: 'ENCRYPTING FINANCIAL DATA...' },
        { at: 100, status: 'LEDGER SYNCHRONIZED' }
      ]
    },
    'payment-admin.html': {
      theme: 'admin',
      icon: 'coins',
      badge: 'FINANCIAL GOVERNANCE',
      titleMain: 'TREASURY',
      titleSpan: 'ADMIN',
      subtitle: 'แผงจัดการยอดเงินกองกลาง อนุมัติการชำระ และส่งออกบัญชี',
      accentColor: '#059669',
      accentGradient: 'from-emerald-600 via-teal-500 to-amber-400',
      steps: [
        { at: 25, status: 'FETCHING BANK TRANSACTION LOGS...' },
        { at: 60, status: 'RECONCILING SUPABASE PAYMENTS...' },
        { at: 90, status: 'PREPARING AUDIT SHEETS...' },
        { at: 100, status: 'FINANCE CONSOLE READY' }
      ]
    },
    'shortlink.html': {
      theme: 'neon',
      icon: 'link-2',
      badge: 'HIGH-SPEED URL REDIRECTOR',
      titleMain: 'FAST',
      titleSpan: 'SHORTLINK',
      subtitle: 'ระบบย่อลิงก์ปลอดภัย ติดตามสถิติคลิก และกำหนดรหัสผ่าน',
      accentColor: '#a855f7',
      accentGradient: 'from-purple-500 via-pink-500 to-orange-400',
      steps: [
        { at: 25, status: 'RESOLVING ROUTING NODES...' },
        { at: 60, status: 'INDEXING ACTIVE LINKS...' },
        { at: 90, status: 'CACHING EDGE REDIRECTS...' },
        { at: 100, status: 'EDGE GATEWAY ACTIVE' }
      ]
    },
    'shortlink-admin.html': {
      theme: 'admin',
      icon: 'activity',
      badge: 'EDGE ROUTE CONTROLLER',
      titleMain: 'SHORTLINK',
      titleSpan: 'ANALYTICS',
      subtitle: 'สถิติการเข้าชม การบล็อกลิงก์ และจัดการโดเมนปลายทาง',
      accentColor: '#8b5cf6',
      accentGradient: 'from-purple-600 via-indigo-500 to-sky-400',
      steps: [
        { at: 25, status: 'READING EDGE ANALYTICS...' },
        { at: 60, status: 'AUDITING SECURE SHORTLINKS...' },
        { at: 90, status: 'PREPARING TRAFFIC CHARTS...' },
        { at: 100, status: 'NETWORK MONITOR ONLINE' }
      ]
    },
    'settings.html': {
      theme: 'cyber',
      icon: 'sliders',
      badge: 'USER PREFERENCES & THEMES',
      titleMain: 'SYSTEM',
      titleSpan: 'SETTINGS',
      subtitle: 'ปรับแต่งโปรไฟล์ การแจ้งเตือน และการเชื่อมต่อบัญชี KKU',
      accentColor: '#6366f1',
      accentGradient: 'from-indigo-500 via-purple-500 to-pink-400',
      steps: [
        { at: 25, status: 'LOADING PROFILE CACHE...' },
        { at: 60, status: 'INITIALIZING NOTIFICATION HOOKS...' },
        { at: 90, status: 'APPLYING DISPLAY THEMES...' },
        { at: 100, status: 'PREFERENCES LOADED' }
      ]
    },
    'settings-admin.html': {
      theme: 'admin',
      icon: 'shield-alert',
      badge: 'SECURITY & GLOBAL REGISTRY',
      titleMain: 'SECURITY',
      titleSpan: 'SETTINGS',
      subtitle: 'กำหนดค่าระบบกลาง API Keys โหมดซ่อมบำรุง และสิทธิ์ Master',
      accentColor: '#e11d48',
      accentGradient: 'from-rose-600 via-red-500 to-amber-500',
      steps: [
        { at: 25, status: 'VERIFYING MASTER ENCRYPTION...' },
        { at: 60, status: 'INSPECTING ENVIRONMENT SECRETS...' },
        { at: 90, status: 'SYNCHRONIZING POLICY ENGINE...' },
        { at: 100, status: 'MASTER CONTROL READY' }
      ]
    },
    'event.html': {
      theme: 'event',
      icon: 'calendar',
      badge: 'COMMUNITY EVENTS & TIMELINE',
      titleMain: 'COMED',
      titleSpan: 'EVENTS',
      subtitle: 'ปฏิทินกิจกรรม สัมมนา และตารางนัดหมายสำคัญของสาขา',
      accentColor: '#ec4899',
      accentGradient: 'from-pink-500 via-rose-500 to-amber-400',
      steps: [
        { at: 25, status: 'LOADING EVENT TIMELINE...' },
        { at: 60, status: 'SYNCING PARTICIPANT RSVPS...' },
        { at: 90, status: 'FETCHING LOCATION COORDINATES...' },
        { at: 100, status: 'SCHEDULE READY' }
      ]
    },
    'event-admin.html': {
      theme: 'admin',
      icon: 'calendar-check',
      badge: 'EVENT COORDINATION & ATTENDANCE',
      titleMain: 'EVENT',
      titleSpan: 'MANAGER',
      subtitle: 'จัดการกิจกรรม ลงชื่อเข้าร่วม และพิมพ์ใบประกาศนียบัตร',
      accentColor: '#db2777',
      accentGradient: 'from-pink-600 via-rose-600 to-orange-500',
      steps: [
        { at: 25, status: 'INITIALIZING ROSTER SCANNER...' },
        { at: 60, status: 'QUERYING EVENT CHECK-INS...' },
        { at: 90, status: 'COMPILING ATTENDANCE STATS...' },
        { at: 100, status: 'COORDINATOR READY' }
      ]
    },
    'eventclass.html': {
      theme: 'education',
      icon: 'graduation-cap',
      badge: 'ACADEMIC CLASSROOM & WORKSHOP',
      titleMain: 'CLASS',
      titleSpan: 'WORKSPACE',
      subtitle: 'ห้องเรียนดิจิทัล คลังสไลด์ และการส่งงานโปรเจกต์รายวิชา',
      accentColor: '#0ea5e9',
      accentGradient: 'from-sky-500 via-cyan-400 to-emerald-400',
      steps: [
        { at: 25, status: 'CONNECTING VIRTUAL CLASSROOM...' },
        { at: 60, status: 'SYNCING COURSE ASSIGNMENTS...' },
        { at: 90, status: 'PREPARING LESSON REPOSITORIES...' },
        { at: 100, status: 'CLASSROOM ONLINE' }
      ]
    },
    'eventclass-admin.html': {
      theme: 'admin',
      icon: 'award',
      badge: 'COURSEWORK & EVALUATION',
      titleMain: 'CLASS',
      titleSpan: 'ADMIN',
      subtitle: 'ประเมินการส่งงาน ให้คะแนน และสรุปรายงานผลการเรียน',
      accentColor: '#0284c7',
      accentGradient: 'from-sky-600 via-indigo-600 to-teal-400',
      steps: [
        { at: 25, status: 'LOADING SUBMISSION QUEUES...' },
        { at: 60, status: 'EVALUATING STUDENT PROGRESS...' },
        { at: 90, status: 'COMPILING GRADE MATRICES...' },
        { at: 100, status: 'EVALUATION CONSOLE READY' }
      ]
    },
    'storage-admin.html': {
      theme: 'admin',
      icon: 'server',
      badge: 'ENTERPRISE DRIVE CLUSTER',
      titleMain: 'STORAGE',
      titleSpan: 'ADMIN',
      subtitle: 'จัดการโควตา 5GB จัดสรรเซิร์ฟเวอร์ และตรวจสอบลิงก์แชร์ทั้งหมด',
      accentColor: '#f97316',
      accentGradient: 'from-orange-600 via-amber-500 to-sky-400',
      steps: [
        { at: 25, status: 'CONNECTING STORAGE POOLS...' },
        { at: 60, status: 'AUDITING ACTIVE SHARED LINKS...' },
        { at: 90, status: 'SYNCING SUPABASE CLUSTERS...' },
        { at: 100, status: 'CLOUD MASTER CONSOLE READY' }
      ]
    },
    'admin.html': {
      theme: 'admin',
      icon: 'shield',
      badge: 'MASTER CONTROL SUITE',
      titleMain: 'MASTER',
      titleSpan: 'ADMIN',
      subtitle: 'แผงควบคุมหลักสำหรับผู้ดูแลระบบสูงสุด COMED 23',
      accentColor: '#dc2626',
      accentGradient: 'from-red-600 via-orange-500 to-amber-400',
      steps: [
        { at: 25, status: 'CHECKING ROOT CREDENTIALS...' },
        { at: 60, status: 'AUDITING SECURITY POLICIES...' },
        { at: 90, status: 'ENGAGING SYSTEM FIREWALLS...' },
        { at: 100, status: 'ACCESS UNLOCKED' }
      ]
    },
    'maintenance.html': {
      theme: 'maintenance',
      icon: 'wrench',
      badge: 'SYSTEM UPGRADE & MAINTENANCE',
      titleMain: 'SYSTEM',
      titleSpan: 'MAINTENANCE',
      subtitle: 'ระบบอยู่ระหว่างการปิดปรับปรุงเพื่ออัปเกรดประสิทธิภาพการทำงาน',
      accentColor: '#f59e0b',
      accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
      steps: [
        { at: 25, status: 'APPLYING INFRASTRUCTURE PATCHES...' },
        { at: 60, status: 'OPTIMIZING DATABASE INDEXES...' },
        { at: 90, status: 'CHECKING RECOVERY PROTOCOLS...' },
        { at: 100, status: 'MAINTENANCE NOTICE ACTIVE' }
      ]
    }
  };

  function getCurrentPageName() {
    const path = window.location.pathname;
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || 'index.html';
    return lastPart.toLowerCase().split('?')[0].split('#')[0] || 'index.html';
  }

  function injectIntroStyles() {
    if (document.getElementById('comedIntroStyles')) return;
    const style = document.createElement('style');
    style.id = 'comedIntroStyles';
    style.textContent = `
      #comedUniversalIntro {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Prompt', 'Plus Jakarta Sans', sans-serif;
      }
      #comedUniversalIntro.intro-dismissed {
        opacity: 0;
        transform: scale(1.05);
        pointer-events: none;
      }
      .comed-intro-stars {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 1;
      }
      .comed-intro-star-1 {
        width: 1px;
        height: 1px;
        background: transparent;
        box-shadow: 120px 300px #fff, 450px 120px #fff, 800px 600px #fff, 1200px 300px #fff, 1500px 800px #fff, 300px 900px #fff, 950px 1100px #fff, 1600px 400px #fff;
        animation: comedIntroStarAnim 60s linear infinite;
      }
      .comed-intro-star-2 {
        width: 2px;
        height: 2px;
        background: transparent;
        box-shadow: 200px 500px #fff, 600px 250px #fff, 1100px 800px #fff, 1400px 150px #fff, 400px 1200px #fff, 850px 450px #fff;
        animation: comedIntroStarAnim 100s linear infinite;
      }
      @keyframes comedIntroStarAnim {
        from { transform: translateY(0px); }
        to { transform: translateY(-1200px); }
      }
      .comed-intro-title {
        color: #fff;
        text-align: center;
        font-weight: 900;
        letter-spacing: 3px;
        animation: comedFadeUp 1s ease-out forwards;
      }
      .comed-intro-title span {
        background: -webkit-linear-gradient(white, #475569);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      @keyframes comedFadeUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      /* === PAGE TRANSITION OVERLAY (WARP CURTAIN & LASER BAR) === */
      #comedTransitionCurtain {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
        pointer-events: none;
        opacity: 0;
        transform: scale(0.96);
        transition: opacity 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      #comedTransitionCurtain.curtain-active {
        opacity: 1;
        transform: scale(1);
        pointer-events: all;
      }
      #comedLaserBar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        width: 0%;
        background: linear-gradient(90deg, #f97316, #38bdf8, #ec4899);
        box-shadow: 0 0 12px rgba(249, 115, 22, 0.8), 0 0 4px #fff;
        z-index: 100000;
        pointer-events: none;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Smooth Page Navigation Transition Handler
   * Intercepts internal links to provide a seamless futuristic transition
   */
  function setupPageTransitions() {
    // Inject transition-specific styles
    if (!document.getElementById('comedTransitionExtraStyles')) {
      const ts = document.createElement('style');
      ts.id = 'comedTransitionExtraStyles';
      ts.textContent = `
        /* === BUBBLE BACKGROUND === */
        .comed-bubble {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          box-shadow: inset 0 0 25px rgba(255,255,255,0.25);
          animation: comedBubbleFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        .comed-bubble:nth-child(2) { position: absolute; zoom: 0.45; left: 5%; top: 10%; animation-delay: -4s; }
        .comed-bubble:nth-child(3) { position: absolute; zoom: 0.45; right: 8%; top: 15%; animation-delay: -6s; }
        .comed-bubble:nth-child(4) { position: absolute; zoom: 0.35; left: 15%; bottom: 20%; animation-delay: -3s; }
        .comed-bubble:nth-child(5) { position: absolute; zoom: 0.5; right: 5%; bottom: 25%; animation-delay: -5s; }
        @keyframes comedBubbleFloat {
          0%,100% { transform: translateY(-20px); }
          50%     { transform: translateY(20px); }
        }
        .comed-bubble::before {
          content: '';
          position: absolute;
          top: 50px; left: 45px;
          width: 30px; height: 30px;
          border-radius: 50%;
          background: #fff;
          z-index: 10;
          filter: blur(2px);
        }
        .comed-bubble::after {
          content: '';
          position: absolute;
          top: 80px; left: 80px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #fff;
          z-index: 10;
          filter: blur(2px);
        }
        .comed-bubble span {
          position: absolute;
          border-radius: 50%;
        }
        .comed-bubble span:nth-child(1) { inset:10px; border-left:15px solid #0fb4ff; filter:blur(8px); }
        .comed-bubble span:nth-child(2) { inset:10px; border-right:15px solid #ff4484; filter:blur(8px); }
        .comed-bubble span:nth-child(3) { inset:10px; border-top:15px solid #ffeb3b; filter:blur(8px); }
        .comed-bubble span:nth-child(4) { inset:30px; border-left:15px solid #ff4484; filter:blur(12px); }
        .comed-bubble span:nth-child(5) { inset:10px; border-bottom:10px solid #fff; filter:blur(8px); transform:rotate(330deg); }

        /* === ROBOT & PROGRESS CONTAINER === */
        .comed-tl-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          gap: 20px;
        }

        /* 1. Robot Character (Proper hierarchy, no overlap) */
        .comed-tl-robot {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .comed-tl-head {
          position: relative;
          width: 64px;
          height: 64px;
          background-color: #0f172a;
          border: 2px solid #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.4), inset -3px -3px 0 rgba(255,255,255,0.15);
          animation: comedTlHead 1.6s ease-in-out infinite alternate;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .comed-tl-eye {
          width: 8px;
          height: 8px;
          background: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 8px #38bdf8;
          animation: comedTlBlink 3.2s infinite;
        }
        .comed-tl-circ {
          position: relative;
          width: 110px;
          height: 70px;
          margin-top: -12px;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .comed-tl-body {
          position: relative;
          width: 90px;
          height: 60px;
          background-color: #0f172a;
          border: 2px solid #38bdf8;
          border-radius: 20px 20px 24px 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1);
          animation: comedTlBody 1.6s ease-in-out infinite alternate;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .comed-tl-body::after {
          content: '';
          width: 24px;
          height: 4px;
          background: #38bdf8;
          border-radius: 2px;
          box-shadow: 0 0 6px #38bdf8;
        }
        .comed-tl-hands {
          display: none;
        }

        @keyframes comedTlHead {
          0%   { transform: translateY(0); }
          100% { transform: translateY(6px); }
        }
        @keyframes comedTlBody {
          0%   { transform: translateY(-2px); }
          100% { transform: translateY(3px); }
        }
        @keyframes comedTlBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        /* 2. Loading text */
        .comed-tl-load-text {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: 4px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .comed-tl-dots::after {
          content: '.';
          animation: comedDots 1.5s steps(4, end) infinite;
        }
        @keyframes comedDots {
          0%, 20%  { content: ''; }
          40%      { content: '.'; }
          60%      { content: '..'; }
          80%, 100%{ content: '...'; }
        }

        /* 3. Loading Bar System */
        .comed-tl-bar-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .comed-tl-loader {
          position: relative;
          background-color: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          height: 12px;
          width: 280px;
          padding: 2px;
          box-sizing: border-box;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(56, 189, 248, 0.15);
        }
        .comed-tl-bar {
          position: relative;
          background: linear-gradient(90deg, #f97316, #eab308, #10b981);
          width: 20%;
          height: 100%;
          border-radius: 999px;
          animation: comedTlLoadBar 2.5s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(249, 115, 22, 0.8);
        }
        @keyframes comedTlLoadBar {
          0%   { width: 5%; }
          50%  { width: 70%; }
          100% { width: 100%; }
        }
        .comed-tl-status-sub {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
      `;
      document.head.appendChild(ts);
    }

    let curtain = document.getElementById('comedTransitionCurtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.id = 'comedTransitionCurtain';
      curtain.innerHTML = `
        <div class="comed-intro-stars">
          <div class="comed-intro-star-1"></div>
        </div>

        <!-- Floating Bubble Orbs -->
        <div class="comed-bubble"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="comed-bubble"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="comed-bubble"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="comed-bubble"><span></span><span></span><span></span><span></span><span></span></div>

        <!-- Fully Separated, Non-overlapping Center Stack -->
        <div class="comed-tl-box">
          <div class="comed-tl-robot">
            <div class="comed-tl-head">
              <div class="comed-tl-eye"></div>
              <div class="comed-tl-eye"></div>
            </div>
            <div class="comed-tl-circ">
              <div class="comed-tl-body"></div>
            </div>
          </div>

          <div class="comed-tl-load-text">
            <span>LOADING</span><span class="comed-tl-dots"></span>
          </div>

          <div class="comed-tl-bar-wrap">
            <div class="comed-tl-loader">
              <div class="comed-tl-bar"></div>
            </div>
            <span class="comed-tl-status-sub">WARPING TO PAGE</span>
          </div>
        </div>
      `;
      document.body.appendChild(curtain);
    }

    let laser = document.getElementById('comedLaserBar');
    if (!laser) {
      laser = document.createElement('div');
      laser.id = 'comedLaserBar';
      document.body.appendChild(laser);
    }

    // Intercept clicks on standard <a> links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore hash links, javascript links, downloads, external tabs or external domains
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank' || link.hasAttribute('download')) {
        return;
      }

      // Check if target is internal HTML page
      const isInternal = !href.startsWith('http://') && !href.startsWith('https://') || href.includes(window.location.hostname);
      if (!isInternal) return;

      // Don't intercept if navigating to same URL with same hash
      const targetUrl = new URL(href, window.location.href);
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash === window.location.hash) {
        return;
      }

      e.preventDefault();

      // Trigger Laser and Curtain Transition
      if (laser) laser.style.width = '60%';
      if (curtain) curtain.classList.add('curtain-active');

      setTimeout(() => {
        if (laser) laser.style.width = '100%';
        setTimeout(() => {
          window.location.href = href;
        }, 150);
      }, 150);
    });

    // Handle back/forward navigation cache restore
    window.addEventListener('pageshow', (event) => {
      if (curtain) curtain.classList.remove('curtain-active');
      if (laser) laser.style.width = '0%';
    });
  }


  function createIntroElement(cfg) {
    const introDiv = document.createElement('div');
    introDiv.id = 'comedUniversalIntro';
    introDiv.innerHTML = `
      <div class="comed-intro-stars">
        <div class="comed-intro-star-1"></div>
        <div class="comed-intro-star-2"></div>
      </div>

      <!-- Ambient Glow Orbs -->
      <div class="fixed top-1/4 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="fixed bottom-1/4 right-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="text-center space-y-6 max-w-lg px-6 relative z-10">
        <!-- Floating Themed Icon Emblem -->
        <div class="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
          <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr ${cfg.accentGradient} opacity-30 blur-xl animate-pulse"></div>
          <div class="w-full h-full rounded-3xl bg-gradient-to-br ${cfg.accentGradient} p-[1.5px] shadow-2xl animate-bounce" style="animation-duration: 2.8s;">
            <div class="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center backdrop-blur-md">
              <i data-lucide="${cfg.icon}" class="w-9 h-9 sm:w-11 sm:h-11 text-white"></i>
            </div>
          </div>
        </div>

        <!-- Typography & Page Meta -->
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-orange-300 text-[10px] font-mono tracking-widest uppercase shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>${cfg.badge}</span>
          </div>
          <h1 class="comed-intro-title text-2xl sm:text-4xl uppercase">
            ${cfg.titleMain} <span>${cfg.titleSpan}</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 font-sans tracking-wide max-w-md mx-auto leading-relaxed">
            ${cfg.subtitle}
          </p>
        </div>

        <!-- Progress Indicator Bar -->
        <div class="space-y-2 max-w-xs mx-auto pt-1">
          <div class="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div id="comedIntroBar" class="h-full bg-gradient-to-r ${cfg.accentGradient} rounded-full transition-all duration-300 w-0 shadow-sm"></div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span id="comedIntroStatusText">BOOTING MODULE...</span>
            <span id="comedIntroPercentText" class="font-bold text-slate-400">0%</span>
          </div>
        </div>
      </div>
    `;
    return introDiv;
  }

  function startIntroAnimation(introDiv, cfg) {
    document.body.prepend(introDiv);
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const pBar = document.getElementById('comedIntroBar');
    const pPercent = document.getElementById('comedIntroPercentText');
    const pStatus = document.getElementById('comedIntroStatusText');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }

      if (pBar) pBar.style.width = progress + '%';
      if (pPercent) pPercent.textContent = progress + '%';

      const curStep = cfg.steps.find(s => progress <= s.at);
      if (curStep && pStatus) pStatus.textContent = curStep.status;

      if (progress === 100) {
        setTimeout(() => {
          introDiv.classList.add('intro-dismissed');
          setTimeout(() => {
            introDiv.remove();
          }, 850);
        }, 300);
      }
    }, 45);
  }

  function initUniversalIntro() {
    injectIntroStyles();
    setupPageTransitions();

    const pageName = getCurrentPageName();
    // storage.html already has its custom inline intro, skip intro overlay to avoid double loading
    if (pageName === 'storage.html') return;

    const cfg = PAGE_CONFIGS[pageName];
    if (!cfg) return;

    // Detect if page was reloaded (F5 / Refresh)
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = (navEntries.length > 0 && navEntries[0].type === 'reload') || (performance.navigation && performance.navigation.type === 1);
    const sessionKey = 'comed_intro_seen_' + pageName;
    const hasSeen = sessionStorage.getItem(sessionKey);

    // Trigger on reload or first visit in this browser session
    if (!isReload && hasSeen) {
      return;
    }

    sessionStorage.setItem(sessionKey, 'true');
    const introElement = createIntroElement(cfg);
    startIntroAnimation(introElement, cfg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalIntro);
  } else {
    initUniversalIntro();
  }
})();
