class UIRenderer {
  constructor(engine, runManager, deck, modifierEngine, shopManager, particleSystem) {
    this.engine = engine;
    this.runManager = runManager;
    this.deck = deck;
    this.modifierEngine = modifierEngine;
    this.shopManager = shopManager;
    this.particleSystem = particleSystem;
    this.buttons = [];

    this.fontD = 'Fredoka One, sans-serif';
    this.fontB = 'Outfit, sans-serif';
    this.displayScore = 0;
    this.menuCards = [
      new Card(RANKS[12], SUITS.SPADES, 'menu_a'),
      new Card(RANKS[11], SUITS.HEARTS, 'menu_k'),
      new Card(RANKS[12], SUITS.DIAMONDS, 'menu_a2')
    ];
  }
  clearButtons() { this.buttons = []; }
  addButton(id, x, y, width, height, text, onClick, color = '#eab308') {
    this.buttons.push({ id, x, y, width, height, text, onClick, color });
  }
  isOverButton(mouse) {
    return this.buttons.some(b =>
      mouse.x >= b.x - b.width / 2 && mouse.x <= b.x + b.width / 2 &&
      mouse.y >= b.y - b.height / 2 && mouse.y <= b.y + b.height / 2);
  }
  handleMouseClick(mouse) {
    for (let btn of this.buttons) {
      const hw = btn.width / 2;
      const hh = btn.height / 2;
      if (mouse.x >= btn.x - hw && mouse.x <= btn.x + hw && mouse.y >= btn.y - hh && mouse.y <= btn.y + hh) {
        if (window.soundController) window.soundController.playSelect();
        btn.onClick();
        return true;
      }
    }
    return false;
  }
  renderButton(ctx, btn, mouse) {
    const hw = btn.width / 2;
    const hh = btn.height / 2;
    const isHovered = mouse.x >= btn.x - hw && mouse.x <= btn.x + hw && mouse.y >= btn.y - hh && mouse.y <= btn.y + hh;
    ctx.save();
    ctx.translate(btn.x, btn.y);
    if (isHovered) ctx.scale(1.06, 1.06);
    ctx.shadowColor = isHovered ? btn.color : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = isHovered ? 20 : 8;
    ctx.fillStyle = btn.color;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, btn.width, btn.height, 12);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 16px Fredoka One, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text.toUpperCase(), 0, 0);
    ctx.restore();
  }

  // ---------- shared drawing helpers ----------
  panel(ctx, x, y, w, h, border = '#6d5bd0', r = 16) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(34, 28, 66, 0.94)');
    g.addColorStop(1, 'rgba(14, 10, 30, 0.94)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = border;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, w - 10, h - 10, Math.max(r - 5, 2));
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, str, x, y, size, color, align = 'center', font = this.fontD) {
    ctx.save();
    ctx.font = `900 ${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 6);
    ctx.strokeStyle = 'rgba(8, 4, 20, 0.9)';
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  wrapLines(ctx, text, maxW) {
    const lines = [];
    let line = '';
    text.split(' ').forEach(w => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  renderMemeTooltip(ctx) {
    const m = this.modifierEngine.memeSlots.find(s => s.isHovered);
    if (!m) return;
    const w = 250;
    ctx.save();
    ctx.font = `600 14px ${this.fontB}`;
    const lines = this.wrapLines(ctx, m.description, w - 28);
    const h = 64 + lines.length * 19;
    const x = Math.max(10, Math.min(1270 - w, m.x - w / 2));
    const y = m.y + 82;
    this.panel(ctx, x, y, w, h, m.color, 12);
    this.label(ctx, m.name, x + w / 2, y + 24, 18, '#ffffff');
    ctx.font = `800 11px ${this.fontB}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = m.color;
    ctx.fillText(m.rarity.toUpperCase(), x + w / 2, y + 44);
    ctx.font = `600 14px ${this.fontB}`;
    ctx.fillStyle = '#cbd5e1';
    lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 66 + i * 19));
    ctx.restore();
  }
  stat(ctx, x, y, w, h, title, value, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    this.label(ctx, title, x + w / 2, y + 18, 12, color, 'center', this.fontB);
    this.label(ctx, String(value), x + w / 2, y + h - 26, 34, '#ffffff');
  }

  // ---------- 1. MAIN MENU ----------
  renderMainMenu(ctx, mouse) {
    this.clearButtons();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const waveY = Math.sin(performance.now() * 0.0035) * 12;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#facc15';
    ctx.font = '900 110px Fredoka One, sans-serif';
    ctx.fillText('🍌 BANANA 🍌', 640, 210 + waveY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Outfit, sans-serif';
    ctx.fillText('THE MEME ROGUELIKE DECKBUILDER', 640, 310);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('Break math engines using illegal internet memes.', 640, 350);
    this.addButton('PLAY', 640, 470, 240, 60, 'START RUN', () => {
      this.runManager = new RunManager();
      this.displayScore = 0;
      this.deck.reset();
      this.deck.drawHand();
      this.modifierEngine.memeSlots = [];
      this.modifierEngine.addMeme('stonks');
      this.engine.stateManager.setState(GameState.ACTIVE_ROUND);
    }, '#facc15');
    this.buttons.forEach(btn => this.renderButton(ctx, btn, mouse));

    // Floating card fan
    const t = performance.now() * 0.002;
    this.menuCards.forEach((c, i) => {
      c.x = 640 + (i - 1) * 120;
      c.y = 640 + Math.abs(i - 1) * 18 + Math.sin(t + i) * 8;
      c.rotation = (i - 1) * 0.22 + Math.sin(t * 0.7 + i) * 0.03;
      c.scale = 1;
      c.render(ctx);
    });

    const best = RunManager.loadBest();
    if (best) {
      this.label(ctx, `BEST RUN: ANTE ${best.ante} · BEST HAND ${best.bestHand.toLocaleString()}`, 640, 540, 16, '#a78bfa', 'center', this.fontB);
    }
    ctx.restore();
  }

  // ---------- 2. ACTIVE ROUND ----------
  renderActiveRound(ctx, mouse, scoringState) {
    this.clearButtons();
    const rm = this.runManager;
    const scoring = !!(scoringState && scoringState.active);

    // Rolling score counter
    if (rm.currentScore < this.displayScore) this.displayScore = rm.currentScore;
    else this.displayScore += (rm.currentScore - this.displayScore) * 0.12;
    if (Math.abs(rm.currentScore - this.displayScore) < 1) this.displayScore = rm.currentScore;

    this.modifierEngine.render(ctx);

    // Left HUD: blind + score
    const blinds = [
      { n: 'SMALL BLIND', c: '#38bdf8' },
      { n: 'BIG BLIND', c: '#f59e0b' },
      { n: 'BOSS BLIND', c: '#ef4444' }
    ];
    const b = blinds[rm.round - 1];
    this.panel(ctx, 30, 160, 220, 320, b.c);
    this.label(ctx, b.n, 140, 188, 22, b.c);
    this.label(ctx, 'SCORE AT LEAST', 140, 220, 12, '#94a3b8', 'center', this.fontB);
    this.label(ctx, rm.targetScore.toLocaleString(), 140, 252, 34, '#f43f5e');
    const pct = Math.min(1, this.displayScore / rm.targetScore);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.roundRect(55, 278, 170, 12, 6); ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = pct >= 1 ? '#facc15' : '#22c55e';
      ctx.beginPath(); ctx.roundRect(55, 278, Math.max(12, 170 * pct), 12, 6); ctx.fill();
    }
    ctx.restore();
    this.label(ctx, 'ROUND SCORE', 140, 316, 12, '#94a3b8', 'center', this.fontB);
    this.label(ctx, Math.floor(this.displayScore).toLocaleString(), 140, 350, 34, '#22c55e');
    this.label(ctx, `REWARD  $${rm.getBlindReward()}+`, 140, 394, 18, '#facc15');
    this.label(ctx, `ANTE ${rm.ante} / 8`, 140, 440, 22, '#e9d5ff');

    // Right HUD: hands / discards / cash
    this.panel(ctx, 1030, 160, 220, 320, '#6d5bd0');
    this.stat(ctx, 1048, 180, 90, 84, 'HANDS', rm.handsRemaining, '#38bdf8');
    this.stat(ctx, 1142, 180, 90, 84, 'DISCARDS', rm.discardsRemaining, '#ec4899');
    this.label(ctx, 'CASH', 1140, 300, 13, '#94a3b8', 'center', this.fontB);
    this.label(ctx, `$${rm.money}`, 1140, 338, 44, '#facc15');
    this.label(ctx, `MEMES ${this.modifierEngine.memeSlots.length} / ${this.modifierEngine.maxSlots}`, 1140, 392, 15, '#a78bfa', 'center', this.fontB);
    this.label(ctx, `INTEREST +$${rm.getInterest()}`, 1140, 424, 15, '#86efac', 'center', this.fontB);

    // Centre banner: hand name + chips x mult
    const selected = this.deck.getSelectedCards();
    let name = 'SELECT UP TO 5 CARDS';
    let chips = 0, mult = 0;
    if (scoring) {
      name = scoringState.evalResult.handType.name.toUpperCase();
      chips = scoringState.chips; mult = scoringState.mult;
    } else if (selected.length > 0) {
      const ev = HandEvaluator.evaluate(selected, rm.handLevels);
      name = `${ev.handType.name.toUpperCase()}  LV.${ev.level}`;
      chips = ev.baseChips + selected.reduce((s, c) => s + c.chips, 0);
      mult = ev.baseMult;
    }
    this.panel(ctx, 480, 142, 320, 38, '#6d5bd0', 12);
    this.label(ctx, name, 640, 161, 20, '#ffffff');
    const pulse = scoring ? 1 + Math.sin(performance.now() * 0.02) * 0.03 : 1;
    ctx.save();
    ctx.translate(640, 207);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath(); ctx.roundRect(-150, -23, 130, 46, 10); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.roundRect(20, -23, 130, 46, 10); ctx.fill();
    ctx.restore();
    this.label(ctx, Math.round(chips).toLocaleString(), 640 - 85 * pulse, 207, 28, '#ffffff');
    this.label(ctx, '×', 640, 207, 28, '#facc15');
    this.label(ctx, (Math.round(mult * 10) / 10).toLocaleString(), 640 + 85 * pulse, 207, 28, '#ffffff');

    // Buttons (hidden while scoring)
    if (!scoring) {
      if (selected.length > 0 && rm.handsRemaining > 0) {
        this.addButton('PLAY_HAND', 560, 485, 150, 45, 'PLAY HAND', () => {
          window.gameInstance.triggerPlayHand();
        }, '#22c55e');
      }
      if (selected.length > 0 && rm.discardsRemaining > 0) {
        this.addButton('DISCARD_HAND', 720, 485, 150, 45, 'DISCARD', () => {
          if (rm.discardsRemaining > 0) {
            rm.discardsRemaining--;
            this.deck.discardSelectedHand();
            if (window.soundController) window.soundController.playDiscard();
          }
        }, '#ef4444');
      }
      if (selected.length === 0) {
        this.label(ctx, 'Click cards to select · play a hand to score', 640, 485, 14, '#94a3b8', 'center', this.fontB);
      }
    }
    this.buttons.forEach(btn => this.renderButton(ctx, btn, mouse));
    this.renderMemeTooltip(ctx);
  }

  // ---------- 3. THE MEME SHOP ----------
  renderMemeShop(ctx, mouse) {
    this.clearButtons();
    const rm = this.runManager;

    // Render owned meme cards with Sell buttons in the shop
    this.modifierEngine.memeSlots.forEach((meme, idx) => {
      const sellVal = Math.max(1, Math.floor((meme.cost || 5) / 2));
      this.addButton(`SELL_MEME_${idx}`, meme.x, meme.y + 75, 80, 24, `SELL $${sellVal}`, () => {
        this.modifierEngine.sellMeme(idx, rm);
        if (this.particleSystem) {
          this.particleSystem.spawnSparks(meme.x, meme.y, '#facc15', 15);
        }
      }, '#ef4444');
    });

    this.label(ctx, '🛒 MEME SHOP 🛒', 640, 168, 46, '#facc15');
    const r = rm.lastReward;
    if (r) {
      this.label(ctx, `BLIND CLEARED  +$${r.total}   (blind $${r.blind} · hands $${r.hands} · interest $${r.interest})`, 640, 206, 15, '#86efac', 'center', this.fontB);
    }
    this.label(ctx, `CASH  $${rm.money}`, 640, 238, 28, '#ffffff');

    const items = this.shopManager.items;
    const gap = 215;
    const startX = 640 - ((items.length - 1) * gap) / 2;
    items.forEach((item, idx) => {
      const x = startX + idx * gap;
      const w = 190, h = 240, hw = w / 2, hh = h / 2;
      const hover = mouse.x >= x - hw && mouse.x <= x + hw && mouse.y >= 405 - hh && mouse.y <= 405 + hh;
      const y = 405 - (hover && !item.soldOut ? 6 : 0);
      this.panel(ctx, x - hw, y - hh, w, h, item.soldOut ? '#475569' : item.color, 14);
      ctx.save();
      ctx.globalAlpha = item.soldOut ? 0.45 : 1;
      ctx.font = '44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, x, y - hh + 44);
      this.label(ctx, item.name, x, y - hh + 86, 16, '#ffffff', 'center', this.fontB);
      ctx.font = `800 11px ${this.fontB}`;
      ctx.fillStyle = item.color;
      ctx.fillText((item.rarity || item.type.replace('_', ' ')).toUpperCase(), x, y - hh + 106);
      ctx.font = `600 13px ${this.fontB}`;
      ctx.fillStyle = '#cbd5e1';
      this.wrapLines(ctx, item.description, w - 30).forEach((l, i) => ctx.fillText(l, x, y - hh + 130 + i * 17));
      ctx.restore();
      if (!item.soldOut) {
        const afford = item.cost <= rm.money;
        this.addButton(`BUY_${idx}`, x, y + hh - 30, 140, 38, `BUY $${item.cost}`, () => {
          const ok = this.shopManager.buyItem(idx, this.deck);
          if (ok) this.particleSystem.spawnSparks(x, y, item.color, 18);
        }, afford ? '#22c55e' : '#64748b');
      } else {
        this.label(ctx, 'SOLD', x, y + hh - 30, 22, '#ef4444');
      }
    });

    this.addButton('REROLL', 530, 610, 170, 50, `REROLL ($${this.shopManager.rerollCost})`, () => {
      this.shopManager.reroll(this.deck);
    }, this.shopManager.rerollCost <= rm.money ? '#a855f7' : '#64748b');
    this.addButton('NEXT_ROUND', 750, 610, 230, 50, 'NEXT BLIND 🚀', () => {
      this.shopManager.skipShop();
      rm.nextRound();
      this.displayScore = 0;
      this.deck.shuffle();
      this.deck.drawHand();
      this.engine.stateManager.setState(GameState.ACTIVE_ROUND);
    }, '#facc15');
    this.buttons.forEach(btn => this.renderButton(ctx, btn, mouse));
    this.renderMemeTooltip(ctx);
  }

  // ---------- 4 & 5. END SCREENS ----------
  renderEndScreen(ctx, mouse, title, titleColor, subtitle) {
    const rm = this.runManager;
    const s = rm.stats;
    this.label(ctx, title, 640, 150, 72, titleColor);
    this.label(ctx, subtitle, 640, 210, 20, '#f8fafc', 'center', this.fontB);
    if (rm.isNewBest) this.label(ctx, '★ NEW PERSONAL BEST ★', 640, 248, 22, '#facc15');
    this.panel(ctx, 420, 275, 440, 250, '#6d5bd0');
    this.label(ctx, 'RUN STATISTICS', 640, 308, 20, '#38bdf8', 'center', this.fontB);
    const rows = [
      ['Highest Ante Reached', rm.ante],
      ['Best Single Hand', s.bestHandScore.toLocaleString()],
      ['Hands Played', s.handsPlayed],
      ['Memes Activated', s.memesTriggered],
      ['Cash Earned', `$${s.moneyEarned}`]
    ];
    rows.forEach((row, i) => {
      this.label(ctx, row[0], 460, 348 + i * 34, 16, '#cbd5e1', 'left', this.fontB);
      this.label(ctx, String(row[1]), 820, 348 + i * 34, 18, '#ffffff', 'right', this.fontB);
    });
  }

  renderGameOver(ctx, mouse) {
    this.clearButtons();
    this.renderEndScreen(ctx, mouse, 'GAME OVER', '#ef4444', 'YOU RAN OUT OF PLAYS! MUCH SAD, VERY LOSS.');
    this.addButton('RETRY', 640, 600, 240, 55, 'MAIN MENU 🍌', () => {
      this.engine.stateManager.setState(GameState.MAIN_MENU);
    }, '#facc15');
    this.buttons.forEach(btn => this.renderButton(ctx, btn, mouse));
  }

  renderVictory(ctx, mouse) {
    this.clearButtons();
    this.renderEndScreen(ctx, mouse, '🍌 YOU WIN 🍌', '#facc15', 'ANTE 8 CRUSHED. YOU ARE THE ULTIMATE MEME LORD.');
    this.addButton('ENDLESS', 520, 600, 230, 55, 'ENDLESS MODE ♾️', () => {
      this.runManager.endless = true;
      this.shopManager.startShop();
      this.engine.stateManager.setState(GameState.MEME_SHOP);
    }, '#a855f7');
    this.addButton('MENU', 770, 600, 230, 55, 'MAIN MENU 🍌', () => {
      this.engine.stateManager.setState(GameState.MAIN_MENU);
    }, '#facc15');
    this.buttons.forEach(btn => this.renderButton(ctx, btn, mouse));
  }
}

window.UIRenderer = UIRenderer;
