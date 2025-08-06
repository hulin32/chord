import type { Frequency, Amplitude, FrequencyPeak } from '@workspace/types'

/**
 * Extract dominant frequencies from FFT data
 */
export function extractDominantFrequenciesFromFFT(
    frequencyData: Uint8Array,
    sampleRate: number,
    fftSize: number
): Frequency[] {
    const frequencies: Frequency[] = []
    const binSize = sampleRate / fftSize

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
            // Check if this is a peak
            if (current >= previous && current >= next) {
                // Add some prominence check - peak should be significantly higher than neighbors
                const prominence = current - Math.max(previous, next)
                if (prominence >= 5) {
                    frequencies.push(frequency)
                    console.log(`Found peak: ${frequency.toFixed(1)}Hz (amplitude: ${current}, prominence: ${prominence})`)
                }
            }
        }
    }

    // Sort by amplitude (frequency data corresponds to amplitude at each frequency)
    const frequencyAmplitudes = frequencies.map(freq => {
        const bin = Math.round(freq / binSize)
        return { frequency: freq, amplitude: frequencyData[bin] || 0 }
    })

    frequencyAmplitudes.sort((a, b) => b.amplitude - a.amplitude)

    // Return top 12 frequencies (to capture harmonics of a chord)
    const topFrequencies = frequencyAmplitudes.slice(0, 12).map(fa => fa.frequency)
    console.log(`Top frequencies: ${topFrequencies.map(f => f.toFixed(1)).join(', ')}`)

    return topFrequencies
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