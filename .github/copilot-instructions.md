# Chord Muscle - GitHub Copilot Instructions

## Project Overview
This is "Chord Muscle", a guitar chord training application that helps users practice guitar chords with real-time audio feedback. It's built as a TypeScript monorepo using Turbo.js and pnpm workspaces.

## Architecture & Technology Stack
- **Monorepo**: Turbo.js with pnpm workspaces
- **Frontend**: Next.js 15 with React 19, TypeScript 5.7+
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Audio Processing**: Web Audio API with custom FFT analysis
- **Testing**: Vitest with jsdom
- **Package Manager**: pnpm
- **Node Version**: >=20

## Workspace Packages Structure
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

## Key Concepts & Domain Logic

### Audio Analysis
- **Real-time processing**: Uses Web Audio API for live microphone input
- **FFT Analysis**: Custom FFTAnalyzer class for frequency domain analysis
- **Chord Detection**: Converts frequency peaks to musical notes, then to chords
- **Confidence scoring**: Each detection includes a confidence level (0-1)

### Music Theory
- **Note System**: Standard Western notation (A, A#, B, C, etc.)
- **Chord Types**: Major, minor, 7th, maj7, m7, sus2, sus4, etc.
- **Frequency Mapping**: 440Hz = A4, logarithmic scale for other notes
- **Harmonic Analysis**: Filters overtones and harmonics for accurate detection

### Practice Modes
1. **All Chords**: Random selection from entire chord library
2. **Group Practice**: Focus on chord groups (e.g., "major-open", "minor-barre")
3. **Specific Selection**: User-chosen subset of chords

### Core Classes & APIs
- `ChordAnalyzer`: Main analysis orchestrator
- `AudioAnalyzer`: Real-time audio processing
- `FFTAnalyzer`: Frequency domain analysis
- `AudioRecorder`: Recording functionality

## Coding Standards & Patterns

### TypeScript Conventions
- Use strict typing with interfaces from `@workspace/types`
- Prefer `async/await` over Promises
- Use proper error handling with try/catch blocks
- Export types and implementations separately when needed

### React Patterns
- Use `"use client"` directive for client components
- Prefer functional components with hooks
- Use `useCallback` and `useMemo` for performance optimization
- Handle component cleanup properly (audio resources, event listeners)

### Audio Programming Guidelines
- Always check for browser compatibility (`AudioContext` vs `webkitAudioContext`)
- Clean up audio resources in component unmount/dispose methods
- Use proper error handling for microphone access
- Include loading states for audio initialization

### File Naming Conventions
- Components: PascalCase (e.g., `ChordDisplay.tsx`)
- Utilities: kebab-case (e.g., `chord-analyzer.ts`)
- Test files: `*.test.ts` or `*.spec.ts`
- Type definitions: Use descriptive interfaces in `@workspace/types`

## Import Patterns
```typescript
// Workspace packages (preferred)
import { AudioAnalyzer } from '@workspace/audio'
import { detectChordsFromNotes } from '@workspace/music-theory'
import type { ChordDetectionResult } from '@workspace/types'

// UI components
import { Button } from '@workspace/ui/components/button'

// Relative imports for local files
import { analyzeAudio } from '@/lib/chord-analyzer'
import type { Chord } from '@/lib/chords'
```

## Testing Guidelines
- Use Vitest for all testing
- Mock audio APIs using `@workspace/testing` utilities
- Test both happy path and error conditions
- Include performance tests for audio processing functions
- Use descriptive test names that explain expected behavior

## Performance Considerations
- Optimize audio processing for real-time performance
- Use Web Workers for heavy FFT computations when possible
- Use proper debouncing for user input
- Optimize React re-renders with proper dependency arrays

## Common Tasks & Solutions

### Audio Analysis Flow
1. Initialize AudioContext and get microphone access
2. Create AnalyserNode with appropriate FFT size
3. Process frequency data in real-time or from recorded audio
4. Extract frequency peaks and convert to musical notes
5. Apply chord detection algorithms
6. Return results with confidence scores

### Error Handling Patterns
- Microphone permission denials
- Audio context suspension (browser policy)
- Invalid audio data or format issues
- Chord detection failures (return null/empty results)

## Development Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm test:run` - Run tests once (CI mode)

## When Suggesting Code
- Always consider real-time performance implications
- Include proper TypeScript types from workspace packages
- Add appropriate error handling for audio operations
- Consider browser compatibility for audio features
- Follow the established patterns for component structure
- Use the existing chord data structures and APIs
- Remember to dispose of audio resources properly

## When doing code review
- Review each changed file, except the real big file like pnpm-lock.yaml
- Check if the code is following the established patterns
- Check if the code is following the established coding standards
- Check if the code is following the established testing guidelines
- Check if the code is following the established performance considerations
- Check if the code is following the established error handling patterns
- Check if the code is following the established development commands
- Check if the code is following the established import patterns
- Check if the code is following the established file naming conventions
- Check performance implications