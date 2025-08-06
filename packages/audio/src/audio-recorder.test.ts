import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioRecorder } from './audio-recorder'

// Mock MediaRecorder
class MockMediaRecorder {
    state: 'inactive' | 'recording' | 'paused' = 'inactive'
    ondataavailable: ((event: any) => void) | null = null
    onstop: (() => void) | null = null

    start() {
        this.state = 'recording'
        // Simulate data available
        setTimeout(() => {
            if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['mock audio'], { type: 'audio/wav' }) })
            }
        }, 10)
    }

    stop() {
        this.state = 'inactive'
        setTimeout(() => {
            if (this.onstop) {
                this.onstop()
            }
        }, 10)
    }
}

// Mock MediaStream
class MockMediaStream {
    getTracks() {
        return [{ stop: vi.fn() }]
    }
}

global.MediaRecorder = MockMediaRecorder as any

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: mockGetUserMedia
    },
    writable: true
})

describe('AudioRecorder', () => {
    let recorder: AudioRecorder

    beforeEach(() => {
        recorder = new AudioRecorder()
        vi.clearAllMocks()
        // Setup default successful getUserMedia mock
        mockGetUserMedia.mockResolvedValue(new MockMediaStream())
    })

    describe('recording', () => {
        it('should start recording successfully', async () => {
            const result = await recorder.startRecording()
            expect(result).toBe(true)
            expect(recorder.isRecording).toBe(true)
        })

        it('should handle recording errors gracefully', async () => {
            mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

            const result = await recorder.startRecording()
            expect(result).toBe(false)
        })

        it('should stop recording and return audio blob', async () => {
            await recorder.startRecording()
            const blob = await recorder.stopRecording()

            expect(blob).toBeInstanceOf(Blob)
            expect(recorder.isRecording).toBe(false)
        })

        it('should accept recording options', async () => {
            const options = {
                sampleRate: 48000,
                channelCount: 2,
                echoCancellation: false,
                noiseSuppression: false
            }

            const result = await recorder.startRecording(options)
            expect(result).toBe(true)
        })
    })

    describe('cleanup', () => {
        it('should dispose properly', () => {
            recorder.dispose()
            expect(recorder.isRecording).toBe(false)
        })
    })
})