/**
 * RunManager.js - Tracks Ante, Blind progression, plays, discards, and money.
 */
class RunManager {
  constructor() {
    this.ante = 1;
    this.round = 1; // 1: Small Blind, 2: Big Blind, 3: Boss Blind
    this.targetScore = 300;
    this.currentScore = 0;
    
    this.handsRemaining = 4;
    this.discardsRemaining = 3;
    this.maxHands = 4;
    this.maxDiscards = 3;

    this.money = 10;
    this.endless = false;
    this.isNewBest = false;
    this.lastReward = null;
    this.shopSkippedConsecutive = 0;

    // Hand upgrades purchased from Shop
    this.handLevels = {};
    Object.keys(HAND_TYPES).forEach(key => {
      this.handLevels[key] = { level: 1, extraChips: 0, extraMult: 0 };
    });

    this.stats = {
      totalScore: 0,
      bestHandScore: 0,
      handsPlayed: 0,
      memesTriggered: 0,
      moneyEarned: 10
    };

    this.updateTargetScore();
  }

  updateTargetScore() {
    // Escalating Target Scores per Ante
    const baseAnteScores = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
    const anteIdx = Math.min(this.ante - 1, baseAnteScores.length - 1);
    let base = baseAnteScores[anteIdx];

    if (this.ante > 8) {
      base = 50000 * Math.pow(2, this.ante - 8);
    }

    if (this.round === 1) this.targetScore = Math.floor(base * 1.0);
    else if (this.round === 2) this.targetScore = Math.floor(base * 1.5);
    else if (this.round === 3) this.targetScore = Math.floor(base * 2.2);
  }

  getBlindReward() {
    return [3, 4, 5][this.round - 1] || 5;
  }

  // $1 per $5 held, capped at $5 (Balatro-style interest: rewards saving)
  getInterest() {
    return Math.min(5, Math.floor(Math.max(0, this.money) / 5));
  }

  static loadBest() {
    try { return JSON.parse(localStorage.getItem('banana_best')); } catch (e) { return null; }
  }

  // Returns true when this run beat the stored record.
  static saveBest(run) {
    try {
      const prev = RunManager.loadBest();
      const cur = { ante: run.ante, bestHand: run.stats.bestHandScore };
      const better = !prev || cur.ante > prev.ante || (cur.ante === prev.ante && cur.bestHand > prev.bestHand);
      if (better) localStorage.setItem('banana_best', JSON.stringify(cur));
      return better && !!prev;
    } catch (e) { return false; }
  }

  nextRound() {
    this.round++;
    if (this.round > 3) {
      this.round = 1;
      this.ante++;
    }
    this.currentScore = 0;
    this.handsRemaining = this.maxHands;
    this.discardsRemaining = this.maxDiscards;
    this.updateTargetScore();
  }

  upgradeHand(typeKey) {
    if (!this.handLevels[typeKey]) return;
    this.handLevels[typeKey].level++;
    this.handLevels[typeKey].extraChips += 15;
    this.handLevels[typeKey].extraMult += 2;
  }
}

window.RunManager = RunManager;
