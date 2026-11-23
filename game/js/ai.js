// Ember Pact — the Warden, the AI opponent.
// The Warden is honest: it picks its next card at the start of the player's
// turn and shows it as its intent, so the player can read it and counter with
// the advantaged element. It favours the hardest affordable hit, and prefers
// a card whose element beats the player's last played element.

import { ELEMENTS, hasAdvantage } from './cards.js';

/** Pick the Warden's next card from its hand. Returns the card (its intent). */
export function chooseIntent(state) {
  const warden = state.warden;
  const affordable = warden.hand.filter((c) => c.cost <= warden.ember);
  if (affordable.length === 0) return null;
  const scored = affordable.map((card) => {
    let score = card.damage;
    if (state.player.lastElement && hasAdvantage(card.element, state.player.lastElement)) score += 3;
    if (card.cost <= 2) score += 0.5; // cheap pressure is worth a little extra
    return { card, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].card;
}

/** A short readable line for the intent banner. */
export function intentLabel(card) {
  if (!card) return 'The Warden holds back…';
  const el = ELEMENTS[card.element];
  return `Warden channels ${el.name} ${el.glyph} — ${card.name} (${card.damage} damage)`;
}
