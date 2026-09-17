# 🎭 BUILDATHON 2026 — 3D Interactive Auditorium Seating Map

An ultra-modern, high-performance **3D Interactive Auditorium Seating System** built for **Buildathon 2026**. This web application provides event participants, organizers, and visitors with a seamless, visual way to explore seating arrangements, search for teams in real-time, and manage table allocations dynamically.

---

## ✨ Features

### 🏢 3D Interactive Visualizer
- **Realistic Auditorium Setup**: Features a detailed 3D stage, podium, presenter, numbered table cards, seating rows, and chairs built with Three.js & React Three Fiber.
- **Cinematic Camera System**: Smooth GSAP-driven camera transitions between Intro, Overview, and Table focus views.
- **Aisle Layout & Row Labels**: Clear, red row markers (A, B, C...) with a center walkway gap splitting columns into left and right halves.
- **Interactive Tables**: Click any table to zoom in and view detailed team member information.

### 🔍 Google-Style Public Team Search
- **Instant Search Bar**: Floating search bar at the bottom-center of the screen allowing users to search by **Team Name** or **Table ID** (e.g., `A1`, `B4`, `Quantum`).
- **Autocomplete & Keyboard Nav**: Real-time matching dropdown with full keyboard navigation support (`Up/Down` arrows, `Enter` to select, `Esc` to clear).
- **Direct Table Focus**: Selecting a team automatically animates the 3D camera to their table and opens their team panel.

### 👥 Team Allocation Panel
- **Flexible Team Sizes**: Supports team sizes from **1 to 4 members** seamlessly.
- **Rich Team Details**: Displays Team Name, assigned Table ID, Row, Column, and lists all team members with clean avatar icons.

### ⚙️ Admin Management System
- **Dynamic Seating Grid**: Adjust total rows (A–Z), columns, and total active tables on the fly.
- **Manual Team Editor**: Add, edit, or remove team members (1–4 per team) directly from the browser UI with instant 3D updates.
- **Bulk File Upload**: Import seating charts from **CSV**, **Excel (`.xlsx`)**, **PDF**, or **Images** (powered by OCR).
- **Persistence**: All seating configs and team data automatically persist in `localStorage`.

### ⚡ Lag-Free Performance Optimization
- **Shared Geometry & Materials**: Reusable module-level Three.js instances to avoid GC pauses.
- **Component Memoization**: `React.memo` applied across all 3D scene elements to eliminate unnecessary re-renders.
- **GPU Acceleration**: Hardware-accelerated CSS transitions with `translate3d` and `will-change` hints.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |
| **3D Rendering** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) |
| **3D Utilities** | [@react-three/drei](https://github.com/pmndrs/drei) |
| **Animations** | [GSAP 3](https://gsap.com/) |
| **File Parsing & OCR** | `xlsx` (Excel), `pdfjs-dist` (PDFs), `tesseract.js` (Image OCR) |
| **Linting** | [Oxlint](https://oxc.rs/) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "Seat Arrangements"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Open `http://localhost:5173` to launch the application.

---

## 📜 Available Scripts

- `npm run dev` — Starts Vite dev server with hot module replacement (HMR).
- `npm run build` — Runs TypeScript type checks (`tsc -b`) and builds production bundle in `dist/`.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs `oxlint` for fast JavaScript/TypeScript code linting.

---

## 📁 Project Structure

```
Seat Arrangements/
├── public/                  # Static assets
├── src/
│   ├── components/          # UI Components
│   │   ├── AdminPanel.tsx   # Admin drawer for grid config & team editing
│   │   ├── Auditorium.tsx   # 3D Auditorium environment (walls, floor, stage)
│   │   ├── IntroScreen.tsx  # Landing hero screen
│   │   ├── Navigation.tsx   # Top header navigation
│   │   ├── SeatingMap.tsx   # 3D grid layout & row label rendering
│   │   ├── TeamPanel.tsx    # Slide-over panel for team details
│   │   └── TeamSearch.tsx   # Public Google-style search bar component
│   ├── context/
│   │   └── AdminContext.tsx # Global state management & localStorage sync
│   ├── data/
│   │   └── teams.ts         # Initial team data & TypeScript interfaces
│   ├── scene/               # 3D Three.js / R3F Canvas components
│   │   ├── AuditoriumScene.tsx  # Main 3D Canvas container
│   │   ├── CameraController.tsx # GSAP camera animation controller
│   │   ├── ChairModel.tsx       # Memoized chair mesh
│   │   ├── TableCard.tsx        # Table top label mesh
│   │   └── TableModel.tsx       # Memoized 3D table mesh
│   ├── styles/
│   │   └── globals.css      # Custom styling, dark theme & animations
│   ├── utils/
│   │   └── sheetParser.ts   # File parser (Excel, CSV, PDF, OCR)
│   ├── App.tsx              # Main layout & state integration
│   └── main.tsx             # Application entry point
├── package.json             # Node dependencies & scripts
├── REQUIREMENTS.md          # System and functional requirements document
└── vite.config.ts           # Vite configuration
```

---

## 📖 Usage Guide

1. **Viewing the Auditorium**: Click **"Enter Auditorium"** on the hero screen to view the 3D seating grid.
2. **Finding a Team**: Type any team name or table code (e.g. `Alpha`, `A3`) into the bottom search bar to locate them instantly.
3. **Admin Setup**: Click the **Gear icon** in the top navigation bar to open the Admin Panel:
   - Adjust **Rows**, **Columns**, and **Number of Active Tables**.
   - Edit team names & members (1–4 per team).
   - Upload Excel (`.xlsx`), CSV, PDF, or image files to bulk load seating arrangements.

---

## 📄 License

Developed for **Buildathon 2026**. All rights reserved.
