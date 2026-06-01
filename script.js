// ═══════════════════════════════════════════════════════
//  IRON CLAD — v3.0  Setup → Planning → Simulation
// ═══════════════════════════════════════════════════════

// ── AUDIO ENGINE ──────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _ac = null;
function getAC() {
  if (!_ac) _ac = new AudioCtx();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

function playSound(type) {
  try {
    const ac = getAC();
    const now = ac.currentTime;
    const g = ac.createGain();
    g.connect(ac.destination);

    if (type === 'sword') {
      // Metallic sword strike
      const buf = ac.createBuffer(1, ac.sampleRate * 0.18, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / ac.sampleRate;
        d[i] = (Math.sin(2*Math.PI*320*t) * Math.exp(-t*18) +
                Math.sin(2*Math.PI*800*t) * Math.exp(-t*30) * 0.4 +
                (Math.random()*2-1) * Math.exp(-t*40) * 0.3);
      }
      const src = ac.createBufferSource(); src.buffer = buf;
      g.gain.setValueAtTime(0.22, now);
      src.connect(g); src.start(now);

    } else if (type === 'arrow') {
      // Arrow whistle
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(g); osc.start(now); osc.stop(now + 0.15);

    } else if (type === 'cavalry') {
      // Hoofbeats — multiple strikes
      for (let k = 0; k < 3; k++) {
        const t0 = now + k * 0.08;
        const buf = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          const t = i / ac.sampleRate;
          d[i] = (Math.sin(2*Math.PI*60*t) * Math.exp(-t*50) +
                  (Math.random()*2-1) * Math.exp(-t*35) * 0.6);
        }
        const src = ac.createBufferSource(); src.buffer = buf;
        const gg = ac.createGain();
        gg.gain.setValueAtTime(0.25, t0);
        src.connect(gg); gg.connect(ac.destination); src.start(t0);
      }
      return;

    } else if (type === 'death') {
      // Dull thud + fade
      const buf = ac.createBuffer(1, ac.sampleRate * 0.35, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / ac.sampleRate;
        d[i] = (Math.sin(2*Math.PI*80*t) * Math.exp(-t*10) +
                (Math.random()*2-1) * Math.exp(-t*8) * 0.5);
      }
      const src = ac.createBufferSource(); src.buffer = buf;
      g.gain.setValueAtTime(0.3, now);
      src.connect(g); src.start(now);

    } else if (type === 'victory') {
      // Fanfare — ascending chord
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const t0 = now + i * 0.13;
        const osc = ac.createOscillator();
        const env = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t0);
        env.gain.setValueAtTime(0, t0);
        env.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
        env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);
        osc.connect(env); env.connect(ac.destination);
        osc.start(t0); osc.stop(t0 + 0.85);
      });
      return;

    } else if (type === 'defeat') {
      // Descending defeat tone
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.9);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.connect(g); osc.start(now); osc.stop(now + 1.0);
    }
  } catch(e) {}
}

// ── PARTICLE SYSTEM (smoke / confetti) ──────────────────
let particles = [];

function spawnSmokeAt(px, py) {
  for (let i = 0; i < 3; i++) {
    particles.push({
      type: 'smoke',
      x: px + (Math.random()-0.5) * 12,
      y: py + (Math.random()-0.5) * 6,
      vx: (Math.random()-0.5) * 0.4,
      vy: -0.5 - Math.random() * 0.6,
      life: 1.0,
      decay: 0.018 + Math.random() * 0.012,
      r: 4 + Math.random() * 8,
    });
  }
}

function spawnVictoryConfetti(cx, cy) {
  const colors = ['#f5c842','#ff6b6b','#4ecdc4','#a29bfe','#fd79a8','#55efc4','#fdcb6e'];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i / 8) + Math.random() * 0.5;
    const spd = 1.5 + Math.random() * 2.5;
    particles.push({
      type: 'confetti',
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2,
      life: 1.0,
      decay: 0.008 + Math.random() * 0.006,
      r: 3 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random()-0.5) * 0.3,
    });
  }
}

function updateParticles(dt) {
  const scale = dt / 16;
  particles.forEach(p => {
    p.x += p.vx * scale;
    p.y += p.vy * scale;
    if (p.type === 'confetti') p.vy += 0.08 * scale;
    p.rot = (p.rot || 0) + (p.rotV || 0) * scale;
    p.life -= p.decay * scale;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles(ctx) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life * 0.7);
    if (p.type === 'smoke') {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, 'rgba(180,160,120,0.5)');
      grad.addColorStop(1, 'rgba(180,160,120,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
    }
    ctx.restore();
  });
}

// ── VICTORY ANIMATION ─────────────────────────────────
let victoryAnim = null;  // { squads, startTime, done }

function startVictoryAnimation(winnerIsPlayer) {
  const winners = G.squads.filter(s => s.alive && s.isPlayer === winnerIsPlayer);
  if (!winners.length) return;
  victoryAnim = {
    squads: winners,
    startTime: performance.now(),
    winnerIsPlayer,
  };
  playSound('victory');
  // Spawn initial burst
  winners.forEach(sq => {
    spawnVictoryConfetti(sq.cx() * CELL, sq.cy() * CELL);
  });
  runVictoryLoop();
}

function runVictoryLoop() {
  if (!victoryAnim) return;
  const elapsed = performance.now() - victoryAnim.startTime;
  if (elapsed > 3500) { victoryAnim = null; return; }

  const dt = 16;
  updateParticles(dt);

  if (Math.floor(elapsed / 400) > Math.floor((elapsed - dt) / 400)) {
    victoryAnim.squads.forEach(sq => {
      spawnVictoryConfetti(sq.cx() * CELL, sq.cy() * CELL);
    });
  }

  // Only draw if battle canvas is still active
  const bc = document.getElementById('battleCanvas');
  if (bc && document.getElementById('screen-battle').classList.contains('active')) {
    drawSim(0);
  }
  requestAnimationFrame(runVictoryLoop);
}

const GRID            = 40;
const MIN_SQUADS      = 5;
const MAX_SQUADS      = 7;
const SQUAD_UNITS     = 6;
const BUDGET          = 150;
const SQUAD_COLS      = 3;
const ATTACK_INTERVAL = 1400;   // ms between attacks
const BOT_THINK_MS    = 2400;   // ms between bot re-decisions
const BATTLE_DURATION = 5 * 60 * 1000;
const SPD_SCALE       = 0.0009; // cells/ms  (infantry ~25s across map)

const UNIT_BASE = {
  Swordsman:{ hp:400,  atk:12, arm_m:20, arm_r:10, spd:1.8, rng:1, aspd:1.0, symbol:'⚔', color:'#5c9eff', label:'Мечник',     cost:15 },
  Archer:   { hp:280,  atk: 9, arm_m: 5, arm_r: 5, spd:2.2, rng:6, aspd:0.8, symbol:'🏹', color:'#66bb6a', label:'Лучник',     cost:18 },
  Cavalry:  { hp:480,  atk:18, arm_m:10, arm_r: 5, spd:3.5, rng:1, aspd:1.0, symbol:'🐎', color:'#ffa726', label:'Конница',    cost:25 },
  Spearman: { hp:360,  atk:11, arm_m:15, arm_r:10, spd:1.8, rng:2, aspd:0.9, symbol:'🔱', color:'#ab47bc', label:'Копейщик',   cost:15 },
  General:  { hp:1000, atk:24, arm_m:20, arm_r:20, spd:2.0, rng:1, aspd:0.7, symbol:'👑', color:'#ef5350', label:'Полководец', cost:30 },
};

// Special (elite) units — 1 per roster, faction-locked
// ability is cosmetic description; abilityFn applies in Squad constructor
const SPECIAL_UNITS = {
  Praetorian:  { hp:840,  atk:25, arm_m:30, arm_r:25, spd:1.6, rng:1, aspd:0.9, symbol:'🏛', color:'#e0c97f', label:'Преторианец', cost:45, tier:'ELITE',     faction:'Rome',    abilityLabel:'Testudo: иммунитет к стрелам' },
  HorseArcher: { hp:540,  atk:18, arm_m: 8, arm_r: 5, spd:4.2, rng:5, aspd:1.0, symbol:'🏹', color:'#f5a623', label:'Конный лучник',cost:40, tier:'RARE',      faction:'Huns',    abilityLabel:'Кайт: атака в движении'      },
  Chariot:     { hp:900,  atk:35, arm_m:12, arm_r: 8, spd:3.2, rng:1, aspd:1.2, symbol:'🔥', color:'#ff7043', label:'Колесница',   cost:50, tier:'ELITE',     faction:'Egypt',   abilityLabel:'Давка: +1 AoE в ряд'         },
  WarElephant: { hp:1800, atk:50, arm_m:15, arm_r:10, spd:2.0, rng:1, aspd:0.6, symbol:'🐘', color:'#ff9800', label:'Боевой слон', cost:60, tier:'LEGENDARY',  faction:'Egypt',   abilityLabel:'Страх: -20% ATK врагов рядом' },
  Berserker:   { hp:510,  atk:30, arm_m: 8, arm_r: 5, spd:3.2, rng:1, aspd:1.3, symbol:'🪓', color:'#ef5350', label:'Берсерк',     cost:38, tier:'RARE',      faction:'Britons', abilityLabel:'Ярость: ATK растёт с потерей HP' },
  Hoplite:     { hp:780,  atk:22, arm_m:30, arm_r:20, spd:1.7, rng:2, aspd:0.9, symbol:'Σ', color:'#80cbc4', label:'Гоплит',       cost:42, tier:'ELITE',     faction:'Greeks',  abilityLabel:'Фаланга: +50% ARM в строю'   },
};

const COUNTERS = {
  Swordsman:  { Swordsman:1.00, Archer:1.25, Cavalry:1.00, Spearman:1.50, General:1.00, Praetorian:1.00, HorseArcher:1.25, Chariot:1.00, WarElephant:0.75, Berserker:1.00, Hoplite:1.25 },
  Archer:     { Swordsman:1.25, Archer:1.00, Cavalry:0.50, Spearman:1.00, General:1.00, Praetorian:0.25, HorseArcher:0.75, Chariot:0.75, WarElephant:0.50, Berserker:1.00, Hoplite:1.00 },
  Cavalry:    { Swordsman:1.00, Archer:1.75, Cavalry:1.00, Spearman:0.50, General:1.00, Praetorian:1.00, HorseArcher:1.50, Chariot:1.00, WarElephant:0.50, Berserker:1.00, Hoplite:0.75 },
  Spearman:   { Swordsman:1.00, Archer:1.00, Cavalry:2.00, Spearman:1.00, General:1.00, Praetorian:1.00, HorseArcher:1.75, Chariot:1.75, WarElephant:1.50, Berserker:1.00, Hoplite:1.00 },
  General:    { Swordsman:1.00, Archer:1.00, Cavalry:1.00, Spearman:1.00, General:1.00, Praetorian:1.00, HorseArcher:1.00, Chariot:1.00, WarElephant:1.00, Berserker:1.00, Hoplite:1.00 },
  Praetorian: { Swordsman:1.25, Archer:1.00, Cavalry:1.00, Spearman:1.00, General:1.00, Praetorian:1.00, HorseArcher:1.00, Chariot:1.00, WarElephant:0.75, Berserker:1.25, Hoplite:1.00 },
  HorseArcher:{ Swordsman:1.25, Archer:1.00, Cavalry:0.75, Spearman:1.00, General:1.00, Praetorian:0.50, HorseArcher:1.00, Chariot:0.75, WarElephant:0.50, Berserker:1.00, Hoplite:1.00 },
  Chariot:    { Swordsman:1.25, Archer:1.50, Cavalry:1.00, Spearman:0.75, General:1.25, Praetorian:1.00, HorseArcher:1.25, Chariot:1.00, WarElephant:0.75, Berserker:1.25, Hoplite:0.75 },
  WarElephant:{ Swordsman:1.50, Archer:1.50, Cavalry:1.50, Spearman:1.00, General:1.50, Praetorian:1.25, HorseArcher:1.50, Chariot:1.25, WarElephant:1.00, Berserker:1.25, Hoplite:1.00 },
  Berserker:  { Swordsman:1.25, Archer:1.50, Cavalry:1.00, Spearman:1.00, General:1.25, Praetorian:0.75, HorseArcher:1.25, Chariot:1.00, WarElephant:0.75, Berserker:1.00, Hoplite:0.75 },
  Hoplite:    { Swordsman:1.00, Archer:1.25, Cavalry:1.75, Spearman:1.00, General:1.00, Praetorian:1.00, HorseArcher:1.25, Chariot:1.25, WarElephant:0.75, Berserker:1.25, Hoplite:1.00 },
};

const FACTIONS = {
  Rome:    { name:'Рим',    icon:'🛡', hp:1.10, atk:1.00, arm:1.25, spd:0.80 },
  Huns:    { name:'Гунны',  icon:'🐎', hp:0.90, atk:1.05, arm:0.80, spd:1.30 },
  Egypt:   { name:'Египет', icon:'☀', hp:1.00, atk:1.10, arm:1.00, spd:1.00 },
  Britons: { name:'Бриты',  icon:'⚡', hp:1.00, atk:1.20, arm:0.85, spd:1.10 },
  Greeks:  { name:'Греки',  icon:'Σ',  hp:1.05, atk:1.00, arm:1.20, spd:0.85 },
};

// ── STATE ──────────────────────────────────────────────
let G = {
  phase: 'setup',
  playerFaction: 'Rome',
  botFaction:    'Rome',
  playerRoster:  [],
  botRoster:     [],
  playerCoins:   BUDGET,
  botCoins:      BUDGET,
  squads:        [],
  planSelected:  null,
  orders: [],
  arrows:        [],
  battleTimer:   0,
  botThinkTimer: 0,
  kills:         { player:0, bot:0 },
  paused:        false,
  simSelected:   null,
};

// ── CANVAS / CELL ──────────────────────────────────────
let canvas, ctx, CELL;

// ═══════════════════════════════════════════════════════
//  SQUAD
// ═══════════════════════════════════════════════════════
class Squad {
  constructor(type, isPlayer, gx, gy) {
    const b = UNIT_BASE[type] || SPECIAL_UNITS[type];
    const f = FACTIONS[isPlayer ? G.playerFaction : G.botFaction];
    this.id        = Math.random().toString(36).slice(2,8);
    this.type      = type;
    this.isPlayer  = isPlayer;
    this.label     = b.label;
    this.symbol    = b.symbol;
    this.baseColor = b.color;
    this.color     = isPlayer ? '#2979ff' : '#e53935';
    this.isSpecial = !!SPECIAL_UNITS[type];
    this.abilityLabel = b.abilityLabel || null;
    this.maxHp     = Math.round(b.hp * f.hp * SQUAD_UNITS);
    this.hp        = this.maxHp;
    this.atk       = b.atk  * f.atk;
    this.arm_m     = Math.round(b.arm_m * f.arm);
    this.arm_r     = Math.round(b.arm_r * f.arm);
    this.spd       = b.spd  * f.spd * SPD_SCALE;
    this.rng       = b.rng;
    this.aspd      = b.aspd;
    this.x = this.tx = gx;
    this.y = this.ty = gy;
    this.alive     = true;
    this.target    = null;
    this.planTarget= null;
    this.lastAtk   = 0;
    this.hasOrder  = isPlayer ? null : 'attack';
    // Special ability state
    if (type === 'Berserker') this._baseAtk = this.atk;
    if (type === 'Praetorian') this.arm_r = 999; // immune to arrows
  }
  cx()  { return this.x + SQUAD_COLS / 2; }
  cy()  { return this.y + 0.5; }
  distTo(o) {
    const dx = this.cx()-o.cx(), dy = this.cy()-o.cy();
    return Math.sqrt(dx*dx + dy*dy);
  }
  inRange(o) { return this.distTo(o) <= this.rng + SQUAD_COLS/2; }
  dealDamage(o) {
    const ctr = COUNTERS[this.type]?.[o.type] ?? 1;
    const arm = this.rng > 2 ? o.arm_r : o.arm_m;
    let atk = this.atk;
    if (this._fearDebuff) { atk *= 0.8; this._fearDebuff = false; }
    return Math.max(1, Math.round(atk * ctr * (1 - arm/100) * SQUAD_UNITS));
  }
}

// ═══════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════
function getUnitDef(type) {
  return UNIT_BASE[type] || SPECIAL_UNITS[type];
}
function getRosterCost(roster) {
  return roster.reduce((s, t) => s + getUnitDef(t).cost, 0);
}
function getCoins(side) {
  return side === 'player' ? G.playerCoins : G.botCoins;
}
function setCoins(side, v) {
  if (side === 'player') G.playerCoins = v;
  else G.botCoins = v;
}

function selectFaction(side, faction, btn) {
  if (side==='player') G.playerFaction = faction;
  else                 G.botFaction    = faction;
  btn.closest('.faction-grid').querySelectorAll('.faction-btn')
     .forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  renderRoster(side);   // refresh special unit availability
}

function addSquad(side, type) {
  const r    = side==='player' ? G.playerRoster : G.botRoster;
  const def  = getUnitDef(type);
  const coins= getCoins(side);
  if (r.length >= MAX_SQUADS)       return flashCoins(side, 'Максимум ' + MAX_SQUADS + ' отрядов');
  if (def.cost > coins)             return flashCoins(side, 'Не хватает монет!');
  // Special units: max 1 per roster
  if (SPECIAL_UNITS[type] && r.includes(type)) return flashCoins(side, 'Уже есть в армии!');
  r.push(type);
  setCoins(side, coins - def.cost);
  renderRoster(side);
}

function removeSquad(side, i) {
  const r    = side==='player' ? G.playerRoster : G.botRoster;
  const type = r[i];
  const cost = getUnitDef(type).cost;
  r.splice(i, 1);
  setCoins(side, getCoins(side) + cost);
  renderRoster(side);
}

function flashCoins(side, msg) {
  const el = document.getElementById(side + '-coins-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

function renderRoster(side) {
  const r      = side==='player' ? G.playerRoster : G.botRoster;
  const coins  = getCoins(side);
  const faction= side==='player' ? G.playerFaction : G.botFaction;

  // Count display
  document.getElementById(side+'-count').textContent =
    r.length + ' / ' + MAX_SQUADS + ' отрядов  (мин. ' + MIN_SQUADS + ')';

  // Coins display
  const coinEl = document.getElementById(side+'-coins');
  if (coinEl) {
    coinEl.textContent = '💰 ' + coins + ' монет';
    coinEl.style.color = coins < 15 ? '#ff4444' : coins < 30 ? '#ffa726' : '#f5a623';
  }

  // Recruited list
  const el = document.getElementById(side+'-squads');
  el.innerHTML = '';
  r.forEach((t, i) => {
    const b  = getUnitDef(t);
    const d  = document.createElement('div');
    d.className = 'squad-tag' + (SPECIAL_UNITS[t] ? ' squad-tag-special' : '');
    d.innerHTML = `
      <span class="squad-tag-info">
        ${b.symbol} <strong>${b.label}</strong>
        <span class="squad-tag-cost">−${b.cost}🪙</span>
        ${SPECIAL_UNITS[t] ? '<span class="squad-tier tier-'+b.tier.toLowerCase()+'">'+b.tier+'</span>' : ''}
      </span>
      <button class="remove-btn" onclick="removeSquad('${side}',${i})">×</button>`;
    el.appendChild(d);
  });

  // Rebuild unit buttons
  renderUnitButtons(side, faction, coins, r);

  // Start button state
  const ok = G.playerRoster.length >= MIN_SQUADS && G.botRoster.length >= MIN_SQUADS;
  document.getElementById('start-btn').disabled = !ok;
  document.getElementById('start-hint').textContent =
    ok ? 'Готово! Нажми В БОЙ' : `Recruit at least ${MIN_SQUADS} squads per side`;
}

function renderUnitButtons(side, faction, coins, roster) {
  const container = document.getElementById(side + '-unit-btns');
  if (!container) return;
  container.innerHTML = '';

  // Regular units
  const regularTypes = ['Swordsman','Archer','Cavalry','Spearman','General'];
  regularTypes.forEach(type => {
    const b = UNIT_BASE[type];
    const canAfford = coins >= b.cost;
    const canAdd    = roster.length < MAX_SQUADS && canAfford;
    const btn = document.createElement('button');
    btn.className = 'unit-btn' + (canAfford ? '' : ' unit-btn-broke');
    btn.disabled  = !canAdd;
    btn.innerHTML = `${b.symbol} ${b.label} <span class="unit-cost">${b.cost}🪙</span>`;
    btn.onclick   = () => addSquad(side, type);
    container.appendChild(btn);
  });

  // Divider + special units for this faction
  const specialTypes = Object.keys(SPECIAL_UNITS).filter(k => SPECIAL_UNITS[k].faction === faction);
  if (specialTypes.length) {
    const div = document.createElement('div');
    div.className = 'unit-btns-divider';
    div.textContent = '✦ ЭЛИТА ФРАКЦИИ';
    container.appendChild(div);

    specialTypes.forEach(type => {
      const b = SPECIAL_UNITS[type];
      const alreadyHave = roster.includes(type);
      const canAfford   = coins >= b.cost && !alreadyHave && roster.length < MAX_SQUADS;
      const btn = document.createElement('button');
      btn.className = 'unit-btn unit-btn-special' +
        (alreadyHave ? ' unit-btn-taken' : canAfford ? '' : ' unit-btn-broke');
      btn.disabled = !canAfford || alreadyHave;
      btn.innerHTML = `
        <span>${b.symbol} ${b.label}</span>
        <span class="unit-cost ${b.tier.toLowerCase()}-cost">${b.cost}🪙</span>
        <span class="unit-btn-ability">${b.abilityLabel}</span>`;
      btn.onclick = () => addSquad(side, type);
      container.appendChild(btn);
    });
  }
}

// ═══════════════════════════════════════════════════════
//  PLACEMENT  (replaces old deploy — now one shared canvas)
// ═══════════════════════════════════════════════════════
let placingFor = null;   // 'player' | 'bot' | null
let placingType = null;

function startPlacement() {
  if (G.playerRoster.length < MIN_SQUADS || G.botRoster.length < MIN_SQUADS) return;
  G.phase = 'placement';
  G.squads = [];
  G.orders = [];
  G.planSelected = null;
  showScreen('deploy');

  canvas = document.getElementById('gameCanvas');
  resizeCanvas(canvas);
  ctx = canvas.getContext('2d');
  CELL = canvas.width / GRID;

  document.getElementById('deploy-player-faction').textContent =
    FACTIONS[G.playerFaction].icon + ' ' + FACTIONS[G.playerFaction].name;
  document.getElementById('deploy-bot-faction').textContent =
    FACTIONS[G.botFaction].icon + ' ' + FACTIONS[G.botFaction].name;

  renderPlacementCards();
  draw();
  canvas.addEventListener('mousedown', onPlacementClick);
}

function resizeCanvas(c) {
  const wrap = c.parentElement;
  const size = Math.min(wrap.clientWidth - 24, wrap.clientHeight - 60);
  c.width = c.height = size;
}

function renderPlacementCards() {
  // Player side
  const pl = document.getElementById('deploy-player-units');
  pl.innerHTML = '';
  G.playerRoster.forEach((type, i) => {
    const placed = G.squads.filter(s => s.isPlayer && s.type === type).length >
                   G.playerRoster.slice(0,i).filter(t=>t===type).length;
    const card = makePlacementCard(type, true, placed);
    if (!placed) card.addEventListener('click', () => startPlacingSquad('player', type, card));
    pl.appendChild(card);
  });

  // Bot side
  const bl = document.getElementById('deploy-bot-units');
  bl.innerHTML = '';
  G.botRoster.forEach((type, i) => {
    const placed = G.squads.filter(s => !s.isPlayer && s.type === type).length >
                   G.botRoster.slice(0,i).filter(t=>t===type).length;
    const card = makePlacementCard(type, false, placed);
    if (!placed) card.addEventListener('click', () => startPlacingSquad('bot', type, card));
    bl.appendChild(card);
  });

  updatePlanBtnVisibility();
}

function makePlacementCard(type, isPlayer, placed) {
  const b = getUnitDef(type);
  const c = document.createElement('div');
  c.className = 'unit-card' + (placed ? ' deployed' : '');
  c.innerHTML = `
    <div class="unit-card-header">
      <span class="unit-card-name">${b.symbol} ${b.label}</span>
      <span class="unit-card-type" style="color:${b.color}">${placed?'✓ размещён':''}</span>
    </div>
    <div style="font-size:9px;color:var(--text2)">HP ${b.hp*SQUAD_UNITS} · SPD ${b.spd} · RNG ${b.rng}</div>`;
  return c;
}

function startPlacingSquad(side, type, card) {
  placingFor  = side;
  placingType = type;
  // Highlight active card
  document.querySelectorAll('.unit-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const zone = side === 'player' ? 'синюю (нижнюю)' : 'красную (верхнюю)';
  document.getElementById('canvas-hint').textContent =
    `Кликни в ${zone} зону чтобы поставить ${getUnitDef(type).label}`;
}

function onPlacementClick(e) {
  if (!placingFor) return;
  const rect = canvas.getBoundingClientRect();
  const gx = Math.floor((e.clientX - rect.left) / CELL);
  const gy = Math.floor((e.clientY - rect.top)  / CELL);

  // Zone check
  const isPlayer = placingFor === 'player';
  if (isPlayer  && gy < GRID - 14) return;
  if (!isPlayer && gy > 13)        return;
  if (gx + SQUAD_COLS > GRID || gx < 0) return;

  // Collision check
  if (G.squads.some(s =>
    Math.abs(s.x - gx) < SQUAD_COLS + 1 && Math.abs(s.y - gy) < 2
  )) return;

  const sq = new Squad(placingType, isPlayer, gx, gy);
  G.squads.push(sq);
  placingFor = placingType = null;
  document.querySelectorAll('.unit-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('canvas-hint').textContent = 'Выбери следующий отряд';
  renderPlacementCards();
  draw();
}

function updatePlanBtnVisibility() {
  const playerPlaced = G.squads.filter(s =>  s.isPlayer).length;
  const botPlaced    = G.squads.filter(s => !s.isPlayer).length;
  const btn = document.getElementById('deploy-start-btn');
  const allPlaced = playerPlaced === G.playerRoster.length &&
                    botPlaced    === G.botRoster.length;
  btn.disabled = playerPlaced === 0;
  btn.textContent = allPlaced
    ? '📋 ПЛАН АТАКИ →'
    : `📋 ATTACK PLAN (${playerPlaced}/${G.playerRoster.length} своих, ${botPlaced}/${G.botRoster.length} бота)`;
}

// ═══════════════════════════════════════════════════════
//  PLANNING PHASE
// ═══════════════════════════════════════════════════════
function startPlanning() {
  canvas.removeEventListener('mousedown', onPlacementClick);
  G.phase = 'planning';
  G.planSelected = null;
  G.orders = [];

  // Switch to planning screen (reuse deploy screen, change banner + sidebar)
  document.getElementById('deploy-banner').textContent = '📋 ПЛАН АТАКИ — задай приказы своим отрядам';
  document.getElementById('deploy-banner').style.color = '#f5a623';
  document.getElementById('canvas-hint').textContent =
    '1. Кликни свой отряд (синий)  →  2. Кликни пустое место (движение) или врага (атака)';
  document.getElementById('deploy-start-btn').textContent = '▶ НАЧАТЬ СИМУЛЯЦИЮ';
  document.getElementById('deploy-start-btn').disabled = false;
  document.getElementById('deploy-start-btn').onclick = startSimulation;

  // Rebuild sidebars for planning
  renderPlanSidebar();
  draw();
  canvas.addEventListener('mousedown', onPlanningClick);
}

function renderPlanSidebar() {
  // Player panel: clickable unit cards
  const pl = document.getElementById('deploy-player-units');
  pl.innerHTML = '<div class="sidebar-label" style="margin-bottom:4px">Click squad to select</div>';
  G.squads.filter(s => s.isPlayer).forEach(sq => {
    const order = G.orders.find(o => o.squad === sq);
    const card = document.createElement('div');
    card.className = 'unit-card' + (G.planSelected === sq ? ' selected' : '');
    card.id = 'pcard-' + sq.id;
    card.innerHTML = `
      <div class="unit-card-header">
        <span class="unit-card-name">${sq.symbol} ${sq.label}</span>
        <span class="unit-card-type" style="color:${order ? '#f5a623' : 'var(--text2)'}">
          ${order ? (order.type==='attack' ? '⚔ атака' : '→ движение') : 'нет приказа'}
        </span>
      </div>`;
    card.addEventListener('click', () => selectPlanSquad(sq));
    pl.appendChild(card);
  });

  // Bot panel: info only
  const bl = document.getElementById('deploy-bot-units');
  bl.innerHTML = '<div class="sidebar-label" style="margin-bottom:4px">Bot squads (targets)</div>';
  G.squads.filter(s => !s.isPlayer).forEach(sq => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.style.cursor = 'default';
    card.innerHTML = `
      <div class="unit-card-header">
        <span class="unit-card-name">${sq.symbol} ${sq.label}</span>
        <span class="unit-card-type" style="color:${sq.baseColor}">${sq.label}</span>
      </div>
      <div style="font-size:9px;color:var(--text2)">HP ${sq.maxHp} · RNG ${sq.rng}</div>`;
    bl.appendChild(card);
  });
}

function selectPlanSquad(sq) {
  G.planSelected = sq;
  renderPlanSidebar();
  document.getElementById('canvas-hint').textContent =
    `${sq.symbol} ${sq.label} выбран → кликни пустую клетку (движение) или вражеский отряд (атака)`;
  draw();
}

function onPlanningClick(e) {
  const rect = canvas.getBoundingClientRect();
  const gx = Math.floor((e.clientX - rect.left) / CELL);
  const gy = Math.floor((e.clientY - rect.top)  / CELL);

  const clicked = G.squads.find(sq =>
    sq.alive &&
    gx >= Math.floor(sq.x) && gx < Math.floor(sq.x) + SQUAD_COLS &&
    Math.abs(gy - Math.floor(sq.y)) < 1
  );

  // Click own squad → select
  if (clicked?.isPlayer) {
    selectPlanSquad(clicked);
    return;
  }

  if (!G.planSelected) return;

  // Click enemy → attack order
  if (clicked && !clicked.isPlayer) {
    setOrder(G.planSelected, { type:'attack', targetId: clicked.id });
    G.planSelected = null;
    renderPlanSidebar();
    document.getElementById('canvas-hint').textContent = 'Выбери следующий отряд';
    draw();
    return;
  }

  // Click empty → move order
  const sx = Math.max(0, Math.min(GRID - SQUAD_COLS, gx));
  const sy = Math.max(0, Math.min(GRID - 1, gy));
  setOrder(G.planSelected, { type:'move', tx: sx, ty: sy });
  G.planSelected = null;
  renderPlanSidebar();
  document.getElementById('canvas-hint').textContent = 'Выбери следующий отряд';
  draw();
}

function setOrder(sq, order) {
  G.orders = G.orders.filter(o => o.squad !== sq);
  G.orders.push({ squad: sq, ...order });
}

// ═══════════════════════════════════════════════════════
//  DRAW  (shared for placement + planning)
// ═══════════════════════════════════════════════════════
function drawBattlefield(ctx, sz) {
  // Base ground — dark earth
  const ground = ctx.createLinearGradient(0, 0, 0, sz);
  ground.addColorStop(0,   '#0e0b07');
  ground.addColorStop(0.3, '#100d08');
  ground.addColorStop(0.5, '#0d0b06');
  ground.addColorStop(0.7, '#100d08');
  ground.addColorStop(1,   '#0e0b07');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, sz, sz);

  // Dirt patches — subtle noise texture
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 60; i++) {
    const px = (Math.sin(i * 137.5) * 0.5 + 0.5) * sz;
    const py = (Math.cos(i * 97.3)  * 0.5 + 0.5) * sz;
    const pr = 12 + (i % 7) * 6;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, '#6b5a3a');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Zone tints
  const isPlanning = G.phase === 'planning';
  ctx.fillStyle = 'rgba(139,30,20,0.07)';
  ctx.fillRect(0, 0, sz, isPlanning ? sz/2 : CELL*14);
  ctx.fillStyle = 'rgba(26,58,110,0.07)';
  ctx.fillRect(0, isPlanning ? sz/2 : CELL*(GRID-14), sz, isPlanning ? sz/2 : CELL*14);

  // Fine grid lines
  ctx.strokeStyle = 'rgba(100,80,40,0.08)'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i*CELL, 0);   ctx.lineTo(i*CELL, sz);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*CELL);   ctx.lineTo(sz, i*CELL);  ctx.stroke();
  }

  // Mid line — battle line
  ctx.save();
  ctx.strokeStyle = 'rgba(180,130,50,0.3)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(0, sz/2); ctx.lineTo(sz, sz/2); ctx.stroke();
  ctx.setLineDash([]);
  // Center diamond ornament
  const cx = sz/2, cy = sz/2, d = CELL * 0.7;
  ctx.strokeStyle = 'rgba(180,130,50,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy-d); ctx.lineTo(cx+d, cy);
  ctx.lineTo(cx, cy+d); ctx.lineTo(cx-d, cy);
  ctx.closePath(); ctx.stroke();
  ctx.restore();

  // Vignette
  const vig = ctx.createRadialGradient(sz/2, sz/2, sz*0.3, sz/2, sz/2, sz*0.75);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, sz, sz);
}

function draw() {
  if (!ctx) return;
  const sz = canvas.width;
  ctx.clearRect(0, 0, sz, sz);
  drawBattlefield(ctx, sz);

  // Zone labels (placement only)
  if (G.phase === 'placement') {
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(CELL*0.55)}px 'Cinzel', serif`;
    ctx.fillStyle = 'rgba(192,57,43,0.2)';
    ctx.fillText('ЗОНА ПРОТИВНИКА', sz/2, CELL*6.5);
    ctx.fillStyle = 'rgba(46,95,168,0.2)';
    ctx.fillText('ВАША ЗОНА', sz/2, CELL*(GRID-6.5));
  }

  // Planning: draw order arrows
  if (G.phase === 'planning') {
    G.orders.forEach(o => {
      const sq = o.squad;
      const fromX = sq.cx() * CELL, fromY = sq.cy() * CELL;
      if (o.type === 'move') {
        const toX = (o.tx + SQUAD_COLS/2) * CELL, toY = (o.ty + 0.5) * CELL;
        drawArrowLine(ctx, fromX, fromY, toX, toY, '#c9973a', 2, [5,4]);
        // Destination ghost
        ctx.strokeStyle = 'rgba(201,151,58,0.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(o.tx*CELL+2, o.ty*CELL+2, SQUAD_COLS*CELL-4, CELL-4);
      } else {
        const target = G.squads.find(s => s.id === o.targetId);
        if (target) {
          drawArrowLine(ctx, fromX, fromY, target.cx()*CELL, target.cy()*CELL, '#ff4444', 2, []);
        }
      }
    });

    // Selected squad highlight ring
    if (G.planSelected) {
      const sq = G.planSelected;
      ctx.beginPath();
      ctx.arc(sq.cx()*CELL, sq.cy()*CELL, SQUAD_COLS*CELL*0.7, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(245,166,35,0.5)'; ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Squads
  G.squads.forEach(sq => drawSquad(ctx, sq, sq === G.planSelected));
}

function drawArrowLine(ctx, x1, y1, x2, y2, color, lw, dash) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.setLineDash(dash || []);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  // Arrowhead
  const angle = Math.atan2(y2-y1, x2-x1);
  const al = Math.max(8, CELL*0.4);
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - al*Math.cos(angle-0.4), y2 - al*Math.sin(angle-0.4));
  ctx.lineTo(x2 - al*Math.cos(angle+0.4), y2 - al*Math.sin(angle+0.4));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════════════════════
let battleRunning = false, lastTime = 0;

function startSimulation() {
  canvas.removeEventListener('mousedown', onPlanningClick);
  G.phase = 'simulation';
  G.arrows = [];
  G.battleTimer = 0;
  G.botThinkTimer = 0;
  G.kills = { player:0, bot:0 };
  G.paused = false;

  // Apply planning orders to squads
  G.squads.filter(s => s.isPlayer).forEach(sq => {
    sq.hasOrder = null;  // reset
    const order = G.orders.find(o => o.squad === sq);
    if (order) {
      if (order.type === 'move') {
        sq.tx = order.tx; sq.ty = order.ty;
        sq.planTarget = null;
        sq.hasOrder = 'move';
      } else if (order.type === 'attack') {
        sq.planTarget = G.squads.find(s => s.id === order.targetId) || null;
        sq.hasOrder = 'attack';
      }
    }
    // No order → hasOrder stays null → stands still
  });

  showScreen('battle');

  canvas = document.getElementById('battleCanvas');
  resizeCanvas(canvas);
  ctx = canvas.getContext('2d');
  CELL = canvas.width / GRID;

  document.getElementById('battle-player-faction').textContent =
    FACTIONS[G.playerFaction].icon + ' ' + FACTIONS[G.playerFaction].name;
  document.getElementById('battle-bot-faction').textContent =
    FACTIONS[G.botFaction].icon + ' ' + FACTIONS[G.botFaction].name;

  buildSimSidebar();
  document.addEventListener('keydown', onKey);

  canvas.addEventListener('mousedown', onSimClick);

  battleRunning = true;
  lastTime = performance.now();
  // Set initial banner hint
  document.getElementById('battle-banner').textContent = '⚔ СИМУЛЯЦИЯ — кликни свой отряд для управления';
  requestAnimationFrame(simLoop);
}

function buildSimSidebar() {
  ['player','bot'].forEach(side => {
    const isP = side==='player';
    const el = document.getElementById('battle-'+side+'-units');
    el.innerHTML = '';
    G.squads.filter(s => s.isPlayer===isP).forEach(sq => {
      const card = document.createElement('div');
      card.className = 'unit-card';
      card.id = 'card-'+sq.id;
      const order = G.orders.find(o => o.squad===sq);
      const orderInfo = !isP ? '' :
        order ? (order.type==='attack' ? `<div style="font-size:9px;color:#ff6b6b">⚔ атакует ${
          G.squads.find(s=>s.id===order.targetId)?.label||'?'}</div>`
          : `<div style="font-size:9px;color:#f5a623">→ движется</div>`)
        : `<div style="font-size:9px;color:var(--text2)">авто</div>`;
      card.innerHTML = `
        <div class="unit-card-header">
          <span class="unit-card-name">${sq.symbol} ${sq.label}</span>
          <span class="unit-card-type" id="hptxt-${sq.id}"
            style="color:${sq.baseColor}">${sq.maxHp} HP</span>
        </div>
        <div class="unit-hp-bar">
          <div class="unit-hp-fill" id="hpbar-${sq.id}"
            style="width:100%;background:${isP?'#2979ff':'#e53935'}"></div>
        </div>
        ${orderInfo}`;
      if (isP) {
        card.title = 'Кликни чтобы выбрать и управлять';
        card.addEventListener('click', () => {
          if (!sq.alive) return;
          G.simSelected = sq;
          updateSimSidebarSelection();
        });
      }
      el.appendChild(card);
    });
  });
}

// ── SIMULATION CLICK CONTROL ───────────────────────────
function onSimClick(e) {
  if (!battleRunning || G.paused) return;
  const rect = canvas.getBoundingClientRect();
  const gx = (e.clientX - rect.left) / CELL;
  const gy = (e.clientY - rect.top)  / CELL;

  const clicked = G.squads.find(sq =>
    sq.alive &&
    gx >= sq.x && gx < sq.x + SQUAD_COLS &&
    gy >= sq.y - 0.5 && gy < sq.y + 1.5
  );

  // Click own alive squad → select it
  if (clicked?.isPlayer) {
    G.simSelected = clicked;
    updateSimSidebarSelection();
    addLog(`▶ Выбран: ${clicked.symbol} ${clicked.label}`, '');
    return;
  }

  if (!G.simSelected || !G.simSelected.alive) {
    G.simSelected = null;
    return;
  }

  // Click enemy → redirect attack
  if (clicked && !clicked.isPlayer) {
    G.simSelected.planTarget = clicked;
    G.simSelected.target     = clicked;
    G.simSelected.hasOrder   = 'attack';
    addLog(`⚔ ${G.simSelected.symbol} → ${clicked.symbol} ${clicked.label}`, 'hit-player');
    G.simSelected = null;
    updateSimSidebarSelection();
    return;
  }

  // Click empty cell → move order
  const tx = Math.max(0, Math.min(GRID - SQUAD_COLS, Math.floor(gx)));
  const ty = Math.max(0, Math.min(GRID - 1,          Math.floor(gy)));
  G.simSelected.tx         = tx;
  G.simSelected.ty         = ty;
  G.simSelected.planTarget = null;
  G.simSelected.target     = null;
  G.simSelected.hasOrder   = 'move';
  addLog(`→ ${G.simSelected.symbol} движется на (${tx},${ty})`, 'hit-player');
  G.simSelected = null;
  updateSimSidebarSelection();
}

function updateSimSidebarSelection() {
  document.querySelectorAll('#battle-player-units .unit-card').forEach(c => {
    c.classList.remove('selected');
  });
  if (G.simSelected) {
    const card = document.getElementById('card-' + G.simSelected.id);
    if (card) card.classList.add('selected');
  }
  // Update banner hint
  const banner = document.getElementById('battle-banner');
  if (G.simSelected) {
    banner.textContent = `▶ ${G.simSelected.symbol} ${G.simSelected.label} — кликни врага (атака) или поле (движение)`;
  } else {
    banner.textContent = '⚔ СИМУЛЯЦИЯ — кликни свой отряд для управления';
  }
}


function simLoop(ts) {
  if (!battleRunning || G.paused) return;
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;
  G.battleTimer    += dt;
  G.botThinkTimer  += dt;

  if (G.botThinkTimer >= BOT_THINK_MS) {
    G.botThinkTimer = 0;
    runBotAI();
  }

  updateSquads(dt);
  updateArrows(dt);
  updateParticles(dt);

  const remaining = BATTLE_DURATION - G.battleTimer;
  if (remaining <= 0) { endBattle('timeout'); return; }
  const won = checkWin();
  if (won) { endBattle(won); return; }

  drawSim(remaining);
  requestAnimationFrame(simLoop);
}

function updateSquads(dt) {
  G.squads.forEach(sq => {
    if (!sq.alive) return;

    // ── SPECIAL ABILITIES (passive) ──
    // Berserker rage: ATK scales with lost HP
    if (sq.type === 'Berserker') {
      const hpPct = sq.hp / sq.maxHp;
      sq.atk = sq._baseAtk * (1 + (1 - hpPct) * 0.6);
    }
    // War Elephant fear aura: reduce nearby enemy ATK
    if (sq.type === 'WarElephant') {
      G.squads.forEach(o => {
        if (o.alive && o.isPlayer !== sq.isPlayer && sq.distTo(o) <= 3) {
          o._fearDebuff = true;
        }
      });
    }

    // Clear dead references
    if (sq.planTarget && !sq.planTarget.alive) sq.planTarget = null;
    if (sq.target     && !sq.target.alive)     sq.target     = null;

    // SELF-DEFENCE: enemy already inside attack range → fight, don't move
    const inRangeEnemy = G.squads.find(o =>
      o.alive && o.isPlayer !== sq.isPlayer && sq.inRange(o)
    );
    if (inRangeEnemy) {
      sq.target = (sq.planTarget && sq.inRange(sq.planTarget))
        ? sq.planTarget : inRangeEnemy;
      doAttack(sq);
      return;
    }

    // ATTACK ORDER: march toward assigned target
    if (sq.planTarget) {
      moveTo(sq, sq.planTarget.x, sq.planTarget.y, dt);
      return;
    }

    // MOVE ORDER: walk to position, stop when arrived
    if (sq.hasOrder === "move") {
      const dx = sq.tx - sq.x, dy = sq.ty - sq.y;
      if (Math.sqrt(dx*dx + dy*dy) > 0.15) {
        moveTo(sq, sq.tx, sq.ty, dt);
      }
      return;
    }

    // BOT / attack order without specific plan target → auto-hunt nearest
    if (sq.hasOrder === "attack") {
      if (!sq.target || !sq.target.alive) sq.target = findNearest(sq);
      if (sq.target) {
        if (sq.inRange(sq.target)) doAttack(sq);
        else moveTo(sq, sq.target.x, sq.target.y, dt);
      }
      return;
    }

    // NO ORDER: stand still (do nothing)
  });
}

function moveTo(sq, tx, ty, dt) {
  const dx = tx - sq.x, dy = ty - sq.y;
  const d  = Math.sqrt(dx*dx + dy*dy);
  if (d < 0.05) return;
  const step = sq.spd * dt;
  if (step >= d) { sq.x = tx; sq.y = ty; }
  else { sq.x += dx/d*step; sq.y += dy/d*step; }
  sq.x = Math.max(0, Math.min(GRID-SQUAD_COLS, sq.x));
  sq.y = Math.max(0, Math.min(GRID-1, sq.y));

  // Smoke from cavalry hooves
  const isCav = sq.type === 'Cavalry' || sq.type === 'HorseArcher' || sq.type === 'Chariot';
  if (isCav && d > 0.1) {
    sq._smokeTimer = (sq._smokeTimer || 0) + dt;
    if (sq._smokeTimer > 120) {
      sq._smokeTimer = 0;
      spawnSmokeAt(sq.cx() * CELL, (sq.y + 1) * CELL);
    }
  }
}

function doAttack(sq) {
  const now = performance.now();
  if (now - sq.lastAtk < ATTACK_INTERVAL / sq.aspd) return;
  sq.lastAtk = now;
  const t = sq.target;
  if (!t?.alive) return;
  const dmg = sq.dealDamage(t);
  t.hp = Math.max(0, t.hp - dmg);

  if (sq.rng >= 3) {
    G.arrows.push({
      x:sq.cx()*CELL, y:sq.cy()*CELL,
      tx:t.cx()*CELL,  ty:t.cy()*CELL,
      progress:0, color: sq.isPlayer ? '#5c9eff':'#ff6f6b',
    });
    // Arrow sound (not every time)
    if (Math.random() < 0.4) playSound('arrow');
  } else {
    // Sword / cavalry strike sound
    const isCav = sq.type === 'Cavalry' || sq.type === 'HorseArcher' || sq.type === 'Chariot' || sq.type === 'WarElephant';
    if (Math.random() < 0.5) playSound(isCav ? 'cavalry' : 'sword');
  }

  const ctr = COUNTERS[sq.type][t.type];
  const cs  = ctr>1 ? ` ×${ctr}!` : ctr<1 ? '(слаб)':'';
  addLog(`${sq.symbol}→${t.symbol} −${dmg}${cs}`, sq.isPlayer?'hit-player':'hit-bot');
  updateHpBar(t);

  if (t.hp <= 0) {
    t.alive = false;
    if (t.isPlayer) G.kills.bot++; else G.kills.player++;
    addLog(`💀 ${t.symbol} ${t.label} уничтожен!`, 'kill');
    updateHpBar(t);
    playSound('death');
    const card = document.getElementById('card-'+t.id);
    if (card) { card.classList.add('dead'); card.style.pointerEvents='none'; }
  }
}

function updateArrows(dt) {
  G.arrows.forEach(a => a.progress += 0.004*dt);
  G.arrows = G.arrows.filter(a => a.progress < 1);
}

function findNearest(sq) {
  let best=null, bd=Infinity;
  G.squads.forEach(o => {
    if (o.alive && o.isPlayer!==sq.isPlayer) {
      const d=sq.distTo(o);
      if (d<bd) { bd=d; best=o; }
    }
  });
  return best;
}

function runBotAI() {
  G.squads.filter(s=>!s.isPlayer&&s.alive).forEach(bot=>{
    const players = G.squads.filter(s=>s.isPlayer&&s.alive);
    if (!players.length) return;
    if (bot.type==='Archer') {
      const near=findNearest(bot);
      if (near && bot.distTo(near)<bot.rng-1) {
        const dx=bot.x-near.x, dy=bot.y-near.y, l=Math.sqrt(dx*dx+dy*dy)||1;
        bot.tx=Math.max(0,Math.min(GRID-SQUAD_COLS,bot.x+(dx/l)*4));
        bot.ty=Math.max(0,Math.min(GRID-1,bot.y+(dy/l)*3));
        bot.target=null;
      } else { bot.target=near; }
      return;
    }
    if (bot.type==='Cavalry')  { bot.target=players.find(p=>p.type==='Archer')||findNearest(bot); return; }
    if (bot.type==='Spearman') { bot.target=players.find(p=>p.type==='Cavalry')||findNearest(bot); return; }
    bot.target = findNearest(bot);
  });
}

// ── DRAW SIMULATION ────────────────────────────────────
function drawSim(remaining) {
  const sz = canvas.width;
  ctx.clearRect(0, 0, sz, sz);

  // Battlefield
  drawBattlefield(ctx, sz);

  // Zone tints (battle)
  ctx.fillStyle = 'rgba(139,30,20,0.05)';  ctx.fillRect(0, 0, sz, sz/2);
  ctx.fillStyle = 'rgba(26,58,110,0.05)';  ctx.fillRect(0, sz/2, sz, sz/2);

  // Attack lines — golden threads
  ctx.setLineDash([3, 5]);
  G.squads.forEach(sq => {
    if (!sq.alive || !sq.target?.alive) return;
    ctx.beginPath();
    ctx.moveTo(sq.cx()*CELL, sq.cy()*CELL);
    ctx.lineTo(sq.target.cx()*CELL, sq.target.cy()*CELL);
    ctx.strokeStyle = sq.isPlayer ? 'rgba(92,158,255,0.12)' : 'rgba(224,96,96,0.12)';
    ctx.lineWidth = 1; ctx.stroke();
  });
  ctx.setLineDash([]);

  G.squads.forEach(sq=>drawSquad(ctx,sq, sq===G.simSelected));

  // Destination marker for selected squad moving
  if (G.simSelected?.alive && G.simSelected.hasOrder==='move') {
    const mx = G.simSelected.tx * CELL, my = G.simSelected.ty * CELL;
    ctx.save();
    ctx.strokeStyle='rgba(245,166,35,0.6)'; ctx.lineWidth=1.5;
    ctx.setLineDash([4,3]);
    ctx.strokeRect(mx+2, my+2, SQUAD_COLS*CELL-4, CELL-4);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Selected squad ring — bronze Total War marker
  if (G.simSelected?.alive) {
    const sq = G.simSelected;
    const rx = sq.cx() * CELL, ry = sq.cy() * CELL;
    const rr = SQUAD_COLS * CELL * 0.82;
    // Rotating arc
    const rot = (performance.now() * 0.001) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(rx, ry, rr, rot, rot + Math.PI * 1.5);
    ctx.strokeStyle = 'rgba(201,151,58,0.8)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(201,151,58,0.5)'; ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Corner ticks
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI/2;
      ctx.beginPath();
      ctx.arc(rx, ry, rr, a - 0.15, a + 0.15);
      ctx.strokeStyle = '#e8b96a'; ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  G.arrows.forEach(a => {
    const cx = a.x + (a.tx - a.x) * a.progress;
    const cy = a.y + (a.ty - a.y) * a.progress;
    const angle = Math.atan2(a.ty - a.y, a.tx - a.x);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // Arrow shaft
    ctx.strokeStyle = a.color; ctx.lineWidth = 1.5;
    ctx.shadowColor = a.color; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(-CELL*0.3, 0); ctx.lineTo(CELL*0.3, 0); ctx.stroke();
    // Arrowhead
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.moveTo(CELL*0.3, 0); ctx.lineTo(CELL*0.15, -CELL*0.08); ctx.lineTo(CELL*0.15, CELL*0.08);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Частицы: дым, конфетти
  drawParticles(ctx);

  // Timer bar — Total War style
  const barH = Math.max(6, CELL*0.2);
  const pct  = Math.max(0, remaining/BATTLE_DURATION);
  const secs = Math.ceil(remaining/1000);

  // Bar background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, sz, barH + 4);
  // Bronze border
  ctx.fillStyle = 'rgba(140,100,20,0.4)';
  ctx.fillRect(0, barH + 3, sz, 1);

  // Timer fill with gradient
  const timerGrad = ctx.createLinearGradient(0, 0, sz*pct, 0);
  if (pct > 0.5) {
    timerGrad.addColorStop(0, 'rgba(80,150,50,0.7)');
    timerGrad.addColorStop(1, 'rgba(120,190,80,0.7)');
  } else if (pct > 0.25) {
    timerGrad.addColorStop(0, 'rgba(160,100,20,0.7)');
    timerGrad.addColorStop(1, 'rgba(220,150,30,0.7)');
  } else {
    timerGrad.addColorStop(0, 'rgba(140,20,20,0.8)');
    timerGrad.addColorStop(1, 'rgba(200,40,40,0.8)');
  }
  ctx.fillStyle = timerGrad;
  ctx.fillRect(0, 0, sz*pct, barH);

  // Timer text
  const timeStr = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
  ctx.font = `700 ${Math.max(10, barH*1.5)}px 'Cinzel', serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
  ctx.fillStyle = pct < 0.25 ? '#e05050' : '#c9973a';
  ctx.fillText(timeStr, sz/2, 1);
  ctx.shadowBlur = 0;

  // Pause overlay
  if (G.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, sz, sz);
    // Pause box
    const bw = sz * 0.36, bh = sz * 0.14;
    const bx = (sz - bw) / 2, by = sz/2 - bh/2;
    ctx.fillStyle = 'rgba(12,10,7,0.95)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(180,130,50,0.6)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(180,130,50,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(bx+4, by+4, bw-8, bh-8);
    ctx.font = `700 ${Math.round(sz*0.04)}px 'Cinzel', serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c9973a';
    ctx.shadowColor = 'rgba(201,151,58,0.5)'; ctx.shadowBlur = 12;
    ctx.fillText('⏸  PAUSA', sz/2, sz/2 - sz*0.02);
    ctx.shadowBlur = 0;
    ctx.font = `${Math.round(sz*0.02)}px 'Cinzel', serif`;
    ctx.fillStyle = 'rgba(180,160,120,0.5)';
    ctx.fillText('SPATIUM — CONTINUA', sz/2, sz/2 + sz*0.04);
  }
}

// ── SQUAD DRAW — Total War style ──────────────────────
function drawSquad(ctx, sq, selected) {
  if (!sq.alive) return;

  // Victory bounce
  let bounceY = 0;
  if (victoryAnim) {
    const elapsed = performance.now() - victoryAnim.startTime;
    if (victoryAnim.squads.includes(sq)) {
      const phase = victoryAnim.squads.indexOf(sq) * 0.7;
      bounceY = -Math.abs(Math.sin((elapsed * 0.006) + phase)) * CELL * 0.6;
    }
  }

  const x = sq.x * CELL, y = sq.y * CELL + bounceY;
  const w = SQUAD_COLS * CELL, h = CELL;
  const isP = sq.isPlayer;

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur  = 6;
  ctx.shadowOffsetY = 2;

  // Main body gradient
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (isP) {
    bodyGrad.addColorStop(0, selected ? 'rgba(60,100,180,0.85)' : 'rgba(30,60,130,0.75)');
    bodyGrad.addColorStop(1, selected ? 'rgba(20,50,110,0.9)'   : 'rgba(15,35,90,0.85)');
  } else {
    bodyGrad.addColorStop(0, selected ? 'rgba(180,50,40,0.85)'  : 'rgba(130,25,20,0.75)');
    bodyGrad.addColorStop(1, selected ? 'rgba(110,20,15,0.9)'   : 'rgba(80,12,10,0.85)');
  }
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Border
  if (selected || victoryAnim?.squads.includes(sq)) {
    ctx.strokeStyle = selected ? '#c9973a' : '#e8b96a';
    ctx.lineWidth   = 2;
    ctx.shadowColor = selected ? 'rgba(201,151,58,0.8)' : 'rgba(232,185,106,0.6)';
    ctx.shadowBlur  = selected ? 14 : 18;
  } else {
    ctx.strokeStyle = isP ? 'rgba(92,158,255,0.7)' : 'rgba(224,96,96,0.7)';
    ctx.lineWidth   = 1;
  }
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.shadowBlur = 0;

  // Inner highlight line
  ctx.strokeStyle = isP ? 'rgba(92,158,255,0.2)' : 'rgba(224,96,96,0.2)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  // Unit symbols — crisp centered
  const fs = Math.max(9, CELL * 0.36);
  ctx.font = `${fs}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 3;
  ctx.fillStyle = '#fff';
  for (let c = 0; c < SQUAD_COLS; c++) {
    for (let r = 0; r < 2; r++) {
      ctx.fillText(sq.symbol,
        x + c * CELL + CELL * 0.5,
        y + r * (CELL * 0.5) + CELL * 0.25);
    }
  }
  ctx.shadowBlur = 0;

  // HP bar — below unit
  const barH = Math.max(2, CELL * 0.12);
  const barY  = y - barH - 2;
  const hp    = Math.max(0, sq.hp / sq.maxHp);

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x + 1, barY, w - 2, barH);

  const hpGrad = ctx.createLinearGradient(x, 0, x + (w-2)*hp, 0);
  if (hp > 0.6) {
    hpGrad.addColorStop(0, '#2a6a2a'); hpGrad.addColorStop(1, '#4caf50');
  } else if (hp > 0.3) {
    hpGrad.addColorStop(0, '#8a5a00'); hpGrad.addColorStop(1, '#ffa726');
  } else {
    hpGrad.addColorStop(0, '#7a1010'); hpGrad.addColorStop(1, '#e53935');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(x + 1, barY, (w - 2) * hp, barH);

  // HP bar border
  ctx.strokeStyle = 'rgba(100,80,40,0.4)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 1, barY, w - 2, barH);

  ctx.restore();
}

// ── WIN / END ──────────────────────────────────────────
function checkWin() {
  const pa=G.squads.some(s=>s.isPlayer&&s.alive);
  const ba=G.squads.some(s=>!s.isPlayer&&s.alive);
  if (!pa) return 'bot';
  if (!ba) return 'player';
  return null;
}

function surrenderBattle() {
  if (!battleRunning) return;
  endBattle('bot');
}

function endBattle(winner) {
  battleRunning=false;
  document.removeEventListener('keydown',onKey);
  canvas.removeEventListener('mousedown', onSimClick);

  // Запустить победную анимацию до перехода на экран результата
  const winnerIsPlayer = winner === 'player' ||
    (winner === 'timeout' && G.squads.filter(s=>s.isPlayer&&s.alive).length >
                              G.squads.filter(s=>!s.isPlayer&&s.alive).length);
  if (winner !== 'timeout' || winnerIsPlayer !== null) {
    startVictoryAnimation(winnerIsPlayer);
    if (!winnerIsPlayer) playSound('defeat');
  }

  setTimeout(()=>{
    showScreen('result');
    const pa=G.squads.filter(s=>s.isPlayer&&s.alive).length;
    const ba=G.squads.filter(s=>!s.isPlayer&&s.alive).length;
    const timeout=winner==='timeout';
    const dw=timeout?(pa>ba?'player':pa<ba?'bot':'draw'):null;
    const win=winner==='player'||(timeout&&dw==='player');

    let icon,title,sub;
    if (timeout) {
      if (dw==='draw') { icon='⚖'; title='НИЧЬЯ';   sub='Время вышло — силы равны.'; }
      else if (win)    { icon='🏆'; title='ПОБЕДА';   sub='Время вышло — твои войска сильнее!'; }
      else             { icon='💀'; title='ПОРАЖЕНИЕ';  sub='Время вышло — враг оказался сильнее.'; }
    } else {
      icon=win?'🏆':'💀';
      title=win?'ПОБЕДА':'ПОРАЖЕНИЕ';
      sub=win?'Dux optime! Hostis in fugam versus est.':'Hostis callidior fuit. Recogita consilium!';
    }
    document.getElementById('result-icon').textContent=icon;
    document.getElementById('result-title').textContent=title;
    document.getElementById('result-title').className='result-title' + (win?'':' defeat');
    document.getElementById('result-sub').textContent=sub;
    document.getElementById('result-card').style.borderColor=
      win?'var(--bronze)':dw==='draw'?'#5a5040':'var(--blood-l)';
    const s=Math.round(G.battleTimer/1000);
    document.getElementById('result-stats').innerHTML=`
      <div class="stat-row"><span>Duration</span><span>${Math.floor(s/60)}м ${s%60}с</span></div>
      <div class="stat-row"><span>Enemies destroyed</span><span>${G.kills.player}</span></div>
      <div class="stat-row"><span>Losses</span><span>${G.kills.bot}</span></div>
      <div class="stat-row"><span>Player survived</span><span>${pa}</span></div>
      <div class="stat-row"><span>Bot survived</span><span>${ba}</span></div>
      <div class="stat-row"><span>Player faction</span>
        <span>${FACTIONS[G.playerFaction].icon} ${FACTIONS[G.playerFaction].name}</span></div>`;
  },2200);
}

// ── KEYS ───────────────────────────────────────────────
function onKey(e) {
  if (e.code==='Space') {
    e.preventDefault();
    G.paused=!G.paused;
    document.getElementById('battle-banner').textContent =
      G.paused?'⏸ ПАУЗА — ПРОБЕЛ чтобы продолжить':'⚔ СИМУЛЯЦИЯ';
    if (!G.paused) { lastTime=performance.now(); requestAnimationFrame(simLoop); }
  }
  if (e.code==='Escape') {
    G.simSelected = null;
    updateSimSidebarSelection();
  }
}

// ── HELPERS ────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('active'); s.style.display='none';
  });
  const el=document.getElementById('screen-'+name);
  el.style.display='flex'; el.classList.add('active');
}

function addLog(msg,cls) {
  const el=document.getElementById('battle-log');
  if (!el) return;
  const d=document.createElement('div');
  d.className='log-entry '+(cls||'');
  d.textContent=msg;
  el.appendChild(d);
  el.scrollTop=el.scrollHeight;
  while(el.children.length>50) el.removeChild(el.firstChild);
}

function updateHpBar(sq) {
  const bar=document.getElementById('hpbar-'+sq.id);
  const txt=document.getElementById('hptxt-'+sq.id);
  if (!bar) return;
  const p=Math.max(0,sq.hp/sq.maxHp*100);
  bar.style.width=p+'%';
  bar.style.background=p>60?'#00c853':p>30?'#ffa726':'#ff1744';
  if (txt) txt.textContent=sq.alive?Math.round(sq.hp)+' HP':'УБИТ';
}

function restartGame() {
  battleRunning=false;
  document.removeEventListener('keydown',onKey);
  G={phase:'setup',playerFaction:'Rome',botFaction:'Rome',
     playerRoster:[],botRoster:[],
     playerCoins: BUDGET, botCoins: BUDGET,
     squads:[],planSelected:null,
     orders:[],arrows:[],battleTimer:0,botThinkTimer:0,
     kills:{player:0,bot:0},paused:false,simSelected:null};
  victoryAnim = null;
  particles = [];
  placingFor=placingType=null;
  ['player','bot'].forEach(s=>{
    document.getElementById(s+'-squads').innerHTML='';
    document.getElementById(s+'-count').textContent='0 / 7 отрядов  (мин. 5)';
  });
  document.querySelectorAll('.faction-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('[data-faction="Rome"]').forEach(b=>b.classList.add('selected'));
  renderRoster('player');
  renderRoster('bot');
  // Reset deploy screen state
  document.getElementById('deploy-banner').textContent='⚙ РАССТАНОВКА — поставь свои отряды и отряды бота';
  document.getElementById('deploy-banner').style.color='';
  document.getElementById('deploy-start-btn').onclick=startPlanning;
  showScreen('setup');
}

// ── INIT ───────────────────────────────────────────────
document.getElementById('start-btn').onclick = startPlacement;
document.getElementById('deploy-start-btn').onclick = startPlanning;

// Init unit buttons for both sides
renderRoster('player');
renderRoster('bot');

showScreen('setup');
