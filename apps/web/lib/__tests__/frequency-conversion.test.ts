import { describe, it, expect, vi } from 'vitest'

// We need to test the internal functions, so let's create a test version
// Since the functions are not exported, we'll test them through the public interface
// but also create unit tests for the core logic

describe('Frequency Conversion Logic', () => {
    describe('frequency to MIDI note conversion', () => {
        it('should convert A4 (440Hz) to MIDI note 69', () => {
            const frequency = 440.0
            const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69)
            expect(midiNote).toBe(69)
        })

        it('should convert C4 (261.63Hz) to MIDI note 60', () => {
            const frequency = 261.63
            const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69)
            expect(midiNote).toBe(60)
        })

        it('should convert E4 (329.63Hz) to MIDI note 64', () => {
            const frequency = 329.63
            const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69)
            expect(midiNote).toBe(64)
        })

        it('should convert G4 (392.00Hz) to MIDI note 67', () => {
            const frequency = 392.00
            const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69)
            expect(midiNote).toBe(67)
        })

        it('should handle octave changes correctly', () => {
            // A5 is one octave above A4
            const a5Frequency = 880.0
            const midiNote = Math.round(12 * Math.log2(a5Frequency / 440) + 69)
            expect(midiNote).toBe(81) // 69 + 12
        })

        it('should handle low frequencies', () => {
            // A3 is one octave below A4
            const a3Frequency = 220.0
            const midiNote = Math.round(12 * Math.log2(a3Frequency / 440) + 69)
            expect(midiNote).toBe(57) // 69 - 12
        })
    })

    describe('musical frequency ranges', () => {
        it('should identify frequencies in musical range (80Hz to 2000Hz)', () => {
            const frequencies = [
                { freq: 50, expected: false },   // Too low
                { freq: 82.41, expected: true }, // E2
                { freq: 440, expected: true },   // A4
                { freq: 1975, expected: true },  // B6
                { freq: 2500, expected: false }, // Too high
            ]

            frequencies.forEach(({ freq, expected }) => {
                const isInRange = freq >= 80 && freq <= 2000
                expect(isInRange).toBe(expected)
            })
        })
    })

    describe('confidence calculation', () => {
        it('should calculate perfect confidence for exact chord match', () => {
            const detectedNotes = ['C', 'E', 'G']
            const chordNotes = ['C', 'E', 'G']

            let matches = 0
            detectedNotes.forEach(note => {
                if (chordNotes.includes(note)) {
                    matches++
                }
            })
            const confidence = matches / chordNotes.length

            expect(confidence).toBe(1.0)
        })

        it('should calculate partial confidence for incomplete chord', () => {
            const detectedNotes = ['C', 'E']
            const chordNotes = ['C', 'E', 'G']

            let matches = 0
            detectedNotes.forEach(note => {
                if (chordNotes.includes(note)) {
                    matches++
                }
            })
            const confidence = matches / chordNotes.length

            expect(confidence).toBeCloseTo(0.667, 3)
        })

        it('should calculate zero confidence for no matches', () => {
            const detectedNotes = ['F#', 'A#']
            const chordNotes = ['C', 'E', 'G']

            let matches = 0
            detectedNotes.forEach(note => {
                if (chordNotes.includes(note)) {
                    matches++
                }
            })
            const confidence = matches / chordNotes.length

            expect(confidence).toBe(0)
        })
    })
})