import type { Note, FingerPosition } from '../models/Tab';

/**
 * Calculate optimal finger positions for a set of notes
 */
export function calculateFingering(notes: Note[]): FingerPosition[] {
  // Sort notes by string (bottom to top)
  const sortedNotes = [...notes].sort((a, b) => b.string - a.string);
  
  const positions: FingerPosition[] = [];
  
  // Get fret range (excluding open strings)
  const frets = sortedNotes.map(n => n.fret).filter(f => f > 0);
  if (frets.length === 0) {
    // All open strings
    return sortedNotes.map(n => ({
      string: n.string,
      fret: 0,
      finger: 0,
    }));
  }
  
  const minFret = Math.min(...frets);
  const maxFret = Math.max(...frets);
  const fretSpan = maxFret - minFret;
  
  for (const note of sortedNotes) {
    if (note.fret === 0) {
      // Open string, no finger
      positions.push({
        string: note.string,
        fret: 0,
        finger: 0,
      });
    } else {
      // Assign finger based on relative position in the chord
      let finger: number;
      
      if (fretSpan <= 3) {
        // Standard 4-fret position (index on minFret)
        finger = note.fret - minFret + 1;
        finger = Math.min(4, Math.max(1, finger));
      } else {
        // Stretch position - use heuristics
        const relativePos = (note.fret - minFret) / fretSpan;
        finger = Math.ceil(relativePos * 3) + 1; // Distribute across fingers 1-4
        finger = Math.min(4, finger);
      }
      
      positions.push({
        string: note.string,
        fret: note.fret,
        finger,
      });
    }
  }
  
  return positions;
}
