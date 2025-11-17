# Guitar Assistant - GitHub Copilot Instructions

## Project Overview

Guitar Assistant is a TypeScript/React web application that helps beginning guitar players learn songs from PDF tabs with auto-scrolling and visual finger position guidance.

**Key Features:**
- Auto-scrolling tabs with variable speed (25%-200%)
- Dark mode UI optimized for practice
- Color-coded finger position indicators
- PDF upload and parsing
- Canvas-based tab rendering
- Horizontal scrolling playback

## Technology Stack

- **Framework:** React 18 + TypeScript + Vite 7 (with RSC support)
- **PDF Processing:** PDF.js
- **Rendering:** HTML5 Canvas API
- **Styling:** CSS3 (dark mode only)
- **State Management:** React hooks (useState, useEffect, useRef)

## Project Structure

```
guitar-assistant-app/
├── src/
│   ├── components/
│   │   ├── FileUpload/FileUpload.tsx    # PDF upload with drag-drop
│   │   └── TabViewer/TabViewer.tsx      # Main tab display + controls
│   ├── models/
│   │   └── Tab.ts                       # Core data models (Tab, Measure, Note, etc.)
│   ├── parsers/
│   │   └── tabParser.ts                 # PDF text → Tab structure
│   ├── playback/
│   │   └── ScrollController.ts          # Auto-scroll timing controller
│   ├── rendering/
│   │   └── TabRenderer.ts               # Canvas-based tab visualization
│   ├── utils/
│   │   └── fingeringCalculator.ts       # Fingering position algorithm
│   ├── App.tsx                          # Main app component ('use client')
│   ├── root.tsx                         # RSC root component
│   ├── App.css                          # Dark mode styles
│   └── index.css                        # Global styles
├── docs/                                # Project documentation
└── public/                              # Static assets
```

## Core Architecture

### Data Flow
```
PDF File → FileUpload → parseTabText() → Tab Model → TabViewer
                                            ↓
                                      TabRenderer (Canvas)
                                            ↓
                                    ScrollController → Position Updates
```

### Key Components

#### 1. Tab Data Model (`models/Tab.ts`)
```typescript
interface Tab {
  id: string;
  title: string;
  artist: string;
  tuning: Tuning;
  tempo: number;              // BPM
  timeSignature: string;      // "4/4"
  sections: Section[];
  measures: Measure[];
}

interface Measure {
  number: number;
  chord?: string;             // C, G, D, Em, etc.
  notes: Note[];
  techniques?: string[];      // ["P.M.", "slide", etc.]
  duration: number;
}

interface Note {
  string: number;             // 1-6 (1=high E, 6=low E)
  fret: number;               // 0-24
  startTime: number;          // Position in measure (0-1)
  duration: number;
  finger?: number;            // 1-4 for fingering
}
```

#### 2. ScrollController (`playback/ScrollController.ts`)
- Manages auto-scroll timing using `requestAnimationFrame`
- Calculates position based on BPM and time signature
- Callbacks: `onPositionChange`, `onComplete`
- Methods: `play()`, `pause()`, `stop()`, `setSpeed()`, `setPosition()`

#### 3. TabRenderer (`rendering/TabRenderer.ts`)
- Canvas-based rendering with dark theme
- Renders visible measures based on scroll position
- Draws: string lines, fret numbers, chord labels, playhead, finger positions
- Dark mode colors: BG `#1a1a1a`, strings `#444`, playhead `#ef4444`
- Finger colors: Blue (1), Green (2), Orange (3), Red (4)

#### 4. TabViewer (`components/TabViewer/TabViewer.tsx`)
- Manages renderer and controller refs
- Handles play/pause/stop/speed/position changes
- Responsive canvas sizing
- Control panel UI

## Development Commands

```bash
# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new dependency
npm install <package-name>
```

## Code Style & Patterns

### TypeScript
- Use `type` imports: `import type { Tab } from '../models/Tab'`
- Avoid unused variables (TSC will error)
- Use interfaces for data models
- Use classes for controllers/renderers

### React
- Functional components with hooks
- Client components must have `'use client'` directive
- Use refs for canvas, renderer, controller instances
- Clean up in useEffect return callbacks

### Canvas Rendering
- Clear canvas on each frame: `ctx.clearRect()`
- Draw only visible measures (performance optimization)
- Use proper text baselines: `ctx.textBaseline = 'middle'`
- Scale measurements: `MEASURE_WIDTH = 220px`, `STRING_SPACING = 24px`

### Dark Mode Colors
```typescript
BG_COLOR = '#1a1a1a'
STRING_COLOR = '#444'
TEXT_COLOR = '#e0e0e0'
CHORD_COLOR = '#60a5fa'      // Blue
PLAYHEAD_COLOR = '#ef4444'   // Red
FINGER_COLORS = ['', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
```

## Key Algorithms

### Finger Position Calculation
```typescript
// From fingeringCalculator.ts
// Assigns fingers 1-4 based on fret span and relative position
// If span ≤ 3 frets: standard position (index on min fret)
// If span > 3: distribute fingers proportionally
```

### Auto-Scroll Timing
```typescript
// From ScrollController.ts
beatsPerSecond = (tempo / 60) * speed
measuresPerSecond = beatsPerSecond / beatsPerMeasure
currentPosition += measuresPerSecond * deltaTime
```

### Canvas Rendering Position
```typescript
// Smooth scrolling: fractional offset
fractionalOffset = scrollPosition - Math.floor(scrollPosition)
xOffset = -fractionalOffset * MEASURE_WIDTH

// Playhead always at center: canvas.width / 2
```

## Common Tasks

### Adding a New Feature
1. Update data model in `models/Tab.ts` if needed
2. Update parser in `parsers/tabParser.ts` if input changes
3. Update renderer in `rendering/TabRenderer.ts` for visualization
4. Update UI in `components/TabViewer/TabViewer.tsx` for controls

### Fixing Rendering Issues
- Check `TabRenderer.render()` method
- Verify canvas size: `canvas.width` and `canvas.height`
- Check scroll position calculations
- Use browser DevTools to inspect canvas

### Debugging Scroll Issues
- Check `ScrollController.animate()` loop
- Verify BPM and time signature values
- Check `onPositionChange` callback firing
- Console.log `currentPosition` values

### Adding New Controls
1. Add state in `TabViewer` component
2. Create UI element in JSX
3. Add event handler
4. Call appropriate controller/renderer method
5. Update styles in `App.css`

## Current Limitations & TODOs

### Parser (tabParser.ts)
- Currently creates sample data (C-G-D-Em progression)
- TODO: Implement full PDF tab parsing logic
- TODO: Handle multiple tab formats
- TODO: Detect time signatures and tempo from PDF

### Features Not Yet Implemented
- Section looping (loop between two measures)
- Keyboard shortcuts
- Audio input recognition (Phase 3)
- Practice statistics
- Save/load favorite tabs
- Multiple speed presets

## Testing

### Manual Testing Checklist
- [ ] Upload PDF tab
- [ ] Play/pause/stop controls work
- [ ] Speed adjustment (25%-200%)
- [ ] Position slider navigation
- [ ] Canvas responsive to window resize
- [ ] Finger positions display correctly
- [ ] Dark mode colors correct
- [ ] No console errors

### Test with Sample Tab
Located at: `../tabs/mymusicfive_305112_[Guitar Tab Master] KPop Demon Hunters - Golden.pdf`

## Performance Considerations

- Only render visible measures (+ 1 buffer)
- Use `requestAnimationFrame` for smooth animation
- Avoid creating new objects in animation loop
- Debounce resize events if needed
- Canvas size: keep reasonable (e.g., 1200x300)

## Styling Guidelines

- All components use dark mode
- Primary blue: `#60a5fa` (chords, links)
- Danger red: `#ef4444` (playhead, pinky)
- Success green: `#10b981` (middle finger)
- Warning orange: `#f59e0b` (ring finger)
- Background: `#1a1a1a` main, `#242424` cards
- Use `border-radius: 8-12px` for modern look
- Hover effects: slight lift (`translateY(-2px)`)

## Dependencies

```json
{
  "pdfjs-dist": "^4.x.x",      // PDF parsing
  "react": "^18.x.x",          // UI framework
  "vite": "^7.x.x"             // Build tool
}
```

## Troubleshooting

### PDF.js Worker Errors
- Worker is loaded from CDN: `cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
- Check `FileUpload.tsx` for worker configuration
- DOMMatrix errors in terminal are expected in RSC setup (client-side only)

### Canvas Not Rendering
- Check canvas ref is attached: `canvasRef.current`
- Verify canvas size is set: `canvas.width` and `canvas.height`
- Check renderer is initialized: `rendererRef.current`
- Call `render()` after state changes

### Auto-Scroll Not Working
- Check controller is initialized: `controllerRef.current`
- Verify `play()` is called
- Check callback is set: `setPositionChangeCallback`
- Verify `totalMeasures` is set correctly

## Git Workflow

- Main branch: production-ready code
- Feature branches: `feature/feature-name`
- Commit messages: Clear, descriptive
- Test locally before committing

## Future Enhancements Roadmap

### Phase 2: Enhanced Features
- [ ] Advanced PDF tab parser (handle complex formats)
- [ ] Section looping functionality
- [ ] Keyboard shortcuts (Space, arrows, +/-)
- [ ] BPM detection from PDF
- [ ] Multiple tab format support

### Phase 3: Audio Integration
- [ ] Web Audio API integration
- [ ] Microphone input capture
- [ ] Pitch detection (CREPE or similar)
- [ ] Real-time note comparison
- [ ] Visual feedback for correct/incorrect notes

### Phase 4: Polish
- [ ] PWA with offline support
- [ ] Tab library management
- [ ] Practice session export
- [ ] Mobile responsiveness improvements
- [ ] Tutorial/onboarding flow

## Notes for AI Assistants

When modifying this codebase:
1. **Maintain dark mode** - all colors should work on dark background
2. **Keep auto-scroll smooth** - test at different speeds
3. **Preserve TypeScript types** - use strict typing
4. **Update both renderer and UI** - changes often need both
5. **Test with real PDF** - sample tab in `../tabs/` folder
6. **Follow existing patterns** - match code style
7. **Clean up refs** - always destroy in useEffect cleanup
8. **Consider performance** - canvas rendering can be expensive

## Quick Reference

**Start server:** `npm run dev` → http://localhost:5173  
**Main entry:** `src/root.tsx` (RSC) → `src/App.tsx` (client)  
**Rendering:** `TabRenderer.render(tab, position)`  
**Scrolling:** `ScrollController.play()` / `pause()` / `setSpeed()`  
**Colors:** Blue/Green/Orange/Red for fingers 1-4  
**Dark BG:** `#1a1a1a`
