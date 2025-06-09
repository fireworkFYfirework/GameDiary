// DOM Elements
const videoUpload = document.getElementById('video-upload');
const videoPreview = document.getElementById('video-preview');
const videoEditor = document.querySelector('.video-editor');
const startTimeDisplay = document.getElementById('start-time');
const endTimeDisplay = document.getElementById('end-time');
const setStartBtn = document.getElementById('set-start');
const setEndBtn = document.getElementById('set-end');
const previewClipBtn = document.getElementById('preview-clip');
const saveClipBtn = document.getElementById('save-clip');
const clipGallery = document.getElementById('clip-gallery');

// Video variables
let originalVideoFile = null;
let videoObjectUrl = null;
let clipStartTime = 0;
let clipEndTime = 0;

// Event Listeners
videoUpload.addEventListener('change', handleVideoUpload);
setStartBtn.addEventListener('click', setStartTime);
setEndBtn.addEventListener('click', setEndTime);
previewClipBtn.addEventListener('click', previewClip);
saveClipBtn.addEventListener('click', saveClip);

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.includes('mp4')) {
        alert('Please upload an MP4 file');
        return;
    }
    
    originalVideoFile = file;
    videoObjectUrl = URL.createObjectURL(file);
    videoPreview.src = videoObjectUrl;
    videoEditor.style.display = 'block';
    
    // Initialize clip times
    clipStartTime = 0;
    clipEndTime = videoPreview.duration || 30; // Default to 30s if duration not available
    
    updateTimeDisplays();
}

function setStartTime() {
    clipStartTime = videoPreview.currentTime;
    if (clipStartTime >= clipEndTime) {
        clipStartTime = clipEndTime - 5; // Ensure minimum 5s clip
    }
    updateTimeDisplays();
}

function setEndTime() {
    clipEndTime = videoPreview.currentTime;
    if (clipEndTime <= clipStartTime) {
        clipEndTime = clipStartTime + 5; // Ensure minimum 5s clip
    }
    updateTimeDisplays();
}

function updateTimeDisplays() {
    startTimeDisplay.textContent = formatTime(clipStartTime);
    endTimeDisplay.textContent = formatTime(clipEndTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function previewClip() {
    if (!videoPreview.paused) {
        videoPreview.pause();
        previewClipBtn.textContent = 'Preview Clip';
        return;
    }
    
    videoPreview.currentTime = clipStartTime;
    videoPreview.play();
    
    // Pause at end time
    const checkTime = () => {
        if (videoPreview.currentTime >= clipEndTime) {
            videoPreview.pause();
            previewClipBtn.textContent = 'Preview Clip';
        } else {
            requestAnimationFrame(checkTime);
        }
    };
    requestAnimationFrame(checkTime);
    
    previewClipBtn.textContent = 'Stop Preview';
}

async function saveClip() {
    if (!originalVideoFile) return;
    
    const clipData = {
        id: Date.now(),
        originalVideo: originalVideoFile.name,
        startTime: clipStartTime,
        endTime: clipEndTime,
        duration: clipEndTime - clipStartTime,
        createdAt: new Date().toISOString(),
        title: `Clip ${Math.floor(Math.random() * 1000)}`
    };
    
    // Save to IndexedDB
    await saveToIndexedDB(clipData);
    
    // Update UI
    renderClip(clipData);
    
    alert('Clip saved! (Note: In this prototype, only metadata is saved)');
}

async function saveToIndexedDB(data) {
    // Simplified for prototype - in real app, use proper IndexedDB implementation
    let clips = JSON.parse(localStorage.getItem('gameClips') || '[]');
    clips.push(data);
    localStorage.setItem('gameClips', JSON.stringify(clips));
}

function renderClip(clip) {
    const clipElement = document.createElement('div');
    clipElement.className = 'clip-card';
    clipElement.innerHTML = `
        <h3>${clip.title}</h3>
        <p>From: ${clip.originalVideo}</p>
        <p>Duration: ${clip.duration.toFixed(1)}s</p>
        <p>Saved: ${new Date(clip.createdAt).toLocaleString()}</p>
        <button class="play-clip" data-id="${clip.id}">Play</button>
    `;
    clipGallery.appendChild(clipElement);
}

// Load saved clips on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedClips = JSON.parse(localStorage.getItem('gameClips') || '[]');
    savedClips.forEach(renderClip);
});