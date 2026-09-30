/**
 * theme-manager.js
 * COMED KKU Global Theme Ecosystem Engine
 * Manages 6 Signature Themes across all pages:
 * 1. midnight (Default: Cyber Midnight Blue)
 * 2. comed (COMED Brand Neon Orange)
 * 3. emerald (Emerald Matrix Forest)
 * 4. gold (Royal Gold Luxury)
 * 5. nebula (Galaxy Nebula Cosmic Violet)
 * 6. platinum (Clean Platinum Glass Light)
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'COMED_ACTIVE_THEME';
  const USER_PREFS_KEY = 'COMED_USER_PREFERENCES';

  const THEMES = {
    midnight: {
      id: 'midnight',
      name: 'Midnight Cyber',
      desc: 'ครามดำลึก แสงไฟนีออนฟ้าไซเบอร์',
      accent: '#38bdf8',
      accentHover: '#0ea5e9',
      glow: 'rgba(56, 189, 248, 0.4)',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      isDark: true
    },
    comed: {
      id: 'comed',
      name: 'COMED Brand Neon',
      desc: 'ส้มเพลิงเอกลักษณ์สาขา KKU Amber Glow',
      accent: '#f97316',
      accentHover: '#ea580c',
      glow: 'rgba(249, 115, 22, 0.45)',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      isDark: true
    },
    emerald: {
      id: 'emerald',
      name: 'Emerald Matrix',
      desc: 'เขียวมรกต Forest Dark สบายตา ล้ำสมัย',
      accent: '#10b981',
      accentHover: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      isDark: true
    },
    gold: {
      id: 'gold',
      name: 'Royal Gold',
      desc: 'ดำทองคำหรูหราสง่างาม Imperial Luxury',
      accent: '#f59e0b',
      accentHover: '#d97706',
      glow: 'rgba(245, 158, 11, 0.45)',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      isDark: true
    },
    nebula: {
      id: 'nebula',
      name: 'Galaxy Nebula',
      desc: 'ม่วง-ชมพูคอสมิค Cosmic Violet อวกาศ',
      accent: '#a855f7',
      accentHover: '#9333ea',
      glow: 'rgba(168, 85, 247, 0.45)',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      isDark: true
    },
    platinum: {
      id: 'platinum',
      name: 'Clean Platinum',
      desc: 'สไตล์กระจกฝ้าสว่าง เรียบหรู Minimal Light',
      accent: '#0284c7',
      accentHover: '#0369a1',
      glow: 'rgba(2, 132, 199, 0.25)',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
      isDark: false
    }
  };

  class ThemeManager {
    constructor() {
      this.activeTheme = this.getStoredTheme();
      this.applyTheme(this.activeTheme, false);
      this.initListeners();
    }

    getStoredTheme() {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && THEMES[stored]) return stored;
        
        // Check user preferences if available
        const prefsRaw = localStorage.getItem(USER_PREFS_KEY);
        if (prefsRaw) {
          const prefs = JSON.parse(prefsRaw);
          if (prefs.theme && THEMES[prefs.theme]) return prefs.theme;
        }
      } catch (e) {}
      return 'midnight';
    }

    applyTheme(themeId, triggerToast = false) {
      const theme = THEMES[themeId] || THEMES.midnight;
      this.activeTheme = theme.id;

      // Update root attributes
      const root = document.documentElement;
      root.setAttribute('data-theme', theme.id);

      if (theme.isDark) {
        root.classList.add('dark');
        root.classList.remove('light-mode');
      } else {
        root.classList.remove('dark');
        root.classList.add('light-mode');
      }

      // Inject / update CSS variables dynamically
      this.injectThemeVariables(theme);

      // Persist to localStorage
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme.id);
        
        // Also sync to User Preferences object
        const prefsRaw = localStorage.getItem(USER_PREFS_KEY);
        let prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
        prefs.theme = theme.id;
        localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
      } catch (e) {}

      // Dispatch custom event for UI components listening across the app
      window.dispatchEvent(new CustomEvent('comed-theme-change', {
        detail: { theme: theme }
      }));

      // Update theme picker UI if on settings page
      this.updateSettingsPickerVisuals(theme.id);

      if (triggerToast && typeof window.showToast === 'function') {
        window.showToast(`เปลี่ยนธีมเป็น "${theme.name}" แล้ว ✨`, 'info');
      }
    }

    injectThemeVariables(theme) {
      let styleEl = document.getElementById('comed-dynamic-theme-vars');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'comed-dynamic-theme-vars';
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = `
        :root {
          --theme-accent: ${theme.accent};
          --theme-accent-hover: ${theme.accentHover};
          --theme-accent-glow: ${theme.glow};
        }
      `;
    }

    updateSettingsPickerVisuals(currentThemeId) {
      const cards = document.querySelectorAll('.theme-card-option');
      cards.forEach(card => {
        const id = card.getAttribute('data-theme-id');
        const checkIcon = card.querySelector('.theme-check-icon');
        const statusBadge = card.querySelector('.theme-status-badge');

        if (id === currentThemeId) {
          card.classList.add('ring-2', 'ring-[var(--theme-accent,#38bdf8)]', 'border-transparent', 'shadow-xl');
          card.classList.remove('border-slate-800');
          if (checkIcon) checkIcon.classList.remove('hidden');
          if (statusBadge) {
            statusBadge.textContent = 'ใช้งานอยู่';
            statusBadge.className = 'theme-status-badge text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
          }
        } else {
          card.classList.remove('ring-2', 'ring-[var(--theme-accent,#38bdf8)]', 'border-transparent', 'shadow-xl');
          card.classList.add('border-slate-800');
          if (checkIcon) checkIcon.classList.add('hidden');
          if (statusBadge) {
            statusBadge.textContent = 'เลือกใช้';
            statusBadge.className = 'theme-status-badge text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
          }
        }
      });
    }

    initListeners() {
      // Sync across multi-tab window
      window.addEventListener('storage', (e) => {
        if (e.key === THEME_STORAGE_KEY && e.newValue && THEMES[e.newValue]) {
          this.applyTheme(e.newValue, false);
        }
      });
    }

    getThemes() {
      return THEMES;
    }
  }

  // Initialize immediately to prevent flash of wrong theme
  window.ThemeManager = new ThemeManager();

  // Expose global helper
  window.setSystemTheme = function (themeId) {
    if (window.ThemeManager) {
      window.ThemeManager.applyTheme(themeId, true);
    }
  };
})();
