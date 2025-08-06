import { describe, it, expect } from 'vitest'
import {
    frequenciesToNotes,
    frequencyToMidi,
    midiToFrequency,
    frequencyToNoteInfo,
    isInMusicalRange,
    normalizeNotes
} from './note-conversion'

describe('Note Conversion', () => {
    describe('frequencyToMidi', () => {
        it('should convert A4 (440Hz) to MIDI note 69', () => {
            const midiNote = frequencyToMidi(440.0)
            expect(midiNote).toBe(69)
        })

        it('should convert C4 (261.63Hz) to MIDI note 60', () => {
            const midiNote = frequencyToMidi(261.63)
            expect(midiNote).toBe(60)
        })

        it('should convert E4 (329.63Hz) to MIDI note 64', () => {
            const midiNote = frequencyToMidi(329.63)
            expect(midiNote).toBe(64)
        })

        it('should convert G4 (392.00Hz) to MIDI note 67', () => {
            const midiNote = frequencyToMidi(392.00)
            expect(midiNote).toBe(67)
        })

        it('should handle octave changes correctly', () => {
            const a5Frequency = 880.0 // A5 is one octave above A4
            const midiNote = frequencyToMidi(a5Frequency)
            expect(midiNote).toBe(81) // 69 + 12
        })
    })

    describe('midiToFrequency', () => {
        it('should convert MIDI 69 to 440Hz', () => {
            const frequency = midiToFrequency(69)
            expect(frequency).toBeCloseTo(440, 1)
        })

        it('should convert MIDI 60 to ~261.63Hz', () => {
            const frequency = midiToFrequency(60)
            expect(frequency).toBeCloseTo(261.63, 1)
        })
    })

    describe('frequencyToNoteInfo', () => {
        it('should return note info for A4', () => {
            const noteInfo = frequencyToNoteInfo(440)
            expect(noteInfo).not.toBeNull()
            expect(noteInfo?.pc).toBe('A')
            expect(noteInfo?.midi).toBe(69)
        })

        it('should return null for out-of-range frequencies', () => {
            const noteInfo = frequencyToNoteInfo(-100)
            expect(noteInfo).toBeNull()
        })
    })

    describe('isInMusicalRange', () => {
        it('should identify frequencies in musical range', () => {
            const testCases = [
                { freq: 50, expected: false },   // Too low
                { freq: 82.41, expected: true }, // E2
                { freq: 440, expected: true },   // A4
                { freq: 1975, expected: true },  // B6
                { freq: 2500, expected: false }, // Too high
            ]

            testCases.forEach(({ freq, expected }) => {
                expect(isInMusicalRange(freq)).toBe(expected)
            })
        })

        it('should respect custom range', () => {
            expect(isInMusicalRange(100, 200, 300)).toBe(false)
            expect(isInMusicalRange(250, 200, 300)).toBe(true)
        })
    })

    describe('normalizeNotes', () => {
        it('should normalize notes with octave information', () => {
            const normalized = normalizeNotes(['C4', 'E4', 'G4'])
            expect(normalized).toEqual(['C', 'E', 'G'])
        })

        it('should filter out invalid notes', () => {
            const normalized = normalizeNotes(['C', 'invalid', 'E', 'G'])
            expect(normalized).toEqual(['C', 'E', 'G'])
        })
    })

    describe('frequenciesToNotes', () => {
        it('should convert multiple frequencies to notes', () => {
            const frequencies = [261.63, 329.63, 392.00] // C4, E4, G4
            const notes = frequenciesToNotes(frequencies)
            expect(notes).toEqual(expect.arrayContaining(['C', 'E', 'G']))
        })

        it('should remove duplicates', () => {
            const frequencies = [261.63, 261.63, 329.63] // Two C4s and one E4
            const notes = frequenciesToNotes(frequencies)
            expect(notes).toEqual(['C', 'E'])
        })
    })
})