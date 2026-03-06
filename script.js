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

// Mini-game Elements
const minigameOverlay = document.getElementById('minigame-overlay');
const minigameCanvas = document.getElementById('minigame-canvas');
const minigameScoreDisplay = document.getElementById('minigame-score');
const minigameTitle = document.getElementById('minigame-title');
const minigameInfo = document.getElementById('minigame-info');
const restartMinigameBtn = document.getElementById('restart-minigame-btn');
const closeMinigameBtn = document.getElementById('close-minigame-btn');
const ctx = minigameCanvas.getContext('2d');

// Feed-game Elements
const feedOverlay = document.getElementById('feed-game-overlay');
const feedCanvas = document.getElementById('feed-game-canvas');
const feedScoreDisplay = document.getElementById('feed-game-score');
const restartFeedBtn = document.getElementById('restart-feed-btn');
const closeFeedBtn = document.getElementById('close-feed-btn');
const exitFeedBtn = document.getElementById('exit-feed-btn');
const exitMinigameBtn = document.getElementById('exit-minigame-btn');
const ctxFeed = feedCanvas.getContext('2d');

let flappyLoopId, catchLoopId;

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
    startFeedGame();
}

function play() {
    if (!gameState.isAlive) return;
    startMinigame();
}

// === LÓGICA DO FLAPPY DUCK ===
let flappyState = {
    birdY: 200,
    birdV: 0,
    pipes: [],
    score: 0,
    playing: false,
    gameOver: false,
    gameWon: false
};

const FLAPPY_CONFIG = {
    GRAVITY: 0.25,
    JUMP: -4.5,
    PIPE_GAP: 150,
    PIPE_SPEED: 2,
    PIPE_SPAWN: 1500,
    TARGET_SCORE: 5
};

function startMinigame() {
    if (flappyLoopId) cancelAnimationFrame(flappyLoopId);
    minigameOverlay.classList.remove('hidden');
    minigameCanvas.width = 320;
    minigameCanvas.height = 480;

    resetFlappy();
    flappyLoopId = requestAnimationFrame(minigameLoop);
}

function resetFlappy() {
    flappyState = {
        birdY: 200,
        birdV: 0,
        pipes: [],
        score: 0,
        playing: true,
        gameOver: false,
        gameWon: false
    };
    restartMinigameBtn.classList.add('hidden');
    closeMinigameBtn.classList.add('hidden');
    updateScoreUI();
}

function updateScoreUI() {
    minigameScoreDisplay.innerText = `🏆 ${flappyState.score} / ${FLAPPY_CONFIG.TARGET_SCORE}`;
}

function minigameLoop() {
    if (!flappyState.playing) return;

    updateFlappy();
    drawFlappy();

    if (!flappyState.gameOver && !flappyState.gameWon) {
        flappyLoopId = requestAnimationFrame(minigameLoop);
    }
}

function updateFlappy() {
    // Gravidade
    flappyState.birdV += FLAPPY_CONFIG.GRAVITY;
    flappyState.birdY += flappyState.birdV;

    // Gerar canos
    if (flappyState.pipes.length === 0 || flappyState.pipes[flappyState.pipes.length - 1].x < minigameCanvas.width - 200) {
        const h = Math.random() * (minigameCanvas.height - FLAPPY_CONFIG.PIPE_GAP - 100) + 50;
        flappyState.pipes.push({ x: minigameCanvas.width, h: h, passed: false });
    }

    // Mover canos e colisão
    flappyState.pipes.forEach(pipe => {
        pipe.x -= FLAPPY_CONFIG.PIPE_SPEED;

        // Ponto
        if (!pipe.passed && pipe.x < 50) {
            pipe.passed = true;
            flappyState.score++;
            updateScoreUI();
            if (flappyState.score >= FLAPPY_CONFIG.TARGET_SCORE) {
                winMinigame();
            }
        }

        // Colisão com cano
        if (pipe.x < 50 + 40 && pipe.x + 50 > 50) {
            if (flappyState.birdY < pipe.h || flappyState.birdY + 30 > pipe.h + FLAPPY_CONFIG.PIPE_GAP) {
                failMinigame();
            }
        }
    });

    // Colisão solo / teto
    if (flappyState.birdY > minigameCanvas.height || flappyState.birdY < 0) {
        failMinigame();
    }

    // Limpar canos fora da tela
    flappyState.pipes = flappyState.pipes.filter(p => p.x > -60);
}

function drawFlappy() {
    ctx.clearRect(0, 0, minigameCanvas.width, minigameCanvas.height);

    // Fundo (Céu)
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, minigameCanvas.width, minigameCanvas.height);

    // Canos
    ctx.fillStyle = "#2ecc71";
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 4;
    flappyState.pipes.forEach(p => {
        // Superior
        ctx.fillRect(p.x, 0, 50, p.h);
        ctx.strokeRect(p.x, 0, 50, p.h);
        // Inferior
        ctx.fillRect(p.x, p.h + FLAPPY_CONFIG.PIPE_GAP, 50, minigameCanvas.height);
        ctx.strokeRect(p.x, p.h + FLAPPY_CONFIG.PIPE_GAP, 50, minigameCanvas.height);
    });

    // Pato (Simulado em canvas por enquanto ou usar sprite se carregado)
    ctx.save();
    ctx.translate(50 + 20, flappyState.birdY + 15);
    ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, flappyState.birdV * 0.1)));

    // Corpo simples amarelo
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    // Bico
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(10, -5, 10, 8);
    // Olho
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function failMinigame() {
    flappyState.gameOver = true;
    flappyState.playing = false;
    minigameTitle.innerText = "Quack! Você bateu.";
    minigameInfo.innerText = "Isso deu fome... -10%";
    restartMinigameBtn.classList.remove('hidden');

    // Penalidade: perde 10% de comida ao bater
    gameState.hunger = Math.max(0, gameState.hunger - 10);
    updateUI();
}

function winMinigame() {
    flappyState.gameWon = true;
    flappyState.playing = false;
    minigameTitle.innerText = "Vitória!";
    minigameInfo.innerText = "O pato se divertiu muito!";
    closeMinigameBtn.classList.remove('hidden');
}

function finishMinigame() {
    gameState.fun = Math.min(100, gameState.fun + CONFIG.PLAY_GAIN);
    minigameOverlay.classList.add('hidden');
    updateUI();
    createParticles('🎾');
    duckWrapper.classList.add('jump');
    setTimeout(() => duckWrapper.classList.remove('jump'), 500);
}

// Input para o Minigame
function handleFlappyInput() {
    if (flappyState.playing && !flappyState.gameOver && !flappyState.gameWon) {
        flappyState.birdV = FLAPPY_CONFIG.JUMP;
    }
}

minigameCanvas.addEventListener('mousedown', handleFlappyInput);
window.addEventListener('keydown', (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        handleFlappyInput();
    }
});

restartMinigameBtn.addEventListener('click', () => {
    resetFlappy();
    flappyLoopId = requestAnimationFrame(minigameLoop);
});
closeMinigameBtn.addEventListener('click', finishMinigame);
exitMinigameBtn.addEventListener('click', () => {
    flappyState.playing = false;
    minigameOverlay.classList.add('hidden');
});

// === LÓGICA DO CATCH GAME (ALIMENTAR) ===
let catchState = {
    paddleX: 130,
    items: [],
    score: 0,
    misses: 0,
    playing: false,
    gameOver: false,
    gameWon: false
};

const CATCH_CONFIG = {
    PADDLE_WIDTH: 80, // Larger paddle
    PADDLE_HEIGHT: 15,
    ITEM_SPEED: 4,
    SPAWN_CHANCE: 0.03,
    TARGET_SCORE: 10,
    MAX_MISSES: 5
};

function startFeedGame() {
    if (catchLoopId) cancelAnimationFrame(catchLoopId);
    feedOverlay.classList.remove('hidden');
    feedCanvas.width = 320;
    feedCanvas.height = 480;
    resetCatch();
    catchLoopId = requestAnimationFrame(feedGameLoop);
}

function resetCatch() {
    catchState = {
        paddleX: 120,
        items: [],
        score: 0,
        misses: 0,
        playing: true,
        gameOver: false,
        gameWon: false
    };
    restartFeedBtn.classList.add('hidden');
    closeFeedBtn.classList.add('hidden');
    updateFeedScoreUI();
}

function updateFeedScoreUI() {
    feedScoreDisplay.innerText = `🌽 ${catchState.score} / ${CATCH_CONFIG.TARGET_SCORE}`;
    if (catchState.misses > 0) {
        // Show errors in smaller text if needed or just count
        feedScoreDisplay.title = `Erros: ${catchState.misses}/${CATCH_CONFIG.MAX_MISSES}`;
    }
}

function feedGameLoop() {
    if (!catchState.playing) return;
    updateCatch();
    drawCatch();
    if (!catchState.gameOver && !catchState.gameWon) {
        catchLoopId = requestAnimationFrame(feedGameLoop);
    }
}

function updateCatch() {
    if (Math.random() < CATCH_CONFIG.SPAWN_CHANCE) {
        catchState.items.push({ x: Math.random() * (feedCanvas.width - 20), y: -20 });
    }
    catchState.items.forEach((item, index) => {
        item.y += CATCH_CONFIG.ITEM_SPEED;
        // Collision detection
        if (item.y > feedCanvas.height - 75 && item.y < feedCanvas.height - 40) {
            if (item.x + 10 > catchState.paddleX && item.x + 10 < catchState.paddleX + CATCH_CONFIG.PADDLE_WIDTH) {
                catchState.items.splice(index, 1);
                catchState.score++;
                updateFeedScoreUI();
                if (catchState.score >= CATCH_CONFIG.TARGET_SCORE) {
                    catchState.gameWon = true;
                    catchState.playing = false;
                    closeFeedBtn.classList.remove('hidden');
                }
            }
        }

        if (item.y > feedCanvas.height) {
            catchState.items.splice(index, 1);
            catchState.misses++;
            updateFeedScoreUI();
            if (catchState.misses >= CATCH_CONFIG.MAX_MISSES) {
                catchState.gameOver = true;
                catchState.playing = false;
                restartFeedBtn.classList.remove('hidden');
            }
        }
    });
}

function drawCatch() {
    ctxFeed.clearRect(0, 0, feedCanvas.width, feedCanvas.height);

    // Gradient Background
    const grad = ctxFeed.createLinearGradient(0, 0, 0, feedCanvas.height);
    grad.addColorStop(0, "#2c3e50");
    grad.addColorStop(1, "#34495e");
    ctxFeed.fillStyle = grad;
    ctxFeed.fillRect(0, 0, feedCanvas.width, feedCanvas.height);

    // Paddle (Cesta) - Subindo um pouco mais para garantir visibilidade
    ctxFeed.fillStyle = "#f1c40f";
    ctxFeed.strokeStyle = "#fff";
    ctxFeed.lineWidth = 3;

    const px = catchState.paddleX;
    const py = feedCanvas.height - 60; // Mais alto
    const pw = CATCH_CONFIG.PADDLE_WIDTH;
    const ph = CATCH_CONFIG.PADDLE_HEIGHT;

    // Desenhar cesta com "corpo"
    ctxFeed.fillRect(px, py, pw, ph);
    ctxFeed.strokeRect(px, py, pw, ph);

    // Detalhe da cesta
    ctxFeed.fillStyle = "rgba(0,0,0,0.2)";
    ctxFeed.fillRect(px + 10, py + 5, pw - 20, ph - 10);

    // Items (Milho)
    ctxFeed.fillStyle = "#ffcc00";
    ctxFeed.strokeStyle = "#e67e22";
    catchState.items.forEach(item => {
        ctxFeed.beginPath();
        ctxFeed.arc(item.x + 10, item.y + 10, 8, 0, Math.PI * 2);
        ctxFeed.fill();
        ctxFeed.stroke();
    });

    if (catchState.gameOver) {
        ctxFeed.fillStyle = "white";
        ctxFeed.font = "bold 20px Outfit";
        ctxFeed.textAlign = "center";
        ctxFeed.fillText("Putz! Perdeu o milho.", feedCanvas.width / 2, feedCanvas.height / 2);
        ctxFeed.font = "14px Outfit";
        ctxFeed.fillText("O pato continua com fome.", feedCanvas.width / 2, feedCanvas.height / 2 + 30);
    }
    if (catchState.gameWon) {
        ctxFeed.fillStyle = "#2ecc71";
        ctxFeed.font = "bold 24px Outfit";
        ctxFeed.textAlign = "center";
        ctxFeed.fillText("Parabéns!", feedCanvas.width / 2, feedCanvas.height / 2);
        ctxFeed.fillStyle = "white";
        ctxFeed.font = "16px Outfit";
        ctxFeed.fillText("Barriga cheia e muito feliz!", feedCanvas.width / 2, feedCanvas.height / 2 + 35);
    }
}

feedCanvas.addEventListener('mousemove', (e) => {
    const rect = feedCanvas.getBoundingClientRect();
    const scaleX = feedCanvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    catchState.paddleX = Math.min(feedCanvas.width - CATCH_CONFIG.PADDLE_WIDTH, Math.max(0, x - CATCH_CONFIG.PADDLE_WIDTH / 2));
});

feedCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = feedCanvas.getBoundingClientRect();
    const scaleX = feedCanvas.width / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    catchState.paddleX = Math.min(feedCanvas.width - CATCH_CONFIG.PADDLE_WIDTH, Math.max(0, x - CATCH_CONFIG.PADDLE_WIDTH / 2));
});

restartFeedBtn.addEventListener('click', () => {
    resetCatch();
    catchLoopId = requestAnimationFrame(feedGameLoop);
});

exitFeedBtn.addEventListener('click', () => {
    catchState.playing = false;
    feedOverlay.classList.add('hidden');
});

closeFeedBtn.addEventListener('click', () => {
    catchState.playing = false;
    gameState.hunger = Math.min(100, gameState.hunger + CONFIG.FEED_GAIN * 2); // Double gain for minigame
    feedOverlay.classList.add('hidden');
    updateUI();
    createParticles('🌽');
});

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
