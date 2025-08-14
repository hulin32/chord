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

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('FFTAnalyzer', () => {
    let analyzer: FFTAnalyzer

    beforeEach(() => {
        analyzer = new FFTAnalyzer()
    })

    afterEach(() => {
        analyzer.dispose()
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