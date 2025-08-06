import { describe, it, expect } from 'vitest'
import { Chord, Note } from 'tonal'

describe('Chord Detection Logic', () => {
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

        it('should detect diminished chords', () => {
            const testCases = [
                { notes: ['C', 'Eb', 'Gb'], expectedChord: 'Cdim' },
                { notes: ['F#', 'A', 'C'], expectedChord: 'F#dim' },
                { notes: ['B', 'D', 'F'], expectedChord: 'Bdim' },
            ]

            testCases.forEach(({ notes, expectedChord }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                expect(detected[0]).toMatch(new RegExp(`^${expectedChord}`))
            })
        })

        it('should detect augmented chords', () => {
            const testCases = [
                { notes: ['C', 'E', 'G#'], expectedChord: 'Caug' },
                { notes: ['F', 'A', 'C#'], expectedChord: 'Faug' },
                { notes: ['G', 'B', 'D#'], expectedChord: 'Gaug' },
            ]

            testCases.forEach(({ notes, expectedChord }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                expect(detected[0]).toMatch(new RegExp(`^${expectedChord}`))
            })
        })
    })

    describe('note normalization', () => {
        it('should normalize notes with octave information', () => {
            const notesWithOctaves = ['C4', 'E4', 'G4']
            const normalizedNotes = notesWithOctaves.map(n => Note.get(n).pc).filter(Boolean)
            expect(normalizedNotes).toEqual(['C', 'E', 'G'])
        })

        it('should handle enharmonic equivalents', () => {
            const sharps = ['C#', 'D#', 'F#', 'G#', 'A#']
            const flats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb']

            // Test that both sharp and flat versions are recognized
            sharps.forEach(note => {
                const pc = Note.get(note).pc
                expect(pc).toBeTruthy()
            })

            flats.forEach(note => {
                const pc = Note.get(note).pc
                expect(pc).toBeTruthy()
            })
        })

        it('should filter out invalid notes', () => {
            const mixedNotes = ['C', 'invalid', 'E', '', 'G', 'not-a-note']
            const validNotes = mixedNotes.map(n => Note.get(n).pc).filter(Boolean)
            expect(validNotes).toEqual(['C', 'E', 'G'])
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
            // Should detect some form of C chord, might be CM/E (C major with E bass)
            expect(detected.some(chord => chord.includes('C'))).toBe(true)
        })

        it('should detect second inversion chords', () => {
            const notes = ['G', 'C', 'E'] // C major second inversion
            const detected = Chord.detect(notes)
            // Should detect some form of C chord, might be CM/G (C major with G bass)
            expect(detected.some(chord => chord.includes('C'))).toBe(true)
        })
    })

    describe('complex chord progressions', () => {
        it('should handle notes from ii-V-I progression', () => {
            const progressions = [
                { notes: ['D', 'F', 'A'], description: 'ii (Dm)' },
                { notes: ['G', 'B', 'D', 'F'], description: 'V7 (G7)' },
                { notes: ['C', 'E', 'G'], description: 'I (C)' },
            ]

            progressions.forEach(({ notes, description }) => {
                const detected = Chord.detect(notes)
                expect(detected.length).toBeGreaterThan(0)
                // Just ensure we get some chord detection for each
            })
        })
    })

    describe('edge cases', () => {
        it('should handle insufficient notes', () => {
            const detected = Chord.detect(['C'])
            expect(detected).toEqual([])
        })

        it('should handle empty array', () => {
            const detected = Chord.detect([])
            expect(detected).toEqual([])
        })

        it('should handle duplicate notes', () => {
            const notes = ['C', 'C', 'E', 'E', 'G', 'G']
            const detected = Chord.detect(notes)
            expect(detected.length).toBeGreaterThan(0)
            expect(detected[0]).toMatch(/^C/)
        })

        it('should handle notes with many harmonics', () => {
            // Simulate a case where we detect many frequencies from a single chord
            const notes = ['C', 'C', 'E', 'G', 'C', 'E'] // Fundamental + harmonics
            const detected = Chord.detect(notes)
            expect(detected.length).toBeGreaterThan(0)
            expect(detected[0]).toMatch(/^C/)
        })
    })
})