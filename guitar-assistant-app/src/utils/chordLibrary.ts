/**
 * Chord library with finger positions for common chords
 */

export interface ChordShape {
  name: string;
  positions: Array<{
    string: number; // 1-6 (1=high E, 6=low E)
    fret: number;   // 0-24 (0=open)
    finger?: number; // 1-4 for which finger to use
  }>;
}

export const CHORD_LIBRARY: Record<string, ChordShape> = {
  'C': {
    name: 'C Major',
    positions: [
      { string: 5, fret: 3, finger: 3 }, // A string, 3rd fret, ring finger
      { string: 4, fret: 2, finger: 2 }, // D string, 2nd fret, middle finger
      { string: 3, fret: 0 },            // G string, open
      { string: 2, fret: 1, finger: 1 }, // B string, 1st fret, index finger
      { string: 1, fret: 0 },            // high E string, open
    ]
  },
  'G': {
    name: 'G Major',
    positions: [
      { string: 6, fret: 3, finger: 2 }, // low E string, 3rd fret, middle finger
      { string: 5, fret: 2, finger: 1 }, // A string, 2nd fret, index finger
      { string: 4, fret: 0 },            // D string, open
      { string: 3, fret: 0 },            // G string, open
      { string: 2, fret: 0 },            // B string, open
      { string: 1, fret: 3, finger: 3 }, // high E string, 3rd fret, ring finger
    ]
  },
  'D': {
    name: 'D Major',
    positions: [
      { string: 4, fret: 0 },            // D string, open
      { string: 3, fret: 2, finger: 1 }, // G string, 2nd fret, index finger
      { string: 2, fret: 3, finger: 3 }, // B string, 3rd fret, ring finger
      { string: 1, fret: 2, finger: 2 }, // high E string, 2nd fret, middle finger
    ]
  },
  'Em': {
    name: 'E Minor',
    positions: [
      { string: 6, fret: 0 },            // low E string, open
      { string: 5, fret: 2, finger: 2 }, // A string, 2nd fret, middle finger
      { string: 4, fret: 2, finger: 3 }, // D string, 2nd fret, ring finger
      { string: 3, fret: 0 },            // G string, open
      { string: 2, fret: 0 },            // B string, open
      { string: 1, fret: 0 },            // high E string, open
    ]
  },
  'D/F#': {
    name: 'D/F# (D over F#)',
    positions: [
      { string: 6, fret: 2, finger: 1 }, // low E string, 2nd fret (F#), index finger
      { string: 4, fret: 0 },            // D string, open
      { string: 3, fret: 2, finger: 2 }, // G string, 2nd fret, middle finger
      { string: 2, fret: 3, finger: 4 }, // B string, 3rd fret, pinky
      { string: 1, fret: 2, finger: 3 }, // high E string, 2nd fret, ring finger
    ]
  },
  'Bm': {
    name: 'B Minor',
    positions: [
      { string: 5, fret: 2, finger: 1 }, // A string, 2nd fret (barre)
      { string: 4, fret: 4, finger: 3 }, // D string, 4th fret, ring finger
      { string: 3, fret: 4, finger: 4 }, // G string, 4th fret, pinky
      { string: 2, fret: 3, finger: 2 }, // B string, 3rd fret, middle finger
      { string: 1, fret: 2, finger: 1 }, // high E string, 2nd fret (barre)
    ]
  }
};

/**
 * Get chord shape by name
 */
export function getChordShape(chordName: string): ChordShape | null {
  return CHORD_LIBRARY[chordName] || null;
}
