/**
 * Deck.js - Standard 52-card deck management, drawing, playing, and hand evaluation.
 */
class Deck {
  constructor() {
    this.cards = [];
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.playedCards = [];
    this.maxHandSize = 8;
    this.flying = [];

    this.reset();
  }

  reset() {
    this.cards = [];
    let idCounter = 0;
    Object.values(SUITS).forEach(suit => {
      RANKS.forEach(rank => {
        this.cards.push(new Card(rank, suit, `card_${idCounter++}`));
      });
    });

    this.shuffle();
  }

  shuffle() {
    this.drawPile = [...this.cards];
    this.hand = [];
    this.discardPile = [];
    this.playedCards = [];
    this.flying = [];

    // Fisher-Yates Shuffle
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }

    // Set face down for draw pile initial state
    this.drawPile.forEach(c => {
      c.isFaceUp = true;
      c.x = 1150;
      c.y = 580;
      c.targetX = 1150;
      c.targetY = 580;
      c.isSelected = false;
      c.isHovered = false;
    });
  }

  drawHand() {
    const needed = this.maxHandSize - this.hand.length;
    for (let i = 0; i < needed; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        // Refill draw pile from discard
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.drawPile.forEach(c => {
          c.x = 1150;
          c.y = 580;
          c.targetX = 1150;
          c.targetY = 580;
          c.targetRotation = 0;
        });
      }
      const card = this.drawPile.pop();
      this.hand.push(card);
    }
    this.updateParabolicLayout();
  }

  /**
   * Parabolic Algebraic Hand Curve Algorithm
   * Arranges cards in hand along an upward-facing parabolic arc with dynamic rotation.
   */
  updateParabolicLayout() {
    const count = this.hand.length;
    if (count === 0) return;

    const centerX = 640;
    const baseY = 580;
    const totalWidth = Math.min(count * 85, 700);
    const startX = centerX - totalWidth / 2 + 42;
    const stepX = count > 1 ? (totalWidth - 85) / (count - 1) : 0;

    this.hand.forEach((card, i) => {
      // Normalized offset from center (-1 to 1)
      const norm = count > 1 ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0;

      // Parabola Y delta
      const arcHeight = 35;
      const deltaY = Math.pow(norm, 2) * arcHeight;

      // Parabolic rotation tilt (-18 to +18 deg)
      const maxRot = 0.28; // Radians (~16 deg)
      const rotation = norm * maxRot;

      card.targetX = startX + i * stepX;
      card.targetY = baseY + deltaY - (card.isSelected ? 45 : 0);
      card.targetRotation = rotation;
      card.targetScale = card.isSelected ? 1.05 : 1;
    });
  }

  getSelectedCards() {
    return this.hand.filter(c => c.isSelected);
  }

  deselectAll() {
    this.hand.forEach(c => c.isSelected = false);
    this.updateParabolicLayout();
  }

  playSelectedHand() {
    const selected = this.getSelectedCards();
    if (selected.length === 0) return [];

    // Remove from hand and move to playedCards
    this.hand = this.hand.filter(c => !c.isSelected);
    this.playedCards = selected;

    // Position played cards in center screen fan
    const count = selected.length;
    const centerX = 640;
    const startX = centerX - ((count - 1) * 90) / 2;

    selected.forEach((card, idx) => {
      card.targetX = startX + idx * 90;
      card.targetY = 320;
      card.targetRotation = (idx - (count - 1) / 2) * 0.05;
      card.isSelected = false;
      card.isHovered = false;
    });

    return selected;
  }

  discardSelectedHand() {
    const selected = this.getSelectedCards();
    if (selected.length === 0) return [];

    this.hand = this.hand.filter(c => !c.isSelected);
    selected.forEach(card => {
      card.isSelected = false;
      card.targetX = 120;
      card.targetY = 580;
      this.discardPile.push(card);
      this.flying.push(card);
    });

    this.drawHand();
    return selected;
  }

  discardPlayedCards() {
    this.playedCards.forEach(card => {
      card.targetX = 120;
      card.targetY = 580;
      card.targetRotation = 0;
      this.discardPile.push(card);
      this.flying.push(card);
    });
    this.playedCards = [];
    this.drawHand();
  }

  update(dt, mouse) {
    // Process top-down Raycast mouse hover detection (highest card z-index wins)
    let hoveredFound = false;

    // Sort hand by x position or current hover
    for (let i = this.hand.length - 1; i >= 0; i--) {
      const card = this.hand[i];
      if (!hoveredFound && card.containsPoint(mouse.x, mouse.y)) {
        if (!card.isHovered && window.soundController) {
          window.soundController.playHover();
        }
        card.isHovered = true;
        hoveredFound = true;
      } else {
        card.isHovered = false;
      }
      card.update(dt, mouse);
    }

    // Update played cards and draw/discard piles
    this.playedCards.forEach(c => c.update(dt, mouse));
    this.drawPile.forEach(c => c.update(dt, mouse));
    this.discardPile.forEach(c => c.update(dt, mouse));

    // Handle click card selection
    if (mouse.clicked && hoveredFound) {
      const hoveredCard = this.hand.find(c => c.isHovered);
      if (hoveredCard) {
        const currentlySelected = this.getSelectedCards();
        if (!hoveredCard.isSelected && currentlySelected.length >= 5) {
          // Max 5 cards selected per hand
          return;
        }
        hoveredCard.isSelected = !hoveredCard.isSelected;
        if (window.soundController) {
          if (hoveredCard.isSelected) window.soundController.playSelect();
          else window.soundController.playDeselect();
        }
        this.updateParabolicLayout();
      }
    }
  }

  renderPile(ctx, x, y, count, label, accent) {
    if (count <= 0) return;
    const layers = Math.min(4, Math.ceil(count / 13));
    for (let i = layers - 1; i >= 0; i--) {
      ctx.save();
      ctx.translate(x - i * 2, y - i * 2);
      const g = ctx.createLinearGradient(-55, -80, 55, 80);
      g.addColorStop(0, '#4c1d95');
      g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(-55, -80, 110, 160, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();
      if (i === 0) {
        ctx.font = '46px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍌', 0, 0);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.font = '900 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.fillText(`${label} · ${count}`, x, y + 98);
    ctx.restore();
  }

  render(ctx) {
    this.renderPile(ctx, 120, 580, this.discardPile.length, 'DISCARD', '#94a3b8');
    this.renderPile(ctx, 1150, 580, this.drawPile.length, 'DECK', '#facc15');

    // Cards still travelling to the discard pile
    this.flying = this.flying.filter(c => Math.hypot(c.x - c.targetX, c.y - c.targetY) > 14);
    this.flying.forEach(c => c.render(ctx));

    // Render Played Cards
    this.playedCards.forEach(c => c.render(ctx));

    // Render Hand Cards in Z-Order (Hovered card drawn last / on top)
    const normalCards = this.hand.filter(c => !c.isHovered);
    const hoveredCard = this.hand.find(c => c.isHovered);

    normalCards.forEach(c => c.render(ctx));
    if (hoveredCard) hoveredCard.render(ctx);
  }
}

window.Deck = Deck;
