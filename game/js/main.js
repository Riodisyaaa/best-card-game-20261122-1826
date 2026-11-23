// Ember Pact — wiring: starts the game, handles clicks and keys, drives turns.
// URL scenes (for screenshots and quick looks): ?scene=title (default),
// ?scene=table (a mid-duel table), ?scene=win, ?scene=loss.
// ?autotest=1 plays one full turn headlessly and reports the result in
// #test-result, so the game can be verified without a mouse.

import { ELEMENTS, CARD_POOL } from './cards.js';
import { createGame, startPlayerTurn, playCard, focusDiscard, passTurn, wardenTurn } from './state.js';
import { render } from './render.js';
import { floatDamage, shakeTable, emberBurst, dealIn } from './effects.js';

const $ = (id) => document.getElementById(id);

function collectUi() {
  return {
    titleScreen: $('title-screen'),
    tableScreen: $('table-screen'),
    winScreen: $('win-screen'),
    lossScreen: $('loss-screen'),
    wardenLife: $('warden-life'),
    playerLife: $('player-life'),
    wardenEmber: $('warden-ember'),
    playerEmber: $('player-ember'),
    wardenHand: $('warden-hand'),
    wardenCount: $('warden-count'),
    hand: $('hand'),
    handCount: $('hand-count'),
    intent: $('intent'),
    chain: $('chain'),
    log: $('log'),
    turnLabel: $('turn-label'),
    focusBtn: $('focus-btn'),
    passBtn: $('pass-btn'),
    winStats: $('win-stats'),
    lossStats: $('loss-stats'),
  };
}

let state = createGame();
let ui = collectUi();

/** After the Warden answers, show its damage and move on. */
function runWardenAnswer() {
  const result = wardenTurn(state);
  render(state, ui);
  if (result.card) {
    floatDamage(ui.playerLife, `-${result.damage}`, 'hurt');
    if (result.damage >= 6) shakeTable();
  }
  if (result.lost) {
    setTimeout(() => emberBurst($('loss-screen')), 300);
  }
  if (state.phase === 'player') render(state, ui);
}

/** The player clicked a hand card. */
function onCardClick(uid) {
  if (state.phase !== 'player') return;
  const idx = state.player.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return;
  if (state.focusMode) {
    const result = focusDiscard(state, idx);
    if (!result.ok) return;
    render(state, ui);
    setTimeout(runWardenAnswer, 450);
    return;
  }
  const result = playCard(state, idx);
  if (!result.ok) {
    const el = document.querySelector(`[data-uid="${uid}"]`);
    if (el) {
      el.classList.remove('denied');
      void el.offsetWidth;
      el.classList.add('denied');
    }
    return;
  }
  floatDamage(ui.wardenLife, `-${result.damage}`, result.bonus > 0 ? 'bonus' : 'hurt');
  if (result.damage >= 6) shakeTable();
  render(state, ui);
  if (result.won) {
    setTimeout(() => emberBurst($('win-screen')), 300);
    return;
  }
  setTimeout(runWardenAnswer, 650);
}

/** Wire clicks and keys once. */
function wire() {
  ui.hand.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-uid]');
    if (btn) onCardClick(btn.dataset.uid);
  });
  ui.focusBtn.addEventListener('click', () => {
    if (state.phase !== 'player') return;
    state.focusMode = !state.focusMode;
    render(state, ui);
  });
  ui.passBtn.addEventListener('click', () => {
    if (state.phase !== 'player') return;
    passTurn(state);
    render(state, ui);
    setTimeout(runWardenAnswer, 450);
  });
  $('play-btn').addEventListener('click', startDuel);
  $('again-win').addEventListener('click', startDuel);
  $('again-loss').addEventListener('click', startDuel);
  document.addEventListener('keydown', (e) => {
    if (state.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startDuel(); return; }
    if ((state.phase === 'won' || state.phase === 'lost') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startDuel(); return; }
    if (state.phase !== 'player') return;
    if (e.key >= '1' && e.key <= '7') {
      const idx = Number(e.key) - 1;
      const card = state.player.hand[idx];
      if (card) onCardClick(card.uid);
    } else if (e.key === 'f' || e.key === 'F') {
      state.focusMode = !state.focusMode;
      render(state, ui);
    } else if (e.key === 'Escape') {
      state.focusMode = false;
      render(state, ui);
    }
  });
}

/** Start a fresh duel from the title screen. */
function startDuel() {
  state = createGame();
  ui = collectUi();
  startPlayerTurn(state);
  render(state, ui);
  document.querySelectorAll('#hand .card').forEach((el, i) => dealIn(el, i * 90));
}

/** Seed a mid-duel table for the ?scene=table screenshot. */
function seedTableScene() {
  state = createGame();
  startPlayerTurn(state);
  // Play out a believable opening: player 24 life, Warden 17, chain x2 on Flame.
  state.player.life = 24;
  state.warden.life = 17;
  state.player.ember = 5;
  state.warden.ember = 4;
  state.turn = 4;
  state.player.chain = 2;
  state.player.lastElement = 'flame';
  state.player.hand = [
    { ...CARD_POOL[2], uid: 's1' }, // Pyre Burst
    { ...CARD_POOL[7], uid: 's2' }, // Deep Current
    { ...CARD_POOL[12], uid: 's3' }, // Grove Bloom
    { ...CARD_POOL[17], uid: 's4' }, // Quake
    { ...CARD_POOL[1], uid: 's5' }, // Flame Lash
  ];
  state.warden.hand = state.warden.hand.slice(0, 4);
  state.intent = { ...CARD_POOL[11], uid: 's6' }; // Vine Snare (Leaf) — Flame counters it
  state.log = [
    'You play Flame Lash — 6 damage (+2 chain).',
    'Warden plays Rock Slam — 4 damage to you.',
    'You play Ember Spark — 3 damage.',
    'Turn 4 — you gain 2 ember and draw a card.',
  ];
  render(state, ui);
}

/** Seed an end screen for the ?scene=win / ?scene=loss screenshots. */
function seedEndScene(won) {
  state = createGame();
  state.phase = won ? 'won' : 'lost';
  state.turn = 8;
  state.player.life = won ? 12 : 0;
  state.warden.life = won ? 0 : 9;
  state.stats = { damageDealt: won ? 31 : 21, damageTaken: won ? 18 : 30, cardsPlayed: won ? 9 : 7 };
  render(state, ui);
  if (won) setTimeout(() => emberBurst($('win-screen')), 200);
}

/** Headless self-test: play one full turn and report the result in the DOM. */
function autoTest() {
  const before = { playerLife: state.player.life, wardenLife: state.warden.life };
  const affordable = state.player.hand.findIndex((c) => c.cost <= state.player.ember);
  let played = false;
  if (affordable >= 0) {
    played = playCard(state, affordable).ok;
  } else {
    played = focusDiscard(state, 0).ok; // no affordable card: burn one for ember
  }
  const won = state.phase === 'won';
  const warden = played && !won ? wardenTurn(state) : null;
  const after = { playerLife: state.player.life, wardenLife: state.warden.life };
  const ok = played && (won || after.wardenLife < before.wardenLife) && (warden === null || after.playerLife <= before.playerLife);
  const el = document.createElement('div');
  el.id = 'test-result';
  el.textContent = ok
    ? `AUTOTEST PASS playerLife ${before.playerLife}->${after.playerLife} wardenLife ${before.wardenLife}->${after.wardenLife}`
    : `AUTOTEST FAIL ${JSON.stringify({ played, won, warden, before, after })}`;
  document.body.appendChild(el);
  render(state, ui);
}

// ---------------------------------------------------------------- boot

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene') || 'title';

wire();
if (scene === 'table') {
  seedTableScene();
} else if (scene === 'win') {
  seedEndScene(true);
} else if (scene === 'loss') {
  seedEndScene(false);
} else {
  render(state, ui);
}
if (params.get('autotest') === '1') {
  if (state.phase === 'title') startDuel();
  setTimeout(autoTest, 100);
}
