import type { ChordDetectionResult } from '@workspace/types'
import { AudioAnalyzer, FFTAnalyzer } from '@workspace/audio'
import type { Chord as ChordShape } from './chords'

/**
 * Simplified chord analyzer that uses the workspace packages
 */
export class ChordAnalyzer {
    private audioAnalyzer = new AudioAnalyzer()
    private fftAnalyzer = new FFTAnalyzer()

    /**
     * Initialize the chord analyzer
     */
    async initialize(): Promise<boolean> {
        return this.audioAnalyzer.initialize()
    }

    /**
     * Start real-time chord analysis
     */
    startAnalysis(callback: (chords: ChordDetectionResult[]) => void): void {
        this.audioAnalyzer.startAnalysis((result) => {
            callback(result.detectedChords)
        })
    }

    /**
     * Stop real-time analysis
     */
    stopAnalysis(): void {
        this.audioAnalyzer.stopAnalysis()
    }

    /**
     * Analyze an audio blob for chord detection
     */
    async analyzeAudioBlob(audioBlob: Blob): Promise<ChordDetectionResult[]> {
        return this.audioAnalyzer.analyzeAudioBlob(audioBlob)
    }

    /**
     * Analyze chord from note names
     */
    static analyzeChordFromNotes(notes: string[]): ChordDetectionResult | null {
        return AudioAnalyzer.analyzeChordFromNotes(notes)
    }

    /**
     * Get all possible chords for notes
     */
    static getAllPossibleChords(notes: string[]): string[] {
        return AudioAnalyzer.getAllPossibleChords(notes)
    }

    /**
     * Get chord information
     */
    static getChordInfo(chordName: string) {
        return AudioAnalyzer.getChordInfo(chordName)
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.audioAnalyzer.dispose()
        this.fftAnalyzer.dispose()
    }
}

/**
 * Analyze recorded audio and check if it matches the expected chord
 * This function maintains compatibility with the existing API
 */
export async function analyzeAudio(audioBlob: Blob, expectedChord: ChordShape): Promise<boolean> {
    try {
        console.log('Starting audio analysis...')
        const startTime = performance.now()

        const analyzer = new ChordAnalyzer()
        const detectedChords = await analyzer.analyzeAudioBlob(audioBlob)

        const analysisTime = performance.now() - startTime
        console.log(`Audio analysis completed in ${analysisTime.toFixed(2)}ms`)
        console.log('Detected chords:', detectedChords)

        // Compare using pitch class only, ignore "major"/"minor" in name
        const expectedName = expectedChord.name.toLowerCase().replace(/ major| minor/, "")
        const isCorrect = detectedChords.some(detected =>
            detected.chord.toLowerCase().replace(/ major| minor/, "").includes(expectedName)
        )

        console.log(`Expected: ${expectedName}, Match found: ${isCorrect}`)

        analyzer.dispose()
        return isCorrect
    } catch (error) {
        console.error('Error analyzing audio:', error)
        return false
    }
}
