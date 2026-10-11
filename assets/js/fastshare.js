/**
 * =========================================================================
 * FASTSHARE ENGINE (AirDrop / QuickShare Ultra Suite for COMED23)
 * รองรับ:
 * - Device Pairing via QR Code & Nearby Radar Simulation
 * - Mode: รับทุกคน (Everyone) / เฉพาะอุปกรณ์ที่จับคู่ (Paired Devices) / เฉพาะบุคคลที่ระบุ (Specific User)
 * - Auto-Accept Toggle: ส่งไฟล์ตรงทันที หรือ รอให้ผู้รับกดยืนยันก่อน
 * - Real-time Prompt: มีเสียงเตือน + มอเตอร์สั่น + Push Alert แม้ปิดหน้าจอ
 * - Direct Download & File Preview Modal
 * =========================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_DEVICE_ID = 'COMED23_FASTSHARE_DEVICE_ID';
  const STORAGE_DEVICE_NAME = 'COMED23_FASTSHARE_DEVICE_NAME';
  const STORAGE_SETTINGS = 'COMED23_FASTSHARE_SETTINGS';
  const STORAGE_PAIRED_DEVICES = 'COMED23_FASTSHARE_PAIRED_DEVICES';

  // 1. Initialize Device Identity
  let deviceId = localStorage.getItem(STORAGE_DEVICE_ID);
  if (!deviceId) {
    deviceId = 'fs_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_DEVICE_ID, deviceId);
  }

  let deviceName = localStorage.getItem(STORAGE_DEVICE_NAME);
  if (!deviceName) {
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    const platform = isMobile ? 'Mobile' : 'Computer';
    deviceName = `${platform} ${deviceId.substring(3, 7).toUpperCase()}`;
    localStorage.setItem(STORAGE_DEVICE_NAME, deviceName);
  }

  // 2. Load Local Settings
  function getSettings() {
    try {
      const s = localStorage.getItem(STORAGE_SETTINGS);
      return s ? JSON.parse(s) : {
        discoverableMode: 'everyone', // 'everyone' | 'paired' | 'specific' | 'off'
        autoAccept: false,           // true: รับไฟล์ทันที / false: ต้องกดยืนยันก่อน
        soundAlert: true,
        vibrationAlert: true
      };
    } catch (e) {
      return { discoverableMode: 'everyone', autoAccept: false, soundAlert: true, vibrationAlert: true };
    }
  }

  function saveSettings(newSettings) {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(newSettings));
  }

  function getPairedDevices() {
    try {
      const p = localStorage.getItem(STORAGE_PAIRED_DEVICES);
      return p ? JSON.parse(p) : [];
    } catch (e) {
      return [];
    }
  }

  function addPairedDevice(device) {
    const list = getPairedDevices();
    if (!list.some(d => d.id === device.id)) {
      list.push(device);
      localStorage.setItem(STORAGE_PAIRED_DEVICES, JSON.stringify(list));
    }
  }

  function getClient() {
    if (typeof window.getSupabaseClient === 'function') {
      return window.getSupabaseClient();
    }
    if (window.supabase && window.SUPABASE_CONFIG) {
      return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    return null;
  }

  const FastShare = {
    deviceId,
    deviceName,
    settings: getSettings(),
    activeTransfers: [],
    realtimeChannel: null,

    nearbyDevices: [],
    onNearbyDevicesChange: null,

    init() {
      this.initRealtimeListener();
      this.mountIncomingDialog();
      this.checkUrlPairing();
    },

    // ตรวจสอบ URL query หากเปิดมาจาก QR Code เพื่อ Pair อัตโนมัติ (เช่น ?pair=fs_xyz&name=...)
    checkUrlPairing() {
      const params = new URLSearchParams(window.location.search);
      const pairId = params.get('pair');
      const pairName = params.get('name');
      if (pairId && pairId !== this.deviceId) {
        addPairedDevice({ id: pairId, name: pairName || 'อุปกรณ์ที่สแกน', pairedAt: new Date().toISOString() });
        console.log('[FastShare] Paired with device:', pairId);
        // Clean URL to prevent re-pairing alert loop
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    },

    // อัปเดตการตั้งค่า
    updateSettings(partial) {
      this.settings = Object.assign(this.settings, partial);
      saveSettings(this.settings);
      return this.settings;
    },

    // ส่งไฟล์
    async sendFile(file, targetOptions) {
      // targetOptions: { mode: 'everyone'|'paired'|'specific', targetDeviceId, targetEmail, targetName }
      if (!file) throw new Error('ไม่พบไฟล์ที่ต้องการส่ง');

      const client = getClient();
      let fileUrl = '';

      // Upload file via MultiUploader or Cloudinary
      if (window.MultiCloudUploader && typeof window.MultiCloudUploader.upload === 'function') {
        const upRes = await window.MultiCloudUploader.upload(file, { folder: 'fastshare' });
        fileUrl = upRes.url;
      } else {
        // Fallback: ใช้ DataURL หรือ Catbox / FreeImage
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const currentUserEmail = (sessionStorage.getItem('COMED_USER_SESSION') || '').toLowerCase().trim();
      const currentUserName = this.deviceName;

      const transferRecord = {
        id: 'tf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        sender_device_id: this.deviceId,
        sender_name: currentUserName,
        sender_email: currentUserEmail || null,
        target_mode: targetOptions.mode || 'everyone',
        target_device_id: targetOptions.targetDeviceId || null,
        target_email: targetOptions.targetEmail || null,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: fileUrl,
        status: 'pending',
        auto_accept: false,
        created_at: new Date().toISOString()
      };

      // 1. ส่งผ่าน Direct Realtime Broadcast เพื่อให้เด้ง Popup ที่เครื่องปลายทางทันที 0 วินาที
      if (this.realtimeChannel) {
        try {
          await this.realtimeChannel.send({
            type: 'broadcast',
            event: 'transfer:incoming',
            payload: transferRecord
          });
        } catch (e) {
          console.warn('[FastShare] Broadcast direct transfer error:', e);
        }
      }

      // 2. บันทึกลงฐานข้อมูล Supabase เพื่อความทนทาน (ปล่อยให้ Supabase สร้าง UUID id อัตโนมัติ)
      if (client) {
        try {
          const dbPayload = {
            sender_device_id: transferRecord.sender_device_id,
            sender_name: transferRecord.sender_name,
            sender_email: transferRecord.sender_email,
            target_mode: transferRecord.target_mode,
            target_device_id: transferRecord.target_device_id,
            target_email: transferRecord.target_email,
            file_name: transferRecord.file_name,
            file_size: transferRecord.file_size,
            file_type: transferRecord.file_type,
            file_url: transferRecord.file_url,
            status: transferRecord.status,
            auto_accept: transferRecord.auto_accept,
            created_at: transferRecord.created_at
          };
          const { data, error } = await client.from('fastshare_transfers').insert([dbPayload]).select();
          if (!error && data && data[0]) {
            transferRecord.id = data[0].id;
          }
        } catch (errDb) {}
      }

      return transferRecord;
    },

    // ติดตาม Realtime การส่งไฟล์เข้าเครื่องเรา และตรวจจับอุปกรณ์รอบข้างแบบ Live Radar
    initRealtimeListener() {
      const client = getClient();
      if (!client || this.realtimeChannel) return;

      try {
        let currentEmail = '';
        try {
          const raw = sessionStorage.getItem('COMED_USER_SESSION') || localStorage.getItem('COMED_USER_SESSION') || '';
          if (raw.startsWith('{')) {
            const parsed = JSON.parse(raw);
            currentEmail = (parsed.email || parsed.email_address || '').toLowerCase().trim();
          } else if (raw.includes('@')) {
            currentEmail = raw.toLowerCase().trim();
          }
        } catch(e) {}

        this.realtimeChannel = client
          .channel('public:fastshare_transfers', {
            config: {
              broadcast: { self: false },
              presence: {
                key: this.deviceId
              }
            }
          })
          .on('broadcast', { event: 'transfer:incoming' }, (event) => {
            const transfer = event.payload;
            if (transfer && this.shouldReceiveTransfer(transfer)) {
              this.handleIncomingTransfer(transfer);
            }
          })
          .on('broadcast', { event: 'transfer:status' }, (event) => {
            const updated = event.payload;
            if (updated) {
              this.handleStatusUpdate(updated);
            }
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fastshare_transfers' }, (payload) => {
            const transfer = payload.new;
            if (this.shouldReceiveTransfer(transfer)) {
              this.handleIncomingTransfer(transfer);
            }
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fastshare_transfers' }, (payload) => {
            const updated = payload.new;
            this.handleStatusUpdate(updated);
          })
          .on('presence', { event: 'sync' }, () => {
            const state = this.realtimeChannel.presenceState();
            const onlineList = [];
            for (const id in state) {
              if (id !== this.deviceId) {
                const dev = state[id][0];
                if (dev && dev.mode !== 'off') {
                  onlineList.push({
                    id: dev.id || id,
                    name: dev.name || 'อุปกรณ์ใกล้เคียง',
                    email: dev.email || '',
                    mode: dev.mode || 'everyone',
                    onlineAt: dev.onlineAt || new Date().toISOString()
                  });
                }
              }
            }
            this.nearbyDevices = onlineList;
            if (typeof this.onNearbyDevicesChange === 'function') {
              this.onNearbyDevicesChange(onlineList);
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await this.realtimeChannel.track({
                id: this.deviceId,
                name: this.deviceName,
                email: currentEmail,
                mode: this.settings.discoverableMode,
                onlineAt: new Date().toISOString()
              });
            }
          });
      } catch (e) {
        console.warn('[FastShare] Realtime subscription note:', e);
      }
    },

    // ตรวจสอบสิทธิ์ว่าอุปกรณ์นี้ควรได้รับไฟล์หรือไม่
    shouldReceiveTransfer(transfer) {
      // ไม่รับไฟล์ที่ส่งมาจากเครื่องตัวเอง
      if (transfer.sender_device_id === this.deviceId) return false;

      let currentEmail = '';
      try {
        const raw = sessionStorage.getItem('COMED_USER_SESSION') || localStorage.getItem('COMED_USER_SESSION') || '';
        if (raw.startsWith('{')) {
          const parsed = JSON.parse(raw);
          currentEmail = (parsed.email || parsed.email_address || '').toLowerCase().trim();
        } else if (raw.includes('@')) {
          currentEmail = raw.toLowerCase().trim();
        }
      } catch(e) {}
      const s = this.settings;

      // ถ้าปิดโหมดรับไฟล์
      if (s.discoverableMode === 'off') return false;

      // 1. ระบุเครื่องเฉพาะเจาะจง
      if (transfer.target_device_id && transfer.target_device_id === this.deviceId) return true;

      // 2. ระบุอีเมลเฉพาะเจาะจง
      if (transfer.target_email && currentEmail && transfer.target_email.toLowerCase() === currentEmail) return true;

      // 3. โหมดเฉพาะอุปกรณ์ที่จับคู่ (Paired)
      if (s.discoverableMode === 'paired') {
        const paired = getPairedDevices();
        return paired.some(d => d.id === transfer.sender_device_id);
      }

      // 4. โหมดเปิดรับทุกคน (Everyone)
      if (s.discoverableMode === 'everyone' && transfer.target_mode === 'everyone') {
        return true;
      }

      return false;
    },

    // เมื่อมีไฟล์ส่งเข้ามา
    handleIncomingTransfer(transfer) {
      const s = this.settings;

      // เล่นเสียง & สั่นแจ้งเตือน
      if (s.soundAlert) this.playSound();
      if (s.vibrationAlert && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 400]);
      }

      // หากตั้งค่า Auto-Accept ไว้ ให้ยอมรับและดาวน์โหลดทันที
      if (s.autoAccept) {
        this.acceptTransfer(transfer, true);
        return;
      }

      // แสดง Popup ขออนุมัติรับไฟล์
      this.showIncomingModal(transfer);
    },

    // รับไฟล์
    async acceptTransfer(transfer, auto = false) {
      const client = getClient();
      const updatedTransfer = { ...transfer, status: 'accepted' };

      // 1. Broadcast แจ้งเตือนคนส่งทันที (0ms)
      if (this.realtimeChannel) {
        try {
          await this.realtimeChannel.send({
            type: 'broadcast',
            event: 'transfer:status',
            payload: updatedTransfer
          });
        } catch (e) {}
      }

      // 2. อัปเดตลง Supabase
      if (client && transfer.id) {
        try {
          await client.from('fastshare_transfers').update({ status: 'accepted' }).eq('id', transfer.id);
        } catch (e) {}
      }

      // ดาวน์โหลดไฟล์อัตโนมัติ
      this.triggerDownload(transfer.file_url, transfer.file_name);

      if (auto) {
        this.showToast(`รับไฟล์ "${transfer.file_name}" เรียบร้อยแล้ว (Auto-Accept)`);
      }
    },

    // ปฏิเสธไฟล์
    async declineTransfer(transfer) {
      const client = getClient();
      const updatedTransfer = { ...transfer, status: 'declined' };

      // 1. Broadcast แจ้งเตือนคนส่งทันที
      if (this.realtimeChannel) {
        try {
          await this.realtimeChannel.send({
            type: 'broadcast',
            event: 'transfer:status',
            payload: updatedTransfer
          });
        } catch (e) {}
      }

      if (client && transfer.id) {
        try {
          await client.from('fastshare_transfers').update({ status: 'declined' }).eq('id', transfer.id);
        } catch (e) {}
      }
      this.showToast(`ปฏิเสธไฟล์จาก ${transfer.sender_name}`);
    },

    // แสดง Modal สอบถามการรับไฟล์
    showIncomingModal(transfer) {
      const modal = document.getElementById('fastShareIncomingModal');
      if (!modal) return;

      const senderNameEl = modal.querySelector('#fsModalSenderName');
      const fileNameEl = modal.querySelector('#fsModalFileName');
      const fileSizeEl = modal.querySelector('#fsModalFileSize');
      const fileIconEl = modal.querySelector('#fsModalFileIcon');
      const btnAccept = modal.querySelector('#fsBtnAccept');
      const btnDecline = modal.querySelector('#fsBtnDecline');

      if (senderNameEl) senderNameEl.textContent = transfer.sender_name || 'อุปกรณ์ใกล้เคียง';
      if (fileNameEl) fileNameEl.textContent = transfer.file_name || 'เอกสาร';
      if (fileSizeEl) fileSizeEl.textContent = this.formatBytes(transfer.file_size || 0);

      btnAccept.onclick = () => {
        modal.classList.add('hidden');
        this.acceptTransfer(transfer);
      };

      btnDecline.onclick = () => {
        modal.classList.add('hidden');
        this.declineTransfer(transfer);
      };

      modal.classList.remove('hidden');

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons({ root: modal });
      }
    },

    handleStatusUpdate(transfer) {
      // แจ้งเตือนฝั่งคนส่งว่าผู้รับกดยอมรับหรือปฏิเสธ
      if (transfer.sender_device_id === this.deviceId) {
        if (typeof this.onTransferStatusChange === 'function') {
          this.onTransferStatusChange(transfer);
        }
        if (transfer.status === 'accepted') {
          this.showToast(`🎉 ผู้รับกดยอมรับไฟล์ "${transfer.file_name}" แล้ว!`);
        } else if (transfer.status === 'declined') {
          this.showToast(`❌ ผู้รับปฏิเสธไฟล์ "${transfer.file_name}"`);
        }
      }
    },

    triggerDownload(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'fastshare_file';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    playSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {}
    },

    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    showToast(msg) {
      if (window.NotificationEngine && typeof window.NotificationEngine.showToast === 'function') {
        window.NotificationEngine.showToast({ title: 'FastShare Alert', message: msg, type: 'info' });
      } else {
        alert(msg);
      }
    },

    mountIncomingDialog() {
      if (document.getElementById('fastShareIncomingModal')) return;

      const div = document.createElement('div');
      div.id = 'fastShareIncomingModal';
      div.className = 'hidden fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200';
      div.innerHTML = `
        <div class="glass-card rounded-[32px] border border-orange-500/40 p-6 sm:p-7 max-w-sm w-full bg-slate-900/95 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 mx-auto shadow-xl shadow-orange-500/30">
            <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-orange-400">
              <i data-lucide="share-2" class="w-8 h-8 animate-pulse"></i>
            </div>
          </div>

          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
              AirDrop / QuickShare Live
            </span>
            <h3 class="text-base font-black text-white pt-1">
              <span id="fsModalSenderName">อุปกรณ์ใกล้เคียง</span> ต้องการส่งไฟล์ให้คุณ
            </h3>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-950 border border-white/10 flex items-center gap-3 text-left">
            <div id="fsModalFileIcon" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0">
              <i data-lucide="file" class="w-5 h-5 text-amber-400"></i>
            </div>
            <div class="min-w-0 flex-grow">
              <p id="fsModalFileName" class="text-xs font-bold text-white truncate">document.pdf</p>
              <p id="fsModalFileSize" class="text-[10px] text-slate-400 font-mono">0 MB</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-1">
            <button id="fsBtnDecline" type="button"
              class="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition cursor-pointer">
              ปฏิเสธ
            </button>
            <button id="fsBtnAccept" type="button"
              class="py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>ยอมรับไฟล์</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(div);
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons({ root: div });
      }
    }
  };

  window.FastShare = FastShare;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FastShare.init());
  } else {
    FastShare.init();
  }

})(window);
