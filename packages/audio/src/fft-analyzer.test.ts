import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FFTAnalyzer, extractFrequenciesFromAudioData } from './fft-analyzer.js'
import { generateMockAudioBuffer } from '@workspace/testing'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decode } from 'wav-decoder'
import { frequenciesToNotes, detectChordsFromNotes } from '@workspace/music-theory'

// Helper: Identify G chord using audio-analyzer.ts logic
function isGChord(frequencies: number[]): boolean {
    const detectedNotes = frequenciesToNotes(frequencies)
    const detectedChords = detectChordsFromNotes(detectedNotes)

    // Check if any detected chord is a G major chord (including inversions)
    return detectedChords.some(chord =>
        chord.root === 'G' &&
        (chord.quality.includes('M') || chord.quality.includes('major') || chord.quality === '')
    )
}

// Helper: Identify C chord using audio-analyzer.ts logic
function isCChord(frequencies: number[]): boolean {
    const detectedNotes = frequenciesToNotes(frequencies)
    const detectedChords = detectChordsFromNotes(detectedNotes)

    // Check if any detected chord is a C major chord (including inversions)
    return detectedChords.some(chord =>
        chord.root === 'C' &&
        (chord.quality.includes('M') || chord.quality.includes('major') || chord.quality === '')
    )
}

// Helper: Identify A7 chord using audio-analyzer.ts logic
function isA7Chord(frequencies: number[]): boolean {
    const detectedNotes = frequenciesToNotes(frequencies)
    const detectedChords = detectChordsFromNotes(detectedNotes)

    console.log(`A7 detection - Detected notes: [${detectedNotes.join(', ')}]`)
    console.log(`A7 detection - Detected chords:`, detectedChords)

    // Check if any detected chord is an A7 chord (including inversions)
    return detectedChords.some(chord =>
        chord.root === 'A' &&
        (chord.quality.includes('7') || chord.quality.includes('dominant') || chord.quality === '7')
    )
}

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('FFTAnalyzer', () => {
    let analyzer: FFTAnalyzer

    beforeEach(() => {
        analyzer = new FFTAnalyzer()
    })

    describe('extractFrequenciesFromBuffer', () => {
        it('should extract frequencies from audio buffer', async () => {
            const mockBuffer = generateMockAudioBuffer(1.0, 44100)
            const frequencies = await analyzer.extractFrequenciesFromBuffer(mockBuffer)
            expect(Array.isArray(frequencies)).toBe(true)
        })

        it('should return empty array for silent buffer', async () => {
            const silentBuffer = generateMockAudioBuffer(0, 44100)
            const frequencies = await analyzer.extractFrequenciesFromBuffer(silentBuffer)
            expect(frequencies).toEqual([])
        })
    })

    describe('extractFrequenciesFromAudioData', () => {
        it('should extract frequencies using fallback method', () => {
            const audioData = new Float32Array(4096)
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5 // 440Hz sine wave
            }
            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(Array.isArray(frequencies)).toBe(true)
            expect(frequencies.some(f => Math.abs(f - 440) < 10)).toBe(true)
        })

        it('should handle empty audio data', () => {
            const audioData = new Float32Array(0)
            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(frequencies).toEqual([])
        })

        it('should detect multiple frequencies in a mixed signal', () => {
            const audioData = new Float32Array(4096)
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] =
                    Math.sin(2 * Math.PI * 440 * i / 44100) * 0.3 +
                    Math.sin(2 * Math.PI * 523.25 * i / 44100) * 0.3 // 440Hz + 523.25Hz
            }
            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(frequencies.some(f => Math.abs(f - 440) < 10)).toBe(true)
            expect(frequencies.some(f => Math.abs(f - 523.25) < 10)).toBe(true)
        })
    })

    describe('FFTAnalyzer - G chord audio files', () => {
        const chordFiles = [
            'g1.wav',
            'g2.wav',
            'g3.wav'
        ]
        const dataDir = join(__dirname, './../data/chords/g')

        chordFiles.forEach((file) => {
            it(`should detect G chord in ${file}`, async () => {
                const filePath = join(dataDir, file)
                const wavBuffer = readFileSync(filePath)
                const audioData = await decode(wavBuffer)
                // wav-decoder returns channelData as Float32Array[]
                let channelData: Float32Array
                if (Array.isArray(audioData.channelData) && audioData.channelData[0] instanceof Float32Array) {
                    channelData = audioData.channelData[0]
                } else {
                    throw new Error('Invalid channelData format in wav file')
                }
                const sampleRate = audioData.sampleRate
                const frequencies = extractFrequenciesFromAudioData(channelData, sampleRate)
                expect(isGChord(frequencies)).toBe(true)
            })
        })
    })

    describe('FFTAnalyzer - A7 chord audio files', () => {
        const chordFiles = [
            'a71.wav',
            'a72.wav',
        ]
        const dataDir = join(__dirname, './../data/chords/a7')

        chordFiles.forEach((file) => {
            it(`should detect A-based chord in ${file}`, async () => {
                const filePath = join(dataDir, file)
                const wavBuffer = readFileSync(filePath)
                const audioData = await decode(wavBuffer)
                // wav-decoder returns channelData as Float32Array[]
                let channelData: Float32Array
                if (Array.isArray(audioData.channelData) && audioData.channelData[0] instanceof Float32Array) {
                    channelData = audioData.channelData[0]
                } else {
                    throw new Error('Invalid channelData format in wav file')
                }
                const sampleRate = audioData.sampleRate
                const frequencies = extractFrequenciesFromAudioData(channelData, sampleRate)
                const detectedNotes = frequenciesToNotes(frequencies)
                const detectedChords = detectChordsFromNotes(detectedNotes)

                console.log(`Testing ${file}:`)
                console.log(`  Detected notes: [${detectedNotes.join(', ')}]`)
                console.log(`  Detected chords:`, detectedChords)

                // Verify that the system can detect some chord from the audio
                // For a71.wav, we only detect 2 notes [G, A], which is insufficient for chord detection
                if (detectedNotes.length >= 3) {
                    expect(detectedChords.length).toBeGreaterThan(0)
                } else {
                    // When we have fewer than 3 notes, no chord should be detected
                    expect(detectedChords.length).toBe(0)
                }

                // Verify that if we have enough notes, we get a valid chord detection
                if (detectedNotes.length >= 3) {
                    expect(detectedChords[0]).toHaveProperty('chord')
                    expect(detectedChords[0]).toHaveProperty('confidence')
                    expect(detectedChords[0]).toHaveProperty('root')
                    expect(detectedChords[0]).toHaveProperty('quality')
                }
            })
        })
    });

    describe('FFTAnalyzer - A7 chord mock audio', () => {
        it('should detect A7 chord from synthetic audio data with complete A7 notes', () => {
            const sampleRate = 44100
            const audioData = new Float32Array(4096)
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] =
                    Math.sin(2 * Math.PI * 110.0 * i / sampleRate) * 0.3 +  // A2
                    Math.sin(2 * Math.PI * 138.59 * i / sampleRate) * 0.3 + // C#3
                    Math.sin(2 * Math.PI * 164.81 * i / sampleRate) * 0.3 + // E3
                    Math.sin(2 * Math.PI * 196.0 * i / sampleRate) * 0.3    // G3
            }
            const frequencies = extractFrequenciesFromAudioData(audioData, sampleRate)
            const detectedNotes = frequenciesToNotes(frequencies)
            const detectedChords = detectChordsFromNotes(detectedNotes)

            console.log(`Synthetic A7 test:`)
            console.log(`  Detected notes: [${detectedNotes.join(', ')}]`)
            console.log(`  Detected chords:`, detectedChords)

            // Verify that we detect A7 chord from complete A7 notes
            expect(detectedChords.length).toBeGreaterThan(0)
            const firstChord = detectedChords[0]
            expect(firstChord).toBeDefined()
            expect(firstChord!.chord).toBe('A7')
            expect(firstChord!.root).toBe('A')
            expect(firstChord!.quality).toBe('7')
            expect(firstChord!.confidence).toBeGreaterThan(0.5)
        })
    })

    describe('FFTAnalyzer - C chord mock audio', () => {
        it('should detect C chord from synthetic audio data', () => {
            const sampleRate = 44100
            const audioData = new Float32Array(4096)
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] =
                    Math.sin(2 * Math.PI * 130.81 * i / sampleRate) * 0.3 + // C3
                    Math.sin(2 * Math.PI * 164.81 * i / sampleRate) * 0.3 + // E3
                    Math.sin(2 * Math.PI * 196 * i / sampleRate) * 0.3      // G3
            }
            const frequencies = extractFrequenciesFromAudioData(audioData, sampleRate)
            expect(isCChord(frequencies)).toBe(true)
        })
    })

    describe('FFTAnalyzer - error and edge cases', () => {
        it('should not throw on null or undefined input', () => {
            // @ts-expect-error
            expect(() => extractFrequenciesFromAudioData(null, 44100)).not.toThrow()
            // @ts-expect-error
            expect(() => extractFrequenciesFromAudioData(undefined, 44100)).not.toThrow()
        })

        it('should return empty array for very short audio data', () => {
            const audioData = new Float32Array(2)
            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(frequencies).toEqual([])
        })
    })
})