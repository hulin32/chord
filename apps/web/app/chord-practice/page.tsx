"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { ChordDiagram } from "@/components/chord-diagram"
import { chordGroups, getAllChords, getRandomChordFromGroup, getRandomChord, type Chord } from "@/lib/chords"
import { analyzeAudio } from "@/lib/chord-analyzer"

type PracticeMode = "all" | "group" | "specific"

export default function ChordPracticePage() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("all")
  const [selectedGroup, setSelectedGroup] = useState<string>("major-open")
  const [selectedChordNames, setSelectedChordNames] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: ""
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
    setFeedback({ type: null, message: "" })
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
          setFeedback({
            type: null,
            message: "Analyzing your chord... Please wait."
          })

          try {
            console.log("Starting audio analysis...")
            const isCorrect = await analyzeAudio(audioBlob, currentChord)
            console.log("Analysis complete, isCorrect:", isCorrect)

            if (isCorrect) {
              setFeedback({
                type: "success",
                message: "Great! You played it correctly. Moving to the next chord..."
              })
              // Auto-advance logic based on practice mode
              if (practiceMode === "specific" && selectedChordNames.length <= 1) {
                setTimeout(() => {
                  setFeedback({
                    type: "success",
                    message: "Perfect! You can practice this chord again or select more chords."
                  })
                }, 2000)
              } else {
                setTimeout(() => {
                  selectNextChord()
                }, 2000)
              }
            } else {
              setFeedback({
                type: "error",
                message: "Not quite right. Make sure you're pressing the correct strings and frets. Try again!"
              })
            }
          } catch (error) {
            console.error("Analysis failed:", error)
            setFeedback({
              type: "error",
              message: "Failed to analyze audio. Please try recording again."
            })
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
      setFeedback({ type: null, message: "" })
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setFeedback({
        type: "error",
        message: "Could not access microphone. Please check your permissions."
      })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Guitar Chord Practice</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master your guitar chords with real-time audio analysis. Play the chord shown below and get instant feedback!
          </p>
        </div>

        <div className="space-y-6">
          {/* Practice Mode Selection */}
          <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Practice Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practice-mode">Practice Mode</Label>
                <Select value={practiceMode} onValueChange={(value: PracticeMode) => setPracticeMode(value)}>
                  <SelectTrigger id="practice-mode">
                    <SelectValue placeholder="Select practice mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chords (Random)</SelectItem>
                    <SelectItem value="group">Chord Group</SelectItem>
                    <SelectItem value="specific">Specific Chord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {practiceMode === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="chord-group">Chord Group</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger id="chord-group">
                      <SelectValue placeholder="Select chord group" />
                    </SelectTrigger>
                    <SelectContent>
                      {chordGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {practiceMode === "specific" && (
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Chords ({selectedChordNames.length} selected)</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllChords}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllChords}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Selected chords badges */}
                  {selectedChordNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-2 bg-white rounded border">
                      {selectedChordNames.map((chordName) => (
                        <Badge key={chordName} variant="secondary" className="text-xs">
                          {chordName}
                          <button
                            type="button"
                            className="ml-1 hover:bg-gray-300 rounded"
                            onClick={() => handleChordSelection(chordName, false)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Chord selection grid */}
                  <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {getAllChords().map((chord) => (
                        <div key={chord.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={`chord-${chord.name}`}
                            checked={selectedChordNames.includes(chord.name)}
                            onCheckedChange={(checked) => {
                              handleChordSelection(chord.name, checked === true)
                            }}
                          />
                          <Label
                            htmlFor={`chord-${chord.name}`}
                            className="text-sm cursor-pointer"
                          >
                            {chord.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {practiceMode === "group" && (
              <div className="text-sm text-gray-600">
                {chordGroups.find(g => g.id === selectedGroup)?.description}
                {" "}({chordGroups.find(g => g.id === selectedGroup)?.chords.length} chords)
              </div>
            )}
          </div>

          {/* Main Practice Area - Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column - Current Chord Display */}
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

            {/* Right Column - Controls and Feedback */}
            <div className="space-y-4">
              {/* Control Buttons */}
              <div className="bg-white rounded-xl shadow-lg p-5">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Practice Controls</h2>
                <div className="space-y-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      disabled={isAnalyzing || !currentChord}
                      className="w-full px-6 py-2.5 text-base bg-green-600 hover:bg-green-700"
                    >
                      🎤 Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="w-full px-6 py-2.5 text-base"
                    >
                      ⏹️ Stop Recording
                    </Button>
                  )}
                  <Button
                    onClick={selectNextChord}
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

              {/* Feedback Section */}
              {feedback.message && (
                <div className={`rounded-xl shadow-lg p-5 ${feedback.type === "success" ? "bg-green-50 border-l-4 border-green-500" :
                  feedback.type === "error" ? "bg-red-50 border-l-4 border-red-500" :
                    "bg-blue-50 border-l-4 border-blue-500"
                  }`}>
                  <div className={`flex items-start text-base font-medium ${feedback.type === "success" ? "text-green-800" :
                    feedback.type === "error" ? "text-red-800" :
                      "text-blue-800"
                    }`}>
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {isAnalyzing && (
                        <span className="inline-block animate-spin text-xl">⏳</span>
                      )}
                      {feedback.type === "success" && !isAnalyzing && (
                        <span className="text-xl">✅</span>
                      )}
                      {feedback.type === "error" && !isAnalyzing && (
                        <span className="text-xl">❌</span>
                      )}
                      {!feedback.type && !isAnalyzing && (
                        <span className="text-xl">ℹ️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {feedback.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}