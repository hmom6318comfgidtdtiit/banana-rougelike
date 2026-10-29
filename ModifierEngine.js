/**
 * ModifierEngine.js - Manages the top bar meme card slots (up to 5) and executes scoring interceptors.
 */

class ModifierEngine {
  constructor() {
    this.memeSlots = [];
    this.maxSlots = 6;
    this.availableMemes = [];
    this.initMemeCatalog();
  }

  initMemeCatalog() {
    this.availableMemes = [
      // 1. STONKS: +1 Mult for every $1 held
      {
        id: 'stonks',
        name: 'STONKS',
        icon: '📈',
        description: 'Grants +1 Mult for every $1 you currently possess.',
        cost: 6,
        rarity: 'Uncommon',
        color: '#22c55e',
        onScoring: (context) => {
          const multBonus = context.runManager.money;
          if (multBonus > 0) {
            context.mult += multBonus;
            return { triggered: true, message: `+${multBonus} Mult (STONKS!)`, color: '#22c55e' };
          }
          return { triggered: false };
        }
      },

      // 2. DOGE: 1-in-4 chance per played card to trigger "Much Wow!" and grant x3 global multiplier
      {
        id: 'doge',
        name: 'DOGE',
        icon: '🐕',
        description: '1-in-4 chance per played card to yell "Much Wow!" and grant x3 Mult.',
        cost: 7,
        rarity: 'Rare',
        color: '#eab308',
        onScoring: (context) => {
          let triggered = false;
          let multiplier = 1;
          context.playedCards.forEach(() => {
            if (Math.random() < 0.25) {
              triggered = true;
              multiplier *= 3;
            }
          });
          if (triggered) {
            context.mult *= multiplier;
            return { triggered: true, message: `x${multiplier} Mult (Much Wow!)`, color: '#eab308' };
          }
          return { triggered: false };
        }
      },

      // 3. GIGACHAD: Grants +500 CHIPS if playing a single isolated high-value card without combos
      {
        id: 'gigachad',
        name: 'GIGACHAD',
        icon: '🗿',
        description: 'Grants +500 Chips if playing a single high-value card without combos.',
        cost: 8,
        rarity: 'Rare',
        color: '#94a3b8',
        onScoring: (context) => {
          if (context.playedCards.length === 1 && context.evalResult.typeKey === 'HIGH_CARD') {
            context.chips += 500;
            return { triggered: true, message: '+500 Chips (Refuses to Elaborate)', color: '#38bdf8' };
          }
          return { triggered: false };
        }
      },

      // 4. DISTRACTED BOYFRIEND: Swaps base multipliers of lowest-value card with highest-value card
      {
        id: 'distracted_boyfriend',
        name: 'DISTRACTED BOYFRIEND',
        icon: '👀',
        description: 'Swaps the chip values of the lowest-value card and highest-value card in played hand.',
        cost: 5,
        rarity: 'Common',
        color: '#ec4899',
        onScoring: (context) => {
          if (context.playedCards.length >= 2) {
            const sorted = [...context.playedCards].sort((a, b) => a.rank.chips - b.rank.chips);
            const lowest = sorted[0];
            const highest = sorted[sorted.length - 1];

            const temp = lowest.chips;
            lowest.chips = highest.chips;
            highest.chips = temp;

            return { triggered: true, message: 'Swapped Card Chips!', color: '#ec4899' };
          }
          return { triggered: false };
        }
      },

      // 5. HOLD THE LINE / DIAMOND HANDS: +2 permanent Mult for every consecutive round shop is skipped
      {
        id: 'diamond_hands',
        name: 'DIAMOND HANDS',
        icon: '💎',
        description: 'Grants +2 permanent Mult for every consecutive round you skip the Shop.',
        cost: 6,
        rarity: 'Uncommon',
        color: '#06b6d4',
        onScoring: (context) => {
          const bonus = context.runManager.shopSkippedConsecutive * 2;
          if (bonus > 0) {
            context.mult += bonus;
            return { triggered: true, message: `+${bonus} Mult (HOLD THE LINE!)`, color: '#06b6d4' };
          }
          return { triggered: false };
        }
      },

      // 6. PEPE: Grants +15 Mult if hand is a Flush
      {
        id: 'pepe',
        name: 'RARE PEPE',
        icon: '🐸',
        description: 'Grants +15 Mult if played hand is a Flush or Straight Flush.',
        cost: 5,
        rarity: 'Common',
        color: '#10b981',
        onScoring: (context) => {
          if (context.evalResult.typeKey === 'FLUSH' || context.evalResult.typeKey === 'STRAIGHT_FLUSH') {
            context.mult += 15;
            return { triggered: true, message: '+15 Mult (FEELS GOOD MAN)', color: '#10b981' };
          }
          return { triggered: false };
        }
      },

      // 7. NYAN CAT: Grants +100 Chips on every played Ace or King
      {
        id: 'nyan_cat',
        name: 'NYAN CAT',
        icon: '🐱',
        description: 'Grants +100 Chips for every Ace or King in played hand.',
        cost: 6,
        rarity: 'Uncommon',
        color: '#f43f5e',
        onScoring: (context) => {
          let count = 0;
          context.playedCards.forEach(c => {
            if (c.rank.value === 14 || c.rank.value === 13) count++;
          });
          if (count > 0) {
            const added = count * 100;
            context.chips += added;
            return { triggered: true, message: `+${added} Chips (NYAN!)`, color: '#f43f5e' };
          }
          return { triggered: false };
        }
      },

      // 9-13. EXTRA MEMES
      {
        id: 'this_is_fine', name: 'THIS IS FINE', icon: '🔥',
        description: 'Grants +4 Mult for every Discard you have left.',
        cost: 5, rarity: 'Common', color: '#f97316',
        onScoring: (context) => {
          const bonus = context.runManager.discardsRemaining * 4;
          if (bonus > 0) { context.mult += bonus; return { triggered: true, message: `+${bonus} Mult (THIS IS FINE)`, color: '#f97316' }; }
          return { triggered: false };
        }
      },
      {
        id: 'sigma', name: 'SIGMA GRINDSET', icon: '🐺',
        description: 'Grants +4 Mult for every face card (J, Q, K) played.',
        cost: 6, rarity: 'Uncommon', color: '#a78bfa',
        onScoring: (context) => {
          const n = context.playedCards.filter(c => c.rank.value >= 11 && c.rank.value <= 13).length;
          if (n > 0) { context.mult += n * 4; return { triggered: true, message: `+${n * 4} Mult (GRINDSET)`, color: '#a78bfa' }; }
          return { triggered: false };
        }
      },
      {
        id: 'wojak', name: 'WOJAK', icon: '😭',
        description: 'Grants +40 Chips for every Hand you have left.',
        cost: 5, rarity: 'Common', color: '#60a5fa',
        onScoring: (context) => {
          const bonus = context.runManager.handsRemaining * 40;
          if (bonus > 0) { context.chips += bonus; return { triggered: true, message: `+${bonus} Chips (I KNOW THAT FEEL)`, color: '#60a5fa' }; }
          return { triggered: false };
        }
      },
      {
        id: 'trollface', name: 'TROLLFACE', icon: '😈',
        description: 'Coin flip: x2 Mult or +10 Mult. Problem?',
        cost: 7, rarity: 'Rare', color: '#f43f5e',
        onScoring: (context) => {
          if (Math.random() < 0.5) { context.mult *= 2; return { triggered: true, message: 'x2 Mult (PROBLEM?)', color: '#f43f5e' }; }
          context.mult += 10;
          return { triggered: true, message: '+10 Mult (U MAD?)', color: '#f43f5e' };
        }
      },
      {
        id: 'amogus', name: 'SUS', icon: '📮',
        description: 'Grants +12 Mult if hand is Two Pair or Full House.',
        cost: 5, rarity: 'Common', color: '#ef4444',
        onScoring: (context) => {
          if (context.evalResult.typeKey === 'TWO_PAIR' || context.evalResult.typeKey === 'FULL_HOUSE') {
            context.mult += 12;
            return { triggered: true, message: '+12 Mult (SUS)', color: '#ef4444' };
          }
          return { triggered: false };
        }
      },

      // 8. OVER 9000: x1.5 Mult if total score in round reaches 9000
      {
        id: 'over_9000',
        name: "IT'S OVER 9000!",
        icon: '💥',
        description: 'Grants x2 Mult if current total score exceeds 9,000.',
        cost: 9,
        rarity: 'Rare',
        color: '#f97316',
        onScoring: (context) => {
          if (context.runManager.currentScore > 9000) {
            context.mult *= 2;
            return { triggered: true, message: 'x2 Mult (OVER 9000!)', color: '#f97316' };
          }
          return { triggered: false };
        }
      }
    ];
  }

  addMeme(memeId) {
    if (this.memeSlots.length >= this.maxSlots) return false;
    const config = this.availableMemes.find(m => m.id === memeId);
    if (!config) return false;

    const memeCard = new MemeCard(config);
    this.memeSlots.push(memeCard);
    this.updateSlotPositions();
    return true;
  }

  removeMeme(index) {
    if (index >= 0 && index < this.memeSlots.length) {
      this.memeSlots.splice(index, 1);
      this.updateSlotPositions();
    }
  }

  sellMeme(index, runManager) {
    if (index < 0 || index >= this.memeSlots.length) return false;
    const meme = this.memeSlots[index];
    const sellValue = Math.max(1, Math.floor((meme.cost || 5) / 2));
    this.removeMeme(index);
    if (runManager) {
      runManager.money += sellValue;
      if (runManager.stats) runManager.stats.moneyEarned += sellValue;
    }
    if (window.soundController) window.soundController.playCash();
    return sellValue;
  }

  updateSlotPositions() {
    const count = this.memeSlots.length;
    const startX = 640 - ((count - 1) * 105) / 2;
    this.memeSlots.forEach((meme, idx) => {
      meme.targetX = startX + idx * 105;
      meme.targetY = 70;
    });
  }

  // Fires a single meme against the scoring context; returns its result if it triggered.
  triggerOne(meme, context, particleSystem, soundController) {
    if (!meme.onScoring) return null;
    const res = meme.onScoring(context);
    if (!res || !res.triggered) return null;
    meme.triggerBounce = 1;
    if (soundController) soundController.playMemeTrigger();
    if (particleSystem) {
      particleSystem.spawnJuiceText(meme.x, meme.y + 90, res.message, res.color || '#facc15', 22);
      particleSystem.spawnSparks(meme.x, meme.y, res.color || '#facc15', 12);
    }
    return res;
  }

  evaluateScoring(context, particleSystem, soundController) {
    const results = [];
    this.memeSlots.forEach((meme) => {
      const res = this.triggerOne(meme, context, particleSystem, soundController);
      if (res) results.push(res);
    });
    return results;
  }

  getRandomShopMemes(count = 3) {
    const owned = new Set(this.memeSlots.map(m => m.id));
    const shuffled = this.availableMemes.filter(m => !owned.has(m.id)).sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  update(dt, mouse) {
    this.memeSlots.forEach(m => m.update(dt, mouse));
  }

  render(ctx) {
    // Render slot outlines up to maxSlots (6)
    const startX = 640 - ((this.maxSlots - 1) * 105) / 2;
    for (let i = 0; i < this.maxSlots; i++) {
      const slotX = startX + i * 105;
      const slotY = 70;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(slotX - 45, slotY - 60, 90, 120, 10);
      ctx.stroke();
      ctx.restore();
    }

    // Render active meme cards
    this.memeSlots.forEach(m => m.render(ctx));
  }
}

window.ModifierEngine = ModifierEngine;
