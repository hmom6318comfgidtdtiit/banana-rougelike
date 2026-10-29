class BackgroundShader {
  constructor() {
    this.time = 0;
  }
  update(dt) {
    this.time += dt * 0.4;
  }
  render(ctx, width, height) {
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
}
window.BackgroundShader = BackgroundShader;
