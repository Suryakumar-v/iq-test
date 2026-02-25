'use strict';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let state = {
    userName: '',
    questions: [],        // shuffled subset
    current: 0,
    answers: {},          // { questionId: selectedOption }
    timeLeft: 25 * 60,   // 25 minutes in seconds
    timerRef: null,
    startTime: null,
    submitted: false
};

// ══════════════════════════════════════════════
// DOM HELPERS
// ══════════════════════════════════════════════
const $ = id => document.getElementById(id);
const show = id => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Landing screen
    $('startBtn').addEventListener('click', startTest);
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startTest(); });

    // Nav buttons
    $('prevBtn').addEventListener('click', () => navigate(-1));
    $('nextBtn').addEventListener('click', handleNext);

    // Submit / share
    $('copyBtn').addEventListener('click', copyResults);
    $('retakeBtn').addEventListener('click', retake);

    // Anti-cheat: warn on tab switch
    document.addEventListener('visibilitychange', () => {
        if (state.submitted || !state.startTime) return;
        if (document.hidden) showTabWarning();
    });

    // Disable right-click on test
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

    // Shuffle and pick all questions (all 40), shuffled per category
    const byCategory = {};
    QUESTIONS.forEach(q => {
        if (!byCategory[q.category]) byCategory[q.category] = [];
        byCategory[q.category].push(q);
    });

    let shuffled = [];
    Object.values(byCategory).forEach(arr => {
        shuffled = shuffled.concat(shuffle([...arr]));
    });
    state.questions = shuffle(shuffled);

    state.current = 0;
    state.answers = {};
    state.timeLeft = 25 * 60;
    state.submitted = false;
    state.startTime = Date.now();

    show('test');
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
        if (state.timeLeft <= 0) {
            clearInterval(state.timerRef);
            submitTest(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const secs = (state.timeLeft % 60).toString().padStart(2, '0');
    const el = $('timer');
    el.textContent = `${mins}:${secs}`;
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

    // Progress
    const pct = ((idx) / total * 100).toFixed(1);
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = `Question ${idx + 1} of ${total}`;

    // Category badge
    const catMeta = CATEGORIES[q.category];
    const badge = $('categoryBadge');
    badge.textContent = catMeta.label;
    badge.style.color = catMeta.color;
    badge.style.borderColor = catMeta.color;

    // Question number
    $('qNumber').textContent = `#${idx + 1}`;

    // Difficulty dots
    const dots = $('difficultyDots');
    dots.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i <= q.difficulty ? ' filled' : '');
        dots.appendChild(dot);
    }

    // Question text
    $('questionText').textContent = q.question;

    // Options (always shuffled, except store correct answer by value)
    const letters = ['A', 'B', 'C', 'D'];
    const shuffledOptions = shuffle([...q.options]);
    const grid = $('optionsGrid');
    grid.innerHTML = '';

    shuffledOptions.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (state.answers[q.id] === opt ? ' selected' : '');
        btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${escHtml(opt)}</span>`;
        btn.addEventListener('click', () => selectOption(q.id, opt));
        grid.appendChild(btn);
    });

    // Nav state
    $('prevBtn').disabled = idx === 0;
    $('nextBtn').textContent = idx === total - 1 ? 'Submit' : 'Next →';
    $('nextBtn').classList.toggle('primary', idx === total - 1);

    updateQuestionMap();
}

// ══════════════════════════════════════════════
// SELECT OPTION
// ══════════════════════════════════════════════
function selectOption(qId, opt) {
    state.answers[qId] = opt;
    // Refresh visual
    document.querySelectorAll('.option-btn').forEach(btn => {
        const text = btn.querySelector('span:last-child').textContent;
        btn.classList.toggle('selected', text === opt);
        btn.querySelector('.option-letter').style.background = text === opt ? 'var(--accent)' : '';
        btn.querySelector('.option-letter').style.color = text === opt ? '#fff' : '';
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
        // Show confirm
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
        dot.title = `Question ${i + 1}`;
        dot.addEventListener('click', () => { state.current = i; renderQuestion(); });
        map.appendChild(dot);
    });
}

function updateQuestionMap() {
    const dots = document.querySelectorAll('.q-dot');
    dots.forEach((dot, i) => {
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

    // Calculate raw weighted score
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

    // IQ Formula: IQ = 100 + ((rawScore - popMean) / popSD) * 15
    let iq = SCORING.iqMean + ((rawScore - SCORING.populationMean) / SCORING.populationSD) * SCORING.iqSD;
    iq = Math.round(Math.max(SCORING.minIQ, Math.min(SCORING.maxIQ, iq)));

    const percentile = iqToPercentile(iq);
    const answered = Object.keys(state.answers).length;
    const correct = state.questions.filter(q => state.answers[q.id] === q.answer).length;
    const grade = getGrade(iq);

    show('results');
    renderResults({ iq, percentile, rawScore, answered, correct, timeTaken, catCorrect, catTotal, grade, timeout });
}

// ══════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════
function renderResults(data) {
    const { iq, percentile, answered, correct, timeTaken, catCorrect, catTotal, grade, timeout } = data;
    const total = state.questions.length;

    // Header
    $('userNameDisplay').textContent = `${state.userName}'s Results`;
    if (timeout) {
        const note = document.createElement('p');
        note.style.cssText = 'color:var(--warning);font-size:0.8rem;margin-top:4px';
        note.textContent = '⏰ Time expired — auto-submitted';
        $('userNameDisplay').after(note);
    }

    // IQ Ring animation
    $('iqScoreDisplay').textContent = iq;
    const circumference = 427; // 2π × 68
    const pctOfRange = (iq - 55) / (160 - 55);
    const dashOffset = circumference * (1 - pctOfRange);
    setTimeout(() => {
        $('iqRingFill').style.strokeDashoffset = dashOffset;
    }, 200);

    // Grade badge
    const gradeBadge = $('gradeBadge');
    gradeBadge.textContent = grade.label;
    gradeBadge.style.background = grade.bg;
    gradeBadge.style.color = grade.fg;

    $('gradeLabel').textContent = grade.label;
    $('gradeLabel').style.color = grade.color;
    $('gradeDesc').textContent = grade.desc;

    // Stats
    $('statPercentile').textContent = `Top ${100 - percentile}%`;
    $('statScore').textContent = `${correct}/${total}`;
    $('statTime').textContent = formatTime(data.timeTaken);
    $('statAnswered').textContent = `${answered}/${total}`;

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
          <span class="cat-bar-icon">${meta.icon}</span>
          ${meta.label}
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:0%;background:${meta.color}" data-pct="${pct}"></div>
        </div>
        <div class="cat-bar-score">${catCorrect[key]}/${catTotal[key]}</div>
      </div>
    `;
    });

    // Animate bars
    setTimeout(() => {
        document.querySelectorAll('.cat-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.pct + '%';
        });
    }, 300);

    // Store results
    localStorage.setItem('iqTestLastResult', JSON.stringify({
        name: state.userName, iq, percentile, correct, total,
        time: data.timeTaken, date: new Date().toISOString()
    }));
}

// ══════════════════════════════════════════════
// BELL CURVE (Canvas)
// ══════════════════════════════════════════════
function drawBellCurve(userIQ) {
    const canvas = $('bellCurve');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const mu = 100, sigma = 15;
    const iqMin = 55, iqMax = 160;

    // Normal PDF
    const pdf = x => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

    // Map IQ → x pixel
    const iqToX = iq => ((iq - iqMin) / (iqMax - iqMin)) * W;

    // Find peak y for scaling
    const peakPdf = pdf(mu);
    const scaleY = (H - 40) / peakPdf;

    // Curve points
    const pts = [];
    for (let iq = iqMin; iq <= iqMax; iq += 0.5) {
        pts.push({ x: iqToX(iq), y: H - 20 - pdf(iq) * scaleY });
    }

    ctx.clearRect(0, 0, W, H);

    // Shade area left of user's IQ (percentile region)
    const userX = iqToX(userIQ);
    const gradient = ctx.createLinearGradient(0, 0, userX, 0);
    gradient.addColorStop(0, 'rgba(99,102,241,0.05)');
    gradient.addColorStop(1, 'rgba(99,102,241,0.25)');

    ctx.beginPath();
    ctx.moveTo(iqToX(iqMin), H - 20);
    pts.forEach(p => { if (p.x <= userX) ctx.lineTo(p.x, p.y); });
    ctx.lineTo(userX, H - 20);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main curve
    const curveGrad = ctx.createLinearGradient(0, 0, W, 0);
    curveGrad.addColorStop(0, '#6366f1');
    curveGrad.addColorStop(0.5, '#818cf8');
    curveGrad.addColorStop(1, '#10b981');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = curveGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Baseline
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // SD markers (70, 85, 100, 115, 130)
    const markers = [70, 85, 100, 115, 130];
    markers.forEach(m => {
        const mx = iqToX(m);
        ctx.beginPath();
        ctx.moveTo(mx, H - 20);
        ctx.lineTo(mx, H - 14);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${10 * dpr / dpr}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(m, mx, H - 4);
    });

    // User IQ line
    const lineGrad = ctx.createLinearGradient(userX, 0, userX, H);
    lineGrad.addColorStop(0, 'rgba(99,102,241,1)');
    lineGrad.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    ctx.moveTo(userX, H - 20);
    const userPdfY = H - 20 - pdf(userIQ) * scaleY;
    ctx.lineTo(userX, userPdfY);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // User IQ dot
    ctx.beginPath();
    ctx.arc(userX, userPdfY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // User IQ label
    const labelX = Math.max(30, Math.min(W - 30, userX));
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `bold 13px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`IQ ${userIQ}`, labelX, Math.max(14, userPdfY - 10));
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
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Normal CDF via rational approximation (Abramowitz & Stegun)
function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
    if (z > 0) p = 1 - p;
    return p;
}

function iqToPercentile(iq) {
    const z = (iq - 100) / 15;
    return Math.round(normalCDF(z) * 100);
}

function getGrade(iq) {
    if (iq >= 145) return { label: "Genius", color: "#818cf8", bg: "rgba(129,140,248,0.2)", fg: "#818cf8", desc: "Extraordinary cognitive ability. Top 0.1% of population." };
    if (iq >= 130) return { label: "Very Superior", color: "#6366f1", bg: "rgba(99,102,241,0.2)", fg: "#818cf8", desc: "Highly gifted. Top 2% of population." };
    if (iq >= 120) return { label: "Superior", color: "#0ea5e9", bg: "rgba(14,165,233,0.2)", fg: "#38bdf8", desc: "Well above average cognitive ability." };
    if (iq >= 110) return { label: "High Average", color: "#10b981", bg: "rgba(16,185,129,0.2)", fg: "#34d399", desc: "Above average intelligence." };
    if (iq >= 90) return { label: "Average", color: "#f59e0b", bg: "rgba(245,158,11,0.2)", fg: "#fbbf24", desc: "Within the typical range of intelligence." };
    if (iq >= 80) return { label: "Low Average", color: "#f97316", bg: "rgba(249,115,22,0.2)", fg: "#fb923c", desc: "Slightly below average." };
    return { label: "Below Average", color: "#ef4444", bg: "rgba(239,68,68,0.2)", fg: "#f87171", desc: "Below average cognitive performance on this test." };
}

function showTabWarning() {
    showToast('⚠️ Tab switch detected!', '#f59e0b');
}

function showToast(msg, bg = '#10b981') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toast.style.background = bg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

function copyResults() {
    const last = JSON.parse(localStorage.getItem('iqTestLastResult') || '{}');
    const url = window.location.href.split('?')[0];
    const text = `🧠 My IQ Test Results\n` +
        `Name: ${last.name}\n` +
        `IQ Score: ${last.iq}\n` +
        `Percentile: ${last.percentile}th\n` +
        `Score: ${last.correct}/${last.total}\n` +
        `Take the test: ${url}`;
    navigator.clipboard.writeText(text).then(() => showToast('✓ Results copied to clipboard!'));
}

function retake() {
    clearInterval(state.timerRef);
    state.submitted = false;
    show('landing');
}
