/**
 * ShopManager.js - Manages Shop inventory, items, booster packs, hand upgrades, and purchases.
 */

class ShopManager {
  constructor(runManager, modifierEngine) {
    this.runManager = runManager;
    this.modifierEngine = modifierEngine;
    this.items = [];
    this.rerollCost = 2;
    this.boughtSomething = false;
  }

  startShop() {
    this.rerollCost = 2;
    this.boughtSomething = false;
    this.generateShop();
  }

  generateShop() {
    this.items = [];

    // 1. Meme Cards for Sale (2 slots)
    const memeOffers = this.modifierEngine.getRandomShopMemes(2);
    memeOffers.forEach(m => {
      this.items.push({
        type: 'MEME_CARD',
        id: m.id,
        name: m.name,
        icon: m.icon,
        description: m.description,
        cost: m.cost,
        rarity: m.rarity,
        color: m.color,
        soldOut: false
      });
    });

    // 2. Hand Upgrades for Sale (1 slot)
    const handKeys = Object.keys(HAND_TYPES).filter(k => k !== 'FIVE_OF_A_KIND');
    const randomHandKey = handKeys[Math.floor(Math.random() * handKeys.length)];
    const handInfo = HAND_TYPES[randomHandKey];

    this.items.push({
      type: 'HAND_UPGRADE',
      handTypeKey: randomHandKey,
      name: `${handInfo.name} Upgrade`,
      icon: '📊',
      description: `Lv ${this.runManager.handLevels[randomHandKey].level} → ${this.runManager.handLevels[randomHandKey].level + 1}: +15 Chips & +2 Mult permanently.`,
      cost: 4,
      color: '#38bdf8',
      soldOut: false
    });

    // 3. Booster Pack (1 slot)
    this.items.push({
      type: 'BOOSTER_PACK',
      name: 'Meme Booster Pack',
      icon: '📦',
      description: 'Adds 3 extra high-value cards (Aces/Kings) into your deck.',
      cost: 5,
      color: '#a855f7',
      soldOut: false
    });
  }

  buyItem(index, deck) {
    if (index < 0 || index >= this.items.length) return false;
    const item = this.items[index];
    if (item.soldOut) return false;

    if (this.runManager.money < item.cost) {
      return false; // Not enough money
    }

    if (item.type === 'MEME_CARD') {
      if (this.modifierEngine.memeSlots.length >= this.modifierEngine.maxSlots) {
        return false; // Slots full
      }
      const added = this.modifierEngine.addMeme(item.id);
      if (!added) return false;
    } else if (item.type === 'HAND_UPGRADE') {
      this.runManager.upgradeHand(item.handTypeKey);
    } else if (item.type === 'BOOSTER_PACK') {
      // Add extra high cards to deck with guaranteed unique IDs
      const uid = Math.random().toString(36).substring(2, 9);
      const newCard1 = new Card(RANKS[12], SUITS.SPADES, `boost_${Date.now()}_${uid}_1`);
      const newCard2 = new Card(RANKS[11], SUITS.HEARTS, `boost_${Date.now()}_${uid}_2`);
      const newCard3 = new Card(RANKS[12], SUITS.DIAMONDS, `boost_${Date.now()}_${uid}_3`);
      deck.cards.push(newCard1, newCard2, newCard3);
    }

    this.runManager.money -= item.cost;
    item.soldOut = true;
    this.boughtSomething = true;

    if (window.soundController) window.soundController.playCash();
    return true;
  }

  reroll(deck) {
    if (this.runManager.money < this.rerollCost) return false;
    this.runManager.money -= this.rerollCost;
    this.generateShop();
    this.rerollCost++;
    if (window.soundController) window.soundController.playCash();
    return true;
  }

  skipShop() {
    // Diamond Hands streak: only counts blinds where nothing was bought
    if (this.boughtSomething) this.runManager.shopSkippedConsecutive = 0;
    else this.runManager.shopSkippedConsecutive++;
    if (window.soundController) window.soundController.playSelect();
  }
}

window.ShopManager = ShopManager;
