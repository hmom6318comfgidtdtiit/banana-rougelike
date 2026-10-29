/**
 * Engine.js - High-DPI Responsive Canvas Loop & Input Handler
 */
class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Core Dimensions (Virtual internal resolution 1280x720 16:9 ratio)
    this.width = 1280;
    this.height = 720;
    this.scale = 1;
    this.dpr = window.devicePixelRatio || 1;

    // Mouse & Touch Tracking
    this.mouse = {
      x: 0,
      y: 0,
      rawX: 0,
      rawY: 0,
      vx: 0,
      vy: 0,
      isDown: false,
      clicked: false
    };
    this.lastMouse = { x: 0, y: 0 };

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Time Tracking
    this.lastTime = performance.now();
    this.dt = 0;

    // State & Systems
    this.stateManager = new StateManager();
    this.bgShader = new BackgroundShader();

    this.initCanvas();
    this.initEvents();
  }

  initCanvas() {
    const resize = () => {
      const container = this.canvas.parentElement;
      const w = container ? container.clientWidth : window.innerWidth;
      const h = container ? container.clientHeight : window.innerHeight;

      // Maintain aspect ratio 16:9 while maximizing full screen coverage
      let canvasW = w;
      let canvasH = w * (9 / 16);

      if (canvasH > h) {
        canvasH = h;
        canvasW = h * (16 / 9);
      }

      this.scale = canvasW / this.width;
      this.dpr = window.devicePixelRatio || 1;

      this.canvas.width = canvasW * this.dpr;
      this.canvas.height = canvasH * this.dpr;
      this.canvas.style.width = `${canvasW}px`;
      this.canvas.style.height = `${canvasH}px`;

      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    };

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 100));
    resize();
  }

  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;

      return {
        x: rawX / this.scale,
        y: rawY / this.scale,
        rawX,
        rawY
      };
    };

    const updateMouse = (e) => {
      const pos = getPos(e);
      this.mouse.vx = pos.x - this.mouse.x;
      this.mouse.vy = pos.y - this.mouse.y;
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.rawX = pos.rawX;
      this.mouse.rawY = pos.rawY;
    };

    this.canvas.addEventListener('mousemove', updateMouse);
    this.canvas.addEventListener('touchmove', (e) => {
      updateMouse(e);
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      if (window.soundController) window.soundController.ensureContext();
      updateMouse(e);
      this.mouse.isDown = true;
      this.mouse.clicked = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (window.soundController) window.soundController.ensureContext();
      updateMouse(e);
      this.mouse.isDown = true;
      this.mouse.clicked = true;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });

    window.addEventListener('blur', () => {
      this.mouse.isDown = false;
      this.mouse.clicked = false;
    });
  }

  triggerShake(intensity = 10) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  start(updateCallback, renderCallback) {
    const loop = (time) => {
      this.dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      // Update screen shake
      if (this.shakeIntensity > 0) {
        this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity *= 0.9;
        if (this.shakeIntensity < 0.5) {
          this.shakeIntensity = 0;
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
        }
      }

      this.bgShader.update(this.dt);

      if (updateCallback) updateCallback(this.dt);

      // Render
      this.ctx.save();
      this.ctx.scale(this.scale * this.dpr, this.scale * this.dpr);

      // Apply shake offset
      this.ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

      // Background shader
      this.bgShader.render(this.ctx, this.width, this.height);

      if (renderCallback) renderCallback(this.ctx);

      this.ctx.restore();

      // Reset one-frame click input
      this.mouse.clicked = false;
      this.mouse.vx = 0;
      this.mouse.vy = 0;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.Engine = Engine;
