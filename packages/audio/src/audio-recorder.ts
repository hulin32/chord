import type { AudioRecordingOptions } from '@workspace/types'

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null
    private audioChunks: Blob[] = []
    private stream: MediaStream | null = null

    /**
     * Start recording audio
     */
    async startRecording(options: AudioRecordingOptions = {}): Promise<boolean> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    sampleRate: options.sampleRate,
                    channelCount: options.channelCount ?? 1,
                    echoCancellation: options.echoCancellation ?? true,
                    noiseSuppression: options.noiseSuppression ?? true,
                }
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints)
            this.mediaRecorder = new MediaRecorder(this.stream)
            this.audioChunks = []

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data)
                }
            }

            this.mediaRecorder.start()
            return true
        } catch (error) {
            console.error('Failed to start recording:', error)
            return false
        }
    }

    /**
     * Stop recording and return audio blob
     */
    async stopRecording(): Promise<Blob | null> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(null)
                return
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
                this.cleanup()
                resolve(audioBlob)
            }

            this.mediaRecorder.stop()
        })
    }

    /**
     * Check if currently recording
     */
    get isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording'
    }

    /**
     * Clean up resources
     */
    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
        this.mediaRecorder = null
        this.audioChunks = []
    }

    /**
     * Dispose of the recorder
     */
    dispose(): void {
        if (this.isRecording) {
            this.mediaRecorder?.stop()
        }
        this.cleanup()
    }
}