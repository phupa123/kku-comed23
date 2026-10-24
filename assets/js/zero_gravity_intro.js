/**
 * KKU COMED 23 - Cinematic "Zero-Gravity" WebGL Pre-loader Intro Screen
 * Faithfully recreating image_12.png & image_13.png (Center Mobile)
 * Features:
 * - 3D Cyber Laptop with Navy Blue Glass & Chrome Circuits
 * - Intricate Golden Phra That Phanom Stupa + "COM" Emblem
 * - Glowing Fire-Orange/Red Orbit Ring & Sparks
 * - Mouse Velocity Kinetic Typography & 87% Radar Progress
 * - [ CLICK TO LAUNCH ] Transition & Instant SKIP INTRO
 */
function runZeroGravityIntro() {
  if (document.getElementById('zeroGravityIntroOverlay')) return;

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'zeroGravityIntroStyles';
  styleEl.textContent = `
    #zeroGravityIntroOverlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background-color: #07070F;
      color: #FFFFFF;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      user-select: none;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
      transform: translateZ(0);
    }
    #zeroGravityIntroOverlay.intro-launching {
      opacity: 0;
      transform: scale(1.08);
      pointer-events: none;
    }

    .intro-noise {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.038'/%3E%3C/svg%3E");
    }

    .liquid-metal-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(3rem, 7.5vw, 6.8rem);
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 0.95;
      background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 20%, #94A3B8 40%, #E65A19 70%, #B32B19 90%, #FFFFFF 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 35px rgba(230, 90, 25, 0.45));
      animation: metallicShimmer 5s ease infinite alternate;
      display: inline-block;
      transition: transform 0.2s ease-out;
    }

    @keyframes metallicShimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }

    .radar-arc-circle {
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-top-color: #38BDF8;
      border-right-color: #E65A19;
      border-radius: 50%;
      animation: radarSpin 1.2s linear infinite;
    }
    @keyframes radarSpin {
      to { transform: rotate(360deg); }
    }

    .industrial-launch-btn {
      position: relative;
      background: rgba(12, 16, 48, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .industrial-launch-btn:hover {
      border-color: #E65A19;
      background: rgba(230, 90, 25, 0.2);
      box-shadow: 0 0 35px rgba(230, 90, 25, 0.5);
      transform: scale(1.05);
    }
    .industrial-launch-btn.btn-disabled {
      opacity: 0.45;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleEl);

  // Overlay DOM structure
  const overlay = document.createElement('div');
  overlay.id = 'zeroGravityIntroOverlay';
  overlay.innerHTML = `
    <div class="absolute inset-0 intro-noise pointer-events-none"></div>
    <div class="absolute inset-0 opacity-[0.035] pointer-events-none" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 55px 55px;"></div>

    <!-- Ambient Glows -->
    <div class="absolute -top-32 -left-32 w-[650px] h-[650px] bg-[#B32B19]/15 rounded-full blur-[150px] pointer-events-none"></div>
    <div class="absolute top-1/4 right-5 w-[750px] h-[750px] bg-[#E65A19]/20 rounded-full blur-[170px] pointer-events-none"></div>

    <!-- UI Bounding Markers -->
    <div class="absolute top-5 left-5 w-4 h-4 border-t-2 border-l-2 border-white/30 pointer-events-none"></div>
    <div class="absolute top-5 right-5 w-4 h-4 border-t-2 border-r-2 border-white/30 pointer-events-none"></div>
    <div class="absolute bottom-5 left-5 w-4 h-4 border-b-2 border-l-2 border-white/30 pointer-events-none"></div>
    <div class="absolute bottom-5 right-5 w-4 h-4 border-b-2 border-r-2 border-white/30 pointer-events-none"></div>

    <!-- 1. TOP BAR -->
    <div class="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5 sm:py-6 w-full">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#B32B19] to-[#E65A19] p-0.5 shadow-lg shadow-[#E65A19]/30">
          <div class="w-full h-full bg-[#0C1030] rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
            <img src="logo.png" alt="KKU" class="w-full h-full object-contain">
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-white uppercase">KHON KAEN UNIVERSITY</div>
          <div class="text-[8px] sm:text-[9px] font-mono tracking-wider text-slate-400">FACULTY OF EDUCATION • COMED 23</div>
        </div>
      </div>

      <button id="skipIntroBtn" class="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-[#E65A19]/20 border border-white/20 hover:border-[#E65A19] text-[11px] sm:text-xs font-mono font-semibold text-slate-300 hover:text-white transition group shadow-sm cursor-pointer">
        <span>SKIP INTRO</span>
        <span class="text-xs sm:text-sm font-bold text-[#E65A19] group-hover:rotate-45 transition-transform">↶</span>
      </button>
    </div>

    <!-- 2. MAIN GRID (Desktop: 2 columns | Mobile: Stacked) -->
    <div class="relative z-10 max-w-7xl mx-auto h-[calc(100vh-170px)] px-5 sm:px-12 flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-center justify-center overflow-y-auto lg:overflow-visible">
      
      <!-- LEFT-CENTER (Narrative Typography & Radar) -->
      <div class="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-6 text-left w-full">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-[#E65A19]/20 border border-[#E65A19]/40 text-[10px] font-mono font-bold text-[#FF7A29] uppercase">
            INTERACTIVE INTRO
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-400 uppercase">
            TECH EDUCATION
          </span>
        </div>

        <div class="space-y-1">
          <div id="introKineticTitle" class="liquid-metal-title">
            COMED 23
          </div>
          <div class="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight leading-tight">
            CONNECTING EDUCATION<br class="hidden sm:inline"> &amp; TECHNOLOGY
          </div>
        </div>

        <!-- 87% LOADING Circular Radar Indicator -->
        <div class="flex items-center gap-4 pt-2">
          <div class="relative w-12 h-12 flex items-center justify-center">
            <div class="w-12 h-12 radar-arc-circle"></div>
            <div class="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-sky-400">
              <span id="introPercentDigits">0%</span>
            </div>
          </div>
          <div class="flex flex-col">
            <div class="text-xs font-mono font-bold text-white tracking-widest uppercase">
              <span id="introStatusText">INITIALIZING SYSTEM...</span>
            </div>
            <div class="w-40 sm:w-56 h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <div id="introProgressFill" class="h-full bg-gradient-to-r from-sky-400 via-[#E65A19] to-[#FF7A29] rounded-full transition-all duration-100" style="width: 0%"></div>
            </div>
          </div>
        </div>

        <div class="hidden sm:grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-[9px] font-mono text-slate-500">
          <div>LOC // KKU_ED</div>
          <div>CORE // 3D_WEBGL</div>
          <div>FPS // 60-120</div>
        </div>
      </div>

      <!-- RIGHT-CENTER (3D WebGL Brand Emblem: Cyber Laptop + Phra That Phanom + COM) -->
      <div class="order-1 lg:order-2 lg:col-span-6 relative flex items-center justify-center w-full min-h-[260px] sm:min-h-[360px] lg:min-h-[500px]">
        <div id="introWebGLBrandContainer" class="relative w-full h-[260px] sm:h-[360px] lg:h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing">
          <!-- Canvas dynamically generated by Three.js below -->
        </div>

        <!-- Telemetry Labels on 3D Object -->
        <div class="hidden sm:block absolute top-[20%] right-[10%] px-2.5 py-1 rounded bg-[#0C1030]/80 border border-sky-500/30 text-[9px] font-mono text-sky-300 pointer-events-none">
          01 // COGNITIVE LAB
        </div>
        <div class="hidden sm:block absolute bottom-[22%] left-[10%] px-2.5 py-1 rounded bg-[#0C1030]/80 border border-[#E65A19]/30 text-[9px] font-mono text-[#FF7A29] pointer-events-none">
          02 // NOTEBOOK LAB
        </div>
      </div>

    </div>

    <!-- 3. BOTTOM CTA: [ CLICK TO LAUNCH ] -->
    <div class="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
      <button id="launchIntroBtn" class="industrial-launch-btn btn-disabled px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-widest text-white uppercase flex items-center gap-2.5 cursor-pointer">
        <span class="text-[#E65A19] font-black">[</span>
        <span id="launchIntroBtnText">PREPARING PORTAL...</span>
        <span class="text-[#E65A19] font-black">]</span>
        <span class="text-[#FF7A29] text-xs">((•))</span>
      </button>

      <div class="text-[9px] font-mono text-slate-500 tracking-widest uppercase flex items-center gap-1">
        <span>SCROLL TO EXPLORE</span>
        <span class="animate-bounce">↓</span>
      </div>
    </div>
  `;

  document.body.prepend(overlay);

  // Initialize Interactive 3D WebGL Brand Emblem (Laptop + Golden Stupa + Orbit)
  let scene, camera, renderer, laptopGroup, orbitRing, animFrameId;
  let isIntroActive = true;

  (function initIntroWebGL() {
    const container = document.getElementById('introWebGLBrandContainer');
    if (!container || typeof THREE === 'undefined') return;

    const w = container.clientWidth || 450;
    const h = container.clientHeight || 450;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
    camera.position.set(0, 0.2, 4.4);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0x0a1026, 2.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.2);
    dirLight1.position.set(5, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff6a28, 3.5);
    dirLight2.position.set(-5, -2, 3);
    scene.add(dirLight2);

    const innerCoreLight = new THREE.PointLight(0xff5500, 8, 14);
    innerCoreLight.position.set(0, 0, 0);
    scene.add(innerCoreLight);

    const cyanRimLight = new THREE.PointLight(0x38bdf8, 5, 12);
    cyanRimLight.position.set(3, 3, -2);
    scene.add(cyanRimLight);

    // Master Celestial Group
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);

    // 1. Central Plasma Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.78, 36, 36);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xb32b19,
      emissive: 0xff3b14,
      emissiveIntensity: 1.25,
      metalness: 0.92,
      roughness: 0.18
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    celestialGroup.add(coreMesh);

    // 2. Quantum Geometric Exoskeleton (Wire Lattice Cage)
    const icoGeo = new THREE.IcosahedronGeometry(1.08, 1);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2444,
      emissive: 0x0c1533,
      metalness: 0.95,
      roughness: 0.12,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    celestialGroup.add(icoMesh);

    // 3. Floating Quantum Prism Shards
    const shardsGroup = new THREE.Group();
    const shardGeo = new THREE.OctahedronGeometry(0.13, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xf5c542,
      emissive: 0xe65a19,
      emissiveIntensity: 0.6,
      metalness: 0.98,
      roughness: 0.15
    });
    for (let i = 0; i < 18; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 1.35 + (i % 3) * 0.15;
      shard.position.set(
        Math.cos(angle) * radius,
        (Math.sin(angle * 2) * 0.35) + ((i % 4) - 1.5) * 0.12,
        Math.sin(angle) * radius
      );
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shardsGroup.add(shard);
    }
    celestialGroup.add(shardsGroup);

    // 4. Triple Gyroscopic Chrono-Rings
    function createChronoRing(radius, tubeRadius, colorHex, tiltX, tiltY) {
      const ringGeo = new THREE.TorusGeometry(radius, tubeRadius, 16, 72);
      const ringMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        metalness: 0.95,
        roughness: 0.15
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = tiltX;
      ringMesh.rotation.y = tiltY;
      return ringMesh;
    }

    const ring1 = createChronoRing(1.72, 0.024, 0xff7a29, Math.PI / 3, 0.3);
    const ring2 = createChronoRing(1.98, 0.018, 0x38bdf8, -Math.PI / 3.5, 0.45);
    const ring3 = createChronoRing(2.22, 0.015, 0xf5c542, Math.PI / 2.2, -0.25);
    celestialGroup.add(ring1);
    celestialGroup.add(ring2);
    celestialGroup.add(ring3);

    // 5. Orbital Quantum Ion Particle Cloud
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.25 + Math.random() * 1.85;
      particlePos[i] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff8c42,
      size: 0.038,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    celestialGroup.add(particleCloud);

    // Interactive Dragging on mouse/touch
    let mouseX = 0, mouseY = 0;
    let targetRotY = 0.25, targetRotX = 0.15;
    let isDragging = false;
    let prevX = 0, prevY = 0;

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      const r = container.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / w) * 2 - 1;
      mouseY = -(((e.clientY - r.top) / h) * 2 - 1);

      if (isDragging) {
        targetRotY += (e.clientX - prevX) * 0.008;
        targetRotX += (e.clientY - prevY) * 0.008;
        prevX = e.clientX;
        prevY = e.clientY;
      }
    });

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    });
    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        targetRotY += (e.touches[0].clientX - prevX) * 0.008;
        targetRotX += (e.touches[0].clientY - prevY) * 0.008;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    });

    // Render loop
    const clock = new THREE.Clock();
    function animate() {
      if (!isIntroActive) return;
      animFrameId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();

      // Zero gravity organic bobbing & pulsing
      celestialGroup.position.y = Math.sin(t * 1.3) * 0.08;
      celestialGroup.position.x = Math.cos(t * 0.9) * 0.05;

      // Celestial Core rotation & breathing
      coreMesh.rotation.y += 0.007;
      icoMesh.rotation.y -= 0.005;
      icoMesh.rotation.x += 0.003;

      // Astrolabe Chrono-Rings Gyroscopic Multi-axis Rotations
      ring1.rotation.z += 0.008;
      ring2.rotation.z -= 0.006;
      ring3.rotation.x += 0.005;

      shardsGroup.rotation.y += 0.012;
      particleCloud.rotation.y = t * 0.04;

      // Mouse drag damping
      celestialGroup.rotation.y += (targetRotY + mouseX * 0.2 - celestialGroup.rotation.y) * 0.06;
      celestialGroup.rotation.x += (targetRotX - mouseY * 0.2 - celestialGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      if (!container || !camera || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  })();

  // Kinetic Typography Distortion on Mouse Move (RAF Throttled 60-120fps)
  const kineticTitle = document.getElementById('introKineticTitle');
  if (kineticTitle) {
    let lastX = 0, lastTime = performance.now();
    let isTicking = false;
    let pendingClientX = 0;

    window.addEventListener('mousemove', (e) => {
      pendingClientX = e.clientX;
      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(() => {
          const now = performance.now();
          const dt = Math.max(1, now - lastTime);
          const vx = Math.abs(pendingClientX - lastX) / dt;
          lastX = pendingClientX;
          lastTime = now;

          const skew = Math.min(6, vx * 3.5);
          kineticTitle.style.transform = `skewX(${(pendingClientX > window.innerWidth / 2 ? -1 : 1) * skew}deg)`;
          clearTimeout(kineticTitle._timer);
          kineticTitle._timer = setTimeout(() => {
            kineticTitle.style.transform = 'skewX(0deg)';
          }, 120);
          isTicking = false;
        });
      }
    }, { passive: true });
  }

  // Progress Loading Logic: 0% -> 87% (image_12.png) -> 100% READY
  const pDigits = document.getElementById('introPercentDigits');
  const pFill = document.getElementById('introProgressFill');
  const pStatus = document.getElementById('introStatusText');
  const launchBtn = document.getElementById('launchIntroBtn');
  const launchText = document.getElementById('launchIntroBtnText');
  const skipBtn = document.getElementById('skipIntroBtn');

  let curProgress = 0;
  const pTimer = setInterval(() => {
    if (curProgress < 87) {
      curProgress += Math.floor(Math.random() * 5) + 3;
      if (curProgress > 87) curProgress = 87;
    } else if (curProgress === 87) {
      setTimeout(() => { curProgress = 88; }, 320);
    } else {
      curProgress += Math.floor(Math.random() * 6) + 4;
      if (curProgress >= 100) {
        curProgress = 100;
        clearInterval(pTimer);
        onLoadingReady();
      }
    }

    if (pDigits) pDigits.textContent = curProgress + '%';
    if (pFill) pFill.style.width = curProgress + '%';
  }, 38);

  function onLoadingReady() {
    if (pStatus) {
      pStatus.textContent = 'SYSTEM READY • LAUNCHING...';
      pStatus.classList.add('text-emerald-400');
    }
    if (launchBtn) {
      launchBtn.classList.remove('btn-disabled');
      launchBtn.classList.add('shadow-[0_0_35px_rgba(230,90,25,0.6)]');
    }
    if (launchText) {
      launchText.textContent = 'LAUNCHING...';
      launchText.classList.add('text-white', 'font-black');
    }

    // Auto-launch into website after brief cinematic pause
    setTimeout(() => {
      dismissIntro();
    }, 450);
  }

  function dismissIntro() {
    if (!isIntroActive) return;
    isIntroActive = false;

    if (camera && typeof gsap !== 'undefined') {
      gsap.to(camera.position, { z: 0.5, duration: 0.8, ease: 'power2.in' });
    }

    overlay.classList.add('intro-launching');
    setTimeout(() => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      }
      overlay.remove();
      const st = document.getElementById('zeroGravityIntroStyles');
      if (st) st.remove();
    }, 800);
  }

  if (skipBtn) skipBtn.addEventListener('click', dismissIntro);
  if (launchBtn) launchBtn.addEventListener('click', () => {
    if (launchBtn.classList.contains('btn-disabled')) return;
    dismissIntro();
  });
}

// Execution Trigger
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runZeroGravityIntro);
} else {
  runZeroGravityIntro();
}
