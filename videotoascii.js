/* jshint esversion: 6 */
const DEFAULT_VIDEO_URL = 'media/intro.mp4';

let animationId;
let isPlaying = false;
const video = document.getElementById('sourceVideo');
const canvas = document.getElementById('processingCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const asciiContainer = document.getElementById('ascii-container');
const asciiWrapper = document.getElementById('ascii-wrapper');

// character sets
const charSets = {
    high: " .'`^,;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    simple: " .:-=+*#%@",
    binary: " 01",
    blocks: " ░▒▓█"
};

// viewport options
let currentDensity = charSets.high;
let maxWidth = 160;
let contrastFactor = 1;
let zoomFactor = 1;
let panX = 50; // 0-100
let panY = 50; // 0-100

// crt mode
let isCRTMode = false;
let crtBuffer = [];
let crtCursor = 0;

// SCRIPT CONFIG
const FPS = 10;
const FRAME_DELAY = 1000 / FPS;
let lastFrameTime = 0;

function toggleUI() {
    const uploadContainer = document.getElementById('ascii-upload-container');
    const controls = document.getElementById('ascii-controls');
    const wrapper = document.getElementById('ascii-wrapper');
    const toggleBtn = document.getElementById('btn-toggle-options');

    if (controls.classList.contains('grid-rows-[0fr]')) {

        uploadContainer.classList.remove('grid-rows-[0fr]');
        uploadContainer.classList.add('grid-rows-[1fr]');

        controls.classList.remove('grid-rows-[0fr]');
        controls.classList.add('grid-rows-[1fr]');

        wrapper.classList.remove('min-h-[50vh]', 'flex-grow');
        wrapper.classList.add('h-[400px]');

        toggleBtn.innerText = "Hide Options";
    } else {

        uploadContainer.classList.remove('grid-rows-[1fr]');
        uploadContainer.classList.add('grid-rows-[0fr]');

        controls.classList.remove('grid-rows-[1fr]');
        controls.classList.add('grid-rows-[0fr]');

        wrapper.classList.add('min-h-[50vh]', 'flex-grow');
        wrapper.classList.remove('h-[400px]');

        toggleBtn.innerText = "Show Options";
    }

    setTimeout(fitAsciiToContainer, 300);
}

function resetPan() {
    document.getElementById('opt-pan-x').value = 50;
    document.getElementById('opt-pan-y').value = 50;
    scheduleUpdateSettings();
}

// loading screen
function setOverlay(show, text = "PROCESSING...", isError = false) {
    const statusOverlay = document.getElementById('status-overlay');
    const statusText = document.getElementById('status-text');
    const spinner = statusOverlay.querySelector('.animate-spin');

    if (show) {
        statusOverlay.classList.remove('hidden');
        statusText.innerText = text;
        if (isError) {
            spinner.classList.add('hidden');
            statusText.classList.remove('text-white');
            statusText.classList.add('text-red-400', 'font-bold');
        } else {
            spinner.classList.remove('hidden');
            statusText.classList.remove('text-red-400', 'font-bold');
            statusText.classList.add('text-white');
        }
    } else {
        statusOverlay.classList.add('hidden');
    }
}

// Settings Handling (Debounced)
let settingsTimeout;

function scheduleUpdateSettings() {
    if (settingsTimeout) clearTimeout(settingsTimeout);

    // 100ms debounce
    settingsTimeout = setTimeout(() => {
        updateSettings();
        settingsTimeout = null;
    }, 100);
}

function updateSettings() {
    maxWidth = parseInt(document.getElementById('opt-resolution').value);

    contrastFactor = parseFloat(document.getElementById('opt-contrast').value);

    zoomFactor = parseFloat(document.getElementById('opt-zoom').value);

    panX = parseInt(document.getElementById('opt-pan-x').value);
    panY = parseInt(document.getElementById('opt-pan-y').value);

    asciiContainer.style.transformOrigin = `${panX}% ${panY}%`;

    const type = document.getElementById('opt-charset').value;
    currentDensity = charSets[type] || charSets.high;

    isCRTMode = document.getElementById('opt-crt').checked;

    if(!isPlaying) {
         fitAsciiToContainer();
    }
}

function fitAsciiToContainer() {
    /* scale to fit container bounding box but maintain aspect ratio, apply zoom after */

    if (!asciiWrapper || !asciiContainer) return;

    const wrapperRect = asciiWrapper.getBoundingClientRect();
    
    const contentWidth = asciiContainer.scrollWidth;
    const contentHeight = asciiContainer.scrollHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const scaleX = wrapperRect.width / contentWidth;
    const scaleY = wrapperRect.height / contentHeight;

    const scale = Math.min(scaleX, scaleY) * zoomFactor;

    asciiContainer.style.transform = `scale(${scale})`;
}

// fallback
function startStaticNoise() {
    document.getElementById('ascii-controls').classList.add('hidden');

    function drawNoise() {
        if (isPlaying) return;
        let content = "";
        const rows = 40;
        const cols = 100;
        for(let i = 0; i < rows; i++) {
            for(let j = 0; j < cols; j++) {
                content += currentDensity[Math.floor(Math.random() * currentDensity.length)];
            }
            content += "\n";
        }
        asciiContainer.textContent = content;
        fitAsciiToContainer();
    }
    if(window.noiseInterval) clearInterval(window.noiseInterval);
    window.noiseInterval = setInterval(drawNoise, 100);
}

function loadDefaultVideo() {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const playBtn = document.getElementById('btn-play');
    const resetBtn = document.getElementById('btn-reset');

    // default state
    fileNameDisplay.textContent = "Intro Video";
    resetBtn.classList.add('hidden');

    video.src = DEFAULT_VIDEO_URL;

    const errorHandler = (e) => {
        console.log("Default video not found, playing static noise.");
        startStaticNoise();
        video.removeEventListener('error', errorHandler);
    };

    video.addEventListener('error', errorHandler);

    video.load();
    video.onloadeddata = () => {
        video.removeEventListener('error', errorHandler); 
        clearInterval(window.noiseInterval); 

        document.getElementById('ascii-controls').classList.remove('hidden');

        playBtn.disabled = false;
        playBtn.classList.remove('opacity-50');
        togglePlay(true);
    };
}

function handleFileSelect(input) {
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const statusOverlay = document.getElementById('status-overlay');
    const statusText = document.getElementById('status-text');
    const playBtn = document.getElementById('btn-play');
    const resetBtn = document.getElementById('btn-reset');
    const spinner = statusOverlay.querySelector('.animate-spin');

    if (input.files && input.files[0]) {
        const file = input.files[0];

        // size limit (50mb)
        if (file.size > 50 * 1024 * 1024) {
            setOverlay(true, "FILE TOO LARGE (MAX 50MB)", true);

            setTimeout(() => {
                setOverlay(false);
                input.value = '';
                statusText.classList.remove('text-red-400', 'font-bold');
                statusText.classList.add('text-white');
            }, 3000);
            return;
        }

        fileNameDisplay.textContent = file.name;
        resetBtn.classList.remove('hidden');

        // stop static
        clearInterval(window.noiseInterval);

        setOverlay(true, "LOADING VIDEO...", false);

        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;
        video.load();

        video.onloadeddata = () => {
            setOverlay(false);

            // controls
            document.getElementById('ascii-controls').classList.remove('hidden');

            playBtn.disabled = false;
            playBtn.classList.remove('opacity-50');
            togglePlay(true);
        };
    }
}

// The Rendering Loop
function renderASCII(currentTime) {
    if (!isPlaying) return;

    animationId = requestAnimationFrame(renderASCII);

    const elapsed = currentTime - lastFrameTime;

    if (elapsed > FRAME_DELAY) {
        lastFrameTime = currentTime - (elapsed % FRAME_DELAY);

        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        // aspect ratio
        const ratio = video.videoHeight / video.videoWidth;
        const width = maxWidth; 
        const height = Math.floor(width * ratio * 0.55); 

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(video, 0, 0, width, height);

        // get pixels
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let asciiStr = "";
        const len = currentDensity.length;

        // convert pixels to chars
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                let r = data[offset];
                let g = data[offset + 1];
                let b = data[offset + 2];

                // brightness = average of RGB
                let avg = (r + g + b) / 3;

                // contrast formula: (value - 128) * factor + 128
                avg = (avg - 128) * contrastFactor + 128;

                // clamp values
                if (avg < 0) avg = 0;
                if (avg > 255) avg = 255;

                const charIndex = Math.floor(map(avg, 0, 255, 0, len));

                // check bounds just in case
                const safeIndex = Math.min(Math.max(charIndex, 0), len - 1);

                const c = currentDensity.charAt(safeIndex);
                asciiStr += c;
            }
            asciiStr += "\n";
        }

        // --- RENDER OUTPUT ---

        if (!isCRTMode) {
            // Standard Mode: Update whole frame
            asciiContainer.textContent = asciiStr;

            // Sync buffer just in case user switches mode while playing
            if (crtBuffer.length !== asciiStr.length) {
                crtBuffer = asciiStr.split('');
                crtCursor = 0;
            }
        } else {
            // CRT/Typing Mode logic

            // 1. Initialize buffer if resolution changed
            if (crtBuffer.length !== asciiStr.length) {
                crtBuffer = new Array(asciiStr.length).fill(' ');
                crtCursor = 0;
            }

            // 2. Determine "Typing Speed"
            // Update about 2.5% of the screen per frame tick (40 ticks to full refresh)
            // At 10 FPS, this takes ~4 seconds to wipe the screen.
            const charsToUpdate = Math.max(1, Math.ceil(asciiStr.length / 40));

            // 3. Update the buffer progressively
            const targetArr = asciiStr.split(''); // Current video frame data

            for (let i = 0; i < charsToUpdate; i++) {
                if (crtCursor < targetArr.length) {
                    crtBuffer[crtCursor] = targetArr[crtCursor];
                }

                crtCursor++;
                if (crtCursor >= crtBuffer.length) {
                    crtCursor = 0; // Wrap around
                }
            }

            asciiContainer.textContent = crtBuffer.join('');
        }

        fitAsciiToContainer();
        updateTimer();
    }
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// controls
function togglePlay(forcePlay = false) {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');

    if (video.paused || forcePlay) {
        video.play();
        isPlaying = true;
        btnPlay.classList.add('hidden');
        btnPause.classList.remove('hidden');
        renderASCII(performance.now());
    } else {
        video.pause();
        isPlaying = false;
        cancelAnimationFrame(animationId);
        btnPlay.classList.remove('hidden');
        btnPause.classList.add('hidden');
    }
}

function updatePlaybackSpeed(val) {
    video.playbackRate = parseFloat(val);
    document.getElementById('speed-val').innerText = val + 'x';
}

function updateTimer() {
    const timer = document.getElementById('video-timer');
    const curr = formatTime(video.currentTime);
    const dur = formatTime(video.duration || 0);
    timer.innerText = `${curr} / ${dur}`;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function copyToClipboard() {
    const content = asciiContainer.textContent;
    navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('button[onclick="copyToClipboard()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="text-green-400">COPIED!</span>`;
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// window Resize Handler
window.addEventListener('resize', fitAsciiToContainer);
