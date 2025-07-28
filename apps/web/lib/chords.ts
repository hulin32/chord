export interface Chord {
  name: string
  frets: (number | null)[] // null means open string, -1 means don't play
  fingers?: number[] // which finger to use (1-4)
}

// Three most common beginner chords
export const chords: Chord[] = [
  {
    name: "C Major",
    frets: [-1, 3, 2, 0, 1, 0], // strings 6-1 (E-A-D-G-B-e)
    fingers: [0, 3, 2, 0, 1, 0]
  },
  {
    name: "G Major",
    frets: [3, 2, 0, 0, 3, 3], // strings 6-1
    fingers: [2, 1, 0, 0, 3, 4]
  },
  {
    name: "D Major",
    frets: [-1, -1, 0, 2, 3, 2], // strings 6-1
    fingers: [0, 0, 0, 1, 3, 2]
  }
] 