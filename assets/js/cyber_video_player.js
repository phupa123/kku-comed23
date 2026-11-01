/**
 * COMED Cyber Video Player Engine
 * assets/js/cyber_video_player.js
 * 
 * Features:
 * - Cyberpunk Glassmorphism UI matching COMED theme (KKU Orange & Cyan accents)
 * - Custom Play/Pause, Rewind (-10s), Fast Forward (+10s)
 * - Smooth Interactive Seekbar with hover timestamp preview & buffered bar
 * - Volume slider with Mute toggle and audio level memory
 * - Playback Speed Selector (0.5x, 1x, 1.25x, 1.5x, 2x)
 * - Picture-in-Picture (PiP) & Fullscreen support (with orientation lock on mobile)
 * - Keyboard Shortcuts: Space (Play/Pause), Left/Right (Seek), Up/Down (Volume), F (Fullscreen), M (Mute)
 * - Double tap on mobile (Left to rewind 10s, Right to forward 10s)
 * - Auto-hide controls during playback on inactivity
 * - Loop Toggle & Download shortcut
 */

(function (window) {
  'use strict';

  let playerInstanceIdCounter = 0;

  class CyberVideoPlayer {
    /**
     * @param {HTMLElement|string} container - The container element or selector
     * @param {Object} options - Options including src, poster, title, autoplay
     */
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) return;

      this.id = `cyber-player-${++playerInstanceIdCounter}`;
      this.options = Object.assign({
        src: '',
        poster: '',
        title: '',
        autoplay: false,
        loop: false,
        muted: false,
        preload: 'metadata'
      }, options);

      this.hideControlsTimeout = null;
      this.lastVolume = 1;
      this.initUI();
      this.bindEvents();
    }

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      const formattedM = m < 10 ? `0${m}` : `${m}`;
      const formattedS = s < 10 ? `0${s}` : `${s}`;
      return `${formattedM}:${formattedS}`;
    }

    initUI() {
      this.container.classList.add('relative', 'group', 'overflow-hidden', 'rounded-2xl', 'bg-black', 'border', 'border-white/10', 'shadow-2xl', 'select-none');
      this.container.tabIndex = 0; // Focusable for keyboard shortcuts

      this.container.innerHTML = `
        <!-- Main Video Element -->
        <video 
          id="${this.id}-video" 
          src="${this.options.src}" 
          poster="${this.options.poster}" 
          preload="${this.options.preload}" 
          playsinline 
          class="w-full h-full object-contain max-h-[75vh] block cursor-pointer transition duration-300">
        </video>

        <!-- Big Center Play Button Overlay -->
        <div id="${this.id}-bigPlayBtn" class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all duration-300 cursor-pointer z-10">
          <button type="button" class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#B32B19] via-[#E65A19] to-[#FF7A29] text-white flex items-center justify-center shadow-[0_0_35px_rgba(230,90,25,0.7)] border-2 border-white/40 transform transition hover:scale-110 active:scale-95">
            <i class="bi bi-play-fill text-3xl sm:text-4xl translate-x-0.5"></i>
          </button>
        </div>

        <!-- Double Tap Seek Feedback Ripple Overlays -->
        <div id="${this.id}-seekFeedbackLeft" class="absolute left-0 top-0 bottom-16 w-1/3 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 z-10">
          <div class="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl">
            <i class="bi bi-arrow-counterclockwise text-orange-400 text-sm"></i>
            <span>-10s</span>
          </div>
        </div>
        <div id="${this.id}-seekFeedbackRight" class="absolute right-0 top-0 bottom-16 w-1/3 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 z-10">
          <div class="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl">
            <span>+10s</span>
            <i class="bi bi-arrow-clockwise text-orange-400 text-sm"></i>
          </div>
        </div>

        <!-- Top Title Bar Overlay (Shows on Hover/Pause) -->
        <div id="${this.id}-topBar" class="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-20">
          <div class="flex items-center gap-2 truncate pr-4">
            <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-xs sm:text-sm font-black text-white truncate drop-shadow">${this.options.title || 'COMED Live Video'}</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="${this.options.src}" download target="_blank" title="ดาวน์โหลดวิดีโอนี้" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white flex items-center justify-center transition text-xs">
              <i class="bi bi-download"></i>
            </a>
          </div>
        </div>

        <!-- Bottom Controls Bar Overlay -->
        <div id="${this.id}-controls" class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2.5 transition-all duration-300 z-20">
          
          <!-- Progress Bar & Scrubber Container -->
          <div class="relative w-full py-1.5 cursor-pointer group/progress" id="${this.id}-progressWrap">
            <!-- Timestamp Floating Hover Preview -->
            <div id="${this.id}-hoverTime" class="absolute -top-7 px-2 py-0.5 rounded-lg bg-black/90 border border-white/20 text-[10px] font-mono text-orange-400 font-bold -translate-x-1/2 opacity-0 pointer-events-none transition-opacity shadow-lg">00:00</div>
            
            <div class="w-full h-1.5 group-hover/progress:h-2.5 bg-white/20 rounded-full relative overflow-hidden transition-all duration-150">
              <!-- Buffer Bar -->
              <div id="${this.id}-bufferBar" class="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full w-0 transition-all duration-200"></div>
              <!-- Played Progress Bar -->
              <div id="${this.id}-progressBar" class="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#B32B19] via-[#E65A19] to-[#FF7A29] rounded-full w-0 relative">
                <span class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#E65A19] opacity-0 group-hover/progress:opacity-100 transition-opacity"></span>
              </div>
            </div>
          </div>

          <!-- Controls Lower Row -->
          <div class="flex items-center justify-between text-white text-xs sm:text-sm">
            
            <!-- Left Actions: Play/Pause, Rewind, Forward, Volume, Time -->
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Play / Pause Button -->
              <button type="button" id="${this.id}-playBtn" title="เล่น/หยุด (Space)" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-orange-500/30 text-white flex items-center justify-center transition border border-white/10 cursor-pointer">
                <i class="bi bi-play-fill text-lg"></i>
              </button>

              <!-- Rewind 10s -->
              <button type="button" id="${this.id}-rewindBtn" title="ย้อนกลับ 10 วินาที (←)" class="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
                <i class="bi bi-arrow-counterclockwise text-sm"></i>
              </button>

              <!-- Forward 10s -->
              <button type="button" id="${this.id}-forwardBtn" title="ไปข้างหน้า 10 วินาที (→)" class="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
                <i class="bi bi-arrow-clockwise text-sm"></i>
              </button>

              <!-- Volume Control Wrap -->
              <div class="flex items-center gap-1.5 group/volume">
                <button type="button" id="${this.id}-muteBtn" title="เปิด/ปิดเสียง (M)" class="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
                  <i class="bi bi-volume-up-fill text-sm"></i>
                </button>
                <div class="w-0 group-hover/volume:w-16 sm:group-hover/volume:w-20 transition-all duration-300 overflow-hidden flex items-center">
                  <input type="range" id="${this.id}-volumeSlider" min="0" max="1" step="0.05" value="1" class="w-16 sm:w-20 h-1 accent-[#E65A19] cursor-pointer bg-white/30 rounded-lg">
                </div>
              </div>

              <!-- Time Display -->
              <div class="font-mono text-[11px] text-slate-300 flex items-center gap-1 select-none">
                <span id="${this.id}-currentTime" class="text-white font-bold">00:00</span>
                <span class="text-slate-500">/</span>
                <span id="${this.id}-durationTime">00:00</span>
              </div>
            </div>

            <!-- Right Actions: Speed, Loop, PiP, Fullscreen -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              
              <!-- Playback Speed Menu -->
              <div class="relative" id="${this.id}-speedMenuWrap">
                <button type="button" id="${this.id}-speedBtn" class="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-mono font-bold text-slate-200 transition cursor-pointer">
                  1x
                </button>
                <div id="${this.id}-speedDropdown" class="hidden absolute right-0 bottom-full mb-2 w-20 py-1 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl flex flex-col z-30 font-mono text-[11px]">
                  <button type="button" data-speed="0.5" class="px-2.5 py-1 text-left text-slate-300 hover:bg-orange-500/20 hover:text-orange-400">0.5x</button>
                  <button type="button" data-speed="1" class="px-2.5 py-1 text-left text-orange-400 font-bold hover:bg-orange-500/20">1.0x</button>
                  <button type="button" data-speed="1.25" class="px-2.5 py-1 text-left text-slate-300 hover:bg-orange-500/20 hover:text-orange-400">1.25x</button>
                  <button type="button" data-speed="1.5" class="px-2.5 py-1 text-left text-slate-300 hover:bg-orange-500/20 hover:text-orange-400">1.5x</button>
                  <button type="button" data-speed="2" class="px-2.5 py-1 text-left text-slate-300 hover:bg-orange-500/20 hover:text-orange-400">2.0x</button>
                </div>
              </div>

              <!-- Loop Toggle Button -->
              <button type="button" id="${this.id}-loopBtn" title="เล่นวนซ้ำ" class="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer">
                <i class="bi bi-repeat text-sm"></i>
              </button>

              <!-- Picture in Picture (PiP) -->
              <button type="button" id="${this.id}-pipBtn" title="เล่นแบบหน้าต่างลอย (PiP)" class="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer hidden sm:flex">
                <i class="bi bi-pip text-sm"></i>
              </button>

              <!-- Fullscreen Button -->
              <button type="button" id="${this.id}-fullscreenBtn" title="เต็มจอ (F)" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-orange-500/30 text-white flex items-center justify-center transition border border-white/10 cursor-pointer">
                <i class="bi bi-fullscreen text-sm"></i>
              </button>

            </div>

          </div>

        </div>
      `;

      // Cache DOM Elements
      this.video = document.getElementById(`${this.id}-video`);
      this.bigPlayBtn = document.getElementById(`${this.id}-bigPlayBtn`);
      this.topBar = document.getElementById(`${this.id}-topBar`);
      this.controls = document.getElementById(`${this.id}-controls`);
      this.playBtn = document.getElementById(`${this.id}-playBtn`);
      this.rewindBtn = document.getElementById(`${this.id}-rewindBtn`);
      this.forwardBtn = document.getElementById(`${this.id}-forwardBtn`);
      this.muteBtn = document.getElementById(`${this.id}-muteBtn`);
      this.volumeSlider = document.getElementById(`${this.id}-volumeSlider`);
      this.currentTimeEl = document.getElementById(`${this.id}-currentTime`);
      this.durationTimeEl = document.getElementById(`${this.id}-durationTime`);
      this.progressWrap = document.getElementById(`${this.id}-progressWrap`);
      this.progressBar = document.getElementById(`${this.id}-progressBar`);
      this.bufferBar = document.getElementById(`${this.id}-bufferBar`);
      this.hoverTimeEl = document.getElementById(`${this.id}-hoverTime`);
      this.speedBtn = document.getElementById(`${this.id}-speedBtn`);
      this.speedDropdown = document.getElementById(`${this.id}-speedDropdown`);
      this.loopBtn = document.getElementById(`${this.id}-loopBtn`);
      this.pipBtn = document.getElementById(`${this.id}-pipBtn`);
      this.fullscreenBtn = document.getElementById(`${this.id}-fullscreenBtn`);
      this.seekFeedbackLeft = document.getElementById(`${this.id}-seekFeedbackLeft`);
      this.seekFeedbackRight = document.getElementById(`${this.id}-seekFeedbackRight`);
    }

    bindEvents() {
      if (!this.video) return;

      // Toggle Play
      const togglePlay = () => {
        if (this.video.paused || this.video.ended) {
          this.video.play().catch(() => {});
        } else {
          this.video.pause();
        }
      };

      this.video.addEventListener('click', togglePlay);
      this.bigPlayBtn.addEventListener('click', togglePlay);
      this.playBtn.addEventListener('click', togglePlay);

      // Play/Pause State
      this.video.addEventListener('play', () => {
        this.playBtn.innerHTML = '<i class="bi bi-pause-fill text-lg"></i>';
        this.bigPlayBtn.classList.add('opacity-0', 'pointer-events-none');
        this.resetControlsTimeout();
      });

      this.video.addEventListener('pause', () => {
        this.playBtn.innerHTML = '<i class="bi bi-play-fill text-lg"></i>';
        this.bigPlayBtn.classList.remove('opacity-0', 'pointer-events-none');
        this.showControls();
      });

      // Update Progress & Time
      this.video.addEventListener('timeupdate', () => {
        if (!this.isScrubbing) {
          const current = this.video.currentTime;
          const duration = this.video.duration || 0;
          const pct = duration > 0 ? (current / duration) * 100 : 0;
          this.progressBar.style.width = `${pct}%`;
          this.currentTimeEl.textContent = this.formatTime(current);
        }
      });

      this.video.addEventListener('loadedmetadata', () => {
        this.durationTimeEl.textContent = this.formatTime(this.video.duration);
      });

      // Update Buffer Bar
      this.video.addEventListener('progress', () => {
        if (this.video.buffered.length > 0 && this.video.duration > 0) {
          const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
          const pct = (bufferedEnd / this.video.duration) * 100;
          this.bufferBar.style.width = `${pct}%`;
        }
      });

      // Seek / Progress Scrubber
      const seek = (e) => {
        const rect = this.progressWrap.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (this.video.duration) {
          this.video.currentTime = pos * this.video.duration;
          this.progressBar.style.width = `${pos * 100}%`;
        }
      };

      this.progressWrap.addEventListener('click', seek);

      // Hover Timestamp
      this.progressWrap.addEventListener('mousemove', (e) => {
        const rect = this.progressWrap.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hoverSec = pos * (this.video.duration || 0);
        this.hoverTimeEl.textContent = this.formatTime(hoverSec);
        this.hoverTimeEl.style.left = `${pos * 100}%`;
        this.hoverTimeEl.classList.remove('opacity-0');
      });

      this.progressWrap.addEventListener('mouseleave', () => {
        this.hoverTimeEl.classList.add('opacity-0');
      });

      // Rewind / Forward
      this.rewindBtn.addEventListener('click', () => this.seekDelta(-10));
      this.forwardBtn.addEventListener('click', () => this.seekDelta(10));

      // Double Tap detection for Mobile
      let lastTapTime = 0;
      this.video.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
          const rect = this.container.getBoundingClientRect();
          const touchX = e.changedTouches[0].clientX - rect.left;
          if (touchX < rect.width / 2) {
            this.seekDelta(-10);
            this.triggerFeedback(this.seekFeedbackLeft);
          } else {
            this.seekDelta(10);
            this.triggerFeedback(this.seekFeedbackRight);
          }
          e.preventDefault();
        }
        lastTapTime = currentTime;
      });

      // Volume Slider
      this.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.video.volume = val;
        this.video.muted = (val === 0);
        this.updateVolumeUI();
      });

      // Mute Toggle
      this.muteBtn.addEventListener('click', () => {
        if (this.video.muted || this.video.volume === 0) {
          this.video.muted = false;
          this.video.volume = this.lastVolume || 1;
        } else {
          this.lastVolume = this.video.volume;
          this.video.muted = true;
          this.video.volume = 0;
        }
        this.volumeSlider.value = this.video.volume;
        this.updateVolumeUI();
      });

      // Playback Speed Selector
      this.speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speedDropdown.classList.toggle('hidden');
      });

      this.speedDropdown.querySelectorAll('button[data-speed]').forEach(btn => {
        btn.addEventListener('click', () => {
          const speed = parseFloat(btn.dataset.speed);
          this.video.playbackRate = speed;
          this.speedBtn.textContent = `${speed}x`;
          this.speedDropdown.classList.add('hidden');
        });
      });

      document.addEventListener('click', () => {
        this.speedDropdown.classList.add('hidden');
      });

      // Loop Toggle
      this.loopBtn.addEventListener('click', () => {
        this.video.loop = !this.video.loop;
        if (this.video.loop) {
          this.loopBtn.classList.remove('text-slate-400');
          this.loopBtn.classList.add('text-orange-400', 'bg-white/10');
        } else {
          this.loopBtn.classList.remove('text-orange-400', 'bg-white/10');
          this.loopBtn.classList.add('text-slate-400');
        }
      });

      // Picture-in-Picture
      if (document.pictureInPictureEnabled) {
        this.pipBtn.addEventListener('click', async () => {
          try {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await this.video.requestPictureInPicture();
            }
          } catch (e) {
            console.warn('[CyberVideoPlayer] PiP error:', e);
          }
        });
      } else {
        this.pipBtn.style.display = 'none';
      }

      // Fullscreen
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      this.video.addEventListener('dblclick', () => this.toggleFullscreen());

      // Auto-hide controls on mouse idle
      this.container.addEventListener('mousemove', () => {
        this.showControls();
        this.resetControlsTimeout();
      });

      this.container.addEventListener('mouseleave', () => {
        if (!this.video.paused) {
          this.hideControls();
        }
      });

      // Keyboard Shortcuts
      this.container.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
          case ' ':
          case 'k':
            e.preventDefault();
            togglePlay();
            break;
          case 'arrowleft':
          case 'j':
            e.preventDefault();
            this.seekDelta(-10);
            this.triggerFeedback(this.seekFeedbackLeft);
            break;
          case 'arrowright':
          case 'l':
            e.preventDefault();
            this.seekDelta(10);
            this.triggerFeedback(this.seekFeedbackRight);
            break;
          case 'arrowup':
            e.preventDefault();
            this.video.volume = Math.min(1, this.video.volume + 0.1);
            this.volumeSlider.value = this.video.volume;
            this.updateVolumeUI();
            break;
          case 'arrowdown':
            e.preventDefault();
            this.video.volume = Math.max(0, this.video.volume - 0.1);
            this.volumeSlider.value = this.video.volume;
            this.updateVolumeUI();
            break;
          case 'f':
            e.preventDefault();
            this.toggleFullscreen();
            break;
          case 'm':
            e.preventDefault();
            this.muteBtn.click();
            break;
        }
      });
    }

    seekDelta(seconds) {
      if (!this.video) return;
      this.video.currentTime = Math.max(0, Math.min(this.video.duration || 0, this.video.currentTime + seconds));
    }

    triggerFeedback(element) {
      if (!element) return;
      element.classList.remove('opacity-0');
      element.classList.add('opacity-100');
      setTimeout(() => {
        element.classList.remove('opacity-100');
        element.classList.add('opacity-0');
      }, 500);
    }

    updateVolumeUI() {
      if (this.video.muted || this.video.volume === 0) {
        this.muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill text-rose-400 text-sm"></i>';
      } else if (this.video.volume < 0.5) {
        this.muteBtn.innerHTML = '<i class="bi bi-volume-down-fill text-sm"></i>';
      } else {
        this.muteBtn.innerHTML = '<i class="bi bi-volume-up-fill text-sm"></i>';
      }
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen?.().catch(() => {});
        this.fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit text-sm"></i>';
      } else {
        document.exitFullscreen?.().catch(() => {});
        this.fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen text-sm"></i>';
      }
    }

    showControls() {
      this.controls.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      this.topBar.classList.remove('opacity-0', '-translate-y-2', 'pointer-events-none');
    }

    hideControls() {
      if (this.video.paused) return;
      this.controls.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
      this.topBar.classList.add('opacity-0', '-translate-y-2', 'pointer-events-none');
    }

    resetControlsTimeout() {
      clearTimeout(this.hideControlsTimeout);
      this.hideControlsTimeout = setTimeout(() => {
        this.hideControls();
      }, 3000);
    }
  }

  // Global helper to create a Cyber Video Player easily
  window.CyberVideoPlayer = CyberVideoPlayer;
  window.createCyberVideoPlayer = function(container, options) {
    return new CyberVideoPlayer(container, options);
  };

})(window);
