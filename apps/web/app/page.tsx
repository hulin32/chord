import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold mb-4">Guitar Chord Trainer</h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
          Practice your guitar chords with real-time audio feedback
        </p>
        <Link href="/chord-practice">
          <Button size="lg">Start Practicing</Button>
        </Link>
      </div>
    </div>
  )
}
