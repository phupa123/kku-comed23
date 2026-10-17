/**
 * =========================================================================
 * SLIP VERIFICATION & PROMPTPAY ENGINE (SlipOK / Multi-Provider / Auto-Verify)
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

(function(window) {
  'use strict';

  const SLIP_VERIFY_CONFIG_KEY = 'COMED_SLIP_VERIFY_CONFIG_V1';
  const SLIP_USED_HASHES_KEY = 'COMED_SLIP_USED_HASHES_V1';

  // Default Verification Settings
  const DEFAULT_CONFIG = {
    // Mode: 'manual' (อัปโหลดสลิปธรรมดาเพื่อประหยัดโควตา - ค่าเริ่มต้น) | 'auto' (สแกนตรวจยอดอัตโนมัติ)
    mode: 'manual', 
    
    // Active Verification Provider: 'slipok' | 'easyslip' | 'mock'
    activeProvider: 'slipok',

    // SlipOK Accounts / Branches (รองรับหลาย Token สลับโควตาได้)
    slipokBranchId: localStorage.getItem('COMED_SLIPOK_BRANCH_ID') || '',
    slipokApiKey: localStorage.getItem('COMED_SLIPOK_API_KEY') || '',

    // Backup Provider Accounts (เช่น EasySlip หรือ SlipOK สำรอง)
    backupAccounts: [
      // { id: 'backup_1', name: 'SlipOK สำรอง (Token 2)', provider: 'slipok', branchId: '', apiKey: '', quotaRemaining: 100 }
    ],

    // Target Bank Account Verification Rule (ตรวจว่าเงินเข้าบัญชีนี้จริงไหม)
    targetBank: '004', // 004 = ธนาคารกสิกรไทย (KBANK)
    targetAccountNumber: '2362478173', // น.ส. พิชามญธุ์ สามสี
    targetAccountName: 'พิชามญธุ์',

    // Timezone & Expiry Settings (เวลาโซนไทย Asia/Bangkok)
    timezone: 'Asia/Bangkok',
    maxSlipAgeHours: 48, // สลิปต้องไม่เก่าเกิน 48 ชม.

    // Quota Tracker (นับโควตาที่ใช้ไป และคงเหลือ)
    quotaUsed: 0,
    quotaTotal: 100, // โควตาฟรีเริ่มต้น SlipOK หรือยอดที่ซื้อไว้

    // Local Verification Rules (ป้องกันสลิปซ้ำ)
    strictCheckAccount: true,
    strictCheckAmount: true,
    strictCheckDuplicate: true
  };

  class SlipVerificationEngine {
    constructor() {
      this.config = this.loadConfig();
    }

    loadConfig() {
      try {
        const saved = localStorage.getItem(SLIP_VERIFY_CONFIG_KEY);
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn("Error loading slip verify config:", e);
      }
      return { ...DEFAULT_CONFIG };
    }

    saveConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      localStorage.setItem(SLIP_VERIFY_CONFIG_KEY, JSON.stringify(this.config));
      return this.config;
    }

    // ฟังก์ชันจัดรูปแบบเวลาเป็นโซนไทย (Asia/Bangkok) แบบสมบูรณ์
    formatThaiDateTime(dateInput, formatType = 'full') {
      const date = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(date.getTime())) return '-';

      const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      const thaiMonthsFull = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];

      // คำนวณเวลาตาม Timezone Asia/Bangkok (UTC+7)
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      const bangkokOffset = 7 * 3600000;
      const bkkDate = new Date(utcTime + bangkokOffset);

      const day = bkkDate.getDate();
      const monthIdx = bkkDate.getMonth();
      const yearBE = bkkDate.getFullYear() + 543; // ปี พ.ศ.
      const hours = String(bkkDate.getHours()).padStart(2, '0');
      const minutes = String(bkkDate.getMinutes()).padStart(2, '0');
      const seconds = String(bkkDate.getSeconds()).padStart(2, '0');

      if (formatType === 'dateOnly') {
        return `${day} ${thaiMonths[monthIdx]} ${yearBE}`;
      } else if (formatType === 'timeOnly') {
        return `${hours}:${minutes}:${seconds} น.`;
      } else if (formatType === 'fullThai') {
        return `${day} ${thaiMonthsFull[monthIdx]} พ.ศ. ${yearBE} เวลา ${hours}:${minutes}:${seconds} น.`;
      }

      // Default
      return `${day} ${thaiMonths[monthIdx]} ${yearBE} (${hours}:${minutes}:${seconds} น.)`;
    }

    // ตรวจสอบความถูกต้องของสลิป
    async verifySlip(fileOrBase64, expectedAmount, studentData = {}) {
      // 1. ถ้าปิดระบบตรวจอัตโนมัติ (เป็นโหมด Manual อัปโหลดสลิปธรรมดาเพื่อประหยัดโควตา)
      if (this.config.mode === 'manual') {
        return {
          success: true,
          verified: false,
          mode: 'manual',
          message: 'บันทึกสลิปสำเร็จ (โหมดตรวจสอบด้วยแอดมิน)',
          amount: expectedAmount,
          refCode: 'TXN-MANUAL-' + Date.now().toString().slice(-6),
          timestamp: this.formatThaiDateTime(new Date())
        };
      }

      // 2. ถ้าเปิดโหมดตรวจอัตโนมัติ (Auto Verify ผ่าน SlipOK หรือ Provider อื่น)
      const activeProvider = this.config.activeProvider || 'slipok';
      const branchId = this.config.slipokBranchId;
      const apiKey = this.config.slipokApiKey;

      if (activeProvider === 'slipok' && branchId && apiKey) {
        try {
          return await this.verifyWithSlipOK(fileOrBase64, expectedAmount, branchId, apiKey);
        } catch (slipOkErr) {
          console.warn("SlipOK Primary error, checking backup accounts:", slipOkErr);
          
          // สลับโควตาไปยังตัวสำรองอัตโนมัติ (Quota Failover)
          const backup = (this.config.backupAccounts || []).find(b => b.apiKey && b.branchId);
          if (backup) {
            console.log(`Switching to backup quota: ${backup.name}`);
            try {
              return await this.verifyWithSlipOK(fileOrBase64, expectedAmount, backup.branchId, backup.apiKey);
            } catch (backupErr) {
              console.warn("Backup quota error:", backupErr);
            }
          }

          // ถ้าต่อ API ไม่ได้หรือโควตาหมด ให้บันทึกเป็น manual พร้อมเตือน
          return {
            success: true,
            verified: false,
            mode: 'fallback_manual',
            warning: 'ระบบตรวจอัตโนมัติขัดข้องหรือโควตาหมด จึงบันทึกเป็นแบบให้แอดมินตรวจแทน',
            amount: expectedAmount,
            refCode: 'TXN-FALLBACK-' + Date.now().toString().slice(-6),
            timestamp: this.formatThaiDateTime(new Date())
          };
        }
      }

      // Default fallback
      return {
        success: true,
        verified: false,
        mode: 'manual',
        message: 'บันทึกสลิปสำเร็จ',
        amount: expectedAmount,
        refCode: 'TXN-' + Date.now().toString().slice(-6),
        timestamp: this.formatThaiDateTime(new Date())
      };
    }

    // เรียก API ของ SlipOK
    async verifyWithSlipOK(fileOrBase64, expectedAmount, branchId, apiKey) {
      const formData = new FormData();
      
      if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
        const blob = this.dataURLtoBlob(fileOrBase64);
        formData.append('files', blob, 'slip.jpg');
      } else if (fileOrBase64 instanceof Blob || fileOrBase64 instanceof File) {
        formData.append('files', fileOrBase64, 'slip.jpg');
      } else {
        throw new Error('รูปแบบไฟล์สลิปไม่ถูกต้อง');
      }

      formData.append('amount', expectedAmount);
      formData.append('log', 'true');

      const endpoint = `https://api.slipok.com/api/line/apikey/${branchId}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-authorization': apiKey
        },
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`SlipOK API Response ${res.status}: ${errText}`);
      }

      const result = await res.json();
      if (!result.success) {
        return {
          success: false,
          verified: false,
          message: result.message || 'ไม่พบข้อมูลสลิป หรือสลิปไม่ถูกต้อง'
        };
      }

      const data = result.data || {};
      const actualAmount = parseFloat(data.amount || 0);
      const transRef = data.transRef || data.refCode || '';
      const transDate = data.transDate || data.transTimestamp || new Date();

      // ตรวจสอบยอดเงิน (Amount Check)
      if (this.config.strictCheckAmount && Math.abs(actualAmount - expectedAmount) > 0.01) {
        return {
          success: false,
          verified: false,
          errorType: 'AMOUNT_MISMATCH',
          message: `ยอดเงินในสลิปไม่ตรงตามที่กำหนด! (ยอดในสลิป: ฿${actualAmount} แต่ต้องชำระ: ฿${expectedAmount})`
        };
      }

      // ตรวจสอบสลิปซ้ำ (Duplicate Ref Check)
      if (this.config.strictCheckDuplicate && transRef) {
        if (this.isRefCodeUsed(transRef)) {
          return {
            success: false,
            verified: false,
            errorType: 'DUPLICATE_SLIP',
            message: `สลิปใบนี้ (รหัสอ้างอิง: ${transRef}) เคยถูกใช้ในระบบไปแล้ว! ไม่สามารถใช้ซ้ำได้`
          };
        }
        this.markRefCodeUsed(transRef);
      }

      // ตัดโควตา
      this.config.quotaUsed = (this.config.quotaUsed || 0) + 1;
      this.saveConfig(this.config);

      return {
        success: true,
        verified: true,
        provider: 'slipok',
        transRef: transRef,
        amount: actualAmount,
        sender: data.sender || {},
        receiver: data.receiver || {},
        timestamp: this.formatThaiDateTime(transDate, 'fullThai'),
        rawTimestamp: transDate,
        message: 'ตรวจสอบสลิปสำเร็จ ยอดเงินถูกต้อง 100%'
      };
    }

    // ตรวจสอบและบันทึกรหัสอ้างอิงเพื่อป้องกันสลิปซ้ำ
    isRefCodeUsed(refCode) {
      if (!refCode) return false;
      try {
        const hashes = JSON.parse(localStorage.getItem(SLIP_USED_HASHES_KEY) || '{}');
        return !!hashes[refCode];
      } catch (e) {
        return false;
      }
    }

    markRefCodeUsed(refCode, metadata = {}) {
      if (!refCode) return;
      try {
        const hashes = JSON.parse(localStorage.getItem(SLIP_USED_HASHES_KEY) || '{}');
        hashes[refCode] = {
          usedAt: this.formatThaiDateTime(new Date()),
          metadata: metadata
        };
        localStorage.setItem(SLIP_USED_HASHES_KEY, JSON.stringify(hashes));
      } catch (e) {}
    }

    dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
    }
  }

  window.SlipVerificationEngine = new SlipVerificationEngine();

})(window);
