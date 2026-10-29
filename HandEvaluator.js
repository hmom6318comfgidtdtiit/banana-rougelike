/**
 * HandEvaluator.js - Evaluates played cards into poker hand ranks with base Chips and Mult.
 */

const HAND_TYPES = {
  HIGH_CARD: { name: 'High Card', chips: 5, mult: 1, level: 1 },
  PAIR: { name: 'Pair', chips: 10, mult: 2, level: 1 },
  TWO_PAIR: { name: 'Two Pair', chips: 20, mult: 2, level: 1 },
  THREE_OF_A_KIND: { name: 'Three of a Kind', chips: 30, mult: 3, level: 1 },
  STRAIGHT: { name: 'Straight', chips: 30, mult: 4, level: 1 },
  FLUSH: { name: 'Flush', chips: 35, mult: 4, level: 1 },
  FULL_HOUSE: { name: 'Full House', chips: 40, mult: 4, level: 1 },
  FOUR_OF_A_KIND: { name: 'Four of a Kind', chips: 60, mult: 7, level: 1 },
  STRAIGHT_FLUSH: { name: 'Straight Flush', chips: 100, mult: 8, level: 1 },
  FIVE_OF_A_KIND: { name: 'Five of a Kind', chips: 120, mult: 12, level: 1 }
};

class HandEvaluator {
  static evaluate(cards, handLevels = {}) {
    if (!cards || cards.length === 0) {
      return { type: HAND_TYPES.HIGH_CARD, scoringCards: [], baseChips: 0, baseMult: 0 };
    }

    // Sort by rank descending
    const sorted = [...cards].sort((a, b) => b.rank.value - a.rank.value);

    // Group by rank and suit
    const rankCounts = {};
    const suitCounts = {};

    sorted.forEach(c => {
      rankCounts[c.rank.value] = (rankCounts[c.rank.value] || 0) + 1;
      suitCounts[c.suit.name] = (suitCounts[c.suit.name] || 0) + 1;
    });

    const isFlush = Object.values(suitCounts).some(count => count >= 5) || (sorted.length === 5 && Object.keys(suitCounts).length === 1);

    // Straight detection
    const uniqueRanks = [...new Set(sorted.map(c => c.rank.value))].sort((a, b) => b - a);
    let isStraight = false;
    if (uniqueRanks.length >= 5) {
      for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
          isStraight = true;
          break;
        }
      }
      // Ace low straight (A-2-3-4-5)
      if (!isStraight && uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
        isStraight = true;
      }
    }

    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    let handTypeKey = 'HIGH_CARD';

    if (counts[0] === 5) handTypeKey = 'FIVE_OF_A_KIND';
    else if (isStraight && isFlush) handTypeKey = 'STRAIGHT_FLUSH';
    else if (counts[0] === 4) handTypeKey = 'FOUR_OF_A_KIND';
    else if (counts[0] === 3 && counts[1] >= 2) handTypeKey = 'FULL_HOUSE';
    else if (isFlush) handTypeKey = 'FLUSH';
    else if (isStraight) handTypeKey = 'STRAIGHT';
    else if (counts[0] === 3) handTypeKey = 'THREE_OF_A_KIND';
    else if (counts[0] === 2 && counts[1] === 2) handTypeKey = 'TWO_PAIR';
    else if (counts[0] === 2) handTypeKey = 'PAIR';

    const baseHand = HAND_TYPES[handTypeKey];
    const lvlInfo = handLevels[handTypeKey] || { level: 1, extraChips: 0, extraMult: 0 };

    const totalBaseChips = baseHand.chips + lvlInfo.extraChips;
    const totalBaseMult = baseHand.mult + lvlInfo.extraMult;

    return {
      typeKey: handTypeKey,
      handType: baseHand,
      level: lvlInfo.level,
      baseChips: totalBaseChips,
      baseMult: totalBaseMult,
      scoringCards: sorted
    };
  }
}

window.HAND_TYPES = HAND_TYPES;
window.HandEvaluator = HandEvaluator;
