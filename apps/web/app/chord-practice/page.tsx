import { ChordPracticeClient } from "@/components/chord-practice-client"

export default function ChordPracticePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Guitar Chord Practice</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master your guitar chords with real-time audio analysis. Play the chord shown below and get instant feedback!
          </p>
        </div>

        <ChordPracticeClient />
      </div>
    </div>
  )
}