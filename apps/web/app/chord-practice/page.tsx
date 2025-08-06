"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
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

  // Initialize with a random chord
  useEffect(() => {
    selectNextChord()
  }, [])

  // Update chord when practice mode or group changes
  useEffect(() => {
    if (practiceMode !== "specific") {
      selectNextChord()
    }
  }, [practiceMode, selectedGroup])

  const selectNextChord = () => {
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
  }

  const handleChordSelection = (chordName: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedChordNames(prev => [...prev, chordName])
    } else {
      setSelectedChordNames(prev => prev.filter(name => name !== chordName))
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
  }, [selectedChordNames, practiceMode])

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

  if (!currentChord) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Guitar Chord Practice</CardTitle>
          <CardDescription>
            Play the chord shown below. Click "Start Recording" when you're ready!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Practice Mode Selection */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
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
                            onCheckedChange={(checked) =>
                              handleChordSelection(chord.name, checked as boolean)
                            }
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

          <div className="text-center">
            {currentChord ? (
              <>
                <h2 className="text-4xl font-bold mb-4">{currentChord.name}</h2>
                <ChordDiagram chord={currentChord} />
              </>
            ) : (
              <div className="py-12">
                <h2 className="text-2xl font-bold mb-4 text-gray-500">
                  {practiceMode === "specific" ?
                    "Please select chords above to start practicing" :
                    "Loading chord..."
                  }
                </h2>
                <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No chord selected</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg" disabled={isAnalyzing || !currentChord}>
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" variant="destructive">
                Stop Recording
              </Button>
            )}
            <Button
              onClick={selectNextChord}
              size="lg"
              variant="outline"
              disabled={isAnalyzing || (practiceMode === "specific" && selectedChordNames.length <= 1)}
            >
              {practiceMode === "specific" && selectedChordNames.length <= 1 ?
                "Select Multiple Chords" :
                practiceMode === "specific" ?
                  "Next Chord" :
                  "Skip Chord"
              }
            </Button>
          </div>

          {feedback.message && (
            <Alert className={
              feedback.type === "success" ? "border-green-500" :
                feedback.type === "error" ? "border-red-500" :
                  "border-blue-500"
            }>
              <AlertDescription className={
                feedback.type === "success" ? "text-green-700" :
                  feedback.type === "error" ? "text-red-700" :
                    "text-blue-700"
              }>
                {isAnalyzing && (
                  <span className="inline-block animate-spin mr-2">⏳</span>
                )}
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}