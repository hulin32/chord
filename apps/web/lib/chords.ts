export interface Chord {
  name: string
  frets: (number | null)[] // null means open string, -1 means don't play
  fingers?: number[] // which finger to use (1-4)
}

export interface ChordGroup {
  id: string
  name: string
  description: string
  chords: Chord[]
}

// Major open chords
export const majorOpenChords: Chord[] = [
  {
    name: "C Major",
    frets: [-1, 3, 2, 0, 1, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 3, 2, 0, 1, 0]
  },
  {
    name: "G Major",
    frets: [3, 2, 0, 0, 0, 3], // strings 6-1
    fingers: [2, 1, 0, 0, 0, 3]
  },
  {
    name: "D Major",
    frets: [-1, -1, 0, 2, 3, 2], // strings 6-1
    fingers: [0, 0, 0, 1, 3, 2]
  },
  {
    name: "A Major",
    frets: [-1, 0, 2, 2, 2, 0], // strings 6-1
    fingers: [0, 0, 1, 2, 3, 0]
  },
  {
    name: "E Major",
    frets: [0, 2, 2, 1, 0, 0], // strings 6-1
    fingers: [0, 2, 3, 1, 0, 0]
  }
]

// Dominant 7th chords
export const dominant7thChords: Chord[] = [
  {
    name: "C7",
    frets: [-1, 3, 2, 3, 1, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 3, 2, 4, 1, 0]
  },
  {
    name: "D7",
    frets: [-1, -1, 0, 2, 1, 2], // strings 6-1
    fingers: [0, 0, 0, 2, 1, 3]
  },
  {
    name: "E7",
    frets: [0, 2, 0, 1, 0, 0], // strings 6-1
    fingers: [0, 2, 0, 1, 0, 0]
  },
  {
    name: "G7",
    frets: [3, 2, 0, 0, 0, 1], // strings 6-1
    fingers: [3, 2, 0, 0, 0, 1]
  },
  {
    name: "A7",
    frets: [-1, 0, 2, 0, 2, 0], // strings 6-1
    fingers: [0, 0, 2, 0, 3, 0]
  },
]

// Major 7th chords
export const major7thChords: Chord[] = [
  {
    name: "Cmaj7",
    frets: [-1, 3, 2, 0, 0, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 3, 2, 0, 0, 0]
  },
  {
    name: "Dmaj7",
    frets: [-1, -1, 0, 2, 2, 2], // strings 6-1
    fingers: [0, 0, 0, 1, 1, 1]
  },
  {
    name: "Emaj7",
    frets: [0, 2, 1, 1, 0, 0], // strings 6-1
    fingers: [0, 3, 1, 2, 0, 0]
  },
  {
    name: "Gmaj7",
    frets: [3, 2, 0, 0, 0, 2], // strings 6-1
    fingers: [3, 2, 0, 0, 0, 1]
  },
  {
    name: "Amaj7",
    frets: [-1, 0, 2, 1, 2, 0], // strings 6-1
    fingers: [0, 0, 3, 1, 2, 0]
  }
]

// Minor open chords
export const minorOpenChords: Chord[] = [
  {
    name: "A Minor",
    frets: [-1, 0, 2, 2, 1, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 0, 2, 3, 1, 0]
  },
  {
    name: "E Minor",
    frets: [0, 2, 2, 0, 0, 0], // strings 6-1
    fingers: [0, 2, 3, 0, 0, 0]
  },
  {
    name: "D Minor",
    frets: [-1, -1, 0, 2, 3, 1], // strings 6-1
    fingers: [0, 0, 0, 1, 3, 2]
  },
]

// Minor 7th chords
export const minor7thChords: Chord[] = [
  {
    name: "Am7",
    frets: [-1, 0, 2, 0, 1, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 0, 2, 0, 1, 0]
  },
  {
    name: "Em7",
    frets: [0, 2, 0, 0, 0, 0], // strings 6-1
    fingers: [0, 2, 0, 0, 0, 0]
  },
  {
    name: "Dm7",
    frets: [-1, -1, 0, 2, 1, 1], // strings 6-1
    fingers: [0, 0, 0, 2, 1, 1]
  },
]

// Suspended 2nd chords
export const sus2Chords: Chord[] = [
  {
    name: "Asus2",
    frets: [-1, 0, 2, 2, 0, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 0, 1, 2, 0, 0]
  },
  {
    name: "Dsus2",
    frets: [-1, -1, 0, 2, 3, 0], // strings 6-1
    fingers: [0, 0, 0, 1, 2, 0]
  },
  {
    name: "Esus2",
    frets: [0, 2, 2, 4, 0, 0], // strings 6-1
    fingers: [0, 1, 2, 4, 0, 0]
  }
]

// Suspended 4th chords
export const sus4Chords: Chord[] = [
  {
    name: "Asus4",
    frets: [-1, 0, 2, 2, 3, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 0, 1, 2, 3, 0]
  },
  {
    name: "Dsus4",
    frets: [-1, -1, 0, 2, 3, 3], // strings 6-1
    fingers: [0, 0, 0, 1, 2, 3]
  },
  {
    name: "Esus4",
    frets: [0, 2, 2, 2, 0, 0], // strings 6-1
    fingers: [0, 1, 2, 3, 0, 0]
  }
]

// Chord groups for easy selection
export const chordGroups: ChordGroup[] = [
  {
    id: "major-open",
    name: "Major Open Chords",
    description: "Common major chords played in open position",
    chords: majorOpenChords
  },
  {
    id: "minor-open",
    name: "Minor Open Chords",
    description: "Common minor chords played in open position",
    chords: minorOpenChords
  },
  {
    id: "dominant-7th",
    name: "Dominant 7th Chords",
    description: "Seventh chords that add tension and are common in blues and jazz",
    chords: dominant7thChords
  },
  {
    id: "major-7th",
    name: "Major 7th Chords",
    description: "Smooth, jazzy sounding major seventh chords",
    chords: major7thChords
  },
  {
    id: "minor-7th",
    name: "Minor 7th Chords",
    description: "Mellow, sophisticated minor seventh chords",
    chords: minor7thChords
  },
  {
    id: "sus2",
    name: "Suspended 2nd Chords",
    description: "Open, neutral sounding chords with the 2nd replacing the 3rd",
    chords: sus2Chords
  },
  {
    id: "sus4",
    name: "Suspended 4th Chords",
    description: "Tension-filled chords with the 4th replacing the 3rd, want to resolve",
    chords: sus4Chords
  }
]

// All chords combined (for backward compatibility)
export const chords: Chord[] = [
  ...majorOpenChords,
  ...minorOpenChords,
  ...dominant7thChords,
  ...major7thChords,
  ...minor7thChords,
  ...sus2Chords,
  ...sus4Chords
]

// Helper functions for chord selection
export function getChordsByGroup(groupId: string): Chord[] {
  const group = chordGroups.find(g => g.id === groupId)
  return group ? group.chords : []
}

export function getAllChords(): Chord[] {
  return chords
}

export function getRandomChordFromGroup(groupId: string): Chord | null {
  const groupChords = getChordsByGroup(groupId)
  if (groupChords.length === 0) return null
  const randomIndex = Math.floor(Math.random() * groupChords.length)
  return groupChords[randomIndex] ?? null
}

export function getRandomChord(): Chord | null {
  if (chords.length === 0) return null
  const randomIndex = Math.floor(Math.random() * chords.length)
  return chords[randomIndex] ?? null
} 