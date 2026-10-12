/**
 * =========================================================================
 * BACKGROUND UPLOAD FLOATING WIDGET & GLOBAL PERSISTENCE ENGINE
 * assets/js/background_uploader.js
 * 
 * คุณสมบัติ:
 * 1. แสดง Floating Mini Widget มุมจอด้านล่างแบบ Glassmorphism สวยหรู
 * 2. ป้องกันหน้าต่างหลุด (beforeunload alert) เมื่อกำลังอัปโหลดไฟล์วิดีโอ/ไฟล์ใหญ่
 * 3. บันทึกและดึงสถานะงานอัปโหลด (Upload Job Tracker) ผ่าน BroadcastChannel & Storage
 * 4. แจ้งเตือน Notification + Toast เมื่ออัปโหลดเสร็จสมบูรณ์
 * =========================================================================
 */

(function(window) {
  'use strict';

  class BackgroundUploadManager {
    constructor() {
      this.activeJobs = new Map(); // jobId -> job details
      this.channel = null;
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('comed_background_upload_channel');
          this.channel.onmessage = (e) => this.handleChannelMessage(e.data);
        }
      } catch (err) {}

      this.initBeforeUnloadProtection();
      this.initWidgetDOM();
    }

    initBeforeUnloadProtection() {
      window.addEventListener('beforeunload', (e) => {
        if (this.hasActiveUploads()) {
          e.preventDefault();
          e.returnValue = 'กำลังอัปโหลดไฟล์อยู่ หากปิดหรือสลับหน้านี้การส่งข้อมูลจะหยุดชะงัก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?';
          return e.returnValue;
        }
      });
    }

    hasActiveUploads() {
      for (const job of this.activeJobs.values()) {
        if (job.status === 'uploading' || job.status === 'compressing') {
          return true;
        }
      }
      return false;
    }

    createJob(fileName, fileSize = 0) {
      const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const job = {
        id: jobId,
        name: fileName,
        size: fileSize,
        percent: 0,
        statusText: 'กำลังเตรียมข้อมูล...',
        status: 'uploading', // 'uploading' | 'completed' | 'failed'
        startedAt: Date.now()
      };
      this.activeJobs.set(jobId, job);
      this.renderWidget();
      this.broadcast({ type: 'JOB_CREATED', job });
      return jobId;
    }

    updateJob(jobId, percent, statusText, status = 'uploading') {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      job.percent = percent;
      job.statusText = statusText;
      job.status = status;

      this.renderWidget();
      this.broadcast({ type: 'JOB_UPDATED', job });

      if (status === 'completed' || status === 'failed') {
        setTimeout(() => {
          this.activeJobs.delete(jobId);
          this.renderWidget();
          this.broadcast({ type: 'JOB_REMOVED', jobId });
        }, 5000);
      }
    }

    broadcast(data) {
      if (this.channel) {
        try { this.channel.postMessage(data); } catch(e) {}
      }
    }

    handleChannelMessage(data) {
      if (!data) return;
      if (data.type === 'JOB_CREATED' && data.job) {
        this.activeJobs.set(data.job.id, data.job);
        this.renderWidget();
      } else if (data.type === 'JOB_UPDATED' && data.job) {
        this.activeJobs.set(data.job.id, data.job);
        this.renderWidget();
      } else if (data.type === 'JOB_REMOVED' && data.jobId) {
        this.activeJobs.delete(data.jobId);
        this.renderWidget();
      }
    }

    initWidgetDOM() {
      if (document.getElementById('bgUploadFloatingWidget')) return;

      const widget = document.createElement('div');
      widget.id = 'bgUploadFloatingWidget';
      widget.className = 'fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[90vw] sm:w-80 pointer-events-none transition-all duration-300 opacity-0 translate-y-4';
      widget.innerHTML = `
        <div class="pointer-events-auto rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 shadow-2xl p-4 text-white space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span class="text-xs font-black tracking-wide text-orange-400 uppercase">อัปโหลดพื้นหลัง (Background Sync)</span>
            </div>
            <span id="bgUploadCount" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">0 งาน</span>
          </div>
          <div id="bgUploadJobList" class="space-y-3 max-h-60 overflow-y-auto pr-1"></div>
        </div>
      `;
      document.body.appendChild(widget);
    }

    renderWidget() {
      const widget = document.getElementById('bgUploadFloatingWidget');
      if (!widget) return;

      const countBadge = document.getElementById('bgUploadCount');
      const listContainer = document.getElementById('bgUploadJobList');
      if (!countBadge || !listContainer) return;

      const jobs = Array.from(this.activeJobs.values());
      if (jobs.length === 0) {
        widget.classList.add('opacity-0', 'translate-y-4');
        widget.classList.remove('opacity-100', 'translate-y-0');
        return;
      }

      widget.classList.remove('opacity-0', 'translate-y-4');
      widget.classList.add('opacity-100', 'translate-y-0');
      countBadge.textContent = `${jobs.length} รายการ`;

      listContainer.innerHTML = jobs.map(job => {
        const isSuccess = job.status === 'completed';
        const isFailed = job.status === 'failed';
        const barColor = isSuccess ? 'bg-emerald-500' : (isFailed ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-500 to-amber-400');
        const textColor = isSuccess ? 'text-emerald-400' : (isFailed ? 'text-rose-400' : 'text-orange-400');

        return `
          <div class="space-y-1.5 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold truncate text-slate-200" title="${job.name}">${job.name}</span>
              <span class="font-mono font-bold ${textColor}">${job.percent}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="${barColor} h-1.5 rounded-full transition-all duration-300" style="width: ${job.percent}%"></div>
            </div>
            <p class="text-[10px] text-slate-400 truncate">${job.statusText}</p>
          </div>
        `;
      }).join('');
    }
  }

  window.BackgroundUploadManager = new BackgroundUploadManager();

})(window);
