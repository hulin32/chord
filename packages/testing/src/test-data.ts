import type { ChordDetectionResult } from '@workspace/types'

/**
 * Common chord definitions for testing
 */
export const TEST_CHORDS = {
    // Major chords
    C_MAJOR: { notes: ['C', 'E', 'G'], expectedChord: 'C' },
    D_MAJOR: { notes: ['D', 'F#', 'A'], expectedChord: 'D' },
    E_MAJOR: { notes: ['E', 'G#', 'B'], expectedChord: 'E' },
    F_MAJOR: { notes: ['F', 'A', 'C'], expectedChord: 'F' },
    G_MAJOR: { notes: ['G', 'B', 'D'], expectedChord: 'G' },
    A_MAJOR: { notes: ['A', 'C#', 'E'], expectedChord: 'A' },
    B_MAJOR: { notes: ['B', 'D#', 'F#'], expectedChord: 'B' },

    // Minor chords
    A_MINOR: { notes: ['A', 'C', 'E'], expectedChord: 'Am' },
    D_MINOR: { notes: ['D', 'F', 'A'], expectedChord: 'Dm' },
    E_MINOR: { notes: ['E', 'G', 'B'], expectedChord: 'Em' },
    F_MINOR: { notes: ['F', 'Ab', 'C'], expectedChord: 'Fm' },
    G_MINOR: { notes: ['G', 'Bb', 'D'], expectedChord: 'Gm' },
    B_MINOR: { notes: ['B', 'D', 'F#'], expectedChord: 'Bm' },

    // 7th chords
    C_MAJOR7: { notes: ['C', 'E', 'G', 'B'], expectedChord: 'Cmaj7' },
    G_DOMINANT7: { notes: ['G', 'B', 'D', 'F'], expectedChord: 'G7' },
    A_MINOR7: { notes: ['A', 'C', 'E', 'G'], expectedChord: 'Am7' },
    D_DOMINANT7: { notes: ['D', 'F#', 'A', 'C'], expectedChord: 'D7' },

    // Diminished and Augmented
    C_DIMINISHED: { notes: ['C', 'Eb', 'Gb'], expectedChord: 'Cdim' },
    C_AUGMENTED: { notes: ['C', 'E', 'G#'], expectedChord: 'Caug' }
} as const

/**
 * Common frequencies for testing (in Hz)
 */
export const TEST_FREQUENCIES = {
    // Piano key frequencies
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,

    // Guitar string frequencies (standard tuning)
    E2: 82.41,  // Low E
    A2: 110.00, // A
    D3: 146.83, // D
    G3: 196.00, // G
    B3: 246.94, // B
    E4_HIGH: 329.63 // High E
} as const

/**
 * Expected MIDI note numbers for testing
 */
export const TEST_MIDI_NOTES = {
    C4: 60,
    A4: 69,
    C5: 72,
    A3: 57
} as const

/**
 * Sample audio data for testing
 */
export function generateTestAudioData(frequency: number, duration = 1.0, sampleRate = 44100): Float32Array {
    const length = Math.floor(duration * sampleRate)
    const data = new Float32Array(length)

    for (let i = 0; i < length; i++) {
        data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5
    }

    return data
}

/**
 * Generate test frequency spectrum data
 */
export function generateTestFrequencySpectrum(frequencies: number[], amplitudes: number[]): Uint8Array {
    const spectrum = new Uint8Array(1024)
    spectrum.fill(10) // Low background noise

    frequencies.forEach((freq, index) => {
        const bin = Math.round(freq / 21.5) // Approximate bin for 44100/2048
        if (bin >= 0 && bin < spectrum.length) {
            spectrum[bin] = amplitudes[index] || 100
        }
    })

    return spectrum
}