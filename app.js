// Emily's Magical Butterfly Garden

const FLOWERS = {
    seed: '🌱',
    sprout: '🌿',
    buds: ['🌷', '🌸', '🌺', '🌻', '🌹', '💐', '🪻', '🪷'],
    bloomed: ['🌷', '🌸', '🌺', '🌻', '🌹', '💐', '🪻', '🪷'],
};

const BUTTERFLIES = ['🦋', '🦋', '🦋'];
const SPARKLE_EMOJIS = ['✨', '💫', '⭐', '🌟', '💖', '💝'];
const CONFETTI = ['🎀', '💜', '💗', '🩷', '🩵', '💛', '🧡'];

const GARDEN_THEMES = [
    { name: 'Garden 1', bg: 'linear-gradient(180deg, #87CEEB 0%, #98E4FF 25%, #C8F7C5 55%, #7BC67E 75%, #5DA85D 100%)' },
    { name: 'Garden 2', bg: 'linear-gradient(180deg, #FFB6C1 0%, #FFDAB9 25%, #C8F7C5 55%, #7BC67E 75%, #5DA85D 100%)' },
    { name: 'Garden 3', bg: 'linear-gradient(180deg, #E6E6FA 0%, #D8BFD8 25%, #C8F7C5 55%, #7BC67E 75%, #5DA85D 100%)' },
    { name: 'Garden 4', bg: 'linear-gradient(180deg, #FFFACD 0%, #FFEFD5 25%, #C8F7C5 55%, #7BC67E 75%, #5DA85D 100%)' },
    { name: 'Rainbow!', bg: 'linear-gradient(180deg, #FFB3BA 0%, #FFDFBA 15%, #FFFFBA 30%, #BAFFC9 50%, #BAE1FF 70%, #D4BAFF 85%, #FFB3DE 100%)' },
];

let state = {
    stars: 0,
    butterfliesCaught: 0,
    gardenLevel: 0,
    magicWand: 3,
    currentTool: 'plant',
    plots: Array(9).fill(null).map(() => ({
        stage: 'empty',
        flowerType: null,
    })),
    activeButterflies: [],
};

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playPlantSound() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 80);
}

function playWaterSound() {
    playTone(880, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(780, 0.1, 'sine', 0.08), 50);
    setTimeout(() => playTone(680, 0.15, 'sine', 0.06), 100);
}

function playGrowSound() {
    playTone(440, 0.15);
    setTimeout(() => playTone(554, 0.15), 100);
    setTimeout(() => playTone(659, 0.2), 200);
}

function playBloomSound() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 100);
    setTimeout(() => playTone(784, 0.15), 200);
    setTimeout(() => playTone(1047, 0.3), 300);
}

function playMagicSound() {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => playTone(400 + i * 150, 0.2, 'sine', 0.1), i * 80);
    }
}

function playButterflySound() {
    playTone(1047, 0.1);
    setTimeout(() => playTone(1319, 0.1), 60);
    setTimeout(() => playTone(1568, 0.15), 120);
}

function playCelebrationSound() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.25, 'sine', 0.12), i * 150);
    });
}

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const playBtn = document.getElementById('play-btn');
const gardenGrid = document.getElementById('garden-grid');
const starCountEl = document.getElementById('star-count');
const butterflyCountEl = document.getElementById('butterfly-count');
const levelTextEl = document.getElementById('level-text');
const magicCountEl = document.getElementById('magic-count');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const celebration = document.getElementById('celebration');
const nextGardenBtn = document.getElementById('next-garden-btn');
const butterflyArea = document.getElementById('butterfly-area');
const particleArea = document.getElementById('particle-area');
const emilyEl = document.getElementById('emily');
const toolBtns = document.querySelectorAll('.tool-btn');

// Initialize
playBtn.addEventListener('click', startGame);
nextGardenBtn.addEventListener('click', nextGarden);

toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'magic' && state.magicWand <= 0) return;
        state.currentTool = tool;
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        initAudio();
    });
});

function startGame() {
    initAudio();
    welcomeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    buildGarden();
    addDecorations();
    scheduleButterflySpawn();
    playTone(523, 0.2);
    setTimeout(() => playTone(784, 0.3), 150);
}

function buildGarden() {
    gardenGrid.innerHTML = '';
    state.plots.forEach((plot, index) => {
        const plotEl = document.createElement('div');
        plotEl.className = 'garden-plot';
        plotEl.dataset.index = index;

        const content = document.createElement('div');
        content.className = 'plot-content';
        content.textContent = getPlotEmoji(plot);
        plotEl.appendChild(content);

        plotEl.addEventListener('click', () => handlePlotClick(index));
        plotEl.addEventListener('touchend', (e) => {
            e.preventDefault();
            handlePlotClick(index);
        });

        gardenGrid.appendChild(plotEl);
    });
    updateUI();
}

function getPlotEmoji(plot) {
    switch (plot.stage) {
        case 'empty': return '';
        case 'seed': return FLOWERS.seed;
        case 'sprout': return FLOWERS.sprout;
        case 'bud': return plot.flowerType || '🌷';
        case 'bloomed': return plot.flowerType || '🌷';
        default: return '';
    }
}

function handlePlotClick(index) {
    initAudio();
    const plot = state.plots[index];

    switch (state.currentTool) {
        case 'plant':
            handlePlant(index, plot);
            break;
        case 'water':
            handleWater(index, plot);
            break;
        case 'magic':
            handleMagic(index, plot);
            break;
    }
}

function handlePlant(index, plot) {
    if (plot.stage !== 'empty') return;

    plot.stage = 'seed';
    plot.flowerType = FLOWERS.buds[Math.floor(Math.random() * FLOWERS.buds.length)];
    playPlantSound();

    const plotEl = gardenGrid.children[index];
    plotEl.classList.add('planted');
    const content = plotEl.querySelector('.plot-content');
    content.textContent = FLOWERS.seed;
    content.classList.add('bounce');
    setTimeout(() => content.classList.remove('bounce'), 500);

    spawnParticles(plotEl, ['🌱', '✨'], 3);
    addStars(1, plotEl);
    updateUI();
}

function handleWater(index, plot) {
    if (plot.stage === 'empty' || plot.stage === 'bloomed') return;

    const plotEl = gardenGrid.children[index];
    const content = plotEl.querySelector('.plot-content');

    showWaterDrops(plotEl);
    playWaterSound();

    setTimeout(() => {
        switch (plot.stage) {
            case 'seed':
                plot.stage = 'sprout';
                content.textContent = FLOWERS.sprout;
                content.classList.add('grow');
                setTimeout(() => content.classList.remove('grow'), 600);
                playGrowSound();
                spawnParticles(plotEl, ['💧', '✨'], 3);
                addStars(1, plotEl);
                break;
            case 'sprout':
                plot.stage = 'bud';
                content.textContent = plot.flowerType;
                content.classList.add('grow');
                setTimeout(() => content.classList.remove('grow'), 600);
                playGrowSound();
                spawnParticles(plotEl, ['✨', '💫'], 4);
                addStars(2, plotEl);
                break;
            case 'bud':
                plot.stage = 'bloomed';
                content.textContent = plot.flowerType;
                plotEl.classList.add('bloomed');
                content.classList.add('bloom');
                setTimeout(() => content.classList.remove('bloom'), 800);
                playBloomSound();
                spawnParticles(plotEl, ['✨', '🌟', '💖', '🎀'], 8);
                addStars(3, plotEl);
                emilyReact('happy');
                break;
        }
        updateUI();
        checkGardenComplete();
    }, 300);
}

function handleMagic(index, plot) {
    if (plot.stage === 'bloomed' || state.magicWand <= 0) return;

    state.magicWand--;
    magicCountEl.textContent = state.magicWand;

    if (state.magicWand <= 0) {
        document.getElementById('tool-magic').style.opacity = '0.5';
    }

    playMagicSound();

    const plotEl = gardenGrid.children[index];
    const content = plotEl.querySelector('.plot-content');

    if (plot.stage === 'empty') {
        plot.flowerType = FLOWERS.buds[Math.floor(Math.random() * FLOWERS.buds.length)];
    }

    plot.stage = 'bloomed';
    plotEl.classList.add('planted', 'bloomed');
    content.textContent = plot.flowerType;
    content.classList.add('magic-grow');
    setTimeout(() => content.classList.remove('magic-grow'), 1000);

    spawnParticles(plotEl, ['✨', '🌟', '💫', '🪄', '💖', '⭐'], 12);
    addStars(5, plotEl);
    emilyReact('amazed');

    state.currentTool = 'plant';
    toolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('tool-plant').classList.add('active');

    updateUI();
    checkGardenComplete();
}

function showWaterDrops(plotEl) {
    for (let i = 0; i < 5; i++) {
        const drop = document.createElement('span');
        drop.className = 'water-drop';
        drop.textContent = '💧';
        drop.style.left = (20 + Math.random() * 60) + '%';
        drop.style.top = (10 + Math.random() * 30) + '%';
        drop.style.animationDelay = (i * 0.1) + 's';
        plotEl.appendChild(drop);
        setTimeout(() => drop.remove(), 700);
    }
}

function spawnParticles(element, emojis, count) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = cx + 'px';
        particle.style.top = cy + 'px';
        particle.style.fontSize = (16 + Math.random() * 16) + 'px';

        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
        const dist = 40 + Math.random() * 60;
        particle.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * dist - 30 + 'px');

        particleArea.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function addStars(count, element) {
    state.stars += count;
    starCountEl.textContent = state.stars;

    if (element) {
        const rect = element.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${count} ⭐`;
        popup.style.left = (rect.left + rect.width / 2 - 30) + 'px';
        popup.style.top = (rect.top - 10) + 'px';
        particleArea.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    starCountEl.style.transform = 'scale(1.3)';
    setTimeout(() => starCountEl.style.transform = 'scale(1)', 200);
}

function emilyReact(type) {
    switch (type) {
        case 'happy':
            emilyEl.textContent = '👧';
            emilyEl.style.transform = 'scale(1.2)';
            setTimeout(() => emilyEl.style.transform = '', 500);
            break;
        case 'amazed':
            emilyEl.textContent = '🤩';
            setTimeout(() => { emilyEl.textContent = '👧'; }, 2000);
            break;
        case 'celebrate':
            emilyEl.textContent = '🥳';
            setTimeout(() => { emilyEl.textContent = '👧'; }, 3000);
            break;
    }
}

// Butterfly System
let butterflyTimer = null;

function scheduleButterflySpawn() {
    const delay = 4000 + Math.random() * 6000;
    butterflyTimer = setTimeout(() => {
        const bloomedCount = state.plots.filter(p => p.stage === 'bloomed').length;
        if (bloomedCount > 0 && state.activeButterflies.length < 3) {
            spawnButterfly();
        }
        scheduleButterflySpawn();
    }, delay);
}

function spawnButterfly() {
    const butterfly = document.createElement('div');
    butterfly.className = 'flying-butterfly';
    butterfly.textContent = BUTTERFLIES[Math.floor(Math.random() * BUTTERFLIES.length)];

    const startX = Math.random() * (window.innerWidth - 60) + 30;
    const startY = 100 + Math.random() * (window.innerHeight * 0.5);
    butterfly.style.left = startX + 'px';
    butterfly.style.top = startY + 'px';

    const id = Date.now() + Math.random();
    butterfly.dataset.id = id;

    const handleCatch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        catchButterfly(butterfly, id);
    };

    butterfly.addEventListener('click', handleCatch);
    butterfly.addEventListener('touchstart', handleCatch, { passive: false });

    butterflyArea.appendChild(butterfly);
    state.activeButterflies.push(id);

    moveButterfly(butterfly);

    setTimeout(() => {
        if (butterfly.parentNode && !butterfly.classList.contains('caught')) {
            butterfly.style.transition = 'opacity 1s';
            butterfly.style.opacity = '0';
            setTimeout(() => {
                butterfly.remove();
                state.activeButterflies = state.activeButterflies.filter(bid => bid !== id);
            }, 1000);
        }
    }, 10000 + Math.random() * 5000);
}

function moveButterfly(butterfly) {
    if (!butterfly.parentNode || butterfly.classList.contains('caught')) return;

    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight * 0.7;
    const newX = Math.random() * maxX;
    const newY = 80 + Math.random() * maxY;
    const duration = 2000 + Math.random() * 3000;

    butterfly.style.transition = `left ${duration}ms ease-in-out, top ${duration}ms ease-in-out`;
    butterfly.style.left = newX + 'px';
    butterfly.style.top = newY + 'px';

    setTimeout(() => moveButterfly(butterfly), duration);
}

function catchButterfly(butterfly, id) {
    if (butterfly.classList.contains('caught')) return;

    initAudio();
    butterfly.classList.add('caught');
    playButterflySound();

    state.butterfliesCaught++;
    butterflyCountEl.textContent = state.butterfliesCaught;
    state.activeButterflies = state.activeButterflies.filter(bid => bid !== id);

    const rect = butterfly.getBoundingClientRect();
    spawnParticlesAt(rect.left, rect.top, ['✨', '🌟', '💖', '🦋'], 6);
    addStars(2, butterfly);

    if (state.butterfliesCaught % 5 === 0) {
        state.magicWand++;
        magicCountEl.textContent = state.magicWand;
        document.getElementById('tool-magic').style.opacity = '1';
        showMagicReward();
    }

    emilyReact('happy');

    setTimeout(() => butterfly.remove(), 500);
}

function spawnParticlesAt(x, y, emojis, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = (16 + Math.random() * 16) + 'px';

        const angle = (Math.PI * 2 * i) / count;
        const dist = 30 + Math.random() * 50;
        particle.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * dist + 'px');

        particleArea.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function showMagicReward() {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '🪄 +1 Magic!';
    popup.style.left = '50%';
    popup.style.top = '40%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.fontSize = '28px';
    popup.style.color = '#BA55D3';
    particleArea.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
}

// Garden Completion
function checkGardenComplete() {
    const allBloomed = state.plots.every(p => p.stage === 'bloomed');
    if (!allBloomed) return;

    setTimeout(() => {
        celebration.classList.add('active');
        playCelebrationSound();
        emilyReact('celebrate');
        addStars(10, null);
        spawnConfetti();
    }, 500);
}

function spawnConfetti() {
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('span');
            confetti.className = 'particle';
            confetti.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
            confetti.style.left = (Math.random() * 100) + '%';
            confetti.style.top = '-20px';
            confetti.style.fontSize = (16 + Math.random() * 20) + 'px';
            confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
            particleArea.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 100);
    }
}

function nextGarden() {
    celebration.classList.remove('active');

    state.gardenLevel++;
    if (state.gardenLevel >= GARDEN_THEMES.length) {
        state.gardenLevel = 0;
    }

    const theme = GARDEN_THEMES[state.gardenLevel];
    gameScreen.style.background = theme.bg;
    levelTextEl.textContent = theme.name;

    state.magicWand += 2;
    magicCountEl.textContent = state.magicWand;
    document.getElementById('tool-magic').style.opacity = '1';

    state.plots = Array(9).fill(null).map(() => ({
        stage: 'empty',
        flowerType: null,
    }));

    buildGarden();
    playTone(523, 0.2);
    setTimeout(() => playTone(659, 0.2), 100);
    setTimeout(() => playTone(784, 0.3), 200);
}

// UI Updates
function updateUI() {
    starCountEl.textContent = state.stars;
    butterflyCountEl.textContent = state.butterfliesCaught;
    magicCountEl.textContent = state.magicWand;

    const bloomedCount = state.plots.filter(p => p.stage === 'bloomed').length;
    const totalPlots = state.plots.length;
    const pct = (bloomedCount / totalPlots) * 100;

    progressFill.style.width = pct + '%';
    progressText.textContent = `${bloomedCount}/${totalPlots} flowers`;
}

// Decorations
function addDecorations() {
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.textContent = '☁️';
        cloud.style.animationDelay = (-i * 8) + 's';
        gameScreen.appendChild(cloud);
    }

    const sun = document.createElement('div');
    sun.className = 'sun';
    sun.textContent = '☀️';
    gameScreen.appendChild(sun);
}
