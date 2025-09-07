# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server with Next.js Turbopack
- `pnpm build` - Build all packages and applications
- `pnpm test` - Run tests in watch mode across all packages
- `pnpm test:run` - Run tests once (CI mode)
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm typecheck` - TypeScript type checking (run via turbo)
- `pnpm format` - Format code with Prettier

### Package-Specific Commands
- `pnpm test:ui` - Run Vitest UI for the web app
- Individual package commands can be run with `turbo` for cross-package dependencies

### Essential Pre-commit Checks
Always run these commands before completing any task:
1. `pnpm typecheck` - Ensure TypeScript compiles without errors
2. `pnpm lint` - Ensure code passes linting rules
3. `pnpm test:run` - Ensure all tests pass

## Architecture Overview

This is "Chord Muscle", a guitar chord training application built as a TypeScript monorepo using Turbo.js and pnpm workspaces.

### Technology Stack
- **Monorepo**: Turbo.js with pnpm workspaces
- **Frontend**: Next.js 15 with React 19, TypeScript 5.7+
- **UI**: Shadcn/ui components with Tailwind CSS
- **Audio**: Web Audio API with custom FFT analysis
- **Testing**: Vitest with jsdom environment
- **Package Manager**: pnpm (required, Node.js >=20)

### Workspace Structure
```
packages/
├── audio/           # Audio analysis, recording, FFT processing
├── music-theory/    # Chord detection, note conversion, frequency utils
├── types/           # Shared TypeScript interfaces
├── ui/              # Shadcn/ui components library
├── testing/         # Test utilities and mocks
├── eslint-config/   # Shared ESLint configurations
└── typescript-config/ # Shared TypeScript configurations

apps/
└── web/            # Main Next.js application
```

## Key Domain Concepts

### Audio Analysis Pipeline
1. **Real-time Processing**: Web Audio API captures live microphone input
2. **FFT Analysis**: Custom FFTAnalyzer converts time domain to frequency domain
3. **Note Detection**: Frequency peaks mapped to musical notes (A4 = 440Hz)
4. **Chord Recognition**: Notes grouped and classified into chord types
5. **Confidence Scoring**: Each detection includes reliability metric (0-1)

### Music Theory Implementation
- **Note System**: Standard Western notation with chromatic scale
- **Chord Types**: Major, minor, 7th, maj7, m7, sus2, sus4, extended chords
- **Harmonic Analysis**: Filters overtones for accurate fundamental frequency detection

### Core Classes (Key APIs)
- `ChordAnalyzer` (`apps/web/lib/chord-analyzer.ts`) - Main orchestrator
- `AudioAnalyzer` (`@workspace/audio`) - Real-time audio processing
- `FFTAnalyzer` (`@workspace/audio`) - Frequency domain analysis
- `AudioRecorder` (`@workspace/audio`) - Recording functionality

## Critical Import Patterns

```typescript
// Workspace packages (always preferred)
import { AudioAnalyzer } from '@workspace/audio'
import { detectChordsFromNotes } from '@workspace/music-theory'
import type { ChordDetectionResult } from '@workspace/types'

// UI components
import { Button } from '@workspace/ui/components/button'

// Local web app imports
import { analyzeAudio } from '@/lib/chord-analyzer'
import type { Chord } from '@/lib/chords'
```

## Testing Strategy

- **Framework**: Vitest with jsdom for DOM simulation
- **Audio Mocking**: Use `@workspace/testing` utilities to mock Web Audio API
- **Test Location**: `*.test.ts` or `*.spec.ts` files alongside source
- **Coverage**: Focus on audio processing accuracy and error handling
- **Performance**: Include tests for real-time processing constraints

## Performance Requirements

### Audio Processing Constraints
- Real-time analysis must complete within audio buffer intervals
- FFT processing should be optimized for low latency
- Use Web Workers for heavy computations when possible
- Proper cleanup of AudioContext resources to prevent memory leaks

### React Optimization
- Use `useCallback` and `useMemo` for expensive audio computations
- Implement proper dependency arrays to prevent unnecessary re-renders
- Clean up event listeners and audio resources in useEffect cleanup

## Error Handling Patterns

### Audio-Specific Errors
- Microphone permission denied - graceful fallback with clear user messaging
- AudioContext suspended (browser autoplay policy) - prompt user interaction
- Invalid audio format/unsupported sample rates - provide alternative options
- Chord detection failures - return null/empty results, don't throw

### Browser Compatibility
- Check for `AudioContext` vs `webkitAudioContext`
- Graceful degradation for browsers without Web Audio API support
- Handle getUserMedia() failures across different browsers

## Code Style Requirements

### TypeScript Standards
- Use strict typing with interfaces from `@workspace/types`
- Export types and implementations separately when needed
- Prefer `async/await` over Promise chains
- Always include proper error handling with try/catch blocks

### React Patterns
- Use `"use client"` directive for client-side components
- Functional components with hooks (no class components)
- Proper cleanup in useEffect for audio resources and event listeners
- Loading states for audio initialization and permission requests

### Audio Programming Guidelines
- Always dispose of AudioContext, MediaStreamTrack, and AnalyserNode resources
- Use proper error boundaries for audio-related components
- Include loading/initialization states for async audio setup
- Test audio features across different devices and browsers

## File Naming Conventions
- Components: PascalCase (`ChordDisplay.tsx`)
- Utilities: kebab-case (`chord-analyzer.ts`)
- Test files: `*.test.ts` or `*.spec.ts`
- Type definitions: Descriptive interfaces in `@workspace/types`

## Workspace Package Dependencies

The monorepo uses workspace protocol (`workspace:*`) for internal dependencies. Key workspace packages:
- `@workspace/audio` - Audio processing and analysis
- `@workspace/music-theory` - Chord detection and music utilities
- `@workspace/types` - Shared TypeScript interfaces
- `@workspace/ui` - Shadcn/ui component library
- `@workspace/testing` - Test utilities and mocks
- `@workspace/eslint-config` - Shared linting rules
- `@workspace/typescript-config` - Shared TypeScript configuration

When adding new features, prefer extending existing workspace packages over creating new dependencies.