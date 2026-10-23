import React, { useState, useEffect } from 'react';
import ThreeScene from './ThreeScene';

export interface IntroScreenProps {
  onLaunch: () => void;
}

export default function IntroScreen({ onLaunch }: IntroScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 87) {
          const next = prev + Math.floor(Math.random() * 5) + 3;
          return next > 87 ? 87 : next;
        } else if (prev === 87) {
          // Pause at 87% exactly as in reference image
          return 88;
        } else if (prev < 100) {
          const next = prev + Math.floor(Math.random() * 6) + 4;
          return next >= 100 ? 100 : next;
        } else {
          clearInterval(timer);
          setIsReady(true);
          return 100;
        }
      });
    }, 45);

    return () => clearInterval(timer);
  }, []);

  const handleLaunch = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onLaunch();
    }, 750);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#07070F] text-white overflow-hidden select-none transition-all duration-700 ${
        isDismissing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Noise & Ambient Glows */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-[#B32B19]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 right-5 w-[750px] h-[750px] bg-[#E65A19]/20 rounded-full blur-[170px] pointer-events-none" />

      {/* UI Bounding Markers */}
      <div className="absolute top-5 left-5 w-4 h-4 border-t-2 border-l-2 border-white/30 pointer-events-none" />
      <div className="absolute top-5 right-5 w-4 h-4 border-t-2 border-r-2 border-white/30 pointer-events-none" />
      <div className="absolute bottom-5 left-5 w-4 h-4 border-b-2 border-l-2 border-white/30 pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-4 h-4 border-b-2 border-r-2 border-white/30 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5 sm:py-6 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#B32B19] to-[#E65A19] p-0.5 shadow-lg shadow-[#E65A19]/30">
            <div className="w-full h-full bg-[#0C1030] rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
              <img src="/logo.png" alt="KKU" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-white uppercase">
              KHON KAEN UNIVERSITY
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono tracking-wider text-slate-400">
              FACULTY OF EDUCATION • COMED 23
            </span>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-[#E65A19]/20 border border-white/20 hover:border-[#E65A19] text-[11px] sm:text-xs font-mono font-semibold text-slate-300 hover:text-white transition group shadow-sm cursor-pointer"
        >
          <span>SKIP INTRO</span>
          <span className="text-xs sm:text-sm font-bold text-[#E65A19] group-hover:rotate-45 transition-transform">
            ↶
          </span>
        </button>
      </div>

      {/* Center Layout: Typography + 3D Scene */}
      <div className="relative z-10 max-w-7xl mx-auto h-[calc(100vh-170px)] px-5 sm:px-12 flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-center justify-center">
        {/* Left: Kinetic Typography & 87% Radar */}
        <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6 text-left w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E65A19]/20 border border-[#E65A19]/40 text-[10px] font-mono font-bold text-[#FF7A29] uppercase">
              INTERACTIVE INTRO
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-400 uppercase">
              TECH EDUCATION
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-[#E65A19]">
              COMED 23
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight leading-tight">
              CONNECTING EDUCATION<br className="hidden sm:inline" /> &amp; TECHNOLOGY
            </div>
          </div>

          {/* Radar Arc 87% */}
          <div className="flex items-center gap-4 pt-2">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-sky-400 border-r-[#E65A19] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-sky-400">
                {progress}%
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                {isReady ? (
                  <span className="text-emerald-400">SYSTEM READY</span>
                ) : (
                  <span>LOADING ENVIRONMENT...</span>
                )}
              </div>
              <div className="w-40 sm:w-56 h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-[#E65A19] to-[#FF7A29] rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-[9px] font-mono text-slate-500">
            <div>LOC // KKU_ED</div>
            <div>CORE // 3D_WEBGL</div>
            <div>FPS // 60-120</div>
          </div>
        </div>

        {/* Right: 3D Scene Viewport */}
        <div className="order-1 lg:order-2 lg:col-span-6 relative flex items-center justify-center w-full min-h-[280px] sm:min-h-[380px] lg:min-h-[500px]">
          <ThreeScene />
        </div>
      </div>

      {/* Bottom CTA: [ CLICK TO LAUNCH ] */}
      <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
        <button
          onClick={handleLaunch}
          disabled={!isReady}
          className={`px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-widest text-white uppercase flex items-center gap-2.5 transition-all duration-300 ${
            isReady
              ? 'bg-[#0C1030]/80 border border-[#E65A19] shadow-[0_0_35px_rgba(230,90,25,0.6)] hover:scale-105 cursor-pointer'
              : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
          }`}
        >
          <span className="text-[#E65A19] font-black">[</span>
          <span>{isReady ? 'CLICK TO LAUNCH' : 'PREPARING PORTAL...'}</span>
          <span className="text-[#E65A19] font-black">]</span>
          <span className="text-[#FF7A29] text-xs">((•))</span>
        </button>

        <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase flex items-center gap-1">
          <span>SCROLL TO EXPLORE</span>
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </div>
  );
}
