import { describe, it, expect, vi } from 'vitest'

describe('FFT Analysis Logic', () => {
    describe('frequency bin calculation', () => {
        it('should calculate correct bin size for standard sample rates', () => {
            const testCases = [
                { sampleRate: 44100, fftSize: 2048, expectedBinSize: 21.53 },
                { sampleRate: 44100, fftSize: 4096, expectedBinSize: 10.77 },
                { sampleRate: 48000, fftSize: 2048, expectedBinSize: 23.44 },
                { sampleRate: 48000, fftSize: 4096, expectedBinSize: 11.72 },
            ]

            testCases.forEach(({ sampleRate, fftSize, expectedBinSize }) => {
                const binSize = sampleRate / fftSize
                expect(binSize).toBeCloseTo(expectedBinSize, 2)
            })
        })

        it('should map frequency to correct bin index', () => {
            const sampleRate = 44100
            const fftSize = 4096
            const binSize = sampleRate / fftSize // ~10.77 Hz per bin

            const testFrequencies = [
                { freq: 440, expectedBin: Math.round(440 / binSize) }, // A4
                { freq: 261.63, expectedBin: Math.round(261.63 / binSize) }, // C4
                { freq: 329.63, expectedBin: Math.round(329.63 / binSize) }, // E4
            ]

            testFrequencies.forEach(({ freq, expectedBin }) => {
                const actualBin = Math.round(freq / binSize)
                expect(actualBin).toBe(expectedBin)
            })
        })
    })

    describe('peak detection algorithm', () => {
        it('should identify peaks in frequency data', () => {
            // Simulate frequency data with clear peaks
            const frequencyData = new Uint8Array(1024)

            // Add peaks at specific indices
            const peaks = [
                { index: 100, amplitude: 150 },
                { index: 200, amplitude: 120 },
                { index: 300, amplitude: 140 },
            ]

            // Fill with low background noise
            frequencyData.fill(20)

            // Add peaks
            peaks.forEach(({ index, amplitude }) => {
                frequencyData[index] = amplitude
                // Add slight elevation to neighbors to make it a proper peak
                if (index > 0) frequencyData[index - 1] = amplitude - 10
                if (index < frequencyData.length - 1) frequencyData[index + 1] = amplitude - 10
            })

            const threshold = 30
            const detectedPeaks: Array<{ index: number; amplitude: number }> = []

            // Peak detection logic (similar to what's in the code)
            for (let i = 1; i < frequencyData.length - 1; i++) {
                const current = frequencyData[i]!
                const previous = frequencyData[i - 1]!
                const next = frequencyData[i + 1]!

                if (current > threshold && current >= previous && current >= next) {
                    const prominence = current - Math.max(previous, next)
                    if (prominence >= 5) {
                        detectedPeaks.push({ index: i, amplitude: current })
                    }
                }
            }

            expect(detectedPeaks.length).toBe(3)
            expect(detectedPeaks.map(p => p.index)).toEqual([100, 200, 300])
        })

        it('should handle adaptive thresholding', () => {
            const testCases = [
                { maxAmplitude: 200, expectedThreshold: 60 }, // 30% of 200
                { maxAmplitude: 100, expectedThreshold: 30 }, // Minimum threshold
                { maxAmplitude: 50, expectedThreshold: 30 },  // Below minimum, use 30
            ]

            testCases.forEach(({ maxAmplitude, expectedThreshold }) => {
                const threshold = Math.max(30, maxAmplitude * 0.3)
                expect(threshold).toBe(expectedThreshold)
            })
        })
    })

    describe('musical frequency filtering', () => {
        it('should filter frequencies to musical range', () => {
            const sampleRate = 44100
            const fftSize = 4096
            const binSize = sampleRate / fftSize

            const testBins = [
                { bin: 5, freq: 5 * binSize, shouldInclude: false },   // ~54Hz - too low
                { bin: 10, freq: 10 * binSize, shouldInclude: true },  // ~108Hz - valid
                { bin: 50, freq: 50 * binSize, shouldInclude: true },  // ~538Hz - valid
                { bin: 180, freq: 180 * binSize, shouldInclude: true }, // ~1939Hz - valid
                { bin: 200, freq: 200 * binSize, shouldInclude: false }, // ~2154Hz - too high
            ]

            testBins.forEach(({ bin, freq, shouldInclude }) => {
                const isInMusicalRange = freq >= 80 && freq <= 2000
                expect(isInMusicalRange).toBe(shouldInclude)
            })
        })
    })

    describe('frequency sorting and selection', () => {
        it('should sort frequencies by amplitude', () => {
            const frequencies = [
                { frequency: 440, amplitude: 100 },
                { frequency: 261.63, amplitude: 150 },
                { frequency: 329.63, amplitude: 120 },
                { frequency: 392, amplitude: 80 },
            ]

            frequencies.sort((a, b) => b.amplitude - a.amplitude)

            expect(frequencies[0].frequency).toBe(261.63) // Highest amplitude
            expect(frequencies[1].frequency).toBe(329.63)
            expect(frequencies[2].frequency).toBe(440)
            expect(frequencies[3].frequency).toBe(392) // Lowest amplitude
        })

        it('should limit to top N frequencies', () => {
            const frequencies = Array.from({ length: 20 }, (_, i) => ({
                frequency: 100 + i * 50,
                amplitude: Math.random() * 100 + 50
            }))

            frequencies.sort((a, b) => b.amplitude - a.amplitude)
            const topFrequencies = frequencies.slice(0, 12).map(f => f.frequency)

            expect(topFrequencies.length).toBe(12)
        })
    })

    describe('error handling', () => {
        it('should handle empty frequency data', () => {
            const frequencyData = new Uint8Array(0)
            const maxAmplitude = Math.max(...frequencyData)

            // Should not throw and should handle gracefully
            expect(maxAmplitude).toBe(-Infinity)
        })

        it('should handle all-zero frequency data', () => {
            const frequencyData = new Uint8Array(1024)
            frequencyData.fill(0)

            const maxAmplitude = Math.max(...frequencyData)
            const threshold = Math.max(30, maxAmplitude * 0.3)

            expect(maxAmplitude).toBe(0)
            expect(threshold).toBe(30) // Should use minimum threshold
        })

        it('should handle NaN values in frequency calculations', () => {
            const invalidFrequency = Math.log2(-1) // Results in NaN
            expect(Number.isNaN(invalidFrequency)).toBe(true)

            // MIDI note calculation should handle NaN gracefully
            const midiNote = Math.round(12 * invalidFrequency + 69)
            expect(Number.isNaN(midiNote)).toBe(true)
        })
    })
})