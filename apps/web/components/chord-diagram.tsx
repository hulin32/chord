import { type Chord } from "@/lib/chords"
import { useEffect, useState } from "react"

type FeedbackState = "success" | "error" | null

interface ChordDiagramProps {
  chord: Chord
  feedback?: FeedbackState
}

export function ChordDiagram({ chord, feedback }: ChordDiagramProps) {
  const strings = 6
  const frets = 5
  const stringSpacing = 40
  const fretSpacing = 50
  const startX = 60
  const startY = 40
  const circleRadius = 12

  // Animation state management
  const [showFeedback, setShowFeedback] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<"enter" | "idle" | "exit">("enter")

  useEffect(() => {
    if (feedback) {
      setShowFeedback(true)
      setAnimationPhase("enter")

      // Enter animation duration
      const enterTimer = setTimeout(() => {
        setAnimationPhase("idle")
      }, 300)

      // Total feedback duration
      const feedbackTimer = setTimeout(() => {
        setAnimationPhase("exit")
        setTimeout(() => {
          setShowFeedback(false)
        }, 300)
      }, 1500)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(feedbackTimer)
      }
    } else {
      setShowFeedback(false)
      setAnimationPhase("enter")
    }
  }, [feedback])

  // Animation values based on phase
  const getAnimationValues = () => {
    switch (animationPhase) {
      case "enter":
        return {
          opacity: 0,
          scale: 0.8,
          blur: 4,
        }
      case "idle":
        return {
          opacity: 1,
          scale: 1,
          blur: 0,
        }
      case "exit":
        return {
          opacity: 0,
          scale: 1.1,
          blur: 2,
        }
      default:
        return { opacity: 0, scale: 1, blur: 0 }
    }
  }

  const animValues = getAnimationValues()

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

        {/* Enhanced Feedback overlays */}
        {showFeedback && feedback === "error" && (
          <g
            style={{
              opacity: animValues.opacity,
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Background blur effect */}
            <defs>
              <filter id="error-glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="error-radial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.15)" />
                <stop offset="70%" stopColor="rgba(239, 68, 68, 0.08)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.02)" />
              </radialGradient>
            </defs>

            {/* Expanding background waves */}
            {[1, 2, 3].map((wave, index) => (
              <rect
                key={`error-wave-${wave}`}
                x={startX - 15}
                y={startY - 35}
                width={(strings - 1) * stringSpacing + 30}
                height={frets * fretSpacing + 70}
                fill="url(#error-radial)"
                rx={12}
                style={{
                  transform: `scale(${animValues.scale * (0.7 + index * 0.15)})`,
                  transformOrigin: `${startX + ((strings - 1) * stringSpacing) / 2}px ${startY + (frets * fretSpacing) / 2}px`,
                  transition: `transform 0.${3 + index * 2}s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                  opacity: animationPhase === "enter" ? 0 : (1 - index * 0.3),
                }}
              />
            ))}

            {/* Center expanding border */}
            <rect
              x={startX - 12}
              y={startY - 32}
              width={(strings - 1) * stringSpacing + 24}
              height={frets * fretSpacing + 64}
              fill="none"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="2"
              rx={10}
              strokeDasharray="8 4"
              style={{
                transform: `scale(${animValues.scale})`,
                transformOrigin: `${startX + ((strings - 1) * stringSpacing) / 2}px ${startY + (frets * fretSpacing) / 2}px`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: "dash 1.5s linear infinite",
              }}
            />

            {/* Center error icon */}
            <g transform={`translate(${startX + ((strings - 1) * stringSpacing) / 2}, ${startY + (frets * fretSpacing) / 2})`}>
              {/* Error circle background */}
              <circle
                cx="0"
                cy="0"
                r="25"
                fill="rgba(239, 68, 68, 0.9)"
                filter="url(#error-glow)"
                style={{
                  transform: `scale(${animValues.scale})`,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* X mark */}
              <path
                d="M -8 -8 L 8 8 M -8 8 L 8 -8"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: `scale(${animValues.scale})`,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
                }}
              />
            </g>
          </g>
        )}

        {showFeedback && feedback === "success" && (
          <g
            style={{
              opacity: animValues.opacity,
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Background blur effect */}
            <defs>
              <filter id="success-glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="success-radial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.12)" />
                <stop offset="70%" stopColor="rgba(34, 197, 94, 0.06)" />
                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.02)" />
              </radialGradient>
            </defs>

            {/* Expanding background waves */}
            {[1, 2, 3].map((wave, index) => (
              <rect
                key={`success-wave-${wave}`}
                x={startX - 15}
                y={startY - 35}
                width={(strings - 1) * stringSpacing + 30}
                height={frets * fretSpacing + 70}
                fill="url(#success-radial)"
                rx={12}
                style={{
                  transform: `scale(${animValues.scale * (0.7 + index * 0.15)})`,
                  transformOrigin: `${startX + ((strings - 1) * stringSpacing) / 2}px ${startY + (frets * fretSpacing) / 2}px`,
                  transition: `transform 0.${3 + index * 2}s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
                  opacity: animationPhase === "enter" ? 0 : (1 - index * 0.3),
                }}
              />
            ))}

            {/* Center expanding border */}
            <rect
              x={startX - 12}
              y={startY - 32}
              width={(strings - 1) * stringSpacing + 24}
              height={frets * fretSpacing + 64}
              fill="none"
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
              rx={10}
              strokeDasharray="6 3"
              style={{
                transform: `scale(${animValues.scale})`,
                transformOrigin: `${startX + ((strings - 1) * stringSpacing) / 2}px ${startY + (frets * fretSpacing) / 2}px`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: "dash 1.2s linear infinite",
              }}
            />

            {/* Center success icon */}
            <g transform={`translate(${startX + ((strings - 1) * stringSpacing) / 2}, ${startY + (frets * fretSpacing) / 2})`}>
              {/* Success circle background */}
              <circle
                cx="0"
                cy="0"
                r="25"
                fill="rgba(34, 197, 94, 0.9)"
                filter="url(#success-glow)"
                style={{
                  transform: `scale(${animValues.scale})`,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* Checkmark */}
              <path
                d="M -8 0 L -2 6 L 8 -4"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{
                  strokeDasharray: "20",
                  strokeDashoffset: animationPhase === "enter" ? "20" : "0",
                  transition: "stroke-dashoffset 0.4s ease-out 0.1s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
                  transform: `scale(${animValues.scale})`,
                }}
              />
            </g>
          </g>
        )}

        {/* CSS animations */}
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -12;
              }
            }
          `}
        </style>
      </svg>
    </div>
  )
} 
