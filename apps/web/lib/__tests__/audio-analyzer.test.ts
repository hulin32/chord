import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioAnalyzer, type ChordDetectionResult } from '../audio-analyzer'

describe('AudioAnalyzer', () => {
    let analyzer: AudioAnalyzer

    beforeEach(() => {
        analyzer = new AudioAnalyzer()
        vi.clearAllMocks()
    })

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const result = await analyzer.initialize()
            expect(result).toBe(true)
        })

        it('should handle initialization errors gracefully', async () => {
            // Mock a failure in getUserMedia
            vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('Permission denied'))

            const result = await analyzer.initialize()
            expect(result).toBe(false)
        })
    })

    describe('analyzeAudioBlob', () => {
        it('should analyze audio blob and return chord detection results', async () => {
            const mockBlob = new Blob(['mock audio data'], { type: 'audio/wav' })

            const results = await analyzer.analyzeAudioBlob(mockBlob)
            expect(Array.isArray(results)).toBe(true)
        })

        it('should handle analysis errors gracefully', async () => {
            const invalidBlob = new Blob(['invalid data'], { type: 'text/plain' })

            const results = await analyzer.analyzeAudioBlob(invalidBlob)
            expect(results).toEqual([])
        })
    })

    describe('static methods', () => {
        describe('analyzeChordFromNotes', () => {
            it('should detect C major chord from notes', () => {
                const notes = ['C', 'E', 'G']
                const result = AudioAnalyzer.analyzeChordFromNotes(notes)

                expect(result).not.toBeNull()
                expect(result?.chord).toMatch(/^C/)
                expect(result?.notes).toEqual(expect.arrayContaining(['C', 'E', 'G']))
                expect(result?.confidence).toBeGreaterThan(0)
            })

            it('should detect D minor chord from notes', () => {
                const notes = ['D', 'F', 'A']
                const result = AudioAnalyzer.analyzeChordFromNotes(notes)

                expect(result).not.toBeNull()
                expect(result?.chord).toMatch(/^Dm/)
                expect(result?.notes).toEqual(expect.arrayContaining(['D', 'F', 'A']))
            })

            it('should detect G7 chord from notes', () => {
                const notes = ['G', 'B', 'D', 'F']
                const result = AudioAnalyzer.analyzeChordFromNotes(notes)

                expect(result).not.toBeNull()
                expect(result?.chord).toMatch(/^G7/)
                expect(result?.notes).toEqual(expect.arrayContaining(['G', 'B', 'D', 'F']))
            })

            it('should return null for insufficient notes', () => {
                const result = AudioAnalyzer.analyzeChordFromNotes(['C', 'E'])
                expect(result).toBeNull()
            })

            it('should return null for empty notes array', () => {
                const result = AudioAnalyzer.analyzeChordFromNotes([])
                expect(result).toBeNull()
            })
        })

        describe('getAllPossibleChords', () => {
            it('should return multiple chord possibilities for ambiguous notes', () => {
                const notes = ['C', 'E', 'G']
                const chords = AudioAnalyzer.getAllPossibleChords(notes)

                expect(Array.isArray(chords)).toBe(true)
                expect(chords.length).toBeGreaterThan(0)
                // Tonal returns 'CM' instead of 'C'
                expect(chords.some(chord => chord.includes('C'))).toBe(true)
            })

            it('should handle notes with different octaves', () => {
                const notes = ['C4', 'E4', 'G4']
                const chords = AudioAnalyzer.getAllPossibleChords(notes)

                expect(chords.some(chord => chord.includes('C'))).toBe(true)
            })
        })

        describe('getChordInfo', () => {
            it('should return chord information for valid chord names', () => {
                const info = AudioAnalyzer.getChordInfo('C')
                expect(info).toBeDefined()
                expect(info.name).toBe('C major')
                expect(info.notes).toEqual(['C', 'E', 'G'])
            })

            it('should return chord information for complex chords', () => {
                const info = AudioAnalyzer.getChordInfo('Dm7b5')
                expect(info).toBeDefined()
                expect(info.notes).toEqual(['D', 'F', 'Ab', 'C'])
            })
        })
    })

    describe('cleanup', () => {
        it('should dispose of resources properly', () => {
            analyzer.dispose()
            // Test should not throw any errors
            expect(true).toBe(true)
        })
    })
})