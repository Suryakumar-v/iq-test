# 🧠 IQ Test

A free, shareable cognitive assessment with 70 questions across 7 cognitive domains. Get your estimated IQ score and see where you stand on the bell curve.

## 🔗 Live Site

**[https://suryakumar-v.github.io/iq-test/](https://suryakumar-v.github.io/iq-test/)**

---

## Features

- **70 questions** across 7 domains:
  - Pattern Recognition · Numerical Reasoning · Logical Reasoning · Spatial Reasoning
  - Visual Matrices (highest g-factor) · Working Memory · Processing Speed
- **30-minute timer** with auto-submit
- **G-factor weighted scoring** — matrices and patterns count more than speed
- **Difficulty-weighted IQ score** (scale: 55–160)
- **Bell curve** showing your exact position vs. the general population
- **Percentile rank** calculated via standard normal distribution
- **Category breakdown** — see how you did in each domain
- **Copy & share** your results with friends
- 100% client-side — no backend, no data collection

## Tech Stack

Pure HTML · CSS · JavaScript — no frameworks, no dependencies.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing, test, and results screens |
| `style.css` | Professional light theme |
| `questions.js` | 70 questions (7 domains) + g-factor weights + scoring config |
| `script.js` | Engine, timer, memory sequence, speed grid, IQ formula, bell curve |

## Scoring Formula

```
IQ = 100 + ((normalizedPct − 43) / 12) × 15
```

Each question is weighted by difficulty (1→2 pts … 5→16 pts) AND g-factor loading per domain (matrices 0.85, patterns 0.72, logical 0.70, numerical 0.68, spatial 0.65, memory 0.60, speed 0.50). Capped at [55, 160].

---

> ⚠️ This is an unofficial assessment for entertainment and self-reflection. Not equivalent to a professional psychometric evaluation (WAIS, Stanford-Binet, etc.).
