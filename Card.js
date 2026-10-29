const SUITS = {
  SPADES: { name: 'Spades', symbol: '♠', color: '#1e293b' },
  HEARTS: { name: 'Hearts', symbol: '♥', color: '#ef4444' },
  CLUBS: { name: 'Clubs', symbol: '♣', color: '#0f172a' },
  DIAMONDS: { name: 'Diamonds', symbol: '♦', color: '#3b82f6' }
};
const RANKS = [
  { name: '2', value: 2, chips: 2 },
  { name: '3', value: 3, chips: 3 },
  { name: '4', value: 4, chips: 4 },
  { name: '5', value: 5, chips: 5 },
  { name: '6', value: 6, chips: 6 },
  { name: '7', value: 7, chips: 7 },
  { name: '8', value: 8, chips: 8 },
  { name: '9', value: 9, chips: 9 },
  { name: '10', value: 10, chips: 10 },
  { name: 'J', value: 11, chips: 10 },
  { name: 'Q', value: 12, chips: 10 },
  { name: 'K', value: 13, chips: 10 },
  { name: 'A', value: 14, chips: 11 }
];
class Card {
  constructor(rank, suit, id) {
    this.id = id || Math.random().toString(36).substr(2, 9);
    this.rank = rank;
    this.suit = suit;
    this.chips = rank.chips;
    this.width = 115;
    this.height = 165;
    this.x = 640;
    this.y = 900;
    this.rotation = 0;
    this.scale = 1;
    this.targetX = 640;
    this.targetY = 900;
    this.targetRotation = 0;
    this.targetScale = 1;
    this.isSelected = false;
    this.isHovered = false;
    this.isFaceUp = true;
    this.tiltX = 0;
    this.tiltY = 0;
  }
  update(dt, mouse) {
    const lerpRate = 12 * dt;
    this.x += (this.targetX - this.x) * Math.min(lerpRate, 1);
    this.y += (this.targetY - this.y) * Math.min(lerpRate, 1);
    let desiredScale = this.targetScale;
    if (this.isHovered) desiredScale *= 1.22;
    if (this.isSelected) desiredScale *= 1.05;
    this.scale += (desiredScale - this.scale) * Math.min(lerpRate * 1.5, 1);
    this.rotation += (this.targetRotation - this.rotation) * Math.min(lerpRate, 1);
    if (this.isHovered && mouse) {
      const relX = (mouse.x - this.x) / (this.width / 2);
      const relY = (mouse.y - this.y) / (this.height / 2);
      const targetTiltX = -relY * 0.3 + (mouse.vy * 0.02);
      const targetTiltY = relX * 0.3 + (mouse.vx * 0.02);
      this.tiltX += (targetTiltX - this.tiltX) * Math.min(18 * dt, 1);
      this.tiltY += (targetTiltY - this.tiltY) * Math.min(18 * dt, 1);
    } else {
      this.tiltX += (0 - this.tiltX) * Math.min(8 * dt, 1);
      this.tiltY += (0 - this.tiltY) * Math.min(8 * dt, 1);
    }
  }
  containsPoint(px, py) {
    const hw = (this.width * this.scale) / 2;
    const hh = (this.height * this.scale) / 2;
    return px >= this.x - hw && px <= this.x + hw && py >= this.y - hh && py <= this.y + hh;
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation + this.tiltY * 0.25);
    ctx.scale(this.scale, this.scale);
    const hw = this.width / 2;
    const hh = this.height / 2;
    ctx.save();
    ctx.shadowColor = this.isHovered ? '#facc15' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = this.isHovered ? 24 : 14;
    ctx.shadowOffsetY = this.isHovered ? 16 : 6;
    ctx.fillStyle = this.isSelected ? '#fffbeb' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 14);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = this.isSelected ? 4 : (this.isHovered ? 3 : 1.5);
    ctx.strokeStyle = this.isSelected ? '#eab308' : (this.isHovered ? '#60a5fa' : '#cbd5e1');
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 14);
    ctx.stroke();
    ctx.fillStyle = this.suit.color;
    ctx.font = '900 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.rank.name, -hw + 12, -hh + 10);
    ctx.font = '18px Arial';
    ctx.fillText(this.suit.symbol, -hw + 12, -hh + 34);
    ctx.save();
    ctx.translate(hw - 12, hh - 10);
    ctx.rotate(Math.PI);
    ctx.font = '900 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.rank.name, 0, 0);
    ctx.font = '18px Arial';
    ctx.fillText(this.suit.symbol, 0, 24);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '48px Arial';
    ctx.fillText(this.suit.symbol, 0, -10);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-35, hh - 28, 70, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = '900 12px Outfit, sans-serif';
    ctx.fillText(`+${this.chips} CHIPS`, 0, hh - 18);
    ctx.restore();
  }
}
window.SUITS = SUITS;
window.RANKS = RANKS;
window.Card = Card;
