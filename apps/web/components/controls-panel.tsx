"use client"

import { Button } from "@workspace/ui/components/button"
import { type Chord } from "@/lib/chords"

type PracticeMode = "all" | "group" | "specific"

interface ControlsPanelProps {
    isRecording: boolean
    isAnalyzing: boolean
    currentChord: Chord | null
    practiceMode: PracticeMode
    selectedChordNames: string[]
    onStartRecording: () => void
    onStopRecording: () => void
    onSelectNextChord: () => void
}

export function ControlsPanel({
    isRecording,
    isAnalyzing,
    currentChord,
    practiceMode,
    selectedChordNames,
    onStartRecording,
    onStopRecording,
    onSelectNextChord
}: ControlsPanelProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg p-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Practice Controls</h2>
            <div className="space-y-3">
                {!isRecording ? (
                    <Button
                        onClick={onStartRecording}
                        size="lg"
                        disabled={isAnalyzing || !currentChord}
                        className="w-full px-6 py-2.5 text-base bg-green-600 hover:bg-green-700"
                    >
                        🎤 Start Recording
                    </Button>
                ) : (
                    <Button
                        onClick={onStopRecording}
                        size="lg"
                        variant="destructive"
                        className="w-full px-6 py-2.5 text-base"
                    >
                        ⏹️ Stop Recording
                    </Button>
                )}
                <Button
                    onClick={onSelectNextChord}
                    size="lg"
                    variant="outline"
                    disabled={isAnalyzing || (practiceMode === "specific" && selectedChordNames.length <= 1)}
                    className="w-full px-6 py-2.5 text-base"
                >
                    {practiceMode === "specific" && selectedChordNames.length <= 1 ?
                        "Select Multiple Chords" :
                        practiceMode === "specific" ?
                            "⏭️ Next Chord" :
                            "⏭️ Skip Chord"
                    }
                </Button>
            </div>
        </div>
    )
}
