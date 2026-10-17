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

    // Background: Crisp white with rounded corners
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Background: Deep Blue `#0b436c`
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
        // Fallback Vector Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THAI QR PAYMENT', 377, 85);
        resolve();
      };
      headerImg.src = 'assets/images/thai_qr_header.png';
    });

    // PromptPay Logo Banner (y: 155, height: 60)
    await new Promise(resolve => {
      const ppImg = new Image();
      ppImg.crossOrigin = 'anonymous';
      ppImg.onload = () => {
        const w = 170;
        const h = (ppImg.height / ppImg.width) * w;
        ctx.drawImage(ppImg, (755 - w) / 2, 158, w, h);
        resolve();
      };
      ppImg.onerror = () => {
        ctx.fillStyle = '#003366';
        ctx.fillRect(300, 160, 155, 45);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PromptPay', 377, 190);
        resolve();
      };
      ppImg.src = 'assets/images/promptpay_logo.png';
    });

    // Draw Dynamic QR Code in Center (y: 235, size: 400x400)
    const qrSize = 400;
    const qrX = (755 - qrSize) / 2;
    const qrY = 232;

    // Draw QR canvas
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Draw subtle PromptPay mini badge in center of QR
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(377, qrY + (qrSize / 2), 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b436c';
    ctx.beginPath();
    ctx.arc(377, qrY + (qrSize / 2), 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QR', 377, qrY + (qrSize / 2));

    // Text Section Below QR (y: 685+)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Teal Title: สแกน QR เพื่อโอนเข้าบัญชี
    ctx.fillStyle = '#2ab7a8';
    ctx.font = 'bold 34px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('สแกน QR เพื่อโอนเข้าบัญชี', 377, 690);

    // Account Name: ชื่อ: ...
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 34px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`ชื่อ: ${accountName}`, 377, 742);

    // Masked Account: บัญชี: xxx-x-x...
    let maskedAcc = accountNumber;
    if (accountNumber && accountNumber.length >= 9) {
      const clean = accountNumber.replace(/[^0-9]/g, '');
      const last4 = clean.slice(-4);
      maskedAcc = `xxx-x-x${last4.slice(0, 3)}-${last4.slice(3)}`;
    }
    ctx.fillStyle = '#4a5568';
    ctx.font = 'bold 34px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`บัญชี: ${maskedAcc}`, 377, 792);

    // Reference Code: เลขที่อ้างอิง: ...
    ctx.fillStyle = '#a0aec0';
    ctx.font = '500 24px "Prompt", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`เลขที่อ้างอิง: ${refCode}`, 377, 836);

    // Amount Badge: ยอดชำระเงินที่ล็อคไว้
    if (amount !== undefined && amount !== null && Number(amount) > 0) {
      const amtStr = `฿${Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2})} บาท (ล็อคยอดอัตโนมัติ)`;
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 26px "Prompt", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(amtStr, 377, 882);
    }

    // Divider Line above footer
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 934);
    ctx.lineTo(725, 934);
    ctx.stroke();

    // Footer: K+ Accepts all banks | รับเงินได้จากทุกธนาคาร
    await new Promise(resolve => {
      const footerImg = new Image();
      footerImg.crossOrigin = 'anonymous';
      footerImg.onload = () => {
        ctx.drawImage(footerImg, 0, 934, 755, 90);
        resolve();
      };
      footerImg.onerror = () => {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('K+ Accepts all banks | รับเงินได้จากทุกธนาคาร', 377, 985);
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
