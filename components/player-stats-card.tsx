'use client'

import { Card, CardContent } from '@/components/ui/card'
import { calculateBattingStats, calculatePitchingStats } from '@/lib/stats-calculator'

interface PlayerStatsCardProps {
  playerName: string
  jerseyNumber?: number
  stats: any
  statType?: 'batting' | 'pitching'
}

export function PlayerStatsCard({ playerName, jerseyNumber, stats, statType = 'batting' }: PlayerStatsCardProps) {
  if (statType === 'batting') {
    const battingStats = calculateBattingStats(stats)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{playerName}</div>
                {jerseyNumber && <div className="text-xs text-muted-foreground">#{jerseyNumber}</div>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="font-bold text-base">{battingStats.avg}</div>
                <div className="text-xs text-muted-foreground">AVG</div>
              </div>
              <div>
                <div className="font-bold text-base">{battingStats.obp}</div>
                <div className="text-xs text-muted-foreground">OBP</div>
              </div>
              <div>
                <div className="font-bold text-base">{battingStats.slg}</div>
                <div className="text-xs text-muted-foreground">SLG</div>
              </div>
              <div>
                <div className="font-bold text-base">{battingStats.ops}</div>
                <div className="text-xs text-muted-foreground">OPS</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t">
              <div>
                <div className="font-semibold">{stats.hits || 0}</div>
                <div className="text-muted-foreground">H</div>
              </div>
              <div>
                <div className="font-semibold">{stats.home_runs || 0}</div>
                <div className="text-muted-foreground">HR</div>
              </div>
              <div>
                <div className="font-semibold">{stats.rbis || 0}</div>
                <div className="text-muted-foreground">RBI</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pitching stats
  const pitchingStats = calculatePitchingStats(stats)
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{playerName}</div>
              {jerseyNumber && <div className="text-xs text-muted-foreground">#{jerseyNumber}</div>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="font-bold text-base">{pitchingStats.era}</div>
              <div className="text-xs text-muted-foreground">ERA</div>
            </div>
            <div>
              <div className="font-bold text-base">{pitchingStats.whip}</div>
              <div className="text-xs text-muted-foreground">WHIP</div>
            </div>
            <div>
              <div className="font-bold text-base">{pitchingStats.kPer9}</div>
              <div className="text-xs text-muted-foreground">K/9</div>
            </div>
            <div>
              <div className="font-bold text-base">{pitchingStats.strikePercentage}</div>
              <div className="text-xs text-muted-foreground">S%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t">
            <div>
              <div className="font-semibold">{stats.strikeouts || 0}</div>
              <div className="text-muted-foreground">K</div>
            </div>
            <div>
              <div className="font-semibold">{stats.walks || 0}</div>
              <div className="text-muted-foreground">BB</div>
            </div>
            <div>
              <div className="font-semibold">{(stats.innings_pitched || 0).toFixed(1)}</div>
              <div className="text-muted-foreground">IP</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
