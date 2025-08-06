import { vi } from 'vitest'

// Mock Web Audio API
class MockAudioContext {
    sampleRate = 44100
    createAnalyser() {
        return {
            fftSize: 2048,
            frequencyBinCount: 1024,
            smoothingTimeConstant: 0.8,
            minDecibels: -100,
            maxDecibels: -30,
            getByteFrequencyData: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
        }
    }

    createBufferSource() {
        return {
            buffer: null,
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        }
    }

    createMediaStreamSource() {
        return {
            connect: vi.fn(),
            disconnect: vi.fn(),
        }
    }

    decodeAudioData() {
        return Promise.resolve({
            duration: 5.0,
            sampleRate: 44100,
            length: 220500,
            numberOfChannels: 1,
            getChannelData: (channel: number) => new Float32Array(220500),
        })
    }

    close() {
        return Promise.resolve()
    }
}

class MockOfflineAudioContext extends MockAudioContext {
    constructor(
        public numberOfChannels: number,
        public length: number,
        public sampleRate: number
    ) {
        super()
    }

    startRendering() {
        return Promise.resolve({
            duration: this.length / this.sampleRate,
            sampleRate: this.sampleRate,
            length: this.length,
            numberOfChannels: this.numberOfChannels,
            getChannelData: () => new Float32Array(this.length),
        })
    }

    get destination() {
        return {
            connect: vi.fn(),
            disconnect: vi.fn(),
        }
    }
}

// Mock MediaDevices
const mockMediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
    }),
}

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        ...window.navigator,
        mediaDevices: mockMediaDevices,
    },
    writable: true,
})

// Mock global audio context classes
global.AudioContext = MockAudioContext as any
global.OfflineAudioContext = MockOfflineAudioContext as any
global.webkitAudioContext = MockAudioContext as any

// Mock window.AudioContext
Object.defineProperty(window, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
})

Object.defineProperty(window, 'OfflineAudioContext', {
    value: MockOfflineAudioContext,
    writable: true,
})

Object.defineProperty(window, 'webkitAudioContext', {
    value: MockAudioContext,
    writable: true,
})