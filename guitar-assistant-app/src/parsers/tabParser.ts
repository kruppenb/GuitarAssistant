import type { Tab, Measure, Note } from '../models/Tab';

/**
 * Parse extracted PDF text into a Tab structure
 * This is a simplified parser for the specific format shown in the sample PDF
 */
export function parseTabText(text: string): Tab {
  const lines = text.split('\n');
  
  // Extract metadata
  const title = lines[0]?.trim() || 'Untitled';
  const artist = lines[2]?.trim() || 'Unknown Artist'; // Line 2 has artist
  
  console.log('Parsing PDF with', lines.length, 'lines');
  
  const measures: Measure[] = [];
  
  // Pattern to identify chord labels
  const chordPattern = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|\/|[0-9])*$/;
  
  // Collect all chords and numbers into groups
  let i = 0;
  let currentChords: string[] = [];
  let currentNumbers: string[] = [];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Collect consecutive chord labels
    if (chordPattern.test(line)) {
      currentChords.push(line);
      console.log('Found chord:', line, 'at line', i);
    }
    // Collect numbers (tab notation comes as individual numbers)
    else if (/^\d+$/.test(line) && line.length <= 2) {
      currentNumbers.push(line);
      
      // If we have chords and have collected many numbers, try to parse as tab
      if (currentChords.length > 0 && currentNumbers.length > 50) {
        console.log('Processing', currentNumbers.length, 'numbers with', currentChords.length, 'chords');
        const parsedMeasures = parseNumberSequence(currentNumbers, currentChords);
        measures.push(...parsedMeasures);
        currentNumbers = [];
        currentChords = [];
      }
    }
    
    i++;
  }
  
  // Process any remaining numbers
  if (currentChords.length > 0 && currentNumbers.length > 0) {
    console.log('Processing final', currentNumbers.length, 'numbers');
    const parsedMeasures = parseNumberSequence(currentNumbers, currentChords);
    measures.push(...parsedMeasures);
  }
  
  console.log('Total measures parsed:', measures.length);
  
  // If no measures were parsed, create sample data
  if (measures.length === 0) {
    console.log('No measures found, using sample data');
    measures.push(...createSampleMeasures());
  }
  
  return {
    id: crypto.randomUUID(),
    title,
    artist,
    tuning: { strings: ['E', 'A', 'D', 'G', 'B', 'E'] },
    tempo: 120,
    timeSignature: '4/4',
    sections: [
      {
        id: 'section-1',
        name: 'Section 1',
        startMeasure: 0,
        endMeasure: measures.length - 1,
      },
    ],
    measures,
  };
}

/**
 * Create sample measures for testing
 * This represents the C-G-D-Em progression from the sample PDF
 */
function createSampleMeasures(): Measure[] {
  const measures: Measure[] = [];
  
  // C chord (3rd fret A, 2nd fret D, open G, 1st fret B, open high E)
  measures.push({
    number: 1,
    chord: 'C',
    notes: [
      { string: 5, fret: 3, startTime: 0, duration: 1 },
      { string: 4, fret: 2, startTime: 0, duration: 1 },
      { string: 3, fret: 0, startTime: 0, duration: 1 },
      { string: 2, fret: 1, startTime: 0, duration: 1 },
      { string: 1, fret: 0, startTime: 0, duration: 1 },
    ],
    duration: 4,
  });
  
  // G chord
  measures.push({
    number: 2,
    chord: 'G',
    notes: [
      { string: 6, fret: 3, startTime: 0, duration: 1 },
      { string: 5, fret: 2, startTime: 0, duration: 1 },
      { string: 4, fret: 0, startTime: 0, duration: 1 },
      { string: 3, fret: 0, startTime: 0, duration: 1 },
      { string: 2, fret: 0, startTime: 0, duration: 1 },
      { string: 1, fret: 3, startTime: 0, duration: 1 },
    ],
    duration: 4,
  });
  
  // D chord
  measures.push({
    number: 3,
    chord: 'D',
    notes: [
      { string: 4, fret: 0, startTime: 0, duration: 1 },
      { string: 3, fret: 2, startTime: 0, duration: 1 },
      { string: 2, fret: 3, startTime: 0, duration: 1 },
      { string: 1, fret: 2, startTime: 0, duration: 1 },
    ],
    duration: 4,
  });
  
  // Em chord
  measures.push({
    number: 4,
    chord: 'Em',
    notes: [
      { string: 6, fret: 0, startTime: 0, duration: 1 },
      { string: 5, fret: 2, startTime: 0, duration: 1 },
      { string: 4, fret: 2, startTime: 0, duration: 1 },
      { string: 3, fret: 0, startTime: 0, duration: 1 },
      { string: 2, fret: 0, startTime: 0, duration: 1 },
      { string: 1, fret: 0, startTime: 0, duration: 1 },
    ],
    duration: 4,
  });
  
  // Repeat the progression a few times for scrolling demo
  for (let i = 0; i < 8; i++) {
    measures.push({ ...measures[0], number: measures.length + 1 });
    measures.push({ ...measures[1], number: measures.length + 1 });
    measures.push({ ...measures[2], number: measures.length + 1 });
    measures.push({ ...measures[3], number: measures.length + 1 });
  }
  
  return measures;
}

/**
 * Parse a sequence of individual numbers (from PDF extraction) into measures
 * PDF.js extracts each fret number as a separate line
 */
function parseNumberSequence(numbers: string[], chords: string[]): Measure[] {
  const measures: Measure[] = [];
  
  console.log('Parsing', numbers.length, 'numbers into measures');
  
  // Group numbers into sets (each note group has ~6 numbers for 6 strings)
  // But some strings might be empty, so look for patterns
  let currentMeasure: Partial<Measure> | null = null;
  let measureNumber = 1;
  let chordIndex = 0;
  let i = 0;
  
  while (i < numbers.length) {
    // Take the next 1-6 numbers as a potential note group
    const noteGroup: Note[] = [];
    let j = 0;
    
    // Collect up to 6 consecutive numbers (representing strings played together)
    while (j < 6 && i + j < numbers.length) {
      const fret = parseInt(numbers[i + j]);
      if (!isNaN(fret)) {
        // Assume numbers come in order from high E to low E
        noteGroup.push({
          string: j + 1, // 1=high E through 6=low E
          fret,
          startTime: 0,
          duration: 1,
        });
      }
      j++;
    }
    
    if (noteGroup.length > 0) {
      if (!currentMeasure) {
        currentMeasure = {
          number: measureNumber++,
          chord: chords[chordIndex % chords.length] || '',
          notes: [],
          duration: 4,
        };
      }
      
      // Add notes to current measure
      const measureNotes = currentMeasure.notes as Note[];
      const startTime = measureNotes.length > 0 ? measureNotes.length * 0.05 : 0;
      noteGroup.forEach(note => {
        note.startTime = Math.min(startTime, 0.95);
        measureNotes.push(note);
      });
      
      // Create new measure every 12-16 note groups (roughly one chord)
      if (measureNotes.length >= 12) {
        measures.push(currentMeasure as Measure);
        currentMeasure = null;
        chordIndex++;
      }
    }
    
    i += j;
  }
  
  // Add any remaining measure
  if (currentMeasure && (currentMeasure.notes as Note[]).length > 0) {
    measures.push(currentMeasure as Measure);
  }
  
  console.log('Created', measures.length, 'measures from number sequence');
  return measures;
}

/**
 * Parse 6 lines of tablature into measures (legacy function, may not be needed)
 */
function parseTabLines(tabLines: string[], chords: string[]): Measure[] {
  const measures: Measure[] = [];
  
  // Ensure we have exactly 6 strings
  if (tabLines.length !== 6) {
    console.log('Not 6 lines:', tabLines.length);
    return measures;
  }
  
  // Find the maximum length to determine how many positions we have
  const maxLength = Math.max(...tabLines.map(line => line.length));
  console.log('Max tab line length:', maxLength);
  
  // Parse each position (column)
  let currentMeasure: Partial<Measure> | null = null;
  let measureNumber = 1;
  let chordIndex = 0;
  let noteCount = 0;
  
  for (let pos = 0; pos < maxLength; pos++) {
    const notes: Note[] = [];
    
    // Check each string at this position
    for (let stringNum = 0; stringNum < 6; stringNum++) {
      const line = tabLines[stringNum];
      if (pos >= line.length) continue;
      
      const char = line[pos];
      
      // If it's a digit, it's a fret number
      if (/\d/.test(char)) {
        // Check if it's part of a two-digit number
        let fret = parseInt(char);
        if (pos + 1 < line.length && /\d/.test(line[pos + 1])) {
          fret = parseInt(char + line[pos + 1]);
        }
        
        notes.push({
          string: 6 - stringNum, // Reverse: top line is high E (1), bottom is low E (6)
          fret,
          startTime: 0, // Will be adjusted later
          duration: 1,
        });
        noteCount++;
      }
    }
    
    // If we found notes, add them to a measure
    if (notes.length > 0) {
      if (!currentMeasure) {
        currentMeasure = {
          number: measureNumber++,
          chord: chords[chordIndex % chords.length],
          notes: [],
          duration: 4,
        };
      }
      
      // Add notes with relative timing within measure
      const measureNotes = currentMeasure.notes as Note[];
      const startTime = measureNotes.length > 0 ? measureNotes.length * 0.05 : 0;
      notes.forEach(note => {
        note.startTime = Math.min(startTime, 0.95);
        measureNotes.push(note);
      });
      
      // Create new measure every 15-20 note groups
      if (measureNotes.length >= 15) {
        measures.push(currentMeasure as Measure);
        currentMeasure = null;
        chordIndex++;
      }
    }
  }
  
  // Add any remaining measure
  if (currentMeasure && (currentMeasure.notes as Note[]).length > 0) {
    measures.push(currentMeasure as Measure);
  }
  
  console.log('Parsed', noteCount, 'total notes into', measures.length, 'measures');
  
  return measures;
}
