import type { Frequency, Amplitude, FrequencyPeak } from '@workspace/types'

/**
 * Extract dominant frequencies from FFT data
 */
export function extractDominantFrequenciesFromFFT(
    frequencyData: Uint8Array,
    sampleRate: number,
    fftSize: number
): Frequency[] {
    const binSize = sampleRate / fftSize
    const candidatePeaks: FrequencyPeak[] = []

    console.log(`FFT analysis: sampleRate=${sampleRate}, fftSize=${fftSize}, binSize=${binSize.toFixed(2)}Hz`)

    // Find the maximum amplitude to calculate relative thresholds
    const maxAmplitude = Math.max(...frequencyData)
    const threshold = Math.max(30, maxAmplitude * 0.3) // Adaptive threshold

    console.log(`Max amplitude: ${maxAmplitude}, Threshold: ${threshold}`)

    // Look for peaks in the frequency spectrum
    for (let i = 1; i < frequencyData.length - 1; i++) {
        const current = frequencyData[i]!
        const previous = frequencyData[i - 1]!
        const next = frequencyData[i + 1]!
        const frequency = i * binSize

        // Focus on musical frequencies (80Hz to 2000Hz) and find peaks above threshold
        if (frequency >= 80 && frequency <= 2000 && current > threshold) {
            if (current >= previous && current >= next) {
                const prominence = current - Math.max(previous, next)
                if (prominence >= 5) {
                    candidatePeaks.push({ frequency, amplitude: current, prominence })
                }
            }
        }
    }

    // Sort by amplitude (desc)
    const sortedPeaks = candidatePeaks.sort((a, b) => b.amplitude - a.amplitude)

    // Filter out harmonic overtones to keep likely fundamentals
    const fundamentals = filterHarmonicPeaks(sortedPeaks, { maxMultiple: 5, toleranceCents: 35 })

    const result = fundamentals.map(p => p.frequency)
    console.log(`Fundamentals: ${result.map(f => f.toFixed(1)).join(', ')}`)
    return result
}

/**
 * Find peaks in frequency data
 */
export function findFrequencyPeaks(
    frequencyData: Uint8Array,
    sampleRate: number,
    fftSize: number,
    options: {
        minAmplitude?: number
        minProminence?: number
        minFrequency?: number
        maxFrequency?: number
    } = {}
): FrequencyPeak[] {
    const {
        minAmplitude = 30,
        minProminence = 5,
        minFrequency = 80,
        maxFrequency = 2000
    } = options

    const peaks: FrequencyPeak[] = []
    const binSize = sampleRate / fftSize

    for (let i = 1; i < frequencyData.length - 1; i++) {
        const current = frequencyData[i]!
        const previous = frequencyData[i - 1]!
        const next = frequencyData[i + 1]!
        const frequency = i * binSize

        if (frequency >= minFrequency && frequency <= maxFrequency && current > minAmplitude) {
            if (current >= previous && current >= next) {
                const prominence = current - Math.max(previous, next)
                if (prominence >= minProminence) {
                    peaks.push({
                        frequency,
                        amplitude: current,
                        prominence
                    })
                }
            }
        }
    }

    return peaks.sort((a, b) => b.amplitude - a.amplitude)
}

/**
 * Calculate adaptive threshold based on signal characteristics
 */
export function calculateAdaptiveThreshold(
    frequencyData: Uint8Array,
    options: {
        minThreshold?: number
        thresholdRatio?: number
    } = {}
): number {
    const { minThreshold = 30, thresholdRatio = 0.3 } = options

    const maxAmplitude = Math.max(...frequencyData)
    return Math.max(minThreshold, maxAmplitude * thresholdRatio)
}

/**
 * Filter out harmonic peaks keeping likely fundamentals
 */
export function filterHarmonicPeaks(
    peaks: FrequencyPeak[],
    options: { maxMultiple?: number; toleranceCents?: number } = {}
): FrequencyPeak[] {
    const { maxMultiple = 6, toleranceCents = 35 } = options
    const fundamentals: FrequencyPeak[] = []

    for (const peak of peaks) {
        let isHarmonic = false
        for (const base of fundamentals) {
            for (let k = 2; k <= maxMultiple; k++) {
                const ratio = peak.frequency / (base.frequency * k)
                const cents = 1200 * Math.log2(ratio)
                if (Math.abs(cents) <= toleranceCents) {
                    isHarmonic = true
                    break
                }
            }
            if (isHarmonic) break
        }
        if (!isHarmonic) fundamentals.push(peak)
        // Limit to a reasonable number of fundamentals for a chord
        if (fundamentals.length >= 8) break
    }

    return fundamentals
}