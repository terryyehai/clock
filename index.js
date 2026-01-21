// State and Configuration
const state = {
    timezone: 'Asia/Taipei', // Default
    theme: 'classic',
    is24Hour: true,
    alarms: [],
    previousTime: { h: null, m: null, s: null }
};

// DOM Elements (populated after DOMContentLoaded)
let els = {};

// Initialize
function init() {
    // Populate DOM elements
    els = {
        h: document.getElementById('hours').querySelector('.flip-card'),
        m: document.getElementById('minutes').querySelector('.flip-card'),
        s: document.getElementById('seconds').querySelector('.flip-card'),
        dateGregorian: document.getElementById('date-gregorian'),
        dateLunar: document.getElementById('date-lunar'),
        app: document.getElementById('app'),
        settingsModal: document.getElementById('settings-modal'),
        alarmModal: document.getElementById('alarm-modal'),
        timezoneSelect: document.getElementById('timezone-select'),
        themeBtns: document.querySelectorAll('.theme-btn'),
        formatToggle: document.getElementById('format-toggle'),
        formatLabel: document.getElementById('format-label')
    };

    loadSettings();
    loadAlarmSettings();
    applyTheme(state.theme);
    setupTimezones();

    // Register Plugins
    dayjs.extend(dayjs_plugin_utc);
    dayjs.extend(dayjs_plugin_timezone);

    // Start Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Event Listeners
    setupEventListeners();

    // Wake Lock
    requestWakeLock();
}

// Core Clock Logic
function updateClock() {
    const now = dayjs().tz(state.timezone);

    let h = now.hour();
    const m = now.minute();
    const s = now.second();

    // Format Handling
    if (!state.is24Hour) {
        h = h % 12 || 12;
    }

    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');

    // Update Flips
    updateFlipUnit(els.h, hStr, state.previousTime.h);
    updateFlipUnit(els.m, mStr, state.previousTime.m);
    updateFlipUnit(els.s, sStr, state.previousTime.s);

    state.previousTime = { h: hStr, m: mStr, s: sStr };

    // Update Date
    updateDate(now);

    // Check Alarms
    checkAlarms(now);
}

// Flip Animation Logic
function updateFlipUnit(cardEl, newValue, oldValue) {
    if (newValue === oldValue) return;

    const top = cardEl.querySelector('.top');
    const bottom = cardEl.querySelector('.bottom');
    const topBack = cardEl.querySelector('.top-back');
    const bottomBack = cardEl.querySelector('.bottom-back');

    // Setup initial state for animation
    topBack.innerText = newValue;
    bottomBack.innerText = newValue;
    top.innerText = oldValue !== null ? oldValue : newValue;
    bottom.innerText = oldValue !== null ? oldValue : newValue;

    // If it's the first run, don't animate, just set
    if (oldValue === null) {
        return;
    }

    // Trigger Animation
    cardEl.classList.remove('flip-down');
    void cardEl.offsetWidth; // Force reflow
    cardEl.classList.add('flip-down');

    // Cleanup after animation
    setTimeout(() => {
        top.innerText = newValue;
        bottom.innerText = newValue;
        cardEl.classList.remove('flip-down');
    }, 600); // Match CSS transition duration
}

function updateDate(now) {
    // Gregorian
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    els.dateGregorian.innerText = `${now.format('YYYY年 MM月 DD日')} ${days[now.day()]}`;

    // Lunar
    try {
        const lunar = Lunar.fromDate(now.toDate());
        els.dateLunar.innerText = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
    } catch (e) {
        console.error("Lunar conversion failed", e);
    }
}

// Settings & Storage
function loadSettings() {
    const saved = localStorage.getItem('fliptime-settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.timezone = parsed.timezone || state.timezone;
        state.theme = parsed.theme || state.theme;
        state.is24Hour = parsed.is24Hour !== undefined ? parsed.is24Hour : state.is24Hour;
    }

    els.formatToggle.checked = !state.is24Hour;
    els.formatLabel.innerText = state.is24Hour ? '24H' : '12H';
}

function saveSettings() {
    localStorage.setItem('fliptime-settings', JSON.stringify({
        timezone: state.timezone,
        theme: state.theme,
        is24Hour: state.is24Hour
    }));
}

function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    state.theme = themeName;
    saveSettings();
}

function setupTimezones() {
    const commonZones = [
        { name: '台北 (GMT+8)', value: 'Asia/Taipei' },
        { name: '東京 (GMT+9)', value: 'Asia/Tokyo' },
        { name: '紐約 (GMT-5)', value: 'America/New_York' },
        { name: '倫敦 (GMT+0)', value: 'Europe/London' },
        { name: 'UTC', value: 'UTC' }
    ];

    els.timezoneSelect.innerHTML = commonZones.map(z =>
        `<option value="${z.value}" ${z.value === state.timezone ? 'selected' : ''}>${z.name}</option>`
    ).join('');
}

// Wake Lock
let wakeLock = null;
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Settings Modal
    document.getElementById('settings-btn').addEventListener('click', () => els.settingsModal.classList.remove('hidden'));
    document.getElementById('close-settings').addEventListener('click', () => els.settingsModal.classList.add('hidden'));

    // Alarm Modal
    document.getElementById('alarm-btn').addEventListener('click', () => els.alarmModal.classList.remove('hidden'));
    document.getElementById('close-alarm').addEventListener('click', () => els.alarmModal.classList.add('hidden'));

    // Theme Switching
    els.themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => applyTheme(e.target.dataset.theme));
    });

    // Timezone
    els.timezoneSelect.addEventListener('change', (e) => {
        state.timezone = e.target.value;
        saveSettings();
        state.previousTime = { h: null, m: null, s: null }; // Force immediate update
    });

    // Format Toggle
    els.formatToggle.addEventListener('change', (e) => {
        state.is24Hour = !e.target.checked;
        els.formatLabel.innerText = state.is24Hour ? '24H' : '12H';
        saveSettings();
        state.previousTime = { h: null, m: null, s: null }; // Force refresh
    });

    // Alarm Add Button
    document.getElementById('add-alarm-btn').addEventListener('click', addAlarm);
}

// Alarm Logic
let audioCtx;
function playAlarmSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create oscillator for beep
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function checkAlarms(now) {
    const currentHM = now.format('HH:mm');
    // Only trigger if seconds is 00 to avoid multiple triggers per minute
    if (now.second() !== 0) return;

    state.alarms.forEach(alarm => {
        if (alarm.time === currentHM && alarm.enabled) {
            playAlarmSound();
            // Visual alert - flash the screen
            document.body.style.backgroundColor = 'var(--accent-color)';
            setTimeout(() => {
                document.body.style.backgroundColor = 'var(--bg-color)';
            }, 500);
        }
    });
}

// Alarm UI Management
function renderAlarms() {
    const list = document.getElementById('alarm-list');
    list.innerHTML = state.alarms.map((alarm, index) => `
        <div class="alarm-item" style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${alarm.time}</span>
            <div>
                <button onclick="toggleAlarm(${index})">${alarm.enabled ? '開啟' : '關閉'}</button>
                <button onclick="deleteAlarm(${index})">刪除</button>
            </div>
        </div>
    `).join('');
}

function addAlarm() {
    const timeInput = document.getElementById('new-alarm-time');
    if (timeInput.value) {
        state.alarms.push({ time: timeInput.value, enabled: true });
        localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
        renderAlarms();
        timeInput.value = '';
    }
}

// Global scope for onclick handlers
window.toggleAlarm = function (index) {
    state.alarms[index].enabled = !state.alarms[index].enabled;
    localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
    renderAlarms();
};

window.deleteAlarm = function (index) {
    state.alarms.splice(index, 1);
    localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
    renderAlarms();
};

function loadAlarmSettings() {
    const saved = localStorage.getItem('fliptime-alarms');
    if (saved) {
        state.alarms = JSON.parse(saved);
        renderAlarms();
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Start on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
