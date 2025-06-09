// DOM Elements
const trimPageBtn = document.getElementById('trim-page-btn');
const diaryPageBtn = document.getElementById('diary-page-btn');
const trimPage = document.getElementById('trim-page');
const diaryPage = document.getElementById('diary-page');

// Trim Page Elements
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

// Diary Page Elements
const diaryVideoUpload = document.getElementById('diary-video-upload');
const diaryDescription = document.getElementById('diary-description');
const saveDiaryEntryBtn = document.getElementById('save-diary-entry');
const diaryGallery = document.getElementById('diary-gallery');

// Video variables
let originalVideoFile = null;
let videoObjectUrl = null;
let clipStartTime = 0;
let clipEndTime = 0;

// Event Listeners for Page Navigation
trimPageBtn.addEventListener('click', () => {
    trimPage.classList.add('active');
    diaryPage.classList.remove('active');
});

diaryPageBtn.addEventListener('click', () => {
    diaryPage.classList.add('active');
    trimPage.classList.remove('active');
    loadDiaryEntries();
});

// Trim Page Functions
videoUpload.addEventListener('change', handleVideoUpload);
setStartBtn.addEventListener('click', setStartTime);
setEndBtn.addEventListener('click', setEndTime);
previewClipBtn.addEventListener('click', previewClip);
saveClipBtn.addEventListener('click', saveClip);

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.includes('mp4')) {
        alert('Please upload an MP4 file');
        return;
    }
    
    originalVideoFile = file;
    videoObjectUrl = URL.createObjectURL(file);
    videoPreview.src = videoObjectUrl;
    videoEditor.style.display = 'block';
    
    clipStartTime = 0;
    clipEndTime = videoPreview.duration || 30;
    
    updateTimeDisplays();
}

function setStartTime() {
    clipStartTime = videoPreview.currentTime;
    if (clipStartTime >= clipEndTime) {
        clipStartTime = clipEndTime - 5;
    }
    updateTimeDisplays();
}

function setEndTime() {
    clipEndTime = videoPreview.currentTime;
    if (clipEndTime <= clipStartTime) {
        clipEndTime = clipStartTime + 5;
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
    
    await saveToIndexedDB(clipData, 'gameClips');
    renderClip(clipData);
    alert('Clip saved! (Note: In this prototype, only metadata is saved)');
}

// Diary Page Functions
saveDiaryEntryBtn.addEventListener('click', saveDiaryEntry);

async function saveDiaryEntry() {
    const file = diaryVideoUpload.files[0];
    if (!file) {
        alert('Please select a video file');
        return;
    }
    
    if (!file.type.includes('mp4')) {
        alert('Please upload an MP4 file');
        return;
    }
    
    const description = diaryDescription.value.trim() || 'No description';
    
    const diaryEntry = {
        id: Date.now(),
        videoName: file.name,
        videoUrl: URL.createObjectURL(file),
        description: description,
        createdAt: new Date().toISOString()
    };
    
    await saveToIndexedDB(diaryEntry, 'diaryEntries');
    renderDiaryEntry(diaryEntry);
    
    // Clear form
    diaryVideoUpload.value = '';
    diaryDescription.value = '';
    
    alert('Diary entry saved!');
}

function renderDiaryEntry(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'diary-entry';
    entryElement.innerHTML = `
        <div class="entry-header">
            <h3>${new Date(entry.createdAt).toLocaleString()}</h3>
        </div>
        <video controls src="${entry.videoUrl}"></video>
        <p class="entry-description">${entry.description}</p>
    `;
    // Insert new entry at the top
    diaryGallery.insertBefore(entryElement, diaryGallery.firstChild);
}

function loadDiaryEntries() {
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    diaryGallery.innerHTML = '';
    entries.forEach(entry => {
        renderDiaryEntry(entry);
    });
}

// Common Functions
async function saveToIndexedDB(data, storageKey) {
    let items = JSON.parse(localStorage.getItem(storageKey) || '[]');
    items.push(data);
    localStorage.setItem(storageKey, JSON.stringify(items));
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
