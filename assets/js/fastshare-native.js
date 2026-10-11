/**
 * =========================================================================
 * FASTSHARE NATIVE BRIDGE (CAPACITOR / BLUETOOTH LE / HARDWARE LAYER)
 * =========================================================================
 * จัดการเชื่อมต่อฮาร์ดแวร์ระดับเครื่องเมื่อรันบน Native App:
 * 1. ตรวจสอบว่าแอปกำลังรันบน Native หรือ Browser
 * 2. ควบคุม Bluetooth Low Energy (BLE Scan / Connect)
 * 3. แจ้งเตือนระดับระบบ (Native Haptics & Push)
 * =========================================================================
 */

(function (window) {
  'use strict';

  const NativeBridge = {
    isNative: false,
    bleAvailable: false,

    async init() {
      // ตรวจสอบว่ามี Capacitor รันอยู่หรือไม่
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        this.isNative = true;
        console.log('🚀 FastShare Native Bridge Active! Platform:', window.Capacitor.getPlatform());
        await this.initBluetooth();
      } else {
        console.log('🌐 FastShare running in Standard Web / PWA Mode.');
      }
    },

    async initBluetooth() {
      try {
        const BleClient = window.Capacitor?.Plugins?.BluetoothLe;
        if (BleClient) {
          await BleClient.initialize();
          this.bleAvailable = true;
          console.log('✅ Native Bluetooth LE Client Initialized successfully!');
        }
      } catch (err) {
        console.warn('⚠️ Native Bluetooth LE initialization notice:', err);
      }
    },

    /**
     * สแกนหาอุปกรณ์รอบข้างด้วยชิปบลูทูธเครื่องจริง
     */
    async scanBleDevices(durationMs = 5000, onDeviceFound) {
      if (!this.isNative || !this.bleAvailable) {
        console.log('Using Web-based Nearby Radar instead (Non-native environment)');
        return [];
      }

      try {
        const BleClient = window.Capacitor.Plugins.BluetoothLe;
        const devices = [];

        await BleClient.requestLEScan({}, (result) => {
          if (result && result.device) {
            const dev = {
              id: result.device.deviceId,
              name: result.device.name || 'อุปกรณ์บลูทูธใกล้เคียง',
              rssi: result.rssi,
              isBle: true
            };
            devices.push(dev);
            if (typeof onDeviceFound === 'function') {
              onDeviceFound(dev);
            }
          }
        });

        setTimeout(async () => {
          try {
            await BleClient.stopLEScan();
          } catch(e) {}
        }, durationMs);

        return devices;
      } catch (err) {
        console.error('BLE Scan Error:', err);
        return [];
      }
    },

    /**
     * สั่งสั่นเครื่องแบบ Haptic Feedback ระดับ Native
     */
    vibrate(pattern = [200, 100, 200]) {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(pattern);
      }
    }
  };

  window.FastShareNative = NativeBridge;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NativeBridge.init());
  } else {
    NativeBridge.init();
  }

})(window);
