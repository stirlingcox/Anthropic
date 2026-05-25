// ============================================================
// EMILY'S UNICORN SKY JUMP - Easy & Fun Edition
// ============================================================

const GRAVITY = 0.38;
const JUMP_FORCE = -11;
const EXTRA_JUMP_FORCE = -9.5;
const MOVE_SPEED_BASE = 2.2;
const MAX_SPEED = 4.5;
const PLAT_W_MIN = 100;
const PLAT_W_MAX = 220;
const PLAT_GAP_MIN = 30;
const PLAT_GAP_MAX = 80;
const MAX_JUMPS = 3;
const MAX_LIVES = 3;

const WORLDS = [
    { name: 'Flower Meadow', skyTop: '#87CEEB', skyBot: '#E0F7FA', platColor: '#66BB6A', platBorder: '#43A047', particles: ['🌸', '🌺', '🌻', '🌷', '🦋'], bg: ['🌳', '🌲'], emoji: '🌸' },
    { name: 'Candy Kingdom', skyTop: '#F8BBD0', skyBot: '#FCE4EC', platColor: '#F06292', platBorder: '#EC407A', particles: ['🍬', '🍭', '🧁', '🍩', '🎀'], bg: ['🍰', '🎂'], emoji: '🍬' },
    { name: 'Cloud Castle', skyTop: '#7E57C2', skyBot: '#B39DDB', platColor: '#B39DDB', platBorder: '#9575CD', particles: ['☁️', '✨', '🏰', '💫', '🌙'], bg: ['🏰', '☁️'], emoji: '☁️' },
    { name: 'Crystal Caves', skyTop: '#0D47A1', skyBot: '#1565C0', platColor: '#42A5F5', platBorder: '#1E88E5', particles: ['💎', '🔮', '💠', '✨', '🌟'], bg: ['💎', '🔮'], emoji: '💎' },
    { name: 'Rainbow Road', skyTop: '#4A148C', skyBot: '#7B1FA2', platColor: '#AB47BC', platBorder: '#8E24AA', particles: ['🌈', '⭐', '💖', '🦄', '✨'], bg: ['🌈', '⭐'], rainbow: true, emoji: '🌈' },
    { name: 'Starlight Galaxy', skyTop: '#0a0a2e', skyBot: '#1a1a4a', platColor: '#5C6BC0', platBorder: '#3F51B5', particles: ['⭐', '🌟', '💫', '🪐', '🚀'], bg: ['🪐', '🌙'], stars: true, emoji: '🚀' },
];

const COLLECTIBLES = {
    star:    { emoji: '⭐', points: 10, size: 30 },
    gem:     { emoji: '💎', points: 25, size: 32 },
    heart:   { emoji: '💖', points: 15, size: 30 },
    rainbow: { emoji: '🌈', points: 50, size: 36, power: 'speed' },
    wings:   { emoji: '🧚', points: 30, size: 34, power: 'fly' },
    magnet:  { emoji: '🧲', points: 20, size: 30, power: 'magnet' },
};

const ANIMALS = ['🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🐸', '🐥', '🦋', '🐹'];

const ENCOURAGEMENTS = [
    '🌟 Amazing!', '💖 So Good!', '🦄 Magical!', '⭐ Super!',
    '🌈 Wonderful!', '✨ Fantastic!', '🎉 Wow!', '💫 Brilliant!',
    '🦋 Beautiful!', '🎀 Lovely!', '🌸 Pretty!', '💎 Dazzling!',
];

// ---- AUDIO ----
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function tone(freq, dur, type = 'sine', vol = 0.1) {
    if (!audioCtx) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
}

const SFX = {
    jump: () => { tone(520, 0.1); setTimeout(() => tone(700, 0.1), 40); },
    doubleJump: () => { tone(700, 0.08); setTimeout(() => tone(950, 0.1), 40); },
    tripleJump: () => { tone(900, 0.08); setTimeout(() => tone(1200, 0.12), 40); setTimeout(() => tone(1400, 0.1), 80); },
    collect: () => { tone(880, 0.06); setTimeout(() => tone(1100, 0.08), 50); setTimeout(() => tone(1320, 0.06), 100); },
    bigCollect: () => { [0,1,2,3].forEach(i => setTimeout(() => tone(600 + i * 200, 0.12), i * 50)); },
    powerup: () => { [0,1,2,3,4].forEach(i => setTimeout(() => tone(500 + i * 200, 0.15, 'sine', 0.08), i * 60)); },
    friend: () => { tone(660, 0.1); setTimeout(() => tone(880, 0.15), 80); },
    rescue: () => { tone(440, 0.2); setTimeout(() => tone(660, 0.2), 150); setTimeout(() => tone(880, 0.25), 300); },
    worldUp: () => { [523,659,784,1047].forEach((n,i) => setTimeout(() => tone(n, 0.2), i * 100)); },
    combo: () => { tone(1047, 0.08); setTimeout(() => tone(1319, 0.12), 60); },
    gameOver: () => { [400,350,300,250].forEach((n,i) => setTimeout(() => tone(n, 0.25, 'triangle', 0.06), i * 120)); },
};

// ---- DOM ----
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('hud-score');
const hudBest = document.getElementById('hud-best');
const hudWorld = document.getElementById('hud-world');
const hudLives = document.getElementById('hud-lives');
const powerIndicator = document.getElementById('power-indicator');
const comboDisplay = document.getElementById('combo-display');
const encouragement = document.getElementById('encouragement');
const rescueOverlay = document.getElementById('rescue-overlay');

const screens = {
    welcome: document.getElementById('screen-welcome'),
    howto: document.getElementById('screen-howto'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover'),
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

document.getElementById('btn-play').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-play2').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-how').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('welcome'));
document.getElementById('btn-retry').addEventListener('click', () => startGame());
document.getElementById('btn-menu').addEventListener('click', () => showScreen('welcome'));

// ---- CANVAS ----
let W, H, scale;
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = devicePixelRatio;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ---- GAME STATE ----
let game = null;
let bestScore = parseInt(localStorage.getItem('emilyBest2')) || 0;

function startGame() {
    showScreen('game');
    hudBest.textContent = bestScore;

    game = {
        running: true,
        paused: false,
        score: 0,
        distance: 0,
        worldIndex: 0,
        speed: MOVE_SPEED_BASE,
        lives: MAX_LIVES,
        friendsMet: 0,
        combo: 0,
        comboTimer: 0,
        encourageTimer: 0,
        rescueTimer: 0,
        totalCollected: 0,

        player: {
            x: 80,
            y: H - 160,
            w: 40,
            h: 44,
            vy: 0,
            onGround: false,
            jumps: 0,
            trail: [],
        },

        platforms: [],
        collectibles: [],
        animals: [],
        particles: [],
        bgParticles: [],
        bgStars: [],
        decorations: [],

        power: null,
        powerTimer: 0,
        nextPlatX: 0,
        groundY: H - 50,
    };

    updateLivesDisplay();
    generateInitialPlatforms();
    generateBgStars();
    hudScore.textContent = '0';
    hudWorld.textContent = WORLDS[0].name;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function updateLivesDisplay() {
    const hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
        hearts.push(i < game.lives ? '💖' : '🤍');
    }
    hudLives.textContent = hearts.join(' ');
}

// ---- PLATFORMS ----
function generateInitialPlatforms() {
    const g = game;
    g.platforms.push({ x: -50, y: g.groundY, w: W + 200, type: 'ground' });

    let x = 60;
    for (let i = 0; i < 25; i++) {
        addPlatform(x);
        x = g.nextPlatX;
    }
}

function addPlatform(startX) {
    const g = game;
    const w = PLAT_W_MIN + Math.random() * (PLAT_W_MAX - PLAT_W_MIN);
    const gapX = PLAT_GAP_MIN + Math.random() * (PLAT_GAP_MAX + g.speed * 5);
    const x = startX != null ? startX : g.nextPlatX + gapX;

    const minY = 100;
    const maxY = g.groundY - 20;
    let y;
    if (g.platforms.length > 1) {
        const last = g.platforms[g.platforms.length - 1];
        const dy = -80 + Math.random() * 160;
        y = Math.max(minY, Math.min(maxY, last.y + dy));
    } else {
        y = g.groundY - 60 - Math.random() * 120;
    }

    let type = 'normal';
    const r = Math.random();
    if (r < 0.15) type = 'bouncy';
    else if (r < 0.22 && g.distance > 400) type = 'moving';

    const plat = { x, y, w, type, baseY: y, phase: Math.random() * Math.PI * 2, hasDeco: false };
    g.platforms.push(plat);
    g.nextPlatX = x + w + gapX;

    // Collectibles - spawn lots!
    if (Math.random() < 0.75) {
        const count = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            addCollectible(x + 20 + (w - 40) * (i / Math.max(1, count - 1)), y - 45 - Math.random() * 50);
        }
    }

    // Arc of stars above some platforms
    if (Math.random() < 0.2) {
        for (let i = 0; i < 5; i++) {
            const ax = x + w * 0.1 + (w * 0.8) * (i / 4);
            const ay = y - 70 - Math.sin(i / 4 * Math.PI) * 50;
            addCollectible(ax, ay, 'star');
        }
    }

    // Animal friends on platforms
    if (Math.random() < 0.25) {
        g.animals.push({
            x: x + 20 + Math.random() * (w - 40),
            y: y - 30,
            emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
            bobPhase: Math.random() * Math.PI * 2,
            met: false,
            size: 28,
        });
    }

    // Decorations (flowers, mushrooms on platforms)
    if (Math.random() < 0.4 && type === 'normal') {
        const decos = ['🌸', '🍄', '🌻', '🌺', '🪴', '🌹'];
        g.decorations.push({
            x: x + 10 + Math.random() * (w - 20),
            y: y - 14,
            emoji: decos[Math.floor(Math.random() * decos.length)],
            size: 16,
        });
    }
}

function addCollectible(x, y, forceType) {
    const g = game;
    let type;
    if (forceType) {
        type = forceType;
    } else {
        const r = Math.random();
        if (r < 0.50) type = 'star';
        else if (r < 0.68) type = 'gem';
        else if (r < 0.80) type = 'heart';
        else if (r < 0.88) type = 'rainbow';
        else if (r < 0.95) type = 'wings';
        else type = 'magnet';
    }
    const info = COLLECTIBLES[type];
    g.collectibles.push({ x, y, type, size: info.size, bobPhase: Math.random() * Math.PI * 2, collected: false });
}

function generateBgStars() {
    game.bgStars = [];
    for (let i = 0; i < 80; i++) {
        game.bgStars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.75,
            size: 1 + Math.random() * 3,
            twinkle: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.5,
        });
    }
}

// ---- INPUT ----
function handleInput(e) {
    if (!game || !game.running || game.paused) return;
    e.preventDefault();
    initAudio();

    const p = game.player;
    if (p.jumps < MAX_JUMPS) {
        const force = p.jumps === 0 ? JUMP_FORCE : EXTRA_JUMP_FORCE;
        p.vy = force;
        p.onGround = false;
        p.jumps++;

        if (p.jumps === 1) SFX.jump();
        else if (p.jumps === 2) { SFX.doubleJump(); spawnParticles(p.x + p.w / 2, p.y + p.h, ['💫', '✨'], 4, true); }
        else { SFX.tripleJump(); spawnParticles(p.x + p.w / 2, p.y + p.h, ['⭐', '🌟', '💥'], 6, true); }
    }
}

canvas.addEventListener('touchstart', handleInput, { passive: false });
canvas.addEventListener('mousedown', handleInput);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') handleInput(e);
});

// ---- PARTICLES ----
function spawnParticles(x, y, emojis, count, upward) {
    for (let i = 0; i < count; i++) {
        const angle = upward ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        game.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (upward ? 2 : 0),
            life: 1,
            decay: 0.012 + Math.random() * 0.015,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            size: 14 + Math.random() * 16,
            rot: Math.random() * 360,
            rotV: (Math.random() - 0.5) * 8,
        });
    }
}

function spawnBurst(x, y, emoji, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 3 + Math.random() * 3;
        game.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            decay: 0.02,
            emoji: i % 2 === 0 ? emoji : '✨',
            size: 18 + Math.random() * 12,
            rot: 0,
            rotV: (Math.random() - 0.5) * 6,
        });
    }
}

function spawnTrailParticle(x, y) {
    const g = game;
    const world = WORLDS[g.worldIndex];
    const emojis = g.power === 'speed' ? ['🌈', '✨', '💫'] : ['✨', '⭐'];
    g.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: -1 - Math.random(),
        vy: (Math.random() - 0.5) * 0.5,
        life: 0.8,
        decay: 0.03,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 10 + Math.random() * 8,
        rot: 0,
        rotV: (Math.random() - 0.5) * 4,
    });
}

// ---- GAME LOOP ----
let lastTime = 0;
function gameLoop(timestamp) {
    if (!game || !game.running) return;

    const dt = Math.min((timestamp - lastTime) / 16.67, 2.5);
    lastTime = timestamp;

    if (!game.paused) {
        update(dt);
    }
    render();
    requestAnimationFrame(gameLoop);
}

// ---- UPDATE ----
function update(dt) {
    const g = game;
    const p = g.player;
    const world = WORLDS[g.worldIndex];

    g.speed = Math.min(MAX_SPEED, MOVE_SPEED_BASE + g.distance * 0.0004);
    let currentSpeed = g.speed;
    if (g.power === 'speed') currentSpeed *= 1.5;

    const scrollSpeed = currentSpeed * dt;
    g.distance += scrollSpeed;

    // World transitions every 2500 distance
    const newWorld = Math.min(WORLDS.length - 1, Math.floor(g.distance / 2500));
    if (newWorld !== g.worldIndex) {
        g.worldIndex = newWorld;
        hudWorld.textContent = WORLDS[g.worldIndex].name;
        SFX.worldUp();
        showCombo(WORLDS[g.worldIndex].emoji + ' ' + WORLDS[g.worldIndex].name + '!');
        showEncouragement('🌍 New World!');
    }

    // Player physics - nice and floaty
    if (g.power === 'fly') {
        p.vy += GRAVITY * 0.2 * dt;
        if (p.vy > 2) p.vy = 2;
    } else {
        p.vy += GRAVITY * dt;
    }
    p.y += p.vy * dt;

    // Rainbow trail always
    if (g.distance > 0 && Math.random() < 0.4) {
        spawnTrailParticle(p.x, p.y + p.h / 2);
    }

    // Platform logic
    p.onGround = false;
    for (let i = g.platforms.length - 1; i >= 0; i--) {
        const plat = g.platforms[i];
        plat.x -= scrollSpeed;

        if (plat.type === 'moving') {
            plat.phase += 0.04 * dt;
            plat.y = plat.baseY + Math.sin(plat.phase) * 30;
        }

        if (plat.x + plat.w < -100) {
            g.platforms.splice(i, 1);
            continue;
        }

        // Generous collision
        if (p.vy >= 0) {
            const px = p.x + p.w / 2;
            const landingZone = 14;
            if (px > plat.x - 10 && px < plat.x + plat.w + 10 &&
                p.y + p.h >= plat.y - landingZone && p.y + p.h <= plat.y + 22) {
                p.y = plat.y - p.h;
                p.vy = 0;
                p.onGround = true;
                p.jumps = 0;

                if (plat.type === 'bouncy') {
                    p.vy = JUMP_FORCE * 1.5;
                    p.onGround = false;
                    p.jumps = 0;
                    SFX.tripleJump();
                    spawnParticles(p.x + p.w / 2, p.y + p.h, ['💥', '⭐', '🌟', '✨'], 8, true);
                    showEncouragement('🚀 BOING!');
                }
            }
        }
    }

    // Generate new platforms
    while (g.nextPlatX < g.distance + W + 500) {
        addPlatform();
    }

    // Scroll collectibles
    for (let i = g.collectibles.length - 1; i >= 0; i--) {
        const c = g.collectibles[i];
        c.x -= scrollSpeed;
        c.bobPhase += 0.06 * dt;

        if (c.x < -60) { g.collectibles.splice(i, 1); continue; }
        if (c.collected) continue;

        const cy = c.y + Math.sin(c.bobPhase) * 8;
        const dx = (p.x + p.w / 2) - c.x;
        const dy = (p.y + p.h / 2) - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let collectRadius = 35;
        if (g.power === 'magnet') collectRadius = 100;

        // Magnet pull
        if (g.power === 'magnet' && dist < 150) {
            c.x += dx * 0.08 * dt;
            c.y += dy * 0.08 * dt;
        }

        if (dist < collectRadius) {
            c.collected = true;
            const info = COLLECTIBLES[c.type];
            g.combo++;
            g.comboTimer = 80;
            g.totalCollected++;

            let pts = info.points;
            if (g.combo >= 3) pts = Math.floor(pts * (1 + g.combo * 0.15));

            g.score += pts;
            hudScore.textContent = g.score;

            if (info.power) {
                SFX.powerup();
                spawnBurst(c.x, cy, info.emoji, 12);
            } else {
                SFX.collect();
                spawnBurst(c.x, cy, info.emoji, 8);
            }

            // Combo celebrations
            if (g.combo === 3) showCombo('3x Nice! ✨');
            else if (g.combo === 5) { showCombo('5x COMBO! 🔥'); SFX.combo(); }
            else if (g.combo === 10) { showCombo('10x AMAZING! 💫'); SFX.combo(); }
            else if (g.combo === 15) { showCombo('15x SUPERSTAR! 🌟'); SFX.combo(); }
            else if (g.combo === 20) { showCombo('20x INCREDIBLE! 🌈'); SFX.combo(); }

            // Encouragement every 10 items
            if (g.totalCollected % 10 === 0) {
                showEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
            }

            // Power-ups
            if (info.power) {
                g.power = info.power;
                g.powerTimer = info.power === 'fly' ? 250 : 350;
                showPowerIndicator(info.power);
                if (info.power === 'fly') p.jumps = 0;
            }

            setTimeout(() => { g.collectibles = g.collectibles.filter(cc => cc !== c); }, 50);
        }
    }

    // Animals
    for (let i = g.animals.length - 1; i >= 0; i--) {
        const a = g.animals[i];
        a.x -= scrollSpeed;
        a.bobPhase += 0.05 * dt;

        if (a.x < -60) { g.animals.splice(i, 1); continue; }
        if (a.met) continue;

        const dx = (p.x + p.w / 2) - a.x;
        const dy = (p.y + p.h / 2) - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
            a.met = true;
            g.friendsMet++;
            g.score += 20;
            hudScore.textContent = g.score;
            SFX.friend();
            spawnBurst(a.x, a.y, a.emoji, 10);
            spawnParticles(a.x, a.y, ['💖', '💕', '✨', '🌟'], 6, true);
            showEncouragement(a.emoji + ' New Friend!');
            setTimeout(() => { g.animals = g.animals.filter(aa => aa !== a); }, 1500);
        }
    }

    // Decorations scroll
    for (let i = g.decorations.length - 1; i >= 0; i--) {
        g.decorations[i].x -= scrollSpeed;
        if (g.decorations[i].x < -60) g.decorations.splice(i, 1);
    }

    // Combo timer
    if (g.comboTimer > 0) {
        g.comboTimer -= dt;
        if (g.comboTimer <= 0) g.combo = 0;
    }

    // Power timer
    if (g.power) {
        g.powerTimer -= dt;
        if (g.powerTimer <= 0) {
            g.power = null;
            hidePowerIndicator();
        }
    }

    // Encouragement timer
    if (g.encourageTimer > 0) g.encourageTimer -= dt;

    // Rescue timer
    if (g.rescueTimer > 0) {
        g.rescueTimer -= dt;
        if (g.rescueTimer <= 0) {
            rescueOverlay.classList.remove('visible');
        }
    }

    // Particles
    for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 0.08 * dt;
        pt.life -= pt.decay * dt;
        pt.rot += pt.rotV * dt;
        if (pt.life <= 0) g.particles.splice(i, 1);
    }

    // Background particles
    if (Math.random() < 0.08 * dt) {
        const wp = world.particles;
        g.bgParticles.push({
            x: W + 20,
            y: Math.random() * H * 0.85,
            vx: -0.8 - Math.random() * 1.5,
            vy: -0.3 + Math.random() * 0.6,
            life: 1,
            decay: 0.004 + Math.random() * 0.004,
            emoji: wp[Math.floor(Math.random() * wp.length)],
            size: 18 + Math.random() * 20,
            rot: Math.random() * 360,
            rotV: (Math.random() - 0.5) * 2,
        });
    }
    for (let i = g.bgParticles.length - 1; i >= 0; i--) {
        const bp = g.bgParticles[i];
        bp.x += bp.vx * dt;
        bp.y += bp.vy * dt;
        bp.life -= bp.decay * dt;
        bp.rot += bp.rotV * dt;
        if (bp.life <= 0 || bp.x < -40) g.bgParticles.splice(i, 1);
    }

    g.bgStars.forEach(s => { s.twinkle += 0.03 * dt; });

    // Fall detection - RESCUE or game over
    if (p.y > H + 30) {
        if (g.lives > 1) {
            rescue();
        } else {
            gameOver();
        }
    }
}

function rescue() {
    const g = game;
    g.lives--;
    updateLivesDisplay();
    SFX.rescue();

    // Find a safe platform to put player on
    let safePlat = g.platforms.find(p => p.x > 30 && p.x < W * 0.5 && p.type !== 'ground');
    if (!safePlat) safePlat = g.platforms.find(p => p.x > 0 && p.x < W);
    if (!safePlat) safePlat = g.platforms[0];

    g.player.x = safePlat.x + safePlat.w / 2 - g.player.w / 2;
    g.player.y = safePlat.y - g.player.h - 30;
    g.player.vy = -5;
    g.player.jumps = 0;

    spawnParticles(g.player.x + g.player.w / 2, g.player.y + g.player.h, ['☁️', '✨', '💫', '🌟'], 10, true);
    showCombo('☁️ Cloud Rescue!');

    rescueOverlay.classList.add('visible');
    g.rescueTimer = 40;
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

    // Stars background
    if (world.stars) {
        g.bgStars.forEach(s => {
            const alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.twinkle));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Rainbow background
    if (world.rainbow) {
        const cols = ['#FF000030', '#FF770030', '#FFFF0030', '#00FF0030', '#0000FF30', '#8B00FF30'];
        cols.forEach((c, i) => {
            ctx.fillStyle = c;
            const bH = H / cols.length;
            ctx.fillRect(0, i * bH + Math.sin(Date.now() * 0.001 + i) * 15, W, bH + 5);
        });
    }

    // Background particles
    g.bgParticles.forEach(bp => {
        ctx.globalAlpha = bp.life * 0.5;
        ctx.save();
        ctx.translate(bp.x, bp.y);
        ctx.rotate(bp.rot * Math.PI / 180);
        ctx.font = bp.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bp.emoji, 0, 0);
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Decorations
    g.decorations.forEach(d => {
        if (d.x > W + 30 || d.x < -30) return;
        ctx.font = d.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.emoji, d.x, d.y);
    });

    // Platforms
    g.platforms.forEach(plat => {
        if (plat.x > W + 50 || plat.x + plat.w < -50) return;

        let color = world.platColor;
        let border = world.platBorder;
        let h = 18;

        if (plat.type === 'bouncy') {
            color = '#FFD600'; border = '#F9A825';
            h = 22;
        } else if (plat.type === 'moving') {
            color = '#26C6DA'; border = '#00ACC1';
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        roundRect(ctx, plat.x + 3, plat.y + 5, plat.w, h, 10);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        roundRect(ctx, plat.x, plat.y, plat.w, h, 10);
        ctx.fill();

        // Grass/top
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        roundRect(ctx, plat.x + 5, plat.y + 2, plat.w - 10, 7, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        roundRect(ctx, plat.x, plat.y, plat.w, h, 10);
        ctx.stroke();

        // Bouncy springs
        if (plat.type === 'bouncy') {
            const springCount = Math.floor(plat.w / 40);
            for (let i = 0; i < springCount; i++) {
                ctx.font = '16px serif';
                ctx.textAlign = 'center';
                ctx.fillText('🌟', plat.x + 20 + i * 40, plat.y - 6);
            }
        }
    });

    // Animals
    g.animals.forEach(a => {
        if (a.x > W + 30 || a.x < -30) return;
        const bobY = a.y + Math.sin(a.bobPhase) * 4;

        if (!a.met) {
            // Glow
            ctx.globalAlpha = 0.2 + Math.sin(a.bobPhase * 2) * 0.1;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(a.x, bobY, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Exclamation
            ctx.font = '14px serif';
            ctx.fillText('❗', a.x + 15, bobY - 20);
        }

        ctx.globalAlpha = a.met ? Math.max(0, 1 - (1 - 0)) : 1;
        ctx.font = a.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.emoji, a.x, bobY);
        ctx.globalAlpha = 1;
    });

    // Collectibles
    g.collectibles.forEach(c => {
        if (c.collected || c.x > W + 40 || c.x < -40) return;
        const info = COLLECTIBLES[c.type];
        const bobY = c.y + Math.sin(c.bobPhase) * 8;

        // Glow
        ctx.globalAlpha = 0.25 + Math.sin(c.bobPhase * 1.5) * 0.1;
        ctx.fillStyle = info.power ? '#FFD600' : '#FFF';
        ctx.beginPath();
        ctx.arc(c.x, bobY, c.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Power-ups pulse bigger
        let drawSize = c.size;
        if (info.power) drawSize += Math.sin(c.bobPhase * 2) * 4;

        ctx.font = drawSize + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, c.x, bobY);
    });

    // Player
    renderPlayer(p, world);

    // Particles on top
    g.particles.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot * Math.PI / 180);
        ctx.font = pt.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.emoji, 0, 0);
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function renderPlayer(p, world) {
    const g = game;

    // Shield aura
    if (g.power === 'magnet') {
        const pulse = Math.sin(Date.now() * 0.005) * 0.1;
        ctx.globalAlpha = 0.15 + pulse;
        ctx.fillStyle = '#64B5F6';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Magnet ring
        ctx.strokeStyle = 'rgba(100,181,246,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 80 + Math.sin(Date.now() * 0.003) * 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Wings
    if (g.power === 'fly') {
        const flap = Math.sin(Date.now() * 0.015) * 8;
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪽', p.x - 8, p.y + 18 + flap);
        ctx.fillText('🪽', p.x + p.w + 8, p.y + 18 - flap);
    }

    // Speed lines
    if (g.power === 'speed') {
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
            const ly = p.y + 8 + i * 10;
            const colors = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00'];
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(p.x - 5, ly);
            ctx.lineTo(p.x - 25 - Math.random() * 25, ly);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // Squash & stretch
    let sx = 1, sy = 1;
    if (p.vy < -4) { sx = 0.85; sy = 1.18; }
    else if (p.vy > 5) { sx = 1.18; sy = 0.85; }

    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(sx, sy);
    ctx.font = '42px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦄', 0, 0);
    ctx.restore();

    // Combo indicator near player
    if (g.combo >= 3) {
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(g.combo + 'x', p.x + p.w / 2, p.y - 12);
        ctx.globalAlpha = 1;
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ---- UI ----
function showCombo(text) {
    comboDisplay.textContent = text;
    comboDisplay.classList.remove('visible');
    void comboDisplay.offsetWidth;
    comboDisplay.classList.add('visible');
    setTimeout(() => comboDisplay.classList.remove('visible'), 900);
}

function showEncouragement(text) {
    if (game.encourageTimer > 0) return;
    game.encourageTimer = 80;
    encouragement.textContent = text;
    encouragement.classList.remove('visible');
    void encouragement.offsetWidth;
    encouragement.classList.add('visible');
    setTimeout(() => encouragement.classList.remove('visible'), 1500);
}

function showPowerIndicator(power) {
    const labels = { speed: '🌈 RAINBOW SPEED!', fly: '🧚 FLYING!', magnet: '🧲 STAR MAGNET!' };
    powerIndicator.textContent = labels[power] || '';
    powerIndicator.classList.add('visible');
}

function hidePowerIndicator() { powerIndicator.classList.remove('visible'); }

// ---- GAME OVER ----
function gameOver() {
    if (!game) return;
    game.running = false;
    SFX.gameOver();

    const isNew = game.score > bestScore;
    if (isNew) {
        bestScore = game.score;
        localStorage.setItem('emilyBest2', bestScore);
    }

    setTimeout(() => {
        document.getElementById('final-score').textContent = game.score;
        document.getElementById('final-best').textContent = bestScore;
        document.getElementById('final-world').textContent = WORLDS[game.worldIndex].name;
        document.getElementById('final-friends').textContent = game.friendsMet;
        document.getElementById('new-best-row').style.display = isNew ? 'flex' : 'none';

        const titles = ['Amazing Job Emily!', 'Great Job Emily!', 'Wonderful Emily!', 'Super Emily!', 'You Rock Emily!'];
        document.getElementById('gameover-title').textContent = titles[Math.floor(Math.random() * titles.length)];
        document.getElementById('gameover-emoji').textContent = isNew ? '🏆' : ['🦄', '🌟', '💪', '👏', '🎉'][Math.floor(Math.random() * 5)];

        showScreen('gameover');
    }, 700);
}

hudBest.textContent = bestScore;
