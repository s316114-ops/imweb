// ==========================================
// Lab 5 - BTS Quiz JavaScript Logic
// ==========================================

// 1. 題目資料庫 (15題)
const quizQuestions = [
    {
        question: "BTS 團名「防彈少年團（방탄소년단）」最核心的含義是什麼？",
        options: {
            A: "守護世界和平",
            B: "阻擋像子彈般的偏見與批評",
            C: "象徵韓國傳統精神",
            D: "展現舞台爆發力"
        },
        answer: "B"
    },
    {
        question: "BTS 正式出道日期為何？",
        options: {
            A: "2012 年 6 月 13 日",
            B: "2013 年 6 月 13 日",
            C: "2013 年 7 月 9 日",
            D: "2014 年 6 月 13 日"
        },
        answer: "B"
    },
    {
        question: "下列哪位成員同時擔任 BTS 隊長與主要英文發言代表？",
        options: {
            A: "SUGA",
            B: "j-hope",
            C: "RM",
            D: "Jin"
        },
        answer: "C"
    },
    {
        question: "BTS 粉絲名稱「ARMY」與團體概念最相關的象徵是什麼？",
        options: {
            A: "軍隊守護防彈衣",
            B: "青春與夢想",
            C: "音樂與藝術",
            D: "世界巡演力量"
        },
        answer: "A"
    },
    {
        question: "下列哪首歌曲讓 BTS 首次獲得韓國音樂節目一位？",
        options: {
            A: "Dynamite",
            B: "Boy With Luv",
            C: "I NEED U",
            D: "FIRE"
        },
        answer: "C"
    },
    {
        question: "BTS 所屬公司最初名稱為何？",
        options: {
            A: "Cube Entertainment",
            B: "Big Hit Entertainment",
            C: "Starship Entertainment",
            D: "Pledis Entertainment"
        },
        answer: "B"
    },
    {
        question: "哪位成員曾以地下饒舌歌手「Gloss」活動？",
        options: {
            A: "RM",
            B: "V",
            C: "Jung Kook",
            D: "SUGA"
        },
        answer: "D"
    },
    {
        question: "下列哪首歌曲是 BTS 第一首 Billboard Hot 100 冠軍單曲？",
        options: {
            A: "Fake Love",
            B: "Butter",
            C: "Dynamite",
            D: "DNA"
        },
        answer: "C"
    },
    {
        question: "BTS 曾多次受邀於哪個國際組織發表演說？",
        options: {
            A: "世界衛生組織",
            B: "聯合國",
            C: "UNESCO",
            D: "世界銀行"
        },
        answer: "B"
    },
    {
        question: "BTS 官方應援棒名稱為何？",
        options: {
            A: "Purple Bomb",
            B: "ARMY Light",
            C: "ARMY Bomb",
            D: "BTS Wave"
        },
        answer: "C"
    },
    {
        question: "哪位成員被稱為 BTS 的「Worldwide Handsome」？",
        options: {
            A: "Jin",
            B: "Jimin",
            C: "V",
            D: "j-hope"
        },
        answer: "A"
    },
    {
        question: "下列哪一首歌曲主要以英文演唱？",
        options: {
            A: "Spring Day",
            B: "ON",
            C: "Butter",
            D: "Run"
        },
        answer: "C"
    },
    {
        question: "BTS 與粉絲之間常使用的代表色與象徵詞是什麼？",
        options: {
            A: "Blue Ocean",
            B: "Red Heart",
            C: "Purple／I Purple You",
            D: "Silver Moon"
        },
        answer: "C"
    },
    {
        question: "下列哪位成員以舞蹈實力與「舞蹈隊長」形象最廣為人知？",
        options: {
            A: "RM",
            B: "Jin",
            C: "j-hope",
            D: "SUGA"
        },
        answer: "C"
    },
    {
        question: "若想獲得 BTS 官方最新公告、直播與會員內容，最主要的平台是：",
        options: {
            A: "Discord",
            B: "Weverse",
            C: "Netflix",
            D: "Spotify"
        },
        answer: "B"
    }
];

// 2. 全域狀態
let currentQuestionIndex = 0;
let correctCount = 0;
let timer = null;
let timeLeft = 15; // 每題 15 秒
const totalQuestions = quizQuestions.length;
let reviewData = []; // 用於紀錄作答詳情

// 3. Web Audio API 音效合成器
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration, delay = 0) {
    const isMuted = !document.getElementById('sound-toggle').checked;
    if (isMuted) return;

    initAudio();
    
    setTimeout(() => {
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            // 漸弱效果
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    }, delay * 1000);
}

// 播放點擊音效
function playClickSound() {
    playTone(600, 'sine', 0.1);
}

// 播放答對音效 (輕快和弦)
function playCorrectSound() {
    playTone(523.25, 'triangle', 0.15); // C5
    playTone(659.25, 'triangle', 0.15, 0.08); // E5
    playTone(783.99, 'triangle', 0.25, 0.16); // G5
}

// 播放答錯音效 (低沉下墜音)
function playWrongSound() {
    initAudio();
    const isMuted = !document.getElementById('sound-toggle').checked;
    if (isMuted) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
}

// 播放勝利音效 (歡樂慶祝旋律)
function playVictorySound() {
    const tones = [
        { f: 523.25, d: 0.12, t: 0 },   // C5
        { f: 587.33, d: 0.12, t: 0.1 }, // D5
        { f: 659.25, d: 0.12, t: 0.2 }, // E5
        { f: 783.99, d: 0.2, t: 0.3 },  // G5
        { f: 659.25, d: 0.12, t: 0.45 },// E5
        { f: 783.99, d: 0.4, t: 0.55 }  // G5
    ];
    tones.forEach(tone => {
        playTone(tone.f, 'triangle', tone.d, tone.t);
    });
}

// 4. Canvas 星空粒子背景
function initParticleBackground() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 建立粒子
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.3 - 0.15;
            this.speedY = Math.random() * 0.3 - 0.15;
            // 紫色/粉色系或白色粒子
            const colorChoices = [
                'rgba(168, 127, 251, ',
                'rgba(255, 117, 216, ',
                'rgba(255, 255, 255, '
            ];
            this.colorBase = colorChoices[Math.floor(Math.random() * colorChoices.length)];
            this.alpha = Math.random() * 0.5 + 0.2;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
            this.direction = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // 飄出邊界重新定位
            if (this.x < 0 || this.x > canvas.width) this.x = Math.random() * canvas.width;
            if (this.y < 0 || this.y > canvas.height) this.y = Math.random() * canvas.height;

            // 呼吸發光效果
            this.alpha += this.fadeSpeed * this.direction;
            if (this.alpha >= 0.8 || this.alpha <= 0.1) {
                this.direction *= -1;
            }
        }

        draw() {
            ctx.fillStyle = this.colorBase + this.alpha + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 初始化 60 個粒子
    for (let i = 0; i < 60; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 畫一個微微的暗紫漸層底色加深層次
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(13, 6, 20, 0.9)');
        gradient.addColorStop(1, 'rgba(28, 10, 48, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// 5. Canvas 彩帶慶祝動畫
function triggerConfettiAnimation() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let confettiList = [];
    const colors = ['#a87ffb', '#ff75d8', '#00ffaa', '#feca57', '#ff477e', '#22a6b3'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    class Confetti {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = -10 - Math.random() * 20;
            this.size = Math.random() * 6 + 4;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 + 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 4 - 2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    // 產生 120 顆碎片
    for (let i = 0; i < 120; i++) {
        confettiList.push(new Confetti());
    }

    let animationFrame;
    function run() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let alive = false;
        confettiList.forEach(c => {
            c.update();
            c.draw();
            if (c.y < canvas.height + 20) {
                alive = true;
            }
        });

        if (alive) {
            animationFrame = requestAnimationFrame(run);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    run();

    // 3 秒後停止
    setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 4000);
}

// 6. 排行榜邏輯 (LocalStorage)
function getLeaderboard() {
    const list = localStorage.getItem('bts_quiz_leaderboard');
    return list ? JSON.parse(list) : [];
}

function saveToLeaderboard(name, score) {
    const leaderboard = getLeaderboard();
    leaderboard.push({ name, score, date: new Date().toLocaleDateString() });
    // 分數高到低，分數相同則新進者靠後
    leaderboard.sort((a, b) => b.score - a.score);
    // 只保留前 5 名
    const topFive = leaderboard.slice(0, 5);
    localStorage.setItem('bts_quiz_leaderboard', JSON.stringify(topFive));
}

function renderLeaderboard() {
    const listElement = document.getElementById('leaderboard-list');
    const leaderboard = getLeaderboard();
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = `<li style="justify-content: center; opacity: 0.6;">尚無挑戰資料，期待你成為第一位！</li>`;
        return;
    }

    listElement.innerHTML = leaderboard.map((player, idx) => {
        let medal = '';
        if (idx === 0) medal = '🥇 ';
        else if (idx === 1) medal = '🥈 ';
        else if (idx === 2) medal = '🥉 ';
        else medal = `${idx + 1}. `;

        return `
            <li>
                <span>${medal}${escapeHtml(player.name)}</span>
                <span>${player.score} 分</span>
            </li>
        `;
    }).join('');
}

// HTML 跳脫防禦
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// 7. 倒數計時器控制
function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    updateTimerUI();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

function updateTimerUI() {
    const fillCircle = document.getElementById('timer-fill');
    const textElement = document.getElementById('timer-text');
    
    textElement.textContent = timeLeft;

    // 計算虛線偏移量 2 * PI * r = 213.62
    const totalLength = 213.62;
    const offset = totalLength - (timeLeft / 15) * totalLength;
    fillCircle.style.strokeDashoffset = offset;

    // 倒數警告色 (3秒以下變紅)
    if (timeLeft <= 3) {
        fillCircle.classList.add('warning');
    } else {
        fillCircle.classList.remove('warning');
    }
}

// 8. 載入並渲染題目
function renderQuestion() {
    const qData = quizQuestions[currentQuestionIndex];
    
    // 更新進度與積分
    document.getElementById('current-question-num').textContent = currentQuestionIndex + 1;
    document.getElementById('running-score').textContent = Math.round((correctCount / totalQuestions) * 100);

    // 進度條
    const progressPercent = (currentQuestionIndex / totalQuestions) * 100;
    document.getElementById('progress-bar-fill').style.width = progressPercent + '%';

    // 題目文字
    document.getElementById('question-text').textContent = qData.question;

    // 選項按鈕
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(btn => {
        const optionKey = btn.dataset.option;
        // 重設按鈕狀態與樣式
        btn.disabled = false;
        btn.className = 'option-btn';
        
        // 選項內文字
        const textSpan = btn.querySelector('.opt-text');
        textSpan.textContent = qData.options[optionKey];
    });

    startTimer();
}

// 9. 處理使用者選擇答案
function selectOption(selectedKey) {
    stopTimer();
    const qData = quizQuestions[currentQuestionIndex];
    const correctKey = qData.answer;
    const isCorrect = selectedKey === correctKey;

    const btns = document.querySelectorAll('.option-btn');
    
    // 禁用所有按鈕並標記正確與錯誤選項
    btns.forEach(btn => {
        btn.disabled = true;
        const optionKey = btn.dataset.option;
        
        if (optionKey === correctKey) {
            btn.classList.add('correct');
        } else if (optionKey === selectedKey && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    // 紀錄作答細節以供結算複習
    reviewData.push({
        question: qData.question,
        options: qData.options,
        userAnswer: selectedKey,
        correctAnswer: correctKey,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        correctCount++;
        playCorrectSound();
    } else {
        playWrongSound();
    }

    // 延遲 1.2 秒切換下一題，讓使用者能看清反饋
    setTimeout(nextStep, 1200);
}

// 逾時未作答處理
function handleTimeout() {
    const qData = quizQuestions[currentQuestionIndex];
    const correctKey = qData.answer;

    const btns = document.querySelectorAll('.option-btn');
    
    // 標示正確答案，其餘變暗
    btns.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.option === correctKey) {
            btn.classList.add('correct');
        }
    });

    // 紀錄為未作答
    reviewData.push({
        question: qData.question,
        options: qData.options,
        userAnswer: null,
        correctAnswer: correctKey,
        isCorrect: false
    });

    playWrongSound();

    setTimeout(nextStep, 1500);
}

// 切換下一題或結算
function nextStep() {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
        renderQuestion();
    } else {
        // 更新進度條為 100%
        document.getElementById('progress-bar-fill').style.width = '100%';
        showResult();
    }
}

// 10. 顯示結算畫面
function showResult() {
    document.getElementById('quiz-view').classList.add('hidden');
    
    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    document.getElementById('final-score').textContent = finalScore;

    // 評價語與音效/動畫
    const evalElement = document.getElementById('evaluation-text');
    if (finalScore === 100) {
        evalElement.textContent = "阿米的神！滿分通關！💜";
        playVictorySound();
        triggerConfettiAnimation();
    } else if (finalScore >= 80) {
        evalElement.textContent = "太厲害了！你絕對是核心阿米！✨";
        playVictorySound();
        triggerConfettiAnimation();
    } else if (finalScore >= 60) {
        evalElement.textContent = "很棒的成績，對防彈相當熟悉喔！👍";
        playTone(660, 'triangle', 0.3); // 簡單反饋
    } else {
        evalElement.textContent = "再加把勁，防彈正在等你更了解他們！💪";
    }

    // 判斷是否擠進前五名排行榜
    const leaderboard = getLeaderboard();
    const isTopFive = leaderboard.length < 5 || finalScore > leaderboard[leaderboard.length - 1].score;

    if (isTopFive && finalScore > 0) {
        document.getElementById('save-score-section').classList.remove('hidden');
    } else {
        document.getElementById('save-score-section').classList.add('hidden');
    }

    // 渲染錯題與答題分析
    renderReview();

    // 顯示結算卡片
    document.getElementById('result-view').classList.remove('hidden');
    document.getElementById('result-view').classList.add('active');
}

// 渲染檢討區
function renderReview() {
    const listElement = document.getElementById('review-list');
    listElement.innerHTML = reviewData.map((data, idx) => {
        const statusClass = data.isCorrect ? 'is-correct' : 'is-incorrect';
        const userAnsText = data.userAnswer 
            ? `${data.userAnswer}. ${data.options[data.userAnswer]}` 
            : '未作答 (逾時)';
        const correctAnsText = `${data.correctAnswer}. ${data.options[data.correctAnswer]}`;
        
        const userAnsSpan = data.isCorrect 
            ? `<span class="correct-text">您的答案：${userAnsText}</span>` 
            : `<span class="wrong-text">您的答案：${userAnsText}</span>`;

        return `
            <div class="review-item ${statusClass}">
                <div class="review-q">${idx + 1}. ${data.question}</div>
                <div class="review-answers">
                    <div class="review-user-ans">${userAnsSpan}</div>
                    ${!data.isCorrect ? `<div class="review-correct-ans">正確答案：${correctAnsText}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 11. 留言板邏輯與預設資料
const defaultMessages = [
    { author: "RM (Namjoon)", text: "七個人在一起，就是防彈。💜 (Apobangpo)", time: "官方置頂", color: "color-purple", rotate: -1.5 },
    { author: "Jin", text: "我是 Worldwide Handsome 哦，大家加油！🌟", time: "官方置頂", color: "color-yellow", rotate: 2 },
    { author: "Jimin", text: "阿米們，想你們了，測驗要拿高分哦！🐥", time: "官方置頂", color: "color-pink", rotate: -2.5 },
    { author: "ARMY_Love", text: "防彈是我的光！阿米永遠支持防彈！✨", time: "剛剛", color: "color-cyan", rotate: 1 },
];

function getMessages() {
    const msgs = localStorage.getItem('bts_quiz_messages');
    if (!msgs) {
        localStorage.setItem('bts_quiz_messages', JSON.stringify(defaultMessages));
        return defaultMessages;
    }
    return JSON.parse(msgs);
}

function saveMessage(author, text) {
    const msgs = getMessages();
    const colors = ['color-purple', 'color-pink', 'color-cyan', 'color-yellow', 'color-red'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomRotate = (Math.random() * 5 - 2.5).toFixed(1);
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    msgs.unshift({
        author: author,
        text: text,
        time: timeStr,
        color: randomColor,
        rotate: parseFloat(randomRotate)
    });

    localStorage.setItem('bts_quiz_messages', JSON.stringify(msgs));
}

function renderMessages() {
    const wall = document.getElementById('message-wall');
    const msgs = getMessages();
    
    wall.innerHTML = msgs.map(msg => `
        <div class="message-card ${msg.color}" style="transform: rotate(${msg.rotate}deg);">
            <div class="message-author">
                <span>👤 ${escapeHtml(msg.author)}</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-text">${escapeHtml(msg.text)}</div>
        </div>
    `).join('');
}

// 12. 初始化與事件綁定
document.addEventListener('DOMContentLoaded', () => {
    // 初始化背景
    initParticleBackground();
    
    // 載入並渲染排行榜與留言牆
    renderLeaderboard();
    renderMessages();

    // 使用說明按鈕切換
    const instBtn = document.getElementById('instructions-btn');
    const instDropdown = document.getElementById('instructions-dropdown');
    const closeInstBtn = document.getElementById('close-instructions-btn');

    if (instBtn && instDropdown) {
        instBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            instDropdown.classList.toggle('hidden');
        });
    }

    if (closeInstBtn && instDropdown) {
        closeInstBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            instDropdown.classList.add('hidden');
        });
    }

    // 點擊外部關閉說明下拉選單
    document.addEventListener('click', (e) => {
        if (instDropdown && !instDropdown.classList.contains('hidden') && !instDropdown.contains(e.target) && e.target !== instBtn) {
            instDropdown.classList.add('hidden');
        }
    });

    // 監聽音效與一般按鈕點擊
    document.querySelectorAll('button, input[type="checkbox"]').forEach(el => {
        el.addEventListener('click', () => {
            if (el.id !== 'start-btn' && el.id !== 'instructions-btn') {
                playClickSound();
            }
        });
    });

    // 開始測驗
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            initAudio();
            playClickSound();
            const introPage = document.getElementById('intro-page');
            const quizView = document.getElementById('quiz-view');
            if (introPage) {
                introPage.classList.remove('active');
                introPage.classList.add('hidden');
            }
            if (quizView) {
                quizView.classList.remove('hidden');
                quizView.classList.add('active');
            }

            // 重設狀態
            currentQuestionIndex = 0;
            correctCount = 0;
            reviewData = [];
            
            renderQuestion();
        });
    }

    // 綁定選項按鈕
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectOption(btn.dataset.option);
        });
    });

    // 登錄成績
    const saveScoreForm = document.getElementById('save-score-form');
    if (saveScoreForm) {
        saveScoreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('player-name');
            const nickname = nameInput ? nameInput.value.trim() : '';
            const finalScore = Math.round((correctCount / totalQuestions) * 100);

            if (nickname) {
                saveToLeaderboard(nickname, finalScore);
                const saveScoreSection = document.getElementById('save-score-section');
                if (saveScoreSection) saveScoreSection.classList.add('hidden');
                if (nameInput) nameInput.value = '';
                renderLeaderboard();
            }
        });
    }

    // 發佈留言
    const msgForm = document.getElementById('message-form');
    if (msgForm) {
        msgForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const authorInput = document.getElementById('msg-author');
            const contentInput = document.getElementById('msg-content');
            
            const author = authorInput ? authorInput.value.trim() : '';
            const content = contentInput ? contentInput.value.trim() : '';
            
            if (author && content) {
                saveMessage(author, content);
                renderMessages();
                if (contentInput) contentInput.value = ''; // 清空內容以利持續留言
                playTone(587.33, 'sine', 0.12); // 發佈反饋音
            }
        });
    }

    // 再試一次 / 回首頁
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const resultView = document.getElementById('result-view');
            const quizView = document.getElementById('quiz-view');
            if (resultView) {
                resultView.classList.remove('active');
                resultView.classList.add('hidden');
            }
            if (quizView) {
                quizView.classList.remove('hidden');
                quizView.classList.add('active');
            }

            currentQuestionIndex = 0;
            correctCount = 0;
            reviewData = [];
            renderQuestion();
        });
    }

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const resultView = document.getElementById('result-view');
            const introPage = document.getElementById('intro-page');
            if (resultView) {
                resultView.classList.remove('active');
                resultView.classList.add('hidden');
            }
            if (introPage) {
                introPage.classList.remove('hidden');
                introPage.classList.add('active');
            }
            
            renderLeaderboard();
            renderMessages();
        });
    }
});
