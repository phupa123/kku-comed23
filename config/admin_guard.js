/**
 * =========================================================================
 * CORE ADMIN SECURITY GUARD ENGINE
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบทันทีในระดับ Head (Instant Session Guard)
 * ป้องกันการเปิดดูหน้าหลังบ้านด้วย Inspect Element หรือเปิด URL ตรงๆ
 * =========================================================================
 */

(function(window) {
  'use strict';

  const ADMIN_SESSION_KEY = 'COMED_KKU69_ADMIN_LOGGED_USER';
  const ADMIN_ACCOUNTS_KEY = 'COMED_KKU69_ADMIN_ACCOUNTS_V2';

  // บัญชีผู้ดูแลระบบที่ได้รับอนุญาตอย่างเป็นทางการ (Whitelist)
  const AUTHORIZED_ADMIN_WHITELIST = [
    'thitiwut.a@kkumail.com',     // ภูผา (Super Admin)
    'phupa5874@gmail.com',        // ภูผา (ผู้ดูแลระบบ & ผู้ทดสอบระบบ - กรณีพิเศษ ไม่รวม 60 คน)
    'pichamon.sam@kkumail.com',    // หมูหวาน (Admin)
    'nattachai.p@kkumail.com'      // โอ้ (Admin)
  ];

  function getStoredAdminList() {
    try {
      const stored = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(a => (a.email || '').toLowerCase().trim());
        }
      }
    } catch (e) {}
    return AUTHORIZED_ADMIN_WHITELIST;
  }

  function verifyCurrentSession() {
    const currentPath = window.location.pathname.toLowerCase();

    // 1. ตรวจสอบว่ากำลังอยู่ที่หน้า Login หลักหรือไม่ (รองรับทั้ง /admin, /admin.html, /payment-admin, /payment-admin.html)
    const isMainAdminLogin = 
      currentPath.endsWith('admin.html') || 
      currentPath.endsWith('/admin') ||
      currentPath === '/admin' ||
      currentPath.endsWith('payment-admin.html') ||
      currentPath.endsWith('/payment-admin') ||
      currentPath === '/payment-admin';

    // 2. ดึง session ปัจจุบัน (รองรับทั้ง admin session และ user session ที่เป็น admin)
    let sessionEmail = (sessionStorage.getItem(ADMIN_SESSION_KEY) || '').toLowerCase().trim();
    if (!sessionEmail) {
      try {
        const userSessionStr = localStorage.getItem('COMED_USER_SESSION') || sessionStorage.getItem('COMED_USER_SESSION');
        if (userSessionStr) {
          const userObj = JSON.parse(userSessionStr);
          const uEmail = (userObj.email || '').toLowerCase().trim();
          if (AUTHORIZED_ADMIN_WHITELIST.includes(uEmail)) {
            sessionEmail = uEmail;
            sessionStorage.setItem(ADMIN_SESSION_KEY, uEmail); // Sync automatically
          }
        }
      } catch (e) {}
    }

    const validEmails = getStoredAdminList();

    const isAuthorized = sessionEmail && (
      AUTHORIZED_ADMIN_WHITELIST.includes(sessionEmail) || 
      validEmails.includes(sessionEmail)
    );

    if (!isAuthorized) {
      // หากอยู่ในหน้า Login หลัก (admin.html หรือ /admin หรือ payment-admin.html) ให้แสดงฟอร์มล็อกอินตามปกติ ไม่ดีดวนลูป
      if (isMainAdminLogin) {
        return false;
      }

      // หากเป็นหน้าหลังบ้านอื่นๆ แล้วยังไม่ได้ล็อกอิน ให้ redirect กลับไปหน้าล็อกอินพร้อมเก็บ returnUrl
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`admin.html?error=unauthorized_access&returnUrl=${returnUrl}`);
      return false;
    }

    return true;
  }

  // รันการตรวจสอบทันทีที่ไฟล์นี้ถูกโหลด
  const hasAccess = verifyCurrentSession();

  // Expose Helper Functions
  window.AdminSecurityGuard = {
    isAuthorized: hasAccess,
    whitelist: AUTHORIZED_ADMIN_WHITELIST,
    getCurrentAdminEmail: () => sessionStorage.getItem(ADMIN_SESSION_KEY) || null,
    logout: () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      window.location.replace('admin.html');
    }
  };

})(window);
