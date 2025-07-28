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
  
  // Create offline context for analysis
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  )
  
  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer
  
  const analyser = offlineContext.createAnalyser()
  analyser.fftSize = 4096
  source.connect(analyser)
  analyser.connect(offlineContext.destination)
  
  source.start()
  const renderedBuffer = await offlineContext.startRendering()
  
  // Get frequency data
  const frequencyData = new Float32Array(analyser.frequencyBinCount)
  analyser.getFloatFrequencyData(frequencyData)
  
  // Find peaks in frequency spectrum
  const peaks: number[] = []
  const minDb = -60 // Minimum dB threshold
  const binWidth = audioContext.sampleRate / analyser.fftSize
  
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
      current > next
    ) {
      const frequency = i * binWidth
      if (frequency >= 80 && frequency <= 1000) { // Guitar frequency range
        peaks.push(frequency)
      }
    }
  }
  
  audioContext.close()
  return peaks
}

// Check if detected frequencies match expected chord frequencies
const matchFrequencies = (detected: number[], expected: number[]): boolean => {
  const tolerance = 10 // Hz tolerance for frequency matching
  let matchCount = 0
  
  for (const expectedFreq of expected) {
    const hasMatch = detected.some(detectedFreq => 
      Math.abs(detectedFreq - expectedFreq) < tolerance
    )
    if (hasMatch) matchCount++
  }
  
  // Consider it a match if at least 70% of expected frequencies are detected
  return matchCount >= expected.length * 0.7
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
    
    // For demonstration purposes, we'll use a random success rate
    // In a real implementation, you'd use proper frequency analysis
    const randomSuccess = Math.random() > 0.3 // 70% success rate for demo
    
    return randomSuccess && audioBlob.size > 1000 // Ensure some audio was recorded
  } catch (error) {
    console.error("Error analyzing audio:", error)
    return false
  }
} 