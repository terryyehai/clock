// State
const state = {
    timezone: 'Asia/Taipei',
    theme: 'classic',
    is24Hour: true,
    alarms: [],
    prev: { h: null, m: null, s: null }
};

let els = {};

// Init
function init() {
    els = {
        h: document.getElementById('hours').querySelector('.flip-card'),
        m: document.getElementById('minutes').querySelector('.flip-card'),
        s: document.getElementById('seconds').querySelector('.flip-card'),
        dateGregorian: document.getElementById('date-gregorian'),
        dateLunar: document.getElementById('date-lunar'),
        settingsModal: document.getElementById('settings-modal'),
        alarmModal: document.getElementById('alarm-modal'),
        timezoneSelect: document.getElementById('timezone-select'),
        themeBtns: document.querySelectorAll('.theme-btn'),
        formatToggle: document.getElementById('format-toggle'),
        formatLabel: document.getElementById('format-label')
    };

    loadSettings();
    applyTheme(state.theme);
    setupTimezones();

    dayjs.extend(dayjs_plugin_utc);
    dayjs.extend(dayjs_plugin_timezone);

    updateClock();
    setInterval(updateClock, 1000);

    setupEventListeners();
    requestWakeLock();
}

// Clock
function updateClock() {
    const now = dayjs().tz(state.timezone);
    let h = now.hour();
    if (!state.is24Hour) h = h % 12 || 12;

    const hStr = String(h).padStart(2, '0');
    const mStr = String(now.minute()).padStart(2, '0');
    const sStr = String(now.second()).padStart(2, '0');

    flipUpdate(els.h, hStr, state.prev.h);
    flipUpdate(els.m, mStr, state.prev.m);
    flipUpdate(els.s, sStr, state.prev.s);

    state.prev = { h: hStr, m: mStr, s: sStr };
    updateDate(now);
    checkAlarms(now);
}

function flipUpdate(card, val, prev) {
    if (val === prev) return;

    const top = card.querySelector('.top');
    const bottom = card.querySelector('.bottom');
    const topBack = card.querySelector('.top-back');
    const bottomBack = card.querySelector('.bottom-back');

    if (prev === null) {
        top.textContent = val;
        bottom.textContent = val;
        topBack.textContent = val;
        bottomBack.textContent = val;
        return;
    }

    // Set values for animation
    top.textContent = prev;
    bottom.textContent = prev;
    topBack.textContent = val;
    bottomBack.textContent = val;

    card.classList.remove('flipping');
    void card.offsetWidth;
    card.classList.add('flipping');

    setTimeout(() => {
        card.classList.remove('flipping');
        top.textContent = val;
        bottom.textContent = val;
    }, 500);
}

function updateDate(now) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    els.dateGregorian.textContent = `${now.format('YYYY年 MM月 DD日')} ${days[now.day()]}`;
    try {
        const lunar = Lunar.fromDate(now.toDate());
        els.dateLunar.textContent = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
    } catch (e) { }
}

// Settings
function loadSettings() {
    const saved = localStorage.getItem('fliptime-settings');
    if (saved) {
        const p = JSON.parse(saved);
        state.timezone = p.timezone || state.timezone;
        state.theme = p.theme || state.theme;
        state.is24Hour = p.is24Hour !== undefined ? p.is24Hour : true;
    }
    els.formatToggle.checked = !state.is24Hour;
    els.formatLabel.textContent = state.is24Hour ? '24H' : '12H';
}

function saveSettings() {
    localStorage.setItem('fliptime-settings', JSON.stringify({
        timezone: state.timezone,
        theme: state.theme,
        is24Hour: state.is24Hour
    }));
}

function applyTheme(t) {
    document.body.setAttribute('data-theme', t);
    state.theme = t;
    saveSettings();
}

function setupTimezones() {
    const zones = [
        { name: '台北 (GMT+8)', value: 'Asia/Taipei' },
        { name: '東京 (GMT+9)', value: 'Asia/Tokyo' },
        { name: '紐約 (GMT-5)', value: 'America/New_York' },
        { name: '倫敦 (GMT+0)', value: 'Europe/London' },
        { name: 'UTC', value: 'UTC' }
    ];
    els.timezoneSelect.innerHTML = zones.map(z =>
        `<option value="${z.value}" ${z.value === state.timezone ? 'selected' : ''}>${z.name}</option>`
    ).join('');
}

// Wake Lock
let wakeLock = null;
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (e) { }
    }
}

// Events
function setupEventListeners() {
    document.getElementById('settings-btn').onclick = () => els.settingsModal.classList.remove('hidden');
    document.getElementById('close-settings').onclick = () => els.settingsModal.classList.add('hidden');
    document.getElementById('alarm-btn').onclick = () => els.alarmModal.classList.remove('hidden');
    document.getElementById('close-alarm').onclick = () => els.alarmModal.classList.add('hidden');

    els.themeBtns.forEach(btn => btn.onclick = e => applyTheme(e.target.dataset.theme));

    els.timezoneSelect.onchange = e => {
        state.timezone = e.target.value;
        saveSettings();
        state.prev = { h: null, m: null, s: null };
    };

    els.formatToggle.onchange = e => {
        state.is24Hour = !e.target.checked;
        els.formatLabel.textContent = state.is24Hour ? '24H' : '12H';
        saveSettings();
        state.prev = { h: null, m: null, s: null };
    };

    document.getElementById('add-alarm-btn').onclick = addAlarm;
}

// Alarms
let audioCtx;
function playAlarm() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function checkAlarms(now) {
    if (now.second() !== 0) return;
    const hm = now.format('HH:mm');
    state.alarms.forEach(a => {
        if (a.time === hm && a.enabled) {
            playAlarm();
            document.body.style.backgroundColor = 'var(--accent-color)';
            setTimeout(() => document.body.style.backgroundColor = 'var(--bg-color)', 500);
        }
    });
}

function renderAlarms() {
    document.getElementById('alarm-list').innerHTML = state.alarms.map((a, i) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>${a.time}</span>
            <div>
                <button onclick="toggleAlarm(${i})">${a.enabled ? '開' : '關'}</button>
                <button onclick="deleteAlarm(${i})">刪除</button>
            </div>
        </div>
    `).join('');
}

function addAlarm() {
    const input = document.getElementById('new-alarm-time');
    if (input.value) {
        state.alarms.push({ time: input.value, enabled: true });
        localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
        renderAlarms();
        input.value = '';
    }
}

window.toggleAlarm = i => {
    state.alarms[i].enabled = !state.alarms[i].enabled;
    localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
    renderAlarms();
};

window.deleteAlarm = i => {
    state.alarms.splice(i, 1);
    localStorage.setItem('fliptime-alarms', JSON.stringify(state.alarms));
    renderAlarms();
};

function loadAlarms() {
    const saved = localStorage.getItem('fliptime-alarms');
    if (saved) { state.alarms = JSON.parse(saved); renderAlarms(); }
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
}

document.addEventListener('DOMContentLoaded', () => { init(); loadAlarms(); });
