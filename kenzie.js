/**
 * KENZIE - iPhone Touchscreen Platformer Game
 * Optimized for Chrome on iPhone
 */

// ===== CONFIGURATION =====
const CONFIG = {
    GRAVITY: 0.5,
    FRICTION: 0.85,
    PLAYER_SPEED: 4,
    JUMP_FORCE: -11,
    DOUBLE_JUMP_FORCE: -9,
    MAX_LIVES: 3,
    MAX_HEALTH: 100,
    INVINCIBILITY_TIME: 1500,
    GEM_SCORE: 100,
    ENEMY_KILL_SCORE: 200,
    LEVEL_COMPLETE_BONUS: 500,
    TOTAL_LEVELS: 8
};

// ===== GAME STATE =====
let canvas, ctx;
let gameState = 'menu';
let currentLevel = 1;
let score = 0;
let totalGems = 0;
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
    action: false
};

// ===== PLAYER =====
let player = {
    x: 50,
    y: 300,
    width: 35,
    height: 45,
    velX: 0,
    velY: 0,
    health: CONFIG.MAX_HEALTH,
    isOnGround: false,
    canDoubleJump: true,
    direction: 1,
    isInvincible: false,
    invincibleTimer: 0,
    power: null,
    powerTimer: 0
};

// ===== GAME OBJECTS =====
let platforms = [];
let gems = [];
let enemies = [];
let powerUps = [];
let particles = [];
let projectiles = [];
let portal = null;

// ===== LEVEL DATA (Compact for mobile) =====
const LEVELS = [
    {
        name: "Meadow",
        bg: ['#87CEEB', '#4CAF50'],
        platforms: [
            [0, 520, 400, 40],
            [120, 420, 100, 20],
            [280, 340, 100, 20],
            [100, 260, 80, 20],
            [250, 180, 120, 20]
        ],
        gems: [[150, 380], [310, 300], [130, 220], [300, 140]],
        enemies: [[200, 480, 80]],
        powerUps: [],
        portal: [290, 100],
        start: [30, 450]
    },
    {
        name: "Clouds",
        bg: ['#4A90D9', '#87CEEB'],
        platforms: [
            [0, 520, 120, 40],
            [160, 440, 80, 20],
            [80, 350, 80, 20],
            [200, 270, 80, 20],
            [60, 180, 100, 20],
            [220, 100, 120, 20]
        ],
        gems: [[180, 400], [110, 310], [230, 230], [90, 140], [270, 60]],
        enemies: [[100, 310, 60], [240, 230, 50]],
        powerUps: [[270, 50, 'shield']],
        portal: [260, 20],
        start: [30, 450]
    },
    {
        name: "Cave",
        bg: ['#1a1a2e', '#2d2d44'],
        platforms: [
            [0, 520, 100, 40],
            [140, 460, 80, 20],
            [260, 400, 80, 20],
            [140, 320, 80, 20],
            [260, 240, 80, 20],
            [100, 160, 100, 20],
            [260, 80, 100, 20]
        ],
        gems: [[160, 420], [280, 360], [160, 280], [280, 200], [140, 120], [300, 40]],
        enemies: [[160, 420, 60], [280, 360, 50], [140, 280, 60]],
        powerUps: [[300, 30, 'speed']],
        portal: [280, 0],
        start: [30, 450]
    },
    {
        name: "Lava",
        bg: ['#2c1810', '#8B0000'],
        platforms: [
            [0, 520, 90, 40],
            [130, 460, 70, 20],
            [240, 400, 70, 20],
            [100, 320, 70, 20],
            [200, 240, 80, 20],
            [50, 160, 80, 20],
            [180, 80, 100, 20]
        ],
        gems: [[150, 420], [260, 360], [120, 280], [230, 200], [80, 120], [220, 40]],
        enemies: [[160, 420, 50], [120, 280, 50], [240, 360, 40]],
        powerUps: [[220, 30, 'fire']],
        portal: [210, 0],
        start: [30, 450]
    },
    {
        name: "Ice",
        bg: ['#a8d8ea', '#e8f4f8'],
        platforms: [
            [0, 520, 100, 40],
            [150, 450, 80, 20],
            [50, 370, 80, 20],
            [180, 290, 80, 20],
            [60, 210, 80, 20],
            [200, 130, 100, 20]
        ],
        gems: [[170, 410], [80, 330], [210, 250], [90, 170], [240, 90]],
        enemies: [[180, 410, 60], [100, 330, 50], [230, 250, 50]],
        powerUps: [[240, 80, 'double_jump']],
        portal: [230, 50],
        start: [30, 450]
    },
    {
        name: "Sky",
        bg: ['#1a1a3e', '#4a4a8a'],
        platforms: [
            [0, 520, 80, 40],
            [120, 450, 70, 20],
            [240, 380, 70, 20],
            [100, 300, 70, 20],
            [220, 220, 80, 20],
            [60, 140, 80, 20],
            [200, 60, 100, 20]
        ],
        gems: [[140, 410], [260, 340], [120, 260], [250, 180], [90, 100], [240, 20]],
        enemies: [[150, 410, 50], [130, 260, 50], [260, 180, 40]],
        powerUps: [[240, 10, 'shield']],
        portal: [220, -20],
        start: [30, 450]
    },
    {
        name: "Jungle",
        bg: ['#1a3a1a', '#2d5a2d'],
        platforms: [
            [0, 520, 100, 40],
            [140, 460, 70, 20],
            [40, 380, 80, 20],
            [180, 300, 70, 20],
            [60, 220, 70, 20],
            [200, 140, 80, 20],
            [80, 60, 100, 20]
        ],
        gems: [[160, 420], [70, 340], [200, 260], [90, 180], [230, 100], [120, 20]],
        enemies: [[170, 420, 50], [90, 340, 60], [220, 260, 50], [110, 180, 40]],
        powerUps: [[120, 10, 'speed']],
        portal: [110, -20],
        start: [30, 450]
    },
    {
        name: "Final",
        bg: ['#0a0a2a', '#2a1a4a'],
        platforms: [
            [0, 520, 80, 40],
            [120, 460, 60, 20],
            [220, 400, 60, 20],
            [80, 330, 60, 20],
            [180, 260, 70, 20],
            [50, 190, 70, 20],
            [170, 120, 80, 20],
            [80, 50, 100, 20]
        ],
        gems: [[140, 420], [240, 360], [100, 290], [200, 220], [80, 150], [200, 80], [120, 10]],
        enemies: [[150, 420, 40], [250, 360, 40], [110, 290, 40], [210, 220, 40], [100, 150, 40]],
        powerUps: [[200, 70, 'fire'], [120, 0, 'shield']],
        portal: [100, -30],
        start: [30, 450]
    }
];

// ===== COLORS =====
const COLORS = {
    player: '#fd79a8',
    playerFace: '#2d3436',
    gem: '#a29bfe',
    enemy: '#e74c3c',
    portal: '#00b894',
    portalInactive: '#636e72',
    shield: '#3498db',
    speed: '#f1c40f',
    fire: '#e67e22',
    double_jump: '#2ecc71'
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
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });

    showScreen('main-menu');
}

function resizeCanvas() {
    const gameScreen = document.getElementById('game-screen');
    const rect = gameScreen.getBoundingClientRect();

    // Only resize if screen is visible and has dimensions
    if (rect.width === 0 || rect.height === 0) {
        return;
    }

    // Account for HUD and controls
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
    // Menu buttons
    document.getElementById('start-btn').addEventListener('click', () => {
        populateLevelSelect();
        showScreen('level-select');
    });
    document.getElementById('how-to-play-btn').addEventListener('click', () => showScreen('how-to-play'));
    document.getElementById('high-scores-btn').addEventListener('click', () => {
        populateHighScores();
        showScreen('high-scores');
    });

    // Back buttons
    document.getElementById('back-from-help').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-scores').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-levels').addEventListener('click', () => showScreen('main-menu'));

    // Game controls
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

    // Touch controls
    setupTouchControls();
}

function setupTouchControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnAction = document.getElementById('btn-action');

    // Prevent default touch behaviors
    [btnLeft, btnRight, btnJump, btnAction].forEach(btn => {
        btn.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        btn.addEventListener('touchend', e => e.preventDefault(), { passive: false });
        btn.addEventListener('touchcancel', e => e.preventDefault(), { passive: false });
    });

    // Left button - touch events
    btnLeft.addEventListener('touchstart', () => { touch.left = true; });
    btnLeft.addEventListener('touchend', () => { touch.left = false; });
    btnLeft.addEventListener('touchcancel', () => { touch.left = false; });
    // Left button - mouse events (for testing)
    btnLeft.addEventListener('mousedown', () => { touch.left = true; });
    btnLeft.addEventListener('mouseup', () => { touch.left = false; });
    btnLeft.addEventListener('mouseleave', () => { touch.left = false; });

    // Right button - touch events
    btnRight.addEventListener('touchstart', () => { touch.right = true; });
    btnRight.addEventListener('touchend', () => { touch.right = false; });
    btnRight.addEventListener('touchcancel', () => { touch.right = false; });
    // Right button - mouse events (for testing)
    btnRight.addEventListener('mousedown', () => { touch.right = true; });
    btnRight.addEventListener('mouseup', () => { touch.right = false; });
    btnRight.addEventListener('mouseleave', () => { touch.right = false; });

    // Jump button - touch events
    btnJump.addEventListener('touchstart', () => {
        touch.jump = true;
        jump();
    });
    btnJump.addEventListener('touchend', () => { touch.jump = false; });
    btnJump.addEventListener('touchcancel', () => { touch.jump = false; });
    // Jump button - mouse events (for testing)
    btnJump.addEventListener('mousedown', () => {
        touch.jump = true;
        jump();
    });
    btnJump.addEventListener('mouseup', () => { touch.jump = false; });
    btnJump.addEventListener('mouseleave', () => { touch.jump = false; });

    // Action button - touch events
    btnAction.addEventListener('touchstart', () => {
        touch.action = true;
        usePower();
    });
    btnAction.addEventListener('touchend', () => { touch.action = false; });
    btnAction.addEventListener('touchcancel', () => { touch.action = false; });
    // Action button - mouse events (for testing)
    btnAction.addEventListener('mousedown', () => {
        touch.action = true;
        usePower();
    });
    btnAction.addEventListener('mouseup', () => { touch.action = false; });
    btnAction.addEventListener('mouseleave', () => { touch.action = false; });

    // Prevent page scrolling/bouncing on touch devices
    document.body.addEventListener('touchmove', e => {
        if (gameState === 'playing') {
            e.preventDefault();
        }
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
            btn.innerHTML = `
                <span>${i}</span>
                <div class="level-stars">
                    ${[1,2,3].map(s => `<span class="star ${s <= data.stars ? 'earned' : ''}">★</span>`).join('')}
                </div>
            `;
            btn.addEventListener('click', () => startLevel(i));
        }
        grid.appendChild(btn);
    }
}

// ===== GAME CONTROL =====
function startLevel(num) {
    currentLevel = num;
    gameState = 'playing';

    // IMPORTANT: Show screen FIRST so canvas has dimensions
    showScreen('game-screen');
    document.getElementById('pause-btn').style.display = 'block';

    // Now resize canvas (screen is visible, so dimensions work)
    resizeCanvas();

    // Now load level with correct canvas dimensions
    loadLevel(num);

    levelStartTime = Date.now();
    gameLoop();
}

function loadLevel(num) {
    const level = LEVELS[num - 1];

    // Safety check - ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas has no dimensions, cannot load level');
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
    player.power = null;
    player.direction = 1;

    // Scale and load platforms
    platforms = level.platforms.map(p => ({
        x: p[0] * scaleX,
        y: p[1] * scaleY,
        width: p[2] * scaleX,
        height: p[3] * scaleY
    }));

    // Load gems
    gems = level.gems.map(g => ({
        x: g[0] * scaleX,
        y: g[1] * scaleY,
        width: 20,
        height: 20,
        collected: false,
        bob: Math.random() * Math.PI * 2
    }));

    // Load enemies
    enemies = level.enemies.map(e => ({
        x: e[0] * scaleX,
        y: e[1] * scaleY,
        startX: e[0] * scaleX,
        width: 30,
        height: 30,
        patrol: e[2] * scaleX,
        direction: 1,
        alive: true
    }));

    // Load power-ups
    powerUps = level.powerUps.map(p => ({
        x: p[0] * scaleX,
        y: p[1] * scaleY,
        width: 25,
        height: 25,
        type: p[2],
        collected: false,
        bob: Math.random() * Math.PI * 2
    }));

    // Portal
    portal = {
        x: level.portal[0] * scaleX,
        y: level.portal[1] * scaleY,
        width: 50,
        height: 60,
        active: false,
        rotation: 0
    };

    particles = [];
    projectiles = [];

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
    totalGems = 0;
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
    updateEnemies();
    updateProjectiles();
    updateParticles();
    updatePortal();
    checkCollisions();
    updateHUD();
}

function updatePlayer() {
    // Movement from touch
    if (touch.left) {
        player.velX = -CONFIG.PLAYER_SPEED * (player.power === 'speed' ? 1.4 : 1);
        player.direction = -1;
    } else if (touch.right) {
        player.velX = CONFIG.PLAYER_SPEED * (player.power === 'speed' ? 1.4 : 1);
        player.direction = 1;
    } else {
        player.velX *= CONFIG.FRICTION;
    }

    // Gravity
    player.velY += CONFIG.GRAVITY;

    // Update position
    player.x += player.velX;
    player.y += player.velY;

    // Platform collisions
    player.isOnGround = false;
    platforms.forEach(plat => {
        if (collides(player, plat)) {
            // Landing on top
            if (player.velY > 0 && player.y + player.height - player.velY <= plat.y + 5) {
                player.y = plat.y - player.height;
                player.velY = 0;
                player.isOnGround = true;
                player.canDoubleJump = true;
            }
            // Hitting bottom
            else if (player.velY < 0 && player.y - player.velY >= plat.y + plat.height - 5) {
                player.y = plat.y + plat.height;
                player.velY = 0;
            }
            // Hitting sides
            else if (player.velX > 0) {
                player.x = plat.x - player.width;
            } else if (player.velX < 0) {
                player.x = plat.x + plat.width;
            }
        }
    });

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Fall death
    if (player.y > canvas.height + 50) {
        playerDeath();
    }

    // Invincibility timer
    if (player.isInvincible) {
        player.invincibleTimer -= 16;
        if (player.invincibleTimer <= 0) player.isInvincible = false;
    }

    // Power timer
    if (player.power && player.power !== 'double_jump') {
        player.powerTimer -= 16;
        if (player.powerTimer <= 0) player.power = null;
    }
}

function jump() {
    if (player.isOnGround) {
        player.velY = CONFIG.JUMP_FORCE;
        player.isOnGround = false;
        createParticles(player.x + player.width/2, player.y + player.height, '#dfe6e9', 5);
    } else if (player.canDoubleJump || player.power === 'double_jump') {
        player.velY = CONFIG.DOUBLE_JUMP_FORCE;
        player.canDoubleJump = false;
        createParticles(player.x + player.width/2, player.y + player.height, '#a29bfe', 5);
    }
}

function usePower() {
    if (player.power === 'fire') {
        projectiles.push({
            x: player.x + (player.direction === 1 ? player.width : 0),
            y: player.y + player.height/2,
            velX: player.direction * 8,
            width: 15,
            height: 15,
            fromPlayer: true
        });
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        enemy.x += enemy.direction * 1.5;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrol) {
            enemy.direction *= -1;
        }
    });
}

function updateProjectiles() {
    projectiles = projectiles.filter(proj => {
        proj.x += proj.velX;

        if (proj.x < -20 || proj.x > canvas.width + 20) return false;

        if (proj.fromPlayer) {
            for (let enemy of enemies) {
                if (enemy.alive && collides(proj, enemy)) {
                    enemy.alive = false;
                    score += CONFIG.ENEMY_KILL_SCORE;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, COLORS.enemy, 10);
                    return false;
                }
            }
        }
        return true;
    });
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.15;
        p.life -= 16;
        p.alpha = p.life / p.maxLife;
        return p.life > 0;
    });
}

function updatePortal() {
    const collected = gems.filter(g => g.collected).length;
    portal.active = collected >= Math.ceil(gems.length * 0.5);
    portal.rotation += 0.04;
}

// ===== COLLISION =====
function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkCollisions() {
    // Gems
    gems.forEach(gem => {
        if (!gem.collected && collides(player, gem)) {
            gem.collected = true;
            score += CONFIG.GEM_SCORE;
            totalGems++;
            createParticles(gem.x, gem.y, COLORS.gem, 8);
        }
    });

    // Power-ups
    powerUps.forEach(pu => {
        if (!pu.collected && collides(player, pu)) {
            pu.collected = true;
            player.power = pu.type;
            player.powerTimer = 12000;
            if (pu.type === 'shield') {
                player.isInvincible = true;
                player.invincibleTimer = 8000;
            }
            createParticles(pu.x, pu.y, COLORS[pu.type], 10);
        }
    });

    // Enemies
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (collides(player, enemy)) {
            // Stomp from above
            if (player.velY > 0 && player.y + player.height - player.velY <= enemy.y + 8) {
                enemy.alive = false;
                player.velY = -8;
                score += CONFIG.ENEMY_KILL_SCORE;
                createParticles(enemy.x + enemy.width/2, enemy.y, COLORS.enemy, 10);
            } else if (!player.isInvincible && player.power !== 'shield') {
                takeDamage(30);
            }
        }
    });

    // Portal
    if (portal.active && collides(player, portal)) {
        levelComplete();
    }
}

function takeDamage(amount) {
    if (player.isInvincible) return;

    player.health -= amount;
    player.isInvincible = true;
    player.invincibleTimer = CONFIG.INVINCIBILITY_TIME;

    createParticles(player.x + player.width/2, player.y + player.height/2, '#e74c3c', 8);

    if (player.health <= 0) playerDeath();
}

function playerDeath() {
    lives--;
    createParticles(player.x + player.width/2, player.y + player.height/2, COLORS.player, 15);

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

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            velX: (Math.random() - 0.5) * 6,
            velY: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color,
            life: 400,
            maxLife: 400,
            alpha: 1
        });
    }
}

// ===== RENDER =====
function render() {
    // Background
    const level = LEVELS[currentLevel - 1];
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, level.bg[0]);
    grad.addColorStop(1, level.bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Platforms
    ctx.fillStyle = '#4a5568';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // Gems
    gems.forEach(gem => {
        if (gem.collected) return;
        const bob = Math.sin(Date.now() / 300 + gem.bob) * 3;
        ctx.fillStyle = COLORS.gem;
        ctx.save();
        ctx.translate(gem.x + gem.width/2, gem.y + gem.height/2 + bob);
        ctx.rotate(Math.PI/4);
        ctx.fillRect(-gem.width/3, -gem.height/3, gem.width*0.66, gem.height*0.66);
        ctx.restore();
    });

    // Power-ups
    powerUps.forEach(pu => {
        if (pu.collected) return;
        const bob = Math.sin(Date.now() / 400 + pu.bob) * 3;
        ctx.fillStyle = COLORS[pu.type];
        ctx.beginPath();
        ctx.arc(pu.x + pu.width/2, pu.y + pu.height/2 + bob, pu.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { shield: 'S', speed: '>', fire: 'F', double_jump: 'J' };
        ctx.fillText(icons[pu.type], pu.x + pu.width/2, pu.y + pu.height/2 + bob);
    });

    // Portal
    ctx.save();
    ctx.translate(portal.x + portal.width/2, portal.y + portal.height/2);
    ctx.rotate(portal.rotation);
    ctx.strokeStyle = portal.active ? COLORS.portal : COLORS.portalInactive;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, portal.width/2, portal.height/2, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (portal.active) {
        ctx.fillStyle = 'rgba(0, 184, 148, 0.3)';
        ctx.fill();
    }
    ctx.restore();

    // Enemies
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        ctx.fillStyle = COLORS.enemy;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 4, 0, Math.PI * 2);
        ctx.arc(enemy.x + enemy.width*2/3, enemy.y + enemy.height/3, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Projectiles
    projectiles.forEach(proj => {
        ctx.fillStyle = COLORS.fire;
        ctx.beginPath();
        ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
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

    // Player
    if (!player.isInvincible || Math.floor(Date.now() / 80) % 2) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.scale(player.direction, 1);

        // Power glow
        if (player.power) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS[player.power];
        }

        // Body
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);

        // Face
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-6, -8, 5, 0, Math.PI * 2);
        ctx.arc(6, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.playerFace;
        ctx.beginPath();
        ctx.arc(-4, -8, 2, 0, Math.PI * 2);
        ctx.arc(8, -8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = COLORS.playerFace;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();
    }
}

// ===== HUD =====
function updateHUD() {
    document.getElementById('health-fill').style.width = `${player.health}%`;
    document.getElementById('lives-count').textContent = lives;
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('gems-count').textContent = `${gems.filter(g => g.collected).length}/${gems.length}`;
}

// ===== LEVEL COMPLETE =====
function levelComplete() {
    gameState = 'complete';
    cancelAnimationFrame(animationFrameId);

    const collected = gems.filter(g => g.collected).length;
    let stars = 1;
    if (collected === gems.length) stars++;
    if (lives === CONFIG.MAX_LIVES) stars++;

    score += CONFIG.LEVEL_COMPLETE_BONUS;

    levelProgress[currentLevel] = {
        completed: true,
        stars: Math.max(levelProgress[currentLevel]?.stars || 0, stars)
    };
    saveLevelProgress();

    document.getElementById('level-score').textContent = score;
    document.getElementById('level-gems').textContent = `${collected}/${gems.length}`;

    const starEls = document.querySelectorAll('#stars-display .star');
    starEls.forEach((el, i) => {
        setTimeout(() => {
            el.classList.toggle('earned', i < stars);
        }, i * 200);
    });

    setTimeout(() => {
        document.getElementById('level-complete').classList.add('active');
    }, 300);
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
    document.getElementById('total-gems').textContent = totalGems;
    document.getElementById('victory-screen').classList.add('active');
}

// ===== HIGH SCORES =====
function saveHighScore() {
    const name = document.getElementById('player-name').value.trim() || 'Player';
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('kenzie_scores', JSON.stringify(highScores));
    document.getElementById('player-name').value = '';
    quitToMenu();
}

function populateHighScores() {
    const list = document.getElementById('scores-list');
    list.innerHTML = '';

    if (highScores.length === 0) {
        list.innerHTML = '<p style="color:#dfe6e9;text-align:center;padding:20px;">No scores yet!</p>';
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
        const prog = localStorage.getItem('kenzie_progress');
        if (prog) levelProgress = JSON.parse(prog);

        const scores = localStorage.getItem('kenzie_scores');
        if (scores) highScores = JSON.parse(scores);
    } catch (e) {}
}

function saveLevelProgress() {
    localStorage.setItem('kenzie_progress', JSON.stringify(levelProgress));
}
