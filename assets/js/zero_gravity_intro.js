/**
 * KKU COMED 23 - Cinematic "Zero-Gravity" WebGL Pre-loader Intro Screen
 * Inspired by Google Antigravity & High-End Sci-Fi Production
 * Built with Three.js WebGL, GSAP, Custom Shaders & Interactive Cursor Target
 */
(function initZeroGravityIntroScreen() {
  // Only execute on index.html (or root)
  const pathname = window.location.pathname.toLowerCase();
  const isIndex = pathname.endsWith('index.html') || pathname.endsWith('/') || pathname === '';
  if (!isIndex) return;

  // Check if skipped in this session (unless forced via URL ?intro=1)
  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.get('intro') === '1';
  // Check if page was reloaded (F5) or first opened
  const navEntries = performance.getEntriesByType('navigation');
  const isReload = navEntries.length > 0 && navEntries[0].type === 'reload' ||
                   (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
  const hasSeen = sessionStorage.getItem('kku_comed23_intro_seen');
  
  // Allow intro on reload or first visit in this session
  if (!isReload && hasSeen && !forceIntro) {
    return;
  }

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #zeroGravityIntroOverlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background-color: #07070A;
      color: #FFFFFF;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      user-select: none;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #zeroGravityIntroOverlay.intro-launching {
      opacity: 0;
      transform: scale(1.1);
      pointer-events: none;
    }

    /* Fine noise overlay */
    .intro-noise {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E");
    }

    /* Liquid metal kinetic text glow & morph effect */
    .liquid-metal-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(3.5rem, 9vw, 8.5rem);
      font-weight: 900;
      letter-spacing: -0.05em;
      line-height: 0.9;
      background: linear-gradient(135deg, #FFF 0%, #EAEAEA 25%, #E65A19 55%, #B32B19 80%, #FFFFFF 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 35px rgba(230, 90, 25, 0.45));
      animation: liquidShimmer 4s ease infinite alternate;
      display: inline-block;
    }

    @keyframes liquidShimmer {
      0% { background-position: 0% 50%; filter: drop-shadow(0 0 25px rgba(230, 90, 25, 0.35)); }
      100% { background-position: 100% 50%; filter: drop-shadow(0 0 50px rgba(255, 122, 41, 0.65)); }
    }

    /* Radar arc loading spinner */
    .radar-arc {
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: #E65A19;
      border-right-color: #FF7A29;
      border-radius: 50%;
      animation: radarSpin 1s linear infinite;
    }
    @keyframes radarSpin {
      to { transform: rotate(360deg); }
    }

    /* Custom Crosshair Cursor */
    #introCursor {
      position: fixed;
      pointer-events: none;
      z-index: 100000;
      width: 44px;
      height: 44px;
      transform: translate(-50%, -50%);
      transition: width 0.2s, height 0.2s, background-color 0.2s;
    }

    /* Bracketed Launch CTA button */
    .industrial-btn {
      position: relative;
      background: rgba(18, 22, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .industrial-btn:hover {
      border-color: #E65A19;
      background: rgba(230, 90, 25, 0.15);
      box-shadow: 0 0 30px rgba(230, 90, 25, 0.4);
      transform: scale(1.05);
    }
    .industrial-btn.btn-disabled {
      opacity: 0.4;
      pointer-events: none;
      filter: grayscale(1);
    }
  `;
  document.head.appendChild(styleEl);

  // Intro HTML Overlay Structure
  const introEl = document.createElement('div');
  introEl.id = 'zeroGravityIntroOverlay';
  introEl.innerHTML = `
    <!-- Background Noise & Grids -->
    <div class="absolute inset-0 intro-noise pointer-events-none"></div>
    <div class="absolute inset-0 opacity-[0.04] pointer-events-none" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 60px 60px;"></div>

    <!-- Ambient Glow Blobs -->
    <div class="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#B32B19]/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/4 right-10 w-[700px] h-[700px] bg-[#E65A19]/20 rounded-full blur-[160px] pointer-events-none"></div>

    <!-- Telemetry Corner Bounding Markers -->
    <div class="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white/30 pointer-events-none"></div>
    <div class="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white/30 pointer-events-none"></div>
    <div class="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white/30 pointer-events-none"></div>
    <div class="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white/30 pointer-events-none"></div>

    <!-- TOP HEADER BAR: University Emblem & SKIP INTRO -->
    <div class="relative z-20 flex items-center justify-between px-8 sm:px-12 py-7 w-full">
      <!-- Top Left: Official KKU Branding -->
      <div class="flex items-center gap-3.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B32B19] to-[#E65A19] p-0.5 shadow-lg shadow-[#E65A19]/30">
          <div class="w-full h-full bg-[#0C1030] rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
            <img src="logo.png" alt="KKU" class="w-full h-full object-contain">
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-[11px] font-mono font-bold tracking-widest text-white uppercase">KHON KAEN UNIVERSITY</div>
          <div class="text-[9px] font-mono tracking-wider text-slate-400">FACULTY OF EDUCATION • COMED 23</div>
        </div>
      </div>

      <!-- Top Right: Sleek SKIP INTRO Button -->
      <button id="skipIntroBtn" class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-[#E65A19]/20 border border-white/20 hover:border-[#E65A19] text-xs font-mono font-semibold text-slate-300 hover:text-white transition group shadow-sm cursor-pointer">
        <span>SKIP INTRO</span>
        <span class="text-sm font-bold text-[#E65A19] group-hover:rotate-45 transition-transform">[ ↷ ]</span>
      </button>
    </div>

    <!-- MAIN HERO CONTENT: Left Title & Right 3D Zero-Gravity Orb -->
    <div class="relative z-10 max-w-7xl mx-auto h-[calc(100vh-180px)] px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      
      <!-- LEFT HALF: Massive Liquid-Metal COMED 23 Title & Progress -->
      <div class="lg:col-span-6 flex flex-col justify-center space-y-6 text-left">
        
        <div class="space-y-1">
          <div class="text-xs sm:text-sm font-mono tracking-widest text-[#FF7A29] uppercase font-bold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#E65A19] animate-ping"></span>
            FACULTY OF EDUCATION
          </div>
          <div class="text-xs sm:text-sm font-mono tracking-widest text-slate-400 uppercase">
            KHON KAEN UNIVERSITY
          </div>
        </div>

        <!-- Massive Liquid Metal Kinetic Title -->
        <div class="py-2">
          <div id="liquidComedTitle" class="liquid-metal-title">
            COMED 23
          </div>
        </div>

        <!-- Subtitle & Scientific Progress Tracker -->
        <div class="space-y-4">
          <p class="text-xs font-mono uppercase tracking-widest text-slate-400">
            INTERACTIVE INTRO — PREPARING DIGITAL ENVIRONMENT
          </p>

          <!-- Interactive Radar & Progress Percentage -->
          <div class="flex items-center gap-4">
            <div class="relative w-10 h-10 flex items-center justify-center">
              <div class="w-10 h-10 radar-arc"></div>
              <span class="w-2.5 h-2.5 rounded-full bg-[#E65A19] shadow-[0_0_10px_#E65A19]"></span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span id="introPercentText" class="text-xl sm:text-2xl font-mono font-black text-white">0%</span>
                <span id="introStatusText" class="text-xs font-mono text-slate-400 uppercase">LOADING...</span>
              </div>
              <div class="w-48 sm:w-64 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                <div id="introProgressBar" class="h-full bg-gradient-to-r from-[#B32B19] via-[#E65A19] to-[#FF7A29] rounded-full transition-all duration-100" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Telemetry Matrix Under Title -->
        <div class="hidden sm:grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-[9px] font-mono text-slate-500">
          <div>COORDS // 16.4743° N</div>
          <div>LOC // 102.8234° E</div>
          <div>ENV // ZERO_GRAVITY</div>
        </div>

      </div>

      <!-- RIGHT HALF: Massive 3D Abstract Zero-Gravity Orb Canvas -->
      <div class="lg:col-span-6 relative flex items-center justify-center h-full min-h-[350px]">
        <div id="introWebglContainer" class="relative w-full h-[360px] sm:h-[480px] lg:h-[580px] flex items-center justify-center cursor-grab active:cursor-grabbing">
          <!-- Three.js Canvas Injected Here -->
        </div>

        <!-- Microscopic Drag Badge -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0C1030]/80 border border-white/20 text-[9px] font-mono text-slate-400 tracking-widest uppercase pointer-events-none">
          DRAG / EXPLORE ORB
        </div>
      </div>

    </div>

    <!-- BOTTOM CTA: [ CLICK TO LAUNCH ] inside industrial bracketed frame -->
    <div class="absolute bottom-6 sm:bottom-10 left-1/2 -translate-y-0 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      <button id="launchPortalBtn" class="industrial-btn btn-disabled px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-widest text-white uppercase flex items-center gap-3 cursor-pointer">
        <span class="text-[#E65A19] font-black">[</span>
        <span id="launchBtnLabel">PREPARING ENVIRONMENT...</span>
        <span class="text-[#E65A19] font-black">]</span>
      </button>

      <!-- Pulsing Down/Launch Icon -->
      <div id="launchPulsingAnchor" class="flex flex-col items-center text-slate-500 animate-bounce text-xs">
        <span>↓</span>
      </div>
    </div>

    <!-- Custom Mouse Target Crosshair -->
    <div id="introCursor" class="hidden sm:flex items-center justify-center rounded-full border border-white/40 pointer-events-none">
      <div class="w-1.5 h-1.5 rounded-full bg-[#E65A19]"></div>
    </div>
  `;

  document.body.prepend(introEl);

  // Elements
  const pBar = document.getElementById('introProgressBar');
  const pText = document.getElementById('introPercentText');
  const pStatus = document.getElementById('introStatusText');
  const launchBtn = document.getElementById('launchPortalBtn');
  const launchLabel = document.getElementById('launchBtnLabel');
  const skipBtn = document.getElementById('skipIntroBtn');
  const cursor = document.getElementById('introCursor');

  // Custom Cursor Movement
  if (cursor) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    const hoverTargets = [launchBtn, skipBtn, document.getElementById('introWebglContainer')];
    hoverTargets.forEach(target => {
      if (!target) return;
      target.addEventListener('mouseenter', () => {
        cursor.style.width = '60px';
        cursor.style.height = '60px';
        cursor.style.borderColor = '#E65A19';
        cursor.style.backgroundColor = 'rgba(230, 90, 25, 0.15)';
      });
      target.addEventListener('mouseleave', () => {
        cursor.style.width = '44px';
        cursor.style.height = '44px';
        cursor.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        cursor.style.backgroundColor = 'transparent';
      });
    });
  }

  // Three.js Zero-Gravity Mutating Chrome & Liquid Glass Orb with Erupting Sparks
  let scene, camera, renderer, floatGroup, coreMesh, cageMesh, glassMesh, particleSystem, explosionParticles;
  let isIntroActive = true;
  let animId;

  (function initThreeScene() {
    const container = document.getElementById('introWebglContainer');
    if (!container || typeof THREE === 'undefined') return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.3;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0x07070A, 3.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xFFFFFF, 3.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const redSparkLight = new THREE.PointLight(0xE65A19, 7, 15);
    redSparkLight.position.set(-3, 2, 3);
    scene.add(redSparkLight);

    const deepRedLight = new THREE.PointLight(0xB32B19, 5, 12);
    deepRedLight.position.set(3, -2, 2);
    scene.add(deepRedLight);

    // Group
    floatGroup = new THREE.Group();
    scene.add(floatGroup);

    // 1. Inner Liquid-Metal Chrome Core (Glowing Brick-Red & Orange)
    const coreGeo = new THREE.SphereGeometry(1.05, 64, 64);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xB32B19,
      emissive: 0x5a1104,
      metalness: 0.98,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0
    });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    floatGroup.add(coreMesh);

    // 2. Metallic Wire Lattice Cage
    const cageGeo = new THREE.SphereGeometry(1.25, 32, 24);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0xEAEAEA,
      metalness: 0.95,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    cageMesh = new THREE.Mesh(cageGeo, cageMat);
    floatGroup.add(cageMesh);

    // 3. Outer Mutating Liquid Glass Shell
    const glassGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.6,
      roughness: 0.04,
      metalness: 0.15,
      transmission: 0.92,
      ior: 1.55,
      thickness: 0.9,
      specularIntensity: 1.0,
      specularColor: 0xffffff
    });
    glassMesh = new THREE.Mesh(glassGeo, glassMat);
    floatGroup.add(glassMesh);

    // 4. Dashed Telemetry Orbital Trails
    function createTelemetryOrbit(radius, rotX, rotY) {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(120);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: 0xE65A19,
        dashSize: 0.09,
        gapSize: 0.06,
        transparent: true,
        opacity: 0.65
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.rotation.x = rotX;
      line.rotation.y = rotY;
      return line;
    }

    const ring1 = createTelemetryOrbit(1.95, Math.PI / 3, Math.PI / 7);
    const ring2 = createTelemetryOrbit(2.25, -Math.PI / 3.5, Math.PI / 4);
    floatGroup.add(ring1);
    floatGroup.add(ring2);

    // 5. Erupting Zero-Gravity Sparks & Light Streaks
    const sparkCount = 200;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      const r = 1.3 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      sparkPositions[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      sparkPositions[i * 3 + 1] = r * Math.sin(phi);
      sparkPositions[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

      sparkVelocities.push({
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.015 + 0.005,
        z: (Math.random() - 0.5) * 0.015
      });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xFF7A29,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    particleSystem = new THREE.Points(sparkGeo, sparkMat);
    scene.add(particleSystem);

    // Interactive Dragging
    let mouseX = 0, mouseY = 0;
    let targetRotX = 0, targetRotY = 0;
    let isDragging = false;
    let prevMouseX = 0, prevMouseY = 0;

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    const clock = new THREE.Clock();

    function renderLoop() {
      if (!isIntroActive) return;
      animId = requestAnimationFrame(renderLoop);

      const t = clock.getElapsedTime();

      // Zero-gravity bobbing
      floatGroup.position.y = Math.sin(t * 1.4) * 0.12;
      floatGroup.position.x = Math.cos(t * 0.9) * 0.07;

      // Rotations
      floatGroup.rotation.y += 0.006;
      cageMesh.rotation.y -= 0.008;
      cageMesh.rotation.x += 0.004;
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.004;

      // Drag interpolation
      floatGroup.rotation.y += (targetRotY + mouseX * 0.25 - floatGroup.rotation.y) * 0.05;
      floatGroup.rotation.x += (targetRotX - mouseY * 0.25 - floatGroup.rotation.x) * 0.05;

      // Sparks floating outward
      const pos = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        pos[i * 3] += sparkVelocities[i].x;
        pos[i * 3 + 1] += sparkVelocities[i].y;
        pos[i * 3 + 2] += sparkVelocities[i].z;

        // Reset if drifted too far
        const distSq = pos[i * 3] * pos[i * 3] + pos[i * 3 + 1] * pos[i * 3 + 1] + pos[i * 3 + 2] * pos[i * 3 + 2];
        if (distSq > 16) {
          const r = 1.35;
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;
          pos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi);
          pos[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);
        }
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    renderLoop();

    window.addEventListener('resize', () => {
      if (!container || !camera || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  })();

  // Transition Logic: Explosive Outward Particle Explosion & Camera Warp
  function dismissIntroScreen(isExplosion = true) {
    if (!isIntroActive) return;
    isIntroActive = false;
    sessionStorage.setItem('kku_comed23_intro_seen', 'true');

    if (isExplosion && typeof gsap !== 'undefined' && camera) {
      // Camera zooms rapidly forward into the orb
      gsap.to(camera.position, {
        z: 0.2,
        duration: 0.9,
        ease: 'power3.in'
      });
      // Orb scales out aggressively
      if (floatGroup) {
        gsap.to(floatGroup.scale, {
          x: 4.5,
          y: 4.5,
          z: 4.5,
          duration: 0.9,
          ease: 'power3.in'
        });
      }
    }

    introEl.classList.add('intro-launching');

    setTimeout(() => {
      if (animId) cancelAnimationFrame(animId);
      introEl.remove();
      const c = document.getElementById('introCursor');
      if (c) c.remove();
    }, 850);
  }

  // Skip Button Event
  skipBtn.addEventListener('click', () => {
    dismissIntroScreen(false);
  });

  // Launch CTA Button Event
  launchBtn.addEventListener('click', () => {
    if (launchBtn.classList.contains('btn-disabled')) return;
    dismissIntroScreen(true);
  });

  // Simulated Progress Countup: 0% -> 87% -> 100% READY
  let progress = 0;
  const progressTimer = setInterval(() => {
    // Accelerate toward 87%, pause slightly, then burst to 100%
    if (progress < 87) {
      progress += Math.floor(Math.random() * 5) + 3;
      if (progress > 87) progress = 87;
    } else if (progress === 87) {
      // Natural pause at 87% as specified in reference
      setTimeout(() => {
        progress = 88;
      }, 350);
    } else {
      progress += Math.floor(Math.random() * 6) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressTimer);
        onLoadingComplete();
      }
    }

    if (pBar) pBar.style.width = progress + '%';
    if (pText) pText.textContent = progress + '%';
  }, 45);

  function onLoadingComplete() {
    if (pStatus) {
      pStatus.textContent = 'SYSTEM READY';
      pStatus.classList.remove('text-slate-400');
      pStatus.classList.add('text-emerald-400', 'font-bold');
    }
    if (launchBtn) {
      launchBtn.classList.remove('btn-disabled');
      launchBtn.classList.add('shadow-[0_0_40px_rgba(230,90,25,0.6)]');
    }
    if (launchLabel) {
      launchLabel.textContent = 'CLICK TO LAUNCH';
      launchLabel.classList.add('text-white', 'font-black');
    }
    const pulsingAnchor = document.getElementById('launchPulsingAnchor');
    if (pulsingAnchor) {
      pulsingAnchor.classList.remove('text-slate-500');
      pulsingAnchor.classList.add('text-[#FF7A29]');
    }
  }

})();
