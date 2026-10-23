import React, { useState } from 'react';
import ThreeScene from './ThreeScene';

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#07070F] text-slate-100 selection:bg-[#E65A19] selection:text-white overflow-x-hidden font-sans">
      {/* Background Noise & Lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] z-0" />
      <div className="fixed top-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#E65A19]/15 to-[#B32B19]/5 blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-[20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[#0C1030]/80 blur-[150px] pointer-events-none z-0" />

      {/* 1. STICKY TOP NAVIGATION BAR (64px) */}
      <header className="sticky top-0 z-40 w-full h-16 bg-[#07070F]/85 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left: KKU Emblem & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B32B19] to-[#E65A19] p-0.5 shadow-md shadow-[#E65A19]/30">
              <div className="w-full h-full bg-[#0C1030] rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
                <img src="/logo.png" alt="KKU" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-black tracking-wider text-white font-display">KKU</span>
                <span className="text-[11px] font-bold text-slate-400 font-mono">/ COMPUTER EDUCATION</span>
              </div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500 hidden sm:inline">
                Faculty of Education
              </span>
            </div>
          </div>

          {/* Center: Global Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <a href="#hero" className="relative px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E65A19] shadow-[0_0_8px_#E65A19]" />
              <span>INDEX</span>
            </a>
            <a href="#academics" className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-white transition">
              ACADEMICS
            </a>
            <a href="Calendar.html" className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-white transition">
              ACTIVITIES
            </a>
            <a href="storage.html" className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-white transition">
              RESOURCES
            </a>
          </nav>

          {/* Right: Search + Notifications + Profile + Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="hidden md:flex items-center relative w-44 xl:w-56">
              <input
                type="text"
                placeholder="แจ้งเตือนการเรียน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 rounded-full bg-[#12162A]/90 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#E65A19] transition"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-8 h-8 rounded-full bg-[#12162A] border border-white/10 hover:border-[#E65A19]/50 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <span className="text-xs">🔔</span>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#E65A19] border-2 border-[#07070F]" />
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-[#0C1030]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-50 animate-in fade-in">
                  <div className="text-[11px] font-bold text-white mb-1">📣 แจ้งเตือนการเรียน</div>
                  <div className="text-[10px] text-slate-300">มีการอัปเดตแบบฝึกหัดใหม่ (New Assignment)</div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[#12162A] border border-white/10">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                <img src="/logo.png" alt="Profile" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#07070F]" />
              </div>
              <span className="text-xs font-mono font-medium text-slate-200 hidden sm:inline">P. Jittara</span>
            </div>

            {/* Logout Button */}
            <button className="px-3 py-1.5 rounded-full bg-[#0C1030] border border-white/15 text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:border-[#E65A19] transition flex items-center gap-1">
              <span>LOGOUT</span>
              <span>↩</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO DASHBOARD SECTION */}
      <section id="hero" className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Left Track Indicator */}
        <div className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-30 pointer-events-none">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#E65A19]" />
          <div className="font-mono text-[11px] text-[#E65A19] tracking-widest -rotate-90 origin-center font-bold">
            01 / INDEX
          </div>
          <div className="w-px h-16 bg-gradient-to-b from-[#E65A19] to-transparent" />
        </div>

        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Bold Headline & Badges */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
            <div className="space-y-1">
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight leading-[0.95] text-white">
                THE HUB OF<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  COMED 23
                </span>
                <span className="block text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#E65A19] mt-2">
                  CONNECTING EDUCATION &amp; TECHNOLOGY
                </span>
              </h1>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#B32B19]/30 to-[#E65A19]/30 border border-[#E65A19]/50 text-[10px] font-mono font-bold tracking-wider text-[#FF7A29] uppercase">
                CLASS OF 2023 - 2027
              </span>
              <span className="px-3 py-1 rounded-full bg-[#161B33] border border-white/10 text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                STUDENTS / BATCH 23
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-sans font-medium text-slate-300">
                สาขาวิชาคอมพิวเตอร์ศึกษา
              </span>
            </div>

            <p className="text-xs sm:text-sm font-mono text-slate-400 leading-relaxed max-w-xl">
              Welcome to the central academic index for Batch 23, Faculty of Education, Khon Kaen University. Explore course materials, activities, and student portals in a zero-gravity digital environment.
            </p>

            {/* CTA & Secondary links */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#quick-hub"
                className="group relative px-7 py-3.5 rounded-full bg-gradient-to-r from-[#B32B19] to-[#E65A19] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(230,90,25,0.5)] flex items-center gap-2.5 cursor-pointer"
              >
                <span>[ EXPLORE PORTAL ]</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <a href="storage.html" className="hover:text-white underline underline-offset-4 decoration-slate-600 transition">
                  Secondary portals
                </a>
                <span className="text-slate-600">•</span>
                <a href="Plans.html" className="hover:text-white underline underline-offset-4 decoration-slate-600 transition">
                  Navigation index
                </a>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
              <span className="animate-bounce">↓</span>
              <span>SCROLL TO DISCOVER</span>
            </div>
          </div>

          {/* Right Column: 3D Hardware Accelerated Canvas */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[340px] sm:min-h-[460px] lg:min-h-[560px]">
            <ThreeScene />
          </div>
        </div>
      </section>

      {/* 3. MOBILE FLOATING BOTTOM DOCK */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 bg-[#07070F]/90 backdrop-blur-lg border border-white/10 rounded-2xl p-2 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <a href="#hero" className="flex-1 py-1 flex flex-col items-center gap-1 text-[#FF7A29]">
          <span className="text-xs">🏠</span>
          <span className="text-[10px] font-mono font-bold">Home</span>
        </a>
        <a href="#academics" className="flex-1 py-1 flex flex-col items-center gap-1 text-slate-400 hover:text-white">
          <span className="text-xs">📚</span>
          <span className="text-[10px] font-mono">Course</span>
        </a>
        <a href="Calendar.html" className="flex-1 py-1 flex flex-col items-center gap-1 text-slate-400 hover:text-white">
          <span className="text-xs">📅</span>
          <span className="text-[10px] font-mono">Activity</span>
        </a>
        <a href="#payments" className="flex-1 py-1 flex flex-col items-center gap-1 text-slate-400 hover:text-white relative">
          <span className="text-xs">🔔</span>
          <span className="absolute top-0 right-1/4 w-1.5 h-1.5 rounded-full bg-[#E65A19]" />
          <span className="text-[10px] font-mono">Notif.</span>
        </a>
        <a href="settings.html" className="flex-1 py-1 flex flex-col items-center gap-1 text-slate-400 hover:text-white">
          <span className="text-xs">👤</span>
          <span className="text-[10px] font-mono">Profile</span>
        </a>
      </nav>
    </div>
  );
}
