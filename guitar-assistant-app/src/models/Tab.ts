// Core data models for Guitar Assistant

export interface Tab {
  id: string;
  title: string;
  artist: string;
  tuning: Tuning;
  tempo: number; // BPM
  timeSignature: string; // "4/4", "3/4", etc.
  sections: Section[];
  measures: Measure[];
}

export interface Tuning {
  strings: string[]; // ["E", "A", "D", "G", "B", "E"] for standard
}

export interface Section {
  id: string;
  name: string; // "Intro", "Verse 1", "Chorus", etc.
  startMeasure: number;
  endMeasure: number;
  repeatCount?: number; // For "3x", "5x" markers
}

export interface Measure {
  number: number;
  chord?: string; // Optional chord label (C, G, D, Em, etc.)
  notes: Note[];
  techniques?: string[]; // ["P.M.", "slide", etc.]
  duration: number; // in beats
}

export interface Note {
  string: number; // 1-6 (1=high E, 6=low E)
  fret: number; // 0-24
  startTime: number; // Position in measure (0-1)
  duration: number; // Length in beats
  finger?: number; // 1-4 suggested fingering
  technique?: string; // "hammer", "pull", "bend", "slide"
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // Current position in seconds
  currentMeasure: number; // Current measure position
  speed: number; // 0.25 to 2.0
  loopStart?: number;
  loopEnd?: number;
}

export interface FingerPosition {
  string: number;
  fret: number;
  finger: number; // 0=open, 1=index, 2=middle, 3=ring, 4=pinky
}
