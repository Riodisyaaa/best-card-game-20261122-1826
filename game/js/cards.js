// Ember Pact — card and element definitions.
// Every card belongs to one of four elements. Each element is told apart by
// BOTH a colour and a shape, never by text alone:
//   Flame = red + triangle, Tide = blue + droplet, Leaf = green + leaf, Stone = grey-brown + square.
// Advantage cycle: Flame beats Leaf, Leaf beats Stone, Stone beats Tide, Tide beats Flame.
// Playing a card whose element beats the target's element deals +2 damage.

export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e2483a', dark: '#8f1d12', shape: 'triangle', glyph: '▲' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#144a7d', shape: 'droplet', glyph: '💧' },
  leaf: { name: 'Leaf', color: '#3da33d', dark: '#1d5c1d', shape: 'leaf', glyph: '🍃' },
  stone: { name: 'Stone', color: '#8a7a5c', dark: '#4d4232', shape: 'square', glyph: '■' },
};

/** The element this element beats. */
export const BEATS = { flame: 'leaf', leaf: 'stone', stone: 'tide', tide: 'flame' };

/** True when attackerElement has advantage over defenderElement. */
export function hasAdvantage(attackerElement, defenderElement) {
  return BEATS[attackerElement] === defenderElement;
}

/** The element that beats the given element (its counter). */
export function counterOf(element) {
  for (const [key, value] of Object.entries(BEATS)) {
    if (value === element) return key;
  }
  return null;
}

// One card pool entry: name, element, ember cost, base damage, flavour line.
export const CARD_POOL = [
  { name: 'Ember Spark', element: 'flame', cost: 1, damage: 3, text: 'A quick lick of flame.' },
  { name: 'Flame Lash', element: 'flame', cost: 2, damage: 4, text: 'A whip of living fire.' },
  { name: 'Pyre Burst', element: 'flame', cost: 3, damage: 6, text: 'The bonfire roars up.' },
  { name: 'Cinder Fang', element: 'flame', cost: 2, damage: 5, text: 'Teeth of glowing ash.' },
  { name: 'Wildfire', element: 'flame', cost: 4, damage: 7, text: 'Nothing stops the burn.' },
  { name: 'Dew Drop', element: 'tide', cost: 1, damage: 3, text: 'Small, cold, certain.' },
  { name: 'Wave Cut', element: 'tide', cost: 2, damage: 4, text: 'A blade of green water.' },
  { name: 'Deep Current', element: 'tide', cost: 3, damage: 6, text: 'The undertow takes hold.' },
  { name: 'Riptide', element: 'tide', cost: 2, damage: 5, text: 'Pulled under in a blink.' },
  { name: 'Monsoon', element: 'tide', cost: 4, damage: 7, text: 'The whole sky falls.' },
  { name: 'Thorn Prick', element: 'leaf', cost: 1, damage: 3, text: 'Sharp as a promise.' },
  { name: 'Vine Snare', element: 'leaf', cost: 2, damage: 4, text: 'Roots that never let go.' },
  { name: 'Grove Bloom', element: 'leaf', cost: 3, damage: 6, text: 'A hundred buds open at once.' },
  { name: 'Bramble', element: 'leaf', cost: 2, damage: 5, text: 'A wall of thorns.' },
  { name: 'Overgrowth', element: 'leaf', cost: 4, damage: 7, text: 'The forest swallows all.' },
  { name: 'Pebble Toss', element: 'stone', cost: 1, damage: 3, text: 'Small stone, hard lesson.' },
  { name: 'Rock Slam', element: 'stone', cost: 2, damage: 4, text: 'The mountain shrugs.' },
  { name: 'Quake', element: 'stone', cost: 3, damage: 6, text: 'The ground itself stands up.' },
  { name: 'Granite Fist', element: 'stone', cost: 2, damage: 5, text: 'A fist that never tires.' },
  { name: 'Avalanche', element: 'stone', cost: 4, damage: 7, text: 'The whole slope comes down.' },
];

/** A fresh shuffled deck: two copies of every pool card, each with a unique id. */
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const copy of [0, 1]) {
    for (const card of CARD_POOL) {
      deck.push({ ...card, uid: `c${id++}` });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
