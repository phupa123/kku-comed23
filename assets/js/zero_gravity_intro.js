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
    camera.position.set(0, 0.4, 4.4);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0C1030, 2.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 3.0);
    dirLight.position.set(5, 6, 4);
    scene.add(dirLight);

    const orangeLight = new THREE.PointLight(0xE65A19, 6, 12);
    orangeLight.position.set(-2.5, 1, 2.5);
    scene.add(orangeLight);

    const blueLight = new THREE.PointLight(0x38BDF8, 5, 12);
    blueLight.position.set(2.5, -1, 2.5);
    scene.add(blueLight);

    laptopGroup = new THREE.Group();
    scene.add(laptopGroup);

    // 1. Laptop Base (Translucent Glowing Navy Glass & Chrome Border)
    const baseGeo = new THREE.BoxGeometry(2.4, 0.08, 1.6);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x0C1030,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
      reflectivity: 0.9
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.55;
    baseMesh.position.z = 0.3;
    laptopGroup.add(baseMesh);

    // Keyboard & Trackpad highlights
    const trackpadGeo = new THREE.PlaneGeometry(0.7, 0.45);
    const trackpadMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.25 });
    const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
    trackpad.rotation.x = -Math.PI / 2;
    trackpad.position.set(0, -0.505, 0.7);
    laptopGroup.add(trackpad);

    // 2. Laptop Screen Lid (Angled back)
    const screenLid = new THREE.Group();
    screenLid.position.set(0, -0.51, -0.5);
    screenLid.rotation.x = -0.22; // angled 102 degrees
    laptopGroup.add(screenLid);

    const lidBackGeo = new THREE.BoxGeometry(2.4, 1.55, 0.06);
    const lidBackMat = new THREE.MeshPhysicalMaterial({
      color: 0x080B1E,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0
    });
    const lidBack = new THREE.Mesh(lidBackGeo, lidBackMat);
    lidBack.position.y = 0.775;
    screenLid.add(lidBack);

    // Screen Glass Inner Display with Cyan Circuit glow
    const displayGeo = new THREE.PlaneGeometry(2.25, 1.4);
    const displayMat = new THREE.MeshBasicMaterial({
      color: 0x050C24,
      transparent: true,
      opacity: 0.95
    });
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.position.set(0, 0.775, 0.035);
    screenLid.add(displayMesh);

    // ================= 3. AUTHENTIC 3D PROCEDURAL STUPA & COM (NO FLAT 2D) =================
    const stupaGroup = new THREE.Group();
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5C542,
      metalness: 0.95,
      roughness: 0.16,
      envMapIntensity: 2.2
    });
    const darkGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xC69214,
      metalness: 0.9,
      roughness: 0.28
    });
    const chromeDetailMat = new THREE.MeshStandardMaterial({
      color: 0xEAEAEA,
      metalness: 0.98,
      roughness: 0.1
    });

    // Tiered Bases
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.74), darkGoldMaterial);
    b1.position.y = 0.04;
    stupaGroup.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.66), goldMaterial);
    b2.position.y = 0.12;
    stupaGroup.add(b2);
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.58), darkGoldMaterial);
    b3.position.y = 0.21;
    stupaGroup.add(b3);

    // Body & Lotus Waist
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.31, 0.34, 4), goldMaterial);
    waist.rotation.y = Math.PI / 4;
    waist.position.y = 0.42;
    stupaGroup.add(waist);
    const ringMolding = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.52), chromeDetailMat);
    ringMolding.position.y = 0.60;
    stupaGroup.add(ringMolding);

    // Spire
    const spireLower = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 0.45, 4), goldMaterial);
    spireLower.rotation.y = Math.PI / 4;
    spireLower.position.y = 0.84;
    stupaGroup.add(spireLower);
    const spireMolding = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.34), chromeDetailMat);
    spireMolding.position.y = 1.08;
    stupaGroup.add(spireMolding);
    const spireUpper = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 4), goldMaterial);
    spireUpper.rotation.y = Math.PI / 4;
    spireUpper.position.y = 1.42;
    stupaGroup.add(spireUpper);

    // Finial Needle
    const finialSphere = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), goldMaterial);
    finialSphere.position.y = 1.76;
    stupaGroup.add(finialSphere);
    const finialTip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.15, 8), goldMaterial);
    finialTip.position.y = 1.86;
    stupaGroup.add(finialTip);

    stupaGroup.position.set(0, -0.42, 0.08);
    stupaGroup.scale.set(0.96, 0.96, 0.96);
    laptopGroup.add(stupaGroup);

    // 3D "COM" Letters
    const comGroup = new THREE.Group();
    comGroup.position.set(0, -0.06, 0.42);
    comGroup.scale.set(0.85, 0.85, 0.85);

    const chromeWordMat = new THREE.MeshStandardMaterial({ color: 0xF3C352, metalness: 0.95, roughness: 0.14 });
    const sideTrimMat = new THREE.MeshStandardMaterial({ color: 0xE65A19, metalness: 0.92, roughness: 0.18 });

    // 'C'
    const cLetter = new THREE.Group();
    cLetter.position.x = -0.56;
    cLetter.add(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 16, 32, Math.PI * 1.55), chromeWordMat));
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.14), sideTrimMat);
    c1.position.set(0.14, 0.17, 0);
    cLetter.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.14), sideTrimMat);
    c2.position.set(0.14, -0.17, 0);
    cLetter.add(c2);
    comGroup.add(cLetter);

    // 'O'
    const oLetter = new THREE.Group();
    oLetter.position.x = 0;
    oLetter.add(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 16, 32), chromeWordMat));
    comGroup.add(oLetter);

    // 'M'
    const mLetter = new THREE.Group();
    mLetter.position.x = 0.56;
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.14), chromeWordMat);
    m1.position.x = -0.18;
    mLetter.add(m1);
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.14), chromeWordMat);
    m2.position.x = 0.18;
    mLetter.add(m2);
    const m3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.14), sideTrimMat);
    m3.rotation.z = -0.45;
    m3.position.set(-0.09, 0.08, 0);
    mLetter.add(m3);
    const m4 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.14), sideTrimMat);
    m4.rotation.z = 0.45;
    m4.position.set(0.09, 0.08, 0);
    mLetter.add(m4);
    comGroup.add(mLetter);

    laptopGroup.add(comGroup);

    // 4. Glowing Fire-Orange/Red Orbit Ring around the laptop
    function createGlowOrbit(radius, rotX, rotY) {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.72, 0, 2 * Math.PI, false, 0);
      const pts = curve.getPoints(120);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xFF7A29,
        transparent: true,
        opacity: 0.85,
        linewidth: 2
      });
      const line = new THREE.Line(geo, mat);
      line.rotation.x = rotX;
      line.rotation.y = rotY;
      return line;
    }

    orbitRing = createGlowOrbit(2.1, Math.PI / 3, -Math.PI / 6);
    laptopGroup.add(orbitRing);

    // 5. Orbiting Micro Spark Particles
    const sparkCount = 90;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i += 3) {
      sparkPos[i] = (Math.random() - 0.5) * 4.5;
      sparkPos[i + 1] = (Math.random() - 0.5) * 3.5;
      sparkPos[i + 2] = (Math.random() - 0.5) * 3;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xFF7A29,
      size: 0.04,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    laptopGroup.add(sparks);

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

    // Touch support for mobile
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

      // Zero gravity organic bobbing
      laptopGroup.position.y = Math.sin(t * 1.3) * 0.08;
      laptopGroup.position.x = Math.cos(t * 0.9) * 0.05;

      // Subtle auto rotation
      laptopGroup.rotation.y += 0.003;
      if (orbitRing) orbitRing.rotation.z += 0.006;
      sparks.rotation.y = t * 0.04;

      // Mouse drag damping
      laptopGroup.rotation.y += (targetRotY + mouseX * 0.2 - laptopGroup.rotation.y) * 0.06;
      laptopGroup.rotation.x += (targetRotX - mouseY * 0.2 - laptopGroup.rotation.x) * 0.06;

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

  // Kinetic Typography Distortion on Mouse Move
  const kineticTitle = document.getElementById('introKineticTitle');
  if (kineticTitle) {
    let lastX = 0, lastTime = Date.now();
    window.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const dt = Math.max(1, now - lastTime);
      const vx = Math.abs(e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTime = now;

      const skew = Math.min(8, vx * 4);
      kineticTitle.style.transform = `skewX(${(e.clientX > window.innerWidth / 2 ? -1 : 1) * skew}deg)`;
      clearTimeout(kineticTitle._timer);
      kineticTitle._timer = setTimeout(() => {
        kineticTitle.style.transform = 'skewX(0deg)';
      }, 150);
    });
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
      // Natural cinematic pause at 87% exactly as in reference image
      setTimeout(() => { curProgress = 88; }, 400);
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
  }, 42);

  function onLoadingReady() {
    if (pStatus) {
      pStatus.textContent = 'SYSTEM READY';
      pStatus.classList.add('text-emerald-400');
    }
    if (launchBtn) {
      launchBtn.classList.remove('btn-disabled');
      launchBtn.classList.add('shadow-[0_0_35px_rgba(230,90,25,0.6)]');
    }
    if (launchText) {
      launchText.textContent = 'CLICK TO LAUNCH';
      launchText.classList.add('text-white', 'font-black');
    }
  }

  // Transition Dismissal
  function dismissIntro() {
    if (!isIntroActive) return;
    isIntroActive = false;

    if (camera && typeof gsap !== 'undefined') {
      gsap.to(camera.position, { z: 0.5, duration: 0.8, ease: 'power2.in' });
    }

    overlay.classList.add('intro-launching');
    setTimeout(() => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
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
