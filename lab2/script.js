const video = document.getElementById('video');
const canvas = document.createElement('canvas');
const gallery = document.getElementById('gallery');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const filterSelect = document.getElementById('filterSelect');

let capturedImages = [];
let currentStream = null;

// 1. Detect/Start Camera
async function startCamera() {
    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        currentStream = stream;
        console.log("Camera started");
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("無法讀取鏡頭，請確認權限設定。");
    }
}

// 2. Start Burst Mode (3 shots)
async function startBurst() {
    if (!currentStream) {
        alert("請先開啟鏡頭！");
        return;
    }

    capturedImages = [];
    gallery.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        await runCountdown(3);
        capturePhoto();
    }
}

function runCountdown(seconds) {
    return new Promise((resolve) => {
        let count = seconds;
        countdownEl.innerText = count;
        countdownEl.classList.add('show');
        
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.innerText = count;
            } else {
                clearInterval(timer);
                countdownEl.classList.remove('show');
                resolve();
            }
        }, 1000);
    });
}

function capturePhoto() {
    // Flash effect
    flashEl.style.animation = 'none';
    flashEl.offsetHeight; // trigger reflow
    flashEl.style.animation = 'flash-anim 0.5s';

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Handle Mirroring
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Apply Filter to Canvas
    ctx.filter = getComputedStyle(video).filter;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png');
    capturedImages.push(dataUrl);

    // Add to gallery
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'photo-card';
    const img = document.createElement('img');
    img.src = dataUrl;
    imgWrapper.appendChild(img);
    gallery.appendChild(imgWrapper);
}

// 3. Download Collage
function downloadCollage() {
    if (capturedImages.length < 3) {
        alert("請先完成三連拍！");
        return;
    }

    const collageCanvas = document.createElement('canvas');
    const ctx = collageCanvas.getContext('2d');
    
    const imgWidth = video.videoWidth;
    const imgHeight = video.videoHeight;
    const padding = 20;
    const footerHeight = 60;

    // Calculate collage size (Vertical Strip)
    collageCanvas.width = imgWidth + (padding * 2);
    collageCanvas.height = (imgHeight * 3) + (padding * 4) + footerHeight;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, collageCanvas.width, collageCanvas.height);

    let loadedCount = 0;
    capturedImages.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
            const y = padding + (index * (imgHeight + padding));
            ctx.drawImage(img, padding, y, imgWidth, imgHeight);
            
            loadedCount++;
            if (loadedCount === 3) {
                // Add Date
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 24px Inter, sans-serif';
                ctx.textAlign = 'center';
                const dateStr = new Date().toLocaleDateString('zh-TW', { 
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                ctx.fillText(dateStr, collageCanvas.width / 2, collageCanvas.height - 25);

                // Trigger Download
                const link = document.createElement('a');
                link.download = `photobooth-collage-${Date.now()}.png`;
                link.href = collageCanvas.toDataURL('image/png');
                link.click();
                
                // Add Confetti Effect
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 }
                    });
                }
            }
        };
        img.src = src;
    });
}

// 4. Update Filter
filterSelect.addEventListener('change', (e) => {
    video.className = e.target.value;
});

// Initialize
document.getElementById('startCameraBtn').addEventListener('click', startCamera);
document.getElementById('startBurstBtn').addEventListener('click', startBurst);
document.getElementById('downloadBtn').addEventListener('click', downloadCollage);
