/**
 * KENZIE'S ADVENTURE - A Fun Platformer Game
 * ===========================================
 * Help Kenzie collect gems, defeat enemies, and reach the portal!
 */

// ===== GAME CONFIGURATION =====
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GRAVITY: 0.6,
    FRICTION: 0.8,
    PLAYER_SPEED: 5,
    JUMP_FORCE: -14,
    DOUBLE_JUMP_FORCE: -12,
    MAX_LIVES: 3,
    MAX_HEALTH: 100,
    INVINCIBILITY_TIME: 2000,
    GEM_SCORE: 100,
    ENEMY_KILL_SCORE: 250,
    LEVEL_COMPLETE_BONUS: 1000,
    TIME_BONUS_MULTIPLIER: 10,
    TOTAL_LEVELS: 12
};

// ===== GAME STATE =====
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// ===== GLOBAL VARIABLES =====
let canvas, ctx;
let gameState = GameState.MENU;
let currentLevel = 1;
let score = 0;
let totalGems = 0;
let lives = CONFIG.MAX_LIVES;
let levelStartTime = 0;
let totalPlayTime = 0;
let settings = {
    sfx: true,
    music: true,
    difficulty: 'normal',
    skin: 'default'
};
let highScores = [];
let levelProgress = {};
let animationFrameId = null;

// ===== PLAYER OBJECT =====
let player = {
    x: 100,
    y: 400,
    width: 40,
    height: 50,
    velX: 0,
    velY: 0,
    health: CONFIG.MAX_HEALTH,
    isJumping: false,
    canDoubleJump: true,
    isOnGround: false,
    direction: 1,
    isInvincible: false,
    invincibleTimer: 0,
    power: null,
    powerTimer: 0,
    animFrame: 0,
    animTimer: 0
};

// ===== INPUT HANDLING =====
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    action: false,
    power: false
};

// ===== GAME OBJECTS =====
let platforms = [];
let gems = [];
let enemies = [];
let powerUps = [];
let particles = [];
let projectiles = [];
let portal = null;

// ===== LEVEL DEFINITIONS =====
const LEVELS = [
    // Level 1 - Introduction
    {
        name: "Green Meadows",
        background: { top: '#87CEEB', bottom: '#228B22' },
        platforms: [
            { x: 0, y: 650, w: 1200, h: 50, type: 'ground' },
            { x: 200, y: 520, w: 150, h: 30, type: 'grass' },
            { x: 450, y: 420, w: 150, h: 30, type: 'grass' },
            { x: 700, y: 320, w: 150, h: 30, type: 'grass' },
            { x: 950, y: 450, w: 150, h: 30, type: 'grass' },
        ],
        gems: [
            { x: 250, y: 480 }, { x: 500, y: 380 }, { x: 750, y: 280 },
            { x: 350, y: 620 }, { x: 550, y: 620 }, { x: 750, y: 620 }
        ],
        enemies: [
            { x: 400, y: 600, type: 'slime', patrol: 100 }
        ],
        powerUps: [
            { x: 1000, y: 400, type: 'shield' }
        ],
        portal: { x: 1050, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 60
    },
    // Level 2 - Getting Higher
    {
        name: "Cloud Climb",
        background: { top: '#4A90D9', bottom: '#87CEEB' },
        platforms: [
            { x: 0, y: 650, w: 300, h: 50, type: 'ground' },
            { x: 100, y: 520, w: 120, h: 30, type: 'cloud' },
            { x: 300, y: 420, w: 120, h: 30, type: 'cloud' },
            { x: 150, y: 300, w: 120, h: 30, type: 'cloud' },
            { x: 400, y: 200, w: 120, h: 30, type: 'cloud' },
            { x: 600, y: 300, w: 120, h: 30, type: 'cloud' },
            { x: 800, y: 400, w: 120, h: 30, type: 'cloud' },
            { x: 950, y: 300, w: 150, h: 30, type: 'cloud' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'ground' }
        ],
        gems: [
            { x: 140, y: 480 }, { x: 340, y: 380 }, { x: 190, y: 260 },
            { x: 440, y: 160 }, { x: 640, y: 260 }, { x: 840, y: 360 },
            { x: 1000, y: 260 }
        ],
        enemies: [
            { x: 350, y: 370, type: 'bird', patrol: 150 },
            { x: 650, y: 250, type: 'bird', patrol: 100 }
        ],
        powerUps: [
            { x: 440, y: 150, type: 'speed' }
        ],
        portal: { x: 1000, y: 200 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 90
    },
    // Level 3 - Underground
    {
        name: "Crystal Caves",
        background: { top: '#1a1a2e', bottom: '#16213e' },
        platforms: [
            { x: 0, y: 650, w: 200, h: 50, type: 'stone' },
            { x: 280, y: 650, w: 150, h: 50, type: 'stone' },
            { x: 250, y: 500, w: 100, h: 30, type: 'stone' },
            { x: 450, y: 580, w: 100, h: 30, type: 'stone' },
            { x: 550, y: 450, w: 150, h: 30, type: 'stone' },
            { x: 400, y: 320, w: 100, h: 30, type: 'stone' },
            { x: 600, y: 200, w: 100, h: 30, type: 'stone' },
            { x: 800, y: 300, w: 100, h: 30, type: 'stone' },
            { x: 950, y: 450, w: 150, h: 30, type: 'stone' },
            { x: 1000, y: 650, w: 200, h: 50, type: 'stone' }
        ],
        gems: [
            { x: 280, y: 460 }, { x: 480, y: 540 }, { x: 600, y: 410 },
            { x: 430, y: 280 }, { x: 630, y: 160 }, { x: 830, y: 260 },
            { x: 1000, y: 410 }, { x: 150, y: 610 }
        ],
        enemies: [
            { x: 300, y: 600, type: 'slime', patrol: 80 },
            { x: 580, y: 400, type: 'bat', patrol: 120 },
            { x: 950, y: 600, type: 'slime', patrol: 100 }
        ],
        powerUps: [
            { x: 630, y: 150, type: 'magnet' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 120
    },
    // Level 4 - Fire World
    {
        name: "Volcanic Fury",
        background: { top: '#2c1810', bottom: '#8B0000' },
        platforms: [
            { x: 0, y: 650, w: 180, h: 50, type: 'lava_rock' },
            { x: 250, y: 600, w: 100, h: 30, type: 'lava_rock' },
            { x: 400, y: 520, w: 120, h: 30, type: 'lava_rock' },
            { x: 300, y: 380, w: 100, h: 30, type: 'lava_rock' },
            { x: 500, y: 300, w: 100, h: 30, type: 'lava_rock' },
            { x: 700, y: 380, w: 100, h: 30, type: 'lava_rock' },
            { x: 850, y: 280, w: 120, h: 30, type: 'lava_rock' },
            { x: 600, y: 520, w: 100, h: 30, type: 'lava_rock' },
            { x: 800, y: 600, w: 100, h: 30, type: 'lava_rock' },
            { x: 1000, y: 500, w: 150, h: 30, type: 'lava_rock' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'lava_rock' }
        ],
        gems: [
            { x: 280, y: 560 }, { x: 440, y: 480 }, { x: 330, y: 340 },
            { x: 530, y: 260 }, { x: 730, y: 340 }, { x: 880, y: 240 },
            { x: 630, y: 480 }, { x: 830, y: 560 }, { x: 1050, y: 460 }
        ],
        enemies: [
            { x: 420, y: 470, type: 'fireball', patrol: 80 },
            { x: 520, y: 250, type: 'fireball', patrol: 60 },
            { x: 850, y: 550, type: 'lava_slime', patrol: 60 }
        ],
        powerUps: [
            { x: 880, y: 230, type: 'shield' }
        ],
        portal: { x: 1080, y: 400 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 150
    },
    // Level 5 - Ice World
    {
        name: "Frozen Peaks",
        background: { top: '#a8d8ea', bottom: '#ffffff' },
        platforms: [
            { x: 0, y: 650, w: 200, h: 50, type: 'ice' },
            { x: 280, y: 550, w: 150, h: 30, type: 'ice' },
            { x: 150, y: 420, w: 100, h: 30, type: 'ice' },
            { x: 350, y: 350, w: 120, h: 30, type: 'ice' },
            { x: 550, y: 450, w: 100, h: 30, type: 'ice' },
            { x: 700, y: 350, w: 100, h: 30, type: 'ice' },
            { x: 500, y: 250, w: 100, h: 30, type: 'ice' },
            { x: 850, y: 250, w: 120, h: 30, type: 'ice' },
            { x: 1000, y: 400, w: 100, h: 30, type: 'ice' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'ice' }
        ],
        gems: [
            { x: 330, y: 510 }, { x: 180, y: 380 }, { x: 390, y: 310 },
            { x: 580, y: 410 }, { x: 730, y: 310 }, { x: 530, y: 210 },
            { x: 890, y: 210 }, { x: 1030, y: 360 }
        ],
        enemies: [
            { x: 300, y: 500, type: 'penguin', patrol: 100 },
            { x: 560, y: 400, type: 'snowman', patrol: 60 },
            { x: 860, y: 200, type: 'ice_bat', patrol: 100 }
        ],
        powerUps: [
            { x: 530, y: 200, type: 'fire' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 120
    },
    // Level 6 - Sky Castle
    {
        name: "Skyward Castle",
        background: { top: '#1a1a3e', bottom: '#4a4a8a' },
        platforms: [
            { x: 0, y: 650, w: 150, h: 50, type: 'castle' },
            { x: 200, y: 580, w: 100, h: 30, type: 'castle' },
            { x: 350, y: 500, w: 120, h: 30, type: 'castle' },
            { x: 200, y: 380, w: 100, h: 30, type: 'castle' },
            { x: 400, y: 300, w: 150, h: 30, type: 'castle' },
            { x: 600, y: 400, w: 100, h: 30, type: 'castle' },
            { x: 750, y: 300, w: 100, h: 30, type: 'castle' },
            { x: 600, y: 180, w: 120, h: 30, type: 'castle' },
            { x: 900, y: 250, w: 100, h: 30, type: 'castle' },
            { x: 1000, y: 400, w: 100, h: 30, type: 'castle' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'castle' }
        ],
        gems: [
            { x: 230, y: 540 }, { x: 390, y: 460 }, { x: 230, y: 340 },
            { x: 450, y: 260 }, { x: 630, y: 360 }, { x: 780, y: 260 },
            { x: 650, y: 140 }, { x: 930, y: 210 }, { x: 1030, y: 360 }
        ],
        enemies: [
            { x: 370, y: 450, type: 'knight', patrol: 80 },
            { x: 620, y: 350, type: 'ghost', patrol: 120 },
            { x: 770, y: 250, type: 'knight', patrol: 60 }
        ],
        powerUps: [
            { x: 650, y: 130, type: 'double_jump' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 150
    },
    // Level 7 - Jungle
    {
        name: "Jungle Temple",
        background: { top: '#1a3a1a', bottom: '#2d5a2d' },
        platforms: [
            { x: 0, y: 650, w: 200, h: 50, type: 'jungle' },
            { x: 150, y: 520, w: 80, h: 30, type: 'vine' },
            { x: 300, y: 600, w: 100, h: 30, type: 'jungle' },
            { x: 450, y: 500, w: 100, h: 30, type: 'jungle' },
            { x: 350, y: 350, w: 80, h: 30, type: 'vine' },
            { x: 550, y: 280, w: 100, h: 30, type: 'jungle' },
            { x: 700, y: 400, w: 80, h: 30, type: 'vine' },
            { x: 850, y: 300, w: 100, h: 30, type: 'jungle' },
            { x: 750, y: 180, w: 100, h: 30, type: 'jungle' },
            { x: 950, y: 500, w: 100, h: 30, type: 'jungle' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'jungle' }
        ],
        gems: [
            { x: 180, y: 480 }, { x: 330, y: 560 }, { x: 480, y: 460 },
            { x: 380, y: 310 }, { x: 580, y: 240 }, { x: 730, y: 360 },
            { x: 880, y: 260 }, { x: 780, y: 140 }, { x: 980, y: 460 }
        ],
        enemies: [
            { x: 320, y: 550, type: 'snake', patrol: 80 },
            { x: 470, y: 450, type: 'monkey', patrol: 100 },
            { x: 870, y: 250, type: 'spider', patrol: 80 }
        ],
        powerUps: [
            { x: 780, y: 130, type: 'speed' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 140
    },
    // Level 8 - Desert
    {
        name: "Ancient Sands",
        background: { top: '#ffeaa7', bottom: '#dfe6e9' },
        platforms: [
            { x: 0, y: 650, w: 180, h: 50, type: 'sand' },
            { x: 250, y: 580, w: 120, h: 30, type: 'pyramid' },
            { x: 180, y: 450, w: 80, h: 30, type: 'pyramid' },
            { x: 350, y: 380, w: 100, h: 30, type: 'pyramid' },
            { x: 500, y: 500, w: 100, h: 30, type: 'sand' },
            { x: 650, y: 400, w: 80, h: 30, type: 'pyramid' },
            { x: 550, y: 280, w: 100, h: 30, type: 'pyramid' },
            { x: 750, y: 200, w: 100, h: 30, type: 'pyramid' },
            { x: 900, y: 350, w: 100, h: 30, type: 'pyramid' },
            { x: 1000, y: 500, w: 100, h: 30, type: 'sand' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'sand' }
        ],
        gems: [
            { x: 290, y: 540 }, { x: 210, y: 410 }, { x: 380, y: 340 },
            { x: 530, y: 460 }, { x: 680, y: 360 }, { x: 580, y: 240 },
            { x: 780, y: 160 }, { x: 930, y: 310 }, { x: 1030, y: 460 }
        ],
        enemies: [
            { x: 270, y: 530, type: 'mummy', patrol: 100 },
            { x: 520, y: 450, type: 'scorpion', patrol: 80 },
            { x: 910, y: 300, type: 'mummy', patrol: 80 }
        ],
        powerUps: [
            { x: 780, y: 150, type: 'magnet' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 130
    },
    // Level 9 - Ocean
    {
        name: "Deep Blue",
        background: { top: '#0077be', bottom: '#001f3f' },
        platforms: [
            { x: 0, y: 650, w: 150, h: 50, type: 'coral' },
            { x: 200, y: 550, w: 100, h: 30, type: 'bubble' },
            { x: 350, y: 450, w: 80, h: 30, type: 'coral' },
            { x: 250, y: 320, w: 100, h: 30, type: 'bubble' },
            { x: 450, y: 250, w: 100, h: 30, type: 'coral' },
            { x: 600, y: 380, w: 80, h: 30, type: 'bubble' },
            { x: 700, y: 280, w: 100, h: 30, type: 'coral' },
            { x: 850, y: 180, w: 100, h: 30, type: 'bubble' },
            { x: 950, y: 350, w: 100, h: 30, type: 'coral' },
            { x: 1050, y: 500, w: 100, h: 30, type: 'coral' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'coral' }
        ],
        gems: [
            { x: 230, y: 510 }, { x: 380, y: 410 }, { x: 280, y: 280 },
            { x: 480, y: 210 }, { x: 630, y: 340 }, { x: 730, y: 240 },
            { x: 880, y: 140 }, { x: 980, y: 310 }, { x: 1080, y: 460 }
        ],
        enemies: [
            { x: 220, y: 500, type: 'fish', patrol: 100 },
            { x: 470, y: 200, type: 'jellyfish', patrol: 80 },
            { x: 720, y: 230, type: 'shark', patrol: 120 }
        ],
        powerUps: [
            { x: 880, y: 130, type: 'shield' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 150
    },
    // Level 10 - Space
    {
        name: "Cosmic Void",
        background: { top: '#0a0a1a', bottom: '#1a1a3a' },
        platforms: [
            { x: 0, y: 650, w: 150, h: 50, type: 'asteroid' },
            { x: 200, y: 550, w: 80, h: 30, type: 'asteroid' },
            { x: 350, y: 450, w: 100, h: 30, type: 'asteroid' },
            { x: 200, y: 320, w: 80, h: 30, type: 'asteroid' },
            { x: 400, y: 220, w: 100, h: 30, type: 'asteroid' },
            { x: 550, y: 350, w: 80, h: 30, type: 'asteroid' },
            { x: 700, y: 250, w: 100, h: 30, type: 'asteroid' },
            { x: 600, y: 120, w: 80, h: 30, type: 'asteroid' },
            { x: 850, y: 200, w: 100, h: 30, type: 'asteroid' },
            { x: 950, y: 400, w: 100, h: 30, type: 'asteroid' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'asteroid' }
        ],
        gems: [
            { x: 230, y: 510 }, { x: 380, y: 410 }, { x: 230, y: 280 },
            { x: 430, y: 180 }, { x: 580, y: 310 }, { x: 730, y: 210 },
            { x: 630, y: 80 }, { x: 880, y: 160 }, { x: 980, y: 360 }
        ],
        enemies: [
            { x: 370, y: 400, type: 'alien', patrol: 80 },
            { x: 570, y: 300, type: 'ufo', patrol: 120 },
            { x: 870, y: 150, type: 'alien', patrol: 80 }
        ],
        powerUps: [
            { x: 630, y: 70, type: 'double_jump' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 160
    },
    // Level 11 - Dark Forest
    {
        name: "Haunted Woods",
        background: { top: '#1a0a1a', bottom: '#2a1a2a' },
        platforms: [
            { x: 0, y: 650, w: 180, h: 50, type: 'dark_wood' },
            { x: 220, y: 550, w: 100, h: 30, type: 'dark_wood' },
            { x: 150, y: 400, w: 80, h: 30, type: 'dark_wood' },
            { x: 350, y: 480, w: 100, h: 30, type: 'dark_wood' },
            { x: 300, y: 300, w: 80, h: 30, type: 'dark_wood' },
            { x: 500, y: 380, w: 100, h: 30, type: 'dark_wood' },
            { x: 450, y: 200, w: 100, h: 30, type: 'dark_wood' },
            { x: 650, y: 280, w: 80, h: 30, type: 'dark_wood' },
            { x: 800, y: 180, w: 100, h: 30, type: 'dark_wood' },
            { x: 900, y: 350, w: 100, h: 30, type: 'dark_wood' },
            { x: 1000, y: 500, w: 100, h: 30, type: 'dark_wood' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'dark_wood' }
        ],
        gems: [
            { x: 250, y: 510 }, { x: 180, y: 360 }, { x: 380, y: 440 },
            { x: 330, y: 260 }, { x: 530, y: 340 }, { x: 480, y: 160 },
            { x: 680, y: 240 }, { x: 830, y: 140 }, { x: 930, y: 310 },
            { x: 1030, y: 460 }
        ],
        enemies: [
            { x: 240, y: 500, type: 'ghost', patrol: 80 },
            { x: 370, y: 430, type: 'witch', patrol: 100 },
            { x: 520, y: 330, type: 'ghost', patrol: 80 },
            { x: 820, y: 130, type: 'pumpkin', patrol: 80 }
        ],
        powerUps: [
            { x: 480, y: 150, type: 'fire' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 180
    },
    // Level 12 - Final Boss Level
    {
        name: "The Final Challenge",
        background: { top: '#0a0a2a', bottom: '#2a1a4a' },
        platforms: [
            { x: 0, y: 650, w: 200, h: 50, type: 'crystal' },
            { x: 250, y: 580, w: 80, h: 30, type: 'crystal' },
            { x: 400, y: 500, w: 100, h: 30, type: 'crystal' },
            { x: 200, y: 380, w: 80, h: 30, type: 'crystal' },
            { x: 350, y: 280, w: 100, h: 30, type: 'crystal' },
            { x: 550, y: 380, w: 80, h: 30, type: 'crystal' },
            { x: 500, y: 180, w: 100, h: 30, type: 'crystal' },
            { x: 700, y: 280, w: 100, h: 30, type: 'crystal' },
            { x: 850, y: 180, w: 80, h: 30, type: 'crystal' },
            { x: 950, y: 350, w: 100, h: 30, type: 'crystal' },
            { x: 800, y: 500, w: 100, h: 30, type: 'crystal' },
            { x: 1050, y: 650, w: 150, h: 50, type: 'crystal' }
        ],
        gems: [
            { x: 280, y: 540 }, { x: 430, y: 460 }, { x: 230, y: 340 },
            { x: 380, y: 240 }, { x: 580, y: 340 }, { x: 530, y: 140 },
            { x: 730, y: 240 }, { x: 880, y: 140 }, { x: 980, y: 310 },
            { x: 830, y: 460 }
        ],
        enemies: [
            { x: 280, y: 530, type: 'demon', patrol: 60 },
            { x: 420, y: 450, type: 'dragon', patrol: 80 },
            { x: 570, y: 330, type: 'demon', patrol: 60 },
            { x: 720, y: 230, type: 'dragon', patrol: 80 },
            { x: 820, y: 450, type: 'demon', patrol: 60 }
        ],
        powerUps: [
            { x: 530, y: 130, type: 'shield' },
            { x: 880, y: 130, type: 'fire' }
        ],
        portal: { x: 1080, y: 550 },
        playerStart: { x: 50, y: 550 },
        timeGoal: 200
    }
];

// ===== COLORS FOR DIFFERENT OBJECT TYPES =====
const PLATFORM_COLORS = {
    ground: { fill: '#4CAF50', stroke: '#388E3C' },
    grass: { fill: '#66BB6A', stroke: '#43A047' },
    cloud: { fill: '#ecf0f1', stroke: '#bdc3c7' },
    stone: { fill: '#7f8c8d', stroke: '#636e72' },
    lava_rock: { fill: '#6d4c41', stroke: '#4e342e' },
    ice: { fill: '#a8d8ea', stroke: '#74b9ff' },
    castle: { fill: '#636e72', stroke: '#2d3436' },
    jungle: { fill: '#27ae60', stroke: '#1e8449' },
    vine: { fill: '#2ecc71', stroke: '#27ae60' },
    sand: { fill: '#f39c12', stroke: '#d68910' },
    pyramid: { fill: '#d4ac0d', stroke: '#b7950b' },
    coral: { fill: '#e74c3c', stroke: '#c0392b' },
    bubble: { fill: '#3498db', stroke: '#2980b9', opacity: 0.6 },
    asteroid: { fill: '#5d6d7e', stroke: '#4a5568' },
    dark_wood: { fill: '#4a3728', stroke: '#2c1810' },
    crystal: { fill: '#9b59b6', stroke: '#8e44ad' }
};

const ENEMY_COLORS = {
    slime: '#2ecc71',
    bird: '#3498db',
    bat: '#6c5ce7',
    fireball: '#e74c3c',
    lava_slime: '#e67e22',
    penguin: '#2c3e50',
    snowman: '#ecf0f1',
    ice_bat: '#74b9ff',
    knight: '#636e72',
    ghost: '#dfe6e9',
    snake: '#27ae60',
    monkey: '#d35400',
    spider: '#2c3e50',
    mummy: '#f1c40f',
    scorpion: '#e74c3c',
    fish: '#3498db',
    jellyfish: '#e91e63',
    shark: '#546e7a',
    alien: '#00e676',
    ufo: '#b2ff59',
    witch: '#8e44ad',
    pumpkin: '#e67e22',
    demon: '#c0392b',
    dragon: '#9b59b6'
};

const POWER_COLORS = {
    shield: '#3498db',
    speed: '#f1c40f',
    magnet: '#e74c3c',
    fire: '#e67e22',
    double_jump: '#2ecc71'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadSaveData();
    setupEventListeners();
    initializeCanvas();
    showScreen('main-menu');
});

function initializeCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function hideOverlay(screenId) {
    document.getElementById(screenId).classList.remove('active');
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
    document.getElementById('settings-btn').addEventListener('click', () => {
        loadSettingsUI();
        showScreen('settings');
    });

    // Back buttons
    document.getElementById('back-from-help').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-scores').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-from-settings').addEventListener('click', () => {
        saveSettings();
        showScreen('main-menu');
    });
    document.getElementById('back-from-levels').addEventListener('click', () => showScreen('main-menu'));

    // Game control buttons
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
    document.getElementById('clear-data-btn').addEventListener('click', clearSaveData);

    // Keyboard input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Mobile controls
    setupMobileControls();
}

function handleKeyDown(e) {
    if (gameState !== GameState.PLAYING) {
        if (e.key === 'Escape' && gameState === GameState.PAUSED) {
            resumeGame();
        }
        return;
    }

    switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
            keys.left = true;
            break;
        case 'arrowright':
        case 'd':
            keys.right = true;
            break;
        case 'arrowup':
        case 'w':
            keys.up = true;
            break;
        case 'arrowdown':
        case 's':
            keys.down = true;
            break;
        case ' ':
            if (!keys.jump) {
                keys.jump = true;
                jump();
            }
            break;
        case 'e':
            keys.action = true;
            break;
        case 'q':
            keys.power = true;
            usePower();
            break;
        case 'p':
        case 'escape':
            pauseGame();
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
            keys.left = false;
            break;
        case 'arrowright':
        case 'd':
            keys.right = false;
            break;
        case 'arrowup':
        case 'w':
            keys.up = false;
            break;
        case 'arrowdown':
        case 's':
            keys.down = false;
            break;
        case ' ':
            keys.jump = false;
            break;
        case 'e':
            keys.action = false;
            break;
        case 'q':
            keys.power = false;
            break;
    }
}

function setupMobileControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnAction = document.getElementById('btn-action');

    // Touch start
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); keys.up = true; });
    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); keys.down = true; });
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.jump = true; jump(); });
    btnAction.addEventListener('touchstart', (e) => { e.preventDefault(); usePower(); });

    // Touch end
    btnUp.addEventListener('touchend', () => keys.up = false);
    btnDown.addEventListener('touchend', () => keys.down = false);
    btnLeft.addEventListener('touchend', () => keys.left = false);
    btnRight.addEventListener('touchend', () => keys.right = false);
    btnJump.addEventListener('touchend', () => keys.jump = false);
}

// ===== LEVEL SELECT =====
function populateLevelSelect() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= CONFIG.TOTAL_LEVELS; i++) {
        const levelBtn = document.createElement('button');
        levelBtn.className = 'level-btn';

        const isUnlocked = i === 1 || levelProgress[i - 1];
        const levelData = levelProgress[i] || { completed: false, stars: 0 };

        if (!isUnlocked) {
            levelBtn.classList.add('locked');
        } else {
            if (levelData.completed) {
                levelBtn.classList.add('completed');
            }
            levelBtn.innerHTML = `
                <span>${i}</span>
                <div class="level-stars">
                    ${[1, 2, 3].map(s => `<span class="star ${s <= levelData.stars ? 'earned' : ''}">★</span>`).join('')}
                </div>
            `;
            levelBtn.addEventListener('click', () => startLevel(i));
        }

        grid.appendChild(levelBtn);
    }
}

// ===== GAME CONTROL =====
function startLevel(levelNum) {
    currentLevel = levelNum;
    loadLevel(currentLevel);
    gameState = GameState.PLAYING;
    showScreen('game-screen');
    levelStartTime = Date.now();
    gameLoop();
}

function loadLevel(levelNum) {
    const level = LEVELS[levelNum - 1];

    // Reset player
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.velX = 0;
    player.velY = 0;
    player.health = CONFIG.MAX_HEALTH;
    player.isJumping = false;
    player.canDoubleJump = true;
    player.isOnGround = false;
    player.isInvincible = false;
    player.power = null;

    // Load platforms
    platforms = level.platforms.map(p => ({
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        type: p.type
    }));

    // Load gems
    gems = level.gems.map(g => ({
        x: g.x,
        y: g.y,
        width: 25,
        height: 25,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
    }));

    // Load enemies
    enemies = level.enemies.map(e => ({
        x: e.x,
        y: e.y,
        startX: e.x,
        width: 40,
        height: 40,
        type: e.type,
        patrol: e.patrol,
        direction: 1,
        alive: true,
        animFrame: 0
    }));

    // Load power-ups
    powerUps = level.powerUps.map(p => ({
        x: p.x,
        y: p.y,
        width: 30,
        height: 30,
        type: p.type,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
    }));

    // Load portal
    portal = {
        x: level.portal.x,
        y: level.portal.y,
        width: 60,
        height: 80,
        active: false,
        rotation: 0
    };

    // Clear particles and projectiles
    particles = [];
    projectiles = [];

    // Update HUD
    updateHUD();
}

function pauseGame() {
    if (gameState === GameState.PLAYING) {
        gameState = GameState.PAUSED;
        cancelAnimationFrame(animationFrameId);
        document.getElementById('pause-screen').classList.add('active');
    }
}

function resumeGame() {
    if (gameState === GameState.PAUSED) {
        gameState = GameState.PLAYING;
        hideOverlay('pause-screen');
        gameLoop();
    }
}

function restartLevel() {
    hideOverlay('pause-screen');
    hideOverlay('level-complete');
    hideOverlay('game-over');
    loadLevel(currentLevel);
    gameState = GameState.PLAYING;
    levelStartTime = Date.now();
    gameLoop();
}

function restartGame() {
    lives = CONFIG.MAX_LIVES;
    score = 0;
    totalGems = 0;
    totalPlayTime = 0;
    currentLevel = 1;
    hideOverlay('game-over');
    hideOverlay('victory-screen');
    loadLevel(currentLevel);
    gameState = GameState.PLAYING;
    levelStartTime = Date.now();
    gameLoop();
}

function nextLevel() {
    hideOverlay('level-complete');
    currentLevel++;
    if (currentLevel > CONFIG.TOTAL_LEVELS) {
        showVictory();
    } else {
        loadLevel(currentLevel);
        gameState = GameState.PLAYING;
        levelStartTime = Date.now();
        gameLoop();
    }
}

function quitToMenu() {
    gameState = GameState.MENU;
    cancelAnimationFrame(animationFrameId);
    hideOverlay('pause-screen');
    hideOverlay('level-complete');
    hideOverlay('game-over');
    hideOverlay('victory-screen');
    showScreen('main-menu');
}

// ===== GAME LOOP =====
function gameLoop() {
    if (gameState !== GameState.PLAYING) return;

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
    // Horizontal movement
    if (keys.left) {
        player.velX = -CONFIG.PLAYER_SPEED * (player.power === 'speed' ? 1.5 : 1);
        player.direction = -1;
    } else if (keys.right) {
        player.velX = CONFIG.PLAYER_SPEED * (player.power === 'speed' ? 1.5 : 1);
        player.direction = 1;
    } else {
        player.velX *= CONFIG.FRICTION;
    }

    // Apply gravity
    player.velY += CONFIG.GRAVITY;

    // Update position
    player.x += player.velX;
    player.y += player.velY;

    // Platform collision
    player.isOnGround = false;
    platforms.forEach(platform => {
        if (checkPlatformCollision(player, platform)) {
            // Collision from top
            if (player.velY > 0 && player.y + player.height - player.velY <= platform.y) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.isOnGround = true;
                player.canDoubleJump = true;
                player.isJumping = false;
            }
            // Collision from bottom
            else if (player.velY < 0 && player.y - player.velY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velY = 0;
            }
            // Collision from left
            else if (player.velX > 0 && player.x + player.width - player.velX <= platform.x) {
                player.x = platform.x - player.width;
                player.velX = 0;
            }
            // Collision from right
            else if (player.velX < 0 && player.x - player.velX >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
                player.velX = 0;
            }
        }
    });

    // World boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Fall death
    if (player.y > canvas.height + 100) {
        playerDeath();
    }

    // Update invincibility
    if (player.isInvincible) {
        player.invincibleTimer -= 16;
        if (player.invincibleTimer <= 0) {
            player.isInvincible = false;
        }
    }

    // Update power timer
    if (player.power && player.power !== 'double_jump') {
        player.powerTimer -= 16;
        if (player.powerTimer <= 0) {
            player.power = null;
        }
    }

    // Animation
    player.animTimer += 16;
    if (player.animTimer > 100) {
        player.animFrame = (player.animFrame + 1) % 4;
        player.animTimer = 0;
    }
}

function jump() {
    if (player.isOnGround) {
        player.velY = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        player.isOnGround = false;
        createJumpParticles();
    } else if (player.canDoubleJump || player.power === 'double_jump') {
        player.velY = CONFIG.DOUBLE_JUMP_FORCE;
        player.canDoubleJump = false;
        createJumpParticles();
    }
}

function usePower() {
    if (player.power === 'fire') {
        // Shoot fireball
        projectiles.push({
            x: player.x + (player.direction === 1 ? player.width : 0),
            y: player.y + player.height / 2,
            velX: player.direction * 10,
            velY: 0,
            width: 20,
            height: 20,
            type: 'fireball',
            fromPlayer: true
        });
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        // Patrol movement
        enemy.x += enemy.direction * 2;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrol) {
            enemy.direction *= -1;
        }

        // Animation
        enemy.animFrame = (enemy.animFrame + 0.1) % 4;

        // Flying enemies
        if (['bird', 'bat', 'ice_bat', 'ghost', 'ufo', 'jellyfish'].includes(enemy.type)) {
            enemy.y = enemy.y + Math.sin(Date.now() / 500) * 0.5;
        }

        // Shooting enemies
        if (['dragon', 'witch'].includes(enemy.type) && Math.random() < 0.005) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400) {
                projectiles.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    velX: (dx / dist) * 5,
                    velY: (dy / dist) * 5,
                    width: 15,
                    height: 15,
                    type: 'enemy_fire',
                    fromPlayer: false
                });
            }
        }
    });
}

function updateProjectiles() {
    projectiles = projectiles.filter(proj => {
        proj.x += proj.velX;
        proj.y += proj.velY;

        // Remove if out of bounds
        if (proj.x < -50 || proj.x > canvas.width + 50 || proj.y < -50 || proj.y > canvas.height + 50) {
            return false;
        }

        // Check enemy collision for player projectiles
        if (proj.fromPlayer) {
            for (let enemy of enemies) {
                if (enemy.alive && checkCollision(proj, enemy)) {
                    enemy.alive = false;
                    score += CONFIG.ENEMY_KILL_SCORE;
                    createDeathParticles(enemy.x, enemy.y, ENEMY_COLORS[enemy.type]);
                    return false;
                }
            }
        } else {
            // Check player collision for enemy projectiles
            if (checkCollision(proj, player) && !player.isInvincible) {
                takeDamage(20);
                return false;
            }
        }

        return true;
    });
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.2; // Gravity
        p.life -= 16;
        p.alpha = p.life / p.maxLife;
        return p.life > 0;
    });
}

function updatePortal() {
    // Check if all gems collected
    const collectedGems = gems.filter(g => g.collected).length;
    portal.active = collectedGems >= Math.floor(gems.length * 0.5); // Need 50% of gems
    portal.rotation += 0.05;
}

// ===== COLLISION DETECTION =====
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function checkPlatformCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y < platform.y + platform.height &&
           player.y + player.height > platform.y;
}

function checkCollisions() {
    // Gem collection
    gems.forEach(gem => {
        if (!gem.collected && checkCollision(player, gem)) {
            gem.collected = true;
            score += CONFIG.GEM_SCORE;
            totalGems++;
            createCollectParticles(gem.x, gem.y, '#a29bfe');
        }
    });

    // Power-up collection
    powerUps.forEach(powerUp => {
        if (!powerUp.collected && checkCollision(player, powerUp)) {
            powerUp.collected = true;
            player.power = powerUp.type;
            player.powerTimer = 15000; // 15 seconds
            if (powerUp.type === 'shield') {
                player.isInvincible = true;
                player.invincibleTimer = 10000;
            }
            createCollectParticles(powerUp.x, powerUp.y, POWER_COLORS[powerUp.type]);
        }
    });

    // Enemy collision
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (checkCollision(player, enemy)) {
            // Check if player is stomping enemy
            if (player.velY > 0 && player.y + player.height - player.velY <= enemy.y + 10) {
                enemy.alive = false;
                player.velY = -10; // Bounce
                score += CONFIG.ENEMY_KILL_SCORE;
                createDeathParticles(enemy.x, enemy.y, ENEMY_COLORS[enemy.type]);
            } else if (!player.isInvincible && player.power !== 'shield') {
                takeDamage(25);
            }
        }
    });

    // Portal collision
    if (portal.active && checkCollision(player, portal)) {
        levelComplete();
    }
}

function takeDamage(amount) {
    if (player.isInvincible) return;

    // Adjust damage based on difficulty
    const difficultyMultiplier = {
        easy: 0.5,
        normal: 1,
        hard: 1.5
    };
    amount *= difficultyMultiplier[settings.difficulty];

    player.health -= amount;
    player.isInvincible = true;
    player.invincibleTimer = CONFIG.INVINCIBILITY_TIME;

    createDamageParticles();

    if (player.health <= 0) {
        playerDeath();
    }
}

function playerDeath() {
    lives--;
    createDeathParticles(player.x, player.y, '#fd79a8');

    if (lives <= 0) {
        gameOver();
    } else {
        // Respawn
        const level = LEVELS[currentLevel - 1];
        player.x = level.playerStart.x;
        player.y = level.playerStart.y;
        player.velX = 0;
        player.velY = 0;
        player.health = CONFIG.MAX_HEALTH;
        player.isInvincible = true;
        player.invincibleTimer = CONFIG.INVINCIBILITY_TIME;
    }
}

// ===== PARTICLE EFFECTS =====
function createJumpParticles() {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            velX: (Math.random() - 0.5) * 4,
            velY: Math.random() * 2,
            size: Math.random() * 5 + 3,
            color: '#dfe6e9',
            life: 500,
            maxLife: 500,
            alpha: 1
        });
    }
}

function createCollectParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            velX: (Math.random() - 0.5) * 8,
            velY: (Math.random() - 0.5) * 8,
            size: Math.random() * 6 + 2,
            color: color,
            life: 600,
            maxLife: 600,
            alpha: 1
        });
    }
}

function createDeathParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x + 20,
            y: y + 20,
            velX: (Math.random() - 0.5) * 10,
            velY: (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4,
            color: color,
            life: 800,
            maxLife: 800,
            alpha: 1
        });
    }
}

function createDamageParticles() {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            velX: (Math.random() - 0.5) * 6,
            velY: (Math.random() - 0.5) * 6,
            size: Math.random() * 5 + 3,
            color: '#e74c3c',
            life: 400,
            maxLife: 400,
            alpha: 1
        });
    }
}

// ===== RENDER =====
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Draw platforms
    drawPlatforms();

    // Draw gems
    drawGems();

    // Draw power-ups
    drawPowerUps();

    // Draw portal
    drawPortal();

    // Draw enemies
    drawEnemies();

    // Draw projectiles
    drawProjectiles();

    // Draw particles
    drawParticles();

    // Draw player
    drawPlayer();
}

function drawBackground() {
    const level = LEVELS[currentLevel - 1];
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, level.background.top);
    gradient.addColorStop(1, level.background.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars for space/night levels
    if (['Cosmic Void', 'Haunted Woods', 'The Final Challenge', 'Crystal Caves'].includes(level.name)) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37 + Date.now() / 100) % canvas.width;
            const y = (i * 23) % canvas.height;
            const size = (i % 3) + 1;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500 + i) * 0.3;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }
}

function drawPlatforms() {
    platforms.forEach(platform => {
        const colors = PLATFORM_COLORS[platform.type] || PLATFORM_COLORS.ground;

        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;

        if (colors.opacity) {
            ctx.globalAlpha = colors.opacity;
        }

        // Draw platform with rounded corners
        const radius = 5;
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, radius);
        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = 1;

        // Add texture lines
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1;
        for (let i = 10; i < platform.width - 10; i += 20) {
            ctx.beginPath();
            ctx.moveTo(platform.x + i, platform.y + 5);
            ctx.lineTo(platform.x + i + 10, platform.y + 5);
            ctx.stroke();
        }
    });
}

function drawGems() {
    gems.forEach(gem => {
        if (gem.collected) return;

        const bob = Math.sin(Date.now() / 300 + gem.bobOffset) * 5;

        ctx.save();
        ctx.translate(gem.x + gem.width / 2, gem.y + gem.height / 2 + bob);

        // Gem glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a29bfe';

        // Draw diamond shape
        ctx.fillStyle = '#a29bfe';
        ctx.beginPath();
        ctx.moveTo(0, -gem.height / 2);
        ctx.lineTo(gem.width / 2, 0);
        ctx.lineTo(0, gem.height / 2);
        ctx.lineTo(-gem.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Inner shine
        ctx.fillStyle = '#dfe6e9';
        ctx.beginPath();
        ctx.moveTo(0, -gem.height / 4);
        ctx.lineTo(gem.width / 4, 0);
        ctx.lineTo(0, gem.height / 4);
        ctx.lineTo(-gem.width / 4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.collected) return;

        const bob = Math.sin(Date.now() / 400 + powerUp.bobOffset) * 5;
        const color = POWER_COLORS[powerUp.type];

        ctx.save();
        ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2 + bob);

        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        // Draw circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, powerUp.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Icon based on type
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = {
            shield: 'S',
            speed: '>',
            magnet: 'M',
            fire: 'F',
            double_jump: 'J'
        };
        ctx.fillText(icons[powerUp.type], 0, 0);

        ctx.restore();
    });
}

function drawPortal() {
    ctx.save();
    ctx.translate(portal.x + portal.width / 2, portal.y + portal.height / 2);
    ctx.rotate(portal.rotation);

    // Portal glow
    ctx.shadowBlur = portal.active ? 30 : 10;
    ctx.shadowColor = portal.active ? '#00b894' : '#636e72';

    // Outer ring
    ctx.strokeStyle = portal.active ? '#00b894' : '#636e72';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, portal.width / 2, portal.height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner swirl
    if (portal.active) {
        ctx.fillStyle = 'rgba(0, 184, 148, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, portal.width / 2 - 10, portal.height / 2 - 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swirl lines
        ctx.strokeStyle = '#55efc4';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, portal.width / 3, (portal.rotation * 2 + i * Math.PI / 2), (portal.rotation * 2 + i * Math.PI / 2 + Math.PI / 4));
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        const color = ENEMY_COLORS[enemy.type];

        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        // Enemy body
        ctx.fillStyle = color;
        ctx.beginPath();

        // Different shapes for different enemies
        if (['slime', 'lava_slime'].includes(enemy.type)) {
            // Blob shape
            ctx.ellipse(0, 5, enemy.width / 2, enemy.height / 3, 0, 0, Math.PI * 2);
        } else if (['bird', 'bat', 'ice_bat'].includes(enemy.type)) {
            // Wing shape
            ctx.moveTo(-enemy.width / 2, 0);
            ctx.quadraticCurveTo(0, -enemy.height / 2, enemy.width / 2, 0);
            ctx.quadraticCurveTo(0, enemy.height / 3, -enemy.width / 2, 0);
        } else if (['ghost'].includes(enemy.type)) {
            // Ghost shape
            ctx.moveTo(-enemy.width / 2, enemy.height / 3);
            ctx.quadraticCurveTo(-enemy.width / 2, -enemy.height / 2, 0, -enemy.height / 2);
            ctx.quadraticCurveTo(enemy.width / 2, -enemy.height / 2, enemy.width / 2, enemy.height / 3);
            ctx.lineTo(enemy.width / 4, enemy.height / 2);
            ctx.lineTo(0, enemy.height / 3);
            ctx.lineTo(-enemy.width / 4, enemy.height / 2);
            ctx.closePath();
        } else {
            // Default circle
            ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8, -5, 5, 0, Math.PI * 2);
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(-8 + enemy.direction * 2, -5, 2, 0, Math.PI * 2);
        ctx.arc(8 + enemy.direction * 2, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);

        if (proj.type === 'fireball' || proj.type === 'enemy_fire') {
            // Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = proj.fromPlayer ? '#e67e22' : '#e74c3c';

            // Fireball
            ctx.fillStyle = proj.fromPlayer ? '#f39c12' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, 0, proj.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner
            ctx.fillStyle = '#fdcb6e';
            ctx.beginPath();
            ctx.arc(0, 0, proj.width / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Invincibility flash
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Flip based on direction
    ctx.scale(player.direction, 1);

    // Player glow when powered up
    if (player.power) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = POWER_COLORS[player.power];
    }

    // Body - skin color based on setting
    const skinColors = {
        default: '#fd79a8',
        ninja: '#2d3436',
        wizard: '#6c5ce7',
        robot: '#636e72'
    };
    ctx.fillStyle = skinColors[settings.skin];
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Face
    ctx.fillStyle = '#ffffff';
    // Eyes
    ctx.beginPath();
    ctx.arc(-8, -5, 6, 0, Math.PI * 2);
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(-6, -5, 3, 0, Math.PI * 2);
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (smile)
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Cheeks
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-15, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(15, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat/accessory based on skin
    if (settings.skin === 'ninja') {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-player.width / 2, -player.height / 2 - 5, player.width, 10);
    } else if (settings.skin === 'wizard') {
        ctx.fillStyle = '#6c5ce7';
        ctx.beginPath();
        ctx.moveTo(0, -player.height / 2 - 20);
        ctx.lineTo(-15, -player.height / 2);
        ctx.lineTo(15, -player.height / 2);
        ctx.closePath();
        ctx.fill();
    } else if (settings.skin === 'robot') {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-5, -player.height / 2 - 10, 10, 10);
    }

    ctx.restore();
}

// ===== HUD UPDATE =====
function updateHUD() {
    document.getElementById('health-fill').style.width = `${player.health}%`;
    document.getElementById('lives-count').textContent = lives;
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('score').textContent = score;
    document.getElementById('gems-count').textContent = gems.filter(g => g.collected).length + '/' + gems.length;
    document.getElementById('power-name').textContent = player.power ? player.power.replace('_', ' ').toUpperCase() : 'None';
}

// ===== LEVEL COMPLETION =====
function levelComplete() {
    gameState = GameState.LEVEL_COMPLETE;
    cancelAnimationFrame(animationFrameId);

    const levelTime = Math.floor((Date.now() - levelStartTime) / 1000);
    totalPlayTime += levelTime;
    const gemsCollected = gems.filter(g => g.collected).length;
    const level = LEVELS[currentLevel - 1];

    // Calculate stars
    let stars = 1;
    if (gemsCollected === gems.length) stars++;
    if (levelTime <= level.timeGoal) stars++;

    // Calculate bonus
    const timeBonus = Math.max(0, (level.timeGoal - levelTime) * CONFIG.TIME_BONUS_MULTIPLIER);
    score += CONFIG.LEVEL_COMPLETE_BONUS + timeBonus;

    // Save progress
    levelProgress[currentLevel] = {
        completed: true,
        stars: Math.max(levelProgress[currentLevel]?.stars || 0, stars),
        bestTime: Math.min(levelProgress[currentLevel]?.bestTime || Infinity, levelTime)
    };
    saveLevelProgress();

    // Update UI
    document.getElementById('level-score').textContent = score;
    document.getElementById('level-time').textContent = formatTime(levelTime);
    document.getElementById('level-gems').textContent = `${gemsCollected}/${gems.length}`;

    // Show stars
    const starsDisplay = document.getElementById('stars-display');
    const starElements = starsDisplay.querySelectorAll('.star');
    starElements.forEach((star, i) => {
        setTimeout(() => {
            if (i < stars) {
                star.classList.add('earned');
            } else {
                star.classList.remove('earned');
            }
        }, i * 300);
    });

    // Show screen
    setTimeout(() => {
        document.getElementById('level-complete').classList.add('active');
    }, 500);
}

function gameOver() {
    gameState = GameState.GAME_OVER;
    cancelAnimationFrame(animationFrameId);

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.add('active');
}

function showVictory() {
    gameState = GameState.VICTORY;
    cancelAnimationFrame(animationFrameId);

    document.getElementById('total-score').textContent = score;
    document.getElementById('total-time').textContent = formatTime(totalPlayTime);
    document.getElementById('total-gems').textContent = totalGems;
    document.getElementById('victory-screen').classList.add('active');
}

// ===== HIGH SCORES =====
function saveHighScore() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim() || 'Anonymous';

    highScores.push({ name, score, date: new Date().toISOString() });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep top 10

    localStorage.setItem('kenzie_highscores', JSON.stringify(highScores));
    nameInput.value = '';

    populateHighScores();
    quitToMenu();
}

function populateHighScores() {
    const list = document.getElementById('scores-list');
    list.innerHTML = '';

    if (highScores.length === 0) {
        list.innerHTML = '<p style="color: var(--light-color); text-align: center;">No scores yet. Be the first!</p>';
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

// ===== SETTINGS =====
function loadSettingsUI() {
    document.getElementById('sfx-toggle').checked = settings.sfx;
    document.getElementById('music-toggle').checked = settings.music;
    document.getElementById('difficulty-select').value = settings.difficulty;
    document.getElementById('skin-select').value = settings.skin;
}

function saveSettings() {
    settings.sfx = document.getElementById('sfx-toggle').checked;
    settings.music = document.getElementById('music-toggle').checked;
    settings.difficulty = document.getElementById('difficulty-select').value;
    settings.skin = document.getElementById('skin-select').value;

    localStorage.setItem('kenzie_settings', JSON.stringify(settings));
}

// ===== SAVE/LOAD =====
function loadSaveData() {
    const savedSettings = localStorage.getItem('kenzie_settings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }

    const savedProgress = localStorage.getItem('kenzie_progress');
    if (savedProgress) {
        levelProgress = JSON.parse(savedProgress);
    }

    const savedScores = localStorage.getItem('kenzie_highscores');
    if (savedScores) {
        highScores = JSON.parse(savedScores);
    }
}

function saveLevelProgress() {
    localStorage.setItem('kenzie_progress', JSON.stringify(levelProgress));
}

function clearSaveData() {
    if (confirm('Are you sure you want to clear all save data? This cannot be undone!')) {
        localStorage.removeItem('kenzie_settings');
        localStorage.removeItem('kenzie_progress');
        localStorage.removeItem('kenzie_highscores');

        settings = {
            sfx: true,
            music: true,
            difficulty: 'normal',
            skin: 'default'
        };
        levelProgress = {};
        highScores = [];

        loadSettingsUI();
        alert('Save data cleared!');
    }
}

// ===== UTILITIES =====
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Add roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}
