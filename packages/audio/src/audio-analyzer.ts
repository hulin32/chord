import type {
    ChordDetectionResult,
    AudioAnalysisResult,
    AudioAnalyzerConfig,
} from '@workspace/types'
import {
    frequenciesToNotes,
    detectChordsFromNotes,
    analyzeChordFromNotes,
    getAllPossibleChords,
    getChordInfo,
    findFrequencyPeaks,
    calculateAdaptiveThreshold,
    filterHarmonicPeaks
} from '@workspace/music-theory'
import { FFTAnalyzer } from './fft-analyzer'

export class AudioAnalyzer {
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private microphone: MediaStreamAudioSourceNode | null = null
    private dataArray: Uint8Array | null = null
    private isAnalyzing = false
    private fftAnalyzer = new FFTAnalyzer()

    /**
     * Initialize the audio analyzer
     */
    async initialize(config: AudioAnalyzerConfig = {}): Promise<boolean> {
        try {
            this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            this.analyser = this.audioContext.createAnalyser()

            // Apply configuration
            this.analyser.fftSize = config.fftSize ?? 2048
            this.analyser.smoothingTimeConstant = config.smoothingTimeConstant ?? 0.8
            this.analyser.minDecibels = config.minDecibels ?? -100
            this.analyser.maxDecibels = config.maxDecibels ?? -30

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            this.microphone = this.audioContext.createMediaStreamSource(stream)
            this.microphone.connect(this.analyser)

            const bufferLength = this.analyser.frequencyBinCount
            this.dataArray = new Uint8Array(bufferLength)

            return true
        } catch (error) {
            console.error('Failed to initialize audio analyzer:', error)
            return false
        }
    }

    /**
     * Start real-time chord analysis
     */
    startAnalysis(callback: (result: AudioAnalysisResult) => void): void {
        if (!this.analyser || !this.dataArray || this.isAnalyzing) {
            return
        }

        this.isAnalyzing = true
        const analyze = () => {
            if (!this.isAnalyzing) return

            this.analyser!.getByteFrequencyData(this.dataArray!)
            const result = this.analyzeAudioData(this.dataArray!)
            callback(result)

            requestAnimationFrame(analyze)
        }

        analyze()
    }

    /**
     * Stop real-time analysis
     */
    stopAnalysis(): void {
        this.isAnalyzing = false
    }

    /**
     * Analyze frequency data and detect chords
     */
    private analyzeAudioData(dataArray: Uint8Array): AudioAnalysisResult {
        const dominantFrequencies = this.extractDominantFrequencies(dataArray)
        const detectedNotes = frequenciesToNotes(dominantFrequencies)
        const detectedChords = detectChordsFromNotes(detectedNotes)

        return {
            detectedChords,
            dominantFrequencies,
            timestamp: Date.now()
        }
    }

    /**
     * Extract dominant frequencies from audio data
     */
    private extractDominantFrequencies(dataArray: Uint8Array): number[] {
        const sampleRate = this.audioContext?.sampleRate || 44100
        const fftSize = this.analyser?.fftSize || 2048

        // Adaptive thresholding and peak finding
        const threshold = calculateAdaptiveThreshold(dataArray, { minThreshold: 30, thresholdRatio: 0.25 })
        const peaks = findFrequencyPeaks(dataArray, sampleRate, fftSize, {
            minAmplitude: threshold,
            minProminence: 5,
            minFrequency: 80,
            maxFrequency: 2000
        })

        // Filter out harmonic overtones to keep likely fundamentals
        const fundamentals = filterHarmonicPeaks(peaks, { maxMultiple: 6, toleranceCents: 35 })
        return fundamentals.slice(0, 8).map(p => p.frequency)
    }

    /**
     * Analyze an audio blob and return detected chords
     */
    async analyzeAudioBlob(audioBlob: Blob): Promise<ChordDetectionResult[]> {
        try {
            // Convert blob to audio buffer
            const arrayBuffer = await audioBlob.arrayBuffer()
            const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            // Use FFT analysis for better accuracy
            const frequencies = await this.fftAnalyzer.extractFrequenciesFromBuffer(audioBuffer)
            const detectedNotes = frequenciesToNotes(frequencies)
            const detectedChords = detectChordsFromNotes(detectedNotes)

            // Clean up
            audioContext.close()

            return detectedChords
        } catch (error) {
            console.error('Error analyzing audio blob:', error)
            return []
        }
    }

    /**
     * Static method to analyze chord from note names
     */
    static analyzeChordFromNotes(notes: string[]): ChordDetectionResult | null {
        return analyzeChordFromNotes(notes)
    }

    /**
     * Static method to get all possible chords for a given set of notes
     */
    static getAllPossibleChords(notes: string[]): string[] {
        return getAllPossibleChords(notes)
    }

    /**
     * Static method to get chord information by name
     */
    static getChordInfo(chordName: string): any {
        return getChordInfo(chordName)
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.stopAnalysis()
        this.microphone?.disconnect()
        this.analyser?.disconnect()
        this.audioContext?.close()
    }
}