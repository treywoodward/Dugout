'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, Undo2 } from 'lucide-react'

interface PitchCounterProps {
  balls: number
  strikes: number
  fouls: number
  onBall: () => void
  onStrike: () => void
  onFoul: () => void
  onUndo: () => void
  disabled?: boolean
}

export function PitchCounter({
  balls,
  strikes,
  fouls,
  onBall,
  onStrike,
  onFoul,
  onUndo,
  disabled = false,
}: PitchCounterProps) {
  const isFullCount = balls === 3 && strikes === 2

  return (
    <div className="space-y-4">
      {/* Count Display */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-blue-600">{balls}</div>
            <div className="text-sm font-medium text-muted-foreground">Balls</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-red-600">{strikes}</div>
            <div className="text-sm font-medium text-muted-foreground">Strikes</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-yellow-600">{fouls}</div>
            <div className="text-sm font-medium text-muted-foreground">Fouls</div>
          </div>
        </div>

        {isFullCount && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded">
            <AlertCircle className="h-4 w-4" />
            Full Count!
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={onBall}
          disabled={disabled || balls >= 4}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold h-24"
        >
          Ball
        </Button>
        <Button
          onClick={onStrike}
          disabled={disabled || strikes >= 3}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold h-24"
        >
          Strike
        </Button>
        <Button
          onClick={onFoul}
          disabled={disabled || (strikes >= 2 && fouls === 0)}
          size="lg"
          className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg font-bold h-24"
        >
          Foul
        </Button>
      </div>

      {/* Undo Button */}
      <Button
        onClick={onUndo}
        variant="outline"
        size="sm"
        disabled={disabled}
        className="w-full"
      >
        <Undo2 className="h-4 w-4 mr-2" />
        Undo Last Pitch
      </Button>
    </div>
  )
}
