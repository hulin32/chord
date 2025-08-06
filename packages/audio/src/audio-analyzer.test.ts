import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioAnalyzer } from './audio-analyzer'

// Mock MediaStream for AudioAnalyzer
class MockMediaStream {
    getTracks() {
        return [{ stop: vi.fn() }]
    }
}

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: mockGetUserMedia
    },
    writable: true
})

describe('AudioAnalyzer', () => {
    let analyzer: AudioAnalyzer

    beforeEach(() => {
        analyzer = new AudioAnalyzer()
        vi.clearAllMocks()
        // Setup default successful getUserMedia mock
        mockGetUserMedia.mockResolvedValue(new MockMediaStream())
    })

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const result = await analyzer.initialize()
            expect(result).toBe(true)
        })

        it('should handle initialization errors gracefully', async () => {
            // Mock a failure in getUserMedia
            mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

            const result = await analyzer.initialize()
            expect(result).toBe(false)
        })

        it('should accept configuration options', async () => {
            const config = {
                fftSize: 4096,
                smoothingTimeConstant: 0.5,
                minDecibels: -80,
                maxDecibels: -20
            }

            const result = await analyzer.initialize(config)
            expect(result).toBe(true)
        })
    })

    describe('analyzeAudioBlob', () => {
        it('should analyze audio blob and return chord detection results', async () => {
            const mockBlob = {
                arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
                type: 'audio/wav'
            } as unknown as Blob

            const results = await analyzer.analyzeAudioBlob(mockBlob)
            expect(Array.isArray(results)).toBe(true)
        })

        it('should handle analysis errors gracefully', async () => {
            const invalidBlob = {
                arrayBuffer: vi.fn().mockRejectedValue(new Error('Invalid blob')),
                type: 'text/plain'
            } as unknown as Blob

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

            it('should return null for insufficient notes', () => {
                const result = AudioAnalyzer.analyzeChordFromNotes(['C', 'E'])
                expect(result).toBeNull()
            })
        })

        describe('getAllPossibleChords', () => {
            it('should return chord possibilities', () => {
                const notes = ['C', 'E', 'G']
                const chords = AudioAnalyzer.getAllPossibleChords(notes)

                expect(Array.isArray(chords)).toBe(true)
                expect(chords.length).toBeGreaterThan(0)
                expect(chords.some((chord: string) => chord.includes('C'))).toBe(true)
            })
        })

        describe('getChordInfo', () => {
            it('should return chord information', () => {
                const info = AudioAnalyzer.getChordInfo('C')
                expect(info).toBeDefined()
                expect(info.name).toBe('C major')
                expect(info.notes).toEqual(['C', 'E', 'G'])
            })
        })
    })

    describe('cleanup', () => {
        it('should dispose of resources properly', () => {
            analyzer.dispose()
            expect(true).toBe(true) // Should not throw
        })
    })
})