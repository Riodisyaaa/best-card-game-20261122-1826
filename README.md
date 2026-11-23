# Ember Pact

[![bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Riodisyaaa/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Riodisyaaa/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Ember Pact** is an original turn-based duel card game against the AI Warden, built for the
[best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826) on make.fun.

## The game

Both sides start at 30 life. Win by reducing the Warden to 0.

- **Four elements**, told apart by colour *and* shape: Flame ▲ (red), Tide 💧 (blue),
  Leaf 🍃 (green), Stone ■ (grey-brown). Advantage cycle: Flame beats Leaf, Leaf beats
  Stone, Stone beats Tide, Tide beats Flame — an advantaged hit deals +2 damage.
- **The Warden telegraphs its intent**: at the start of your turn a banner shows the
  element it is about to play, so you can read it and counter with the advantaged element.
- **Chain combos**: playing the same element on consecutive turns builds a chain,
  each step adding +2 damage — shown on a live chain meter.
- **Focus**: once per turn, burn a card from your hand for +2 ember — a real choice
  between cards and resources.
- **Feel**: cards slide in from the deck when dealt, flip into the played slot, floating
  damage numbers, a screen shake on big hits, and an ember-particle flourish on the win screen.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server).
Click **Play the Duel**, then click a card to play it, **Focus** to burn a card for ember,
or **Pass**. Keys: `1–7` play a hand card, `F` Focus, `Esc` cancel.

## Layout

- `game/index.html` — the page
- `game/js/cards.js` — elements, advantage cycle, card pool, deck
- `game/js/state.js` — game state and turn rules (ember, chain, damage)
- `game/js/ai.js` — the Warden: picks and announces its intent
- `game/js/render.js` — draws the table, cards, intent banner, chain meter
- `game/js/effects.js` — floating damage, screen shake, ember particles
- `game/js/main.js` — wiring: clicks, keys, scenes, self-test
- `game/css/style.css` — the ember-lit table
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — four real renders: title, table, win, loss
