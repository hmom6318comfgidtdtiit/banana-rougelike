/**
 * game.js - BANANA Game Assembly, Main State Controller, and Loop Initialization
 */

class Game {
  constructor() {
    this.engine = new Engine('game-canvas');
    this.runManager = new RunManager();
    this.deck = new Deck();
    this.modifierEngine = new ModifierEngine();
    this.particleSystem = new ParticleSystem();
    this.shopManager = new ShopManager(this.runManager, this.modifierEngine);

    this.uiRenderer = new UIRenderer(
      this.engine,
      this.runManager,
      this.deck,
      this.modifierEngine,
      this.shopManager,
      this.particleSystem
    );

    this.scoringState = { active: false };
    this.pending = null; // delayed state transition { timer, fn }

    this.init();
  }

  init() {
    window.gameInstance = this;
    if (document.fonts) {
      document.fonts.load('900 20px "Fredoka One"');
      document.fonts.load('900 20px Outfit');
    }

    this.engine.canvas.addEventListener('click', () => {
      if (this.engine.mouse) this.uiRenderer.handleMouseClick(this.engine.mouse);
    });

    // UIRenderer/RunManager get replaced on START RUN; keep every system pointed at the live one.
    this.engine.stateManager.onChange((state) => {
      if (state === GameState.ACTIVE_ROUND || state === GameState.MEME_SHOP) {
        this.runManager = this.uiRenderer.runManager;
        this.shopManager.runManager = this.runManager;
        if (state === GameState.ACTIVE_ROUND && this.runManager.ante === 1 && this.runManager.round === 1 && this.runManager.currentScore === 0) {
          this.scoringState = { active: false };
          this.pending = null;
        }
      }
    });

    this.engine.start(
      (dt) => this.update(dt),
      (ctx) => this.render(ctx)
    );
  }

  triggerPlayHand() {
    if (this.scoringState.active || this.pending) return;
    const rm = this.runManager;
    const played = this.deck.playSelectedHand();
    if (played.length === 0) return;

    rm.handsRemaining--;
    rm.stats.handsPlayed++;
    if (window.soundController) window.soundController.playPlayHand();

    const evalResult = HandEvaluator.evaluate(played, rm.handLevels);
    this.scoringState = {
      active: true,
      phase: 'cards',   // cards -> memes -> tally
      timer: 0.45,
      idx: 0,
      memeIdx: 0,
      chips: evalResult.baseChips,
      mult: evalResult.baseMult,
      scoreToAdd: 0,
      playedCards: played,
      evalResult
    };
  }

  updateScoring(dt) {
    const s = this.scoringState;
    s.timer -= dt;
    if (s.timer > 0) return;
    const sound = window.soundController;

    if (s.phase === 'cards') {
      if (s.idx < s.playedCards.length) {
        const c = s.playedCards[s.idx++];
        s.chips += c.chips;
        c.scale = 1.4;
        this.particleSystem.spawnSparks(c.x, c.y - 40, '#38bdf8', 10);
        this.particleSystem.spawnJuiceText(c.x, c.y - 90, `+${c.chips}`, '#38bdf8', 26);
        if (sound) sound.playChip();
        s.timer = 0.28;
      } else {
        s.phase = 'memes';
        s.timer = 0.2;
      }

    } else if (s.phase === 'memes') {
      const memes = this.modifierEngine.memeSlots;
      if (s.memeIdx < memes.length) {
        const context = {
          chips: s.chips,
          mult: s.mult,
          playedCards: s.playedCards,
          evalResult: s.evalResult,
          runManager: this.runManager
        };
        const res = this.modifierEngine.triggerOne(memes[s.memeIdx++], context, this.particleSystem, sound);
        s.chips = context.chips;
        s.mult = context.mult;
        if (res) this.runManager.stats.memesTriggered++;
        s.timer = res ? 0.5 : 0.02;
      } else {
        s.scoreToAdd = Math.floor(s.chips * s.mult);
        this.engine.triggerShake(Math.min(Math.max(s.scoreToAdd / 100, 5), 30));
        this.particleSystem.spawnJuiceText(640, 300, `+${s.scoreToAdd.toLocaleString()}`, '#facc15', 44);
        this.particleSystem.spawnConfetti(640, 320, Math.min(60, 10 + Math.floor(s.scoreToAdd / 200)));
        s.phase = 'tally';
        s.timer = 0.9;
      }

    } else if (s.phase === 'tally') {
      s.active = false;
      this.finishHand(s);
    }
  }

  finishHand(s) {
    const rm = this.runManager;
    rm.currentScore += s.scoreToAdd;
    rm.stats.totalScore += s.scoreToAdd;
    if (s.scoreToAdd > rm.stats.bestHandScore) rm.stats.bestHandScore = s.scoreToAdd;

    if (rm.currentScore >= rm.targetScore) {
      this.particleSystem.spawnConfetti(640, 360, 80);
      if (window.soundController) window.soundController.playWin();

      const blind = rm.getBlindReward();
      const hands = rm.handsRemaining;
      const interest = rm.getInterest();
      const total = blind + hands + interest;
      rm.lastReward = { blind, hands, interest, total };
      rm.money += total;
      rm.stats.moneyEarned += total;

      const wonRun = rm.ante === 8 && rm.round === 3 && !rm.endless;
      if (wonRun) rm.isNewBest = RunManager.saveBest(rm);
      this.pending = {
        timer: 1.2,
        fn: () => {
          if (wonRun) {
            this.engine.stateManager.setState(GameState.VICTORY);
          } else {
            this.shopManager.startShop();
            this.engine.stateManager.setState(GameState.MEME_SHOP);
          }
        }
      };

    } else if (rm.handsRemaining <= 0) {
      rm.isNewBest = RunManager.saveBest(rm);
      if (window.soundController) window.soundController.playGameOver();
      this.pending = {
        timer: 0.8,
        fn: () => this.engine.stateManager.setState(GameState.GAME_OVER)
      };

    } else {
      this.deck.discardPlayedCards();
    }
  }

  update(dt) {
    const currentState = this.engine.stateManager.getState();
    const mouse = this.engine.mouse;

    this.particleSystem.update(dt);
    this.modifierEngine.update(dt, mouse);

    if (this.pending) {
      this.pending.timer -= dt;
      if (this.pending.timer <= 0) {
        const fn = this.pending.fn;
        this.pending = null;
        fn();
      }
    }

    if (currentState === GameState.ACTIVE_ROUND) {
      // A click on a UI button must never also toggle a card sitting underneath it.
      const clicked = mouse.clicked;
      if (this.uiRenderer.isOverButton(mouse) || this.scoringState.active || this.pending) mouse.clicked = false;
      this.deck.update(dt, mouse);
      mouse.clicked = clicked;

      if (this.scoringState.active) this.updateScoring(dt);
    }
  }

  render(ctx) {
    const currentState = this.engine.stateManager.getState();
    const mouse = this.engine.mouse;

    if (currentState === GameState.MAIN_MENU) {
      this.uiRenderer.renderMainMenu(ctx, mouse);

    } else if (currentState === GameState.ACTIVE_ROUND) {
      this.deck.render(ctx);
      this.uiRenderer.renderActiveRound(ctx, mouse, this.scoringState);

    } else if (currentState === GameState.MEME_SHOP) {
      this.modifierEngine.render(ctx);
      this.uiRenderer.renderMemeShop(ctx, mouse);

    } else if (currentState === GameState.GAME_OVER) {
      this.uiRenderer.renderGameOver(ctx, mouse);

    } else if (currentState === GameState.VICTORY) {
      this.uiRenderer.renderVictory(ctx, mouse);
    }

    this.particleSystem.render(ctx);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
