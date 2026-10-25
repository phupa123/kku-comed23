/**
 * COMED 23 - Cyber Particle Canvas Background Engine
 * Renders floating particles, constellation nodes, and subtle orange ambient glow
 */
(function (window) {
  'use strict';

  class CyberParticleBackground {
    constructor(canvasId = 'cyberParticleCanvas') {
      this.canvasId = canvasId;
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.animationFrame = null;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.particleCount = Math.min(65, Math.floor(window.innerWidth / 22));
    }

    init() {
      let canvas = document.getElementById(this.canvasId);
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = this.canvasId;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        canvas.style.opacity = '0.75';
        document.body.prepend(canvas);
      }

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();

      window.addEventListener('resize', () => this.resize(), { passive: true });
      this.createParticles();
      this.animate();
    }

    resize() {
      if (!this.canvas) return;
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    }

    createParticles() {
      this.particles = [];
      const colors = ['#E65A19', '#FF7A29', '#F59E0B', '#38BDF8'];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.6 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01
        });
      }
    }

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Draw constellation connection lines
      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Wrap edges smoothly
        if (p1.x < 0) p1.x = this.width;
        else if (p1.x > this.width) p1.x = 0;
        if (p1.y < 0) p1.y = this.height;
        else if (p1.y > this.height) p1.y = 0;

        p1.alpha += Math.sin(Date.now() * p1.pulseSpeed) * 0.005;

        // Draw particle dot with glow
        this.ctx.beginPath();
        this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p1.color;
        this.ctx.globalAlpha = Math.max(0.15, Math.min(0.85, p1.alpha));
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p1.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Connect nearby points
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = '#E65A19';
            this.ctx.globalAlpha = (1 - dist / 110) * 0.18;
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();
          }
        }
      }

      this.ctx.globalAlpha = 1.0;
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  // Interactive 3D Tilt Card Helper
  function init3DTiltCards(selector = '.tilt-card-3d') {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.5s ease-out';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease-out';
      });
    });
  }

  window.CyberParticleBackground = CyberParticleBackground;
  window.init3DTiltCards = init3DTiltCards;

  // Auto initialize on DOMContentLoaded if not disabled
  document.addEventListener('DOMContentLoaded', () => {
    const bg = new CyberParticleBackground();
    bg.init();
    init3DTiltCards();
  });

})(window);
