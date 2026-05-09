const API_URL = 'http://localhost:5000/detect';

const video = document.getElementById('webcam');
const startBtn = document.getElementById('start-camera');
const stopBtn = document.getElementById('stop-camera');
const liveResult = document.getElementById('live-result');
const liveBreed = document.getElementById('live-breed');
const liveConf = document.getElementById('live-conf');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const resultCard = document.getElementById('result-card');
const breedName = document.getElementById('breed-name');
const confidenceFill = document.getElementById('confidence-fill');
const confidenceText = document.getElementById('confidence-text');

let cameraStream = null;
let analyzeInterval = null;

if (startBtn) {
    startBtn.onclick = async function () {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            cameraStream = stream;
            startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-block';
            if (liveResult) liveResult.style.display = 'flex';
            analyzeInterval = setInterval(sendFrame, 1000);
        } catch (err) {
            alert("Kamera izni verilmedi veya kamera bulunamadı!");
        }
    };
}

if (stopBtn) {
    stopBtn.onclick = function () {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        clearInterval(analyzeInterval);
        if (startBtn) startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        if (liveResult) liveResult.style.display = 'none';
        if (liveBreed) liveBreed.innerText = '—';
        if (liveConf) liveConf.innerText = '%0';
    };
}

async function sendFrame() {
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.7);
    const result = await sendToAPI(base64Image);
    if (result && result.length > 0) {
        const top = result[0];
        if (liveBreed) liveBreed.innerText = top.label.replace(/_/g, ' ');
        if (liveConf) liveConf.innerText = '%' + (top.confidence * 100).toFixed(1);
    } else {
        if (liveBreed) liveBreed.innerText = 'Köpek bulunamadı';
        if (liveConf) liveConf.innerText = '—';
    }
}

if (fileInput) {
    fileInput.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (event) {
            const base64Image = event.target.result;
            if (imagePreview) imagePreview.src = base64Image;
            if (resultCard) resultCard.style.display = 'flex';
            if (breedName) breedName.innerText = 'Analiz ediliyor...';
            if (confidenceFill) confidenceFill.style.width = '0%';
            if (confidenceText) confidenceText.innerText = 'Lütfen bekleyin...';
            const result = await sendToAPI(base64Image);
            if (result && result.length > 0) {
                const top = result[0];
                const conf = (top.confidence * 100).toFixed(1);
                if (breedName) breedName.innerText = top.label.replace(/_/g, ' ');
                if (confidenceFill) confidenceFill.style.width = conf + '%';
                if (confidenceText) confidenceText.innerText = '%' + conf + ' Doğruluk';
            } else {
                if (breedName) breedName.innerText = 'Köpek tespit edilemedi';
                if (confidenceFill) confidenceFill.style.width = '0%';
                if (confidenceText) confidenceText.innerText = '%0 Doğruluk';
            }
        };
        reader.readAsDataURL(file);
    };
}

async function sendToAPI(base64Image) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        const result = await response.json();
        if (result.success) return result.data;
        return [];
    } catch (error) {
        console.error("Backend hatası:", error);
        if (breedName) breedName.innerText = 'Sunucu bağlantı hatası! Flask çalışıyor mu?';
        return [];
    }
}