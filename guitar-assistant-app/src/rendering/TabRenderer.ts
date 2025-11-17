import type { Tab, Measure, Note } from '../models/Tab';
import { calculateFingering } from '../utils/fingeringCalculator';
import { getChordShape } from '../utils/chordLibrary';

/**
 * Renders guitar tablature on a canvas with horizontal scrolling
 */
export class TabRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Visual constants (dark mode)
  private readonly STRING_SPACING = 24; // pixels between strings
  private readonly MEASURE_WIDTH = 220; // pixels per measure
  private readonly FRET_NUMBER_SIZE = 18; // font size for fret numbers
  private readonly PADDING_TOP = 100;
  
  // Dark mode colors
  private readonly BG_COLOR = '#1a1a1a';
  private readonly STRING_COLOR = '#444';
  private readonly TEXT_COLOR = '#e0e0e0';
  private readonly CHORD_COLOR = '#60a5fa'; // Blue
  private readonly MEASURE_LINE_COLOR = '#555';
  private readonly PLAYHEAD_COLOR = '#ef4444'; // Red
  private readonly FRET_NUMBER_COLOR = '#f0f0f0';
  private readonly HIGHLIGHT_MEASURE_BG = 'rgba(96, 165, 250, 0.08)'; // Light blue tint
  private readonly HIGHLIGHT_NOTE_BG = 'rgba(96, 165, 250, 0.25)'; // Stronger blue for current note
  
  // Finger colors (0=none, 1-4 for fingers)
  private readonly FINGER_COLORS = [
    '',
    '#3b82f6', // Index - Blue
    '#10b981', // Middle - Green
    '#f59e0b', // Ring - Orange
    '#ef4444', // Pinky - Red
  ];
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;
  }
  
  /**
   * Render the tab at a specific scroll position
   * @param tab The tab data to render
   * @param scrollPosition Current position in measures (floating point)
   * @param visibleMeasures Number of measures to show at once
   */
  public render(
    tab: Tab,
    scrollPosition: number,
    visibleMeasures: number = 5
  ): void {
    // Clear canvas with dark background
    this.ctx.fillStyle = this.BG_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Playhead position (fixed at 1/5 of screen width from left)
    const playheadX = this.canvas.width / 5;
    
    // Calculate which measures to render
    const startMeasure = Math.max(0, Math.floor(scrollPosition - 1));
    const endMeasure = Math.min(Math.ceil(scrollPosition + visibleMeasures), tab.measures.length);
    
    // Calculate horizontal offset so playhead aligns with current position
    let xOffset = playheadX - (scrollPosition * this.MEASURE_WIDTH);
    
    // Render each visible measure
    for (let i = startMeasure; i < endMeasure; i++) {
      const measureX = xOffset + (i * this.MEASURE_WIDTH);
      const isCurrentMeasure = Math.floor(scrollPosition) === i;
      this.renderMeasure(tab.measures[i], measureX, this.PADDING_TOP, isCurrentMeasure, scrollPosition, playheadX);
    }
    
    // Draw playhead at fixed position
    this.drawPlayhead(playheadX);
    
    // Draw header info
    this.drawHeader(tab, scrollPosition);
  }
  
  private renderMeasure(
    measure: Measure,
    x: number,
    y: number,
    isCurrentMeasure: boolean = false,
    scrollPosition: number = 0,
    playheadX: number = 0
  ): void {
    const ctx = this.ctx;
    
    // Skip if completely off-screen
    if (x + this.MEASURE_WIDTH < 0 || x > this.canvas.width) {
      return;
    }
    
    // Highlight current measure background
    if (isCurrentMeasure) {
      ctx.fillStyle = this.HIGHLIGHT_MEASURE_BG;
      ctx.fillRect(x, y - 60, this.MEASURE_WIDTH, (5 * this.STRING_SPACING) + 100);
    }
    
    // Draw chord label above staff
    if (measure.chord) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = this.CHORD_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText(measure.chord, x + this.MEASURE_WIDTH / 2, y - 40);
    }
    
    // Draw measure number
    ctx.font = '12px Arial';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(measure.number.toString(), x + this.MEASURE_WIDTH / 2, y - 20);
    
    // Draw 6 string lines
    for (let stringNum = 0; stringNum < 6; stringNum++) {
      const stringY = y + (stringNum * this.STRING_SPACING);
      ctx.strokeStyle = this.STRING_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, stringY);
      ctx.lineTo(x + this.MEASURE_WIDTH, stringY);
      ctx.stroke();
    }
    
    // Draw string labels (E A D G B E) on the left side if near left edge
    if (x < 100 && x > -50) {
      const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = this.TEXT_COLOR;
      ctx.textAlign = 'right';
      for (let i = 0; i < 6; i++) {
        const stringY = y + (i * this.STRING_SPACING);
        ctx.fillText(stringNames[i], 25, stringY + 5);
      }
    }
    
    // Draw notes or rest symbol
    if (measure.notes && measure.notes.length > 0) {
      this.renderNotes(measure, x, y, isCurrentMeasure, scrollPosition, playheadX);
    } else if (measure.chord && measure.techniques?.includes('strum')) {
      // Draw chord shape from library
      this.renderChordShape(measure.chord, x, y);
    } else {
      // Draw rest symbol for empty measures
      const restX = x + this.MEASURE_WIDTH / 2;
      const restY = y + (2.5 * this.STRING_SPACING);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = this.TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('𝄽', restX, restY); // Whole rest symbol
    }
    
    // Draw measure separator (right side)
    ctx.strokeStyle = this.MEASURE_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + this.MEASURE_WIDTH, y - 10);
    ctx.lineTo(x + this.MEASURE_WIDTH, y + (5 * this.STRING_SPACING) + 10);
    ctx.stroke();
    
    // Draw technique markers (P.M., etc.)
    if (measure.techniques && measure.techniques.length > 0) {
      ctx.font = 'italic 11px Arial';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(
        measure.techniques.join(' '),
        x + this.MEASURE_WIDTH / 2,
        y + (5 * this.STRING_SPACING) + 25
      );
    }
  }
  
  private renderNotes(
    measure: Measure,
    measureX: number,
    measureY: number,
    isCurrentMeasure: boolean = false,
    scrollPosition: number = 0,
    playheadX: number = 0
  ): void {
    const ctx = this.ctx;
    
    // Check if this is a simple chord strum (all notes on same string with same fret)
    const isSimpleChordStrum = this.isSimpleChordStrum(measure);
    
    if (isSimpleChordStrum) {
      // For simple chord strums, show once as vertical chord position
      const uniqueNotes = this.getUniqueChordNotes(measure);
      const x = measureX + this.MEASURE_WIDTH / 2;
      
      for (const note of uniqueNotes) {
        const y = measureY + ((6 - note.string) * this.STRING_SPACING);
        
        // Draw fret number
        ctx.font = `bold ${this.FRET_NUMBER_SIZE}px monospace`;
        ctx.fillStyle = this.FRET_NUMBER_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.fret.toString(), x, y);
      }
      
      return;
    }
    
    // For actual note patterns, show all notes
    // Group notes by timing (notes at same time = vertical alignment)
    const notesByTime = new Map<number, Note[]>();
    for (const note of measure.notes) {
      const time = Math.round(note.startTime * 100) / 100;
      if (!notesByTime.has(time)) {
        notesByTime.set(time, []);
      }
      notesByTime.get(time)!.push(note);
    }
    
    // Sort by time
    const sortedTimes = Array.from(notesByTime.keys()).sort((a, b) => a - b);
    
    // Only show finger positions if this is NOT a chord measure
    const showFingerPositions = !measure.chord;
    
    // Render each note group with proper spacing
    sortedTimes.forEach((time, index) => {
      const notes = notesByTime.get(time)!;
      
      // Determine grouping size based on total notes
      const groupSize = sortedTimes.length <= 8 ? 4 : 3;
      
      // Calculate spacing based on number of note groups
      const numGroups = Math.ceil(sortedTimes.length / groupSize);
      const extraGapSpace = (numGroups - 1) * 10; // Account for gaps between groups
      const availableWidth = this.MEASURE_WIDTH - 50 - extraGapSpace; // Leave larger margins
      const spacing = availableWidth / sortedTimes.length; // Dynamic spacing
      
      // Add extra spacing after every group for visual grouping
      const groupIndex = Math.floor(index / groupSize);
      const extraSpacing = groupIndex * 10; // 10px gap between groups
      
      const x = measureX + 25 + (index * spacing) + extraSpacing;
      
      // Highlight current note if this is at/near the playhead
      if (isCurrentMeasure && Math.abs(x - playheadX) < spacing / 2) {
        ctx.fillStyle = this.HIGHLIGHT_NOTE_BG;
        ctx.fillRect(x - spacing / 2, measureY - 10, spacing, (5 * this.STRING_SPACING) + 20);
      }
      
      // Calculate fingering for this note group (only if needed)
      const fingering = showFingerPositions ? calculateFingering(notes) : [];
      
      // Draw grouping bracket under every group
      if (sortedTimes.length >= 6 && index % groupSize === 0 && index + groupSize - 1 < sortedTimes.length) {
        const bracketY = measureY + (5 * this.STRING_SPACING) + 15;
        const bracketStartX = x;
        const bracketEndX = x + (spacing * (groupSize - 1)) + (spacing / 2);
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Draw bracket: ⌐ shape
        ctx.moveTo(bracketStartX - 3, bracketY - 3);
        ctx.lineTo(bracketStartX - 3, bracketY);
        ctx.lineTo(bracketEndX + 3, bracketY);
        ctx.lineTo(bracketEndX + 3, bracketY - 3);
        ctx.stroke();
        
        // Draw group size label under the bracket
        ctx.font = 'italic 10px Arial';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText(groupSize.toString(), (bracketStartX + bracketEndX) / 2, bracketY + 10);
      }
      
      for (const note of notes) {
        // Place fret number on the correct string line (inverted: string 1 at top)
        const y = measureY + ((note.string - 1) * this.STRING_SPACING);
        
        // Draw fret number on the string line
        ctx.font = `bold ${this.FRET_NUMBER_SIZE}px monospace`;
        ctx.fillStyle = this.FRET_NUMBER_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.fret.toString(), x, y);
        
        // Find finger for this note (only if showing finger positions)
        const fingerInfo = showFingerPositions ? fingering.find(
          f => f.string === note.string && f.fret === note.fret
        ) : null;
        
        // Draw small finger indicator above/below the fret number
        if (showFingerPositions && fingerInfo && fingerInfo.finger > 0) {
          const fingerColor = this.FINGER_COLORS[fingerInfo.finger];
          const fingerX = x + 12;
          const fingerY = y - 12;
          
          // Draw small circle with finger number
          ctx.fillStyle = fingerColor;
          ctx.beginPath();
          ctx.arc(fingerX, fingerY, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw finger number
          ctx.font = 'bold 10px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fingerInfo.finger.toString(), fingerX, fingerY);
        }
      }
    });
  }
  
  /**
   * Check if measure is a simple chord strum (same note repeated on same string)
   * Only returns true if the measure has a "strum" technique marker
   */
  private isSimpleChordStrum(measure: Measure): boolean {
    if (!measure.notes || measure.notes.length === 0) {
      return false;
    }
    
    // Only treat as simple chord strum if explicitly marked with "strum" technique
    if (!measure.techniques?.includes('strum')) {
      return false;
    }
    
    // Check if all notes are on the same string and same fret
    const firstNote = measure.notes[0];
    return measure.notes.every(
      note => note.string === firstNote.string && note.fret === firstNote.fret
    );
  }
  
  /**
   * Get unique notes for chord display (remove duplicates)
   */
  private getUniqueChordNotes(measure: Measure): Note[] {
    const unique = new Map<string, Note>();
    for (const note of measure.notes) {
      const key = `${note.string}-${note.fret}`;
      if (!unique.has(key)) {
        unique.set(key, note);
      }
    }
    return Array.from(unique.values());
  }
  
  /**
   * Render chord shape from chord library
   */
  private renderChordShape(chordName: string, measureX: number, measureY: number): void {
    const ctx = this.ctx;
    const chordShape = getChordShape(chordName);
    
    if (!chordShape) {
      // If chord not found, just show chord name
      const x = measureX + this.MEASURE_WIDTH / 2;
      const y = measureY + (2.5 * this.STRING_SPACING);
      ctx.font = 'italic 14px Arial';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText('(chord shape not defined)', x, y);
      return;
    }
    
    // Draw chord positions vertically at center of measure
    const x = measureX + this.MEASURE_WIDTH / 2;
    
    for (const pos of chordShape.positions) {
      const y = measureY + ((pos.string - 1) * this.STRING_SPACING);
      
      // Draw fret number
      ctx.font = `bold ${this.FRET_NUMBER_SIZE}px monospace`;
      ctx.fillStyle = this.FRET_NUMBER_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.fret.toString(), x, y);
      
      // Draw finger indicator if specified
      if (pos.finger && pos.finger > 0) {
        const fingerColor = this.FINGER_COLORS[pos.finger];
        const fingerX = x + 12;
        const fingerY = y - 12;
        
        // Draw small circle with finger number
        ctx.fillStyle = fingerColor;
        ctx.beginPath();
        ctx.arc(fingerX, fingerY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw finger number
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pos.finger.toString(), fingerX, fingerY);
      }
    }
  }

  
  private drawPlayhead(x: number): void {
    const ctx = this.ctx;
    const y = this.PADDING_TOP;
    const height = (5 * this.STRING_SPACING) + 20;
    
    // Draw vertical line
    ctx.strokeStyle = this.PLAYHEAD_COLOR;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    
    // Draw triangle at top
    ctx.fillStyle = this.PLAYHEAD_COLOR;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x - 12, y - 45);
    ctx.lineTo(x + 12, y - 45);
    ctx.closePath();
    ctx.fill();
  }
  
  private drawHeader(tab: Tab, position: number): void {
    const ctx = this.ctx;
    
    // Song info in top-left
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = this.TEXT_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`${tab.title} - ${tab.artist}`, 40, 25);
    
    // Position info in top-right
    ctx.font = '14px Arial';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'right';
    const currentMeasure = Math.floor(position) + 1;
    ctx.fillText(
      `Measure ${currentMeasure} / ${tab.measures.length}`,
      this.canvas.width - 40,
      25
    );
  }
  
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
