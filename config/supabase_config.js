/**
 * =========================================================================
 * SUPABASE CLIENT & CLOUD SYNC CONFIGURATION
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 * =========================================================================
 */

// Supabase Credentials (Loaded securely for Client Application)
window.SUPABASE_CONFIG = {
  url: "https://drqrliajxigxyrfaypfg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycXJsaWFqeGlneHlyZmF5cGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTQ1ODYsImV4cCI6MjEwNDA5MDU4Nn0.9IEsTHlUiVZEzNsqIaKeH5g1SzXw91SRALGeKFct0Nw"
};

// Initialize Supabase Client if library loaded
window.getSupabaseClient = function() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    if (!window._supabaseClientInstance) {
      try {
        window._supabaseClientInstance = window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.anonKey
        );
      } catch(e) {
        console.warn("Supabase client init suppressed:", e);
        return null;
      }
    }
    return window._supabaseClientInstance;
  }
  return null;
};

// Global Handler: Prevent browser uncaught promise errors from noisy external network failures
window.addEventListener('unhandledrejection', function(event) {
  const reason = event.reason;
  const reasonStr = String(reason || '');
  if (
    reasonStr.includes('Load failed') ||
    reasonStr.includes('access control checks') ||
    reasonStr.includes('Failed to fetch') ||
    reasonStr.includes('NetworkError') ||
    (reason && reason.name === 'TypeError' && reasonStr.includes('Load failed'))
  ) {
    // Suppress noisy network rejection popup/logs
    event.preventDefault();
    console.warn("[SafeNetworkGuard] Suppressed background fetch/network error:", reason);
  }
});

