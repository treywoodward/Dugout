'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AtBatResultProps {
  onHit: (type: 'single' | 'double' | 'triple' | 'home_run') => void
  onOut: () => void
  onWalk: () => void
  onStrikeout: () => void
  onHBP: () => void
  onFoul: () => void
  disabled?: boolean
  ballCount?: number
  strikeCount?: number
}

export function AtBatResult({
  onHit,
  onOut,
  onWalk,
  onStrikeout,
  onHBP,
  onFoul,
  disabled = false,
  ballCount,
  strikeCount,
}: AtBatResultProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-muted-foreground">At-Bat Result</div>

      {/* Hits */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">HITS</div>
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => onHit('single')}
            disabled={disabled}
            variant="outline"
            className="h-16 text-sm font-bold"
          >
            1B
          </Button>
          <Button
            onClick={() => onHit('double')}
            disabled={disabled}
            variant="outline"
            className="h-16 text-sm font-bold"
          >
            2B
          </Button>
          <Button
            onClick={() => onHit('triple')}
            disabled={disabled}
            variant="outline"
            className="h-16 text-sm font-bold"
          >
            3B
          </Button>
          <Button
            onClick={() => onHit('home_run')}
            disabled={disabled}
            variant="outline"
            className="h-16 text-sm font-bold text-destructive"
          >
            HR
          </Button>
        </div>
      </div>

      {/* Outs and Special */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">OUTCOMES</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onOut}
            disabled={disabled}
            variant="outline"
            className="h-14"
          >
            Out
          </Button>
          <Button
            onClick={onWalk}
            disabled={disabled}
            variant="outline"
            className="h-14"
          >
            Walk
          </Button>
          <Button
            onClick={onStrikeout}
            disabled={disabled}
            variant="outline"
            className="h-14"
          >
            K
          </Button>
          <Button
            onClick={onHBP}
            disabled={disabled}
            variant="outline"
            className="h-14"
          >
            HBP
          </Button>
        </div>
      </div>

      {ballCount !== undefined && strikeCount !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span className="text-blue-700">
            Count: {ballCount}-{strikeCount}
          </span>
        </div>
      )}
    </div>
  )
}
