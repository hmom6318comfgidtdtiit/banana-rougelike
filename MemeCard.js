/**
 * MemeCard.js - Top bar passive modifier meme cards (Balatro-style Jokers).
 */

class MemeCard {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.icon = config.icon || '🍌';
    this.description = config.description;
    this.cost = config.cost || 5;
    this.rarity = config.rarity || 'Common'; // Common, Uncommon, Rare, Legendary
    this.color = config.color || '#3b82f6';
    this.onScoring = config.onScoring || null;
    this.onRoundEnd = config.onRoundEnd || null;

    // Render dimensions & animation
    this.width = 90;
    this.height = 120;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.scale = 1;
    this.isHovered = false;
    this.triggerBounce = 0;
  }

  update(dt, mouse) {
    this.x += (this.targetX - this.x) * Math.min(12 * dt, 1);
    this.y += (this.targetY - this.y) * Math.min(12 * dt, 1);

    if (this.triggerBounce > 0) {
      this.triggerBounce -= dt * 5;
      if (this.triggerBounce < 0) this.triggerBounce = 0;
    }

    const hw = this.width / 2;
    const hh = this.height / 2;
    this.isHovered = mouse && mouse.x >= this.x - hw && mouse.x <= this.x + hw && mouse.y >= this.y - hh && mouse.y <= this.y + hh;
    this.scale = this.isHovered ? 1.15 : 1 + Math.sin(this.triggerBounce * Math.PI) * 0.25;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    const w = this.width;
    const h = this.height;
    const hw = w / 2;
    const hh = h / 2;

    // Shadow & Glow
    ctx.shadowColor = this.isHovered ? this.color : 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = this.isHovered ? 20 : 10;
    ctx.shadowOffsetY = 5;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 10);
    ctx.fill();

    // Border
    ctx.lineWidth = this.isHovered ? 3 : 2;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    // Meme Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, 0, -hh + 35);

    // Meme Name
    ctx.fillStyle = '#f8fafc';
    let fs = 11;
    ctx.font = `900 ${fs}px Outfit, sans-serif`;
    while (ctx.measureText(this.name).width > w - 10 && fs > 6) {
      fs--;
      ctx.font = `900 ${fs}px Outfit, sans-serif`;
    }
    ctx.fillText(this.name, 0, -hh + 70);

    // Cost / Rarity Badge
    ctx.fillStyle = this.color;
    ctx.font = '800 10px Outfit, sans-serif';
    ctx.fillText(`${this.rarity.toUpperCase()} · $${this.cost}`, 0, hh - 15);

    ctx.restore();
  }
}

window.MemeCard = MemeCard;
