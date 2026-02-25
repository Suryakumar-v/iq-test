'use strict';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let state = {
    userName: '',
    questions: [],
    current: 0,
    answers: {},
    timeLeft: 30 * 60,   // 30 minutes for expanded test
    timerRef: null,
    memTimerRef: null,
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

    document.addEventListener('visibilitychange', () => {
        if (state.submitted || !state.startTime) return;
        if (document.hidden) showToast('⚠️ Tab switch detected!');
    });
    document.addEventListener('contextmenu', e => {
        if ($('test').classList.contains('active')) e.preventDefault();
    });

    setTimeout(drawLandingBellCurve, 150);
});

// ══════════════════════════════════════════════
// START TEST
// ══════════════════════════════════════════════
function startTest() {
    const name = $('nameInput').value.trim() || 'Anonymous';
    state.userName = name;

    // Shuffle within each category, then interleave
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
    state.timeLeft = 30 * 60;
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
// RENDER QUESTION — dispatches by type
// ══════════════════════════════════════════════
function renderQuestion() {
    clearInterval(state.memTimerRef);

    const q = state.questions[state.current];
    const idx = state.current;
    const total = state.questions.length;

    // Common UI
    $('progressFill').style.width = (idx / total * 100) + '%';
    $('qCounter').textContent = `${idx + 1}/${total}`;

    const catMeta = CATEGORIES[q.category] || CATEGORIES.pattern;
    $('categoryBadge').textContent = catMeta.label;
    $('categoryBadge').style.color = catMeta.color;
    $('qNumber').textContent = `Question ${idx + 1}`;

    // Difficulty pips
    const dots = $('difficultyDots');
    dots.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const pip = document.createElement('span');
        pip.className = 'diff-pip' + (i <= q.difficulty ? ' on' : '');
        dots.appendChild(pip);
    }

    // Dispatch to type renderer
    const type = q.type || 'standard';
    if (type === 'matrix') { renderMatrixQuestion(q); }
    else if (type === 'memory') { renderMemoryQuestion(q); }
    else if (type === 'speed') { renderSpeedQuestion(q); }
    else { renderStandardQuestion(q); }

    // Nav
    $('prevBtn').disabled = idx === 0;
    const isLast = idx === total - 1;
    $('nextBtn').textContent = isLast ? 'Submit ✓' : 'Next →';
    updateQuestionMap();
}

// ── Standard MCQ ──
function renderStandardQuestion(q) {
    $('matrixContainer').style.display = 'none';
    $('memoryContainer').style.display = 'none';
    $('speedContainer').style.display = 'none';
    $('questionText').style.display = 'block';
    $('optionsGrid').style.display = 'grid';

    $('questionText').textContent = q.question;
    renderOptions(q);
}

// ── Visual Matrix ──
function renderMatrixQuestion(q) {
    $('memoryContainer').style.display = 'none';
    $('speedContainer').style.display = 'none';
    $('questionText').style.display = 'block';
    $('optionsGrid').style.display = 'grid';
    $('matrixContainer').style.display = 'block';

    $('questionText').textContent = q.question;

    // Build matrix table
    const mc = $('matrixContainer');
    let html = '<table class="matrix-grid">';
    q.grid.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            const isMissing = cell === '?';
            html += `<td class="matrix-cell${isMissing ? ' missing' : ''}">${escHtml(cell)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    mc.innerHTML = html;

    renderOptions(q, true);
}

// ── Working Memory (timed sequence reveal) ──
function renderMemoryQuestion(q) {
    $('matrixContainer').style.display = 'none';
    $('speedContainer').style.display = 'none';
    $('memoryContainer').style.display = 'block';
    $('questionText').style.display = 'none';
    $('optionsGrid').style.display = 'none';

    // If already answered, just show question
    if (state.answers[q.id]) {
        showMemoryQuestion(q);
        return;
    }

    // Show sequence with countdown
    const dur = q.sequenceDuration || 5;
    let timeLeft = dur;

    $('memoryContainer').innerHTML = `
    <div class="mem-sequence-wrap">
      <div class="mem-label">Memorize this sequence:</div>
      <div class="mem-sequence">${q.sequence.join(' — ')}</div>
      <div class="mem-countdown-bar">
        <div class="mem-countdown-fill" id="memFill" style="width:100%"></div>
      </div>
      <div class="mem-timer-text">Hiding in <span id="memSecs">${timeLeft}</span>s…</div>
    </div>
  `;

    state.memTimerRef = setInterval(() => {
        timeLeft--;
        const fillEl = $('memFill');
        const secsEl = $('memSecs');
        if (fillEl) fillEl.style.width = (timeLeft / dur * 100) + '%';
        if (secsEl) secsEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(state.memTimerRef);
            showMemoryQuestion(q);
        }
    }, 1000);
}

function showMemoryQuestion(q) {
    $('memoryContainer').innerHTML = `
    <div class="mem-hidden-notice">🔒 Sequence hidden — answer from memory</div>
  `;
    $('questionText').style.display = 'block';
    $('optionsGrid').style.display = 'grid';
    $('questionText').textContent = q.question;
    renderOptions(q);
}

// ── Processing Speed (symbol grid) ──
function renderSpeedQuestion(q) {
    $('matrixContainer').style.display = 'none';
    $('memoryContainer').style.display = 'none';
    $('questionText').style.display = 'block';
    $('optionsGrid').style.display = 'grid';
    $('speedContainer').style.display = 'block';

    // Build symbol grid
    const sc = $('speedContainer');
    const gridHtml = q.grid.map(row =>
        `<div class="speed-row">${row.split(' ').map(sym =>
            `<span class="speed-sym${sym === q.target ? ' speed-target-sym' : ''}">${escHtml(sym)}</span>`
        ).join('')}</div>`
    ).join('');

    sc.innerHTML = `
    <div class="speed-label">Find all <strong class="speed-find">${escHtml(q.target)}</strong> symbols:</div>
    <div class="speed-grid">${gridHtml}</div>
  `;

    $('questionText').textContent = q.question;
    renderOptions(q);
}

// ── Options renderer ──
function renderOptions(q, symbolMode = false) {
    const letters = ['A', 'B', 'C', 'D'];
    const shuffledOpts = q.type === 'memory' ? [...q.options] : shuffle([...q.options]);
    const grid = $('optionsGrid');
    grid.innerHTML = '';

    shuffledOpts.forEach((opt, i) => {
        const btn = document.createElement('button');
        const sel = state.answers[q.id] === opt;
        btn.className = 'option-btn' + (sel ? ' selected' : '');
        btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${escHtml(opt)}</span>`;
        btn.addEventListener('click', () => selectOption(q.id, opt));
        grid.appendChild(btn);
    });
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
    clearInterval(state.memTimerRef);
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
        dot.title = CATEGORIES[q.category]?.label || '';
        dot.addEventListener('click', () => {
            clearInterval(state.memTimerRef);
            state.current = i;
            renderQuestion();
        });
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
// SUBMIT + G-FACTOR WEIGHTED SCORING
// ══════════════════════════════════════════════
function submitTest(timeout = false) {
    clearInterval(state.timerRef);
    clearInterval(state.memTimerRef);
    state.submitted = true;
    const timeTaken = Math.round((Date.now() - state.startTime) / 1000);

    let weightedScore = 0;
    let maxWeightedScore = 0;
    const catCorrect = {};
    const catTotal = {};

    state.questions.forEach(q => {
        const cat = q.category;
        const gw = G_WEIGHTS[cat] || 0.65;
        const dpts = SCORING.difficultyPoints[q.difficulty] || 4;
        const ws = gw * dpts;

        if (!catCorrect[cat]) { catCorrect[cat] = 0; catTotal[cat] = 0; }
        catTotal[cat]++;
        maxWeightedScore += ws;

        if (state.answers[q.id] === q.answer) {
            weightedScore += ws;
            catCorrect[cat]++;
        }
    });

    // Normalized % → IQ
    const normalizedPct = (weightedScore / maxWeightedScore) * 100;
    let iq = SCORING.iqMean + ((normalizedPct - SCORING.populationMeanPct) / SCORING.populationSdPct) * SCORING.iqSD;
    iq = Math.round(Math.max(SCORING.minIQ, Math.min(SCORING.maxIQ, iq)));

    const percentile = iqToPercentile(iq);
    const correct = state.questions.filter(q => state.answers[q.id] === q.answer).length;
    const answered = Object.keys(state.answers).length;
    const grade = getGrade(iq);

    showScreen('results');
    renderResults({
        iq, percentile, correct, answered, timeTaken, catCorrect, catTotal, grade, timeout,
        normalizedPct: normalizedPct.toFixed(1)
    });
}

// ══════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════
function renderResults(data) {
    const { iq, percentile, correct, answered, timeTaken, catCorrect, catTotal, grade, timeout } = data;
    const total = state.questions.length;

    $('userNameDisplay').textContent = `${state.userName}'s Results`;

    // IQ ring
    $('iqScoreDisplay').textContent = iq;
    const pctOfRange = (iq - 55) / (160 - 55);
    setTimeout(() => { $('iqRingFill').style.strokeDashoffset = 427 * (1 - pctOfRange); }, 200);

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

    highlightRangeCell(iq);
    drawBellCurve(iq);

    // Category bars — show all 7 domains
    const catBars = $('categoryBars');
    catBars.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([key, meta]) => {
        const tot = catTotal[key] || 0;
        const cor = catCorrect[key] || 0;
        const pct = tot > 0 ? Math.round((cor / tot) * 100) : 0;
        catBars.innerHTML += `
      <div class="cat-bar-row">
        <div class="cat-bar-label">
          <div class="cat-icon-wrap" style="background:${meta.color}22">${meta.icon}</div>
          ${meta.label}
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:0%;background:${meta.color}" data-pct="${pct}"></div>
        </div>
        <div class="cat-pct">${tot > 0 ? pct + '%' : '—'}</div>
      </div>`;
    });
    setTimeout(() => {
        document.querySelectorAll('.cat-bar-fill').forEach(b => { b.style.width = b.dataset.pct + '%'; });
    }, 300);

    localStorage.setItem('iqTestLastResult', JSON.stringify({
        name: state.userName, iq, percentile, correct, total, time: timeTaken, date: new Date().toISOString()
    }));

    if (timeout) showToast('⏰ Time expired — auto-submitted');
}

function highlightRangeCell(iq) {
    document.querySelectorAll('.range-cell').forEach(cell => {
        cell.classList.remove('active-range');
        const min = parseInt(cell.dataset.min);
        if ((min === 145 && iq >= 145) || (min === 130 && iq >= 130 && iq < 145) ||
            (min === 120 && iq >= 120 && iq < 130) || (min === 110 && iq >= 110 && iq < 120) ||
            (min === 90 && iq >= 90 && iq < 110) || (min === 0 && iq < 90)) {
            cell.classList.add('active-range');
        }
    });
}

// ══════════════════════════════════════════════
// BELL CURVE (results — with user dot)
// ══════════════════════════════════════════════
function drawBellCurve(userIQ) {
    const canvas = $('bellCurve');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const mu = 100, sigma = 15, iqMin = 55, iqMax = 160;
    const pdf = x => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
    const iqToX = iq => ((iq - iqMin) / (iqMax - iqMin)) * W;
    const scaleY = (H - 36) / pdf(mu);

    const pts = [];
    for (let iq = iqMin; iq <= iqMax; iq += 0.4) pts.push({ x: iqToX(iq), y: H - 20 - pdf(iq) * scaleY, iq });

    ctx.clearRect(0, 0, W, H);
    _drawBellZones(ctx, pts, H, iqToX, userIQ);
    _drawBellCurve(ctx, pts);
    _drawBaseline(ctx, W, H);
    _drawXLabels(ctx, iqToX, H);
    _drawPctLabels(ctx, pdf, iqToX, scaleY, H);
    _drawUserLine(ctx, pdf, iqToX, scaleY, H, userIQ);
}

function _drawBellZones(ctx, pts, H, iqToX, userIQ) {
    const zones = [
        { from: 55, to: 70, color: 'rgba(150,80,220,0.28)' },
        { from: 70, to: 85, color: 'rgba(240,130,40,0.28)' },
        { from: 85, to: 100, color: 'rgba(60,180,80,0.28)' },
        { from: 100, to: 115, color: 'rgba(50,120,240,0.42)' },
        { from: 115, to: 130, color: 'rgba(60,180,80,0.28)' },
        { from: 130, to: 145, color: 'rgba(240,130,40,0.28)' },
        { from: 145, to: 160, color: 'rgba(150,80,220,0.28)' }
    ];
    zones.forEach(z => {
        const zp = pts.filter(p => p.iq >= z.from && p.iq <= z.to);
        if (!zp.length) return;
        ctx.beginPath();
        ctx.moveTo(zp[0].x, H - 20);
        zp.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(zp[zp.length - 1].x, H - 20);
        ctx.closePath();
        ctx.fillStyle = z.color;
        ctx.fill();
    });
}

function _drawBellCurve(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.stroke();
}

function _drawBaseline(ctx, W, H) {
    ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20);
    ctx.strokeStyle = '#c0c4d4'; ctx.lineWidth = 1; ctx.stroke();
}

function _drawXLabels(ctx, iqToX, H) {
    const markers = [55, 70, 85, 100, 115, 130, 145, 160];
    ctx.fillStyle = '#8888aa'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
    markers.forEach(m => {
        const mx = iqToX(m);
        ctx.beginPath(); ctx.moveTo(mx, H - 20); ctx.lineTo(mx, H - 14);
        ctx.strokeStyle = '#c0c4d4'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#8888aa'; ctx.fillText(m, mx, H - 4);
    });
}

function _drawPctLabels(ctx, pdf, iqToX, scaleY, H) {
    const labels = [{ iq: 92.5, label: '34%' }, { iq: 107.5, label: '34%' }, { iq: 77.5, label: '14%' }, { iq: 122.5, label: '14%' }];
    ctx.fillStyle = '#4a4a6a'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'center';
    labels.forEach(({ iq, label }) => ctx.fillText(label, iqToX(iq), H - 20 - pdf(iq) * scaleY - 10));
}

function _drawUserLine(ctx, pdf, iqToX, scaleY, H, userIQ) {
    const ux = iqToX(userIQ), uy = H - 20 - pdf(userIQ) * scaleY;
    ctx.beginPath(); ctx.moveTo(ux, H - 20); ctx.lineTo(ux, uy);
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(ux, uy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2d445'; ctx.fill();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.stroke();
    const lx = Math.max(22, Math.min(iqToX(160) - 22, ux));
    ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 12px Space Grotesk,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`IQ ${userIQ}`, lx, Math.max(14, uy - 10));
}

// ══════════════════════════════════════════════
// STATIC LANDING BELL CURVE
// ══════════════════════════════════════════════
function drawLandingBellCurve() {
    const canvas = document.getElementById('landingBellCurve');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) { setTimeout(drawLandingBellCurve, 200); return; }
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const mu = 100, sigma = 15, iqMin = 55, iqMax = 160;
    const pdf = x => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
    const iqToX = iq => ((iq - iqMin) / (iqMax - iqMin)) * W;
    const scaleY = (H - 36) / pdf(mu);

    const pts = [];
    for (let iq = iqMin; iq <= iqMax; iq += 0.4) pts.push({ x: iqToX(iq), y: H - 20 - pdf(iq) * scaleY, iq });

    ctx.clearRect(0, 0, W, H);
    _drawBellZones(ctx, pts, H, iqToX, null);
    _drawBellCurve(ctx, pts);
    _drawBaseline(ctx, W, H);
    _drawXLabels(ctx, iqToX, H);

    // Pct labels including outer zones for landing
    const allLabels = [{ iq: 62.5, l: '0.1%' }, { iq: 77.5, l: '2%' }, { iq: 92.5, l: '14%' },
    { iq: 107.5, l: '34%' }, { iq: 122.5, l: '14%' }, { iq: 137.5, l: '2%' }, { iq: 152.5, l: '0.1%' }];
    ctx.fillStyle = '#4a4a6a'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'center';
    allLabels.forEach(({ iq, l }) => {
        const py = H - 20 - pdf(iq) * scaleY - 10;
        if (py > 14) ctx.fillText(l, iqToX(iq), py);
    });
}

// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
}
function formatTime(secs) { const m = Math.floor(secs / 60), s = secs % 60; return m > 0 ? `${m}m ${s}s` : `${s}s`; }
function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
    if (z > 0) p = 1 - p; return p;
}
function iqToPercentile(iq) { return Math.round(normalCDF((iq - 100) / 15) * 100); }

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
    toast.className = 'toast'; toast.textContent = msg;
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
    clearInterval(state.memTimerRef);
    state.submitted = false;
    showScreen('landing');
    setTimeout(drawLandingBellCurve, 150);
}
