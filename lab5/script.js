// script.js for Lab 5 – BTS Interactive Quiz
// -------------------------------------------------
// This script drives the quiz UI defined in index.html.
// It loads a hard‑coded question bank (the full BTS JSON can be pasted
// into the `quizData` variable). The code handles the 15‑second circular
// timer, answer validation, score tracking, result view, confetti
// animation, and simple Web Audio synthesis for feedback sounds.

/* -------------------------------------------------
   1️⃣ QUESTION DATA
   ------------------------------------------------- */
// Paste the full JSON you provided into the `quizData` object.
// Only a subset is shown here for brevity – you can expand it later.
const quizData = {
  title: "BTS QUIZ",
  theme: "Purple BTS Theme",
  totalQuestions: 15,
  questions: [
    {
      id: 1,
      question: "BTS 團名「防彈少年團」最核心的含義是什麼？",
      options: {
        A: "守護世界和平",
        B: "阻擋像子彈般的偏見與批評",
        C: "象徵韓國傳統精神",
        D: "展現舞台爆發力"
      },
      answer: "B"
    },
    {
      id: 2,
      question: "BTS 正式出道日期為何？",
      options: {
        A: "2012 年 6 月 13 日",
        B: "2013 年 6 月 13 日",
        C: "2013 年 7 月 9 日",
        D: "2014 年 6 月 13 日"
      },
      answer: "B"
    },
    // ... (add remaining 13 questions here) ...
  ]
};

/* -------------------------------------------------
   2️⃣ GLOBAL STATE
   ------------------------------------------------- */
let currentIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15; // seconds per question

/* -------------------------------------------------
   3️⃣ AUDIO HELPERS
   ------------------------------------------------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(frequency, duration = 0.2, type = "sine") {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playCorrect() { // bright pentatonic chord
  [440, 554, 660].forEach((f, i) => playTone(f, 0.15 + i * 0.05, "triangle"));
}
function playWrong() { // low‑drone error tone
  playTone(150, 0.3, "sawtooth");
}
function playClick() { playTone(300, 0.07, "square"); }
function playVictory() { // short celebratory arpeggio
  [660, 784, 880].forEach((f, i) => playTone(f, 0.12 + i * 0.04, "triangle"));
}

/* -------------------------------------------------
   4️⃣ TIMER & UI HELPERS
   ------------------------------------------------- */
function updateTimerUI() {
  const timerFill = document.getElementById("timer-fill");
  const timerText = document.getElementById("timer-text");
  const percent = (timeLeft / 15) * 100;
  timerFill.style.strokeDasharray = `${percent} 100`;
  timerText.textContent = timeLeft;
}
function startTimer() {
  timeLeft = 15;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleAnswer(null); // timeout = wrong answer
    }
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
}

/* -------------------------------------------------
   5️⃣ RENDER QUESTION
   ------------------------------------------------- */
function renderQuestion() {
  const q = quizData.questions[currentIndex];
  document.getElementById("question-text").textContent = q.question;
  const container = document.querySelector(".options-container");
  container.innerHTML = "";
  for (const [optKey, optText] of Object.entries(q.options)) {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.dataset.option = optKey;
    btn.innerHTML = `<span class="opt-label">${optKey}</span> <span class="opt-text">${optText}</span>`;
    btn.addEventListener("click", () => handleAnswer(optKey));
    container.appendChild(btn);
  }
  document.getElementById("current-question-num").textContent = currentIndex + 1;
  document.getElementById("running-score").textContent = score;
  startTimer();
}

/* -------------------------------------------------
   6️⃣ ANSWER HANDLING
   ------------------------------------------------- */
function handleAnswer(selectedOption) {
  stopTimer();
  const q = quizData.questions[currentIndex];
  const isCorrect = selectedOption === q.answer;
  // UI feedback
  const btns = document.querySelectorAll(".option-btn");
  btns.forEach(b => {
    if (b.dataset.option === q.answer) {
      b.classList.add("correct");
    } else if (b.dataset.option === selectedOption) {
      b.classList.add("wrong");
    }
    b.disabled = true;
  });
  // Audio feedback
  if (isCorrect) {
    score += 5; // arbitrary points per correct answer
    playCorrect();
  } else {
    playWrong();
  }
  // Record for review later
  const reviewItem = document.createElement("div");
  reviewItem.className = "review-item";
  reviewItem.textContent = `${q.question} – 您選 ${selectedOption || "未作答"}, 正確答案 ${q.answer}`;
  document.getElementById("review-list").appendChild(reviewItem);

  // Move to next after short delay
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < quizData.totalQuestions) {
      renderQuestion();
    } else {
      showResult();
    }
  }, 1200);
}

/* -------------------------------------------------
   7️⃣ RESULT DISPLAY
   ------------------------------------------------- */
function showResult() {
  document.getElementById("quiz-view").classList.add("hidden");
  document.getElementById("result-view").classList.remove("hidden");
  const finalScore = Math.round((score / (quizData.totalQuestions * 5)) * 100);
  document.getElementById("final-score").textContent = finalScore;
  const evalText = document.getElementById("evaluation-text");
  if (finalScore >= 80) {
    evalText.textContent = "超棒！你是阿米中的精英！";
    triggerConfetti();
    playVictory();
    document.getElementById("save-score-section").classList.remove("hidden");
  } else if (finalScore >= 50) {
    evalText.textContent = "還不錯，繼續加油！";
  } else {
    evalText.textContent = "再挑戰一次吧！";
  }
}

/* -------------------------------------------------
   8️⃣ CONFETTI (Canvas) – simple particle burst
   ------------------------------------------------- */
function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  const confetti = [];
  const colors = ["#ff5e5e", "#ffcd5e", "#f4ff5e", "#5eff8d", "#5efff2", "#5e9cff", "#c15eff"];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // create particles
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: Math.random() * 6 + 4,
      d: Math.random() * 30 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }

  let animationFrame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r / 2, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      // update position
      p.tiltAngle += p.tiltAngleIncrement;
      p.tilt = Math.sin(p.tiltAngle) * 15;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.d);
      // recycle when out of view
      if (p.y > canvas.height) p.y = -10;
      if (p.x > canvas.width) p.x = 0;
    });
    animationFrame = requestAnimationFrame(draw);
  }
  draw();
  // stop after 5 seconds
  setTimeout(() => cancelAnimationFrame(animationFrame), 5000);
}

/* -------------------------------------------------
   9️⃣ LEADERBOARD (LocalStorage) – minimal stub
   ------------------------------------------------- */
function loadLeaderboard() {
  const data = JSON.parse(localStorage.getItem("bts_leaderboard") || "[]");
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  data.slice(0, 5).forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}%`;
    list.appendChild(li);
  });
}
function saveScore(name, scorePct) {
  const data = JSON.parse(localStorage.getItem("bts_leaderboard") || "[]");
  data.push({ name, score: scorePct });
  data.sort((a, b) => b.score - a.score);
  localStorage.setItem("bts_leaderboard", JSON.stringify(data));
}

/* -------------------------------------------------
   10️⃣ EVENT BINDINGS & INIT
   ------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Intro start button
  document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("intro-page").classList.remove("active");
    document.getElementById("quiz-view").classList.remove("hidden");
    renderQuestion();
  });

  // Restart & Menu buttons
  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
  document.getElementById("menu-btn").addEventListener("click", () => location.reload());

  // Save score form
  document.getElementById("save-score-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("player-name").value.trim();
    const finalPct = document.getElementById("final-score").textContent;
    if (name) {
      saveScore(name, finalPct);
      document.getElementById("save-score-section").classList.add("hidden");
      loadLeaderboard();
    }
  });

  // Load leaderboard on intro page
  loadLeaderboard();

  // Global click sound toggle
  const soundToggle = document.getElementById("sound-toggle");
  soundToggle.addEventListener("change", () => {
    if (soundToggle.checked) {
      // unlock AudioContext on user gesture
      if (audioCtx.state === "suspended") audioCtx.resume();
    }
  });

  // Add click sound to all buttons
  document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (soundToggle.checked) playClick();
    });
  });
});

// End of script.js
