import type { Chord as ChordShape } from './chords';
import { Note, Chord, Midi } from 'tonal';

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

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isAnalyzing = false;

  /**
   * Initialize the audio analyzer
   */
  async initialize(): Promise<boolean> {
    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }

  /**
   * Start real-time chord analysis
   */
  startAnalysis(callback: (result: AudioAnalysisResult) => void): void {
    if (!this.analyser || !this.dataArray || this.isAnalyzing) {
      return;
    }

    this.isAnalyzing = true;
    const analyze = () => {
      if (!this.isAnalyzing) return;

      this.analyser!.getByteFrequencyData(this.dataArray!);
      const result = this.analyzeAudioData(this.dataArray!);
      callback(result);

      requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Stop real-time analysis
   */
  stopAnalysis(): void {
    this.isAnalyzing = false;
  }

  /**
   * Analyze frequency data and detect chords
   */
  private analyzeAudioData(dataArray: Uint8Array): AudioAnalysisResult {
    const dominantFrequencies = this.extractDominantFrequencies(dataArray);
    const detectedNotes = this.frequenciesToNotes(dominantFrequencies);
    const detectedChords = this.detectChords(detectedNotes);

    return {
      detectedChords,
      dominantFrequencies,
      timestamp: Date.now()
    };
  }

  /**
   * Extract dominant frequencies from audio data
   */
  private extractDominantFrequencies(dataArray: Uint8Array): number[] {
    const frequencies: number[] = [];
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binSize = sampleRate / (this.analyser?.fftSize || 2048);

    // Find peaks in the frequency spectrum
    for (let i = 1; i < dataArray.length - 1; i++) {
      const current = dataArray[i];
      const previous = dataArray[i - 1];
      const next = dataArray[i + 1];

      // Check if this is a peak and has sufficient amplitude
      if (current && previous && next && current > previous && current > next && current > 50) {
        const frequency = i * binSize;
        // Focus on musical frequencies (roughly 80Hz to 2000Hz)
        if (frequency >= 80 && frequency <= 2000) {
          frequencies.push(frequency);
        }
      }
    }

    // Return top frequencies
    return frequencies.slice(0, 8);
  }

  /**
   * Convert frequencies to musical notes
   */
  private frequenciesToNotes(frequencies: number[]): string[] {
    const notes: string[] = [];

    frequencies.forEach(freq => {
      const midiNote = Math.round(12 * Math.log2(freq / 440) + 69);
      if (midiNote >= 0 && midiNote <= 127) {
        const noteName = Midi.midiToNoteName(midiNote);
        if (noteName) {
          // Always use pitch class (no octave)
          const pc = Note.get(noteName).pc;
          if (pc) notes.push(pc);
        }
      }
    });

    return [...new Set(notes)];
  }

  /**
   * Detect chords from a set of notes
   */
  private detectChords(notes: string[]): ChordDetectionResult[] {
    if (notes.length < 3) return [];

    const normalizedNotes = notes.map(n => Note.get(n).pc).filter(Boolean) as string[];
    if (normalizedNotes.length < 3) return [];

    const detected = Chord.detect(normalizedNotes);

    if (!detected.length) return [];

    // Only use the best match for simplicity
    const bestMatch = detected[0];
    if (!bestMatch) return [];

    const chordInfo = Chord.get(bestMatch);

    if (!chordInfo || !chordInfo.notes) return [];

    const confidence = this.calculateConfidence(normalizedNotes, chordInfo.notes);

    return [{
      chord: bestMatch,
      confidence,
      notes: normalizedNotes,
      root: chordInfo.tonic || '',
      quality: chordInfo.aliases?.[0] || chordInfo.name || ''
    }];
  }

  /**
   * Analyze a specific set of notes to identify the chord
   */
  private analyzeChord(notes: string[]): ChordDetectionResult | null {
    if (notes.length < 3) return null;

    const normalizedNotes = notes.map(n => Note.get(n).pc).filter(Boolean) as string[];
    if (normalizedNotes.length < 3) return null;

    const detected = Chord.detect(normalizedNotes);

    if (!detected.length) return null;

    const bestMatch = detected[0];
    if (!bestMatch) return null;
    const chordInfo = Chord.get(bestMatch);

    if (!chordInfo || !chordInfo.notes) return null;

    const confidence = this.calculateConfidence(normalizedNotes, chordInfo.notes);

    return {
      chord: bestMatch,
      confidence,
      notes: normalizedNotes,
      root: chordInfo.tonic || '',
      quality: chordInfo.aliases?.[0] || chordInfo.name || ''
    };
  }

  /**
   * Calculate confidence score for chord detection
   */
  private calculateConfidence(detectedNotes: string[], chordNotes: string[]): number {
    // Both arrays are pitch classes
    let matches = 0;
    detectedNotes.forEach(note => {
      if (chordNotes.includes(note)) {
        matches++;
      }
    });
    return matches / chordNotes.length;
  }

  /**
   * Remove duplicate chord detections and sort by confidence
   */
  private deduplicateAndSortResults(results: ChordDetectionResult[]): ChordDetectionResult[] {
    const unique = new Map<string, ChordDetectionResult>();

    results.forEach(result => {
      const key = result.chord;
      if (!unique.has(key) || unique.get(key)!.confidence < result.confidence) {
        unique.set(key, result);
      }
    });

    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Return top 3 results
  }

  /**
   * Analyze a single chord from note names
   */
  static analyzeChordFromNotes(notes: string[]): ChordDetectionResult | null {
    const analyzer = new AudioAnalyzer();
    return analyzer.analyzeChord(notes);
  }

  /**
   * Get all possible chords for a given set of notes
   */
  static getAllPossibleChords(notes: string[]): string[] {
    const normalizedNotes = notes.map(note => Note.get(note)?.pc).filter((note): note is string => Boolean(note));
    return Chord.detect(normalizedNotes);
  }

  /**
   * Get chord information by name
   */
  static getChordInfo(chordName: string) {
    return Chord.get(chordName);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnalysis();
    this.microphone?.disconnect();
    this.analyser?.disconnect();
    this.audioContext?.close();
  }

  /**
   * Analyze an audio blob and return detected chords
   */
  async analyzeAudioBlob(audioBlob: Blob): Promise<ChordDetectionResult[]> {
    try {
      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get the audio data
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Convert audio data to frequency domain using FFT
      const frequencies = extractFrequenciesFromAudioData(channelData, sampleRate);
      const detectedNotes = frequenciesToNotes(frequencies);
      const detectedChords = detectChordsFromNotes(detectedNotes);

      // Clean up
      audioContext.close();

      return detectedChords;
    } catch (error) {
      console.error('Error analyzing audio blob:', error);
      return [];
    }
  }
}

/**
 * Analyze recorded audio blob and check if it matches the expected chord
 */
export async function analyzeAudio(audioBlob: Blob, expectedChord: ChordShape): Promise<boolean> {
  try {
    console.log('Starting optimized audio analysis...');
    const startTime = performance.now();

    // Add timeout protection
    const timeoutPromise = new Promise<ChordDetectionResult[]>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), 10000); // 10 second timeout
    });

    // Use the optimized analyzer with timeout
    const detectedChords = await Promise.race([
      analyzeAudioBlobOptimized(audioBlob),
      timeoutPromise
    ]);

    const analysisTime = performance.now() - startTime;
    console.log(`Audio analysis completed in ${analysisTime.toFixed(2)}ms`);
    console.log('Detected chords:', detectedChords);

    // Compare using pitch class only, ignore "major"/"minor" in name
    const expectedName = expectedChord.name.toLowerCase().replace(/ major| minor/, "");
    const isCorrect = detectedChords.some(detected =>
      detected.chord.toLowerCase().replace(/ major| minor/, "").includes(expectedName)
    );

    console.log(`Expected: ${expectedName}, Match found: ${isCorrect}`);
    return isCorrect;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    return false;
  }
}

/**
 * Optimized audio analysis using Web Audio API FFT
 */
async function analyzeAudioBlobOptimized(audioBlob: Blob): Promise<ChordDetectionResult[]> {
  try {
    // Convert blob to audio buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log(`Processing audio: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);

    // Use Web Audio API's FFT analysis for better accuracy
    const frequencies = await extractFrequenciesUsingFFT(audioBuffer);
    const detectedNotes = frequenciesToNotes(frequencies);
    const detectedChords = detectChordsFromNotes(detectedNotes);

    console.log('Detected frequencies:', frequencies.slice(0, 8));
    console.log('Detected notes:', detectedNotes);

    // Clean up
    await audioContext.close();

    return detectedChords;
  } catch (error) {
    console.error('Error in optimized audio analysis:', error);
    return [];
  }
}

/**
 * Extract frequencies using Web Audio API's FFT analysis
 */
async function extractFrequenciesUsingFFT(audioBuffer: AudioBuffer): Promise<number[]> {
  // Create an offline context for analysis
  const offlineContext = new OfflineAudioContext(
    1, // mono
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source and analyser
  const source = offlineContext.createBufferSource();
  const analyser = offlineContext.createAnalyser();

  // Configure analyser for better frequency resolution
  analyser.fftSize = 4096; // Higher resolution for better frequency detection
  analyser.smoothingTimeConstant = 0.1; // Less smoothing for more responsive detection
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  // Connect nodes
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(offlineContext.destination);

  // Start processing
  source.start(0);

  // Render the audio (this will populate the analyser with frequency data)
  await offlineContext.startRendering();

  // Get frequency data
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  // Extract dominant frequencies
  return extractDominantFrequenciesFromFFT(frequencyData, audioBuffer.sampleRate, analyser.fftSize);
}

/**
 * Extract dominant frequencies from FFT data
 */
function extractDominantFrequenciesFromFFT(frequencyData: Uint8Array, sampleRate: number, fftSize: number): number[] {
  const frequencies: number[] = [];
  const binSize = sampleRate / fftSize;

  console.log(`FFT analysis: sampleRate=${sampleRate}, fftSize=${fftSize}, binSize=${binSize.toFixed(2)}Hz`);

  // Find the maximum amplitude to calculate relative thresholds
  const maxAmplitude = Math.max(...frequencyData);
  const threshold = Math.max(30, maxAmplitude * 0.3); // Adaptive threshold

  console.log(`Max amplitude: ${maxAmplitude}, Threshold: ${threshold}`);

  // Look for peaks in the frequency spectrum
  for (let i = 1; i < frequencyData.length - 1; i++) {
    const current = frequencyData[i]!;
    const previous = frequencyData[i - 1]!;
    const next = frequencyData[i + 1]!;
    const frequency = i * binSize;

    // Focus on musical frequencies (80Hz to 2000Hz) and find peaks above threshold
    if (frequency >= 80 && frequency <= 2000 && current > threshold) {
      // Check if this is a peak
      if (current >= previous && current >= next) {
        // Add some prominence check - peak should be significantly higher than neighbors
        const prominence = current - Math.max(previous, next);
        if (prominence >= 5) {
          frequencies.push(frequency);
          console.log(`Found peak: ${frequency.toFixed(1)}Hz (amplitude: ${current}, prominence: ${prominence})`);
        }
      }
    }
  }

  // Sort by amplitude (frequency data corresponds to amplitude at each frequency)
  const frequencyAmplitudes = frequencies.map(freq => {
    const bin = Math.round(freq / binSize);
    return { frequency: freq, amplitude: frequencyData[bin] || 0 };
  });

  frequencyAmplitudes.sort((a, b) => b.amplitude - a.amplitude);

  // Return top 12 frequencies (to capture harmonics of a chord)
  const topFrequencies = frequencyAmplitudes.slice(0, 12).map(fa => fa.frequency);
  console.log(`Top frequencies: ${topFrequencies.map(f => f.toFixed(1)).join(', ')}`);

  return topFrequencies;
}

/**
 * Extract frequencies from raw audio data (fallback method - keeping for backward compatibility)
 */
function extractFrequenciesFromAudioData(channelData: Float32Array, sampleRate: number): number[] {
  console.log('Using fallback frequency extraction method');
  // This is the old method, keeping it as fallback but improving the threshold
  const sampleSize = Math.min(4096, channelData.length);
  const segment = channelData.slice(0, sampleSize);

  const frequencies: number[] = [];
  const segmentSize = 512;

  for (let i = 0; i < segment.length - segmentSize; i += segmentSize) {
    const subSegment = segment.slice(i, i + segmentSize);
    const peaks = findSimplePeaks(subSegment, sampleRate);
    frequencies.push(...peaks);
  }

  return [...new Set(frequencies)].slice(0, 8);
}

/**
 * Simple peak detection without full FFT (fallback method)
 */
function findSimplePeaks(data: Float32Array, sampleRate: number): number[] {
  const peaks: number[] = [];
  const windowSize = 32;

  // Lower the threshold to be more sensitive
  const threshold = 0.01; // Reduced from 0.1 to 0.01

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const current = Math.abs(data[i] || 0);

    if (current > threshold) {
      // Check if this is a local maximum
      let isMax = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && Math.abs(data[j] || 0) > current) {
          isMax = false;
          break;
        }
      }

      if (isMax) {
        // Estimate frequency based on zero crossings
        const frequency = estimateFrequency(data, i, sampleRate);
        if (frequency >= 80 && frequency <= 1500) {
          peaks.push(frequency);
        }
      }
    }
  }

  return peaks;
}

/**
 * Estimate frequency from zero crossings (fallback method)
 */
function estimateFrequency(data: Float32Array, centerIndex: number, sampleRate: number): number {
  const windowSize = 64;
  const start = Math.max(0, centerIndex - windowSize);
  const end = Math.min(data.length, centerIndex + windowSize);

  let zeroCrossings = 0;
  for (let i = start; i < end - 1; i++) {
    if ((data[i] || 0) * (data[i + 1] || 0) < 0) {
      zeroCrossings++;
    }
  }

  // Frequency estimate based on zero crossings
  const period = (end - start) / (zeroCrossings / 2);
  return sampleRate / period;
}

/**
 * Convert frequencies to musical notes
 */
function frequenciesToNotes(frequencies: number[]): string[] {
  const notes: string[] = [];

  console.log(`Converting ${frequencies.length} frequencies to notes:`);

  frequencies.forEach(freq => {
    const midiNote = Math.round(12 * Math.log2(freq / 440) + 69);
    if (midiNote >= 0 && midiNote <= 127) {
      const noteName = Midi.midiToNoteName(midiNote);
      if (noteName) {
        const pc = Note.get(noteName).pc;
        if (pc) {
          notes.push(pc);
          console.log(`  ${freq.toFixed(1)}Hz -> MIDI ${midiNote} -> ${noteName} -> ${pc}`);
        }
      }
    } else {
      console.log(`  ${freq.toFixed(1)}Hz -> MIDI ${midiNote} (out of range)`);
    }
  });

  const uniqueNotes = [...new Set(notes)];
  console.log(`Unique notes detected: [${uniqueNotes.join(', ')}]`);
  return uniqueNotes;
}

/**
 * Detect chords from a set of notes
 */
function detectChordsFromNotes(notes: string[]): ChordDetectionResult[] {
  console.log(`Detecting chords from notes: [${notes.join(', ')}]`);

  if (notes.length < 3) {
    console.log(`Not enough notes for chord detection (need at least 3, got ${notes.length})`);
    return [];
  }

  const normalizedNotes = notes.map(n => Note.get(n).pc).filter(Boolean) as string[];
  console.log(`Normalized notes: [${normalizedNotes.join(', ')}]`);

  if (normalizedNotes.length < 3) {
    console.log(`Not enough normalized notes for chord detection (need at least 3, got ${normalizedNotes.length})`);
    return [];
  }

  const detected = Chord.detect(normalizedNotes);
  console.log(`Chord.detect() found ${detected.length} possible chords:`, detected);

  const bestMatch = detected[0];
  if (!bestMatch) {
    console.log('No chord matches found');
    return [];
  }

  const chordInfo = bestMatch ? Chord.get(bestMatch) : null;
  console.log(`Best match: ${bestMatch}`, chordInfo);

  if (!chordInfo || !chordInfo.notes) {
    console.log('Chord info is incomplete');
    return [];
  }

  const confidence = calculateConfidence(normalizedNotes, chordInfo.notes);
  console.log(`Confidence: ${confidence.toFixed(3)} (detected notes: ${normalizedNotes.length}, chord notes: ${chordInfo.notes.length})`);

  const result = {
    chord: bestMatch,
    confidence,
    notes: normalizedNotes,
    root: chordInfo.tonic || '',
    quality: chordInfo.aliases?.[0] || chordInfo.name || ''
  };

  console.log('Final chord detection result:', result);
  return [result];
}

/**
 * Calculate confidence score for chord detection
 */
function calculateConfidence(detectedNotes: string[], chordNotes: string[]): number {
  let matches = 0;
  detectedNotes.forEach(note => {
    if (chordNotes.includes(note)) {
      matches++;
    }
  });
  return matches / chordNotes.length;
}
// analyzeChordFromNotes function removed - functionality integrated into detectChordsFromNotes
