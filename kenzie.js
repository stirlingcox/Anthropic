/**
 * KENZIE ON ICE - Figure Skating Game
 * A touchscreen game for iPhone
 */

// ===== CONFIGURATION =====
const CONFIG = {
    GRAVITY: 0.45,
    ICE_FRICTION: 0.96,  // High value = more sliding on ice!
    AIR_FRICTION: 0.98,
    PLAYER_SPEED: 3.5,
    MAX_SPEED: 8,
    JUMP_FORCE: -12,
    DOUBLE_JUMP_FORCE: -10,
    MAX_LIVES: 3,
    MAX_HEALTH: 100,
    INVINCIBILITY_TIME: 1500,
    STAR_SCORE: 150,
    OBSTACLE_CLEAR_SCORE: 200,
    ROUTINE_COMPLETE_BONUS: 500,
    TOTAL_LEVELS: 8,
    SPIN_DURATION: 800
};

// ===== GAME STATE =====
let canvas, ctx;
let gameState = 'menu';
let currentLevel = 1;
let score = 0;
let totalStars = 0;
let lives = CONFIG.MAX_LIVES;
let levelStartTime = 0;
let animationFrameId = null;
let highScores = [];
let levelProgress = {};

// ===== TOUCH INPUT STATE =====
const touch = {
    left: false,
    right: false,
    jump: false,
    spin: false
};

// ===== PLAYER (Figure Skater) =====
let player = {
    x: 50,
    y: 300,
    width: 32,
    height: 48,
    velX: 0,
    velY: 0,
    health: CONFIG.MAX_HEALTH,
    isOnGround: false,
    canDoubleJump: true,
    direction: 1,
    isInvincible: false,
    invincibleTimer: 0,
    isSpinning: false,
    spinTimer: 0,
    spinAngle: 0,
    skateAngle: 0,  // Lean angle when skating
    trailParticles: []
};

// ===== GAME OBJECTS =====
let platforms = [];  // Ice platforms
let stars = [];      // Collectible stars
let obstacles = [];  // Cones, zambonis, etc.
let powerUps = [];   // Speed boost, shield, etc.
let particles = [];
let iceSparkles = [];
let trophy = null;   // Goal

// ===== ICE RINK LEVELS =====
const LEVELS = [
    {
        name: "Practice Rink",
        bg: ['#1a2a4a', '#2c4a6a'],
        ice: '#a8d4f0',
        platforms: [
            [0, 480, 400, 80],  // Main ice surface
            [80, 380, 100, 20],
            [220, 300, 100, 20]
        ],
        stars: [[120, 340], [260, 260], [180, 440], [300, 440]],
        obstacles: [[200, 440, 'cone']],
        powerUps: [],
        trophy: [280, 220],
        start: [40, 400]
    },
    {
        name: "Junior Rink",
        bg: ['#1a2a4a', '#3a5a7a'],
        ice: '#b8e0f7',
        platforms: [
            [0, 480, 180, 80],
            [220, 480, 180, 80],
            [100, 380, 80, 20],
            [220, 300, 80, 20],
            [80, 220, 100, 20]
        ],
        stars: [[130, 340], [250, 260], [120, 180], [60, 440], [300, 440]],
        obstacles: [[80, 440, 'cone'], [280, 440, 'cone']],
        powerUps: [[120, 170, 'speed']],
        trophy: [110, 140],
        start: [40, 400]
    },
    {
        name: "Frozen Lake",
        bg: ['#0a1a3a', '#2a4a6a'],
        ice: '#c8e8ff',
        platforms: [
            [0, 500, 120, 60],
            [160, 440, 80, 20],
            [60, 360, 80, 20],
            [180, 280, 80, 20],
            [60, 200, 80, 20],
            [200, 120, 100, 20],
            [300, 500, 100, 60]
        ],
        stars: [[90, 320], [210, 240], [90, 160], [240, 80], [180, 400], [340, 460]],
        obstacles: [[180, 400, 'cone'], [90, 320, 'cone']],
        powerUps: [[240, 70, 'shield']],
        trophy: [230, 40],
        start: [40, 420]
    },
    {
        name: "Competition Arena",
        bg: ['#1a1a3a', '#3a3a6a'],
        ice: '#d0e8ff',
        platforms: [
            [0, 500, 100, 60],
            [140, 440, 60, 20],
            [240, 380, 60, 20],
            [120, 300, 60, 20],
            [220, 220, 80, 20],
            [80, 140, 80, 20],
            [200, 60, 100, 20],
            [320, 500, 80, 60]
        ],
        stars: [[160, 400], [260, 340], [140, 260], [250, 180], [110, 100], [240, 20]],
        obstacles: [[160, 400, 'cone'], [260, 340, 'zamboni'], [140, 260, 'cone']],
        powerUps: [[110, 90, 'spin']],
        trophy: [230, -20],
        start: [40, 420]
    },
    {
        name: "Winter Olympics",
        bg: ['#0a0a2a', '#2a2a5a'],
        ice: '#e0f0ff',
        platforms: [
            [0, 500, 80, 60],
            [120, 450, 60, 20],
            [40, 370, 60, 20],
            [140, 290, 60, 20],
            [40, 210, 80, 20],
            [160, 130, 80, 20],
            [60, 50, 100, 20],
            [280, 500, 80, 60]
        ],
        stars: [[140, 410], [60, 330], [160, 250], [80, 170], [190, 90], [100, 10], [310, 460]],
        obstacles: [[140, 410, 'cone'], [60, 330, 'zamboni'], [160, 250, 'cone'], [80, 170, 'cone']],
        powerUps: [[190, 80, 'speed'], [100, 0, 'shield']],
        trophy: [80, -30],
        start: [30, 420]
    },
    {
        name: "Ice Palace",
        bg: ['#0a1a2a', '#1a3a5a'],
        ice: '#c0e0ff',
        platforms: [
            [0, 500, 80, 60],
            [120, 440, 50, 20],
            [200, 380, 50, 20],
            [100, 310, 50, 20],
            [200, 240, 60, 20],
            [80, 170, 60, 20],
            [180, 100, 80, 20],
            [60, 30, 100, 20],
            [300, 500, 80, 60]
        ],
        stars: [[135, 400], [215, 340], [115, 270], [220, 200], [100, 130], [210, 60], [100, -10]],
        obstacles: [[135, 400, 'zamboni'], [115, 270, 'cone'], [100, 130, 'cone'], [210, 60, 'cone']],
        powerUps: [[220, 190, 'spin']],
        trophy: [80, -50],
        start: [30, 420]
    },
    {
        name: "Northern Lights",
        bg: ['#0a0a1a', '#1a2a4a'],
        ice: '#a0d0ff',
        platforms: [
            [0, 500, 80, 60],
            [100, 440, 50, 20],
            [180, 370, 50, 20],
            [80, 300, 50, 20],
            [180, 230, 50, 20],
            [60, 160, 60, 20],
            [160, 90, 60, 20],
            [60, 20, 80, 20],
            [280, 500, 100, 60]
        ],
        stars: [[115, 400], [195, 330], [95, 260], [195, 190], [80, 120], [180, 50], [90, -20], [320, 460]],
        obstacles: [[115, 400, 'cone'], [195, 330, 'zamboni'], [95, 260, 'cone'], [195, 190, 'cone'], [80, 120, 'zamboni']],
        powerUps: [[180, 40, 'shield'], [90, -30, 'speed']],
        trophy: [70, -60],
        start: [30, 420]
    },
    {
        name: "Gold Medal Run",
        bg: ['#050515', '#151535'],
        ice: '#90c0ff',
        platforms: [
            [0, 500, 70, 60],
            [100, 450, 50, 20],
            [180, 390, 50, 20],
            [80, 320, 50, 20],
            [180, 250, 50, 20],
            [60, 180, 50, 20],
            [160, 110, 60, 20],
            [60, 40, 80, 20],
            [180, -30, 80, 20],
            [300, 500, 80, 60]
        ],
        stars: [[115, 410], [195, 350], [95, 280], [195, 210], [75, 140], [180, 70], [90, 0], [200, -70]],
        obstacles: [[115, 410, 'zamboni'], [195, 350, 'cone'], [95, 280, 'zamboni'], [195, 210, 'cone'], [75, 140, 'cone'], [180, 70, 'zamboni']],
        powerUps: [[90, -10, 'spin'], [200, -80, 'shield']],
        trophy: [200, -110],
        start: [25, 420]
    }
];

// ===== COLORS =====
const COLORS = {
    skater: '#ff69b4',
    skaterDress: '#ff1493',
    skaterSkin: '#ffd5d5',
    star: '#ffd700',
    starGlow: '#fff8dc',
    cone: '#ff6b35',
    zamboni: '#4a90d9',
    trophy: '#ffd700',
    trophyBase: '#cd7f32',
    ice: '#a8d4f0',
    iceShine: '#ffffff',
    speed: '#00ff88',
    shield: '#00bfff',
    spin: '#ff69b4',
    particle: '#ffffff'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', init);

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    loadSaveData();
    setupEventListeners();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

    showScreen('main-menu');
}

function resizeCanvas() {
    const gameScreen = document.getElementById('game-screen');
    const rect = gameScreen.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    const hudHeight = 60;
    const controlsHeight = 130;
    const availableHeight = Math.max(200, rect.height - hudHeight - controlsHeight);

    canvas.width = rect.width;
    canvas.height = availableHeight;
    canvas.style.marginTop = hudHeight + 'px';
}

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', () => {
        populateLevelSelect();
        showScreen('level-select');
    });
    document.getElementById('how-to-play-btn').addEventListener('click', () => showScreen('how-to-play'));
    document.getElementById('high-scores-btn').addEventListener('click', () => {
        populateHighScores();
        showScreen('high-scores');
    });

    document.getElementById('back-from-help').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-scores').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-levels').addEventListener('click', () => showScreen('main-menu'));

    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn').addEventListener('click', restartLevel);
    document.getElementById('quit-btn').addEventListener('click', quitToMenu);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);
    document.getElementById('replay-btn').addEventListener('click', restartLevel);
    document.getElementById('retry-btn').addEventListener('click', restartGame);
    document.getElementById('menu-btn').addEventListener('click', quitToMenu);
    document.getElementById('save-score-btn').addEventListener('click', saveHighScore);
    document.getElementById('play-again-btn').addEventListener('click', restartGame);
    document.getElementById('victory-menu-btn').addEventListener('click', quitToMenu);

    setupTouchControls();
}

function setupTouchControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnAction = document.getElementById('btn-action');

    [btnLeft, btnRight, btnJump, btnAction].forEach(btn => {
        btn.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        btn.addEventListener('touchend', e => e.preventDefault(), { passive: false });
    });

    // Left
    btnLeft.addEventListener('touchstart', () => { touch.left = true; });
    btnLeft.addEventListener('touchend', () => { touch.left = false; });
    btnLeft.addEventListener('mousedown', () => { touch.left = true; });
    btnLeft.addEventListener('mouseup', () => { touch.left = false; });
    btnLeft.addEventListener('mouseleave', () => { touch.left = false; });

    // Right
    btnRight.addEventListener('touchstart', () => { touch.right = true; });
    btnRight.addEventListener('touchend', () => { touch.right = false; });
    btnRight.addEventListener('mousedown', () => { touch.right = true; });
    btnRight.addEventListener('mouseup', () => { touch.right = false; });
    btnRight.addEventListener('mouseleave', () => { touch.right = false; });

    // Jump
    btnJump.addEventListener('touchstart', () => { touch.jump = true; jump(); });
    btnJump.addEventListener('touchend', () => { touch.jump = false; });
    btnJump.addEventListener('mousedown', () => { touch.jump = true; jump(); });
    btnJump.addEventListener('mouseup', () => { touch.jump = false; });
    btnJump.addEventListener('mouseleave', () => { touch.jump = false; });

    // Spin
    btnAction.addEventListener('touchstart', () => { touch.spin = true; startSpin(); });
    btnAction.addEventListener('touchend', () => { touch.spin = false; });
    btnAction.addEventListener('mousedown', () => { touch.spin = true; startSpin(); });
    btnAction.addEventListener('mouseup', () => { touch.spin = false; });
    btnAction.addEventListener('mouseleave', () => { touch.spin = false; });

    document.body.addEventListener('touchmove', e => {
        if (gameState === 'playing') e.preventDefault();
    }, { passive: false });
}

// ===== LEVEL SELECT =====
function populateLevelSelect() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= CONFIG.TOTAL_LEVELS; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';

        const unlocked = i === 1 || levelProgress[i - 1];
        const data = levelProgress[i] || { completed: false, stars: 0 };

        if (!unlocked) {
            btn.classList.add('locked');
        } else {
            if (data.completed) btn.classList.add('completed');
            btn.innerHTML = `<span>${i}</span>
                <div class="level-stars">${[1,2,3].map(s =>
                    `<span class="star ${s <= data.stars ? 'earned' : ''}">*</span>`
                ).join('')}</div>`;
            btn.addEventListener('click', () => startLevel(i));
        }
        grid.appendChild(btn);
    }
}

// ===== GAME CONTROL =====
function startLevel(num) {
    currentLevel = num;
    gameState = 'playing';
    showScreen('game-screen');
    document.getElementById('pause-btn').style.display = 'block';
    resizeCanvas();
    loadLevel(num);
    levelStartTime = Date.now();
    gameLoop();
}

function loadLevel(num) {
    const level = LEVELS[num - 1];

    if (canvas.width === 0 || canvas.height === 0) {
        resizeCanvas();
    }

    const scaleX = canvas.width / 400 || 1;
    const scaleY = canvas.height / 560 || 1;

    // Reset player
    player.x = level.start[0] * scaleX;
    player.y = level.start[1] * scaleY;
    player.velX = 0;
    player.velY = 0;
    player.health = CONFIG.MAX_HEALTH;
    player.isOnGround = false;
    player.canDoubleJump = true;
    player.isInvincible = false;
    player.isSpinning = false;
    player.spinTimer = 0;
    player.spinAngle = 0;
    player.skateAngle = 0;
    player.direction = 1;

    // Load platforms (ice surfaces)
    platforms = level.platforms.map(p => ({
        x: p[0] * scaleX,
        y: p[1] * scaleY,
        width: p[2] * scaleX,
        height: p[3] * scaleY
    }));

    // Load stars
    stars = level.stars.map(s => ({
        x: s[0] * scaleX,
        y: s[1] * scaleY,
        width: 24,
        height: 24,
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        sparkle: 0
    }));

    // Load obstacles
    obstacles = level.obstacles.map(o => ({
        x: o[0] * scaleX,
        y: o[1] * scaleY,
        width: o[2] === 'zamboni' ? 45 : 25,
        height: o[2] === 'zamboni' ? 30 : 30,
        type: o[2],
        startX: o[0] * scaleX,
        direction: 1,
        patrol: o[2] === 'zamboni' ? 60 * scaleX : 0,
        active: true
    }));

    // Load power-ups
    powerUps = level.powerUps.map(p => ({
        x: p[0] * scaleX,
        y: p[1] * scaleY,
        width: 28,
        height: 28,
        type: p[2],
        collected: false,
        bob: Math.random() * Math.PI * 2
    }));

    // Trophy goal
    trophy = {
        x: level.trophy[0] * scaleX,
        y: level.trophy[1] * scaleY,
        width: 40,
        height: 50,
        active: false,
        glow: 0
    };

    particles = [];
    iceSparkles = [];

    // Create ambient ice sparkles
    for (let i = 0; i < 15; i++) {
        iceSparkles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            alpha: Math.random(),
            speed: Math.random() * 0.5 + 0.2
        });
    }

    updateHUD();
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        cancelAnimationFrame(animationFrameId);
        document.getElementById('pause-screen').classList.add('active');
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-screen').classList.remove('active');
        gameLoop();
    }
}

function restartLevel() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    loadLevel(currentLevel);
    gameState = 'playing';
    levelStartTime = Date.now();
    gameLoop();
}

function restartGame() {
    lives = CONFIG.MAX_LIVES;
    score = 0;
    totalStars = 0;
    currentLevel = 1;
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    loadLevel(1);
    gameState = 'playing';
    levelStartTime = Date.now();
    gameLoop();
}

function nextLevel() {
    document.getElementById('level-complete').classList.remove('active');
    currentLevel++;
    if (currentLevel > CONFIG.TOTAL_LEVELS) {
        showVictory();
    } else {
        loadLevel(currentLevel);
        gameState = 'playing';
        levelStartTime = Date.now();
        gameLoop();
    }
}

function quitToMenu() {
    gameState = 'menu';
    cancelAnimationFrame(animationFrameId);
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    document.getElementById('pause-btn').style.display = 'none';
    showScreen('main-menu');
}

// ===== GAME LOOP =====
function gameLoop() {
    if (gameState !== 'playing') return;
    update();
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ===== UPDATE =====
function update() {
    updatePlayer();
    updateObstacles();
    updateParticles();
    updateIceSparkles();
    updateTrophy();
    checkCollisions();
    updateHUD();
}

function updatePlayer() {
    // Ice skating physics - accelerate in direction, lots of momentum!
    if (touch.left && !player.isSpinning) {
        player.velX -= CONFIG.PLAYER_SPEED * 0.15;
        player.direction = -1;
        player.skateAngle = Math.max(player.skateAngle - 0.02, -0.2);
    } else if (touch.right && !player.isSpinning) {
        player.velX += CONFIG.PLAYER_SPEED * 0.15;
        player.direction = 1;
        player.skateAngle = Math.min(player.skateAngle + 0.02, 0.2);
    } else {
        player.skateAngle *= 0.9;
    }

    // Clamp speed
    player.velX = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, player.velX));

    // Apply ice friction (very slippery!)
    if (player.isOnGround) {
        player.velX *= CONFIG.ICE_FRICTION;
        // Create ice trail when moving fast
        if (Math.abs(player.velX) > 2 && Math.random() < 0.3) {
            createIceTrail();
        }
    } else {
        player.velX *= CONFIG.AIR_FRICTION;
    }

    // Gravity
    player.velY += CONFIG.GRAVITY;

    // Update position
    player.x += player.velX;
    player.y += player.velY;

    // Platform collision
    player.isOnGround = false;
    platforms.forEach(plat => {
        if (collides(player, plat)) {
            if (player.velY > 0 && player.y + player.height - player.velY <= plat.y + 5) {
                player.y = plat.y - player.height;
                player.velY = 0;
                player.isOnGround = true;
                player.canDoubleJump = true;
            } else if (player.velY < 0 && player.y - player.velY >= plat.y + plat.height - 5) {
                player.y = plat.y + plat.height;
                player.velY = 0;
            } else if (player.velX > 0) {
                player.x = plat.x - player.width;
                player.velX *= -0.3;  // Bounce off walls
            } else if (player.velX < 0) {
                player.x = plat.x + plat.width;
                player.velX *= -0.3;
            }
        }
    });

    // Boundaries
    if (player.x < 0) { player.x = 0; player.velX *= -0.3; }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velX *= -0.3;
    }

    // Fall death
    if (player.y > canvas.height + 50) {
        playerDeath();
    }

    // Spinning
    if (player.isSpinning) {
        player.spinTimer -= 16;
        player.spinAngle += 0.5;
        if (player.spinTimer <= 0) {
            player.isSpinning = false;
            player.spinAngle = 0;
        }
    }

    // Invincibility
    if (player.isInvincible) {
        player.invincibleTimer -= 16;
        if (player.invincibleTimer <= 0) player.isInvincible = false;
    }
}

function jump() {
    if (player.isOnGround) {
        player.velY = CONFIG.JUMP_FORCE;
        player.isOnGround = false;
        createJumpSparkles();
    } else if (player.canDoubleJump) {
        player.velY = CONFIG.DOUBLE_JUMP_FORCE;
        player.canDoubleJump = false;
        createJumpSparkles();
    }
}

function startSpin() {
    if (!player.isSpinning && player.isOnGround) {
        player.isSpinning = true;
        player.spinTimer = CONFIG.SPIN_DURATION;
        player.spinAngle = 0;
        createSpinSparkles();
    }
}

function updateObstacles() {
    obstacles.forEach(obs => {
        if (!obs.active) return;

        // Zambonis patrol back and forth
        if (obs.type === 'zamboni' && obs.patrol > 0) {
            obs.x += obs.direction * 1.2;
            if (Math.abs(obs.x - obs.startX) > obs.patrol) {
                obs.direction *= -1;
            }
        }
    });
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.1;
        p.life -= 16;
        p.alpha = p.life / p.maxLife;
        return p.life > 0;
    });
}

function updateIceSparkles() {
    iceSparkles.forEach(s => {
        s.alpha = 0.3 + Math.sin(Date.now() / 500 + s.x) * 0.3;
    });
}

function updateTrophy() {
    const collected = stars.filter(s => s.collected).length;
    trophy.active = collected >= Math.ceil(stars.length * 0.5);
    trophy.glow = (trophy.glow + 0.05) % (Math.PI * 2);
}

// ===== COLLISION =====
function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkCollisions() {
    // Stars
    stars.forEach(star => {
        if (!star.collected && collides(player, star)) {
            star.collected = true;
            score += CONFIG.STAR_SCORE;
            totalStars++;
            createStarParticles(star.x, star.y);
        }
    });

    // Power-ups
    powerUps.forEach(pu => {
        if (!pu.collected && collides(player, pu)) {
            pu.collected = true;
            applyPowerUp(pu.type);
            createPowerUpParticles(pu.x, pu.y, pu.type);
        }
    });

    // Obstacles
    obstacles.forEach(obs => {
        if (!obs.active) return;

        if (collides(player, obs)) {
            // Spinning destroys obstacles
            if (player.isSpinning) {
                obs.active = false;
                score += CONFIG.OBSTACLE_CLEAR_SCORE;
                createObstacleParticles(obs.x, obs.y, obs.type);
            }
            // Jumping on top clears cones
            else if (player.velY > 0 && player.y + player.height - player.velY <= obs.y + 8 && obs.type === 'cone') {
                obs.active = false;
                player.velY = -8;
                score += CONFIG.OBSTACLE_CLEAR_SCORE;
                createObstacleParticles(obs.x, obs.y, obs.type);
            }
            // Otherwise take damage
            else if (!player.isInvincible) {
                takeDamage(obs.type === 'zamboni' ? 40 : 25);
            }
        }
    });

    // Trophy
    if (trophy.active && collides(player, trophy)) {
        levelComplete();
    }
}

function applyPowerUp(type) {
    switch (type) {
        case 'speed':
            player.velX *= 1.5;
            break;
        case 'shield':
            player.isInvincible = true;
            player.invincibleTimer = 5000;
            break;
        case 'spin':
            player.isSpinning = true;
            player.spinTimer = CONFIG.SPIN_DURATION * 2;
            break;
    }
}

function takeDamage(amount) {
    if (player.isInvincible) return;
    player.health -= amount;
    player.isInvincible = true;
    player.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    createDamageParticles();
    if (player.health <= 0) playerDeath();
}

function playerDeath() {
    lives--;
    createDeathParticles();
    if (lives <= 0) {
        gameOver();
    } else {
        const level = LEVELS[currentLevel - 1];
        const scaleX = canvas.width / 400;
        const scaleY = canvas.height / 560;
        player.x = level.start[0] * scaleX;
        player.y = level.start[1] * scaleY;
        player.velX = 0;
        player.velY = 0;
        player.health = CONFIG.MAX_HEALTH;
        player.isInvincible = true;
        player.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    }
}

// ===== PARTICLE EFFECTS =====
function createParticles(x, y, color, count, spread = 6) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            velX: (Math.random() - 0.5) * spread,
            velY: (Math.random() - 0.5) * spread,
            size: Math.random() * 4 + 2,
            color,
            life: 500,
            maxLife: 500,
            alpha: 1
        });
    }
}

function createIceTrail() {
    particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height,
        velX: -player.velX * 0.1,
        velY: 0,
        size: Math.random() * 3 + 1,
        color: '#ffffff',
        life: 300,
        maxLife: 300,
        alpha: 0.5
    });
}

function createJumpSparkles() {
    createParticles(player.x + player.width/2, player.y + player.height, '#a8d4f0', 6, 4);
}

function createSpinSparkles() {
    createParticles(player.x + player.width/2, player.y + player.height/2, '#ff69b4', 10, 8);
}

function createStarParticles(x, y) {
    createParticles(x, y, COLORS.star, 12, 8);
}

function createPowerUpParticles(x, y, type) {
    createParticles(x, y, COLORS[type], 10, 6);
}

function createObstacleParticles(x, y, type) {
    createParticles(x, y, type === 'cone' ? COLORS.cone : COLORS.zamboni, 8, 5);
}

function createDamageParticles() {
    createParticles(player.x + player.width/2, player.y + player.height/2, '#ff6b6b', 8, 6);
}

function createDeathParticles() {
    createParticles(player.x + player.width/2, player.y + player.height/2, COLORS.skater, 15, 10);
}

// ===== RENDER =====
function render() {
    const level = LEVELS[currentLevel - 1];

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, level.bg[0]);
    grad.addColorStop(1, level.bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ice sparkles in background
    iceSparkles.forEach(s => {
        ctx.globalAlpha = s.alpha * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ice platforms
    platforms.forEach(p => {
        // Ice surface
        const iceGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        iceGrad.addColorStop(0, level.ice);
        iceGrad.addColorStop(0.3, '#ffffff');
        iceGrad.addColorStop(1, level.ice);
        ctx.fillStyle = iceGrad;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Ice shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(p.x, p.y, p.width, 3);

        // Edge
        ctx.strokeStyle = '#5ba3d0';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // Stars
    stars.forEach(star => {
        if (star.collected) return;
        star.rotation += 0.03;
        star.sparkle = (star.sparkle + 0.1) % (Math.PI * 2);

        ctx.save();
        ctx.translate(star.x + star.width/2, star.y + star.height/2 + Math.sin(Date.now()/300) * 3);
        ctx.rotate(star.rotation);

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.star;

        // Star shape
        ctx.fillStyle = COLORS.star;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const r = i % 2 === 0 ? star.width/2 : star.width/4;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });

    // Power-ups
    powerUps.forEach(pu => {
        if (pu.collected) return;
        const bob = Math.sin(Date.now()/400 + pu.bob) * 4;

        ctx.save();
        ctx.translate(pu.x + pu.width/2, pu.y + pu.height/2 + bob);

        ctx.shadowBlur = 12;
        ctx.shadowColor = COLORS[pu.type];
        ctx.fillStyle = COLORS[pu.type];
        ctx.beginPath();
        ctx.arc(0, 0, pu.width/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { speed: '>', shield: 'O', spin: '@' };
        ctx.fillText(icons[pu.type], 0, 0);

        ctx.restore();
    });

    // Trophy
    ctx.save();
    ctx.translate(trophy.x + trophy.width/2, trophy.y + trophy.height/2);

    if (trophy.active) {
        ctx.shadowBlur = 20 + Math.sin(trophy.glow) * 10;
        ctx.shadowColor = COLORS.trophy;
    }

    // Trophy cup
    ctx.fillStyle = trophy.active ? COLORS.trophy : '#666';
    ctx.beginPath();
    ctx.moveTo(-15, -20);
    ctx.lineTo(15, -20);
    ctx.lineTo(12, 5);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();

    // Handles
    ctx.strokeStyle = trophy.active ? COLORS.trophy : '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-18, -10, 8, -0.5, 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18, -10, 8, 1.6, 3.6);
    ctx.stroke();

    // Base
    ctx.fillStyle = trophy.active ? COLORS.trophyBase : '#444';
    ctx.fillRect(-10, 5, 20, 5);
    ctx.fillRect(-15, 10, 30, 8);

    ctx.restore();

    // Obstacles
    obstacles.forEach(obs => {
        if (!obs.active) return;

        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);

        if (obs.type === 'cone') {
            // Traffic cone
            ctx.fillStyle = COLORS.cone;
            ctx.beginPath();
            ctx.moveTo(0, -obs.height/2);
            ctx.lineTo(obs.width/2, obs.height/2);
            ctx.lineTo(-obs.width/2, obs.height/2);
            ctx.closePath();
            ctx.fill();

            // White stripe
            ctx.fillStyle = '#fff';
            ctx.fillRect(-obs.width/3, -5, obs.width*2/3, 6);
        } else {
            // Zamboni
            ctx.fillStyle = COLORS.zamboni;
            ctx.fillRect(-obs.width/2, -obs.height/2, obs.width, obs.height * 0.7);

            // Cab
            ctx.fillStyle = '#2a6090';
            ctx.fillRect(-obs.width/3, -obs.height/2, obs.width/2, obs.height * 0.4);

            // Wheels
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(-obs.width/3, obs.height/3, 5, 0, Math.PI * 2);
            ctx.arc(obs.width/3, obs.height/3, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player (Figure Skater)
    if (!player.isInvincible || Math.floor(Date.now()/80) % 2) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);

        if (player.isSpinning) {
            ctx.rotate(player.spinAngle);
            // Spin sparkle effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff69b4';
        } else {
            ctx.rotate(player.skateAngle);
            ctx.scale(player.direction, 1);
        }

        // Skating dress body
        ctx.fillStyle = COLORS.skaterDress;
        ctx.beginPath();
        ctx.ellipse(0, 5, player.width/2 - 2, player.height/2 - 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tutu/skirt
        ctx.fillStyle = COLORS.skater;
        ctx.beginPath();
        ctx.ellipse(0, 10, player.width/2 + 5, 8, 0, 0, Math.PI);
        ctx.fill();

        // Head
        ctx.fillStyle = COLORS.skaterSkin;
        ctx.beginPath();
        ctx.arc(0, -player.height/4, 10, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#4a3020';
        ctx.beginPath();
        ctx.arc(0, -player.height/4 - 3, 10, Math.PI, 0);
        ctx.fill();

        // Ponytail
        ctx.beginPath();
        ctx.ellipse(8, -player.height/4, 4, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-3, -player.height/4 - 1, 2, 0, Math.PI * 2);
        ctx.arc(3, -player.height/4 - 1, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -player.height/4 + 3, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Skate blade
        ctx.fillStyle = '#ddd';
        ctx.fillRect(-player.width/2, player.height/2 - 3, player.width, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-player.width/2, player.height/2 - 1, player.width, 2);

        ctx.restore();
    }
}

// ===== HUD =====
function updateHUD() {
    document.getElementById('health-fill').style.width = `${player.health}%`;
    document.getElementById('lives-count').textContent = lives;
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('gems-count').textContent = `${stars.filter(s => s.collected).length}/${stars.length}`;
}

// ===== LEVEL COMPLETE =====
function levelComplete() {
    gameState = 'complete';
    cancelAnimationFrame(animationFrameId);

    const collected = stars.filter(s => s.collected).length;
    let earnedStars = 1;
    if (collected === stars.length) earnedStars++;
    if (lives === CONFIG.MAX_LIVES) earnedStars++;

    score += CONFIG.ROUTINE_COMPLETE_BONUS;

    levelProgress[currentLevel] = {
        completed: true,
        stars: Math.max(levelProgress[currentLevel]?.stars || 0, earnedStars)
    };
    saveLevelProgress();

    document.getElementById('level-score').textContent = score;
    document.getElementById('level-gems').textContent = `${collected}/${stars.length}`;

    const starEls = document.querySelectorAll('#stars-display .star');
    starEls.forEach((el, i) => {
        setTimeout(() => el.classList.toggle('earned', i < earnedStars), i * 200);
    });

    setTimeout(() => document.getElementById('level-complete').classList.add('active'), 300);
}

function gameOver() {
    gameState = 'gameover';
    cancelAnimationFrame(animationFrameId);
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.add('active');
}

function showVictory() {
    gameState = 'victory';
    document.getElementById('total-score').textContent = score;
    document.getElementById('total-gems').textContent = totalStars;
    document.getElementById('victory-screen').classList.add('active');
}

// ===== HIGH SCORES =====
function saveHighScore() {
    const name = document.getElementById('player-name').value.trim() || 'Skater';
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('kenzie_ice_scores', JSON.stringify(highScores));
    document.getElementById('player-name').value = '';
    quitToMenu();
}

function populateHighScores() {
    const list = document.getElementById('scores-list');
    list.innerHTML = '';

    if (highScores.length === 0) {
        list.innerHTML = '<p style="color:#a8d4f0;text-align:center;padding:20px;">No scores yet!</p>';
        return;
    }

    highScores.forEach((entry, i) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        if (i === 0) item.classList.add('gold');
        else if (i === 1) item.classList.add('silver');
        else if (i === 2) item.classList.add('bronze');
        item.innerHTML = `
            <span class="score-rank">#${i + 1}</span>
            <span class="score-name">${entry.name}</span>
            <span class="score-value">${entry.score}</span>
        `;
        list.appendChild(item);
    });
}

// ===== SAVE/LOAD =====
function loadSaveData() {
    try {
        const prog = localStorage.getItem('kenzie_ice_progress');
        if (prog) levelProgress = JSON.parse(prog);

        const scores = localStorage.getItem('kenzie_ice_scores');
        if (scores) highScores = JSON.parse(scores);
    } catch (e) {}
}

function saveLevelProgress() {
    localStorage.setItem('kenzie_ice_progress', JSON.stringify(levelProgress));
}
