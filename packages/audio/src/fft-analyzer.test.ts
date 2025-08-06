import { describe, it, expect } from 'vitest'
import { FFTAnalyzer, extractFrequenciesFromAudioData } from './fft-analyzer.js'
import { generateMockAudioBuffer } from '@workspace/testing'

describe('FFTAnalyzer', () => {
    describe('extractFrequenciesFromBuffer', () => {
        it('should extract frequencies from audio buffer', async () => {
            const analyzer = new FFTAnalyzer()

            const mockBuffer = generateMockAudioBuffer(1.0, 44100)

            const frequencies = await analyzer.extractFrequenciesFromBuffer(mockBuffer)
            expect(Array.isArray(frequencies)).toBe(true)

            analyzer.dispose()
        })
    })

    describe('extractFrequenciesFromAudioData', () => {
        it('should extract frequencies using fallback method', () => {
            const audioData = new Float32Array(4096)
            // Add some sample data
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5 // 440Hz sine wave
            }

            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(Array.isArray(frequencies)).toBe(true)
        })

        it('should handle empty audio data', () => {
            const audioData = new Float32Array(0)
            const frequencies = extractFrequenciesFromAudioData(audioData, 44100)
            expect(frequencies).toEqual([])
        })
    })
})