// --- ARCADE HUB LOGIC ---
const menu = document.getElementById('arcade-menu');
const gameContainer = document.getElementById('game-container');
const backBtn = document.getElementById('back-to-menu-btn');
const mainBackBtn = document.querySelector('.main-back-btn');
let activeGameId = null;

document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const gameId = card.getAttribute('data-game');
        startGame(gameId);
    });
});

backBtn.addEventListener('click', () => {
    if(activeGameId === '2') RunGame.stop();
    if(activeGameId === '3') BreakoutGame.stop();
    if(activeGameId === '5') SnakeGame.stop();
    if(activeGameId === '6') ShooterGame.stop();
    
    document.getElementById(`game-${activeGameId}-view`).classList.add('hidden');
    gameContainer.classList.add('hidden');
    menu.classList.remove('hidden');
    mainBackBtn.style.display = 'block';
    activeGameId = null;
});

function startGame(id) {
    menu.classList.add('hidden');
    mainBackBtn.style.display = 'none';
    gameContainer.classList.remove('hidden');
    document.getElementById(`game-${id}-view`).classList.remove('hidden');
    activeGameId = id;

    if (id === '1') MemoryGame.init();
    if (id === '2') RunGame.init();
    if (id === '3') BreakoutGame.init();
    if (id === '4') Game2048.init();
    if (id === '5') SnakeGame.init();
    if (id === '6') ShooterGame.init();
}

// --- GAME 1: MEMORY MATCH ---
const MemoryGame = {
    emojis: ['👽', '🚀', '👾', '✨', '🪐', '☄️', '🌌', '🛸', '🤖', '🌟'],
    cards: [],
    flipped: [],
    matched: 0,
    score: 0,
    locked: false,
    board: document.getElementById('g1-board'),
    scoreEl: document.getElementById('g1-score'),

    init() {
        this.board.innerHTML = '';
        this.score = 0;
        this.matched = 0;
        this.flipped = [];
        this.locked = false;
        this.scoreEl.innerText = '0';
        
        let deck = [...this.emojis, ...this.emojis].sort(() => Math.random() - 0.5);
        
        deck.forEach((emoji, i) => {
            let card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.val = emoji;
            card.innerHTML = `
                <div class="card-face card-front"></div>
                <div class="card-face card-back">${emoji}</div>
            `;
            card.onclick = () => this.flip(card);
            this.board.appendChild(card);
        });
    },

    flip(card) {
        if (this.locked || card.classList.contains('flipped') || card.classList.contains('removed')) return;
        
        card.classList.add('flipped');
        this.flipped.push(card);

        if (this.flipped.length === 2) {
            this.locked = true;
            this.checkMatch();
        }
    },

    checkMatch() {
        const [c1, c2] = this.flipped;
        if (c1.dataset.val === c2.dataset.val) {
            setTimeout(() => {
                c1.classList.add('removed');
                c2.classList.add('removed');
                this.flipped = [];
                this.matched += 2;
                this.score += 10;
                this.scoreEl.innerText = this.score;
                this.locked = false;
                if (this.matched === 20) this.win();
            }, 500);
        } else {
            setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                this.flipped = [];
                this.locked = false;
            }, 1000);
        }
    },

    win() {
        if(typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }
    }
};
document.getElementById('g1-restart').onclick = () => MemoryGame.init();


// --- GAME 2: CYBER RUN ---
const RunGame = {
    canvas: document.getElementById('g2-canvas'),
    ctx: null,
    scoreEl: document.getElementById('g2-score'),
    hiScoreEl: document.getElementById('g2-highscore'),
    overlay: document.getElementById('g2-overlay'),
    
    player: { x: 50, y: 250, w: 30, h: 30, dy: 0, gravity: 0.6, jump: -12, isGrounded: true },
    obstacles: [],
    frame: 0,
    score: 0,
    hiScore: 0,
    isPlaying: false,
    loopId: null,

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.reset();
        this.draw();
        this.overlay.classList.remove('hidden');
        
        window.onkeydown = (e) => {
            if (activeGameId !== '2') return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!this.isPlaying) this.start();
                else if (this.player.isGrounded) {
                    this.player.dy = this.player.jump;
                    this.player.isGrounded = false;
                }
            }
        };
    },

    reset() {
        this.player.y = 250;
        this.player.dy = 0;
        this.player.isGrounded = true;
        this.obstacles = [];
        this.frame = 0;
        this.score = 0;
        this.scoreEl.innerText = '0';
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
    },

    start() {
        this.reset();
        this.overlay.classList.add('hidden');
        this.isPlaying = true;
        this.loop();
    },

    stop() {
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
        window.onkeydown = null;
    },

    loop() {
        if (!this.isPlaying) return;
        this.update();
        this.draw();
        this.loopId = requestAnimationFrame(() => this.loop());
    },

    update() {
        this.frame++;

        // Player physics
        this.player.dy += this.player.gravity;
        this.player.y += this.player.dy;
        if (this.player.y > 250) {
            this.player.y = 250;
            this.player.dy = 0;
            this.player.isGrounded = true;
        }

        // Spawn obstacles
        if (this.frame % 100 === 0 || (this.frame > 500 && this.frame % 70 === 0)) {
            this.obstacles.push({ x: this.canvas.width, y: 250, w: 20, h: 30 + Math.random()*20, passed: false });
        }

        // Move obstacles
        this.obstacles.forEach(ob => {
            ob.x -= 6;
            if (!ob.passed && ob.x + ob.w < this.player.x) {
                ob.passed = true;
                this.score += 2;
                this.scoreEl.innerText = this.score;
            }
        });
        this.obstacles = this.obstacles.filter(ob => ob.x + ob.w > 0);

        // Collision
        for (let ob of this.obstacles) {
            if (this.player.x < ob.x + ob.w &&
                this.player.x + this.player.w > ob.x &&
                this.player.y < ob.y + ob.h &&
                this.player.y + this.player.h > ob.y) {
                this.gameOver();
            }
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Floor
        this.ctx.fillStyle = '#05d9e8';
        this.ctx.fillRect(0, 280, this.canvas.width, 2);

        // Player
        this.ctx.fillStyle = '#ff2a6d';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

        // Obstacles
        this.ctx.fillStyle = '#f1c40f';
        this.obstacles.forEach(ob => {
            this.ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        });
    },

    gameOver() {
        this.isPlaying = false;
        this.overlay.innerHTML = `<h3>遊戲結束<br>分數：${this.score}<br><br><span style="font-size:1rem">按 空白鍵 重新開始</span></h3>`;
        this.overlay.classList.remove('hidden');
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.hiScoreEl.innerText = this.hiScore;
        }
    }
};


// --- GAME 3: NEON BREAKOUT ---
const BreakoutGame = {
    canvas: document.getElementById('g3-canvas'),
    ctx: null,
    scoreEl: document.getElementById('g3-score'),
    hiScoreEl: document.getElementById('g3-highscore'),
    overlay: document.getElementById('g3-overlay'),
    
    paddle: { x: 260, y: 380, w: 80, h: 10, dx: 8 },
    ball: { x: 300, y: 370, r: 6, dx: 4, dy: -4 },
    bricks: [],
    brickInfo: { row: 4, col: 7, w: 70, h: 20, padding: 10, offsetX: 25, offsetY: 30 },
    keys: { left: false, right: false },
    score: 0,
    hiScore: 0,
    isPlaying: false,
    loopId: null,

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.reset();
        this.draw();
        this.overlay.classList.remove('hidden');

        window.onkeydown = (e) => {
            if (activeGameId !== '3') return;
            if (!this.isPlaying && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) this.start();
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
        };

        window.onkeyup = (e) => {
            if (activeGameId !== '3') return;
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
        };
    },

    reset() {
        this.paddle.x = (this.canvas.width - this.paddle.w) / 2;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.paddle.y - this.ball.r;
        this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -4;
        
        this.bricks = [];
        for(let r = 0; r < this.brickInfo.row; r++) {
            this.bricks[r] = [];
            for(let c = 0; c < this.brickInfo.col; c++) {
                this.bricks[r][c] = { x: 0, y: 0, status: 1 };
            }
        }
        
        this.score = 0;
        this.scoreEl.innerText = '0';
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
        this.keys.left = false;
        this.keys.right = false;
    },

    start() {
        this.reset();
        this.overlay.classList.add('hidden');
        this.isPlaying = true;
        this.loop();
    },

    stop() {
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
    },

    loop() {
        if (!this.isPlaying) return;
        this.loopId = requestAnimationFrame(() => this.loop());
        this.update();
        this.draw();
    },

    update() {
        // Move paddle
        if (this.keys.left && this.paddle.x > 0) this.paddle.x -= this.paddle.dx;
        if (this.keys.right && this.paddle.x + this.paddle.w < this.canvas.width) this.paddle.x += this.paddle.dx;

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collision
        if (this.ball.x + this.ball.dx > this.canvas.width - this.ball.r || this.ball.x + this.ball.dx < this.ball.r) {
            this.ball.dx = -this.ball.dx;
        }
        if (this.ball.y + this.ball.dy < this.ball.r) {
            this.ball.dy = -this.ball.dy;
        } else if (this.ball.y + this.ball.dy > this.canvas.height - this.ball.r) {
            this.gameOver();
        }

        // Paddle collision
        if (this.ball.x > this.paddle.x && this.ball.x < this.paddle.x + this.paddle.w &&
            this.ball.y + this.ball.r >= this.paddle.y) {
            this.ball.dy = -this.ball.dy;
            // Add some English based on where it hit
            let hitPoint = this.ball.x - (this.paddle.x + this.paddle.w/2);
            this.ball.dx = hitPoint * 0.15;
        }

        // Brick collision
        let bricksLeft = false;
        for(let r = 0; r < this.brickInfo.row; r++) {
            for(let c = 0; c < this.brickInfo.col; c++) {
                let b = this.bricks[r][c];
                if (b.status === 1) {
                    bricksLeft = true;
                    if (this.ball.x > b.x && this.ball.x < b.x + this.brickInfo.w &&
                        this.ball.y > b.y && this.ball.y < b.y + this.brickInfo.h) {
                        this.ball.dy = -this.ball.dy;
                        b.status = 0;
                        this.score += 10;
                        this.scoreEl.innerText = this.score;
                        if(typeof confetti === 'function' && Math.random() > 0.8) confetti({ particleCount: 10, spread: 30, origin: { x: b.x/this.canvas.width, y: b.y/this.canvas.height }});
                    }
                }
            }
        }
        
        if (!bricksLeft) this.win();
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bricks
        const colors = ['#ff2a6d', '#05d9e8', '#b026ff', '#f1c40f'];
        for(let r = 0; r < this.brickInfo.row; r++) {
            for(let c = 0; c < this.brickInfo.col; c++) {
                if (this.bricks[r][c].status === 1) {
                    let brickX = (c * (this.brickInfo.w + this.brickInfo.padding)) + this.brickInfo.offsetX;
                    let brickY = (r * (this.brickInfo.h + this.brickInfo.padding)) + this.brickInfo.offsetY;
                    this.bricks[r][c].x = brickX;
                    this.bricks[r][c].y = brickY;
                    this.ctx.fillStyle = colors[r % colors.length];
                    this.ctx.fillRect(brickX, brickY, this.brickInfo.w, this.brickInfo.h);
                }
            }
        }

        // Draw paddle
        this.ctx.fillStyle = '#05d9e8';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#05d9e8';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
        this.ctx.shadowBlur = 0;

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff2a6d';
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.shadowBlur = 0;
    },

    gameOver() {
        this.isPlaying = false;
        this.overlay.innerHTML = `<h3>遊戲結束<br>分數：${this.score}<br><br><span style="font-size:1rem">按 左右方向鍵 重新開始</span></h3>`;
        this.overlay.classList.remove('hidden');
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.hiScoreEl.innerText = this.hiScore;
        }
    },
    
    win() {
        this.isPlaying = false;
        this.overlay.innerHTML = `<h3>過關！<br>分數：${this.score}<br><br><span style="font-size:1rem">按 左右方向鍵 重新開始</span></h3>`;
        this.overlay.classList.remove('hidden');
        if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.hiScoreEl.innerText = this.hiScore;
        }
    }
};

// --- GAME 4: CYBER 2048 ---
const Game2048 = {
    gridEl: document.getElementById('g4-grid'),
    scoreEl: document.getElementById('g4-score'),
    overlay: document.getElementById('g4-overlay'),
    msgEl: document.getElementById('g4-msg'),
    board: [],
    score: 0,
    won: false,

    init() {
        this.board = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;
        this.won = false;
        this.scoreEl.innerText = '0';
        this.overlay.classList.add('hidden');
        
        this.addTile();
        this.addTile();
        this.render();

        // Remove old listeners to prevent duplicates
        window.removeEventListener('keydown', this.handleInput);
        window.addEventListener('keydown', this.handleInput.bind(this));
    },

    addTile() {
        let emptyCells = [];
        for (let r=0; r<4; r++) {
            for (let c=0; c<4; c++) {
                if (this.board[r][c] === 0) emptyCells.push({r, c});
            }
        }
        if (emptyCells.length > 0) {
            let rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
        }
    },

    render() {
        this.gridEl.innerHTML = '';
        for (let r=0; r<4; r++) {
            for (let c=0; c<4; c++) {
                // Background cell
                let cell = document.createElement('div');
                cell.className = 'tile-cell';
                this.gridEl.appendChild(cell);

                // Actual tile
                if (this.board[r][c] !== 0) {
                    let tile = document.createElement('div');
                    let val = this.board[r][c];
                    tile.className = `tile tile-${val}`;
                    tile.innerText = val;
                    // Position based on grid (70px width + 10px gap = 80px)
                    tile.style.top = `${r * 80 + 10}px`;
                    tile.style.left = `${c * 80 + 10}px`;
                    this.gridEl.appendChild(tile);
                }
            }
        }
    },

    handleInput(e) {
        if (activeGameId !== '4' || !e.key.startsWith('Arrow')) return;
        e.preventDefault();
        
        let moved = false;
        let oldBoard = JSON.stringify(this.board);

        if (e.key === 'ArrowLeft') moved = this.slideLeft();
        if (e.key === 'ArrowRight') moved = this.slideRight();
        if (e.key === 'ArrowUp') moved = this.slideUp();
        if (e.key === 'ArrowDown') moved = this.slideDown();

        if (JSON.stringify(this.board) !== oldBoard) {
            this.addTile();
            this.render();
            this.scoreEl.innerText = this.score;
            this.checkGameOver();
        }
    },

    slide(row) {
        let arr = row.filter(val => val);
        let missing = 4 - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    },

    combine(row) {
        for (let i = 0; i < 3; i++) {
            if (row[i] !== 0 && row[i] === row[i+1]) {
                row[i] *= 2;
                this.score += row[i];
                row[i+1] = 0;
                if (row[i] === 2048 && !this.won) {
                    this.won = true;
                    if(typeof confetti === 'function') confetti({ particleCount: 200, spread: 160 });
                }
            }
        }
        return row;
    },

    slideLeft() {
        for (let r=0; r<4; r++) {
            let row = this.board[r];
            row = this.slide(row);
            row = this.combine(row);
            row = this.slide(row);
            this.board[r] = row;
        }
    },
    slideRight() {
        for (let r=0; r<4; r++) {
            let row = this.board[r].slice().reverse();
            row = this.slide(row);
            row = this.combine(row);
            row = this.slide(row);
            this.board[r] = row.reverse();
        }
    },
    slideUp() {
        for (let c=0; c<4; c++) {
            let row = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]];
            row = this.slide(row);
            row = this.combine(row);
            row = this.slide(row);
            for (let r=0; r<4; r++) this.board[r][c] = row[r];
        }
    },
    slideDown() {
        for (let c=0; c<4; c++) {
            let row = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]].reverse();
            row = this.slide(row);
            row = this.combine(row);
            row = this.slide(row);
            row.reverse();
            for (let r=0; r<4; r++) this.board[r][c] = row[r];
        }
    },

    checkGameOver() {
        for(let r=0; r<4; r++){
            for(let c=0; c<4; c++){
                if(this.board[r][c] === 0) return;
                if(r < 3 && this.board[r][c] === this.board[r+1][c]) return;
                if(c < 3 && this.board[r][c] === this.board[r][c+1]) return;
            }
        }
        this.overlay.classList.remove('hidden');
    }
};

document.getElementById('g4-restart').onclick = () => Game2048.init();


// --- GAME 5: CYBER SNAKE ---
const SnakeGame = {
    canvas: document.getElementById('g5-canvas'),
    ctx: null,
    scoreEl: document.getElementById('g5-score'),
    hiScoreEl: document.getElementById('g5-highscore'),
    overlay: document.getElementById('g5-overlay'),
    gridSize: 20,
    tileCount: 25, // 500 / 20 = 25
    snake: [],
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    hiScore: 0,
    isPlaying: false,
    lastTickTime: 0,
    tickRate: 110, // ms per tick
    loopId: null,

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.reset();
        this.draw();
        this.overlay.innerHTML = `<h3>按 任意方向鍵 開始</h3>`;
        this.overlay.classList.remove('hidden');

        window.onkeydown = (e) => {
            if (activeGameId !== '5') return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                
                let newDir = { x: 0, y: 0 };
                if (e.key === 'ArrowUp') newDir = { x: 0, y: -1 };
                if (e.key === 'ArrowDown') newDir = { x: 0, y: 1 };
                if (e.key === 'ArrowLeft') newDir = { x: -1, y: 0 };
                if (e.key === 'ArrowRight') newDir = { x: 1, y: 0 };

                // Prevent turning directly back on oneself
                if (this.dir.x + newDir.x !== 0 || this.dir.y + newDir.y !== 0) {
                    this.nextDir = newDir;
                    if (!this.isPlaying) {
                        this.start();
                    }
                }
            }
        };
    },

    reset() {
        this.snake = [
            { x: 12, y: 12 },
            { x: 12, y: 13 },
            { x: 12, y: 14 }
        ];
        this.dir = { x: 0, y: -1 };
        this.nextDir = { x: 0, y: -1 };
        this.score = 0;
        this.scoreEl.innerText = '0';
        this.isPlaying = false;
        this.spawnFood();
        this.lastTickTime = 0;
        cancelAnimationFrame(this.loopId);
    },

    start() {
        this.reset();
        this.overlay.classList.add('hidden');
        this.isPlaying = true;
        this.loop(0);
    },

    stop() {
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
        window.onkeydown = null;
    },

    spawnFood() {
        let attempts = 0;
        while (attempts < 100) {
            let x = Math.floor(Math.random() * this.tileCount);
            let y = Math.floor(Math.random() * this.tileCount);
            // Make sure food is not spawned on snake
            if (!this.snake.some(segment => segment.x === x && segment.y === y)) {
                this.food = { x, y };
                return;
            }
            attempts++;
        }
        // Fallback
        this.food = { x: 5, y: 5 };
    },

    loop(timestamp) {
        if (!this.isPlaying) return;
        this.loopId = requestAnimationFrame((t) => this.loop(t));

        if (!this.lastTickTime) this.lastTickTime = timestamp;
        const elapsed = timestamp - this.lastTickTime;

        if (elapsed >= this.tickRate) {
            this.lastTickTime = timestamp;
            this.update();
            this.draw();
        }
    },

    update() {
        this.dir = this.nextDir;
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreEl.innerText = this.score;
            this.spawnFood();
            // speed ramp up slightly
            this.tickRate = Math.max(70, 110 - Math.floor(this.score / 50) * 5);
            if (typeof confetti === 'function') {
                confetti({ particleCount: 15, spread: 40, origin: { x: this.food.x / this.tileCount, y: this.food.y / this.tileCount } });
            }
        } else {
            // Remove tail
            this.snake.pop();
        }
    },

    draw() {
        this.ctx.fillStyle = '#090a0f'; // Matches body background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid Lines (subtle purple grid)
        this.ctx.strokeStyle = 'rgba(176, 38, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Food (neon cyan pulsing/glowing circle)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#05d9e8';
        this.ctx.fillStyle = '#05d9e8';
        this.ctx.beginPath();
        let r = this.gridSize / 2;
        this.ctx.arc(this.food.x * this.gridSize + r, this.food.y * this.gridSize + r, r - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Snake (neon purple glow)
        this.snake.forEach((segment, i) => {
            if (i === 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = '#b026ff';
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.fillStyle = '#b026ff';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#b026ff';
            }
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        this.ctx.shadowBlur = 0;
    },

    gameOver() {
        this.isPlaying = false;
        this.overlay.innerHTML = `<h3>遊戲結束<br>分數：${this.score}<br><br><span style="font-size:1rem">按 任意方向鍵 重新開始</span></h3>`;
        this.overlay.classList.remove('hidden');
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.hiScoreEl.innerText = this.hiScore;
        }
    }
};


// --- GAME 6: CYBER SHOOTER ---
const ShooterGame = {
    canvas: document.getElementById('g6-canvas'),
    ctx: null,
    scoreEl: document.getElementById('g6-score'),
    hiScoreEl: document.getElementById('g6-highscore'),
    overlay: document.getElementById('g6-overlay'),

    player: { x: 280, y: 440, w: 40, h: 25, speed: 7 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: { left: false, right: false, space: false },
    lastShotTime: 0,
    shotCooldown: 250, // ms between shots
    lives: 3,
    score: 0,
    hiScore: 0,
    isPlaying: false,
    loopId: null,
    frame: 0,
    spawnInterval: 80, // frames between spawns

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.reset();
        this.draw();
        this.overlay.innerHTML = `<h3>按 空白鍵 開始</h3>`;
        this.overlay.classList.remove('hidden');

        window.onkeydown = (e) => {
            if (activeGameId !== '6') return;
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.keys.left = true;
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.keys.right = true;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                this.keys.space = true;
                if (!this.isPlaying) {
                    this.start();
                }
            }
        };

        window.onkeyup = (e) => {
            if (activeGameId !== '6') return;
            if (e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'Space') this.keys.space = false;
        };
    },

    reset() {
        this.player.x = (this.canvas.width - this.player.w) / 2;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.lives = 3;
        this.score = 0;
        this.frame = 0;
        this.spawnInterval = 80;
        this.scoreEl.innerText = '0';
        this.isPlaying = false;
        this.keys.left = false;
        this.keys.right = false;
        this.keys.space = false;
        cancelAnimationFrame(this.loopId);
    },

    start() {
        this.reset();
        this.overlay.classList.add('hidden');
        this.isPlaying = true;
        this.loop();
    },

    stop() {
        this.isPlaying = false;
        cancelAnimationFrame(this.loopId);
        window.onkeydown = null;
        window.onkeyup = null;
    },

    loop() {
        if (!this.isPlaying) return;
        this.update();
        this.draw();
        this.loopId = requestAnimationFrame(() => this.loop());
    },

    spawnEnemy() {
        const size = 20 + Math.random() * 25;
        const x = Math.random() * (this.canvas.width - size);
        const y = -size;
        const speed = 1.5 + Math.random() * 2 + (this.score / 200);
        const color = ['#ff2a6d', '#f1c40f', '#e94560', '#ff5722'][Math.floor(Math.random() * 4)];
        const hp = size > 35 ? 2 : 1; // bigger ones take 2 hits
        this.enemies.push({ x, y, w: size, h: size, speed, color, hp, maxHp: hp });
    },

    spawnParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                r: 2 + Math.random() * 2,
                color,
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    },

    update() {
        this.frame++;

        // Spawn logic
        const currentInterval = Math.max(25, this.spawnInterval - Math.floor(this.score / 150) * 8);
        if (this.frame % currentInterval === 0) {
            this.spawnEnemy();
        }

        // Move player
        if (this.keys.left && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys.right && this.player.x + this.player.w < this.canvas.width) {
            this.player.x += this.player.speed;
        }

        // Shooting
        if (this.keys.space) {
            const now = Date.now();
            if (now - this.lastShotTime > this.shotCooldown) {
                // Shoot two parallel lasers
                this.bullets.push({
                    x: this.player.x + 5,
                    y: this.player.y,
                    w: 3,
                    h: 15,
                    dy: -8
                });
                this.bullets.push({
                    x: this.player.x + this.player.w - 8,
                    y: this.player.y,
                    w: 3,
                    h: 15,
                    dy: -8
                });
                this.lastShotTime = now;
            }
        }

        // Move bullets
        this.bullets.forEach(b => {
            b.y += b.dy;
        });
        this.bullets = this.bullets.filter(b => b.y + b.h > 0);

        // Move enemies
        this.enemies.forEach(e => {
            e.y += e.speed;
        });

        // Check enemy bottom boundaries
        this.enemies.forEach(e => {
            if (e.y > this.canvas.height) {
                this.lives--;
                this.spawnParticles(e.x + e.w/2, this.canvas.height - 10, '#ffffff', 15);
            }
        });
        this.enemies = this.enemies.filter(e => e.y <= this.canvas.height);

        // Particle updates
        this.particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life -= p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Bullet-Enemy Collisions
        for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = this.bullets[bIdx];
            for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
                const enemy = this.enemies[eIdx];

                if (b.x < enemy.x + enemy.w &&
                    b.x + b.w > enemy.x &&
                    b.y < enemy.y + enemy.h &&
                    b.y + b.h > enemy.y) {
                    
                    this.bullets.splice(bIdx, 1);
                    enemy.hp--;

                    this.spawnParticles(b.x, b.y, '#05d9e8', 5);

                    if (enemy.hp <= 0) {
                        this.enemies.splice(eIdx, 1);
                        this.score += enemy.maxHp * 10;
                        this.scoreEl.innerText = this.score;
                        this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, 15);
                        
                        if (typeof confetti === 'function' && Math.random() > 0.9) {
                            confetti({ particleCount: 20, spread: 50, origin: { x: enemy.x / this.canvas.width, y: enemy.y / this.canvas.height } });
                        }
                    }
                    break;
                }
            }
        }

        // Enemy-Player Collisions
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = this.enemies[eIdx];
            if (this.player.x < enemy.x + enemy.w &&
                this.player.x + this.player.w > enemy.x &&
                this.player.y < enemy.y + enemy.h &&
                this.player.y + this.player.h > enemy.y) {
                
                this.enemies.splice(eIdx, 1);
                this.lives--;
                this.spawnParticles(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#ff2a6d', 25);
            }
        }

        // Lives Check
        if (this.lives <= 0) {
            this.gameOver();
        }
    },

    draw() {
        this.ctx.fillStyle = '#090a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 20; i++) {
            const y = (this.frame * 0.5 + i * 40) % this.canvas.height;
            const x = (i * 37) % this.canvas.width;
            this.ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Draw Player
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#05d9e8';
        this.ctx.fillStyle = '#05d9e8';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.w / 2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.h);
        this.ctx.lineTo(this.player.x + this.player.w, this.player.y + this.player.h);
        this.ctx.closePath();
        this.ctx.fill();

        // Thruster flame
        if (this.frame % 4 < 2) {
            this.ctx.fillStyle = '#ff2a6d';
            this.ctx.shadowColor = '#ff2a6d';
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + this.player.w/2 - 4, this.player.y + this.player.h);
            this.ctx.lineTo(this.player.x + this.player.w/2, this.player.y + this.player.h + 8);
            this.ctx.lineTo(this.player.x + this.player.w/2 + 4, this.player.y + this.player.h);
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // Draw Bullets
        this.ctx.fillStyle = '#05d9e8';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#05d9e8';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.w, b.h);
        });
        this.ctx.shadowBlur = 0;

        // Draw Enemies
        this.enemies.forEach(e => {
            this.ctx.fillStyle = e.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = e.color;
            this.ctx.fillRect(e.x, e.y, e.w, e.h);

            if (e.maxHp > 1) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowBlur = 0;
                this.ctx.fillRect(e.x + 2, e.y + e.h - 5, (e.w - 4) * (e.hp / e.maxHp), 3);
            }
        });
        this.ctx.shadowBlur = 0;

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Draw Lives HUD
        this.ctx.fillStyle = '#ff2a6d';
        this.ctx.shadowColor = '#ff2a6d';
        this.ctx.shadowBlur = 8;
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.canvas.width - 25 - i * 22 + 7, 15);
                this.ctx.lineTo(this.canvas.width - 25 - i * 22, 27);
                this.ctx.lineTo(this.canvas.width - 25 - i * 22 + 14, 27);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        this.ctx.shadowBlur = 0;
    },

    gameOver() {
        this.isPlaying = false;
        this.overlay.innerHTML = `<h3>遊戲結束<br>分數：${this.score}<br><br><span style="font-size:1rem">按 空白鍵 重新開始</span></h3>`;
        this.overlay.classList.remove('hidden');
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.hiScoreEl.innerText = this.hiScore;
        }
    }
};
