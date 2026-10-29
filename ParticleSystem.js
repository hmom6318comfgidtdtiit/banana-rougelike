/**
 * ParticleSystem.js - High-juice floating multiplier text, confetti explosions, and sparks.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnJuiceText(x, y, text, color = '#facc15', size = 26) {
    this.particles.push({
      type: 'text',
      x,
      y,
      vy: -120,
      vx: (Math.random() - 0.5) * 40,
      text,
      color,
      size,
      alpha: 1,
      scale: 0.5,
      targetScale: 1.2,
      life: 1.5,
      maxLife: 1.5
    });
  }

  spawnConfetti(x, y, count = 40) {
    const colors = ['#facc15', '#38bdf8', '#f43f5e', '#a855f7', '#22c55e'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 300;
      this.particles.push({
        type: 'confetti',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 6,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
        life: 1.8 + Math.random() * 0.6,
        maxLife: 2.2
      });
    }
  }

  spawnSparks(x, y, color = '#38bdf8', count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'confetti') {
        p.vy += 250 * dt; // Gravity
        p.rotation += p.vRot * dt;
      }

      if (p.type === 'text') {
        p.vy *= 0.95;
        p.scale += (p.targetScale - p.scale) * Math.min(10 * dt, 1);
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'text') {
        ctx.translate(p.x, p.y);
        ctx.scale(p.scale, p.scale);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = p.color;
        ctx.font = `900 ${p.size}px Fredoka One, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 0);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, 0, 0);

      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

window.ParticleSystem = ParticleSystem;
