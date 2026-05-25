// ============================================================
// EMILY'S UNICORN SKY JUMP - Canvas Platformer
// ============================================================

// ---- CONSTANTS ----
const GRAVITY = 0.55;
const JUMP_FORCE = -12.5;
const DOUBLE_JUMP_FORCE = -10.5;
const MOVE_SPEED_BASE = 3;
const PLATFORM_GAP_MIN = 50;
const PLATFORM_GAP_MAX = 130;
const PLATFORM_WIDTH_MIN = 70;
const PLATFORM_WIDTH_MAX = 160;

const WORLDS = [
    {
        name: 'Flower Meadow',
        skyTop: '#87CEEB', skyBot: '#E0F7FA',
        groundColor: '#4CAF50',
        platColor: '#66BB6A', platBorder: '#43A047',
        accent: '#E91E63',
        particles: ['🌸', '🌺', '🌻', '🌷', '🦋'],
        emoji: '🌸',
    },
    {
        name: 'Candy Kingdom',
        skyTop: '#F8BBD0', skyBot: '#FCE4EC',
        groundColor: '#E91E63',
        platColor: '#F06292', platBorder: '#EC407A',
        accent: '#FF6F00',
        particles: ['🍬', '🍭', '🧁', '🍩', '🎀'],
        emoji: '🍬',
    },
    {
        name: 'Cloud Castle',
        skyTop: '#7E57C2', skyBot: '#B39DDB',
        groundColor: '#9575CD',
        platColor: '#B39DDB', platBorder: '#9575CD',
        accent: '#FFD600',
        particles: ['☁️', '✨', '🏰', '💫', '🌙'],
        emoji: '☁️',
    },
    {
        name: 'Crystal Caves',
        skyTop: '#0D47A1', skyBot: '#1565C0',
        groundColor: '#0D47A1',
        platColor: '#42A5F5', platBorder: '#1E88E5',
        accent: '#00E5FF',
        particles: ['💎', '🔮', '💠', '✨', '🌟'],
        emoji: '💎',
    },
    {
        name: 'Rainbow Road',
        skyTop: '#4A148C', skyBot: '#7B1FA2',
        groundColor: '#6A1B9A',
        platColor: '#AB47BC', platBorder: '#8E24AA',
        accent: '#FF4081',
        particles: ['🌈', '⭐', '💖', '🦄', '✨'],
        rainbow: true,
        emoji: '🌈',
    },
    {
        name: 'Starlight Galaxy',
        skyTop: '#0a0a2a', skyBot: '#1a1a4a',
        groundColor: '#1a1a3a',
        platColor: '#3F51B5', platBorder: '#303F9F',
        accent: '#FFEB3B',
        particles: ['⭐', '🌟', '💫', '🪐', '🚀'],
        stars: true,
        emoji: '🚀',
    },
];

const COLLECTIBLE_TYPES = {
    star: { emoji: '⭐', points: 10, size: 24 },
    gem: { emoji: '💎', points: 25, size: 26 },
    heart: { emoji: '💖', points: 15, size: 24 },
    rainbow: { emoji: '🌈', points: 50, size: 30, power: 'speed' },
    wings: { emoji: '🧚', points: 30, size: 28, power: 'fly' },
    shield: { emoji: '🛡️', points: 20, size: 26, power: 'shield' },
};

// ---- AUDIO ----
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, dur, type = 'sine', vol = 0.12) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
}

const SFX = {
    jump: () => { playTone(520, 0.12); setTimeout(() => playTone(680, 0.1), 50); },
    doubleJump: () => { playTone(700, 0.1); setTimeout(() => playTone(900, 0.12), 50); },
    collect: () => { playTone(880, 0.08); setTimeout(() => playTone(1100, 0.1), 60); },
    powerup: () => { [0,1,2,3,4].forEach(i => setTimeout(() => playTone(500 + i * 200, 0.15, 'sine', 0.08), i * 60)); },
    land: () => playTone(200, 0.08, 'triangle', 0.06),
    fall: () => { playTone(400, 0.3, 'sawtooth', 0.08); setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.06), 150); },
    worldUp: () => { [523,659,784,1047].forEach((n,i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.1), i * 120)); },
    combo: () => { playTone(1047, 0.1); setTimeout(() => playTone(1319, 0.15), 80); },
};

// ---- DOM ----
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('hud-score');
const hudBest = document.getElementById('hud-best');
const hudWorld = document.getElementById('hud-world');
const powerIndicator = document.getElementById('power-indicator');
const comboDisplay = document.getElementById('combo-display');

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

// ---- SCREEN NAVIGATION ----
document.getElementById('btn-play').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-play2').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-how').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('welcome'));
document.getElementById('btn-retry').addEventListener('click', () => startGame());
document.getElementById('btn-menu').addEventListener('click', () => showScreen('welcome'));

// ---- CANVAS RESIZE ----
let W, H, scale;
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = window.devicePixelRatio;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ---- GAME STATE ----
let game = null;
let bestScore = parseInt(localStorage.getItem('emilyBest')) || 0;

function startGame() {
    showScreen('game');
    hudBest.textContent = bestScore;

    game = {
        running: true,
        score: 0,
        distance: 0,
        worldIndex: 0,
        speed: MOVE_SPEED_BASE,
        scrollX: 0,
        combo: 0,
        comboTimer: 0,
        shakeTimer: 0,
        shakeIntensity: 0,

        player: {
            x: 80,
            y: H - 160,
            w: 36,
            h: 42,
            vy: 0,
            onGround: false,
            jumps: 0,
            maxJumps: 2,
            facing: 1,
            frame: 0,
            frameTimer: 0,
            trail: [],
        },

        platforms: [],
        collectibles: [],
        particles: [],
        bgParticles: [],
        bgStars: [],

        power: null,
        powerTimer: 0,

        cameraX: 0,
        nextPlatX: 0,
        groundY: H - 60,
    };

    generateInitialPlatforms();
    generateBgStars();
    hudScore.textContent = '0';
    hudWorld.textContent = WORLDS[0].name;
    requestAnimationFrame(gameLoop);
}

// ---- PLATFORM GENERATION ----
function generateInitialPlatforms() {
    const g = game;
    g.platforms = [];
    let x = -50;
    // starting ground
    g.platforms.push({ x: -50, y: g.groundY, w: W + 100, type: 'ground' });

    x = 100;
    for (let i = 0; i < 20; i++) {
        addPlatform(x);
        x = g.nextPlatX;
    }
}

function addPlatform(startX) {
    const g = game;
    const world = WORLDS[g.worldIndex];
    const w = PLATFORM_WIDTH_MIN + Math.random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN);
    const gapX = 60 + Math.random() * (80 + g.speed * 8);
    const x = startX || g.nextPlatX + gapX;

    const minY = 100;
    const maxY = g.groundY - 30;
    let y;
    if (g.platforms.length > 1) {
        const last = g.platforms[g.platforms.length - 1];
        const dy = -120 + Math.random() * 240;
        y = Math.max(minY, Math.min(maxY, last.y + dy));
    } else {
        y = g.groundY - 80 - Math.random() * 150;
    }

    let type = 'normal';
    const r = Math.random();
    if (r < 0.1 && g.distance > 500) type = 'bouncy';
    else if (r < 0.18 && g.distance > 800) type = 'moving';
    else if (r < 0.24 && g.distance > 1200) type = 'crumble';

    const plat = { x, y, w, type, oy: y, moveDir: 1, crumbleTimer: -1 };
    g.platforms.push(plat);
    g.nextPlatX = x + w + gapX;

    if (Math.random() < 0.6) {
        addCollectible(x + w * 0.3 + Math.random() * w * 0.4, y - 40 - Math.random() * 60);
    }
    if (Math.random() < 0.2) {
        for (let i = 0; i < 3; i++) {
            addCollectible(x + w * 0.2 + i * 30, y - 50 - Math.random() * 30);
        }
    }
}

function addCollectible(x, y) {
    const g = game;
    const r = Math.random();
    let type;
    if (r < 0.45) type = 'star';
    else if (r < 0.65) type = 'gem';
    else if (r < 0.80) type = 'heart';
    else if (r < 0.88) type = 'rainbow';
    else if (r < 0.95) type = 'wings';
    else type = 'shield';

    const info = COLLECTIBLE_TYPES[type];
    g.collectibles.push({ x, y, type, size: info.size, bobPhase: Math.random() * Math.PI * 2, collected: false });
}

function generateBgStars() {
    game.bgStars = [];
    for (let i = 0; i < 60; i++) {
        game.bgStars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.7,
            size: 1 + Math.random() * 2.5,
            twinkle: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
        });
    }
}

// ---- INPUT ----
let inputPressed = false;

function handleInput(e) {
    if (!game || !game.running) return;
    e.preventDefault();
    initAudio();

    const p = game.player;
    if (p.jumps < p.maxJumps) {
        if (p.jumps === 0) {
            p.vy = JUMP_FORCE;
            SFX.jump();
        } else {
            p.vy = DOUBLE_JUMP_FORCE;
            SFX.doubleJump();
            spawnParticles(p.x + p.w / 2, p.y + p.h, ['💫', '✨', '⭐'], 5, true);
        }
        p.onGround = false;
        p.jumps++;
    }
}

canvas.addEventListener('touchstart', handleInput, { passive: false });
canvas.addEventListener('mousedown', handleInput);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleInput(e);
    }
});

// ---- PARTICLES ----
function spawnParticles(x, y, emojis, count, upward) {
    for (let i = 0; i < count; i++) {
        const angle = upward
            ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
            : Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        game.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (upward ? 2 : 0),
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            size: 14 + Math.random() * 14,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
        });
    }
}

function spawnCollectParticles(x, y, emoji) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        game.particles.push({
            x, y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3 - 2,
            life: 1,
            decay: 0.025,
            emoji: i % 2 === 0 ? emoji : '✨',
            size: 16 + Math.random() * 10,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 8,
        });
    }
}

// ---- GAME LOOP ----
let lastTime = 0;
function gameLoop(timestamp) {
    if (!game || !game.running) return;

    const dt = Math.min((timestamp - lastTime) / 16.67, 2.5);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ---- UPDATE ----
function update(dt) {
    const g = game;
    const p = g.player;
    const world = WORLDS[g.worldIndex];

    // Speed increases gradually
    g.speed = MOVE_SPEED_BASE + g.distance * 0.0008;
    if (g.power === 'speed') g.speed *= 1.6;

    // Scroll
    const scrollSpeed = g.speed * dt;
    g.scrollX += scrollSpeed;
    g.distance += scrollSpeed;

    // World transitions
    const newWorldIndex = Math.min(WORLDS.length - 1, Math.floor(g.distance / 2000));
    if (newWorldIndex !== g.worldIndex) {
        g.worldIndex = newWorldIndex;
        hudWorld.textContent = WORLDS[g.worldIndex].name;
        SFX.worldUp();
        showCombo(WORLDS[g.worldIndex].emoji + ' ' + WORLDS[g.worldIndex].name + '!');
    }

    // Player physics
    if (g.power === 'fly') {
        p.vy = Math.max(p.vy, -3);
        p.vy += GRAVITY * 0.3 * dt;
    } else {
        p.vy += GRAVITY * dt;
    }
    p.y += p.vy * dt;

    // Player trail
    p.frameTimer += dt;
    if (p.frameTimer > 3) {
        p.frameTimer = 0;
        p.trail.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, life: 1 });
        if (p.trail.length > 12) p.trail.shift();
    }
    p.trail.forEach(t => t.life -= 0.04 * dt);
    p.trail = p.trail.filter(t => t.life > 0);

    // Platform collision & scrolling
    p.onGround = false;
    for (let i = g.platforms.length - 1; i >= 0; i--) {
        const plat = g.platforms[i];

        // Scroll platforms
        if (plat.type !== 'ground') {
            plat.x -= scrollSpeed;
        } else {
            plat.x -= scrollSpeed;
        }

        // Moving platforms
        if (plat.type === 'moving') {
            plat.y += Math.sin(Date.now() * 0.003 + plat.x * 0.01) * 0.8 * dt;
        }

        // Crumbling
        if (plat.type === 'crumble' && plat.crumbleTimer > 0) {
            plat.crumbleTimer -= dt;
            if (plat.crumbleTimer <= 0) {
                g.platforms.splice(i, 1);
                continue;
            }
        }

        // Remove off-screen
        if (plat.x + plat.w < -100) {
            g.platforms.splice(i, 1);
            continue;
        }

        // Collision (only when falling)
        if (p.vy >= 0) {
            const px = p.x + p.w / 2;
            if (px > plat.x && px < plat.x + plat.w &&
                p.y + p.h >= plat.y && p.y + p.h <= plat.y + 20) {
                p.y = plat.y - p.h;
                p.vy = 0;
                p.onGround = true;
                p.jumps = 0;

                if (plat.type === 'bouncy') {
                    p.vy = JUMP_FORCE * 1.4;
                    p.onGround = false;
                    p.jumps = 1;
                    SFX.jump();
                    spawnParticles(p.x + p.w / 2, p.y + p.h, ['💥', '⭐', '✨'], 6, true);
                }

                if (plat.type === 'crumble' && plat.crumbleTimer < 0) {
                    plat.crumbleTimer = 30;
                }
            }
        }
    }

    // Generate new platforms
    const rightEdge = g.scrollX + W;
    while (g.nextPlatX < rightEdge + 400) {
        addPlatform();
    }

    // Collectibles
    for (let i = g.collectibles.length - 1; i >= 0; i--) {
        const c = g.collectibles[i];
        c.x -= scrollSpeed;
        c.bobPhase += 0.05 * dt;

        if (c.x < -50) {
            g.collectibles.splice(i, 1);
            continue;
        }

        if (c.collected) continue;

        // Collision with player
        const cx = c.x;
        const cy = c.y + Math.sin(c.bobPhase) * 6;
        const dx = (p.x + p.w / 2) - cx;
        const dy = (p.y + p.h / 2) - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let collectRadius = c.size + 10;
        if (g.power === 'shield') collectRadius += 30;

        if (dist < collectRadius) {
            c.collected = true;
            const info = COLLECTIBLE_TYPES[c.type];

            // Combo system
            g.combo++;
            g.comboTimer = 60;
            let points = info.points;
            if (g.combo >= 3) points = Math.floor(points * (1 + g.combo * 0.2));

            g.score += points;
            hudScore.textContent = g.score;
            SFX.collect();

            spawnCollectParticles(cx, cy, info.emoji);

            if (g.combo === 5) { showCombo('5x COMBO! 🔥'); SFX.combo(); }
            else if (g.combo === 10) { showCombo('10x AMAZING! 💫'); SFX.combo(); }
            else if (g.combo === 20) { showCombo('20x INCREDIBLE! 🌈'); SFX.combo(); }

            // Power-ups
            if (info.power) {
                g.power = info.power;
                g.powerTimer = info.power === 'fly' ? 200 : 300;
                SFX.powerup();
                showPowerIndicator(info.power);
                if (info.power === 'fly') {
                    p.maxJumps = 99;
                }
            }

            setTimeout(() => {
                g.collectibles = g.collectibles.filter(cc => cc !== c);
            }, 100);
        }
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
            if (g.power === 'fly') p.maxJumps = 2;
            g.power = null;
            hidePowerIndicator();
        }
    }

    // Particles
    for (let i = g.particles.length - 1; i >= 0; i--) {
        const part = g.particles[i];
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.vy += 0.1 * dt;
        part.life -= part.decay * dt;
        part.rotation += part.rotSpeed * dt;
        if (part.life <= 0) g.particles.splice(i, 1);
    }

    // Background particles
    if (Math.random() < 0.05 * dt) {
        g.bgParticles.push({
            x: W + 20,
            y: Math.random() * H * 0.8,
            vx: -1 - Math.random() * 2,
            vy: -0.5 + Math.random(),
            life: 1,
            decay: 0.005 + Math.random() * 0.005,
            emoji: world.particles[Math.floor(Math.random() * world.particles.length)],
            size: 16 + Math.random() * 18,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 3,
        });
    }
    for (let i = g.bgParticles.length - 1; i >= 0; i--) {
        const bp = g.bgParticles[i];
        bp.x += bp.vx * dt;
        bp.y += bp.vy * dt;
        bp.life -= bp.decay * dt;
        bp.rotation += bp.rotSpeed * dt;
        if (bp.life <= 0 || bp.x < -30) g.bgParticles.splice(i, 1);
    }

    // Background stars twinkle
    g.bgStars.forEach(s => {
        s.twinkle += 0.03 * dt;
    });

    // Shake
    if (g.shakeTimer > 0) g.shakeTimer -= dt;

    // Fall detection
    if (p.y > H + 50) {
        gameOver();
    }
}

// ---- RENDER ----
function render() {
    const g = game;
    const world = WORLDS[g.worldIndex];

    // Shake offset
    let sx = 0, sy = 0;
    if (g.shakeTimer > 0) {
        sx = (Math.random() - 0.5) * g.shakeIntensity;
        sy = (Math.random() - 0.5) * g.shakeIntensity;
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, world.skyTop);
    skyGrad.addColorStop(1, world.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Background stars (for space/galaxy worlds)
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

    // Rainbow background effect
    if (world.rainbow) {
        const colors = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];
        colors.forEach((c, i) => {
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = c;
            const bandH = H / colors.length;
            ctx.fillRect(0, i * bandH + Math.sin(Date.now() * 0.001 + i) * 20, W, bandH + 5);
        });
        ctx.globalAlpha = 1;
    }

    // Background particles
    g.bgParticles.forEach(bp => {
        ctx.globalAlpha = bp.life * 0.5;
        ctx.save();
        ctx.translate(bp.x, bp.y);
        ctx.rotate(bp.rotation * Math.PI / 180);
        ctx.font = bp.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bp.emoji, 0, 0);
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Platforms
    g.platforms.forEach(plat => {
        if (plat.x > W + 50 || plat.x + plat.w < -50) return;

        const py = plat.y;
        let color = world.platColor;
        let border = world.platBorder;

        if (plat.type === 'bouncy') { color = '#FFD600'; border = '#F9A825'; }
        else if (plat.type === 'moving') { color = '#26C6DA'; border = '#00ACC1'; }
        else if (plat.type === 'crumble') {
            color = '#FF8A65';
            border = '#FF7043';
            if (plat.crumbleTimer > 0 && plat.crumbleTimer < 20) {
                ctx.globalAlpha = plat.crumbleTimer / 20;
            }
        }

        // Platform shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        roundRect(ctx, plat.x + 3, py + 5, plat.w, 18, 8);
        ctx.fill();

        // Platform body
        ctx.fillStyle = color;
        roundRect(ctx, plat.x, py, plat.w, 16, 8);
        ctx.fill();

        // Platform top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        roundRect(ctx, plat.x + 4, py + 2, plat.w - 8, 6, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        roundRect(ctx, plat.x, py, plat.w, 16, 8);
        ctx.stroke();

        // Bouncy indicator
        if (plat.type === 'bouncy') {
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌟', plat.x + plat.w / 2, py - 4);
        }

        ctx.globalAlpha = 1;
    });

    // Collectibles
    g.collectibles.forEach(c => {
        if (c.collected || c.x > W + 50 || c.x < -50) return;
        const info = COLLECTIBLE_TYPES[c.type];
        const bobY = c.y + Math.sin(c.bobPhase) * 6;

        // Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = info.power ? '#FFD600' : '#FFF';
        ctx.beginPath();
        ctx.arc(c.x, bobY, c.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.font = c.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, c.x, bobY);
    });

    // Player
    renderPlayer(g.player, world);

    // Particles
    g.particles.forEach(part => {
        ctx.globalAlpha = part.life;
        ctx.save();
        ctx.translate(part.x, part.y);
        ctx.rotate(part.rotation * Math.PI / 180);
        ctx.font = part.size + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(part.emoji, 0, 0);
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function renderPlayer(p, world) {
    const g = game;

    // Trail
    if (g.power) {
        p.trail.forEach(t => {
            ctx.globalAlpha = t.life * 0.4;
            let trailEmoji = '✨';
            if (g.power === 'speed') trailEmoji = '🌈';
            else if (g.power === 'fly') trailEmoji = '💫';
            else if (g.power === 'shield') trailEmoji = '🛡️';
            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.fillText(trailEmoji, t.x, t.y);
        });
        ctx.globalAlpha = 1;
    }

    // Shield visual
    if (g.power === 'shield') {
        ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.fillStyle = '#64B5F6';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Wing visual
    if (g.power === 'fly') {
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        const wingFlap = Math.sin(Date.now() * 0.01) * 5;
        ctx.fillText('🪽', p.x - 5, p.y + 15 + wingFlap);
        ctx.fillText('🪽', p.x + p.w + 5, p.y + 15 - wingFlap);
    }

    // Player character
    ctx.font = '38px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let emoji = '🦄';
    if (p.vy < -2) emoji = '🦄';
    if (p.vy > 4) emoji = '🦄';

    // Squash and stretch
    let scaleX = 1, scaleY = 1;
    if (p.vy < -5) { scaleX = 0.85; scaleY = 1.15; }
    else if (p.vy > 5) { scaleX = 1.15; scaleY = 0.85; }

    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(scaleX * p.facing, scaleY);
    ctx.fillText(emoji, 0, 0);
    ctx.restore();

    // Speed lines
    if (g.power === 'speed') {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const ly = p.y + 10 + i * 12;
            ctx.beginPath();
            ctx.moveTo(p.x - 10 - Math.random() * 20, ly);
            ctx.lineTo(p.x - 30 - Math.random() * 30, ly);
            ctx.stroke();
        }
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

// ---- UI HELPERS ----
function showCombo(text) {
    comboDisplay.textContent = text;
    comboDisplay.classList.add('visible');
    setTimeout(() => comboDisplay.classList.remove('visible'), 800);
}

function showPowerIndicator(power) {
    const labels = { speed: '🌈 RAINBOW SPEED!', fly: '🧚 FLYING!', shield: '🛡️ STAR MAGNET!' };
    powerIndicator.textContent = labels[power] || '';
    powerIndicator.classList.add('visible');
}

function hidePowerIndicator() {
    powerIndicator.classList.remove('visible');
}

// ---- GAME OVER ----
function gameOver() {
    if (!game) return;
    game.running = false;
    SFX.fall();

    const isNewBest = game.score > bestScore;
    if (isNewBest) {
        bestScore = game.score;
        localStorage.setItem('emilyBest', bestScore);
    }

    setTimeout(() => {
        document.getElementById('final-score').textContent = game.score;
        document.getElementById('final-best').textContent = bestScore;
        document.getElementById('final-world').textContent = WORLDS[game.worldIndex].name;
        document.getElementById('new-best-row').style.display = isNewBest ? 'flex' : 'none';

        const emojis = ['🦄', '🌟', '💪', '👏', '🎉'];
        document.getElementById('gameover-emoji').textContent = isNewBest ? '🏆' : emojis[Math.floor(Math.random() * emojis.length)];

        showScreen('gameover');
    }, 600);
}

// ---- INITIALIZE ----
hudBest.textContent = bestScore;
