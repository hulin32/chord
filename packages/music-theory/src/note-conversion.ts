import type { ChordDetectionResult, MidiNote, Frequency, NoteInfo } from '@workspace/types'
import { Note, Midi } from 'tonal'

/**
 * Convert frequencies to musical notes
 */
export function frequenciesToNotes(frequencies: Frequency[]): string[] {
    const notes: string[] = []

    console.log(`Converting ${frequencies.length} frequencies to notes:`)

    frequencies.forEach(freq => {
        const midiNote = Math.round(12 * Math.log2(freq / 440) + 69)
        if (midiNote >= 0 && midiNote <= 127) {
            const noteName = Midi.midiToNoteName(midiNote)
            if (noteName) {
                const pc = Note.get(noteName).pc
                if (pc) {
                    notes.push(pc)
                    console.log(`  ${freq.toFixed(1)}Hz -> MIDI ${midiNote} -> ${noteName} -> ${pc}`)
                }
            }
        } else {
            console.log(`  ${freq.toFixed(1)}Hz -> MIDI ${midiNote} (out of range)`)
        }
    })

    const uniqueNotes = [...new Set(notes)]
    console.log(`Unique notes detected: [${uniqueNotes.join(', ')}]`)
    return uniqueNotes
}

/**
 * Convert frequency to MIDI note number
 */
export function frequencyToMidi(frequency: Frequency): MidiNote {
    return Math.round(12 * Math.log2(frequency / 440) + 69)
}

/**
 * Convert MIDI note to frequency
 */
export function midiToFrequency(midiNote: MidiNote): Frequency {
    return 440 * Math.pow(2, (midiNote - 69) / 12)
}

/**
 * Get note information from frequency
 */
export function frequencyToNoteInfo(frequency: Frequency): NoteInfo | null {
    const midiNote = frequencyToMidi(frequency)
    if (midiNote < 0 || midiNote > 127) return null

    const noteName = Midi.midiToNoteName(midiNote)
    if (!noteName) return null

    const note = Note.get(noteName)
    return {
        name: noteName,
        pc: note.pc!,
        oct: note.oct,
        midi: midiNote,
        freq: frequency
    }
}

/**
 * Check if frequency is in musical range
 */
export function isInMusicalRange(frequency: Frequency, minFreq = 80, maxFreq = 2000): boolean {
    return frequency >= minFreq && frequency <= maxFreq
}

/**
 * Normalize note names (remove octave information)
 */
export function normalizeNotes(notes: string[]): string[] {
    return notes.map(n => Note.get(n).pc).filter(Boolean) as string[]
}