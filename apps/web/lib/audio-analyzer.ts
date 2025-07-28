import { type Chord } from "./chords"
import { PitchDetector } from "pitchy"

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

// Analyze audio using pitchy library for accurate pitch detection
const detectPitches = async (audioBlob: Blob): Promise<number[]> => {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Convert to mono if stereo
  const channelData = audioBuffer.getChannelData(0)
  
  // Process audio in chunks to find multiple pitches
  const pitches: number[] = []
  const chunkSize = 4096
  const overlap = 2048
  const sampleRate = audioBuffer.sampleRate
  
  // Create pitch detector
  const detector = PitchDetector.forFloat32Array(chunkSize)
  
  for (let i = 0; i < channelData.length - chunkSize; i += chunkSize - overlap) {
    const chunk = channelData.slice(i, i + chunkSize)
    const [pitch, clarity] = detector.findPitch(chunk, sampleRate)
    
    // Only consider pitches with good clarity
    if (pitch > 0 && clarity > 0.85) {
      // Check if this pitch is already detected (within tolerance)
      const isDuplicate = pitches.some(p => Math.abs(p - pitch) < 5)
      if (!isDuplicate && pitch >= 70 && pitch <= 1200) {
        pitches.push(pitch)
      }
    }
  }
  
  audioContext.close()
  return pitches
}

// Check if detected pitches match expected chord frequencies
const matchFrequencies = (detected: number[], expected: number[]): boolean => {
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
    // For now, we'll use a simplified approach
    // In a real app, you'd want more sophisticated audio analysis
    
    // Get expected frequencies for the chord
    const expectedFrequencies = getChordFrequencies(chord)
    
    // Detect pitches in the recorded audio
    const detectedPitches = await detectPitches(audioBlob)
    
    // Check if they match
    const isMatch = matchFrequencies(detectedPitches, expectedFrequencies)
    
    // Log for debugging
    console.log('Expected frequencies:', expectedFrequencies)
    console.log('Detected pitches:', detectedPitches)
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