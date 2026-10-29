class BackgroundShader {
  constructor() {
    this.time = 0;
    this.currentTheme = 0; // 0: Neon Waves (Default), 1: Synthwave, 2: Matrix Rain, 3: Sunset Nebula, 4: Cyber Grid, 5: Deep Abyss
    this.themes = [
      { id: 0, name: 'Neon Waves' },
      { id: 1, name: 'Synthwave' },
      { id: 2, name: 'Matrix Rain' },
      { id: 3, name: 'Sunset Nebula' },
      { id: 4, name: 'Cyber Grid' },
      { id: 5, name: 'Deep Abyss' }
    ];
  }

  setBackground(index) {
    if (index >= 0 && index < this.themes.length) {
      this.currentTheme = index;
    }
  }

  update(dt) {
    this.time += dt * 0.4;
  }

  render(ctx, width, height) {
    switch (this.currentTheme) {
      case 1:
        this.renderSynthwave(ctx, width, height);
        break;
      case 2:
        this.renderMatrix(ctx, width, height);
        break;
      case 3:
        this.renderSunsetNebula(ctx, width, height);
        break;
      case 4:
        this.renderCyberGrid(ctx, width, height);
        break;
      case 5:
        this.renderDeepAbyss(ctx, width, height);
        break;
      case 0:
      default:
        this.renderNeonWaves(ctx, width, height);
        break;
    }
  }

  // 0. Neon Waves (Original)
  renderNeonWaves(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#0a0512';
    ctx.fillRect(0, 0, width, height);
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const alpha = 0.12 + Math.sin(this.time * 0.5 + i) * 0.04;
      const hue = (this.time * 15 + i * 55) % 360;
      ctx.fillStyle = `hsla(${hue}, 75%, 45%, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 15) {
        const speedFactor = this.time * (0.6 + i * 0.3);
        const wave1 = Math.sin(x * 0.0025 + speedFactor) * (50 + i * 20);
        const wave2 = Math.cos(x * 0.005 - speedFactor * 0.8) * (25 + i * 10);
        const y = (height * 0.4) + (i * 60) + wave1 + wave2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.04)';
    ctx.lineWidth = 1.5;
    const gridSize = 70;
    const offsetX = (this.time * 25) % gridSize;
    const offsetY = (this.time * 15) % gridSize;
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 1. Synthwave (Retro Sun & Perspective Grid)
  renderSynthwave(ctx, width, height) {
    ctx.save();
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0b001a');
    skyGrad.addColorStop(0.5, '#28003b');
    skyGrad.addColorStop(0.7, '#6b0059');
    skyGrad.addColorStop(1, '#0f0019');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Sun
    const sunX = width / 2;
    const sunY = height * 0.48;
    const sunRadius = 110;

    const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
    sunGrad.addColorStop(0, '#ffea00');
    sunGrad.addColorStop(0.5, '#ff2a75');
    sunGrad.addColorStop(1, '#ff0055');

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.shadowColor = '#ff2a75';
    ctx.shadowBlur = 40;
    ctx.fill();

    // Sun horizontal stripes
    ctx.fillStyle = '#1c002b';
    for (let i = 0; i < 6; i++) {
      const stripeY = sunY + 10 + i * 14;
      const stripeH = 3 + i * 1.5;
      ctx.fillRect(sunX - sunRadius - 10, stripeY, (sunRadius + 10) * 2, stripeH);
    }
    ctx.restore();

    // Horizon glowing line
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, sunY + 15);
    ctx.lineTo(width, sunY + 15);
    ctx.stroke();

    // Perspective Grid floor
    const horizonY = sunY + 15;
    ctx.strokeStyle = 'rgba(255, 0, 180, 0.45)';
    ctx.lineWidth = 2;

    // Perspective vertical lines
    const numLines = 24;
    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      const xTop = sunX + i * 12;
      const xBottom = sunX + i * 90;
      ctx.beginPath();
      ctx.moveTo(xTop, horizonY);
      ctx.lineTo(xBottom, height);
      ctx.stroke();
    }

    // Horizontal grid lines moving down
    const speed = (this.time * 60) % 40;
    for (let y = 0; y < 15; y++) {
      const lineY = horizonY + Math.pow(y + speed / 40, 2.2) * 2;
      if (lineY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 2. Matrix Rain
  renderMatrix(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#020b05';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.font = '16px monospace';
    const cols = 40;
    const colWidth = width / cols;

    for (let i = 0; i < cols; i++) {
      const x = i * colWidth + 5;
      const speed = (i % 5 + 1) * 80;
      const offset = (this.time * speed + i * 137) % (height + 200);

      for (let j = 0; j < 12; j++) {
        const y = offset - j * 20;
        if (y > 0 && y < height) {
          const charCode = 0x30a0 + ((i * 7 + j * 13 + Math.floor(this.time * 5)) % 96);
          const char = String.fromCharCode(charCode);

          if (j === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = `rgba(34, 197, 94, ${0.8 - j * 0.06})`;
            ctx.shadowBlur = 0;
          }
          ctx.fillText(char, x, y);
        }
      }
    }
    ctx.restore();
  }

  // 3. Sunset Nebula
  renderSunsetNebula(ctx, width, height) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1a0933');
    grad.addColorStop(0.5, '#3b124d');
    grad.addColorStop(1, '#0f051d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Nebula Clouds
    for (let i = 0; i < 3; i++) {
      const cx = width * (0.3 + i * 0.25) + Math.sin(this.time * 0.4 + i) * 60;
      const cy = height * (0.4 + i * 0.1) + Math.cos(this.time * 0.3 + i) * 40;
      const r = 220 + i * 50;

      const cloudGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      if (i === 0) {
        cloudGrad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
        cloudGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      } else if (i === 1) {
        cloudGrad.addColorStop(0, 'rgba(250, 204, 21, 0.2)');
        cloudGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      } else {
        cloudGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
        cloudGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      }

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating twinkling stars
    const starCount = 60;
    for (let s = 0; s < starCount; s++) {
      const sx = (s * 137.5 + 50) % width;
      const sy = (s * 293.3 + 30) % height;
      const size = 1 + (s % 3);
      const alpha = 0.3 + Math.sin(this.time * 2 + s) * 0.35;

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 4. Cyber Grid
  renderCyberGrid(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, width, height);

    const size = 60;
    const offsetX = (this.time * 30) % size;
    const offsetY = (this.time * 30) % size;

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1.5;

    for (let x = offsetX - size; x < width + size; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY - size; y < height + size; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Pulsing cyber nodes
    for (let i = 0; i < 12; i++) {
      const nx = ((i * 170 + 40) % (width - 100)) + 50;
      const ny = ((i * 130 + 80) % (height - 100)) + 50;
      const pulse = Math.sin(this.time * 3 + i) * 0.5 + 0.5;

      ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${0.2 + pulse * 0.4})` : `rgba(236, 72, 153, ${0.2 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(nx, ny, 4 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. Deep Abyss
  renderDeepAbyss(ctx, width, height) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#021024');
    grad.addColorStop(0.5, '#05263b');
    grad.addColorStop(1, '#010814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Underwater caustic beams
    for (let b = 0; b < 5; b++) {
      const bx = (width * 0.2 * b) + Math.sin(this.time * 0.3 + b) * 50;
      const beamGrad = ctx.createLinearGradient(bx, 0, bx + 100, height);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 120, 0);
      ctx.lineTo(bx + 250, height);
      ctx.lineTo(bx + 50, height);
      ctx.closePath();
      ctx.fill();
    }

    // Bioluminescent floating particles/bubbles
    for (let p = 0; p < 35; p++) {
      const px = (p * 83.1 + 20) % width;
      const py = (height - ((this.time * 25 + p * 40) % (height + 50)));
      const pr = 2 + (p % 4);

      ctx.fillStyle = p % 3 === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(45, 212, 191, 0.5)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px + Math.sin(this.time + p) * 15, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.BackgroundShader = BackgroundShader;
