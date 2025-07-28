"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ChordDiagram } from "@/components/chord-diagram"
import { chords, type Chord } from "@/lib/chords"
import { analyzeAudio } from "@/lib/audio-analyzer"

export default function ChordPracticePage() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: ""
  })
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  // Initialize with a random chord
  useEffect(() => {
    selectRandomChord()
  }, [])

  const selectRandomChord = () => {
    const randomIndex = Math.floor(Math.random() * chords.length)
    setCurrentChord(chords[randomIndex])
    setFeedback({ type: null, message: "" })
  }

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
          const isCorrect = await analyzeAudio(audioBlob, currentChord)
          
          if (isCorrect) {
            setFeedback({
              type: "success",
              message: "Great! You played it correctly. Moving to the next chord..."
            })
            setTimeout(() => {
              selectRandomChord()
            }, 2000)
          } else {
            setFeedback({
              type: "error",
              message: "Not quite right. Make sure you're pressing the correct strings and frets. Try again!"
            })
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
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">{currentChord.name}</h2>
            <ChordDiagram chord={currentChord} />
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg">
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" variant="destructive">
                Stop Recording
              </Button>
            )}
            <Button onClick={selectRandomChord} size="lg" variant="outline">
              Skip Chord
            </Button>
          </div>

          {feedback.type && (
            <Alert className={feedback.type === "success" ? "border-green-500" : "border-red-500"}>
              <AlertDescription className={feedback.type === "success" ? "text-green-700" : "text-red-700"}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 