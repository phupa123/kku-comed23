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

    // 1. Generate QR Code – render into hidden off-screen div, grab img element
    const qrImgEl = await new Promise(resolve => {
      if (typeof QRCode === 'undefined') { resolve(null); return; }
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
      document.body.appendChild(holder);
      new QRCode(holder, {
        text: payload,
        width: 500,
        height: 500,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      setTimeout(() => {
        const el = holder.querySelector('img') || holder.querySelector('canvas');
        document.body.removeChild(holder);
        resolve(el || null);
      }, 250);
    });

    // 2. Prepare Main Output Canvas (755 x 1060)
    const canvas = document.createElement('canvas');
    canvas.width = 755;
    canvas.height = 1060;
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

    // A. White base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // B. Navy header bar
    ctx.fillStyle = '#0b3d6b';
    ctx.fillRect(0, 0, canvas.width, 148);

    // C. Header image
    await new Promise(resolve => {
      const hImg = new Image();
      hImg.crossOrigin = 'anonymous';
      hImg.onload = () => { ctx.drawImage(hImg, 0, 0, 755, 148); resolve(); };
      hImg.onerror = () => {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('THAI QR PAYMENT', 377, 74);
        ctx.textBaseline = 'alphabetic';
        resolve();
      };
      hImg.src = 'assets/images/thai_qr_header.png';
    });

    // D. PromptPay logo in bordered box
    await new Promise(resolve => {
      const ppImg = new Image();
      ppImg.crossOrigin = 'anonymous';
      ppImg.onload = () => {
        const w = 190; const h = Math.round((ppImg.height / ppImg.width) * w);
        const bx = (755 - w - 24) / 2; const by = 158;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1.5;
        roundRect(ctx, bx, by, w + 24, h + 14, 10, true, true);
        ctx.drawImage(ppImg, bx + 12, by + 7, w, h);
        resolve();
      };
      ppImg.onerror = () => {
        ctx.fillStyle = '#1a56db';
        ctx.font = 'bold 26px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PromptPay', 377, 205);
        resolve();
      };
      ppImg.src = 'assets/images/promptpay_logo.png';
    });

    // E. QR Code card with shadow
    const qrSize = 400;
    const qrX = (755 - qrSize) / 2;
    const qrY = 236;
    const cardPad = 18;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - cardPad, qrY - cardPad, qrSize + cardPad * 2, qrSize + cardPad * 2, 24, true, false);
    ctx.restore();
    ctx.strokeStyle = '#e8edf3';
    ctx.lineWidth = 1.5;
    roundRect(ctx, qrX - cardPad, qrY - cardPad, qrSize + cardPad * 2, qrSize + cardPad * 2, 24, false, true);

    // Draw QR (img element from hidden div)
    if (qrImgEl) {
      if (qrImgEl.tagName === 'IMG' && (!qrImgEl.complete || qrImgEl.naturalWidth === 0)) {
        await new Promise(r => { qrImgEl.onload = r; qrImgEl.onerror = r; });
      }
      ctx.drawImage(qrImgEl, qrX, qrY, qrSize, qrSize);
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px "Prompt", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('QR Code', 377, qrY + qrSize / 2);
      ctx.textBaseline = 'alphabetic';
    }

    // F. Account info (positions relative to QR card bottom)
    const textTop = qrY + qrSize + cardPad + 26; // dynamic, ~686
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';

    // "สแกน QR เพื่อโอนเข้าบัญชี" – teal
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 26px "Prompt", "Sarabun", sans-serif';
    ctx.fillText('สแกน QR เพื่อโอนเข้าบัญชี', 377, textTop);

    // Account name – dark
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px "Prompt", "Sarabun", sans-serif';
    ctx.fillText(`ชื่อบัญชี: ${accountName}`, 377, textTop + 44);

    // Masked account – slate
    let maskedAcc = accountNumber;
    if (accountNumber && accountNumber.replace(/[^0-9]/g, '').length >= 8) {
      const clean = accountNumber.replace(/[^0-9]/g, '');
      const last4 = clean.slice(-4);
      maskedAcc = `xxx-x-x${last4.slice(0, 3)}-${last4.slice(3)}`;
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px "Prompt", "Sarabun", sans-serif';
    ctx.fillText(`เลขที่บัญชี: ${maskedAcc}`, 377, textTop + 84);

    // G. Locked-amount badge
    if (amount !== undefined && amount !== null && Number(amount) > 0) {
      const formattedAmt = Number(amount).toLocaleString('th-TH', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
      const badgeW = 660; const badgeH = 128;
      const badgeX = (755 - badgeW) / 2;
      const badgeY = textTop + 106;

      ctx.save();
      const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
      grad.addColorStop(0, '#f0fdf4');
      grad.addColorStop(1, '#d1fae5');
      ctx.fillStyle = grad;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22, true, false);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22, false, true);

      // Pill label
      const pillW = 380; const pillH = 32;
      const pillX = (755 - pillW) / 2; const pillY = badgeY + 12;
      ctx.fillStyle = '#a7f3d0';
      roundRect(ctx, pillX, pillY, pillW, pillH, 16, true, false);
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 15px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 จำนวนเงินที่ต้องชำระ (ล็อคยอดอัตโนมัติ)', 377, pillY + 21);

      // Big amount number
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 58px "Prompt", "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`฿ ${formattedAmt}`, 377, badgeY + 114);
      ctx.restore();
    }

    // H. Reference code
    const refY = textTop + 106 + 128 + 22;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Prompt", "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`รหัสอ้างอิง: ${refCode}`, 377, refY);

    // I. Thin divider
    const divY = refY + 24;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, divY); ctx.lineTo(715, divY);
    ctx.stroke();

    // J. Footer
    await new Promise(resolve => {
      const fImg = new Image();
      fImg.crossOrigin = 'anonymous';
      fImg.onload = () => { ctx.drawImage(fImg, 0, divY + 6, 755, 90); resolve(); };
      fImg.onerror = () => {
        ctx.fillStyle = '#0d9488';
        ctx.font = 'bold 21px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('K+ Accepts all banks | รับเงินได้จากทุกธนาคาร', 377, divY + 55);
        resolve();
      };
      fImg.src = 'assets/images/thai_qr_footer.png';
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
