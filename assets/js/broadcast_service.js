/**
 * COMED KKU - Broadcast & Announcement Service
 * assets/js/broadcast_service.js
 * 
 * Supports:
 * - Supabase Realtime synchronization with fallback to LocalStorage/Mock
 * - Rich media (Images, Videos, YouTube embeds, File attachments)
 * - Hero carousel / slider UI for index.html
 * - Full reading Cyber Glass Modal with download links
 * - Admin CRUD functions
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'comed_broadcasts_cache';

  const DEFAULT_BROADCASTS = [
    {
      id: 'demo-1',
      title: 'ยินดีต้อนรับเพื่อนๆ นักศึกษาชั้นปีที่ 1 สาขาคอมพิวเตอร์ศึกษา (COMED KKU 69)',
      category: 'announcement', // announcement, urgent, event, academic
      category_label: '📢 ประชาสัมพันธ์ทั่วไป',
      summary: 'ขอต้อนรับนักศึกษาใหม่ทุกท่านสู่ครอบครัวคอมพิวเตอร์ศึกษา มหาวิทยาลัยขอนแก่น พร้อมติดตามข่าวสารกิจกรรมและกำหนดการสำคัญได้ที่นี่',
      content_html: `
        <p class="mb-3">ยินดีต้อนรับเพื่อนๆ นักศึกษาใหม่ ชั้นปีที่ 1 ปีการศึกษา 2569 ทุกท่านอย่างเป็นทางการ!</p>
        <p class="mb-3">ทางสาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น ได้จัดเตรียมระบบศูนย์กลางข้อมูลสารสนเทศและกิจกรรม เพื่อให้นักศึกษาสามารถติดตามกำหนดการสำคัญ เอกสารประกอบการเรียน และข่าวสารกิจกรรมต่างๆ ได้อย่างรวดเร็ว</p>
        <div class="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm mb-3">
          <strong>📌 สิ่งที่ต้องดำเนินการสำหรับนักศึกษาใหม่:</strong>
          <ul class="list-disc list-inside mt-2 space-y-1 text-slate-300">
            <li>ตรวจสอบและอัปเดตข้อมูลส่วนตัวในระบบสารสนเทศนักศึกษา</li>
            <li>ติดตามกำหนดการชำระเงินค่ากิจกรรมและอุปกรณ์สาขาวิชา</li>
            <li>เข้าร่วมกลุ่มเพื่อรับการติดต่อสื่อสารประจำรุ่น</li>
          </ul>
        </div>
      `,
      banner_url: 'assets/images/banner_welcome.jpg',
      media_type: 'image', // 'none', 'image', 'video', 'youtube'
      media_url: '',
      attachments: [
        {
          name: 'คู่มือนักศึกษาใหม่_COMED_KKU.pdf',
          url: 'https://example.com/guide.pdf',
          size: '2.4 MB',
          type: 'pdf'
        }
      ],
      pinned: true,
      active: true,
      views_count: 142,
      author_name: 'ฝ่ายประชาสัมพันธ์สาขาฯ',
      created_at: new Date().toISOString(),
      expires_at: null
    }
  ];

  class BroadcastService {
    constructor() {
      this.broadcasts = [];
      this.currentSlideIndex = 0;
      this.autoSlideTimer = null;
      this.init();
    }

    init() {
      this.loadCachedBroadcasts();
      this.fetchFromSupabase();
    }

    getSupabaseClient() {
      if (typeof window.getSupabaseClient === 'function') {
        return window.getSupabaseClient();
      }
      if (window.supabase && window.SUPABASE_CONFIG) {
        return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
      }
      return null;
    }

    loadCachedBroadcasts() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.broadcasts = JSON.parse(raw);
        } else {
          this.broadcasts = DEFAULT_BROADCASTS;
        }
      } catch (e) {
        console.warn('[BroadcastService] Failed to load cache:', e);
        this.broadcasts = DEFAULT_BROADCASTS;
      }
    }

    saveCachedBroadcasts() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.broadcasts));
      } catch (e) {
        console.warn('[BroadcastService] Failed to save cache:', e);
      }
    }

    async fetchFromSupabase() {
      const client = this.getSupabaseClient();
      if (!client) {
        this.renderUI();
        return;
      }

      try {
        const { data, error } = await client
          .from('broadcasts')
          .select('*')
          .eq('active', true)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          this.broadcasts = data;
          this.saveCachedBroadcasts();
        }
      } catch (e) {
        console.warn('[BroadcastService] Fetch error, using cache:', e);
      }

      this.renderUI();
      this.subscribeRealtime();
    }

    subscribeRealtime() {
      const client = this.getSupabaseClient();
      if (!client || typeof client.channel !== 'function') return;

      client.channel('broadcasts-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
          this.fetchFromSupabase();
        })
        .subscribe();
    }

    getActiveBroadcasts() {
      const now = new Date();
      return this.broadcasts.filter(b => {
        if (!b.active) return false;
        if (b.expires_at) {
          const exp = new Date(b.expires_at);
          if (exp < now) return false;
        }
        return true;
      });
    }

    getCategoryBadge(category) {
      switch (category) {
        case 'urgent':
          return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> ประกาศด่วนมาก</span>`;
        case 'event':
          return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> กิจกรรมสาขา</span>`;
        case 'academic':
          return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"><i data-lucide="book-open" class="w-3.5 h-3.5"></i> ข่าวการศึกษา</span>`;
        default:
          return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40"><i data-lucide="megaphone" class="w-3.5 h-3.5"></i> ประชาสัมพันธ์</span>`;
      }
    }

    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const d = new Date(dateString);
        return d.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    }

    renderUI() {
      const container = document.getElementById('broadcastHeroContainer');
      if (!container) return;

      const items = this.getActiveBroadcasts();
      if (!items || items.length === 0) {
        container.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');

      let slidesHtml = '';
      let indicatorsHtml = '';

      items.forEach((item, idx) => {
        const activeClass = idx === 0 ? 'opacity-100 relative pointer-events-auto z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0';
        const indicatorActive = idx === 0 ? 'bg-orange-500 w-8' : 'bg-white/30 w-2.5';
        const mediaPreview = item.banner_url 
          ? `<img src="${item.banner_url}" alt="${item.title}" class="w-full h-full object-cover rounded-2xl brightness-90 group-hover:scale-105 transition duration-500" onerror="this.parentElement.style.display='none'">`
          : `<div class="w-full h-full bg-gradient-to-br from-orange-600/30 to-purple-600/30 rounded-2xl flex items-center justify-center"><i data-lucide="sparkles" class="w-16 h-16 text-orange-400/50"></i></div>`;

        slidesHtml += `
          <div class="broadcast-slide transition-opacity duration-700 ease-in-out ${activeClass}" data-slide-index="${idx}">
            <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                <!-- Info Column -->
                <div class="lg:col-span-7 space-y-4">
                  <div class="flex flex-wrap items-center gap-2">
                    ${item.pinned ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 font-mono tracking-wide"><i data-lucide="pin" class="w-3 h-3"></i> PINNED</span>' : ''}
                    ${this.getCategoryBadge(item.category)}
                    <span class="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${this.formatDate(item.created_at)}
                    </span>
                  </div>

                  <h2 class="text-lg sm:text-2xl font-black text-white leading-snug line-clamp-2 hover:text-orange-400 transition cursor-pointer" onclick="window.BroadcastServiceInstance.openModal('${item.id}')">
                    ${item.title}
                  </h2>

                  <p class="text-slate-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    ${item.summary || ''}
                  </p>

                  <div class="pt-2 flex flex-wrap items-center gap-3">
                    <button type="button" onclick="window.BroadcastServiceInstance.openModal('${item.id}')"
                      class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-orange-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                      <span>อ่านประกาศฉบับเต็ม</span>
                      <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>

                    ${item.attachments && item.attachments.length > 0 ? `
                      <span class="text-xs text-slate-400 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <i data-lucide="paperclip" class="w-3.5 h-3.5 text-orange-400"></i>
                        <span>มีเอกสารแนบ (${item.attachments.length})</span>
                      </span>
                    ` : ''}
                  </div>
                </div>

                <!-- Media Column -->
                <div class="lg:col-span-5 hidden sm:block">
                  <div class="relative aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-inner group cursor-pointer" onclick="window.BroadcastServiceInstance.openModal('${item.id}')">
                    ${mediaPreview}
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                      <span class="text-[11px] text-white/90 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <i data-lucide="expand" class="w-3 h-3 text-orange-400"></i> คลิกเพื่อดูรายละเอียดทั้งหมด
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        `;

        indicatorsHtml += `
          <button type="button" onclick="window.BroadcastServiceInstance.goToSlide(${idx})" class="h-2 rounded-full transition-all duration-300 ${indicatorActive}" aria-label="Slide ${idx + 1}"></button>
        `;
      });

      container.innerHTML = `
        <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div class="relative">
            <!-- Slides Container -->
            <div id="broadcastSlidesWrapper" class="relative min-h-[220px] sm:min-h-[260px]">
              ${slidesHtml}
            </div>

            <!-- Controls (if more than 1) -->
            ${items.length > 1 ? `
              <div class="flex items-center justify-between mt-3 px-2">
                <div class="flex items-center gap-1.5" id="broadcastIndicators">
                  ${indicatorsHtml}
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="window.BroadcastServiceInstance.prevSlide()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition cursor-pointer">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <button type="button" onclick="window.BroadcastServiceInstance.nextSlide()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition cursor-pointer">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      if (typeof lucide !== 'undefined') lucide.createIcons();
      this.startAutoSlide(items.length);
    }

    startAutoSlide(total) {
      if (this.autoSlideTimer) clearInterval(this.autoSlideTimer);
      if (total <= 1) return;

      this.autoSlideTimer = setInterval(() => {
        this.nextSlide();
      }, 7000);
    }

    goToSlide(index) {
      const items = this.getActiveBroadcasts();
      if (!items || items.length === 0) return;

      this.currentSlideIndex = (index + items.length) % items.length;
      const slides = document.querySelectorAll('.broadcast-slide');
      slides.forEach((sl, idx) => {
        if (idx === this.currentSlideIndex) {
          sl.classList.remove('opacity-0', 'pointer-events-none', 'z-0', 'absolute', 'inset-0');
          sl.classList.add('opacity-100', 'pointer-events-auto', 'z-10', 'relative');
        } else {
          sl.classList.remove('opacity-100', 'pointer-events-auto', 'z-10', 'relative');
          sl.classList.add('opacity-0', 'pointer-events-none', 'z-0', 'absolute', 'inset-0');
        }
      });

      const indicators = document.querySelectorAll('#broadcastIndicators button');
      indicators.forEach((ind, idx) => {
        if (idx === this.currentSlideIndex) {
          ind.className = 'h-2 rounded-full transition-all duration-300 bg-orange-500 w-8';
        } else {
          ind.className = 'h-2 rounded-full transition-all duration-300 bg-white/30 w-2.5';
        }
      });
    }

    nextSlide() {
      const items = this.getActiveBroadcasts();
      this.goToSlide(this.currentSlideIndex + 1);
    }

    prevSlide() {
      this.goToSlide(this.currentSlideIndex - 1);
    }

    openModal(id) {
      const item = this.broadcasts.find(b => b.id === id);
      if (!item) return;

      // Track views count locally or in db
      item.views_count = (item.views_count || 0) + 1;

      let modal = document.getElementById('broadcastDetailModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'broadcastDetailModal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300';
        document.body.appendChild(modal);
      }

      let mediaElement = '';
      if (item.media_type === 'youtube' && item.media_url) {
        let ytId = '';
        const match = item.media_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match) ytId = match[1];
        if (ytId) {
          mediaElement = `
            <div class="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 mb-5">
              <iframe src="https://www.youtube.com/embed/${ytId}" title="${item.title}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        }
      } else if (item.media_type === 'video' && item.media_url) {
        mediaElement = `
          <div class="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 mb-5 bg-black">
            <video src="${item.media_url}" controls class="w-full h-full object-contain"></video>
          </div>
        `;
      } else if (item.banner_url) {
        mediaElement = `
          <div class="w-full max-h-80 rounded-2xl overflow-hidden border border-white/10 mb-5">
            <img src="${item.banner_url}" alt="${item.title}" class="w-full h-full object-cover">
          </div>
        `;
      }

      let attachmentsHtml = '';
      if (item.attachments && item.attachments.length > 0) {
        attachmentsHtml = `
          <div class="mt-6 pt-5 border-t border-white/10 space-y-3">
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="download-cloud" class="w-4 h-4 text-orange-400"></i>
              <span>ไฟล์เอกสารและสื่อแนบดาวน์โหลด (${item.attachments.length})</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${item.attachments.map(att => `
                <a href="${att.url}" target="_blank" download class="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 transition group">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                      <i data-lucide="file-text" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-white block truncate group-hover:text-orange-300">${att.name}</span>
                      <span class="text-[10px] text-slate-400 font-mono">${att.size || 'Download'}</span>
                    </div>
                  </div>
                  <i data-lucide="download" class="w-4 h-4 text-slate-400 group-hover:text-orange-400 flex-shrink-0 ml-2"></i>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }

      modal.innerHTML = `
        <div class="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform scale-95 transition-transform duration-300" onclick="event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <div class="flex items-center gap-2">
              ${this.getCategoryBadge(item.category)}
              <span class="text-xs text-slate-400 font-mono">${this.formatDate(item.created_at)}</span>
            </div>
            <button type="button" onclick="window.BroadcastServiceInstance.closeModal()" class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 sm:p-8 overflow-y-auto space-y-4 text-slate-200">
            <h2 class="text-xl sm:text-2xl font-black text-white leading-snug">${item.title}</h2>
            
            ${mediaElement}

            <div class="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-300">
              ${item.content_html || `<p>${item.summary || ''}</p>`}
            </div>

            ${attachmentsHtml}
          </div>

          <!-- Modal Footer -->
          <div class="p-4 px-6 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span class="flex items-center gap-1.5">
              <i data-lucide="user" class="w-3.5 h-3.5 text-orange-400"></i> โพสต์โดย: ${item.author_name || 'ผู้ดูแลระบบ'}
            </span>
            <button type="button" onclick="window.BroadcastServiceInstance.closeModal()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer">
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      `;

      if (typeof lucide !== 'undefined') lucide.createIcons();

      modal.onclick = () => this.closeModal();
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100', 'pointer-events-auto');
      const inner = modal.querySelector('div');
      if (inner) {
        inner.classList.remove('scale-95');
        inner.classList.add('scale-100');
      }
    }

    closeModal() {
      const modal = document.getElementById('broadcastDetailModal');
      if (!modal) return;
      modal.classList.remove('opacity-100', 'pointer-events-auto');
      modal.classList.add('opacity-0', 'pointer-events-none');
      const inner = modal.querySelector('div');
      if (inner) {
        inner.classList.remove('scale-100');
        inner.classList.add('scale-95');
      }
    }

    // --- Admin Management Functions ---
    async saveBroadcast(broadcastData) {
      const client = this.getSupabaseClient();
      if (!broadcastData.id) {
        broadcastData.id = 'bcast-' + Date.now();
        broadcastData.created_at = new Date().toISOString();
      }
      broadcastData.updated_at = new Date().toISOString();

      if (client) {
        try {
          const { error } = await client.from('broadcasts').upsert([broadcastData]);
          if (!error) {
            await this.fetchFromSupabase();
            return { success: true };
          }
        } catch (e) {
          console.warn('[BroadcastService] Save to supabase error:', e);
        }
      }

      // Fallback local update
      const idx = this.broadcasts.findIndex(b => b.id === broadcastData.id);
      if (idx >= 0) {
        this.broadcasts[idx] = broadcastData;
      } else {
        this.broadcasts.unshift(broadcastData);
      }
      this.saveCachedBroadcasts();
      this.renderUI();
      return { success: true, localOnly: true };
    }

    async deleteBroadcast(id) {
      const client = this.getSupabaseClient();
      if (client) {
        try {
          await client.from('broadcasts').delete().eq('id', id);
        } catch (e) {
          console.warn('[BroadcastService] Delete error:', e);
        }
      }
      this.broadcasts = this.broadcasts.filter(b => b.id !== id);
      this.saveCachedBroadcasts();
      this.renderUI();
      return { success: true };
    }
  }

  window.BroadcastService = BroadcastService;
  document.addEventListener('DOMContentLoaded', () => {
    window.BroadcastServiceInstance = new BroadcastService();
  });

})(window);
