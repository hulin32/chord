import { type Chord } from "@/lib/chords"

interface ChordDiagramProps {
  chord: Chord
}

export function ChordDiagram({ chord }: ChordDiagramProps) {
  const strings = 6
  const frets = 5
  const stringSpacing = 40
  const fretSpacing = 50
  const startX = 60
  const startY = 40
  const circleRadius = 12

  return (
    <div className="flex justify-center">
      <svg
        width={startX * 2 + (strings - 1) * stringSpacing}
        height={startY * 2 + frets * fretSpacing}
        className="bg-white rounded-lg shadow-md"
      >
        {/* Fret numbers on the left */}
        {Array.from({ length: frets }, (_, i) => (
          <text
            key={`fret-number-${i}`}
            x={startX - 30}
            y={startY + (i + 0.5) * fretSpacing + 5}
            textAnchor="middle"
            className="text-sm fill-gray-600"
          >
            {i + 1}
          </text>
        ))}

        {/* Strings (vertical lines) */}
        {Array.from({ length: strings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + frets * fretSpacing}
            stroke="#333"
            strokeWidth={i === 0 || i === strings - 1 ? 3 : 2}
          />
        ))}

        {/* Frets (horizontal lines) */}
        {Array.from({ length: frets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + (strings - 1) * stringSpacing}
            y2={startY + i * fretSpacing}
            stroke="#333"
            strokeWidth={i === 0 ? 4 : 2}
          />
        ))}

        {/* Open/Muted string indicators */}
        {chord.frets.map((fret, stringIndex) => {
          const x = startX + stringIndex * stringSpacing
          const y = startY - 20

          if (fret === 0) {
            // Open string (O)
            return (
              <circle
                key={`open-${stringIndex}`}
                cx={x}
                cy={y}
                r={8}
                fill="none"
                stroke="#333"
                strokeWidth={2}
              />
            )
          } else if (fret === -1) {
            // Muted string (X)
            return (
              <g key={`muted-${stringIndex}`}>
                <line
                  x1={x - 6}
                  y1={y - 6}
                  x2={x + 6}
                  y2={y + 6}
                  stroke="#333"
                  strokeWidth={2}
                />
                <line
                  x1={x - 6}
                  y1={y + 6}
                  x2={x + 6}
                  y2={y - 6}
                  stroke="#333"
                  strokeWidth={2}
                />
              </g>
            )
          }
          return null
        })}

        {/* Finger positions */}
        {chord.frets.map((fret, stringIndex) => {
          if (fret && fret > 0) {
            const x = startX + stringIndex * stringSpacing
            const y = startY + (fret - 0.5) * fretSpacing
            const finger = chord.fingers?.[stringIndex]

            return (
              <g key={`finger-${stringIndex}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={circleRadius}
                  fill="#333"
                  className="transition-all duration-200 hover:fill-blue-600"
                />
                {finger && finger > 0 && (
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    className="text-sm font-bold fill-white pointer-events-none"
                  >
                    {finger}
                  </text>
                )}
              </g>
            )
          }
          return null
        })}

        {/* String names at the bottom */}
        {["E", "A", "D", "G", "B", "e"].map((note, i) => (
          <text
            key={`string-name-${i}`}
            x={startX + i * stringSpacing}
            y={startY + frets * fretSpacing + 25}
            textAnchor="middle"
            className="text-sm font-medium fill-gray-600"
          >
            {note}
          </text>
        ))}
      </svg>
    </div>
  )
} 