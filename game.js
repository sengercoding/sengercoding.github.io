// ── CONSTANTS ──
const NUM_NORMAL_CARDS = 10;
const NUM_SPECIAL_CARDS = 2;
const NUM_ADD_CARDS = 5;
const NUM_MULT_CARDS = 3;
const WIN_SCORE = 200;

// ── CARD DISPLAY DEFINITIONS ──
// Each card type/specialType maps to a visual identity for the reveal popup.
const CARD_VISUALS = {
  // Standard numbers: generated dynamically in getCardVisual()
  add: {
    icon: '➕',
    label: (card) => `+${card.value}`,
    desc: 'Add to your score',
    type: 'add',
    suit: '✦',
  },
  mult: {
    icon: '✖',
    label: () => '×2',
    desc: 'Doubles your round score',
    type: 'mult',
    suit: '◆',
  },
  freeze: {
    icon: '❄️',
    label: () => 'FREEZE',
    desc: 'Choose a player to freeze',
    type: 'freeze',
    suit: '❄',
  },
  second_chance: {
    icon: '🛡️',
    label: () => 'SECOND CHANCE',
    desc: 'Survive one duplicate',
    type: 'second_chance',
    suit: '★',
  },
  add_three: {
    icon: '🎲',
    label: () => 'ADD THREE',
    desc: 'Send 3 cards to any player',
    type: 'add_three',
    suit: '⚡',
  },
};

// Suit symbols cycling for standard number cards (visual flavour only)
const STANDARD_SUITS = ['♠', '♥', '♣', '♦'];

function getCardVisual(card) {
  if (card.specialType) {
    const v = CARD_VISUALS[card.specialType];
    return {
      cornerValue: v.label(card),
      suit: v.suit,
      icon: v.icon,
      label: v.label(card),
      desc: v.desc,
      type: card.specialType,
    };
  }
  if (card.type === 'add') {
    const v = CARD_VISUALS.add;
    return {
      cornerValue: `+${card.value}`,
      suit: v.suit,
      icon: v.icon,
      label: `+${card.value}`,
      desc: v.desc,
      type: 'add',
    };
  }
  if (card.type === 'mult') {
    const v = CARD_VISUALS.mult;
    return {
      cornerValue: '×2',
      suit: v.suit,
      icon: v.icon,
      label: '×2',
      desc: v.desc,
      type: 'mult',
    };
  }
  // Standard card
  const suit = STANDARD_SUITS[card.value % STANDARD_SUITS.length];
  return {
    cornerValue: card.value === 0 ? '0' : String(card.value),
    suit,
    icon: suit,
    label: card.value === 0 ? '0' : String(card.value),
    desc: 'Add to your score',
    type: 'standard',
  };
}

// ── CARD REVEAL POPUP ──
// Shows the drawn card as a playing card, then calls onContinue when dismissed.
function showCardReveal(card, onContinue) {
  const modal = document.getElementById('card-reveal-modal');
  const cardEl = document.getElementById('reveal-card');
  const v = getCardVisual(card);

  // Reset animation by cloning the card element
  const fresh = cardEl.cloneNode(true);
  cardEl.parentNode.replaceChild(fresh, cardEl);
  const c = document.getElementById('reveal-card');

  c.setAttribute('data-type', v.type);
  document.getElementById('reveal-corner-tl').textContent = v.cornerValue;
  document.getElementById('reveal-suit-tl').textContent = v.suit;
  document.getElementById('reveal-corner-br').textContent = v.cornerValue;
  document.getElementById('reveal-suit-br').textContent = v.suit;
  document.getElementById('reveal-center-icon').textContent = v.icon;
  document.getElementById('reveal-center-label').textContent = v.label;
  document.getElementById('reveal-center-desc').textContent = v.desc;

  modal.style.display = 'flex';

  // Wire up the continue button (clone to remove old listeners)
  const oldBtn = document.getElementById('card-reveal-continue');
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  document.getElementById('card-reveal-continue').addEventListener('click', () => {
    modal.style.display = 'none';
    onContinue();
  });

  // Also allow clicking the overlay backdrop to continue
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      onContinue();
    }
  };
}

// ── CARD CLASS ──
class Card {
  constructor(value, type, specialType) {
    this.value = value;
    this.type = type;
    this.specialType = specialType;
  }

  equals(other) {
    if (!(other instanceof Card)) return false;
    if (other.type === 'standard') {
      return this.value === other.value && this.type === other.type && this.specialType === other.specialType;
    }
    return false;
  }

  toString() {
    if (this.specialType) return this.specialType.toUpperCase().replace(/_/g, ' ');
    if (this.type === 'add') return `+${this.value}`;
    if (this.type === 'mult') return '×2';
    return `${this.value}`;
  }

  chipClass() {
    if (this.specialType) return `card-chip card-${this.specialType}`;
    return `card-chip card-${this.type}`;
  }
}

// ── DECK CLASS ──
class Deck {
  constructor() {
    this.cards = [];
    this.cards.push(new Card(0, 'standard', null));
    for (let i = 1; i <= NUM_NORMAL_CARDS + 1; i++) {
      for (let j = 0; j < i; j++) {
        this.cards.push(new Card(i, 'standard', null));
      }
    }
    for (let i = 0; i < NUM_SPECIAL_CARDS; i++) {
      this.cards.push(new Card(0, 'special', 'freeze'));
      this.cards.push(new Card(0, 'special', 'second_chance'));
      this.cards.push(new Card(0, 'special', 'add_three'));
    }
    for (let i = 1; i <= NUM_ADD_CARDS; i++) {
      this.cards.push(new Card(i * 2, 'add', null));
    }
    for (let i = 0; i < NUM_MULT_CARDS; i++) {
      this.cards.push(new Card(i, 'mult', null));
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  removeTop() {
    return this.cards.shift();
  }
}

// ── PLAYER CLASS ──
class Player {
  constructor(id) {
    this.id = id;
    this.currentDeck = [];
    this.secondChance = false;
    this.active = true;
    this.currentScore = 0;
  }

  calcRoundScore() {
    let score = 0;
    let mult = false;
    for (const card of this.currentDeck) {
      if (card.type === 'add') {
        score += card.value;
      } else if (card.type === 'mult') {
        mult = true;
      } else {
        score += card.value;
      }
    }
    if (mult) score *= 2;
    return score;
  }

  endRound(addScore) {
    if (addScore) this.currentScore += this.calcRoundScore();
    this.currentDeck = [];
    this.secondChance = false;
    this.active = false;
  }
}

// ── GAME STATE ──
let state = {
  deck: null,
  players: [],
  currentPlayerIdx: 0,
  gameOver: false,
  round: 1,
};

let playerCount = 2;

// ── SETUP CONTROLS ──
document.getElementById('dec-btn').addEventListener('click', () => {
  if (playerCount > 2) {
    playerCount--;
    document.getElementById('player-count-display').textContent = playerCount;
  }
});

document.getElementById('inc-btn').addEventListener('click', () => {
  if (playerCount < 6) {
    playerCount++;
    document.getElementById('player-count-display').textContent = playerCount;
  }
});

document.getElementById('start-btn').addEventListener('click', startGame);

// ── START GAME ──
function startGame() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  state.deck = new Deck();
  state.players = [];
  for (let i = 0; i < playerCount; i++) {
    state.players.push(new Player(i));
  }
  state.currentPlayerIdx = 0;
  state.gameOver = false;
  state.round = 1;

  buildPlayersGrid();
  updateUI();
  log(`Game started with ${playerCount} players!`);
}

// ── BUILD PLAYER PANELS ──
function buildPlayersGrid() {
  const grid = document.getElementById('players-grid');
  grid.innerHTML = '';
  for (const p of state.players) {
    const panel = document.createElement('div');
    panel.className = 'player-panel';
    panel.id = `player-panel-${p.id}`;
    panel.innerHTML = `
      <div class="player-panel-header">
        <div class="player-name">PLAYER ${p.id + 1}</div>
        <div class="player-score-total">SCORE <span id="score-total-${p.id}">0</span></div>
      </div>
      <div class="cards-area" id="cards-area-${p.id}"></div>
      <div class="round-score">Round: <span id="round-score-${p.id}">0</span></div>
    `;
    grid.appendChild(panel);
  }
}

// ── UPDATE UI ──
function updateUI() {
  const cp = state.players[state.currentPlayerIdx];

  document.getElementById('current-player-tag').textContent = `PLAYER ${cp.id + 1}`;
  document.getElementById('deck-counter').textContent = state.deck.cards.length;
  document.getElementById('round-badge').textContent = `ROUND ${state.round}`;

  const isActive = cp.active && !state.gameOver;
  document.getElementById('draw-btn').disabled = !isActive;
  document.getElementById('stop-btn').disabled = !isActive;

  for (const p of state.players) {
    const panel = document.getElementById(`player-panel-${p.id}`);

    panel.className = 'player-panel';
    if (p.id === cp.id && cp.active) panel.classList.add('active-player');
    if (!p.active) panel.classList.add('finished');

    const area = document.getElementById(`cards-area-${p.id}`);
    area.innerHTML = '';
    for (const card of p.currentDeck) {
      const chip = document.createElement('span');
      chip.className = card.chipClass();
      chip.textContent = card.toString();
      area.appendChild(chip);
    }

    document.getElementById(`score-total-${p.id}`).textContent = p.currentScore;
    document.getElementById(`round-score-${p.id}`).textContent = p.calcRoundScore();

    const oldBadge = panel.querySelector('.player-inactive-badge');
    if (oldBadge) oldBadge.remove();

    if (!p.active) {
      const badge = document.createElement('div');
      badge.className = 'player-inactive-badge';
      badge.textContent = 'Finished';
      panel.appendChild(badge);
    }
  }
}

// ── LOG ──
function log(msg) {
  const logEl = document.getElementById('message-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = msg;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  while (logEl.children.length > 20) logEl.removeChild(logEl.firstChild);
}

// ── TARGET MODAL ──
function showTargetModal(title, subtitle, eligibleFilter, onSelect) {
  const modal = document.getElementById('target-modal');
  const cp = state.players[state.currentPlayerIdx];

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-subtitle').textContent = subtitle;

  document.getElementById('draw-btn').disabled = true;
  document.getElementById('stop-btn').disabled = true;

  const container = document.getElementById('modal-players');
  container.innerHTML = '';

  for (const p of state.players) {
    if (!eligibleFilter(p)) continue;

    const btn = document.createElement('button');
    btn.className = 'modal-player-btn' + (p.id === cp.id ? ' self-btn' : '');

    const label = p.id === cp.id ? `PLAYER ${p.id + 1} (you)` : `PLAYER ${p.id + 1}`;
    const cardsInfo = p.currentDeck.length > 0
      ? p.currentDeck.map(c => c.toString()).join(', ')
      : 'no cards yet';

    btn.innerHTML = `<span>${label}</span><span class="btn-score">${cardsInfo}</span>`;

    btn.addEventListener('click', () => {
      modal.style.display = 'none';
      onSelect(p);
    });

    container.appendChild(btn);
  }

  modal.style.display = 'flex';
}

// ── APPLY FREEZE TO A TARGET ──
function applyFreeze(target, drawer) {
  target.endRound(true);
  if (target.id === drawer.id) {
    log(`Player ${drawer.id + 1} froze themselves. Round ends with score banked. Total: <span class="good">${target.currentScore}</span>`);
  } else {
    log(`<span class="danger">FREEZE</span> sent to Player ${target.id + 1}! Their round ends, score banked. Total: <span class="good">${target.currentScore}</span>`);
  }
  afterSpecialResolved();
}

// ── APPLY ADD THREE TO A TARGET ──
// Shows each of the 3 forced cards one-by-one via the reveal popup.
function applyAddThree(target, drawer) {
  if (target.id === drawer.id) {
    log(`Player ${drawer.id + 1} chose <span class="highlight">ADD THREE</span> for themselves — drawing 3 cards!`);
  } else {
    log(`Player ${drawer.id + 1} sent <span class="highlight">ADD THREE</span> to Player ${target.id + 1} — they draw 3 cards!`);
  }

  // Draw up to 3 cards sequentially, showing the reveal popup for each.
  drawAddThreeCard(target, drawer, 0);
}

function drawAddThreeCard(target, drawer, cardIndex) {
  if (cardIndex >= 3) {
    // All 3 drawn without a bust
    log(`Player ${target.id + 1}'s round score is now <span class="highlight">${target.calcRoundScore()}</span>`);
    afterSpecialResolved();
    return;
  }

  if (state.deck.cards.length === 0) {
    state.deck = new Deck();
    log(`Deck exhausted mid-draw — reshuffled!`);
  }

  const card = state.deck.removeTop();
  const alreadyHas = target.currentDeck.some(c => c.equals(card));

  showCardReveal(card, () => {
    if (alreadyHas) {
      log(`Player ${target.id + 1} received: <span class="danger">${card.toString()} (dupe!)</span>`);
      log(`<span class="danger">DUPLICATE on ADD THREE!</span> Player ${target.id + 1} is out — round lost!`);
      target.endRound(false);
      updateUI();
      afterSpecialResolved();
    } else {
      target.currentDeck.push(card);
      log(`Player ${target.id + 1} received card ${cardIndex + 1}/3: <span class="highlight">${card.toString()}</span>`);
      updateUI();
      drawAddThreeCard(target, drawer, cardIndex + 1);
    }
  });
}

// ── CALLED AFTER A SPECIAL CARD EFFECT IS FULLY RESOLVED ──
function afterSpecialResolved() {
  if (state.deck.cards.length === 0) {
    state.deck = new Deck();
    log(`Deck exhausted — reshuffled!`);
  }
  checkRoundEnd();
  updateUI();
}

// ── DRAW ACTION ──
document.getElementById('draw-btn').addEventListener('click', () => {
  const cp = state.players[state.currentPlayerIdx];
  if (!cp.active) return;

  const card = state.deck.removeTop();
  if (!card) return;

  // Disable buttons while the reveal is open
  document.getElementById('draw-btn').disabled = true;
  document.getElementById('stop-btn').disabled = true;

  // Show the card reveal popup first, then process the effect
  showCardReveal(card, () => processDrawnCard(cp, card));
});

function processDrawnCard(cp, card) {
  const alreadyHas = cp.currentDeck.some(c => c.equals(card));

  if (!alreadyHas) {

    // ── FREEZE ──
    if (card.specialType === 'freeze') {
      cp.currentDeck.push(card);
      log(`Player ${cp.id + 1} drew <span class="danger">FREEZE</span>!`);
      updateUI();

      const activeTargets = state.players.filter(p => p.active);
      if (activeTargets.length <= 1) {
        applyFreeze(cp, cp);
      } else {
        showTargetModal(
          'FREEZE!',
          `Player ${cp.id + 1} drew a Freeze card.\nChoose who to freeze — yourself included.`,
          (p) => p.active,
          (target) => applyFreeze(target, cp)
        );
      }
      return;
    }

    // ── ADD THREE ──
    if (card.specialType === 'add_three') {
      log(`Player ${cp.id + 1} drew <span class="highlight">ADD THREE</span>!`);
      updateUI();

      const activeTargets = state.players.filter(p => p.active);
      if (activeTargets.length <= 1) {
        applyAddThree(cp, cp);
      } else {
        showTargetModal(
          'ADD THREE',
          `Player ${cp.id + 1} drew Add Three.\nChoose who draws 3 bonus cards — yourself included.`,
          (p) => p.active,
          (target) => applyAddThree(target, cp)
        );
      }
      return;
    }

    // ── Normal / second_chance ──
    cp.currentDeck.push(card);
    log(`Player ${cp.id + 1} drew <span class="highlight">${card.toString()}</span>. Round score: <span class="highlight">${cp.calcRoundScore()}</span>`);

    if (card.specialType === 'second_chance') {
      cp.secondChance = true;
      log(`Player ${cp.id + 1} has a <span class="highlight">SECOND CHANCE</span> for this round!`);
    }

  } else {
    // ── Duplicate ──
    if (cp.secondChance) {
      cp.secondChance = false;
      log(`Player ${cp.id + 1} used their <span class="highlight">SECOND CHANCE</span>! Duplicate dodged.`);
    } else {
      log(`<span class="danger">DUPLICATE!</span> Player ${cp.id + 1} drew a card they already have. Round lost!`);
      cp.endRound(false);
    }
  }

  if (state.deck.cards.length === 0) {
    state.deck = new Deck();
    log(`Deck exhausted — reshuffled!`);
  }

  checkRoundEnd();
  updateUI();
}

// ── END TURN ACTION ──
document.getElementById('stop-btn').addEventListener('click', () => {
  const cp = state.players[state.currentPlayerIdx];
  if (!cp.active) return;

  const gained = cp.calcRoundScore();
  cp.endRound(true);
  log(`Player ${cp.id + 1} ended their turn. Gained <span class="good">+${gained}</span>. Total: <span class="highlight">${cp.currentScore}</span>`);

  checkRoundEnd();
  updateUI();
});

// ── CHECK ROUND / GAME END ──
function checkRoundEnd() {
  for (const p of state.players) {
    if (p.currentScore >= WIN_SCORE) {
      state.gameOver = true;
      break;
    }
  }

  if (state.gameOver) {
    setTimeout(showGameOver, 600);
    return;
  }

  const allDone = state.players.every(p => !p.active);

  if (allDone) {
    state.round++;
    for (const p of state.players) {
      p.active = true;
      p.currentDeck = [];
      p.secondChance = false;
    }
    state.currentPlayerIdx = 0;
    log(`— Round ${state.round} begins! —`);
    updateUI();
    return;
  }

  let next = (state.currentPlayerIdx + 1) % state.players.length;
  while (!state.players[next].active) {
    next = (next + 1) % state.players.length;
    if (next === state.currentPlayerIdx) break;
  }
  state.currentPlayerIdx = next;
}

// ── GAME OVER SCREEN ──
function showGameOver() {
  document.getElementById('game-screen').style.display = 'none';
  const go = document.getElementById('gameover-screen');
  go.style.display = 'flex';

  const sorted = [...state.players].sort((a, b) => b.currentScore - a.currentScore);
  const winner = sorted[0];

  document.getElementById('winner-name').textContent = `🏆 Player ${winner.id + 1} Wins!`;

  const fs = document.getElementById('final-scores');
  fs.innerHTML = '';
  for (const p of sorted) {
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `<span class="s-name">Player ${p.id + 1}</span><span class="s-val">${p.currentScore}</span>`;
    fs.appendChild(row);
  }
}
