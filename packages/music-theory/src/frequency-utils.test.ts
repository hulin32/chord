import { describe, it, expect } from 'vitest'
import {
    extractDominantFrequenciesFromFFT,
    findFrequencyPeaks,
    calculateAdaptiveThreshold
} from './frequency-utils'

describe('Frequency Utils', () => {
    describe('extractDominantFrequenciesFromFFT', () => {
        it('should extract frequencies from FFT data', () => {
            const frequencyData = new Uint8Array(1024)
            frequencyData.fill(20) // Background noise

            // Add peaks at specific frequencies
            const sampleRate = 44100
            const fftSize = 2048
            const binSize = sampleRate / fftSize

            // Add peak at ~440Hz (A4)
            const a4Bin = Math.round(440 / binSize)
            frequencyData[a4Bin] = 150

            const frequencies = extractDominantFrequenciesFromFFT(frequencyData, sampleRate, fftSize)
            expect(frequencies.length).toBeGreaterThan(0)
        })
    })

    describe('findFrequencyPeaks', () => {
        it('should find peaks in frequency data', () => {
            const frequencyData = new Uint8Array(1024)
            frequencyData.fill(20)

            // Add clear peaks with proper neighbors (within 80-2000Hz range)
            // At 21.53Hz per bin: index 10 = 215Hz, index 20 = 431Hz, index 30 = 646Hz
            frequencyData[9] = 25
            frequencyData[10] = 150
            frequencyData[11] = 25

            frequencyData[19] = 25
            frequencyData[20] = 120
            frequencyData[21] = 25

            frequencyData[29] = 25
            frequencyData[30] = 140
            frequencyData[31] = 25

            const peaks = findFrequencyPeaks(frequencyData, 44100, 2048)
            expect(peaks.length).toBeGreaterThan(0)
            if (peaks.length > 1) {
                expect(peaks[0]?.amplitude).toBeGreaterThanOrEqual(peaks[1]?.amplitude ?? 0) // Should be sorted by amplitude
            }
        })

        it('should respect frequency range options', () => {
            const frequencyData = new Uint8Array(1024)
            frequencyData.fill(20)
            frequencyData[10] = 150 // Low frequency peak

            const peaks = findFrequencyPeaks(frequencyData, 44100, 2048, {
                minFrequency: 200, // Exclude the low frequency
                maxFrequency: 1000
            })

            // Should not find the low frequency peak
            const lowFreqPeak = peaks.find(p => p.frequency < 200)
            expect(lowFreqPeak).toBeUndefined()
        })
    })

    describe('calculateAdaptiveThreshold', () => {
        it('should calculate threshold based on max amplitude', () => {
            const frequencyData = new Uint8Array([10, 20, 100, 30, 15])
            const threshold = calculateAdaptiveThreshold(frequencyData)
            expect(threshold).toBe(30) // 30% of 100
        })

        it('should use minimum threshold when signal is weak', () => {
            const frequencyData = new Uint8Array([5, 10, 15, 8, 12])
            const threshold = calculateAdaptiveThreshold(frequencyData, { minThreshold: 25 })
            expect(threshold).toBe(25) // Uses minimum since 30% of 15 is only 4.5
        })
    })
})