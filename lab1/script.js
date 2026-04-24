const songs = [
    {
        title: "Dynamite",
        artist: "BTS",
        url: "songs/BTS (방탄소년단) 'Dynamite' Official MV.mp3",
        startTime: 44,
        options: ["Dynamite", "Butter", "Permission to Dance", "Life Goes On"]
    },
    {
        title: "Butter",
        artist: "BTS",
        url: "songs/[CHOREOGRAPHY] BTS (방탄소년단) 'Butter' Special Performance Video.mp3",
        startTime: 47,
        options: ["Permission to Dance", "Butter", "Dynamite", "Stay Gold"]
    },
    {
        title: "Permission to Dance",
        artist: "BTS",
        url: "songs/BTS (방탄소년단) 'Permission to Dance' Official MV.mp3",
        startTime: 65,
        options: ["Boy With Luv", "Fake Love", "Permission to Dance", "IDOL"]
    },
    {
        title: "Boy With Luv",
        artist: "BTS",
        url: "songs/BTS (방탄소년단) '작은 것들을 위한 시 (Boy With Luv) (feat. Halsey)' Official MV.mp3",
        startTime: 45,
        options: ["Blood Sweat & Tears", "DNA", "Boy With Luv", "Fire"]
    },
    {
        title: "Fake Love",
        artist: "BTS",
        url: "songs/BTS (방탄소년단) 'FAKE LOVE' Official MV.mp3",
        startTime: 62,
        options: ["Spring Day", "Fake Love", "ON", "Black Swan"]
    }
];

let currentSongIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let isPaused = false;
const audio = new Audio();

const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const timerBar = document.getElementById('timer-bar');
const songNumEl = document.getElementById('song-num');
const optionsContainer = document.getElementById('options');
const vinyl = document.getElementById('vinyl');
const feedbackEl = document.getElementById('feedback');
const finalScoreEl = document.getElementById('final-score');
const finalMessageEl = document.getElementById('final-message');
const pauseGameBtn = document.getElementById('pause-game-btn');

function startGame() {
    currentSongIndex = 0;
    score = 0;
    isPaused = false;
    if (pauseGameBtn) pauseGameBtn.innerText = "暫停";
    showQuestion();
    resultScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

function showQuestion() {
    const song = songs[currentSongIndex];
    songNumEl.innerText = `${currentSongIndex + 1} / 5`;
    scoreEl.innerText = score;
    feedbackEl.innerText = '';
    
    // Setup Audio
    audio.src = song.url;
    audio.currentTime = song.startTime || 0;
    audio.play();
    vinyl.classList.add('playing');

    // Setup Options
    optionsContainer.innerHTML = '';
    song.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => handleAnswer(option, btn);
        optionsContainer.appendChild(btn);
    });

    // Setup Timer
    resetTimer();
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    updateTimerUI();
    
    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerUI() {
    timerEl.innerText = timeLeft;
    const percentage = (timeLeft / 15) * 100;
    timerBar.style.width = `${percentage}%`;
}

function handleAnswer(choice, btn) {
    clearInterval(timerInterval);
    audio.pause();
    vinyl.classList.remove('playing');
    
    const song = songs[currentSongIndex];
    const isCorrect = choice === song.title;
    
    // Disable all buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
        score += 10;
        btn.classList.add('correct');
        feedbackEl.innerText = '答對了！ +10';
        feedbackEl.style.color = '#1dd1a1';
    } else {
        score -= 5;
        btn.classList.add('wrong');
        feedbackEl.innerText = `答錯了！ -5 (正確答案: ${song.title})`;
        feedbackEl.style.color = '#ff6b6b';
    }

    scoreEl.innerText = score;

    setTimeout(() => {
        nextQuestion();
    }, 2000);
}

function handleTimeOut() {
    audio.pause();
    vinyl.classList.remove('playing');
    feedbackEl.innerText = `時間到！下一題 (正確答案: ${songs[currentSongIndex].title})`;
    feedbackEl.style.color = '#ff6b6b';

    setTimeout(() => {
        nextQuestion();
    }, 2000);
}

function nextQuestion() {
    currentSongIndex++;
    if (currentSongIndex < songs.length) {
        showQuestion();
    } else {
        endGame();
    }
}

function endGame() {
    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    finalScoreEl.innerText = score;

    if (score < 0) {
        finalMessageEl.innerText = "下次繼續加油！不要氣餒 💪";
        finalMessageEl.style.color = "#ff6b6b";
    } else if (score === 50) {
        finalMessageEl.innerText = "太神啦！很棒！滿分過關 🎉";
        finalMessageEl.style.color = "#1dd1a1";
    } else {
        finalMessageEl.innerText = "表現不錯喔！繼續保持 😉";
        finalMessageEl.style.color = "white";
    }
}

document.getElementById('restart-btn').addEventListener('click', startGame);

document.getElementById('in-game-restart-btn').addEventListener('click', () => {
    audio.pause();
    clearInterval(timerInterval);
    startGame();
});

if (pauseGameBtn) {
    pauseGameBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            audio.pause();
            vinyl.classList.remove('playing');
            pauseGameBtn.innerText = "繼續";
        } else {
            audio.play();
            vinyl.classList.add('playing');
            pauseGameBtn.innerText = "暫停";
        }
    });
}

document.getElementById('cancel-game-btn').addEventListener('click', () => {
    audio.pause();
    clearInterval(timerInterval);
    window.location.href = '../index.html';
});

// Start on load
startGame();
