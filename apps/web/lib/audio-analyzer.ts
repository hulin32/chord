import { type Chord } from "./chords"

// Guitar string frequencies (in Hz) for standard tuning
const GUITAR_FREQUENCIES = {
  6: 82.41,   // Low E
  5: 110.00,  // A
  4: 146.83,  // D
  3: 196.00,  // G
  2: 246.94,  // B
  1: 329.63   // High E
}

// Frequency for each fret (multiply by string frequency)
// Each fret increases pitch by a semitone (2^(1/12))
const getFretFrequency = (stringFreq: number, fret: number): number => {
  if (fret === 0) return stringFreq // Open string
  return stringFreq * Math.pow(2, fret / 12)
}

// Get expected frequencies for a chord
const getChordFrequencies = (chord: Chord): number[] => {
  const frequencies: number[] = []

  chord.frets.forEach((fret, index) => {
    if (fret !== -1 && fret !== null) { // Not muted
      const stringNumber = 6 - index // Convert index to string number
      const baseFreq = GUITAR_FREQUENCIES[stringNumber as keyof typeof GUITAR_FREQUENCIES]
      const freq = getFretFrequency(baseFreq, fret)
      frequencies.push(freq)
    }
  })

  return frequencies
}

// Simple but effective pitch detection using Web Audio API
const detectPitches = async (audioBlob: Blob): Promise<number[]> => {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // Convert to mono if stereo
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Parameters for analysis
  const frameSize = 2048
  const hopSize = 512
  const minPitch = 70  // Hz
  const maxPitch = 1200 // Hz
  const minAmplitude = 0.01

  const pitches: number[] = []
  const amplitudes: number[] = []

  // Process audio in overlapping frames
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize)

    // Calculate RMS amplitude
    const rms = Math.sqrt(frame.reduce((sum, sample) => sum + (sample ?? 0) * (sample ?? 0), 0) / frame.length)

    if (rms > minAmplitude) {
      // Use autocorrelation for pitch detection
      const pitch = autocorrelationPitch(frame, sampleRate, minPitch, maxPitch)
      if (pitch > 0) {
        pitches.push(pitch)
        amplitudes.push(rms)
      }
    }
  }

  // Filter and cluster pitches
  const filteredPitches = filterAndClusterPitches(pitches, amplitudes)

  audioContext.close()
  return filteredPitches
}

// Autocorrelation-based pitch detection
const autocorrelationPitch = (
  frame: Float32Array,
  sampleRate: number,
  minFreq: number,
  maxFreq: number
): number => {
  const maxLag = Math.floor(sampleRate / minFreq)
  const minLag = Math.floor(sampleRate / maxFreq)

  let bestLag = 0
  let bestCorrelation = 0

  // Calculate autocorrelation
  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0
    let count = 0

    for (let i = 0; i < frame.length - lag; i++) {
      const sample1 = frame[i] ?? 0
      const sample2 = frame[i + lag] ?? 0
      correlation += sample1 * sample2
      count++
    }

    if (count > 0) {
      correlation /= count
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    }
  }

  return bestLag > 0 ? sampleRate / bestLag : 0
}

// Filter and cluster pitches to remove duplicates
const filterAndClusterPitches = (pitches: number[], amplitudes: number[]): number[] => {
  if (pitches.length === 0) return []

  const clusters: Array<{ pitches: number[]; avgAmplitude: number }> = []
  const tolerance = 20 // Hz

  for (let i = 0; i < pitches.length; i++) {
    const pitch = pitches[i] ?? 0
    const amplitude = amplitudes[i] ?? 0
    let addedToCluster = false

    for (const cluster of clusters) {
      const clusterAvg = cluster.pitches.reduce((sum, p) => sum + (p ?? 0), 0) / cluster.pitches.length
      if (Math.abs(pitch - clusterAvg) < tolerance) {
        cluster.pitches.push(pitch)
        cluster.avgAmplitude = (cluster.avgAmplitude + amplitude) / 2
        addedToCluster = true
        break
      }
    }

    if (!addedToCluster) {
      clusters.push({
        pitches: [pitch],
        avgAmplitude: amplitude
      })
    }
  }

  // Return average of each cluster, sorted by amplitude
  return clusters
    .sort((a, b) => b.avgAmplitude - a.avgAmplitude)
    .map(cluster => {
      const avgPitch = cluster.pitches.reduce((sum, p) => sum + p, 0) / cluster.pitches.length
      return avgPitch
    })
    .slice(0, 6) // Return top 6 pitches
}

// Check if detected pitches match expected chord frequencies
const matchFrequencies = (detected: number[], expected: number[]): boolean => {
  if (expected.length === 0) return false
  if (detected.length === 0) return false

  // Tolerance for pitch matching (in cents - 100 cents = 1 semitone)
  const centsTolerance = 50 // Half a semitone
  let matchCount = 0

  console.log('Expected frequencies:', expected.map(f => f.toFixed(1) + 'Hz').join(', '))
  console.log('Detected pitches:', detected.map(f => f.toFixed(1) + 'Hz').join(', '))

  for (const expectedFreq of expected) {
    const hasMatch = detected.some(detectedFreq => {
      // Calculate difference in cents
      const cents = 1200 * Math.log2(detectedFreq / expectedFreq)
      if (Math.abs(cents) < centsTolerance) {
        console.log(`  ✓ Found ${expectedFreq.toFixed(1)}Hz (detected: ${detectedFreq.toFixed(1)}Hz, ${cents.toFixed(0)} cents off)`)
        return true
      }
      return false
    })
    if (hasMatch) {
      matchCount++
    } else {
      console.log(`  ✗ Missing ${expectedFreq.toFixed(1)}Hz`)
    }
  }

  const percentage = (matchCount / expected.length * 100).toFixed(0)
  console.log(`Matched ${matchCount}/${expected.length} frequencies (${percentage}%)`)

  // Consider it a match if at least 60% of expected frequencies are detected
  return matchCount >= expected.length * 0.6
}

// Main function to analyze audio and check if it matches the chord
export async function analyzeAudio(audioBlob: Blob, chord: Chord): Promise<boolean> {
  try {
    // Ensure some audio was recorded
    if (audioBlob.size < 1000) {
      console.log('Audio too short')
      return false
    }

    // Get expected frequencies for the chord
    const expectedFrequencies = getChordFrequencies(chord)

    if (expectedFrequencies.length === 0) {
      console.log('No expected frequencies for this chord')
      return false
    }

    // Detect pitches in the recorded audio using autocorrelation
    const detectedPitches = await detectPitches(audioBlob)

    // Check if they match
    const isMatch = matchFrequencies(detectedPitches, expectedFrequencies)

    // Log for debugging
    console.log('Expected frequencies:', expectedFrequencies)
    console.log('Detected pitches:', detectedPitches)
    console.log('Match result:', isMatch)

    return isMatch
  } catch (error) {
    console.error("Error analyzing audio:", error)
    return false
  }
} 