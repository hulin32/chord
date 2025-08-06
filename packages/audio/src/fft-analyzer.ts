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
        // Create an offline context for analysis
        this.offlineContext = new OfflineAudioContext(
            1, // mono
            audioBuffer.length,
            audioBuffer.sampleRate
        )

        // Create source and analyser
        const source = this.offlineContext.createBufferSource()
        const analyser = this.offlineContext.createAnalyser()

        // Configure analyser for better frequency resolution
        analyser.fftSize = 4096 // Higher resolution for better frequency detection
        analyser.smoothingTimeConstant = 0.1 // Less smoothing for more responsive detection
        analyser.minDecibels = -90
        analyser.maxDecibels = -10

        // Connect nodes
        source.buffer = audioBuffer
        source.connect(analyser)
        analyser.connect(this.offlineContext.destination)

        // Start processing
        source.start(0)

        // Render the audio (this will populate the analyser with frequency data)
        await this.offlineContext.startRendering()

        // Get frequency data
        const frequencyData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(frequencyData)

        // Extract dominant frequencies
        return extractDominantFrequenciesFromFFT(frequencyData, audioBuffer.sampleRate, analyser.fftSize)
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
    const sampleSize = Math.min(4096, channelData.length)
    const segment = channelData.slice(0, sampleSize)

    const frequencies: Frequency[] = []
    const segmentSize = 512

    for (let i = 0; i < segment.length - segmentSize; i += segmentSize) {
        const subSegment = segment.slice(i, i + segmentSize)
        const peaks = findSimplePeaks(subSegment, sampleRate)
        frequencies.push(...peaks)
    }

    return [...new Set(frequencies)].slice(0, 8)
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
    const windowSize = 64
    const start = Math.max(0, centerIndex - windowSize)
    const end = Math.min(data.length, centerIndex + windowSize)

    let zeroCrossings = 0
    for (let i = start; i < end - 1; i++) {
        if ((data[i] || 0) * (data[i + 1] || 0) < 0) {
            zeroCrossings++
        }
    }

    // Frequency estimate based on zero crossings
    const period = (end - start) / (zeroCrossings / 2)
    return sampleRate / period
}