import type { ChordDetectionResult } from '@workspace/types'

/**
 * Generate mock frequency data for testing
 */
export function generateMockFrequencyData(peaks: Array<{ frequency: number; amplitude: number }>): Uint8Array {
    const data = new Uint8Array(1024)
    data.fill(20) // Background noise

    peaks.forEach(({ frequency, amplitude }) => {
        // Simple approximation: frequency to bin index
        const bin = Math.round(frequency / 21.5) // Assuming 44100/2048 bin size
        if (bin >= 0 && bin < data.length) {
            data[bin] = amplitude
            // Add some spreading to neighbors
            if (bin > 0) data[bin - 1] = amplitude - 10
            if (bin < data.length - 1) data[bin + 1] = amplitude - 10
        }
    })

    return data
}

/**
 * Generate mock audio buffer for testing
 */
export function generateMockAudioBuffer(duration = 1.0, sampleRate = 44100): AudioBuffer {
    const length = Math.floor(duration * sampleRate)
    const buffer = {
        duration,
        sampleRate,
        length,
        numberOfChannels: 1,
        getChannelData: (channel: number) => {
            const data = new Float32Array(length)
            // Generate simple sine wave at 440Hz (A4)
            for (let i = 0; i < length; i++) {
                data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3
            }
            return data
        }
    } as AudioBuffer

    return buffer
}

/**
 * Generate mock chord detection result
 */
export function generateMockChordResult(chord: string, confidence = 1.0): ChordDetectionResult {
    const chordMap: Record<string, string[]> = {
        'C': ['C', 'E', 'G'],
        'Dm': ['D', 'F', 'A'],
        'G7': ['G', 'B', 'D', 'F'],
        'Am': ['A', 'C', 'E']
    }

    return {
        chord,
        confidence,
        notes: chordMap[chord] || ['C', 'E', 'G'],
        root: chord[0] || 'C',
        quality: chord.slice(1) || 'major'
    }
}