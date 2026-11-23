// Ember Pact — game state and turn rules.
// Both sides start at 30 life. A turn: gain +2 ember (max 10), draw a card,
// then the player takes ONE action — play a card, Focus (discard a card for
// +2 ember), or pass — and the Warden answers with its telegraphed intent card.
// Chain: playing the same element on consecutive player turns adds +2 damage
// per chain step. Advantage over the other side's element adds +2 damage.

import { buildDeck, hasAdvantage } from './cards.js';
import { chooseIntent } from './ai.js';

export const MAX_LIFE = 30;
export const MAX_EMBER = 10;
export const HAND_LIMIT = 7;
export const START_HAND = 4;

/** A fresh game: decks, hands, life, ember, chain, log, and the Warden's intent. */
export function createGame() {
  const state = {
    turn: 1,
    phase: 'title', // title | player | warden | won | lost
    player: { life: MAX_LIFE, ember: 3, deck: buildDeck(), hand: [], lastElement: null, chain: 0 },
    warden: { life: MAX_LIFE, ember: 3, deck: buildDeck(), hand: [], lastElement: null },
    intent: null, // the card the Warden is about to play, chosen at turn start
    focusMode: false,
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0 },
  };
  drawCards(state.player, START_HAND);
  drawCards(state.warden, START_HAND);
  return state;
}

/** Draw n cards from a side's deck into its hand (up to the hand limit). */
export function drawCards(side, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= HAND_LIMIT) break;
    const card = side.deck.pop();
    if (!card) break;
    side.hand.push(card);
  }
}

function log(state, text) {
  state.log.unshift(text);
  if (state.log.length > 6) state.log.length = 6;
}

/** Begin the player's turn: +2 ember, draw one, and the Warden picks its intent. */
export function startPlayerTurn(state) {
  state.phase = 'player';
  state.focusMode = false;
  state.player.ember = Math.min(MAX_EMBER, state.player.ember + 2);
  drawCards(state.player, 1);
  state.intent = chooseIntent(state);
  log(state, `Turn ${state.turn} — you gain 2 ember and draw a card.`);
}

/** Damage a played card deals, with advantage and chain bonuses applied. */
export function playerDamage(state, card) {
  let damage = card.damage;
  let bonus = 0;
  if (state.intent && hasAdvantage(card.element, state.intent.element)) bonus += 2;
  if (state.player.lastElement === card.element) bonus += (state.player.chain - 1) * 2;
  return { damage: damage + bonus, bonus };
}

/** The player plays the card at hand index `i`. Returns a result object for the UI. */
export function playCard(state, i) {
  if (state.phase !== 'player') return { ok: false, reason: 'not your turn' };
  const card = state.player.hand[i];
  if (!card) return { ok: false, reason: 'no such card' };
  if (card.cost > state.player.ember) return { ok: false, reason: 'not enough ember' };
  state.player.hand.splice(i, 1);
  state.player.ember -= card.cost;
  // Chain: same element as last turn's card extends the chain, else it restarts.
  if (state.player.lastElement === card.element) state.player.chain += 1;
  else state.player.chain = 1;
  state.player.lastElement = card.element;
  const { damage, bonus } = playerDamage(state, card);
  state.warden.life = Math.max(0, state.warden.life - damage);
  state.stats.damageDealt += damage;
  state.stats.cardsPlayed += 1;
  log(state, `You play ${card.name} — ${damage} damage${bonus > 0 ? ` (+${bonus} bonus)` : ''}.`);
  const won = state.warden.life <= 0;
  if (won) {
    state.phase = 'won';
    log(state, 'The Warden falls. The Pact is yours.');
    return { ok: true, card, damage, bonus, won: true };
  }
  return { ok: true, card, damage, bonus, won: false };
}

/** Focus: discard the card at hand index `i` to gain +2 ember, then the turn ends. */
export function focusDiscard(state, i) {
  if (state.phase !== 'player') return { ok: false, reason: 'not your turn' };
  const card = state.player.hand[i];
  if (!card) return { ok: false, reason: 'no such card' };
  state.player.hand.splice(i, 1);
  state.player.ember = Math.min(MAX_EMBER, state.player.ember + 2);
  state.player.chain = 0;
  state.player.lastElement = null;
  state.focusMode = false;
  log(state, `Focus — you burn ${card.name} for +2 ember.`);
  return { ok: true, card };
}

/** Pass without playing: the chain breaks, then the Warden answers. */
export function passTurn(state) {
  if (state.phase !== 'player') return { ok: false };
  state.player.chain = 0;
  state.player.lastElement = null;
  log(state, 'You hold your cards and pass.');
  return { ok: true };
}

/** The Warden plays its telegraphed intent card at the player. */
export function wardenTurn(state) {
  state.phase = 'warden';
  const card = state.intent;
  if (!card) {
    log(state, 'The Warden has no ember to spare and holds back.');
    state.turn += 1;
    state.warden.ember = Math.min(MAX_EMBER, state.warden.ember + 2);
    drawCards(state.warden, 1);
    startPlayerTurn(state);
    return { ok: true, card: null, damage: 0, bonus: 0, lost: false };
  }
  const idx = state.warden.hand.findIndex((c) => c.uid === card.uid);
  if (idx >= 0) state.warden.hand.splice(idx, 1);
  state.warden.ember = Math.max(0, state.warden.ember - card.cost);
  let damage = card.damage;
  let bonus = 0;
  if (state.player.lastElement && hasAdvantage(card.element, state.player.lastElement)) bonus += 2;
  damage += bonus;
  state.player.life = Math.max(0, state.player.life - damage);
  state.stats.damageTaken += damage;
  log(state, `Warden plays ${card.name} — ${damage} damage to you${bonus > 0 ? ` (+${bonus} advantage)` : ''}.`);
  const lost = state.player.life <= 0;
  if (lost) {
    state.phase = 'lost';
    log(state, 'Your ember gutters out. The Warden keeps the Pact.');
    return { ok: true, card, damage, bonus, lost: true };
  }
  // Next turn: Warden gains ember, draws, and the player goes again.
  state.turn += 1;
  state.warden.ember = Math.min(MAX_EMBER, state.warden.ember + 2);
  drawCards(state.warden, 1);
  startPlayerTurn(state);
  return { ok: true, card, damage, bonus, lost: false };
}
