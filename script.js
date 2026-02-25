'use strict';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let state = {
    userName: '',
    questions: [],
    current: 0,
    answers: {},
    timeLeft: 25 * 60,
    timerRef: null,
    startTime: null,
    submitted: false
};

// ══════════════════════════════════════════════
// DOM HELPERS
// ══════════════════════════════════════════════
const $ = id => document.getElementById(id);
const showScreen = id => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
};

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    $('startBtn').addEventListener('click', startTest);
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startTest(); });
    $('prevBtn').addEventListener('click', () => navigate(-1));
    $('nextBtn').addEventListener('click', handleNext);
    $('copyBtn').addEventListener('click', copyResults);
    $('retakeBtn').addEventListener('click', retake);

    // Anti-cheat
    document.addEventListener('visibilitychange', () => {
        if (state.submitted || !state.startTime) return;
        if (document.hidden) showToast('⚠️ Tab switch detected!');
    });
    document.addEventListener('contextmenu', e => {
        if ($('test').classList.contains('active')) e.preventDefault();
    });
});

// ══════════════════════════════════════════════
// START TEST
// ══════════════════════════════════════════════
function startTest() {
    const name = $('nameInput').value.trim() || 'Anonymous';
    state.userName = name;

    // Shuffle all questions (shuffle within each category, then interleave)
    const byCategory = {};
    QUESTIONS.forEach(q => {
        if (!byCategory[q.category]) byCategory[q.category] = [];
        byCategory[q.category].push(q);
    });
    let pool = [];
    Object.values(byCategory).forEach(arr => pool = pool.concat(shuffle([...arr])));
    state.questions = shuffle(pool);
    state.current = 0;
    state.answers = {};
    state.timeLeft = 25 * 60;
    state.submitted = false;
    state.startTime = Date.now();

    showScreen('test');
    renderQuestion();
    renderQuestionMap();
    startTimer();
}

// ══════════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════════
function startTimer() {
    clearInterval(state.timerRef);
    updateTimerDisplay();
    state.timerRef = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft <= 0) { clearInterval(state.timerRef); submitTest(true); }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const s = (state.timeLeft % 60).toString().padStart(2, '0');
    const el = $('timer');
    el.textContent = `${m}:${s}`;
    el.className = '';
    if (state.timeLeft <= 300) el.classList.add('warning');
    if (state.timeLeft <= 60) el.classList.add('danger');
}

// ══════════════════════════════════════════════
// RENDER QUESTION
// ══════════════════════════════════════════════
function renderQuestion() {
    const q = state.questions[state.current];
    const idx = state.current;
    const total = state.questions.length;
    const pct = (idx / total) * 100;

    // Top bar
    $('progressFill').style.width = pct + '%';
    $('qCounter').textContent = `${idx + 1}/${total}`;

    // Category badge
    const catMeta = CATEGORIES[q.category];
    $('categoryBadge').textContent = catMeta.label;
    $('categoryBadge').style.color = catMeta.color;

    // Question meta
    $('qNumber').textContent = `Question ${idx + 1}`;

    // Difficulty pips
    const dots = $('difficultyDots');
    dots.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const pip = document.createElement('span');
        pip.className = 'diff-pip' + (i <= q.difficulty ? ' on' : '');
        dots.appendChild(pip);
    }

    // Question text
    $('questionText').textContent = q.question;

    // Options – shuffled
    const letters = ['A', 'B', 'C', 'D'];
    const shuffledOpts = shuffle([...q.options]);
    const grid = $('optionsGrid');
    grid.innerHTML = '';

    shuffledOpts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (state.answers[q.id] === opt ? ' selected' : '');
        btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${escHtml(opt)}</span>`;
        btn.addEventListener('click', () => selectOption(q.id, opt));
        grid.appendChild(btn);
    });

    // Nav
    $('prevBtn').disabled = idx === 0;
    const isLast = idx === total - 1;
    $('nextBtn').textContent = isLast ? 'Submit ✓' : 'Next →';
    if (isLast) $('nextBtn').classList.add('primary');
    else $('nextBtn').classList.add('primary'); // always primary

    updateQuestionMap();
}

// ══════════════════════════════════════════════
// SELECT OPTION
// ══════════════════════════════════════════════
function selectOption(qId, opt) {
    state.answers[qId] = opt;
    document.querySelectorAll('.option-btn').forEach(btn => {
        const txt = btn.querySelector('span:last-child').textContent;
        const sel = txt === opt;
        btn.classList.toggle('selected', sel);
        const ltr = btn.querySelector('.option-letter');
        ltr.style.background = sel ? 'var(--accent)' : '';
        ltr.style.borderColor = sel ? 'var(--accent-dark)' : '';
        ltr.style.color = sel ? 'var(--text-dark)' : '';
    });
    updateQuestionMap();
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function navigate(dir) {
    state.current = Math.max(0, Math.min(state.questions.length - 1, state.current + dir));
    renderQuestion();
}

function handleNext() {
    if (state.current === state.questions.length - 1) {
        const unanswered = state.questions.filter(q => !state.answers[q.id]).length;
        if (unanswered > 0) {
            const ok = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
            if (!ok) return;
        }
        submitTest(false);
    } else {
        navigate(1);
    }
}

// ══════════════════════════════════════════════
// QUESTION MAP
// ══════════════════════════════════════════════
function renderQuestionMap() {
    const map = $('questionMap');
    map.innerHTML = '';
    state.questions.forEach((q, i) => {
        const dot = document.createElement('div');
        dot.className = 'q-dot' + (state.answers[q.id] ? ' answered' : '') + (i === state.current ? ' current' : '');
        dot.textContent = i + 1;
        dot.addEventListener('click', () => { state.current = i; renderQuestion(); });
        map.appendChild(dot);
    });
}

function updateQuestionMap() {
    document.querySelectorAll('.q-dot').forEach((dot, i) => {
        const q = state.questions[i];
        dot.className = 'q-dot' + (state.answers[q.id] ? ' answered' : '') + (i === state.current ? ' current' : '');
    });
}

// ══════════════════════════════════════════════
// SUBMIT
// ══════════════════════════════════════════════
function submitTest(timeout = false) {
    clearInterval(state.timerRef);
    state.submitted = true;
    const timeTaken = Math.round((Date.now() - state.startTime) / 1000);

    let rawScore = 0;
    let catCorrect = { pattern: 0, numerical: 0, logical: 0, spatial: 0 };
    let catTotal = { pattern: 0, numerical: 0, logical: 0, spatial: 0 };

    state.questions.forEach(q => {
        catTotal[q.category]++;
        if (state.answers[q.id] === q.answer) {
            rawScore += SCORING.difficultyPoints[q.difficulty];
            catCorrect[q.category]++;
        }
    });

    let iq = SCORING.iqMean + ((rawScore - SCORING.populationMean) / SCORING.populationSD) * SCORING.iqSD;
    iq = Math.round(Math.max(SCORING.minIQ, Math.min(SCORING.maxIQ, iq)));

    const percentile = iqToPercentile(iq);
    const correct = state.questions.filter(q => state.answers[q.id] === q.answer).length;
    const answered = Object.keys(state.answers).length;
    const grade = getGrade(iq);

    showScreen('results');
    renderResults({ iq, percentile, correct, answered, timeTaken, catCorrect, catTotal, grade, timeout });
}

// ══════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════
function renderResults(data) {
    const { iq, percentile, correct, answered, timeTaken, catCorrect, catTotal, grade, timeout } = data;
    const total = state.questions.length;

    // Header
    $('userNameDisplay').textContent = `${state.userName}'s Results`;

    // IQ Ring
    $('iqScoreDisplay').textContent = iq;
    const pctOfRange = (iq - 55) / (160 - 55);
    setTimeout(() => {
        $('iqRingFill').style.strokeDashoffset = 427 * (1 - pctOfRange);
    }, 200);

    // Grade
    const gb = $('gradeBadge');
    gb.textContent = grade.label;
    gb.style.background = grade.bg;
    gb.style.color = grade.fg;
    $('gradeLabel').textContent = grade.label;
    $('gradeLabel').style.color = grade.color;
    $('gradeDesc').textContent = grade.desc;

    // Stats
    $('statPercentile').textContent = `${percentile}th`;
    $('statScore').textContent = `${correct}/${total}`;
    $('statTime').textContent = formatTime(timeTaken);
    $('statAnswered').textContent = `${answered}/${total}`;

    // Highlight IQ range cell
    highlightRangeCell(iq);

    // Bell curve
    drawBellCurve(iq);

    // Category bars
    const catBars = $('categoryBars');
    catBars.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, meta]) => {
        const pct = catTotal[key] > 0 ? Math.round((catCorrect[key] / catTotal[key]) * 100) : 0;
        catBars.innerHTML += `
      <div class="cat-bar-row">
        <div class="cat-bar-label">
          <div class="cat-icon-wrap" style="background:${meta.color}22">${meta.icon}</div>
          ${meta.label}
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:0%;background:${meta.color}" data-pct="${pct}"></div>
        </div>
        <div class="cat-pct">${pct}%</div>
      </div>
    `;
    });
    setTimeout(() => {
        document.querySelectorAll('.cat-bar-fill').forEach(b => { b.style.width = b.dataset.pct + '%'; });
    }, 300);

    // Store
    localStorage.setItem('iqTestLastResult', JSON.stringify({
        name: state.userName, iq, percentile, correct, total, time: timeTaken, date: new Date().toISOString()
    }));

    if (timeout) showToast('⏰ Time expired — auto-submitted');
}

function highlightRangeCell(iq) {
    document.querySelectorAll('.range-cell').forEach(cell => {
        cell.classList.remove('active-range');
        const min = parseInt(cell.dataset.min);
        if (
            (min === 145 && iq >= 145) ||
            (min === 130 && iq >= 130 && iq < 145) ||
            (min === 120 && iq >= 120 && iq < 130) ||
            (min === 110 && iq >= 110 && iq < 120) ||
            (min === 90 && iq >= 90 && iq < 110) ||
            (min === 0 && iq < 90)
        ) {
            cell.classList.add('active-range');
        }
    });
}

// ══════════════════════════════════════════════
// BELL CURVE (multi-color SD zones like reference)
// ══════════════════════════════════════════════
function drawBellCurve(userIQ) {
    const canvas = $('bellCurve');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const mu = 100, sigma = 15;
    const iqMin = 55, iqMax = 160;

    const pdf = x => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
    const iqToX = iq => ((iq - iqMin) / (iqMax - iqMin)) * W;

    // Scale to fit canvas
    const peakPdf = pdf(mu);
    const scaleY = (H - 36) / peakPdf;

    // Build points array
    const step = 0.4;
    const pts = [];
    for (let iq = iqMin; iq <= iqMax; iq += step) {
        pts.push({ x: iqToX(iq), y: H - 20 - pdf(iq) * scaleY, iq });
    }

    ctx.clearRect(0, 0, W, H);

    // ── SD ZONE FILLS (matches reference: purple/orange/green/blue/green/orange/purple) ──
    const zones = [
        { from: 55, to: 70, color: 'rgba(150,80,220,0.3)' },  // far left purple
        { from: 70, to: 85, color: 'rgba(240,130,40,0.3)' },  // left orange
        { from: 85, to: 100, color: 'rgba(60,180,80,0.3)' },  // left green
        { from: 100, to: 115, color: 'rgba(50,120,240,0.45)' },  // center blue
        { from: 115, to: 130, color: 'rgba(60,180,80,0.3)' },  // right green
        { from: 130, to: 145, color: 'rgba(240,130,40,0.3)' },  // right orange
        { from: 145, to: 160, color: 'rgba(150,80,220,0.3)' },  // far right purple
    ];

    zones.forEach(zone => {
        const zonePts = pts.filter(p => p.iq >= zone.from && p.iq <= zone.to);
        if (!zonePts.length) return;
        ctx.beginPath();
        ctx.moveTo(zonePts[0].x, H - 20);
        zonePts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(zonePts[zonePts.length - 1].x, H - 20);
        ctx.closePath();
        ctx.fillStyle = zone.color;
        ctx.fill();
    });

    // ── CURVE LINE ──
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── BASELINE ──
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.strokeStyle = '#c0c4d4';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── X-AXIS LABELS ──
    const markers = [55, 70, 85, 100, 115, 130, 145, 160];
    ctx.fillStyle = '#8888aa';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    markers.forEach(m => {
        const mx = iqToX(m);
        ctx.beginPath();
        ctx.moveTo(mx, H - 20);
        ctx.lineTo(mx, H - 15);
        ctx.strokeStyle = '#c0c4d4';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(m, mx, H - 4);
    });

    // ── SD % LABELS (like reference: 34%, 14%, 2%, 0.1%) ──
    ctx.fillStyle = '#4a4a6a';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    const pctLabels = [
        { iq: 77.5, label: '14%' },
        { iq: 92.5, label: '34%' },
        { iq: 107.5, label: '34%' },
        { iq: 122.5, label: '14%' },
    ];
    pctLabels.forEach(({ iq, label }) => {
        const px = iqToX(iq);
        const py = H - 20 - pdf(iq) * scaleY - 10;
        ctx.fillText(label, px, py);
    });

    // ── USER IQ VERTICAL LINE ──
    const ux = iqToX(userIQ);
    const uy = H - 20 - pdf(userIQ) * scaleY;
    ctx.beginPath();
    ctx.moveTo(ux, H - 20);
    ctx.lineTo(ux, uy);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── USER DOT ──
    ctx.beginPath();
    ctx.arc(ux, uy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2d445';
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── USER IQ LABEL ──
    const labelX = Math.max(22, Math.min(W - 22, ux));
    const labelY = Math.max(14, uy - 12);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 12px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`IQ ${userIQ}`, labelX, labelY);
}

// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatTime(secs) {
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
    if (z > 0) p = 1 - p;
    return p;
}

function iqToPercentile(iq) {
    return Math.round(normalCDF((iq - 100) / 15) * 100);
}

function getGrade(iq) {
    if (iq >= 145) return { label: "Genius", color: "#7c3aed", bg: "rgba(124,58,237,0.1)", fg: "#7c3aed", desc: "Extraordinary cognitive ability. Top 0.1% of population." };
    if (iq >= 130) return { label: "Very Superior", color: "#2563eb", bg: "rgba(37,99,235,0.1)", fg: "#2563eb", desc: "Highly gifted. Top 2% of population." };
    if (iq >= 120) return { label: "Superior", color: "#0891b2", bg: "rgba(8,145,178,0.1)", fg: "#0891b2", desc: "Well above average cognitive ability." };
    if (iq >= 110) return { label: "High Average", color: "#16a34a", bg: "rgba(22,163,74,0.1)", fg: "#16a34a", desc: "Above average intelligence." };
    if (iq >= 90) return { label: "Average", color: "#b45309", bg: "rgba(242,212,69,0.25)", fg: "#92400e", desc: "Within the typical range of intelligence." };
    if (iq >= 80) return { label: "Low Average", color: "#c2410c", bg: "rgba(248,113,75,0.15)", fg: "#c2410c", desc: "Slightly below average." };
    return { label: "Below Average", color: "#dc2626", bg: "rgba(239,68,68,0.1)", fg: "#dc2626", desc: "Below average cognitive performance on this test." };
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 2500);
}

function copyResults() {
    const last = JSON.parse(localStorage.getItem('iqTestLastResult') || '{}');
    const url = window.location.href.split('?')[0];
    const text = `🧠 My IQ Test Results\nName: ${last.name}\nIQ Score: ${last.iq}\nPercentile: ${last.percentile}th\nScore: ${last.correct}/${last.total}\n\nTake the test: ${url}`;
    navigator.clipboard.writeText(text).then(() => showToast('✓ Copied to clipboard!'));
}

function retake() {
    clearInterval(state.timerRef);
    state.submitted = false;
    showScreen('landing');
}

// ══════════════════════════════════════════════
// STATIC LANDING BELL CURVE (no user dot)
// ══════════════════════════════════════════════
function drawLandingBellCurve() {
    const canvas = document.getElementById('landingBellCurve');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const mu = 100, sigma = 15;
    const iqMin = 55, iqMax = 160;
    const pdf = x => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
    const iqToX = iq => ((iq - iqMin) / (iqMax - iqMin)) * W;
    const scaleY = (H - 36) / pdf(mu);

    const step = 0.4;
    const pts = [];
    for (let iq = iqMin; iq <= iqMax; iq += step) {
        pts.push({ x: iqToX(iq), y: H - 20 - pdf(iq) * scaleY, iq });
    }

    ctx.clearRect(0, 0, W, H);

    // SD zone fills — same colors as results bell curve
    const zones = [
        { from: 55, to: 70, color: 'rgba(150,80,220,0.28)' },
        { from: 70, to: 85, color: 'rgba(240,130,40,0.28)' },
        { from: 85, to: 100, color: 'rgba(60,180,80,0.28)' },
        { from: 100, to: 115, color: 'rgba(50,120,240,0.42)' },
        { from: 115, to: 130, color: 'rgba(60,180,80,0.28)' },
        { from: 130, to: 145, color: 'rgba(240,130,40,0.28)' },
        { from: 145, to: 160, color: 'rgba(150,80,220,0.28)' },
    ];

    zones.forEach(zone => {
        const zp = pts.filter(p => p.iq >= zone.from && p.iq <= zone.to);
        if (!zp.length) return;
        ctx.beginPath();
        ctx.moveTo(zp[0].x, H - 20);
        zp.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(zp[zp.length - 1].x, H - 20);
        ctx.closePath();
        ctx.fillStyle = zone.color;
        ctx.fill();
    });

    // Curve line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Baseline
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.strokeStyle = '#c0c4d4';
    ctx.lineWidth = 1;
    ctx.stroke();

    // X-axis labels
    const markers = [55, 70, 85, 100, 115, 130, 145, 160];
    ctx.fillStyle = '#8888aa';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    markers.forEach(m => {
        const mx = iqToX(m);
        ctx.beginPath();
        ctx.moveTo(mx, H - 20);
        ctx.lineTo(mx, H - 14);
        ctx.strokeStyle = '#c0c4d4';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#8888aa';
        ctx.fillText(m, mx, H - 4);
    });

    // Percentage labels (0.1%, 2%, 14%, 34%, 34%, 14%, 2%, 0.1%)
    const pctLabels = [
        { iq: 62.5, label: '0.1%' },
        { iq: 77.5, label: '2%' },
        { iq: 92.5, label: '14%' },
        { iq: 107.5, label: '34%' },
        { iq: 122.5, label: '14%' },
        { iq: 137.5, label: '2%' },
        { iq: 152.5, label: '0.1%' },
    ];
    ctx.fillStyle = '#4a4a6a';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    pctLabels.forEach(({ iq, label }) => {
        const px = iqToX(iq);
        const py = H - 20 - pdf(iq) * scaleY - 10;
        if (py > 14) ctx.fillText(label, px, py);
    });
}

// Draw landing bell curve once fonts/layout are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(drawLandingBellCurve, 100));
} else {
    setTimeout(drawLandingBellCurve, 100);
}
