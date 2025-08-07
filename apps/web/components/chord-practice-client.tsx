"use client"

import { useState, useEffect, useRef, useCallback } from "react"

import { PracticeModeSelector } from "@/components/practice-mode-selector"
import { ChordDisplay } from "@/components/chord-display"
import { ControlsPanel } from "@/components/controls-panel"
import { getAllChords, getRandomChordFromGroup, getRandomChord, type Chord } from "@/lib/chords"
import { analyzeAudio } from "@/lib/chord-analyzer"

type PracticeMode = "all" | "group" | "specific"
type FeedbackState = "success" | "error" | null

export function ChordPracticeClient() {
    const [currentChord, setCurrentChord] = useState<Chord | null>(null)
    const [practiceMode, setPracticeMode] = useState<PracticeMode>("all")
    const [selectedGroup, setSelectedGroup] = useState<string>("major-open")
    const [selectedChordNames, setSelectedChordNames] = useState<string[]>([])
    const [isRecording, setIsRecording] = useState(false)

    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [visualFeedback, setVisualFeedback] = useState<FeedbackState>(null)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const isHandlingChordSelection = useRef(false)

    const selectNextChord = useCallback(() => {
        let nextChord: Chord | null = null

        switch (practiceMode) {
            case "all":
                nextChord = getRandomChord()
                break
            case "group":
                nextChord = getRandomChordFromGroup(selectedGroup)
                break
            case "specific":
                if (selectedChordNames.length > 0) {
                    const allChords = getAllChords()
                    const availableChords = allChords.filter(chord => selectedChordNames.includes(chord.name))
                    if (availableChords.length > 0) {
                        const randomIndex = Math.floor(Math.random() * availableChords.length)
                        nextChord = availableChords[randomIndex] ?? null
                    }
                }
                break
        }

        setCurrentChord(nextChord)
        setVisualFeedback(null)
    }, [practiceMode, selectedGroup, selectedChordNames])

    // Initialize with a random chord
    useEffect(() => {
        selectNextChord()
    }, [selectNextChord])

    // Update chord when practice mode or group changes
    useEffect(() => {
        if (practiceMode !== "specific") {
            selectNextChord()
        }
    }, [practiceMode, selectedGroup, selectNextChord])

    const handleChordSelection = (chordName: string, isSelected: boolean) => {
        if (isHandlingChordSelection.current) {
            return
        }

        isHandlingChordSelection.current = true

        setTimeout(() => {
            isHandlingChordSelection.current = false
        }, 100)

        if (isSelected) {
            setSelectedChordNames(prev => {
                // Prevent duplicate additions
                if (prev.includes(chordName)) {
                    return prev
                }
                return [...prev, chordName]
            })
        } else {
            setSelectedChordNames(prev => {
                // Only remove if actually present
                if (!prev.includes(chordName)) {
                    return prev
                }
                return prev.filter(name => name !== chordName)
            })
        }
    }

    const handleSelectAllChords = () => {
        const allChords = getAllChords()
        setSelectedChordNames(allChords.map(chord => chord.name))
    }

    const handleClearAllChords = () => {
        setSelectedChordNames([])
    }

    // Update current chord when selection changes in specific mode
    useEffect(() => {
        if (practiceMode === "specific" && selectedChordNames.length > 0) {
            selectNextChord()
        } else if (practiceMode === "specific" && selectedChordNames.length === 0) {
            setCurrentChord(null)
        }
    }, [selectedChordNames, practiceMode, selectNextChord])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            recorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data)
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" })
                audioChunks.current = []

                // Analyze the recorded audio
                if (currentChord) {
                    setIsAnalyzing(true)
                    setVisualFeedback(null)

                    try {
                        const isCorrect = await analyzeAudio(audioBlob, currentChord)

                        if (isCorrect) {
                            setVisualFeedback("success")

                            // Auto-advance logic based on practice mode
                            if (practiceMode === "specific" && selectedChordNames.length <= 1) {
                                // No auto-advance, user needs to select more chords
                                // Keep success feedback visible
                            } else {
                                setTimeout(() => {
                                    selectNextChord()
                                }, 3000)
                            }
                        } else {
                            setVisualFeedback("error")

                            // Clear error feedback after 3 seconds
                            setTimeout(() => {
                                setVisualFeedback(null)
                            }, 3000)
                        }
                    } catch (error) {
                        console.error("Analysis failed:", error)
                        setVisualFeedback("error")

                        // Clear error feedback after 3 seconds
                        setTimeout(() => {
                            setVisualFeedback(null)
                        }, 3000)
                    } finally {
                        setIsAnalyzing(false)
                    }
                }

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            console.error("Error accessing microphone:", error)
            // Could add visual feedback here if needed
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop()
            setIsRecording(false)
        }
    }

    if (!currentChord && practiceMode !== "specific") {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-6">
            <PracticeModeSelector
                practiceMode={practiceMode}
                selectedGroup={selectedGroup}
                selectedChordNames={selectedChordNames}
                onPracticeModeChange={setPracticeMode}
                onSelectedGroupChange={setSelectedGroup}
                onChordSelection={handleChordSelection}
                onSelectAllChords={handleSelectAllChords}
                onClearAllChords={handleClearAllChords}
            />

            {/* Main Practice Area - Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <ChordDisplay currentChord={currentChord} practiceMode={practiceMode} feedback={visualFeedback} />

                <div className="space-y-4">
                    <ControlsPanel
                        isRecording={isRecording}
                        isAnalyzing={isAnalyzing}
                        currentChord={currentChord}
                        practiceMode={practiceMode}
                        selectedChordNames={selectedChordNames}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onSelectNextChord={selectNextChord}
                    />
                </div>
            </div>
        </div>
    )
}
