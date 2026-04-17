const songs = [
    {
        title: "Dynamite",
        artist: "BTS",
        url: "music/dynamite.mp3",
        options: ["Dynamite", "Butter", "Permission to Dance", "Life Goes On"]
    },
    {
        title: "Butter",
        artist: "BTS",
        url: "music/butter.mp3",
        options: ["Permission to Dance", "Butter", "Dynamite", "Stay Gold"]
    },
    {
        title: "Permission to Dance",
        artist: "BTS",
        url: "music/ptd.mp3",
        options: ["Boy With Luv", "Fake Love", "Permission to Dance", "IDOL"]
    },
    {
        title: "Boy With Luv",
        artist: "BTS",
        url: "music/boywithluv.mp3",
        options: ["Blood Sweat & Tears", "DNA", "Boy With Luv", "Fire"]
    },
    {
        title: "Fake Love",
        artist: "BTS",
        url: "music/fakelove.mp3",
        options: ["Spring Day", "Fake Love", "ON", "Black Swan"]
    }
];

let currentSongIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
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

function startGame() {
    currentSongIndex = 0;
    score = 0;
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
}

document.getElementById('restart-btn').addEventListener('click', startGame);

// Start on load
startGame();
