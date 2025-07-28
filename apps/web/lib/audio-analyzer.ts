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

// Analyze audio and detect frequencies using FFT
const detectFrequencies = async (audioBlob: Blob): Promise<number[]> => {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Use analyser node for frequency analysis
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 8192 // Higher FFT size for better frequency resolution
  analyser.smoothingTimeConstant = 0.8
  
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(analyser)
  analyser.connect(audioContext.destination)
  
  source.start()
  
  // Wait a bit for the audio to play
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Get frequency data
  const frequencyData = new Float32Array(analyser.frequencyBinCount)
  analyser.getFloatFrequencyData(frequencyData)
  
  // Find peaks in frequency spectrum
  const peaks: number[] = []
  const minDb = -50 // Adjusted threshold for better detection
  const binWidth = audioContext.sampleRate / analyser.fftSize
  
  // Get the maximum value for normalization
  const maxValue = Math.max(...frequencyData.filter(v => v !== -Infinity))
  
  for (let i = 1; i < frequencyData.length - 1; i++) {
    const current = frequencyData[i]
    const prev = frequencyData[i - 1]
    const next = frequencyData[i + 1]
    
    if (
      current !== undefined &&
      prev !== undefined &&
      next !== undefined &&
      current > minDb &&
      current > prev &&
      current > next &&
      current > maxValue - 30 // Only consider strong peaks
    ) {
      const frequency = i * binWidth
      if (frequency >= 70 && frequency <= 1200) { // Extended guitar frequency range
        peaks.push(frequency)
      }
    }
  }
  
  audioContext.close()
  return peaks
}

// Check if detected frequencies match expected chord frequencies
const matchFrequencies = (detected: number[], expected: number[]): boolean => {
  // More forgiving tolerance for real-world guitar recordings
  const tolerance = 20 // Hz tolerance for frequency matching
  let matchCount = 0
  
  console.log('Checking frequency matches:')
  for (const expectedFreq of expected) {
    const hasMatch = detected.some(detectedFreq => {
      const diff = Math.abs(detectedFreq - expectedFreq)
      if (diff < tolerance) {
        console.log(`  ✓ Found ${expectedFreq.toFixed(1)}Hz (detected: ${detectedFreq.toFixed(1)}Hz)`)
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
    // For now, we'll use a simplified approach
    // In a real app, you'd want more sophisticated audio analysis
    
    // Get expected frequencies for the chord
    const expectedFrequencies = getChordFrequencies(chord)
    
    // Detect frequencies in the recorded audio
    const detectedFrequencies = await detectFrequencies(audioBlob)
    
    // Check if they match
    const isMatch = matchFrequencies(detectedFrequencies, expectedFrequencies)
    
    // Log for debugging
    console.log('Expected frequencies:', expectedFrequencies)
    console.log('Detected frequencies:', detectedFrequencies)
    console.log('Match result:', isMatch)
    
    // Ensure some audio was recorded
    if (audioBlob.size < 1000) {
      console.log('Audio too short')
      return false
    }
    
    return isMatch
  } catch (error) {
    console.error("Error analyzing audio:", error)
    return false
  }
} 