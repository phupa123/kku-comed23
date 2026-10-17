/**
 * =========================================================================
 * THAI QR PAYMENT & PROMPTPAY SLIP GENERATOR ENGINE
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * Standard EMVCo Thai QR Payment / PromptPay with Dynamic Amount & Canvas Slip Card
 * =========================================================================
 */

(function(window) {
  'use strict';

  // CRC16-CCITT (0xFFFF, Poly 0x1021)
  function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function f(tag, val) {
    const s = String(val ?? '');
    const len = String(s.length).padStart(2, '0');
    return tag + len + s;
  }

  /**
   * Generates official Thai QR Payment PromptPay payload
   * @param {string} target - PromptPay target (Phone number e.g. 0812345678, National ID / Tax ID 13 digits, or Bank Account)
   * @param {number|string} [amount] - Locked amount in THB (e.g. 190.00 or 390.00)
   * @returns {string} EMVCo QR Code payload string
   */
  function generatePromptPayPayload(target, amount) {
    if (!target) target = '2362478173'; // fallback default
    let t = String(target).replace(/[^0-9]/g, '');
    let tag29_sub;

    if (t.length === 13) {
      // National Citizen ID / Tax ID (13 digits)
      tag29_sub = f('00', 'A000000677010111') + f('02', t);
    } else if (t.length === 10 && t.startsWith('0')) {
      // Mobile Phone 10 digits (e.g. 0812345678 -> 0066812345678)
      const intlPhone = '0066' + t.substring(1);
      tag29_sub = f('00', 'A000000677010111') + f('01', intlPhone.padStart(13, '0'));
    } else if (t.length >= 11 && (t.startsWith('66') || t.startsWith('0066'))) {
      // Mobile Phone already with country code
      const cleanPhone = t.startsWith('00') ? t : ('00' + t);
      tag29_sub = f('00', 'A000000677010111') + f('01', cleanPhone.padStart(13, '0'));
    } else {
      // Bank Account / E-Wallet ID fallback (10-15 digits)
      tag29_sub = f('00', 'A000000677010111') + f('03', t.padStart(15, '0'));
    }

    const hasAmt = (amount !== undefined && amount !== null && !isNaN(Number(amount)) && Number(amount) > 0);

    let payload =
      f('00', '01') + // Format indicator
      f('01', hasAmt ? '12' : '11') + // 11 = Static, 12 = Dynamic (with locked amount)
      f('29', tag29_sub) +
      f('53', '764') + // THB currency code
      f('58', 'TH');   // Thailand country code

    if (hasAmt) {
      payload += f('54', Number(amount).toFixed(2));
    }

    const toCheck = payload + '6304';
    const checksum = crc16(toCheck);
    return toCheck + checksum;
  }

  /**
   * Helper to format and mask PromptPay target string
   */
  function formatPromptPayDisplay(target) {
    if (!target) return { label: 'บัญชี / พร้อมเพย์', display: '-' };
    const clean = String(target).replace(/[^0-9]/g, '');
    if (clean.length === 13) {
      // Citizen ID Card 13 digits
      const masked = `${clean[0]}-xxxx-xxxxx-${clean.slice(10, 12)}-${clean[12]}`;
      return { label: 'เลขประจำตัว ปชช.', display: masked };
    } else if (clean.length === 10 && clean.startsWith('0')) {
      // Mobile phone 10 digits
      const masked = `${clean.slice(0, 3)}-xxx-${clean.slice(6)}`;
      return { label: 'เบอร์พร้อมเพย์', display: masked };
    } else if (clean.length >= 8) {
      // Bank account
      const last4 = clean.slice(-4);
      const masked = `xxx-x-x${last4.slice(0, 3)}-${last4.slice(3)}`;
      return { label: 'เลขที่บัญชี', display: masked };
    }
    return { label: 'พร้อมเพย์', display: String(target) };
  }

  /**
   * Builds high-resolution Thai QR Payment Slip Card Canvas matching KBank/PromptPay official standard
   * @param {Object} options
   * @param {string} options.target - PromptPay ID / Phone / ID card / Bank Account
   * @param {number} options.amount - Locked amount (e.g. 190.00)
   * @param {string} [options.accountName] - Owner name (e.g. "น.ส. พิชามญธุ์ สามสี")
   * @param {string} [options.accountNumber] - Formatted account number / phone / ID
   * @param {string} [options.refCode] - Reference code (e.g. "004999250006870")
   * @returns {Promise<string>} Data URL PNG of the full slip card
   */
  /**
   * Generates QR Code image using memory canvas or API without appending any element to document.body
   */
  async function createQrImageElement(payload) {
    // 1. Try external high-res QR API
    try {
      const img = await new Promise((resolve, reject) => {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=M&format=png&data=${encodeURIComponent(payload)}`;
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('timeout')), 4000);
        testImg.onload = () => { clearTimeout(timer); resolve(testImg); };
        testImg.onerror = () => { clearTimeout(timer); reject(new Error('api error')); };
        testImg.src = url;
      });
      if (img) return img;
    } catch(e) {}

    // 2. Offline Fallback: Use QRCode.js via detached offscreen container (NEVER append to document.body)
    if (typeof QRCode !== 'undefined') {
      try {
        const detached = document.createElement('div');
        new QRCode(detached, {
          text: payload,
          width: 500,
          height: 500,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });

        // Extract canvas or img from detached container
        const c = detached.querySelector('canvas');
        if (c) return c;
        const im = detached.querySelector('img');
        if (im && im.src) {
          if (!im.complete) {
            await new Promise(r => { im.onload = r; im.onerror = r; });
          }
          return im;
        }
      } catch(err) {
        console.warn('Detached QRCode generation failed:', err);
      }
    }
    return null;
  }

  /**
   * Builds high-resolution Thai QR Payment Slip Card Canvas matching KBank/PromptPay official standard
   */
  async function generatePromptPaySlipCard(options) {
    const {
      target = '2362478173',
      amount = 190,
      accountName = 'น.ส. พิชามญธุ์ สามสี',
      accountNumber = '236-2-47817-3',
      refCode = '004999250006870'
    } = options || {};

    const effectiveTarget = target || accountNumber || '2362478173';
    const payload = generatePromptPayPayload(effectiveTarget, amount);

    // 1. Generate QR element completely off-screen
    const qrImgEl = await createQrImageElement(payload);

    // 2. Prepare Main Output Canvas (755 x 1024)
    const canvas = document.createElement('canvas');
    canvas.width = 755;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
      } else {
        radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
      }
      ctx.beginPath();
      ctx.moveTo(x + radius.tl, y);
      ctx.lineTo(x + width - radius.tr, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
      ctx.lineTo(x + width, y + height - radius.br);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
      ctx.lineTo(x + radius.bl, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
      ctx.lineTo(x, y + radius.tl);
      ctx.quadraticCurveTo(x, y, x + radius.tl, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    // A. White base card with soft border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 755, 1024);

    // B. Official Navy Blue Header (#0b3d6b)
    ctx.fillStyle = '#0b3d6b';
    ctx.fillRect(0, 0, 755, 138);

    // Header Title: THAI QR PAYMENT
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THAI QR PAYMENT', 377, 70);

    // Small sub-bar
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 138, 755, 6);

    // C. PromptPay Logo Box
    const ppW = 200;
    const ppH = 62;
    const ppX = (755 - ppW) / 2;
    const ppY = 156;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, ppX, ppY, ppW, ppH, 12, true, true);

    // PromptPay text emblem
    ctx.fillStyle = '#003366';
    ctx.font = '900 28px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('พร้อมเพย์', 377, ppY + 22);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 18px "Prompt", sans-serif';
    ctx.fillText('PromptPay', 377, ppY + 45);

    // D. QR Code Center Box
    const qrSize = 390;
    const qrX = (755 - qrSize) / 2;
    const qrY = 236;
    const pad = 14;

    // QR container shadow and frame
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 20, true, false);
    ctx.restore();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 20, false, true);

    // Draw the actual QR Code
    if (qrImgEl) {
      try {
        ctx.drawImage(qrImgEl, qrX, qrY, qrSize, qrSize);
      } catch(e) {
        console.warn('Canvas draw QR error:', e);
      }
    }

    // E. Account Info Section
    const infoY = qrY + qrSize + pad + 32; // ~672
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';

    // 1. "สแกน QR เพื่อโอนเข้าบัญชี"
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 24px "Prompt", "Sarabun", sans-serif';
    ctx.fillText('สแกน QR เพื่อโอนเข้าบัญชี', 377, infoY);

    // 2. Account Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Prompt", "Sarabun", sans-serif';
    ctx.fillText(`ชื่อบัญชี: ${accountName}`, 377, infoY + 40);

    // 3. Masked Target (Phone / ID Card / Bank Account)
    const targetInfo = formatPromptPayDisplay(effectiveTarget);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 23px "Prompt", "Sarabun", sans-serif';
    ctx.fillText(`${targetInfo.label}: ${targetInfo.display}`, 377, infoY + 76);

    // F. Locked Amount Card
    const badgeW = 650;
    const badgeH = 120;
    const badgeX = (755 - badgeW) / 2;
    const badgeY = infoY + 98;

    if (amount !== undefined && amount !== null && Number(amount) > 0) {
      const formattedAmt = Number(amount).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      ctx.save();
      const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
      grad.addColorStop(0, '#f0fdf4');
      grad.addColorStop(1, '#d1fae5');
      ctx.fillStyle = grad;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, true, false);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, false, true);

      // Pill badge
      const pillW = 380;
      const pillH = 30;
      const pillX = (755 - pillW) / 2;
      const pillY = badgeY + 12;
      ctx.fillStyle = '#a7f3d0';
      roundRect(ctx, pillX, pillY, pillW, pillH, 15, true, false);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 15px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 จำนวนเงินที่ต้องชำระ (ล็อคยอดอัตโนมัติ)', 377, pillY + 20);

      // Big amount
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 54px "Prompt", "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`฿ ${formattedAmt}`, 377, badgeY + 104);
      ctx.restore();
    }

    // G. Reference Code
    const refY = badgeY + badgeH + 24;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 17px "Prompt", "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`รหัสอ้างอิง: ${refCode}`, 377, refY);

    // H. Footer divider & Official Footer Bar
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 960);
    ctx.lineTo(720, 960);
    ctx.stroke();

    // Footer text / brand
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 20px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('K+ Accepts all banks | รับเงินได้จากทุกธนาคาร', 377, 995);

    return canvas.toDataURL('image/png');
  }

  // Export to global window object
  window.ThaiQrEngine = {
    generatePromptPayPayload,
    generatePromptPaySlipCard,
    formatPromptPayDisplay,
    crc16
  };

})(typeof window !== 'undefined' ? window : this);
