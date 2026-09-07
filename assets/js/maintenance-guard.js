/**
 * =========================================================================
 * SITE MAINTENANCE & ACCESS GUARD - assets/js/maintenance-guard.js
 * COMED KKU 69 CENTRAL PROTECTION LAYER
 * =========================================================================
 */

const MAINT_CONFIG_KEY = 'COMED_MAINTENANCE_CONFIG_V1';
const GAS_CONFIG_API_URL = "https://script.google.com/macros/s/AKfycbxEaT4wLt0Ohl1UF9tz5EH7L49LTgyKYf8jxlr17lFDwv0hZcacO04NK0Ra7Av5y2wT/exec";

// Supabase REST endpoint for global cross-device synchronization
const SUPABASE_URL = "https://drqrliajxigxyrfaypfg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycXJsaWFqeGlneHlyZmF5cGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTQ1ODYsImV4cCI6MjEwNDA5MDU4Nn0.9IEsTHlUiVZEzNsqIaKeH5g1SzXw91SRALGeKFct0Nw";

(function() {
  function checkAndRedirect(config) {
    if (!config) return;

    // 1. Identify target page name
    const currentPath = window.location.pathname.toLowerCase();
    
    // Safety check: Never block admin or status pages
    if (
      currentPath.includes('admin.html') ||
      currentPath.includes('payment-admin.html') ||
      currentPath.includes('index-admin.html') ||
      currentPath.includes('event-admin.html') ||
      currentPath.includes('maintenance.html') ||
      currentPath.includes('404.html')
    ) {
      return;
    }

    let pageKey = 'index';
    if (currentPath.includes('payment') || currentPath.includes('payment.html')) {
      pageKey = 'payment';
    } else if (currentPath.includes('event') || currentPath.includes('event.html')) {
      pageKey = 'event';
    }

    const globalLock = config['all'] && config['all'].active;
    const pageLock = config[pageKey] && config[pageKey].active;

    if (globalLock || pageLock) {
      const activeLock = globalLock ? config['all'] : config[pageKey];

      // Check Countdown Expiration
      if (activeLock && activeLock.endTime) {
        const endTimestamp = new Date(activeLock.endTime).getTime();
        const now = Date.now();
        if (now >= endTimestamp) {
          activeLock.active = false;
          localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(config));
          return;
        }
      }

      // Redirect immediately to Maintenance Screen
      window.location.replace(`maintenance.html?page=${globalLock ? 'all' : pageKey}`);
    }
  }

  try {
    const currentPath = window.location.pathname.toLowerCase();
    if (
      currentPath.includes('admin.html') ||
      currentPath.includes('payment-admin.html') ||
      currentPath.includes('index-admin.html') ||
      currentPath.includes('maintenance.html') ||
      currentPath.includes('404.html')
    ) {
      return;
    }

    // Step 1: Immediate Synchronous Check from LocalStorage
    const stored = localStorage.getItem(MAINT_CONFIG_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        checkAndRedirect(config);
      } catch(e) {}
    }

    // Step 2: High-speed Cloud Sync Check via Supabase (Guarantees all other devices/users lock instantly)
    fetch(`${SUPABASE_URL}/rest/v1/campaigns?id=eq.system_maintenance_config&select=id,closed_reason`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0 && data[0].closed_reason) {
        try {
          const cloudConfig = JSON.parse(data[0].closed_reason);
          if (cloudConfig && typeof cloudConfig === 'object' && cloudConfig.all) {
            localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(cloudConfig));
            checkAndRedirect(cloudConfig);
          }
        } catch(e) {}
      }
    })
    .catch(() => {});

    // Step 3: Fallback Background Sync Check via GAS
    if (GAS_CONFIG_API_URL) {
      fetch(GAS_CONFIG_API_URL + "?action=get_maintenance_config")
        .then(res => res.json())
        .then(cloudConfig => {
          if (cloudConfig && typeof cloudConfig === 'object' && cloudConfig.all) {
            localStorage.setItem(MAINT_CONFIG_KEY, JSON.stringify(cloudConfig));
            checkAndRedirect(cloudConfig);
          }
        })
        .catch(() => {});
    }

  } catch(e) {
    console.warn("Maintenance Guard Check", e);
  }
})();
