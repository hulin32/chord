# Guitar Chord Practice Application

A web-based guitar chord practice tool that helps you improve your chord playing skills with real-time audio feedback.

## Features

- **Visual Chord Diagrams**: Interactive SVG diagrams showing finger positions for each chord
- **Audio Recording**: Records your guitar playing through the microphone
- **Real-time Feedback**: Analyzes your playing and provides instant feedback
- **Common Chords**: Includes the three most common beginner chords:
  - C Major
  - G Major  
  - D Major

## How to Use

1. Navigate to the chord practice page by clicking "Start Practicing" on the home page
2. The app will display a random chord diagram
3. Position your fingers on your guitar according to the diagram:
   - Numbers in circles indicate which finger to use (1=index, 2=middle, 3=ring, 4=pinky)
   - X symbols mean don't play that string
   - O symbols mean play the open string
4. Click "Start Recording" when ready to play
5. Play the chord clearly
6. Click "Stop Recording" when done
7. The app will analyze your playing and provide feedback
8. If correct, it will automatically move to the next chord
9. Use "Skip Chord" if you want to practice a different chord

## Technical Details

- Built with Next.js and React
- Uses Web Audio API for audio recording and analysis
- Styled with Tailwind CSS and shadcn/ui components
- Frequency analysis to detect chord accuracy (simplified for demo)

## Notes

- Make sure to allow microphone access when prompted
- Play chords clearly with all strings ringing out for best results
- The audio analysis is simplified for demonstration purposes 