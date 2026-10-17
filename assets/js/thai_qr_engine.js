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

    if (t.length >= 13) {
      // National ID / Tax ID (13 digits)
      tag29_sub = f('00', 'A000000677010111') + f('02', t);
    } else if (t.length >= 10 && (t.startsWith('0') || t.startsWith('66'))) {
      // Mobile Phone
      if (t.startsWith('0')) t = '66' + t.substring(1);
      t = '00' + t;
      t = t.padStart(13, '0');
      tag29_sub = f('00', 'A000000677010111') + f('01', t);
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
   * Builds high-resolution Thai QR Payment Slip Card Canvas matching KBank/PromptPay official standard
   * @param {Object} options
   * @param {string} options.target - PromptPay ID / Account Number
   * @param {number} options.amount - Locked amount (e.g. 190.00)
   * @param {string} [options.accountName] - Owner name (e.g. "น.ส. พิชามญธุ์ สามสี")
   * @param {string} [options.accountNumber] - Formatted account number (e.g. "236-2-47817-3")
   * @param {string} [options.refCode] - Reference code (e.g. "004999250006870")
   * @returns {Promise<string>} Data URL PNG of the full slip card
   */
  async function generatePromptPaySlipCard(options) {
    const {
      target = '2362478173',
      amount = 190,
      accountName = 'น.ส. พิชามญธุ์ สามสี',
      accountNumber = '236-2-47817-3',
      refCode = '004999250006870'
    } = options || {};

    const payload = generatePromptPayPayload(target, amount);

    // 1. Generate QR Code image matrix via QRCode lib
    const qrCanvas = document.createElement('canvas');
    if (typeof QRCode !== 'undefined') {
      await new Promise(resolve => {
        new QRCode(qrCanvas, {
          text: payload,
          width: 440,
          height: 440,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        setTimeout(resolve, 50);
      });
    }

    // 2. Prepare Main Output Canvas (755 x 1024 to match standard template)
    const canvas = document.createElement('canvas');
    canvas.width = 755;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Helper to draw rounded rectangle
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

    // 1. Canvas Base: Crisp White with subtle outer border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Header Background: Deep Blue `#0b436c`
    ctx.fillStyle = '#0b436c';
    ctx.fillRect(0, 0, canvas.width, 140);

    // Load Header Asset if available or draw vector header
    await new Promise(resolve => {
      const headerImg = new Image();
      headerImg.crossOrigin = 'anonymous';
      headerImg.onload = () => {
        ctx.drawImage(headerImg, 0, 0, 755, 140);
        resolve();
      };
      headerImg.onerror = () => {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THAI QR PAYMENT', 377, 85);
        resolve();
      };
      headerImg.src = 'assets/images/thai_qr_header.png';
    });

    // 3. PromptPay Logo Banner (y: 152, height: ~55)
    await new Promise(resolve => {
      const ppImg = new Image();
      ppImg.crossOrigin = 'anonymous';
      ppImg.onload = () => {
        const w = 175;
        const h = (ppImg.height / ppImg.width) * w;
        ctx.drawImage(ppImg, (755 - w) / 2, 154, w, h);
        resolve();
      };
      ppImg.onerror = () => {
        ctx.fillStyle = '#003366';
        ctx.fillRect(300, 155, 155, 45);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PromptPay', 377, 185);
        resolve();
      };
      ppImg.src = 'assets/images/promptpay_logo.png';
    });

    // 4. Subtle QR Frame with soft shadow
    const qrSize = 390;
    const qrX = (755 - qrSize) / 2;
    const qrY = 222;

    // QR Outer card frame with soft rounded border
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20, true, false);
    ctx.restore();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20, false, true);

    // Draw QR canvas
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Draw subtle PromptPay mini badge in center of QR
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(377, qrY + (qrSize / 2), 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b436c';
    ctx.beginPath();
    ctx.arc(377, qrY + (qrSize / 2), 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QR', 377, qrY + (qrSize / 2));

    // 5. Text Section Below QR (y: 650+)
    ctx.textBaseline = 'alphabetic';

    // Teal Title: สแกน QR เพื่อโอนเข้าบัญชี
    ctx.fillStyle = '#1eb19f';
    ctx.font = 'bold 30px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('สแกน QR เพื่อโอนเข้าบัญชี', 377, 658);

    // Account Name: ชื่อ: ...
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 30px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`ชื่อ: ${accountName}`, 377, 702);

    // Masked Account: บัญชี: xxx-x-x...
    let maskedAcc = accountNumber;
    if (accountNumber && accountNumber.length >= 9) {
      const clean = accountNumber.replace(/[^0-9]/g, '');
      const last4 = clean.slice(-4);
      maskedAcc = `xxx-x-x${last4.slice(0, 3)}-${last4.slice(3)}`;
    }
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 28px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`บัญชี: ${maskedAcc}`, 377, 744);

    // Reference Code: เลขที่อ้างอิง: ...
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 21px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`เลขที่อ้างอิง: ${refCode}`, 377, 780);

    // 6. Premium Highlighted Locked Amount Card (y: 808 - 898)
    if (amount !== undefined && amount !== null && Number(amount) > 0) {
      const badgeW = 635;
      const badgeH = 88;
      const badgeX = (755 - badgeW) / 2;
      const badgeY = 806;

      // Soft green background
      ctx.fillStyle = '#f0fdf4';
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, true, false);

      // Emerald border
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18, false, true);

      // Badge Label: "ยอดชำระที่ล็อคไว้"
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 19px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 ล็อคยอดชำระเงินอัตโนมัติ (ไม่ต้องระบุจำนวนเงินเอง)', 377, badgeY + 34);

      // Amount Number: "฿190.00 บาท"
      const formattedAmt = Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 36px "Prompt", sans-serif';
      ctx.fillText(`฿${formattedAmt} บาท`, 377, badgeY + 74);
    }

    // 7. Divider Line above footer
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 922);
    ctx.lineTo(720, 922);
    ctx.stroke();

    // 8. Footer: K+ Accepts all banks | รับเงินได้จากทุกธนาคาร
    await new Promise(resolve => {
      const footerImg = new Image();
      footerImg.crossOrigin = 'anonymous';
      footerImg.onload = () => {
        ctx.drawImage(footerImg, 0, 924, 755, 95);
        resolve();
      };
      footerImg.onerror = () => {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('K+ Accepts all banks | รับเงินได้จากทุกธนาคาร', 377, 980);
        resolve();
      };
      footerImg.src = 'assets/images/thai_qr_footer.png';
    });

    return canvas.toDataURL('image/png');
  }

  // Export to global window object
  window.ThaiQrEngine = {
    generatePromptPayPayload,
    generatePromptPaySlipCard,
    crc16
  };

})(typeof window !== 'undefined' ? window : this);
