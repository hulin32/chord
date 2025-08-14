import type { ChordDetectionResult } from '@workspace/types'
import { Chord } from 'tonal'
import { normalizeNotes } from './note-conversion'

/**
 * Detect chords from a set of notes
 */
export function detectChordsFromNotes(notes: string[]): ChordDetectionResult[] {
    console.log(`Detecting chords from notes: [${notes.join(', ')}]`)

    if (notes.length < 3) {
        console.log(`Not enough notes for chord detection (need at least 3, got ${notes.length})`)
        return []
    }

    console.log('notes', notes);
    const normalizedNotes = normalizeNotes(notes)
    console.log(`Normalized notes: [${normalizedNotes.join(', ')}]`)

    if (normalizedNotes.length < 3) {
        console.log(`Not enough normalized notes for chord detection (need at least 3, got ${normalizedNotes.length})`)
        return []
    }

    // First attempt with all notes
    let detected = Chord.detect(normalizedNotes)
    // If not found, try with a refined subset to eliminate spurious notes
    if (!detected.length) {
        const refined = refineNotesForChordDetection(normalizedNotes)
        if (refined.length >= 3) {
            detected = Chord.detect(refined)
        }
    }
    console.log(`Chord.detect() found ${detected.length} possible chords:`, detected)

    const bestMatch = detected[0]
    if (!bestMatch) {
        console.log('No chord matches found')
        return []
    }

    const chordInfo = bestMatch ? Chord.get(bestMatch) : null
    console.log(`Best match: ${bestMatch}`, chordInfo)

    if (!chordInfo || !chordInfo.notes) {
        console.log('Chord info is incomplete')
        return []
    }

    const confidence = calculateConfidence(normalizedNotes, chordInfo.notes)
    console.log(`Confidence: ${confidence.toFixed(3)} (detected notes: ${normalizedNotes.length}, chord notes: ${chordInfo.notes.length})`)

    const result = {
        chord: bestMatch,
        confidence,
        notes: normalizedNotes,
        root: chordInfo.tonic || '',
        quality: chordInfo.aliases?.[0] || chordInfo.name || ''
    }

    console.log('Final chord detection result:', result)
    return [result]
}

/**
 * Calculate confidence score for chord detection
 */
export function calculateConfidence(detectedNotes: string[], chordNotes: string[]): number {
    if (chordNotes.length === 0) return 0

    // Partial credit to near-miss notes: if detected note is within a semitone of any chord note
    const semitoneAdjacency: Record<string, string[]> = {
        'C': ['B', 'Db'],
        'Db': ['C', 'D'],
        'D': ['Db', 'Eb'],
        'Eb': ['D', 'E'],
        'E': ['Eb', 'F'],
        'F': ['E', 'Gb'],
        'Gb': ['F', 'G'],
        'G': ['Gb', 'Ab'],
        'Ab': ['G', 'A'],
        'A': ['Ab', 'Bb'],
        'Bb': ['A', 'B'],
        'B': ['Bb', 'C']
    }

    let score = 0
    for (const note of detectedNotes) {
        if (chordNotes.includes(note)) {
            score += 1
            continue
        }
        const neighbors = semitoneAdjacency[note] || []
        if (neighbors.some(n => chordNotes.includes(n))) {
            score += 0.4
        }
    }

    return score / chordNotes.length
}

/**
 * Analyze a specific set of notes to identify the chord
 */
export function analyzeChordFromNotes(notes: string[]): ChordDetectionResult | null {
    if (notes.length < 3) return null

    const normalizedNotes = normalizeNotes(notes)
    if (normalizedNotes.length < 3) return null

    let detected = Chord.detect(normalizedNotes)
    if (!detected.length) {
        const refined = refineNotesForChordDetection(normalizedNotes)
        if (refined.length >= 3) {
            detected = Chord.detect(refined)
        }
    }
    if (!detected.length) return null

    const bestMatch = detected[0]
    if (!bestMatch) return null

    const chordInfo = Chord.get(bestMatch)
    if (!chordInfo || !chordInfo.notes) return null

    const confidence = calculateConfidence(normalizedNotes, chordInfo.notes)

    return {
        chord: bestMatch,
        confidence,
        notes: normalizedNotes,
        root: chordInfo.tonic || '',
        quality: chordInfo.aliases?.[0] || chordInfo.name || ''
    }
}

/**
 * Get all possible chords for a given set of notes
 */
export function getAllPossibleChords(notes: string[]): string[] {
    const normalizedNotes = normalizeNotes(notes)
    return Chord.detect(normalizedNotes)
}

/**
 * Get chord information by name
 */
export function getChordInfo(chordName: string) {
    return Chord.get(chordName)
}

/**
 * Select a subset of notes most likely to form a valid chord (filters noisy extras).
 */
export function refineNotesForChordDetection(notes: string[]): string[] {
    const uniqueNotes = Array.from(new Set(notes))
    const limited = uniqueNotes.slice(0, 6)

    // Try 4-note then 3-note combinations
    const sizes = [4, 3]
    let bestSubset: string[] = []
    let bestScore = -Infinity

    for (const size of sizes) {
        for (const subset of combinations(limited, size)) {
            const candidates = Chord.detect(subset)
            if (candidates.length) {
                const chordInfo = Chord.get(candidates[0]!)
                const chordNotes = chordInfo?.notes ?? []
                const matchCount = subset.filter(n => chordNotes.includes(n)).length
                const confidence = matchCount / (chordNotes.length || subset.length)
                const score = confidence * 100 + (chordNotes.length || 0) * 10
                if (score > bestScore) {
                    bestScore = score
                    bestSubset = subset
                }
            }
        }
        if (bestSubset.length) break
    }

    return bestSubset.length ? bestSubset : limited
}

function combinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = []
    const n = arr.length
    if (k > n || k <= 0) return result
    const idx = Array.from({ length: k }, (_, i) => i)
    while (true) {
        result.push(idx.map(i => arr[i]!))
        let i = k - 1
        while (i >= 0 && idx[i]! === i + n - k) i--
        if (i < 0) break
        idx[i]!++
        for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1
    }
    return result
}