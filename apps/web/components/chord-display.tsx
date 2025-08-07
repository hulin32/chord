import { ChordDiagram } from "@/components/chord-diagram"
import { type Chord } from "@/lib/chords"

type PracticeMode = "all" | "group" | "specific"

interface ChordDisplayProps {
    currentChord: Chord | null
    practiceMode: PracticeMode
}

export function ChordDisplay({ currentChord, practiceMode }: ChordDisplayProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Chord</h2>
            {currentChord ? (
                <>
                    <h3 className="text-5xl font-bold text-indigo-600 mb-6">{currentChord.name}</h3>
                    <div className="flex justify-center">
                        <ChordDiagram chord={currentChord} />
                    </div>
                </>
            ) : (
                <div className="py-8">
                    <h3 className="text-2xl font-bold mb-4 text-gray-400">
                        {practiceMode === "specific" ?
                            "Please select chords above to start practicing" :
                            "Loading chord..."
                        }
                    </h3>
                    <div className="w-64 h-64 bg-gray-50 rounded-xl mx-auto flex items-center justify-center border-2 border-dashed border-gray-200">
                        <span className="text-gray-400 text-lg">No chord selected</span>
                    </div>
                </div>
            )}
        </div>
    )
}
