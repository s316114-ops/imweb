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

// --- Color Configurations ---
const colors = {
    pink: '#ff2a6d',
    cyan: '#05d9e8',
    purple: '#b026ff',
    yellow: '#f1c40f',
    orange: '#ff5722'
};

// --- Particle System for Delete Effect ---
const ParticleSystem = {
    canvas: document.getElementById('particle-canvas'),
    ctx: null,
    particles: [],
    animationId: null,

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
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
        if (!this.animationId) {
            this.loop();
        }
    },

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.loop());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.animationId = null;
        }
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
    }
}

// --- Background Camera Toggle ---
async function toggleBgCamera() {
    if (isBgCamActive) {
        isBgCamActive = false;
        toggleBgCamBtn.innerText = '開啟背景鏡頭';
        toggleBgCamBtn.classList.remove('active');
        bgFilterWrapper.classList.add('hidden');
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
        text: '歡迎來到零界留言板！\n這是一個極富未來感的賽博貼紙牆 🔮\n\n點擊下方「開啟背景鏡頭」進入 AR 投影模式！',
        emoji: '📌',
        color: 'cyan',
        x: 100,
        y: 120,
        rotate: -3,
        zIndex: 1,
        image: null
    },
    {
        id: 'default-2',
        text: '【自拍留言模式】\n點擊 + 按鈕，在發文選單中啟用相機，就可以發布帶有自拍照的霓虹貼紙喔！',
        emoji: '💡',
        color: 'purple',
        x: 450,
        y: 80,
        rotate: 4,
        zIndex: 2,
        image: null
    },
    {
        id: 'default-3',
        text: '試著點擊右上角的「×」按鈕！\n便利貼將觸發霓虹粒子崩解的炫目特效喔 ✨！數據均能自動永續存檔！',
        emoji: '🚀',
        color: 'pink',
        x: 250,
        y: 350,
        rotate: -2,
        zIndex: 3,
        image: null
    }
];

function init() {
    ParticleSystem.init();
    
    // Load notes from localStorage
    const saved = localStorage.getItem('cyber_notes');
    if (saved) {
        notes = JSON.parse(saved);
        notes.forEach(n => {
            if (n.zIndex > highestZ) highestZ = n.zIndex;
        });
    } else {
        notes = [...defaultNotes];
        saveToStorage();
    }
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    // Stop camera when returning to main index
    document.querySelector('.back-btn').addEventListener('click', () => {
        isBgCamActive = false;
        isModalCamActive = false;
        releaseCameraStream();
    });

    renderBoard();
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

    div.innerHTML = `
        <div class="note-header">
            <span class="note-emoji">${note.emoji}</span>
            <button class="note-delete-btn" title="刪除貼紙">&times;</button>
        </div>
        <div class="note-content">${escapeHTML(note.text).replace(/\n/g, '<br>')}</div>
    `;

    div.addEventListener('pointerdown', (e) => handlePointerDown(e, note, div));
    div.addEventListener('dblclick', () => openEditModal(note));

    const deleteBtn = div.querySelector('.note-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id, div);
    });

    return div;
}

// --- Drag & Drop Event Handlers ---
function handlePointerDown(e, note, element) {
    if (e.target.classList.contains('note-delete-btn')) return;

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
            image: capturedImgDataUrl
        };
        notes.push(newNote);
    }

    saveToStorage();
    renderBoard();
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

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}
