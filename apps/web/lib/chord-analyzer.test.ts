import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChordAnalyzer, analyzeAudio } from './chord-analyzer'
import type { Chord } from './chords'

// Mock the workspace packages
vi.mock('@workspace/audio', () => ({
    AudioAnalyzer: class MockAudioAnalyzer {
        initialize = vi.fn().mockResolvedValue(true)
        startAnalysis = vi.fn()
        stopAnalysis = vi.fn()
        analyzeAudioBlob = vi.fn().mockResolvedValue([{
            chord: 'C',
            confidence: 1.0,
            notes: ['C', 'E', 'G'],
            root: 'C',
            quality: 'major'
        }])
        dispose = vi.fn()
        static analyzeChordFromNotes = vi.fn().mockReturnValue({
            chord: 'C',
            confidence: 1.0,
            notes: ['C', 'E', 'G'],
            root: 'C',
            quality: 'major'
        })
        static getAllPossibleChords = vi.fn().mockReturnValue(['C', 'CM'])
        static getChordInfo = vi.fn().mockReturnValue({
            name: 'C major',
            notes: ['C', 'E', 'G']
        })
    },
    FFTAnalyzer: class MockFFTAnalyzer {
        extractFrequenciesFromBuffer = vi.fn().mockResolvedValue([261.63, 329.63, 392.00])
        dispose = vi.fn()
    }
}))

describe('ChordAnalyzer', () => {
    let analyzer: ChordAnalyzer

    beforeEach(() => {
        analyzer = new ChordAnalyzer()
        vi.clearAllMocks()
    })

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const result = await analyzer.initialize()
            expect(result).toBe(true)
        })
    })

    describe('audio analysis', () => {
        it('should analyze audio blob', async () => {
            const mockBlob = new Blob(['test'], { type: 'audio/wav' })
            const results = await analyzer.analyzeAudioBlob(mockBlob)

            expect(Array.isArray(results)).toBe(true)
            expect(results[0]).toEqual(expect.objectContaining({
                chord: 'C',
                confidence: 1.0,
                notes: ['C', 'E', 'G']
            }))
        })
    })

    describe('static methods', () => {
        it('should analyze chord from notes', () => {
            const result = ChordAnalyzer.analyzeChordFromNotes(['C', 'E', 'G'])
            expect(result).toEqual(expect.objectContaining({
                chord: 'C',
                notes: ['C', 'E', 'G']
            }))
        })

        it('should get possible chords', () => {
            const chords = ChordAnalyzer.getAllPossibleChords(['C', 'E', 'G'])
            expect(chords).toEqual(['C', 'CM'])
        })

        it('should get chord info', () => {
            const info = ChordAnalyzer.getChordInfo('C')
            expect(info).toEqual({
                name: 'C major',
                notes: ['C', 'E', 'G']
            })
        })
    })

    describe('cleanup', () => {
        it('should dispose properly', () => {
            analyzer.dispose()
            expect(true).toBe(true) // Should not throw
        })
    })
})

describe('analyzeAudio', () => {
    it('should analyze audio and return boolean result', async () => {
        const mockBlob = new Blob(['test'], { type: 'audio/wav' })
        const mockChord: Chord = {
            name: 'C Major',
            frets: [0, 3, 2, 0, 1, 0],
            fingers: [0, 3, 2, 0, 1, 0]
        }

        const result = await analyzeAudio(mockBlob, mockChord)
        expect(typeof result).toBe('boolean')
    })

    it('should handle errors gracefully', async () => {
        const mockBlob = new Blob(['test'], { type: 'audio/wav' })
        const mockChord: Chord = {
            name: 'Invalid Chord',
            frets: [0, 0, 0, 0, 0, 0],
            fingers: [0, 0, 0, 0, 0, 0]
        }

        // This should not throw even with invalid data
        const result = await analyzeAudio(mockBlob, mockChord)
        expect(typeof result).toBe('boolean')
    })
})