// Audio Analysis Types
export interface ChordDetectionResult {
    chord: string;
    confidence: number;
    notes: string[];
    root: string;
    quality: string;
}

export interface AudioAnalysisResult {
    detectedChords: ChordDetectionResult[];
    dominantFrequencies: number[];
    timestamp: number;
}

export interface FrequencyPeak {
    frequency: number;
    amplitude: number;
    prominence: number;
}

// Music Theory Types
export interface ChordDefinition {
    name: string;
    notes: string[];
    intervals: string[];
    symbol?: string;
}

export interface NoteInfo {
    name: string;
    pc: string; // pitch class
    oct?: number;
    midi?: number;
    freq?: number;
}

// Audio Context Types
export interface AudioAnalyzerConfig {
    fftSize?: number;
    smoothingTimeConstant?: number;
    minDecibels?: number;
    maxDecibels?: number;
    sampleRate?: number;
}

export interface AudioRecordingOptions {
    sampleRate?: number;
    channelCount?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
}

// Practice App Types
export interface PracticeSession {
    chordName: string;
    startTime: number;
    attempts: PracticeAttempt[];
    isCompleted: boolean;
}

export interface PracticeAttempt {
    timestamp: number;
    detectedChord: string | null;
    isCorrect: boolean;
    confidence: number;
    audioBlob?: Blob;
}

// Utility Types
export type MidiNote = number; // 0-127
export type Frequency = number; // Hz
export type Amplitude = number; // 0-255 for Uint8Array or 0-1 for Float32Array