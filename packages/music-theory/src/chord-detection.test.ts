import { describe, it, expect } from 'vitest'
import { Chord, Note } from 'tonal'
import {
    detectChordsFromNotes,
    analyzeChordFromNotes,
    getAllPossibleChords,
    getChordInfo,
    calculateConfidence
} from './chord-detection'

describe('Chord Detection', () => {
    describe('basic chord detection', () => {
        it('should detect major chords', () => {
            const testCases = [
                { notes: ['C', 'E', 'G'], expectedChord: 'C' },
                { notes: ['D', 'F#', 'A'], expectedChord: 'D' },
                { notes: ['E', 'G#', 'B'], expectedChord: 'E' },
                { notes: ['F', 'A', 'C'], expectedChord: 'F' },
                { notes: ['G', 'B', 'D'], expectedChord: 'G' },
                { notes: ['A', 'C#', 'E'], expectedChord: 'A' },
                { notes: ['B', 'D#', 'F#'], expectedChord: 'B' },
            ]

            testCases.forEach(({ notes, expectedChord }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                expect(detected[0]).toMatch(new RegExp(`^${expectedChord}`))
            })
        })

        it('should detect minor chords', () => {
            const testCases = [
                { notes: ['A', 'C', 'E'], expectedChord: 'Am' },
                { notes: ['D', 'F', 'A'], expectedChord: 'Dm' },
                { notes: ['E', 'G', 'B'], expectedChord: 'Em' },
                { notes: ['F', 'Ab', 'C'], expectedChord: 'Fm' },
                { notes: ['G', 'Bb', 'D'], expectedChord: 'Gm' },
                { notes: ['B', 'D', 'F#'], expectedChord: 'Bm' },
            ]

            testCases.forEach(({ notes, expectedChord }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                expect(detected[0]).toMatch(new RegExp(`^${expectedChord}`))
            })
        })

        it('should detect 7th chords', () => {
            const testCases = [
                { notes: ['C', 'E', 'G', 'B'], expectedChord: 'Cmaj7' },
                { notes: ['G', 'B', 'D', 'F'], expectedChord: 'G7' },
                { notes: ['A', 'C', 'E', 'G'], expectedChord: 'Am7' },
                { notes: ['D', 'F#', 'A', 'C'], expectedChord: 'D7' },
            ]

            testCases.forEach(({ notes, expectedChord }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                expect(detected[0]).toMatch(new RegExp(`^${expectedChord}`))
            })
        })
    })

    describe('detectChordsFromNotes', () => {
        it('should detect C major chord', () => {
            const result = detectChordsFromNotes(['C', 'E', 'G'])
            expect(result).toHaveLength(1)
            expect(result[0]?.chord).toMatch(/^C/)
            expect(result[0]?.notes).toEqual(expect.arrayContaining(['C', 'E', 'G']))
        })

        it('should return empty array for insufficient notes', () => {
            const result = detectChordsFromNotes(['C', 'E'])
            expect(result).toEqual([])
        })
    })

    describe('analyzeChordFromNotes', () => {
        it('should analyze C major chord', () => {
            const result = analyzeChordFromNotes(['C', 'E', 'G'])
            expect(result).not.toBeNull()
            expect(result?.chord).toMatch(/^C/)
            expect(result?.confidence).toBeGreaterThan(0)
        })

        it('should return null for insufficient notes', () => {
            const result = analyzeChordFromNotes(['C'])
            expect(result).toBeNull()
        })
    })

    describe('getAllPossibleChords', () => {
        it('should return multiple possibilities for C-E-G', () => {
            const chords = getAllPossibleChords(['C', 'E', 'G'])
            expect(chords.length).toBeGreaterThan(0)
            expect(chords.some(chord => chord.includes('C'))).toBe(true)
        })
    })

    describe('calculateConfidence', () => {
        it('should calculate perfect confidence for exact match', () => {
            const confidence = calculateConfidence(['C', 'E', 'G'], ['C', 'E', 'G'])
            expect(confidence).toBe(1.0)
        })

        it('should calculate partial confidence', () => {
            const confidence = calculateConfidence(['C', 'E'], ['C', 'E', 'G'])
            expect(confidence).toBeCloseTo(0.667, 3)
        })
    })

    describe('chord inversions', () => {
        it('should detect root position chords', () => {
            const notes = ['C', 'E', 'G']
            const detected = Chord.detect(notes)
            expect(detected[0]).toMatch(/^C/)
        })

        it('should detect first inversion chords', () => {
            const notes = ['E', 'G', 'C'] // C major first inversion
            const detected = Chord.detect(notes)
            expect(detected.some(chord => chord.includes('C'))).toBe(true)
        })

        it('should detect second inversion chords', () => {
            const notes = ['G', 'C', 'E'] // C major second inversion
            const detected = Chord.detect(notes)
            expect(detected.some(chord => chord.includes('C'))).toBe(true)
        })
    })
})