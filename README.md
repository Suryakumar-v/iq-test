# 🧠 IQ Test

A free, shareable cognitive assessment with 40 questions across 4 domains. Get your estimated IQ score and see where you stand on the bell curve.

## 🔗 Live Site

**[https://suryakumar-v.github.io/iq-test/](https://suryakumar-v.github.io/iq-test/)**

---

## Features

- **40 questions** — Pattern Recognition, Numerical Reasoning, Logical Reasoning, Spatial Reasoning
- **25-minute timer** with auto-submit
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
| `questions.js` | 40 questions + scoring config |
| `script.js` | Engine, timer, IQ formula, bell curve |

## Scoring Formula

```
IQ = 100 + ((weightedScore − 70) / 30) × 15
```

Harder questions carry more weight (difficulty 1→2 pts, difficulty 5→16 pts). Capped at [55, 160].

---

> ⚠️ This is an unofficial assessment for entertainment and self-reflection. Not equivalent to a professional psychometric evaluation (WAIS, Stanford-Binet, etc.).
