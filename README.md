# Guitar Assistant

A web-based guitar learning tool that helps beginning players learn songs from PDF tabs with auto-scrolling and visual finger position guidance.

![Guitar Assistant Demo](https://img.shields.io/badge/Status-Active-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)

## Features

- 📄 **PDF Tab Support** - Upload and parse guitar tablature from PDF files
- 🎵 **Auto-Scrolling** - Automatic tab scrolling with adjustable speed (25%-200%)
- 👆 **Finger Position Guide** - Color-coded finger position indicators
- 🎨 **Dark Mode** - Eye-friendly dark theme optimized for practice sessions
- 🎯 **Visual Playhead** - Clear position indicator showing current playing position
- 📊 **Measure Highlighting** - Current measure and note highlighting for easy tracking
- 🎸 **Chord Display** - Visual chord shapes with finger positions

## Demo

Currently includes a complete transcription of "Golden" by KPop Demon Hunters with 68 measures.

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kruppenb/GuitarAssistant.git
cd GuitarAssistant
```

2. Install dependencies:
```bash
cd guitar-assistant-app
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite 7** - Fast build tool with RSC support
- **PDF.js** - PDF parsing
- **HTML5 Canvas** - Tab rendering

## Project Structure

```
guitar-assistant-app/
├── src/
│   ├── components/
│   │   ├── FileUpload/      # PDF upload component
│   │   └── TabViewer/        # Main tab display
│   ├── models/               # TypeScript data models
│   ├── parsers/              # PDF tab parsing logic
│   ├── playback/             # Auto-scroll controller
│   ├── rendering/            # Canvas-based rendering
│   └── utils/                # Helper functions
├── public/
│   └── golden.json           # Sample tab data
└── docs/                     # Documentation
```

## How It Works

1. **Load Tab** - Upload a PDF tab or load the sample "Golden" tab
2. **Auto-Scroll** - Press play to start auto-scrolling at the song's tempo
3. **Adjust Speed** - Use the speed slider to slow down or speed up
4. **Follow Along** - The playhead and highlights show your current position
5. **Learn Fingering** - Color-coded circles show which finger to use for each note

## Tab Data Format

Tabs are stored in JSON format with this structure:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "tempo": 120,
  "tuning": "standard",
  "timeSignature": "4/4",
  "measures": [
    {
      "number": 1,
      "chord": "C",
      "notes": [
        {"string": 5, "fret": 3, "startTime": 0.0, "duration": 0.25}
      ],
      "techniques": ["P.M."],
      "duration": 4
    }
  ]
}
```

## Controls

- **Play/Pause** - Start or pause auto-scrolling
- **Stop** - Reset to beginning
- **Speed Slider** - Adjust playback speed (25%-200%)
- **Position Slider** - Jump to any measure in the song

## Future Enhancements

- [ ] Advanced PDF parsing for multiple tab formats
- [ ] Section looping
- [ ] Keyboard shortcuts
- [ ] Audio input recognition (microphone practice mode)
- [ ] Practice statistics
- [ ] Tab library management
- [ ] Mobile responsive design
- [ ] Lyrics display

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with React and TypeScript
- Uses PDF.js for PDF parsing
- Inspired by the need for better guitar learning tools

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for guitar learners
