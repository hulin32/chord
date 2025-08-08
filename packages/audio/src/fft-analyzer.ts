import type { AudioAnalyzerConfig, Frequency } from '@workspace/types'
import { extractDominantFrequenciesFromFFT } from '@workspace/music-theory'

/**
 * FFT-based frequency analysis using Web Audio API
 */
export class FFTAnalyzer {
    private offlineContext: OfflineAudioContext | null = null

    /**
     * Extract frequencies using Web Audio API's FFT analysis
     */
    async extractFrequenciesFromBuffer(audioBuffer: AudioBuffer): Promise<Frequency[]> {
        // Many browsers do not populate AnalyserNode data after OfflineAudioContext rendering reliably.
        // Instead, operate directly on the raw PCM data.
        const channelData = audioBuffer.getChannelData(0)
        if (!channelData || channelData.length === 0) {
            return []
        }

        // Use the fallback, windowed peak extraction on PCM data for robust results with recorded guitar audio
        return extractFrequenciesFromAudioData(channelData, audioBuffer.sampleRate)
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.offlineContext = null
    }
}

/**
 * Extract frequencies from raw audio data (fallback method)
 */
export function extractFrequenciesFromAudioData(channelData: Float32Array, sampleRate: number): Frequency[] {
    console.log('Using fallback frequency extraction method')
    if (!channelData || channelData.length === 0) {
        return []
    }

    // Use Goertzel algorithm on a set of musically-relevant target frequencies (guitar range)
    const windowSize = Math.min(8192, channelData.length)
    const windows: Float32Array[] = []
    const windowsCount: number = 4
    for (let w = 0; w < windowsCount; w++) {
        const t = windowsCount === 1 ? 0.5 : w / (windowsCount - 1)
        const startIndex = Math.max(0, Math.floor((channelData.length - windowSize) * t))
        const segment = channelData.slice(startIndex, startIndex + windowSize)
        // Apply a Hann window to reduce spectral leakage
        for (let i = 0; i < segment.length; i++) {
            const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (segment.length - 1)))
            segment[i] = (segment[i] || 0) * win
        }
        windows.push(segment)
    }

    // Prepare target MIDI notes in typical guitar range E2 (40) to E5 (76)
    const minMidi = 40
    const maxMidi = 76
    type Candidate = { midi: number; frequency: number; magnitude: number }
    const candidates: Candidate[] = []

    // Compute Goertzel magnitude for each semitone and a combined score including harmonics
    const nyquist = sampleRate / 2
    const mags: number[] = []
    for (let midi = minMidi; midi <= maxMidi; midi++) {
        const freq = 440 * Math.pow(2, (midi - 69) / 12)
        // Accumulate across windows to stabilize detection
        let score = 0
        for (const segment of windows) {
            const magFund = goertzelMagnitude(segment, sampleRate, freq)
            const mag2 = freq * 2 < nyquist ? goertzelMagnitude(segment, sampleRate, freq * 2) : 0
            const mag3 = freq * 3 < nyquist ? goertzelMagnitude(segment, sampleRate, freq * 3) : 0
            score += magFund + 0.5 * mag2 + 0.25 * mag3
        }
        mags[midi] = score
        candidates.push({ midi, frequency: freq, magnitude: score })
    }

    // Keep only local maxima across semitone neighborhood to avoid flat noise bands
    const localMaxima = candidates.filter(c => {
        const left = mags[c.midi - 1] ?? -Infinity
        const right = mags[c.midi + 1] ?? -Infinity
        return c.magnitude > left && c.magnitude > right
    })

    // Sort by magnitude descending
    localMaxima.sort((a, b) => b.magnitude - a.magnitude)

    // Filter out obvious harmonics of already-chosen fundamentals
    const chosen: Candidate[] = []
    const isHarmonic = (baseHz: number, candHz: number): boolean => {
        const toleranceCents = 30
        for (let k = 2; k <= 6; k++) {
            const ratio = candHz / (baseHz * k)
            const cents = 1200 * Math.log2(ratio)
            if (Math.abs(cents) <= toleranceCents) return true
        }
        return false
    }

    for (const c of localMaxima) {
        if (chosen.some(ch => isHarmonic(ch.frequency, c.frequency))) continue
        chosen.push(c)
        if (chosen.length >= 8) break
    }

    // Relative thresholding to suppress very weak detections
    const maxMag = chosen[0]?.magnitude || 0
    const minRel = maxMag * 0.35
    let filtered = chosen.filter(c => c.magnitude >= minRel)

    // If we still have fewer than 3 fundamentals, relax selection: pick top non-harmonic local maxima
    if (filtered.length < 3) {
        const relaxed: Candidate[] = []
        for (const c of localMaxima) {
            if (relaxed.some(ch => isHarmonic(ch.frequency, c.frequency))) continue
            relaxed.push(c)
            if (relaxed.length >= 3) break
        }
        if (relaxed.length >= filtered.length) filtered = relaxed
    }

    return filtered.map(c => c.frequency)
}

/**
 * Minimal Goertzel magnitude implementation for a single target frequency
 */
function goertzelMagnitude(samples: Float32Array, sampleRate: number, targetFrequency: number): number {
    if (targetFrequency <= 0 || !isFinite(targetFrequency)) return 0
    // Generalized Goertzel using exact target frequency (not limited to DFT bins)
    const omega = (2 * Math.PI * targetFrequency) / sampleRate
    const cosine = Math.cos(omega)
    const sine = Math.sin(omega)
    const coeff = 2 * cosine

    let q0 = 0
    let q1 = 0
    let q2 = 0

    for (let i = 0; i < samples.length; i++) {
        q0 = coeff * q1 - q2 + (samples[i] || 0)
        q2 = q1
        q1 = q0
    }

    const real = q1 - q2 * cosine
    const imag = q2 * sine
    return Math.sqrt(real * real + imag * imag)
}

/**
 * Simple peak detection without full FFT (fallback method)
 */
function findSimplePeaks(data: Float32Array, sampleRate: number): Frequency[] {
    const peaks: Frequency[] = []
    const windowSize = 32
    const threshold = 0.01 // Reduced threshold for better sensitivity

    for (let i = windowSize; i < data.length - windowSize; i++) {
        const current = Math.abs(data[i] || 0)

        if (current > threshold) {
            // Check if this is a local maximum
            let isMax = true
            for (let j = i - windowSize; j <= i + windowSize; j++) {
                if (j !== i && Math.abs(data[j] || 0) > current) {
                    isMax = false
                    break
                }
            }

            if (isMax) {
                // Estimate frequency based on zero crossings
                const frequency = estimateFrequency(data, i, sampleRate)
                if (frequency >= 80 && frequency <= 1500) {
                    peaks.push(frequency)
                }
            }
        }
    }

    return peaks
}

/**
 * Estimate frequency from zero crossings (fallback method)
 */
function estimateFrequency(data: Float32Array, centerIndex: number, sampleRate: number): Frequency {
    const windowSize = 256
    const start = Math.max(0, centerIndex - windowSize)
    const end = Math.min(data.length, centerIndex + windowSize)

    let zeroCrossings = 0
    for (let i = start; i < end - 1; i++) {
        if ((data[i] || 0) * (data[i + 1] || 0) < 0) {
            zeroCrossings++
        }
    }

    // Frequency estimate based on zero crossings
    const crossingsPerPeriod = 2
    const periodSamples = zeroCrossings > 0 ? (end - start) / (zeroCrossings / crossingsPerPeriod) : Infinity
    if (!isFinite(periodSamples) || periodSamples <= 0) return 0
    return sampleRate / periodSamples
}