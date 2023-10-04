# ⚖️ 1:1 Balance Studio

> **Executive Communication & Management Intelligence Platform**

1:1 Balance Studio helps engineering managers and leaders run balanced, high-impact 1:1 meetings. Track talk-time ratios, monitor question dynamics, extract commitments automatically, and maintain strong relationship health scores across your team—all with privacy-first local storage and encryption.

---

## ✨ Features

- 🎙️ **Transcript & Speech Analytics**: Real-time talk-time ratio visualizer, question balance, and agenda topic split.
- ⚡ **1:1 Meeting Prep Assistant**: Auto-generates structured 5-bullet agendas based on open commitments and past session context.
- ✉️ **Smart Follow-up Generator**: One-click formatted email & Slack message summaries for meeting follow-ups.
- 🎯 **Commitments Hub**: Due-date badges, overdue warning pulse, multi-select batch updates, and manual commitment creation.
- 📊 **Executive Analytics**: 4-axis Engagement Radar chart, 4-month Heatmap, and Relationship Health Score (0–100).
- 🏷️ **Session Tone Classification**: Classifies sessions into Coaching, Status Update, Problem Solving, or Directive modes.
- 🔍 **Global Command Palette (`⌘K`)**: Instant search across direct reports, session notes, and action items.
- 🎙️ **Voice & Audio Mode**: Audio file dropzone & simulated speech-to-text transcription editor.
- 🔥 **Management Consistency Badges**: Gamified milestone badges for sync streaks, master listener, and execution velocity.
- 👤 **Direct Report Executive Profile (`/reports/[id]`)**: Full dedicated profile view with printable briefing format and timeline.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Vanilla CSS Design System with Tailwind Utilities & Glassmorphism
- **Charts**: Recharts & Custom SVG Visualizers
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/omm-prakash18/1-on-1-balance-studio.git
cd 1-on-1-balance-studio
npm install
```

### 2. Environment Setup
Copy the `.env.example` template to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Database Migration
Initialize SQLite database:
```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

All `.env` environment secret files and SQLite database files (`*.db`) are strictly excluded in `.gitignore` to prevent any sensitive data leakages.

---

## 📄 License

MIT © [omm-prakash18](https://github.com/omm-prakash18)
