// Ember Pact — rendering: turns the game state into the table on screen.
// Cards show their element by colour AND shape (an SVG mark), with big readable
// cost and damage numbers. The intent banner, chain meter, life bars, ember
// pools and the turn log are all drawn here.

import { ELEMENTS, counterOf } from './cards.js';

/** The SVG shape mark for an element (triangle, droplet, leaf, square). */
export function elementMark(element, size = 34) {
  const el = ELEMENTS[element];
  const s = size;
  if (element === 'flame') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-label="Flame"><polygon points="20,4 36,34 4,34" fill="${el.color}" stroke="#fff" stroke-width="2"/></svg>`;
  }
  if (element === 'tide') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-label="Tide"><path d="M20 3 C26 14 34 20 34 28 A14 14 0 1 1 6 28 C6 20 14 14 20 3 Z" fill="${el.color}" stroke="#fff" stroke-width="2"/></svg>`;
  }
  if (element === 'leaf') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-label="Leaf"><path d="M20 3 C34 8 37 24 20 37 C3 24 6 8 20 3 Z" fill="${el.color}" stroke="#fff" stroke-width="2"/><line x1="20" y1="8" x2="20" y2="33" stroke="#fff" stroke-width="2"/></svg>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-label="Stone"><rect x="6" y="6" width="28" height="28" rx="5" fill="${el.color}" stroke="#fff" stroke-width="2"/></svg>`;
}

/** One card's HTML. `opts` marks affordability, focus mode and playability. */
export function cardHtml(card, opts = {}) {
  const el = ELEMENTS[card.element];
  const counter = counterOf(card.element);
  const counterEl = ELEMENTS[counter];
  const classes = ['card', `el-${card.element}`];
  if (opts.affordable === false) classes.push('cant-afford');
  if (opts.focusMode) classes.push('focusable');
  if (opts.dealt) classes.push('dealt');
  return `<button type="button" class="${classes.join(' ')}" data-uid="${card.uid}" style="--el:${el.color};--eld:${el.dark}">
    <span class="card-cost" title="Ember cost">◆ ${card.cost}</span>
    <span class="card-mark">${elementMark(card.element, 38)}</span>
    <span class="card-name">${card.name}</span>
    <span class="card-el">${el.name} ${el.glyph}</span>
    <span class="card-dmg">${card.damage}</span>
    <span class="card-dmg-label">damage</span>
    <span class="card-beats">beats ${counterEl.name} ${counterEl.glyph}</span>
    <span class="card-text">${card.text}</span>
  </button>`;
}

/** A face-down card back (the Warden's hidden hand). */
export function cardBackHtml() {
  return `<div class="card card-back"><span class="back-mark">🔥</span><span class="back-word">EMBER<br>PACT</span></div>`;
}

/** Fill a life bar element (width + number). */
function setLife(el, life, max) {
  const bar = el.querySelector('.life-fill');
  const num = el.querySelector('.life-num');
  if (bar) bar.style.width = `${Math.max(0, (life / max) * 100)}%`;
  if (num) num.textContent = `${life} / ${max}`;
}

/** Fill an ember pool element (pips + number). */
function setEmber(el, ember, max) {
  const pips = el.querySelector('.ember-pips');
  const num = el.querySelector('.ember-num');
  if (pips) {
    pips.innerHTML = Array.from({ length: max }, (_, i) =>
      `<span class="pip${i < ember ? ' on' : ''}">◆</span>`).join('');
  }
  if (num) num.textContent = `${ember}`;
}

/** Render the whole table from the state. `ui` holds the cached DOM nodes. */
export function render(state, ui) {
  setLife(ui.wardenLife, state.warden.life, 30);
  setLife(ui.playerLife, state.player.life, 30);
  setEmber(ui.wardenEmber, state.warden.ember, 10);
  setEmber(ui.playerEmber, state.player.ember, 10);

  // Warden's hand: face-down backs, one per card.
  ui.wardenHand.innerHTML = state.warden.hand.map(() => cardBackHtml()).join('');
  ui.wardenCount.textContent = `${state.warden.hand.length} cards`;

  // Intent banner: what the Warden is about to play.
  const intent = state.intent;
  if (intent) {
    const el = ELEMENTS[intent.element];
    ui.intent.innerHTML = `<span class="intent-label">WARDEN'S INTENT</span>
      <span class="intent-mark">${elementMark(intent.element, 30)}</span>
      <span class="intent-text">${el.name} — <b>${intent.name}</b> · ${intent.damage} damage · costs ${intent.cost} ◆</span>
      <span class="intent-hint">Counter it with ${ELEMENTS[counterOf(intent.element)].name} ${ELEMENTS[counterOf(intent.element)].glyph}</span>`;
    ui.intent.style.setProperty('--el', el.color);
    ui.intent.classList.remove('hidden');
  } else {
    ui.intent.classList.add('hidden');
  }

  // Chain meter.
  if (state.player.chain >= 2) {
    const el = ELEMENTS[state.player.lastElement];
    ui.chain.innerHTML = `<span class="chain-label">CHAIN ×${state.player.chain}</span>
      <span class="chain-mark">${elementMark(state.player.lastElement, 26)}</span>
      <span class="chain-text">${el.name} streak — +${(state.player.chain - 1) * 2} damage</span>`;
    ui.chain.classList.remove('hidden');
  } else {
    ui.chain.classList.add('hidden');
  }

  // Player's hand.
  ui.hand.innerHTML = state.player.hand.map((card) =>
    cardHtml(card, { affordable: card.cost <= state.player.ember, focusMode: state.focusMode, dealt: true })).join('');
  ui.handCount.textContent = `${state.player.hand.length} cards · deck ${state.player.deck.length}`;

  // Focus button state.
  ui.focusBtn.classList.toggle('armed', state.focusMode);
  ui.focusBtn.textContent = state.focusMode ? 'Focus: pick a card to burn…' : '🔥 Focus — burn a card for +2 ◆';
  ui.focusBtn.disabled = state.phase !== 'player' || state.player.hand.length === 0;
  ui.passBtn.disabled = state.phase !== 'player';

  // Turn log.
  ui.log.innerHTML = state.log.map((line) => `<li>${line}</li>`).join('');
  ui.turnLabel.textContent = `Turn ${state.turn}`;

  // Screens.
  ui.titleScreen.classList.toggle('hidden', state.phase !== 'title');
  ui.tableScreen.classList.toggle('hidden', state.phase === 'title' || state.phase === 'won' || state.phase === 'lost');
  ui.winScreen.classList.toggle('hidden', state.phase !== 'won');
  ui.lossScreen.classList.toggle('hidden', state.phase !== 'lost');
  if (state.phase === 'won') {
    ui.winStats.textContent = `You won in ${state.turn} turns — ${state.stats.damageDealt} damage dealt, ${state.stats.cardsPlayed} cards played.`;
  }
  if (state.phase === 'lost') {
    ui.lossStats.textContent = `The Warden wins on turn ${state.turn} — you dealt ${state.stats.damageDealt} damage.`;
  }
}
