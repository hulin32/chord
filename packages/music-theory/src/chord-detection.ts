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

    const normalizedNotes = normalizeNotes(notes)
    console.log(`Normalized notes: [${normalizedNotes.join(', ')}]`)

    if (normalizedNotes.length < 3) {
        console.log(`Not enough normalized notes for chord detection (need at least 3, got ${normalizedNotes.length})`)
        return []
    }

    const detected = Chord.detect(normalizedNotes)
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
    let matches = 0
    detectedNotes.forEach(note => {
        if (chordNotes.includes(note)) {
            matches++
        }
    })
    return matches / chordNotes.length
}

/**
 * Analyze a specific set of notes to identify the chord
 */
export function analyzeChordFromNotes(notes: string[]): ChordDetectionResult | null {
    if (notes.length < 3) return null

    const normalizedNotes = normalizeNotes(notes)
    if (normalizedNotes.length < 3) return null

    const detected = Chord.detect(normalizedNotes)
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