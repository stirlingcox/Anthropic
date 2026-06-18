// ============================================================
// EMILY & CONOR'S SKY JUMP ADVENTURE
// ============================================================

const GRAVITY = 0.36;
const JUMP_FORCE = -11;
const EXTRA_JUMP_FORCE = -9.5;
const MOVE_SPEED_BASE = 2.2;
const MAX_SPEED = 4.2;
const PLAT_W_MIN = 105;
const PLAT_W_MAX = 230;
const MAX_JUMPS = 3;
const MAX_LIVES = 3;
const WORLD_LENGTH = 2200;

const WORLDS = [
    { name: 'Flower Meadow', skyTop: '#87CEEB', skyBot: '#E0F7FA', platColor: '#66BB6A', platBorder: '#43A047', particles: ['🌸', '🌺', '🌻', '🌷', '🦋'], emoji: '🌸' },
    { name: 'Candy Kingdom', skyTop: '#F8BBD0', skyBot: '#FCE4EC', platColor: '#F06292', platBorder: '#EC407A', particles: ['🍬', '🍭', '🧁', '🍩', '🎀'], emoji: '🍬' },
    { name: 'Gorilla Jungle', skyTop: '#1B5E20', skyBot: '#4CAF50', platColor: '#795548', platBorder: '#5D4037', particles: ['🌴', '🍌', '🦍', '🐒', '🌿'], emoji: '🦍' },
    { name: 'Cloud Castle', skyTop: '#7E57C2', skyBot: '#B39DDB', platColor: '#B39DDB', platBorder: '#9575CD', particles: ['☁️', '✨', '🏰', '💫', '🌙'], emoji: '☁️' },
    { name: 'Rainbow Road', skyTop: '#4A148C', skyBot: '#7B1FA2', platColor: '#AB47BC', platBorder: '#8E24AA', particles: ['🌈', '⭐', '💖', '🦄', '✨'], rainbow: true, emoji: '🌈' },
    { name: 'Starlight Galaxy', skyTop: '#0a0a2e', skyBot: '#1a1a4a', platColor: '#5C6BC0', platBorder: '#3F51B5', particles: ['⭐', '🌟', '💫', '🪐', '🚀'], stars: true, emoji: '🚀' },
];

const COLLECTIBLES = {
    star:    { emoji: '⭐', points: 10, size: 30 },
    gem:     { emoji: '💎', points: 25, size: 32 },
    heart:   { emoji: '💖', points: 15, size: 30 },
    banana:  { emoji: '🍌', points: 20, size: 30 },
    rainbow: { emoji: '🌈', points: 50, size: 36, power: 'speed' },
    wings:   { emoji: '🧚', points: 30, size: 34, power: 'fly' },
    magnet:  { emoji: '🧲', points: 20, size: 30, power: 'magnet' },
};

const ANIMALS = ['🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🐸', '🐥', '🦋', '🐹', '🐵'];
const GORILLA_FRIENDS = ['🦍', '🦍', '🦍', '🐒'];

const ENCOURAGEMENTS = [
    '🌟 Amazing!', '💖 So Good!', '🦄 Magical!', '⭐ Super!',
    '🌈 Wonderful!', '✨ Fantastic!', '🎉 Wow!', '💫 Brilliant!',
    '🦋 Beautiful!', '🎀 Lovely!', '🦍 Go Go Go!', '💎 Dazzling!',
];

// ---- AUDIO ----
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

function tone(f, d, t = 'sine', v = 0.1) {
    if (!audioCtx) return;
    try {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
        g.gain.setValueAtTime(v, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
        o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + d);
    } catch (e) {}
}

const SFX = {
    jump: () => { tone(520, 0.1); setTimeout(() => tone(700, 0.1), 40); },
    doubleJump: () => { tone(700, 0.08); setTimeout(() => tone(950, 0.1), 40); },
    tripleJump: () => { tone(900, 0.08); setTimeout(() => tone(1200, 0.12), 40); setTimeout(() => tone(1400, 0.1), 80); },
    collect: () => { tone(880, 0.06); setTimeout(() => tone(1100, 0.08), 50); setTimeout(() => tone(1320, 0.06), 100); },
    powerup: () => { [0,1,2,3,4].forEach(i => setTimeout(() => tone(500 + i * 200, 0.15, 'sine', 0.08), i * 60)); },
    friend: () => { tone(660, 0.1); setTimeout(() => tone(880, 0.15), 80); },
    gorilla: () => { tone(200, 0.15, 'sawtooth', 0.08); setTimeout(() => tone(300, 0.2, 'square', 0.06), 100); setTimeout(() => tone(500, 0.15), 200); },
    rescue: () => { tone(440, 0.2); setTimeout(() => tone(660, 0.2), 150); setTimeout(() => tone(880, 0.25), 300); },
    worldUp: () => { [523,659,784,1047].forEach((n, i) => setTimeout(() => tone(n, 0.2), i * 100)); },
    combo: () => { tone(1047, 0.08); setTimeout(() => tone(1319, 0.12), 60); },
    finish: () => { [523,659,784,1047,1319,1568].forEach((n, i) => setTimeout(() => tone(n, 0.25, 'sine', 0.12), i * 100)); },
    victory: () => { [523,659,784,1047,784,1047,1319,1568].forEach((n, i) => setTimeout(() => tone(n, 0.3, 'sine', 0.1), i * 130)); },
    gameOver: () => { [400,350,300,250].forEach((n, i) => setTimeout(() => tone(n, 0.25, 'triangle', 0.06), i * 120)); },
};

// ---- DOM ----
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

const screens = {};
['welcome', 'charselect', 'howto', 'game', 'worldcomplete', 'victory', 'gameover'].forEach(
    s => screens[s] = $('screen-' + s)
);

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ---- CHAR SELECT ----
let chosenChar = 'emily';

$('btn-play').addEventListener('click', () => { initAudio(); showScreen('charselect'); });
$('btn-play2').addEventListener('click', () => { initAudio(); startGame(); });
$('btn-how').addEventListener('click', () => showScreen('howto'));
$('btn-back').addEventListener('click', () => showScreen('welcome'));
$('btn-retry').addEventListener('click', () => startGame());
$('btn-menu').addEventListener('click', () => showScreen('welcome'));
$('btn-playagain').addEventListener('click', () => startGame());
$('btn-menu2').addEventListener('click', () => showScreen('welcome'));
$('btn-nextworld').addEventListener('click', () => startNextWorld());

$('char-emily').addEventListener('click', () => { chosenChar = 'emily'; startGame(); });
$('char-conor').addEventListener('click', () => { chosenChar = 'conor'; startGame(); });

function getPlayerEmoji() { return chosenChar === 'emily' ? '🦄' : '🦍'; }
function getPlayerName() { return chosenChar === 'emily' ? 'Emily' : 'Conor'; }

// ---- CANVAS ----
let W, H;
function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
addEventListener('resize', resize);
resize();

// ---- GAME STATE ----
let game = null;
let bestScore = parseInt(localStorage.getItem('emilyConorBest')) || 0;

function startGame() {
    showScreen('game');
    $('hud-best').textContent = bestScore;

    game = {
        running: true, paused: false,
        score: 0, distance: 0, worldIndex: 0, worldDist: 0,
        speed: MOVE_SPEED_BASE, lives: MAX_LIVES, friendsMet: 0,
        combo: 0, comboTimer: 0, encourageTimer: 0, rescueTimer: 0,
        totalCollected: 0, finishSpawned: false, worldComplete: false,

        player: { x: 80, y: H - 160, w: 40, h: 44, vy: 0, onGround: false, jumps: 0 },

        platforms: [], collectibles: [], animals: [], gorillas: [],
        particles: [], bgParticles: [], bgStars: [], decorations: [],
        finishLine: null,

        power: null, powerTimer: 0,
        nextPlatX: 0, groundY: H - 50,
    };

    updateLives();
    generateInitial();
    genBgStars();
    $('hud-score').textContent = '0';
    $('hud-world').textContent = WORLDS[0].name;
    $('world-progress-fill').style.width = '0%';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function updateLives() {
    const h = [];
    for (let i = 0; i < MAX_LIVES; i++) h.push(i < game.lives ? '💖' : '🤍');
    $('hud-lives').textContent = h.join(' ');
}

// ---- GENERATION ----
function generateInitial() {
    const g = game;
    g.platforms.push({ x: -50, y: g.groundY, w: W + 200, type: 'ground' });
    let x = 60;
    for (let i = 0; i < 25; i++) { addPlatform(x); x = g.nextPlatX; }
}

function addPlatform(startX) {
    const g = game;
    const w = PLAT_W_MIN + Math.random() * (PLAT_W_MAX - PLAT_W_MIN);
    const gapX = 30 + Math.random() * (60 + g.speed * 4);
    const x = startX != null ? startX : g.nextPlatX + gapX;

    let y;
    if (g.platforms.length > 1) {
        const last = g.platforms[g.platforms.length - 1];
        y = Math.max(100, Math.min(g.groundY - 20, last.y + (-70 + Math.random() * 140)));
    } else {
        y = g.groundY - 60 - Math.random() * 120;
    }

    let type = 'normal';
    const r = Math.random();
    if (r < 0.15) type = 'bouncy';
    else if (r < 0.22 && g.distance > 300) type = 'moving';

    g.platforms.push({ x, y, w, type, baseY: y, phase: Math.random() * Math.PI * 2 });
    g.nextPlatX = x + w + gapX;

    // Collectibles
    if (Math.random() < 0.8) {
        const count = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            addCollectible(x + 20 + (w - 40) * (i / Math.max(1, count - 1)), y - 45 - Math.random() * 50);
        }
    }

    // Star arcs
    if (Math.random() < 0.18) {
        for (let i = 0; i < 5; i++) {
            addCollectible(x + w * 0.1 + (w * 0.8) * (i / 4), y - 70 - Math.sin(i / 4 * Math.PI) * 50, 'star');
        }
    }

    // Regular animal friends
    if (Math.random() < 0.2) {
        g.animals.push({
            x: x + 20 + Math.random() * (w - 40), y: y - 28,
            emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
            bob: Math.random() * Math.PI * 2, met: false, size: 26,
        });
    }

    // GORILLA FRIENDS - appear on platforms, give super bounce!
    if (Math.random() < 0.12) {
        g.gorillas.push({
            x: x + w / 2, y: y - 32,
            emoji: GORILLA_FRIENDS[Math.floor(Math.random() * GORILLA_FRIENDS.length)],
            bob: Math.random() * Math.PI * 2,
            activated: false, size: 36,
            bounceTimer: 0,
        });
    }

    // Decorations
    if (Math.random() < 0.35 && type === 'normal') {
        const decos = ['🌸', '🍄', '🌻', '🌺', '🪴', '🌹', '🍌'];
        g.decorations.push({
            x: x + 10 + Math.random() * (w - 20), y: y - 14,
            emoji: decos[Math.floor(Math.random() * decos.length)], size: 16,
        });
    }
}

function addCollectible(x, y, forceType) {
    const g = game;
    let type;
    if (forceType) { type = forceType; }
    else {
        const r = Math.random();
        if (r < 0.40) type = 'star';
        else if (r < 0.55) type = 'gem';
        else if (r < 0.65) type = 'heart';
        else if (r < 0.75) type = 'banana';
        else if (r < 0.85) type = 'rainbow';
        else if (r < 0.93) type = 'wings';
        else type = 'magnet';
    }
    const info = COLLECTIBLES[type];
    g.collectibles.push({ x, y, type, size: info.size, bob: Math.random() * Math.PI * 2, collected: false });
}

function genBgStars() {
    game.bgStars = [];
    for (let i = 0; i < 80; i++) {
        game.bgStars.push({ x: Math.random() * W, y: Math.random() * H * 0.75, size: 1 + Math.random() * 3, tw: Math.random() * Math.PI * 2 });
    }
}

function spawnFinishLine() {
    const g = game;
    if (g.finishSpawned) return;
    g.finishSpawned = true;

    const lastPlat = g.platforms[g.platforms.length - 1];
    const fx = lastPlat.x + lastPlat.w + 100;

    // Wide finish platform
    g.platforms.push({ x: fx, y: g.groundY - 30, w: 300, type: 'finish' });
    g.finishLine = { x: fx + 150, y: g.groundY - 30 };
    g.nextPlatX = fx + 500;
}

// ---- INPUT ----
function handleInput(e) {
    if (!game || !game.running || game.paused) return;
    e.preventDefault();
    initAudio();
    const p = game.player;
    if (p.jumps < MAX_JUMPS) {
        p.vy = p.jumps === 0 ? JUMP_FORCE : EXTRA_JUMP_FORCE;
        p.onGround = false;
        p.jumps++;
        if (p.jumps === 1) SFX.jump();
        else if (p.jumps === 2) { SFX.doubleJump(); spawnParts(p.x + p.w / 2, p.y + p.h, ['💫', '✨'], 4, true); }
        else { SFX.tripleJump(); spawnParts(p.x + p.w / 2, p.y + p.h, ['⭐', '🌟', '💥'], 6, true); }
    }
}

canvas.addEventListener('touchstart', handleInput, { passive: false });
canvas.addEventListener('mousedown', handleInput);
addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInput(e); });

// ---- PARTICLES ----
function spawnParts(x, y, emojis, count, up) {
    for (let i = 0; i < count; i++) {
        const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 4;
        game.particles.push({
            x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (up ? 2 : 0),
            life: 1, decay: 0.013 + Math.random() * 0.015,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            size: 14 + Math.random() * 16, rot: Math.random() * 360, rv: (Math.random() - 0.5) * 8,
        });
    }
}

function spawnBurst(x, y, emoji, count) {
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        game.particles.push({
            x, y, vx: Math.cos(a) * (3 + Math.random() * 3), vy: Math.sin(a) * 3 - 2,
            life: 1, decay: 0.02,
            emoji: i % 2 === 0 ? emoji : '✨',
            size: 18 + Math.random() * 12, rot: 0, rv: (Math.random() - 0.5) * 6,
        });
    }
}

// ---- GAME LOOP ----
let lastTime = 0;
function gameLoop(ts) {
    if (!game || !game.running) return;
    const dt = Math.min((ts - lastTime) / 16.67, 2.5);
    lastTime = ts;
    if (!game.paused) update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

// ---- UPDATE ----
function update(dt) {
    const g = game;
    const p = g.player;

    g.speed = Math.min(MAX_SPEED, MOVE_SPEED_BASE + g.worldDist * 0.0003);
    let spd = g.speed;
    if (g.power === 'speed') spd *= 1.5;
    if (g.worldComplete) spd = 0;

    const scroll = spd * dt;
    g.distance += scroll;
    g.worldDist += scroll;

    // World progress
    const pct = Math.min(100, (g.worldDist / WORLD_LENGTH) * 100);
    $('world-progress-fill').style.width = pct + '%';

    // Spawn finish line near end of world
    if (g.worldDist >= WORLD_LENGTH - 400 && !g.finishSpawned) {
        spawnFinishLine();
    }

    // Player physics
    if (g.power === 'fly') {
        p.vy += GRAVITY * 0.2 * dt;
        if (p.vy > 2) p.vy = 2;
    } else {
        p.vy += GRAVITY * dt;
    }
    p.y += p.vy * dt;

    // Trail particles
    if (g.distance > 0 && Math.random() < 0.35) {
        const emojis = g.power === 'speed' ? ['🌈', '✨'] : (chosenChar === 'conor' ? ['💪', '✨'] : ['✨', '⭐']);
        game.particles.push({
            x: p.x + (Math.random() - 0.5) * 8, y: p.y + p.h / 2 + (Math.random() - 0.5) * 8,
            vx: -1.2, vy: (Math.random() - 0.5) * 0.4, life: 0.7, decay: 0.03,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            size: 10 + Math.random() * 7, rot: 0, rv: (Math.random() - 0.5) * 3,
        });
    }

    // Platforms
    p.onGround = false;
    for (let i = g.platforms.length - 1; i >= 0; i--) {
        const pl = g.platforms[i];
        pl.x -= scroll;
        if (pl.type === 'moving') {
            pl.phase += 0.04 * dt;
            pl.y = pl.baseY + Math.sin(pl.phase) * 30;
        }
        if (pl.x + pl.w < -100) { g.platforms.splice(i, 1); continue; }

        if (p.vy >= 0) {
            const px = p.x + p.w / 2;
            if (px > pl.x - 12 && px < pl.x + pl.w + 12 &&
                p.y + p.h >= pl.y - 14 && p.y + p.h <= pl.y + 22) {
                p.y = pl.y - p.h;
                p.vy = 0;
                p.onGround = true;
                p.jumps = 0;

                if (pl.type === 'bouncy') {
                    p.vy = JUMP_FORCE * 1.5;
                    p.onGround = false;
                    p.jumps = 0;
                    SFX.tripleJump();
                    spawnParts(p.x + p.w / 2, p.y + p.h, ['💥', '⭐', '🌟'], 8, true);
                    showEncourage('🚀 BOING!');
                }

                // Finish line reached!
                if (pl.type === 'finish' && !g.worldComplete) {
                    g.worldComplete = true;
                    worldComplete();
                }
            }
        }
    }

    // Generate platforms (but not past finish)
    if (!g.finishSpawned) {
        while (g.nextPlatX < g.distance + W + 500) addPlatform();
    }

    // Collectibles
    for (let i = g.collectibles.length - 1; i >= 0; i--) {
        const c = g.collectibles[i];
        c.x -= scroll;
        c.bob += 0.06 * dt;
        if (c.x < -60) { g.collectibles.splice(i, 1); continue; }
        if (c.collected) continue;

        const cy = c.y + Math.sin(c.bob) * 8;
        const dx = (p.x + p.w / 2) - c.x;
        const dy = (p.y + p.h / 2) - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let radius = 35;
        if (g.power === 'magnet') {
            radius = 100;
            if (dist < 150) { c.x += dx * 0.1 * dt; c.y += dy * 0.1 * dt; }
        }

        if (dist < radius) {
            c.collected = true;
            const info = COLLECTIBLES[c.type];
            g.combo++; g.comboTimer = 80; g.totalCollected++;
            let pts = info.points;
            if (g.combo >= 3) pts = Math.floor(pts * (1 + g.combo * 0.15));
            g.score += pts;
            $('hud-score').textContent = g.score;

            info.power ? SFX.powerup() : SFX.collect();
            spawnBurst(c.x, cy, info.emoji, info.power ? 12 : 8);

            if (g.combo === 3) showCombo('3x Nice! ✨');
            else if (g.combo === 5) { showCombo('5x COMBO! 🔥'); SFX.combo(); }
            else if (g.combo === 10) { showCombo('10x AMAZING! 💫'); SFX.combo(); }
            else if (g.combo === 20) { showCombo('20x INCREDIBLE! 🌈'); SFX.combo(); }

            if (g.totalCollected % 10 === 0) showEncourage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);

            if (info.power) {
                g.power = info.power;
                g.powerTimer = info.power === 'fly' ? 250 : 350;
                showPower(info.power);
                if (info.power === 'fly') p.jumps = 0;
            }

            setTimeout(() => { g.collectibles = g.collectibles.filter(cc => cc !== c); }, 50);
        }
    }

    // Animals
    for (let i = g.animals.length - 1; i >= 0; i--) {
        const a = g.animals[i];
        a.x -= scroll; a.bob += 0.05 * dt;
        if (a.x < -60) { g.animals.splice(i, 1); continue; }
        if (a.met) continue;

        const dx = (p.x + p.w / 2) - a.x;
        const dy = (p.y + p.h / 2) - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
            a.met = true; g.friendsMet++; g.score += 20;
            $('hud-score').textContent = g.score;
            SFX.friend();
            spawnBurst(a.x, a.y, a.emoji, 10);
            spawnParts(a.x, a.y, ['💖', '💕', '✨'], 6, true);
            showEncourage(a.emoji + ' New Friend!');
            setTimeout(() => { g.animals = g.animals.filter(aa => aa !== a); }, 1500);
        }
    }

    // GORILLAS - super bounce friends!
    for (let i = g.gorillas.length - 1; i >= 0; i--) {
        const gr = g.gorillas[i];
        gr.x -= scroll; gr.bob += 0.04 * dt;
        if (gr.bounceTimer > 0) gr.bounceTimer -= dt;
        if (gr.x < -60) { g.gorillas.splice(i, 1); continue; }
        if (gr.activated) continue;

        const dx = (p.x + p.w / 2) - gr.x;
        const dy = (p.y + p.h) - gr.y;
        if (Math.abs(dx) < 35 && dy > -10 && dy < 30 && p.vy >= 0) {
            gr.activated = true;
            gr.bounceTimer = 30;
            g.friendsMet++;
            g.score += 50;
            $('hud-score').textContent = g.score;

            // SUPER GORILLA BOUNCE!
            p.vy = JUMP_FORCE * 2;
            p.onGround = false;
            p.jumps = 0;

            SFX.gorilla();
            spawnBurst(gr.x, gr.y, '🦍', 12);
            spawnParts(gr.x, gr.y, ['💪', '🍌', '⭐', '🌟', '💥'], 10, true);
            showCombo('🦍 GORILLA BOOST!');
            showEncourage('🦍💪 Super Launch!');
        }
    }

    // Decorations
    for (let i = g.decorations.length - 1; i >= 0; i--) {
        g.decorations[i].x -= scroll;
        if (g.decorations[i].x < -60) g.decorations.splice(i, 1);
    }

    // Finish line scroll
    if (g.finishLine) g.finishLine.x -= scroll;

    // Combo timer
    if (g.comboTimer > 0) { g.comboTimer -= dt; if (g.comboTimer <= 0) g.combo = 0; }

    // Power timer
    if (g.power) {
        g.powerTimer -= dt;
        if (g.powerTimer <= 0) { g.power = null; hidePower(); }
    }

    if (g.encourageTimer > 0) g.encourageTimer -= dt;
    if (g.rescueTimer > 0) { g.rescueTimer -= dt; if (g.rescueTimer <= 0) $('rescue-overlay').classList.remove('visible'); }

    // Particles
    for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 0.08 * dt;
        pt.life -= pt.decay * dt; pt.rot += pt.rv * dt;
        if (pt.life <= 0) g.particles.splice(i, 1);
    }

    // BG particles
    const world = WORLDS[g.worldIndex];
    if (Math.random() < 0.08 * dt) {
        const wp = world.particles;
        g.bgParticles.push({
            x: W + 20, y: Math.random() * H * 0.85,
            vx: -0.8 - Math.random() * 1.5, vy: -0.3 + Math.random() * 0.6,
            life: 1, decay: 0.004, emoji: wp[Math.floor(Math.random() * wp.length)],
            size: 18 + Math.random() * 20, rot: Math.random() * 360, rv: (Math.random() - 0.5) * 2,
        });
    }
    for (let i = g.bgParticles.length - 1; i >= 0; i--) {
        const bp = g.bgParticles[i];
        bp.x += bp.vx * dt; bp.y += bp.vy * dt; bp.life -= bp.decay * dt; bp.rot += bp.rv * dt;
        if (bp.life <= 0 || bp.x < -40) g.bgParticles.splice(i, 1);
    }

    g.bgStars.forEach(s => { s.tw += 0.03 * dt; });

    // Fall
    if (p.y > H + 30) {
        if (g.lives > 1) rescue();
        else gameOver();
    }
}

function rescue() {
    const g = game;
    g.lives--; updateLives(); SFX.rescue();
    let safe = g.platforms.find(p => p.x > 30 && p.x < W * 0.5 && p.type !== 'ground');
    if (!safe) safe = g.platforms.find(p => p.x > 0 && p.x < W);
    if (!safe) safe = g.platforms[0];

    g.player.x = safe.x + safe.w / 2 - g.player.w / 2;
    g.player.y = safe.y - g.player.h - 30;
    g.player.vy = -5; g.player.jumps = 0;
    spawnParts(g.player.x + g.player.w / 2, g.player.y + g.player.h, ['☁️', '✨', '💫'], 10, true);
    showCombo('☁️ Cloud Rescue!');
    $('rescue-overlay').classList.add('visible');
    g.rescueTimer = 40;
}

function worldComplete() {
    const g = game;
    SFX.finish();
    g.score += 100;
    $('hud-score').textContent = g.score;

    spawnParts(g.player.x + g.player.w / 2, g.player.y, ['🎉', '🏁', '⭐', '🌟', '🎊', '💖'], 20, true);

    // Confetti
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            if (!game) return;
            game.particles.push({
                x: Math.random() * W, y: -20,
                vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
                life: 1, decay: 0.005,
                emoji: ['🎀', '💜', '💗', '🩷', '🩵', '💛', '🧡', '🦍'][Math.floor(Math.random() * 8)],
                size: 16 + Math.random() * 16, rot: Math.random() * 360, rv: (Math.random() - 0.5) * 5,
            });
        }, i * 80);
    }

    setTimeout(() => {
        if (!game) return;
        game.running = false;

        if (g.worldIndex >= WORLDS.length - 1) {
            showVictory();
        } else {
            $('complete-title').textContent = getPlayerName() + ' did it!';
            $('complete-world-name').textContent = WORLDS[g.worldIndex].name + ' Complete!';
            $('complete-score').textContent = g.score;
            $('complete-friends').textContent = g.friendsMet;
            showScreen('worldcomplete');
        }
    }, 1500);
}

function startNextWorld() {
    const g = game;
    g.worldIndex++;
    g.worldDist = 0;
    g.finishSpawned = false;
    g.worldComplete = false;
    g.finishLine = null;
    g.running = true;

    g.platforms = [];
    g.collectibles = [];
    g.animals = [];
    g.gorillas = [];
    g.decorations = [];
    g.bgParticles = [];
    g.nextPlatX = 0;
    g.player.x = 80;
    g.player.y = H - 160;
    g.player.vy = 0;
    g.player.jumps = 0;
    g.speed = MOVE_SPEED_BASE;

    // Bonus life for completing a world!
    if (g.lives < MAX_LIVES) g.lives++;
    updateLives();

    generateInitial();
    $('hud-world').textContent = WORLDS[g.worldIndex].name;
    $('world-progress-fill').style.width = '0%';
    SFX.worldUp();
    showScreen('game');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function showVictory() {
    const g = game;
    SFX.victory();
    const isNew = g.score > bestScore;
    if (isNew) { bestScore = g.score; localStorage.setItem('emilyConorBest', bestScore); }

    $('victory-title').textContent = getPlayerName() + ' WINS!';
    $('victory-sub').textContent = isNew ? '🎉 New High Score! 🎉' : 'All worlds complete!';
    $('victory-emoji').textContent = getPlayerEmoji();
    $('victory-score').textContent = g.score;
    $('victory-friends').textContent = g.friendsMet;
    $('victory-best').textContent = bestScore;
    showScreen('victory');
}

function gameOver() {
    if (!game) return;
    game.running = false;
    SFX.gameOver();
    const isNew = game.score > bestScore;
    if (isNew) { bestScore = game.score; localStorage.setItem('emilyConorBest', bestScore); }

    setTimeout(() => {
        $('final-score').textContent = game.score;
        $('final-best').textContent = bestScore;
        $('final-world').textContent = WORLDS[game.worldIndex].name;
        $('final-friends').textContent = game.friendsMet;
        $('new-best-row').style.display = isNew ? 'flex' : 'none';

        const names = [getPlayerName()];
        const titles = ['Amazing Job ' + names[0] + '!', 'Great Job ' + names[0] + '!', 'Super ' + names[0] + '!', 'You Rock ' + names[0] + '!'];
        $('gameover-title').textContent = titles[Math.floor(Math.random() * titles.length)];
        $('gameover-emoji').textContent = getPlayerEmoji();
        showScreen('gameover');
    }, 700);
}

// ---- RENDER ----
function render() {
    const g = game;
    const world = WORLDS[g.worldIndex];
    const p = g.player;

    ctx.save();

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, world.skyTop);
    sky.addColorStop(1, world.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars bg
    if (world.stars) {
        g.bgStars.forEach(s => {
            ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(s.tw));
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Rainbow bg
    if (world.rainbow) {
        ['#FF000030', '#FF770030', '#FFFF0030', '#00FF0030', '#0000FF30', '#8B00FF30'].forEach((c, i) => {
            ctx.fillStyle = c;
            const bH = H / 6;
            ctx.fillRect(0, i * bH + Math.sin(Date.now() * 0.001 + i) * 15, W, bH + 5);
        });
    }

    // BG particles
    g.bgParticles.forEach(bp => {
        ctx.globalAlpha = bp.life * 0.5;
        ctx.save(); ctx.translate(bp.x, bp.y); ctx.rotate(bp.rot * Math.PI / 180);
        ctx.font = bp.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(bp.emoji, 0, 0); ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Decorations
    g.decorations.forEach(d => {
        if (d.x > W + 30 || d.x < -30) return;
        ctx.font = d.size + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(d.emoji, d.x, d.y);
    });

    // Platforms
    g.platforms.forEach(pl => {
        if (pl.x > W + 50 || pl.x + pl.w < -50) return;

        let color = world.platColor, border = world.platBorder, h = 18;
        if (pl.type === 'bouncy') { color = '#FFD600'; border = '#F9A825'; h = 22; }
        else if (pl.type === 'moving') { color = '#26C6DA'; border = '#00ACC1'; }
        else if (pl.type === 'finish') { color = '#FFD700'; border = '#F9A825'; h = 24; }

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        rr(ctx, pl.x + 3, pl.y + 5, pl.w, h, 10); ctx.fill();
        ctx.fillStyle = color;
        rr(ctx, pl.x, pl.y, pl.w, h, 10); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        rr(ctx, pl.x + 5, pl.y + 2, pl.w - 10, 7, 4); ctx.fill();
        ctx.strokeStyle = border; ctx.lineWidth = 2;
        rr(ctx, pl.x, pl.y, pl.w, h, 10); ctx.stroke();

        if (pl.type === 'bouncy') {
            for (let i = 0; i < Math.floor(pl.w / 40); i++) {
                ctx.font = '16px serif'; ctx.textAlign = 'center';
                ctx.fillText('🌟', pl.x + 20 + i * 40, pl.y - 6);
            }
        }

        if (pl.type === 'finish') {
            ctx.font = '28px serif'; ctx.textAlign = 'center';
            ctx.fillText('🏁', pl.x + pl.w / 2, pl.y - 16);
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('FINISH!', pl.x + pl.w / 2, pl.y - 38);
        }
    });

    // Gorillas
    g.gorillas.forEach(gr => {
        if (gr.x > W + 40 || gr.x < -40) return;
        const bobY = gr.y + Math.sin(gr.bob) * 3;

        if (!gr.activated) {
            // Glow
            ctx.globalAlpha = 0.2 + Math.sin(gr.bob * 2) * 0.1;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(gr.x, bobY, 28, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;

            // Label
            ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('BOUNCE!', gr.x, bobY - 28);
        }

        let drawSize = gr.size;
        if (gr.bounceTimer > 0) drawSize += Math.sin(gr.bounceTimer) * 8;

        ctx.font = drawSize + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(gr.emoji, gr.x, bobY);
    });

    // Animals
    g.animals.forEach(a => {
        if (a.x > W + 30 || a.x < -30) return;
        const bobY = a.y + Math.sin(a.bob) * 4;

        if (!a.met) {
            ctx.globalAlpha = 0.2 + Math.sin(a.bob * 2) * 0.1;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(a.x, bobY, 20, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.font = '13px serif'; ctx.fillText('❗', a.x + 14, bobY - 18);
        }

        ctx.font = a.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.emoji, a.x, bobY);
    });

    // Collectibles
    g.collectibles.forEach(c => {
        if (c.collected || c.x > W + 40 || c.x < -40) return;
        const info = COLLECTIBLES[c.type];
        const bobY = c.y + Math.sin(c.bob) * 8;

        ctx.globalAlpha = 0.25 + Math.sin(c.bob * 1.5) * 0.1;
        ctx.fillStyle = info.power ? '#FFD600' : '#FFF';
        ctx.beginPath(); ctx.arc(c.x, bobY, c.size * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        let ds = c.size;
        if (info.power) ds += Math.sin(c.bob * 2) * 4;
        ctx.font = ds + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, c.x, bobY);
    });

    // Player
    // Power effects
    if (g.power === 'magnet') {
        const pulse = Math.sin(Date.now() * 0.005) * 0.1;
        ctx.globalAlpha = 0.12 + pulse;
        ctx.fillStyle = '#64B5F6';
        ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 55, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#64B5F6'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 80 + Math.sin(Date.now() * 0.003) * 20, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
    }

    if (g.power === 'fly') {
        const flap = Math.sin(Date.now() * 0.015) * 8;
        ctx.font = '22px serif'; ctx.textAlign = 'center';
        ctx.fillText('🪽', p.x - 8, p.y + 18 + flap);
        ctx.fillText('🪽', p.x + p.w + 8, p.y + 18 - flap);
    }

    if (g.power === 'speed') {
        ctx.globalAlpha = 0.5;
        ['#FF0000', '#FF7700', '#FFFF00', '#00FF00'].forEach((c, i) => {
            ctx.strokeStyle = c; ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(p.x - 5, p.y + 8 + i * 10);
            ctx.lineTo(p.x - 25 - Math.random() * 25, p.y + 8 + i * 10);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    }

    // Squash & stretch
    let sx = 1, sy = 1;
    if (p.vy < -4) { sx = 0.85; sy = 1.18; }
    else if (p.vy > 5) { sx = 1.18; sy = 0.85; }

    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(sx, sy);
    ctx.font = '42px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(getPlayerEmoji(), 0, 0);
    ctx.restore();

    if (g.combo >= 3) {
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(g.combo + 'x', p.x + p.w / 2, p.y - 14);
        ctx.globalAlpha = 1;
    }

    // Particles
    g.particles.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot * Math.PI / 180);
        ctx.font = pt.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pt.emoji, 0, 0); ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ---- UI HELPERS ----
function showCombo(t) {
    const el = $('combo-display');
    el.textContent = t; el.classList.remove('visible'); void el.offsetWidth; el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 900);
}

function showEncourage(t) {
    if (game.encourageTimer > 0) return;
    game.encourageTimer = 80;
    const el = $('encouragement');
    el.textContent = t; el.classList.remove('visible'); void el.offsetWidth; el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 1500);
}

function showPower(p) {
    const labels = { speed: '🌈 RAINBOW SPEED!', fly: '🧚 FLYING!', magnet: '🧲 STAR MAGNET!' };
    $('power-indicator').textContent = labels[p] || '';
    $('power-indicator').classList.add('visible');
}

function hidePower() { $('power-indicator').classList.remove('visible'); }

$('hud-best').textContent = bestScore;
