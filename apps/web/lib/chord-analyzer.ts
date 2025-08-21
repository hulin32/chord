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

        // Normalize expected and detected chord names for robust comparison
        const normalize = (name: string): string => {
            const lower = name.trim().toLowerCase()
            // Extract root (A-G with optional #/b)
            const rootMatch = lower.match(/^[a-g](#|b)?/)
            const root = rootMatch ? rootMatch[0] : lower

            // Quality detection priority: maj7, m7, 7, sus2, sus4, minor, major
            if (/(maj7|major\s*7)/.test(lower)) return `${root}maj7`
            if (/(m7|minor\s*7)/.test(lower)) return `${root}m7`
            if (/sus2/.test(lower)) return `${root}sus2`
            if (/sus4/.test(lower)) return `${root}sus4`
            if (/\b7\b/.test(lower)) return `${root}7`
            if (/\bminor\b/.test(lower)) return `${root}m`
            if (/\bmajor\b/.test(lower)) return `${root}`

            // Already condensed forms like "am", "cmaj7", etc.
            return lower.replace(/\s+/g, '')
        }

        const expectedNormalized = normalize(expectedChord.name)
        const isCorrect = detectedChords.some((detected) => {
            const detectedNormalized = normalize(detected.chord)
            // Exact match first
            if (detectedNormalized === expectedNormalized) return true

            // For minor chords (like Em), accept variants with same root and minor quality
            const minorMatch = expectedNormalized.match(/^([a-g](#|b)?)m$/)
            if (minorMatch && minorMatch[1]) {
                const root = minorMatch[1]
                // Accept Em, Em/G, Em/B, etc. - any minor chord with E root
                return detectedNormalized.startsWith(root) && detectedNormalized.includes('m')
            }

            // For 7th chords (like A7), accept variants with same root and 7th quality
            const seventhMatch = expectedNormalized.match(/^([a-g](#|b)?)7$/)
            if (seventhMatch && seventhMatch[1]) {
                const root = seventhMatch[1]
                // Accept A7, A7/G, A7/C, etc. - any 7th chord with A root
                return detectedNormalized.startsWith(root) && detectedNormalized.includes('7')
            }

            // For maj7 chords (like Amaj7), accept variants with same root and maj7 quality
            const maj7Match = expectedNormalized.match(/^([a-g](#|b)?)maj7$/)
            if (maj7Match && maj7Match[1]) {
                const root = maj7Match[1]
                // Accept Amaj7, Amaj7/G, etc. - any maj7 chord with A root
                return detectedNormalized.startsWith(root) && detectedNormalized.includes('maj7')
            }

            // For m7 chords (like Am7), accept variants with same root and m7 quality
            const m7Match = expectedNormalized.match(/^([a-g](#|b)?)m7$/)
            if (m7Match && m7Match[1]) {
                const root = m7Match[1]
                // Accept Am7, Am7/G, etc. - any m7 chord with A root
                return detectedNormalized.startsWith(root) && detectedNormalized.includes('m7')
            }

            // For plain major triads, accept any variant with same root (e.g., C, C/E)
            const triadMatch = expectedNormalized.match(/^([a-g](#|b)?)$/)
            if (triadMatch && triadMatch[1]) {
                const root = triadMatch[1]
                return detectedNormalized.startsWith(root)
            }

            return false
        })

        console.log(`Expected: ${expectedNormalized}, Match found: ${isCorrect}`)

        analyzer.dispose()
        return isCorrect
    } catch (error) {
        console.error('Error analyzing audio:', error)
        return false
    }
}
