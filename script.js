// Configurações do Jogo
const CONFIG = {
    HUNGER_DECAY: 2, // % cada 10s
    FUN_DECAY: 3,    // % cada 15s
    FEED_GAIN: 15,   // % ganho ao comer
    PLAY_GAIN: 20,   // % ganho ao brincar
    DECAY_INTERVAL_HUNGER: 10000,
    DECAY_INTERVAL_FUN: 15000,
    CRITICAL_THRESHOLD: 50
};

// Estado Inicial
let gameState = {
    hunger: 100,
    fun: 100,
    isAlive: true
};

// Elementos da UI
const hungerBar = document.getElementById('hunger-bar');
const funBar = document.getElementById('fun-bar');
const duckSprite = document.getElementById('duck-sprite');
const duckWrapper = document.getElementById('duck-wrapper');
const messageContainer = document.getElementById('message-container');
const gameOverText = document.getElementById('game-over-text');
const resetBtn = document.getElementById('reset-btn');
const feedBtn = document.getElementById('feed-btn');
const playBtn = document.getElementById('play-btn');
const particlesContainer = document.getElementById('particles');

// Caminhos dos Assets
const ASSETS = {
    HAPPY: 'file:///C:/Users/24025899/.gemini/antigravity/brain/f04ad9df-1a7c-449b-b624-98982096ce5b/happy_duck_pixel_art_1772753044285.png',
    SAD: 'file:///C:/Users/24025899/.gemini/antigravity/brain/f04ad9df-1a7c-449b-b624-98982096ce5b/sad_duck_pixel_art_v2_1772753186854.png',
    GONE: 'file:///C:/Users/24025899/.gemini/antigravity/brain/f04ad9df-1a7c-449b-b624-98982096ce5b/duck_leaving_note_1772753173410.png'
};

// Funções de Atualização
function updateUI() {
    hungerBar.style.width = `${gameState.hunger}%`;
    funBar.style.width = `${gameState.fun}%`;

    // Feedback Visual de Crítico
    hungerBar.classList.toggle('critical', gameState.hunger < CONFIG.CRITICAL_THRESHOLD);
    funBar.classList.toggle('critical', gameState.fun < CONFIG.CRITICAL_THRESHOLD);

    // Mudar Expressão do Pato
    if (gameState.hunger < CONFIG.CRITICAL_THRESHOLD || gameState.fun < CONFIG.CRITICAL_THRESHOLD) {
        duckSprite.src = ASSETS.SAD;
    } else {
        duckSprite.src = ASSETS.HAPPY;
    }

    // Verificar Game Over
    if (gameState.hunger <= 0 || gameState.fun <= 0) {
        endGame();
    }
}

function endGame() {
    gameState.isAlive = false;
    duckSprite.src = ASSETS.GONE;
    duckWrapper.style.display = 'none';

    let reason = gameState.hunger <= 0 ? "Fiquei com muita fome..." : "Fiquei muito entediado...";
    gameOverText.innerText = `Quack! O pato foi embora.\n"${reason}"\nEle deixou um bilhete de despedida.`;

    messageContainer.classList.remove('hidden');
    clearInterval(hungerInterval);
    clearInterval(funInterval);
}

function resetGame() {
    gameState = {
        hunger: 100,
        fun: 100,
        isAlive: true
    };
    duckWrapper.style.display = 'block';
    messageContainer.classList.add('hidden');
    updateUI();
    startLoops();
}

// Ações do Jogador
function feed() {
    if (!gameState.isAlive) return;
    gameState.hunger = Math.min(100, gameState.hunger + CONFIG.FEED_GAIN);
    createParticles('🌽');
    updateUI();
}

function play() {
    if (!gameState.isAlive) return;
    gameState.fun = Math.min(100, gameState.fun + CONFIG.PLAY_GAIN);

    // Animação de Pulo
    duckWrapper.classList.add('jump');
    setTimeout(() => duckWrapper.classList.remove('jump'), 500);

    createParticles('🎾');
    updateUI();
}

// Sistema de Partículas
function createParticles(emoji) {
    for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.innerText = emoji;

        // Direção aleatória
        const tx = (Math.random() - 0.5) * 200;
        const ty = (Math.random() - 0.5) * 200 - 50;

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.left = '50%';
        p.style.top = '50%';

        particlesContainer.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// Loops de Tempo Real
let hungerInterval, funInterval;

function startLoops() {
    if (hungerInterval) clearInterval(hungerInterval);
    if (funInterval) clearInterval(funInterval);

    hungerInterval = setInterval(() => {
        if (gameState.isAlive) {
            gameState.hunger = Math.max(0, gameState.hunger - CONFIG.HUNGER_DECAY);
            updateUI();
        }
    }, CONFIG.DECAY_INTERVAL_HUNGER);

    funInterval = setInterval(() => {
        if (gameState.isAlive) {
            gameState.fun = Math.max(0, gameState.fun - CONFIG.FUN_DECAY);
            updateUI();
        }
    }, CONFIG.DECAY_INTERVAL_FUN);
}

// Event Listeners
feedBtn.addEventListener('click', feed);
playBtn.addEventListener('click', play);
resetBtn.addEventListener('click', resetGame);

// Iniciar Jogo
updateUI();
startLoops();
