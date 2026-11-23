// Ember Pact — feel: floating damage numbers, screen shake, ember particles.
// All effects are plain DOM + CSS animations, no assets, no network.

/** A damage number that floats up from `anchor` and fades away. */
export function floatDamage(anchor, text, kind = 'hurt') {
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const host = document.getElementById('fx-layer');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `float-dmg ${kind}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/** A short shake of the table, for big hits (damage 6 or more). */
export function shakeTable() {
  const table = document.getElementById('table');
  if (!table) return;
  table.classList.remove('shake');
  void table.offsetWidth; // restart the animation
  table.classList.add('shake');
}

/** A burst of ember particles over `host` — the win flourish. */
export function emberBurst(host, count = 90) {
  if (!host) return;
  const colors = ['#ffb347', '#ff7a29', '#e2483a', '#ffd97a', '#ff5e3a'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'ember-particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 320;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 120}px`);
    p.style.setProperty('--sz', `${4 + Math.random() * 9}px`);
    p.style.background = colors[i % colors.length];
    p.style.left = '50%';
    p.style.top = '46%';
    p.style.animationDelay = `${Math.random() * 0.35}s`;
    host.appendChild(p);
    setTimeout(() => p.remove(), 2600);
  }
}

/** Mark a freshly dealt card so it slides in from the deck. */
export function dealIn(cardEl, delayMs) {
  if (!cardEl) return;
  cardEl.style.animationDelay = `${delayMs}ms`;
  cardEl.classList.add('deal-in');
}
