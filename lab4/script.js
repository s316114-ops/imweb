// --- DOM Elements ---
const boardArea = document.getElementById('board-area');
const addNoteBtn = document.getElementById('add-note-btn');
const noteModal = document.getElementById('note-modal');
const noteForm = document.getElementById('note-form');
const modalTitle = document.getElementById('modal-title');
const noteText = document.getElementById('note-text');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const searchInput = document.getElementById('search-input');
const colorFilters = document.querySelectorAll('.filter-dot');

// Camera Elements
const bgVideo = document.getElementById('bg-video');
const cameraScanlines = document.querySelector('.camera-scanlines');
const toggleBgCamBtn = document.getElementById('toggle-bg-cam-btn');
const bgFilterWrapper = document.getElementById('bg-filter-wrapper');
const bgCameraFilterSelect = document.getElementById('bg-camera-filter-select');

const modalVideo = document.getElementById('modal-video');
const snapshotPreviewContainer = document.getElementById('snapshot-preview-container');
const snapshotPreview = document.getElementById('snapshot-preview');
const startModalCamBtn = document.getElementById('start-modal-cam-btn');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');

// --- State Variables ---
let notes = [];
let highestZ = 10;
let dragNote = null;
let dragOffset = { x: 0, y: 0 };
let editingNoteId = null;
let activeColorFilter = 'all';

// Camera streams
let cameraStream = null;
let isBgCamActive = false;
let isModalCamActive = false;
let capturedImgDataUrl = null; // Stored temp photo URL

// Dashboard & Gesture States
let visitorCount = 0;
let currentWeather = 'clear';
let prevFrameData = null;
let gestureCooldown = false;

// --- Color Configurations ---
const colors = {
    pink: '#ff2a6d',
    cyan: '#05d9e8',
    purple: '#b026ff',
    yellow: '#f1c40f',
    orange: '#ff5722'
};

// --- Particle System for Delete & Weather Effect ---
const ParticleSystem = {
    canvas: document.getElementById('particle-canvas'),
    ctx: null,
    particles: [],
    weatherParticles: [],

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop(); // Start continuous loop
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    spawn(rect, colorHex) {
        const count = 45;
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        for (let i = 0; i < count; i++) {
            const x = rect.left + scrollX + Math.random() * rect.width;
            const y = rect.top + scrollY + Math.random() * rect.height;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 5.5;
            this.particles.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed - 1,
                size: 2 + Math.random() * 3,
                color: colorHex,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.02
            });
        }
    },

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Spawn weather particles
        if (currentWeather === 'rain') {
            for (let i = 0; i < 2; i++) {
                this.weatherParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: -10,
                    dy: 8 + Math.random() * 6,
                    dx: -1 - Math.random() * 2,
                    length: 12 + Math.random() * 10,
                    width: 1.5 + Math.random() * 1,
                    color: '#05d9e8',
                    alpha: 0.4 + Math.random() * 0.4
                });
            }
        } else if (currentWeather === 'storm') {
            for (let i = 0; i < 3; i++) {
                this.weatherParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    dy: (Math.random() - 0.5) * 4,
                    dx: 4 + Math.random() * 6,
                    size: 2 + Math.random() * 4,
                    color: Math.random() > 0.5 ? '#ff2a6d' : '#f1c40f',
                    alpha: 0.7 + Math.random() * 0.3,
                    decay: 0.01 + Math.random() * 0.02
                });
            }
        } else {
            if (Math.random() < 0.08) {
                this.weatherParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: this.canvas.height + 10,
                    dy: -0.5 - Math.random() * 1,
                    dx: (Math.random() - 0.5) * 0.5,
                    size: 1 + Math.random() * 2.5,
                    color: '#ffffff',
                    alpha: 0.1 + Math.random() * 0.3,
                    decay: 0.002 + Math.random() * 0.002
                });
            }
        }

        // Draw delete particles
        this.particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= p.decay;

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        this.particles = this.particles.filter(p => p.alpha > 0);

        // Draw weather particles
        this.weatherParticles.forEach(wp => {
            if (currentWeather === 'rain') {
                wp.x += wp.dx;
                wp.y += wp.dy;
                this.ctx.save();
                this.ctx.globalAlpha = wp.alpha;
                this.ctx.strokeStyle = wp.color;
                this.ctx.lineWidth = wp.width;
                this.ctx.beginPath();
                this.ctx.moveTo(wp.x, wp.y);
                this.ctx.lineTo(wp.x + wp.dx * 0.5, wp.y + wp.length);
                this.ctx.stroke();
                this.ctx.restore();
            } else if (currentWeather === 'storm') {
                wp.x += wp.dx;
                wp.y += wp.dy;
                wp.alpha -= (wp.decay || 0.02);
                
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, wp.alpha);
                this.ctx.fillStyle = wp.color;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = wp.color;
                this.ctx.beginPath();
                this.ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else {
                wp.x += wp.dx;
                wp.y += wp.dy;
                wp.alpha -= (wp.decay || 0.002);
                
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, wp.alpha);
                this.ctx.fillStyle = wp.color;
                this.ctx.beginPath();
                this.ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
        
        this.weatherParticles = this.weatherParticles.filter(wp => {
            if (currentWeather === 'rain') {
                return wp.y < this.canvas.height && wp.x > 0 && wp.x < this.canvas.width;
            } else {
                return wp.alpha > 0 && wp.y > -20 && wp.y < this.canvas.height + 20 && wp.x > -20 && wp.x < this.canvas.width + 20;
            }
        });

        requestAnimationFrame(() => this.loop());
    }
};

// --- Camera Stream Manager ---
async function requestCameraStream() {
    if (cameraStream) return cameraStream;
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: false
        });
        return cameraStream;
    } catch (err) {
        console.error('無法取得相機授權:', err);
        alert('無法存取相機，請確認已授予相機使用權限。');
        return null;
    }
}

function releaseCameraStream() {
    // If neither background nor modal camera is using it, release it
    if (!isBgCamActive && !isModalCamActive && cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        
        bgVideo.srcObject = null;
        bgVideo.classList.remove('active');
        cameraScanlines.classList.remove('active');
        
        modalVideo.srcObject = null;
        modalVideo.classList.add('hidden');
        
        // Hide sensor ring
        document.getElementById('sensor-ring').classList.add('hidden');
    }
}

// --- Background Camera Toggle ---
async function toggleBgCamera() {
    if (isBgCamActive) {
        isBgCamActive = false;
        toggleBgCamBtn.innerText = '開啟背景鏡頭';
        toggleBgCamBtn.classList.remove('active');
        bgFilterWrapper.classList.add('hidden');
        document.getElementById('sensor-ring').classList.add('hidden');
        prevFrameData = null;
        releaseCameraStream();
    } else {
        const stream = await requestCameraStream();
        if (stream) {
            isBgCamActive = true;
            bgVideo.srcObject = stream;
            bgVideo.classList.add('active');
            cameraScanlines.classList.add('active');
            toggleBgCamBtn.innerText = '關閉背景鏡頭';
            toggleBgCamBtn.classList.add('active');
            bgFilterWrapper.classList.remove('hidden');
            applyBgFilter();
            
            // Show sensor ring and start motion detection
            document.getElementById('sensor-ring').classList.remove('hidden');
            updateMotionDetection();
        }
    }
}

function applyBgFilter() {
    const filter = bgCameraFilterSelect.value;
    // Clear previous filter classes
    bgVideo.className = 'active';
    if (filter !== 'none') {
        bgVideo.classList.add(`filter-${filter}`);
    }
}

toggleBgCamBtn.addEventListener('click', toggleBgCamera);
bgCameraFilterSelect.addEventListener('change', applyBgFilter);

// --- Modal Camera Capture System ---
async function startModalCamera() {
    const stream = await requestCameraStream();
    if (stream) {
        isModalCamActive = true;
        modalVideo.srcObject = stream;
        modalVideo.classList.remove('hidden');
        startModalCamBtn.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        retakeBtn.classList.add('hidden');
        snapshotPreviewContainer.classList.add('hidden');
        capturedImgDataUrl = null;
    }
}

function stopModalCameraOnly() {
    isModalCamActive = false;
    modalVideo.srcObject = null;
    modalVideo.classList.add('hidden');
    releaseCameraStream(); // check if we can free the whole device stream
}

function captureSnapshot() {
    if (!modalVideo.srcObject) return;

    const width = 240;
    const height = 180;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw the current video frame on canvas (mirrored for front camera natural feel)
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(modalVideo, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale

    // Apply color tint filter depending on the selected note color
    const selectedColor = document.querySelector('input[name="note-color"]:checked').value;
    tintImageOnCanvas(ctx, width, height, selectedColor);

    // Compress to 0.5 quality JPEG to stay light in localStorage
    capturedImgDataUrl = canvas.toDataURL('image/jpeg', 0.5);
    
    snapshotPreview.src = capturedImgDataUrl;
    snapshotPreviewContainer.classList.remove('hidden');
    
    // UI toggle
    stopModalCameraOnly();
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    startModalCamBtn.classList.add('hidden');
}

function tintImageOnCanvas(ctx, width, height, colorType) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = colors[colorType] || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#090a0f'; // Dark base
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

function clearSnapshot() {
    capturedImgDataUrl = null;
    snapshotPreview.src = '';
    snapshotPreviewContainer.classList.add('hidden');
    retakeBtn.classList.add('hidden');
    startModalCamBtn.classList.remove('hidden');
    captureBtn.classList.add('hidden');
    modalVideo.classList.add('hidden');
}

startModalCamBtn.addEventListener('click', startModalCamera);
captureBtn.addEventListener('click', captureSnapshot);
retakeBtn.addEventListener('click', () => {
    clearSnapshot();
    startModalCamera();
});

// Update snapshot color tint dynamically if user changes color selection while a photo exists
document.querySelectorAll('input[name="note-color"]').forEach(radio => {
    radio.addEventListener('change', () => {
        // If we have a snapshot preview active, re-render it with the new color tint!
        if (capturedImgDataUrl && modalVideo.classList.contains('hidden')) {
            reapplyTintToPreview(radio.value);
        }
    });
});

function reapplyTintToPreview(colorType) {
    // Re-draw preview image on canvas and re-tint
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 240, 180);
        tintImageOnCanvas(ctx, 240, 180, colorType);
        capturedImgDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        snapshotPreview.src = capturedImgDataUrl;
    };
    img.src = snapshotPreview.src;
}

// --- Note Database & Initialization ---
const defaultNotes = [
    {
        id: 'default-1',
        text: '歡迎來到賽博互動看板！\n這是一個極富未來感的智慧資訊牆 🔮\n\n點擊上方「開啟背景鏡頭」進入 AR 模式，對準右上角揮手可以觸發科技感應特效！',
        emoji: '📌',
        color: 'cyan',
        x: 100,
        y: 120,
        rotate: -3,
        zIndex: 1,
        image: null,
        likes: 8,
        comments: ['真的好酷！', '揮手感應好神奇']
    },
    {
        id: 'default-2',
        text: '【社群互動功能】\n現在可以給便利貼點擊 ❤️ 發送霓虹愛心，或點擊 💬 展開留言板進行回覆！右側統計儀表板會即時統計數值喔！',
        emoji: '💡',
        color: 'purple',
        x: 450,
        y: 80,
        rotate: 4,
        zIndex: 2,
        image: null,
        likes: 12,
        comments: ['愛心特效很漂亮', '留言點讚完美運作']
    },
    {
        id: 'default-3',
        text: '【即時科技工具】\n右側儀表板提供數位時鐘與氣象監測。點擊氣象按鈕切換不同天氣（晴天/霓虹雨/離子暴）會即時改變背景粒子特效！',
        emoji: '🚀',
        color: 'pink',
        x: 250,
        y: 350,
        rotate: -2,
        zIndex: 3,
        image: null,
        likes: 5,
        comments: ['切換離子暴很有震撼力']
    }
];

function init() {
    ParticleSystem.init();
    
    // Visitor Count logic
    let savedVisitor = localStorage.getItem('cyber_visitor_count');
    if (savedVisitor) {
        visitorCount = parseInt(savedVisitor) + 1;
    } else {
        visitorCount = 100 + Math.floor(Math.random() * 50);
    }
    localStorage.setItem('cyber_visitor_count', visitorCount);

    // Load notes from localStorage
    const saved = localStorage.getItem('cyber_notes');
    if (saved) {
        notes = JSON.parse(saved);
        notes.forEach(n => {
            if (n.zIndex > highestZ) highestZ = n.zIndex;
            if (n.likes === undefined) n.likes = 0;
            if (n.comments === undefined) n.comments = [];
        });
    } else {
        notes = [...defaultNotes];
        saveToStorage();
    }
    
    // Marquee initialization
    const marqueeTextEl = document.getElementById('marquee-text');
    const savedMarquee = localStorage.getItem('cyber_marquee_text');
    if (savedMarquee && marqueeTextEl) {
        marqueeTextEl.innerText = savedMarquee;
    }
    const editMarqueeBtn = document.getElementById('edit-marquee-btn');
    if (editMarqueeBtn) {
        editMarqueeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            SoundSynth.play('click');
            const currentText = marqueeTextEl.innerText;
            const newText = prompt('請輸入新的跑馬燈公告內容：', currentText);
            if (newText !== null && newText.trim() !== '') {
                marqueeTextEl.innerText = newText.trim();
                localStorage.setItem('cyber_marquee_text', newText.trim());
            }
        });
    }

    // Widgets initialization (sidebar, clock, weather)
    updateClock();
    setInterval(updateClock, 1000);

    const toggleWidgetsBtn = document.getElementById('toggle-widgets-btn');
    const widgetsPanel = document.getElementById('widgets-panel');
    if (toggleWidgetsBtn && widgetsPanel) {
        toggleWidgetsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            SoundSynth.play('click');
            widgetsPanel.classList.toggle('collapsed');
        });
    }

    const weatherBtns = document.querySelectorAll('.weather-opt-btn');
    const weatherStatusEl = document.getElementById('current-weather-status');
    const tempEl = document.getElementById('current-temp');
    const weatherData = {
        clear: { text: '晴天 (Clear)', temp: '28°C' },
        rain: { text: '霓虹雨 (Neon Rain)', temp: '21°C' },
        storm: { text: '磁暴 (Mag Storm)', temp: '35°C' }
    };
    weatherBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            SoundSynth.play('click');
            weatherBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.weather;
            currentWeather = type;
            weatherStatusEl.innerText = weatherData[type].text;
            tempEl.innerText = weatherData[type].temp;
            if (type === 'storm') {
                SoundSynth.play('wave');
            }
        });
    });

    // Hook sensor ring mouse click/mouseenter for simulation
    const sensorRing = document.getElementById('sensor-ring');
    if (sensorRing) {
        sensorRing.addEventListener('mouseenter', () => {
            if (!gestureCooldown && isBgCamActive) {
                triggerGestureAction();
            }
        });
        sensorRing.addEventListener('click', () => {
            if (!gestureCooldown) {
                triggerGestureAction();
            }
        });
    }

    // Sound synth lazy init on click anywhere
    document.addEventListener('click', () => {
        SoundSynth.init();
    }, { once: true });

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    // Stop camera when returning to main index
    document.querySelector('.back-btn').addEventListener('click', () => {
        isBgCamActive = false;
        isModalCamActive = false;
        releaseCameraStream();
    });

    renderBoard();
    updateStats();
}

function saveToStorage() {
    localStorage.setItem('cyber_notes', JSON.stringify(notes));
}

// --- Render Logic ---
function renderBoard() {
    const noteElements = boardArea.querySelectorAll('.sticky-note');
    noteElements.forEach(el => el.remove());

    notes.forEach(note => {
        const el = createNoteElement(note);
        boardArea.appendChild(el);
    });

    applyFilters();
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = `sticky-note note-${note.color}`;
    div.id = `note-${note.id}`;
    div.style.left = `${note.x}px`;
    div.style.top = `${note.y}px`;
    div.style.transform = `rotate(${note.rotate}deg)`;
    div.style.zIndex = note.zIndex;

    // Attach captured snapshot image if it exists
    if (note.image) {
        div.classList.add('has-photo');
        div.style.backgroundImage = `url(${note.image})`;
    }

    // Default values if undefined
    if (note.likes === undefined) note.likes = 0;
    if (note.comments === undefined) note.comments = [];

    // Make comments list HTML
    let commentsListHTML = '';
    note.comments.forEach(comment => {
        commentsListHTML += `<div class="note-comment-item">${escapeHTML(comment)}</div>`;
    });

    div.innerHTML = `
        <div class="note-header">
            <span class="note-emoji">${note.emoji}</span>
            <button class="note-delete-btn" title="刪除貼紙">&times;</button>
        </div>
        <div class="note-content">${escapeHTML(note.text).replace(/\n/g, '<br>')}</div>
        
        <!-- Note interaction footer -->
        <div class="note-footer-row">
            <button class="note-like-btn" title="給個愛心">❤️ <span class="like-count">${note.likes}</span></button>
            <button class="note-comment-toggle" title="展開留言">💬 <span class="comment-count">${note.comments.length}</span></button>
        </div>
        
        <!-- Comments Panel (hidden by default) -->
        <div class="note-comments-section hidden">
            <div class="note-comments-list">${commentsListHTML}</div>
            <input type="text" class="note-comment-input" placeholder="回覆留言... 按 Enter">
        </div>
    `;

    // Pointer events for dragging
    div.addEventListener('pointerdown', (e) => {
        // Don't drag if clicking buttons or input
        if (e.target.closest('.note-delete-btn') || 
            e.target.closest('.note-footer-row') || 
            e.target.closest('.note-comments-section')) {
            return;
        }
        handlePointerDown(e, note, div);
    });
    
    div.addEventListener('dblclick', (e) => {
        if (e.target.closest('.note-footer-row') || e.target.closest('.note-comments-section') || e.target.closest('.note-delete-btn')) {
            return;
        }
        openEditModal(note);
    });

    const deleteBtn = div.querySelector('.note-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundSynth.play('delete');
        deleteNote(note.id, div);
    });

    // Like Button Event
    const likeBtn = div.querySelector('.note-like-btn');
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        note.likes++;
        div.querySelector('.like-count').innerText = note.likes;
        saveToStorage();
        updateStats();
        
        // Spawn floating hearts
        spawnFloatingHearts(e.clientX, e.clientY);
        SoundSynth.play('like');
    });

    // Comment Toggle Event
    const commentToggleBtn = div.querySelector('.note-comment-toggle');
    const commentsSection = div.querySelector('.note-comments-section');
    commentToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundSynth.play('click');
        commentsSection.classList.toggle('hidden');
    });

    // Comment Input Enter Event
    const commentInput = div.querySelector('.note-comment-input');
    commentInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            const val = commentInput.value.trim();
            if (val) {
                note.comments.push(val);
                
                // Add to list UI
                const list = div.querySelector('.note-comments-list');
                const item = document.createElement('div');
                item.className = 'note-comment-item';
                item.innerText = val;
                list.appendChild(item);
                
                // Scroll to bottom
                list.scrollTop = list.scrollHeight;
                
                // Reset input
                commentInput.value = '';
                
                // Update count
                div.querySelector('.comment-count').innerText = note.comments.length;
                
                saveToStorage();
                SoundSynth.play('click');
            }
        }
    });

    return div;
}

// --- Drag & Drop Event Handlers ---
function handlePointerDown(e, note, element) {
    if (e.target.closest('.note-delete-btn') || 
        e.target.closest('.note-footer-row') || 
        e.target.closest('.note-comments-section')) {
        return;
    }

    dragNote = { note, element };
    
    highestZ += 1;
    note.zIndex = highestZ;
    element.style.zIndex = highestZ;
    saveToStorage();

    const rect = element.getBoundingClientRect();
    const boardRect = boardArea.getBoundingClientRect();
    
    const mouseXOnBoard = e.clientX - boardRect.left;
    const mouseYOnBoard = e.clientY - boardRect.top;

    dragOffset.x = mouseXOnBoard - note.x;
    dragOffset.y = mouseYOnBoard - note.y;

    element.classList.add('dragging');
    element.setPointerCapture(e.pointerId);
}

function handlePointerMove(e) {
    if (!dragNote) return;

    const boardRect = boardArea.getBoundingClientRect();
    const noteRect = dragNote.element.getBoundingClientRect();

    const mouseXOnBoard = e.clientX - boardRect.left;
    const mouseYOnBoard = e.clientY - boardRect.top;

    let newX = mouseXOnBoard - dragOffset.x;
    let newY = mouseYOnBoard - dragOffset.y;

    if (newX < 10) newX = 10;
    if (newX + noteRect.width > boardRect.width - 10) newX = boardRect.width - noteRect.width - 10;
    
    if (newY < 10) newY = 10;
    if (newY + noteRect.height > boardRect.height - 10) newY = boardRect.height - noteRect.height - 10;

    dragNote.note.x = newX;
    dragNote.note.y = newY;

    dragNote.element.style.left = `${newX}px`;
    dragNote.element.style.top = `${newY}px`;
}

function handlePointerUp(e) {
    if (!dragNote) return;

    dragNote.element.releasePointerCapture(e.pointerId);
    dragNote.element.classList.remove('dragging');
    dragNote.element.style.transform = `rotate(${dragNote.note.rotate}deg)`;
    dragNote = null;
    saveToStorage();
}

// --- CRUD Actions ---
function deleteNote(id, element) {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    const note = notes[idx];
    const colorHex = colors[note.color] || '#ffffff';
    const rect = element.getBoundingClientRect();

    ParticleSystem.spawn(rect, colorHex);

    element.style.opacity = '0';
    element.style.transform = 'scale(0.3) rotate(15deg)';
    element.style.pointerEvents = 'none';

    setTimeout(() => {
        notes.splice(idx, 1);
        element.remove();
        saveToStorage();
    }, 300);
}

function openEditModal(note) {
    editingNoteId = note.id;
    modalTitle.innerText = '編輯霓虹貼紙';
    noteText.value = note.text;
    
    document.querySelector(`input[name="note-emoji"][value="${note.emoji}"]`).checked = true;
    document.querySelector(`input[name="note-color"][value="${note.color}"]`).checked = true;
    
    clearSnapshot();
    
    if (note.image) {
        capturedImgDataUrl = note.image;
        snapshotPreview.src = note.image;
        snapshotPreviewContainer.classList.remove('hidden');
        retakeBtn.classList.remove('hidden');
        startModalCamBtn.classList.add('hidden');
    }
    
    noteModal.classList.remove('hidden');
    noteText.focus();
}

function openCreateModal() {
    editingNoteId = null;
    modalTitle.innerText = '新增霓虹貼紙';
    noteText.value = '';
    
    document.querySelector('input[name="note-emoji"][value="📌"]').checked = true;
    document.querySelector('input[name="note-color"][value="pink"]').checked = true;
    
    clearSnapshot();
    
    noteModal.classList.remove('hidden');
    noteText.focus();
}

function closeNoteModal() {
    stopModalCameraOnly();
    noteModal.classList.add('hidden');
    editingNoteId = null;
}

// --- Form Submit ---
noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = noteText.value.trim();
    if (!text) return;

    SoundSynth.play('click');

    const selectedEmoji = document.querySelector('input[name="note-emoji"]:checked').value;
    const selectedColor = document.querySelector('input[name="note-color"]:checked').value;

    if (editingNoteId) {
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
            note.text = text;
            note.emoji = selectedEmoji;
            note.color = selectedColor;
            note.image = capturedImgDataUrl;
        }
    } else {
        const boardRect = boardArea.getBoundingClientRect();
        const randomX = Math.max(30, Math.floor(boardRect.width / 2 - 110 + (Math.random() - 0.5) * 200));
        const randomY = Math.max(30, Math.floor(boardRect.height / 2 - 80 + (Math.random() - 0.5) * 150));
        const randomRot = Math.floor((Math.random() - 0.5) * 12);

        highestZ += 1;

        const newNote = {
            id: 'note_' + Date.now(),
            text: text,
            emoji: selectedEmoji,
            color: selectedColor,
            x: randomX,
            y: randomY,
            rotate: randomRot,
            zIndex: highestZ,
            image: capturedImgDataUrl,
            likes: 0,
            comments: []
        };
        notes.push(newNote);
    }

    saveToStorage();
    renderBoard();
    updateStats();
    closeNoteModal();
});

// --- Toolbar Filtering & Search ---
function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    
    notes.forEach(note => {
        const el = document.getElementById(`note-${note.id}`);
        if (!el) return;

        const matchesSearch = note.text.toLowerCase().includes(query);
        const matchesColor = activeColorFilter === 'all' || note.color === activeColorFilter;

        if (matchesSearch && matchesColor) {
            el.classList.remove('filtered-out');
        } else {
            el.classList.add('filtered-out');
        }
    });
}

searchInput.addEventListener('input', applyFilters);

colorFilters.forEach(dot => {
    dot.addEventListener('click', () => {
        colorFilters.forEach(d => {
            d.classList.remove('active');
            d.style.transform = '';
        });

        dot.classList.add('active');
        dot.style.transform = 'scale(1.25)';

        activeColorFilter = dot.dataset.color;
        applyFilters();
    });
});

// --- Modal Controls ---
addNoteBtn.addEventListener('click', openCreateModal);
modalCancelBtn.addEventListener('click', closeNoteModal);
noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeNoteModal();
});

// --- Clear All System ---
clearAllBtn.addEventListener('click', () => {
    if (confirm('確定要清空所有貼紙嗎？此動作將無法復原！')) {
        SoundSynth.play('delete');
        notes.forEach(note => {
            const el = document.getElementById(`note-${note.id}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                const colorHex = colors[note.color] || '#ffffff';
                ParticleSystem.spawn(rect, colorHex);
                el.style.opacity = '0';
                el.style.transform = 'scale(0.1)';
            }
        });

        setTimeout(() => {
            notes = [];
            saveToStorage();
            renderBoard();
            updateStats();
        }, 350);
    }
});

// --- Helper Functions ---
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Web Audio Synth ---
const SoundSynth = {
    ctx: null,
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("AudioContext not supported");
        }
    },
    play(type) {
        const soundToggle = document.getElementById('sound-toggle');
        if (!soundToggle || !soundToggle.checked) return;
        
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const now = this.ctx.currentTime;
            
            if (type === 'click') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'like') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'delete') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'wave') {
                const osc = this.ctx.createOscillator();
                const modulator = this.ctx.createOscillator();
                const modGain = this.ctx.createGain();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                modulator.type = 'sine';
                
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1500, now + 0.35);
                
                modulator.frequency.setValueAtTime(140, now);
                modGain.gain.setValueAtTime(350, now);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                
                modulator.connect(modGain);
                modGain.connect(osc.frequency);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                modulator.start(now);
                osc.start(now);
                modulator.stop(now + 0.35);
                osc.stop(now + 0.35);
            }
        } catch (e) {
            console.warn("Audio playback failed: ", e);
        }
    }
};

// --- Clock Widget ---
function updateClock() {
    const timeEl = document.getElementById('cyber-time');
    const dateEl = document.getElementById('cyber-date');
    if (!timeEl || !dateEl) return;
    
    const now = new Date();
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    timeEl.innerText = `${HH}:${MM}:${SS}`;
    
    const YYYY = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    dateEl.innerText = `${YYYY} / ${month} / ${DD}`;
}

// --- Dashboard Statistics ---
function updateStats() {
    const statsTotalNotes = document.getElementById('stats-total-notes');
    const statsTotalLikes = document.getElementById('stats-total-likes');
    const statsVisitorCount = document.getElementById('stats-visitor-count');
    
    if (statsTotalNotes) statsTotalNotes.innerText = notes.length;
    
    const totalLikes = notes.reduce((sum, n) => sum + (n.likes || 0), 0);
    if (statsTotalLikes) statsTotalLikes.innerText = totalLikes;
    
    if (statsVisitorCount) statsVisitorCount.innerText = visitorCount;
}

// --- Webcam Wave Motion Detection ---
function updateMotionDetection() {
    if (!isBgCamActive || !bgVideo.srcObject) {
        prevFrameData = null;
        return;
    }
    
    const sensorRing = document.getElementById('sensor-ring');
    if (!sensorRing) return;
    
    const canvas = document.getElementById('motion-canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale frame down to motion canvas
    ctx.drawImage(bgVideo, 0, 0, canvas.width, canvas.height);
    
    try {
        const currentFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (prevFrameData) {
            let diffSum = 0;
            const len = currentFrameData.data.length;
            
            for (let i = 0; i < len; i += 4) {
                const rDiff = Math.abs(currentFrameData.data[i] - prevFrameData.data[i]);
                const gDiff = Math.abs(currentFrameData.data[i+1] - prevFrameData.data[i+1]);
                const bDiff = Math.abs(currentFrameData.data[i+2] - prevFrameData.data[i+2]);
                
                const pixelDiff = (rDiff + gDiff + bDiff) / 3;
                if (pixelDiff > 25) {
                    diffSum++;
                }
            }
            
            const percentChanged = diffSum / (canvas.width * canvas.height);
            if (percentChanged > 0.15 && !gestureCooldown) {
                triggerGestureAction();
            }
        }
        
        prevFrameData = currentFrameData;
    } catch (err) {
        console.error("像素比對錯誤:", err);
    }
    
    setTimeout(updateMotionDetection, 100);
}

function triggerGestureAction() {
    gestureCooldown = true;
    SoundSynth.play('wave');
    
    // Visual flash
    const flash = document.createElement('div');
    flash.className = 'scanline-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
    
    // Pulse the sensor ring
    const sensorRing = document.getElementById('sensor-ring');
    if (sensorRing) {
        sensorRing.classList.add('sensing');
        setTimeout(() => sensorRing.classList.remove('sensing'), 1500);
    }
    
    // Cycle background filter
    const filters = ['matrix', 'cyber-blue', 'neon-pink', 'monochrome'];
    const currentFilter = bgCameraFilterSelect.value;
    const nextIndex = (filters.indexOf(currentFilter) + 1) % filters.length;
    const nextFilter = filters[nextIndex];
    bgCameraFilterSelect.value = nextFilter;
    applyBgFilter();
    
    // Spawn a big floating neon emoji in the middle
    spawnFloatingEmoji();
    
    setTimeout(() => {
        gestureCooldown = false;
    }, 1500);
}

function spawnFloatingEmoji() {
    const emojis = ['👽', '👾', '🚀', '✨', '🔥', '⚡', '💖', '⭐', '🌈'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const span = document.createElement('div');
    span.className = 'floating-sensor-emoji';
    span.innerText = randomEmoji;
    span.style.left = '50%';
    span.style.top = '50%';
    
    const dx = (Math.random() - 0.5) * 200;
    const dy = 100 + Math.random() * 150;
    const rot = (Math.random() - 0.5) * 60;
    
    span.style.setProperty('--dx', `${dx}px`);
    span.style.setProperty('--dy', `${dy}px`);
    span.style.setProperty('--rot', `${rot}deg`);
    
    boardArea.appendChild(span);
    setTimeout(() => span.remove(), 2000);
}

function spawnFloatingHearts(x, y) {
    const count = 3;
    for (let i = 0; i < count; i++) {
        const heart = document.createElement('span');
        heart.className = 'floating-heart';
        heart.innerText = '❤️';
        heart.style.left = `${x + (Math.random() - 0.5) * 30}px`;
        heart.style.top = `${y - 10}px`;
        
        const angle = (Math.random() - 0.5) * 45;
        heart.style.setProperty('--rot-angle', `${angle}deg`);
        
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}
