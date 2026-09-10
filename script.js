const balanceEl = document.querySelector('#balance');
const modal = document.querySelector('#gameModal');
const gameContent = document.querySelector('#gameContent');

let balance = 1000;
let bonusUsed = false;
let rocketTimer = null;
let rocketMultiplier = 1;
let activeGame = '';

const fmt = value => Math.max(0, Math.floor(value)).toLocaleString();

function updateBalance(animated = true) {
  balanceEl.textContent = fmt(balance);
  if (animated) {
    balanceEl.classList.remove('balance-pop');
    void balanceEl.offsetWidth;
    balanceEl.classList.add('balance-pop');
  }
}

function wager(input) {
  const amount = Math.floor(Number(input.value));
  if (!amount || amount < 1 || amount > balance) return null;
  balance -= amount;
  updateBalance();
  return amount;
}

function payout(amount, multiplier) {
  balance += Math.floor(amount * multiplier);
  updateBalance();
}

function showResult(message, type = '') {
  const result = gameContent.querySelector('.result');
  if (!result) return;
  result.className = `result ${type}`;
  result.textContent = message;
  result.classList.remove('result-pop');
  void result.offsetWidth;
  result.classList.add('result-pop');
}

function shell(title, sub, body) {
  return `<div class="game-head"><div><p class="eyebrow">DEMO GAME · ${activeGame.toUpperCase()}</p><h2 class="game-title">${title}</h2><p class="game-sub">${sub}</p></div><span class="live-pill"><i></i> LIVE DEMO</span></div>${body}`;
}

function controls(button = 'Play') {
  return `<div class="game-controls"><label>Wager <input class="wager" type="number" value="25" min="1" step="1"></label><button class="action" data-label="${button}">${button}</button></div><div class="result" aria-live="polite"></div>`;
}

function plinko() {
  const pegs = Array.from({ length: 5 }, (_, row) => `<div class="peg-row">${Array.from({ length: row + 4 }, () => '<i class="peg"></i>').join('')}</div>`).join('');
  return shell('Plinko', 'Drop a chip and watch it bounce through the multiplier lanes.', `<div class="plinko-board"><div class="plinko-chip">◆</div>${pegs}<div class="multiplier-row">${['0.2×', '0.5×', '1×', '1.5×', '2×', '5×'].map((x, i) => `<b class="multiplier m${i}">${x}</b>`).join('')}</div></div>${controls('Drop chip')}`);
}

function rocket() {
  return shell('Rocket', 'Watch the multiplier climb. This simulated round ends automatically.', `<div class="rocket-stage"><div class="rocket-stars">✦　·　✧　·　✦</div><div class="rocket-display"><b>1.00×</b><span>DEMO FLIGHT</span></div><div class="rocket-trail"></div></div>${controls('Launch rocket')}`);
}

function cases() {
  return shell('Cases', 'Open a fictional cosmetics case. Items have no platform or cash value.', `<div class="case-showcase"><div class="case-glow"></div><div class="case-box">▣</div><div class="case-label">PIXEL DROP <small>★ RARE COLLECTION</small></div></div>${controls('Open case')}`);
}

function mines() {
  return shell('Mines', 'Reveal gems and avoid the hidden mines. Every tile is reset for a new demo round.', `<div class="mine-status"><span>Gems <b class="gem-count">0</b></span><span>Risk <b>22%</b></span></div><div class="tiles">${Array.from({ length: 20 }, (_, i) => `<button class="tile" data-i="${i}">?</button>`).join('')}</div>${controls('Start round')}`);
}

function chicken() {
  return shell('Chicken Run', 'Choose a lane and cross the road one step at a time.', `<div class="chicken-stage"><div class="chicken-road">${Array.from({ length: 5 }, (_, i) => `<button class="road-tile" data-lane="${i}">🌾</button>`).join('')}</div><div class="chicken-player">🐔</div></div>${controls('Cross road')}`);
}

function tower() {
  return shell('Tower', 'Pick the safe door on each floor. One wrong choice ends the climb.', `<div class="tower"><div class="tower-roof">▲ DEMO TOWER ▲</div>${[3, 2, 1].map(n => `<div class="floor" data-floor="${n}"><span>FLOOR ${n}</span><button class="door">?</button><button class="door">?</button></div>`).join('')}</div>${controls('Start climb')}`);
}

const games = { plinko, rocket, cases, mines, chicken, tower };

function openGame(name) {
  if (rocketTimer) clearInterval(rocketTimer);
  activeGame = name;
  modal.classList.remove('hidden');
  gameContent.innerHTML = games[name]();
  modal.classList.add('modal-opening');
  setTimeout(() => modal.classList.remove('modal-opening'), 350);
}

function closeGame() {
  if (rocketTimer) clearInterval(rocketTimer);
  modal.classList.add('hidden');
}

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', event => {
    if (event.target.closest('.play-btn') || event.currentTarget === card) openGame(card.dataset.game);
  });
});
document.querySelector('#closeModal').addEventListener('click', closeGame);
modal.addEventListener('click', event => { if (event.target === modal) closeGame(); });

document.querySelector('#bonusBtn').addEventListener('click', event => {
  if (bonusUsed) {
    event.currentTarget.textContent = 'Already claimed';
    return;
  }
  balance += 250;
  bonusUsed = true;
  event.currentTarget.textContent = 'Bonus claimed';
  event.currentTarget.classList.add('bonus-claimed');
  updateBalance();
});

gameContent.addEventListener('click', event => {
  const target = event.target;

  if (target.classList.contains('tile')) {
    if (target.classList.contains('revealed')) return;
    const mine = Math.random() < 0.22;
    target.textContent = mine ? '✹' : '◆';
    target.classList.add('revealed', mine ? 'mine' : 'gem');
    const count = gameContent.querySelectorAll('.tile.gem').length;
    gameContent.querySelector('.gem-count').textContent = count;
    showResult(mine ? 'Mine found — demo round over.' : `Gem found! ${count} safe tile${count === 1 ? '' : 's'} revealed.`, mine ? 'loss' : 'win');
    return;
  }

  if (target.classList.contains('road-tile')) {
    const chicken = gameContent.querySelector('.chicken-player');
    target.classList.add('crossed');
    chicken.style.setProperty('--lane', target.dataset.lane);
    showResult('Lane cleared! The chicken made it across safely.', 'win');
    return;
  }

  if (target.classList.contains('door')) {
    const floor = target.closest('.floor');
    if (floor.classList.contains('opened')) return;
    floor.classList.add('opened');
    const safeDoor = Math.random() > 0.3;
    target.classList.add(safeDoor ? 'safe' : 'wrong');
    target.textContent = safeDoor ? '✓' : '×';
    showResult(safeDoor ? `Safe door! Floor ${floor.dataset.floor} cleared.` : 'Wrong door — the demo climb is over.', safeDoor ? 'win' : 'loss');
    return;
  }

  if (!target.classList.contains('action')) return;
  const input = gameContent.querySelector('.wager');
  const bet = wager(input);
  if (!bet) {
    showResult('Enter a valid wager within your demo balance.', 'loss');
    return;
  }

  target.disabled = true;
  target.classList.add('is-loading');
  target.textContent = 'Playing…';
  const resetButton = () => {
    target.disabled = false;
    target.classList.remove('is-loading');
    target.textContent = target.dataset.label;
  };

  if (activeGame === 'rocket') {
    rocketMultiplier = 1;
    const display = gameContent.querySelector('.rocket-display b');
    gameContent.querySelector('.rocket-stage').classList.add('launching');
    rocketTimer = setInterval(() => {
      rocketMultiplier += 0.07 + Math.random() * 0.12;
      display.textContent = `${rocketMultiplier.toFixed(2)}×`;
    }, 100);
    setTimeout(() => {
      clearInterval(rocketTimer);
      rocketTimer = null;
      const won = Math.random() > 0.35;
      if (won) {
        payout(bet, rocketMultiplier);
        showResult(`Rocket finished at ${rocketMultiplier.toFixed(2)}×. Demo payout added!`, 'win');
      } else showResult('The rocket flew away — no demo payout this round.', 'loss');
      resetButton();
    }, 1700);
    return;
  }

  setTimeout(() => {
    if (activeGame === 'plinko') {
      const values = [0.2, 0.5, 1, 1.5, 2, 5];
      const index = Math.floor(Math.random() * values.length);
      const chip = gameContent.querySelector('.plinko-chip');
      chip.style.setProperty('--slot', index);
      chip.classList.add('dropping');
      setTimeout(() => {
        const multiplier = values[index];
        payout(bet, multiplier);
        showResult(`Chip landed on ${multiplier}×. ${multiplier > 1 ? 'Nice hit!' : 'Better luck next drop.'}`, multiplier > 1 ? 'win' : 'loss');
      }, 650);
    } else if (activeGame === 'cases') {
      const items = ['Neon Block Head', 'Cosmic Sparkles', 'Retro Jetpack', 'Pixel Crown', 'Cloud Hoodie'];
      const item = items[Math.floor(Math.random() * items.length)];
      gameContent.querySelector('.case-showcase').classList.add('opening');
      payout(bet, [0.4, 0.8, 1.2, 2, 4][Math.floor(Math.random() * 5)]);
      showResult(`You received the fictional ${item}!`, 'win');
    } else if (activeGame === 'chicken') {
      const multiplier = 1.3 + Math.random() * 2;
      payout(bet, multiplier);
      showResult(`Chicken crossed safely at ${multiplier.toFixed(2)}×!`, 'win');
    } else if (activeGame === 'tower') {
      showResult('Choose a door above to continue the demo climb.', 'win');
    } else if (activeGame === 'mines') {
      showResult('Round started — reveal a tile to find a gem.', 'win');
    }
    resetButton();
  }, 500);
});

updateBalance(false);
