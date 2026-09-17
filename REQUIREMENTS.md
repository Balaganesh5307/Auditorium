# 📋 System & Project Requirements — BUILDATHON 2026

This document specifies all system prerequisites, software dependencies, functional requirements, and technical standards for the **BUILDATHON 2026 3D Auditorium Seating Map Application**.

---

## 1. 🖥️ System & Environment Requirements

### Developer / Host System Requirements
- **Operating System**: Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)
- **Node.js Environment**: Node.js `v18.0.0` or higher (LTS recommended)
- **Package Manager**: `npm` `v9.0.0` or higher (bundled with Node.js)
- **Disk Space**: At least 500 MB free space for `node_modules` and build output

### User Hardware & Browser Requirements
- **Web Browser**: Any modern web browser with WebGL 2.0 support:
  - Google Chrome / Chromium `v90+`
  - Mozilla Firefox `v88+`
  - Microsoft Edge `v90+`
  - Apple Safari `v15+`
- **Graphics / Hardware Acceleration**: Hardware-accelerated GPU enabled in browser settings for 60 FPS 3D rendering.
- **Display Resolution**: 1024×768 minimum; optimal at 1920×1080 (Full HD).

---

## 2. 📦 Core Software Dependencies

### Runtime Dependencies (`dependencies`)

| Package | Minimum Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^19.2.8` | UI framework |
| `react-dom` | `^19.2.8` | DOM renderer for React |
| `three` | `^0.185.1` | WebGL 3D rendering engine |
| `@react-three/fiber` | `^9.7.0` | React renderer wrapper for Three.js |
| `@react-three/drei` | `^10.7.8` | Helper components & controls for R3F |
| `@react-three/postprocessing` | `^3.1.1` | Post-processing effects framework |
| `gsap` | `^3.15.0` | High-performance camera and UI animation library |
| `xlsx` | `^0.18.5` | Excel file parsing and team data import |
| `pdfjs-dist` | `^6.3.289` | PDF parsing for seating layout document imports |
| `tesseract.js` | `^7.0.0` | Client-side OCR engine for importing image-based seating charts |

### Development Dependencies (`devDependencies`)

| Package | Minimum Version | Purpose |
| :--- | :--- | :--- |
| `vite` | `^8.2.2` | Next-generation frontend tooling and dev server |
| `typescript` | `~6.0.2` | Static typing and language support |
| `@types/react` | `^19.2.18` | TypeScript definitions for React |
| `@types/react-dom` | `^19.2.4` | TypeScript definitions for React DOM |
| `@types/three` | `^0.185.4` | TypeScript definitions for Three.js |
| `@types/node` | `^24.13.3` | TypeScript definitions for Node environment |
| `@vitejs/plugin-react` | `^6.1.0` | Fast React refresh plugin for Vite |
| `oxlint` | `^1.79.0` | Ultra-fast linter for JavaScript & TypeScript |

---

## 3. 🎯 Functional Requirements Specification

### F-1: 3D Scene & Visualization
1. **Auditorium Model**: Must render a 3D floor, side walls, back wall, stage, presenter podium, and presenter mannequin.
2. **Seating Layout**:
   - Configurable grid layout (Rows A through Z, configurable columns).
   - Horizontal walkway aisle gap (`6.5` units) splitting columns into two balanced left and right halves.
   - Distinct red row labels positioned on both outer sides of the seating blocks without circular background frames.
3. **Table & Chair Representation**:
   - Each table must display a visible table card showing the table ID (e.g. `A1`, `B4`).
   - 4 chair models positioned around each active table.
4. **Interactive Camera**:
   - Orbit controls supporting pan, zoom, and rotate.
   - Smooth GSAP camera focus transition when clicking a table or selecting a search result.

### F-2: Public Team Search Logic
1. **Search Bar**:
   - Floating search bar positioned centrally at the bottom of the viewer.
   - Case-insensitive real-time matching against Team Names and Table IDs.
2. **Autocomplete Suggestions**:
   - Dropdown overlay displaying top matches with Team Name and assigned Table ID.
   - Keyboard interaction support (`Up`, `Down`, `Enter`, `Escape`).
3. **Action on Selection**:
   - Camera animates directly to target table coordinates.
   - Table details panel automatically slides open with team details.

### F-3: Team Detail Display
1. **Member Capacity**: Must correctly display teams with **1, 2, 3, or 4 members** (not forced to exactly 4).
2. **Details Shown**: Team Name, Table ID, Row Letter, Column Number, and Member Names list.

### F-4: Admin Control & Data Persistence
1. **Grid Control**: Admin panel must allow real-time changes to total rows, columns, and active table count.
2. **Manual Editor**: Admin must be able to edit team names and individual member names for any table.
3. **File Import**: Support drag-and-drop file import supporting `.xlsx`, `.csv`, `.pdf`, and image files (`.png`, `.jpg`).
4. **LocalStorage Persistence**: Config and team state must automatically save under key `buildathon_admin_config` and restore upon page refresh.

---

## 4. ⚡ Non-Functional Requirements & Performance Standards

1. **Frame Rate**: Minimum 60 FPS under normal browsing conditions.
2. **Animation Liquidity**: Zero lag or micro-stuttering during camera transitions, search dropdown interactions, and panel toggles.
3. **Memory Optimization**:
   - Re-use shared geometries and materials across 3D meshes to minimize WebGL context overhead.
   - Strict component memoization (`React.memo`).
4. **Response Time**: Search autocomplete suggestions render in `< 50ms` from user keystroke.
5. **Cross-Browser Compatibility**: Consistent layout and behavior across Chrome, Firefox, Edge, and Safari.
