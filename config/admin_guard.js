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
  // สามารถเพิ่ม/แก้ไข อีเมลที่ต้องการให้เข้าหลังบ้านได้ที่นี่
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
    // หากเป็นหน้า admin.html เอง ให้ปล่อยให้แสดงหน้าจอล็อกอิน
    const currentPath = window.location.pathname.toLowerCase();
    const isMainAdminLogin = currentPath.endsWith('admin.html');

    const sessionEmail = (sessionStorage.getItem(ADMIN_SESSION_KEY) || '').toLowerCase().trim();
    const validEmails = getStoredAdminList();

    const isAuthorized = sessionEmail && (
      AUTHORIZED_ADMIN_WHITELIST.includes(sessionEmail) || 
      validEmails.includes(sessionEmail)
    );

    if (!isAuthorized) {
      if (!isMainAdminLogin) {
        // บล็อกและดีดกลับไปหน้า Login ทันที ก่อนที่เนื้อหาจะแสดง
        window.location.replace('admin.html?error=unauthorized_access');
        return false;
      }
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
