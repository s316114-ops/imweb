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
