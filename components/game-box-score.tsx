'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Download } from 'lucide-react'

interface GameBoxScoreProps {
  game: any
  team: any
  opponent: string
  onShare?: () => void
  onExport?: () => void
}

export function GameBoxScore({ game, team, opponent, onShare, onExport }: GameBoxScoreProps) {
  const isCompleted = game.status === 'completed'
  const dateObj = new Date(game.game_date)
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {team.name} vs {opponent}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {formattedDate}
                {game.location && ` • ${game.location}`}
              </CardDescription>
            </div>
            <div className="text-right">
              {isCompleted && (
                <div className="text-3xl font-bold">
                  <span className={game.final_score_us > game.final_score_them ? 'text-green-600' : 'text-slate-600'}>
                    {game.final_score_us || 0}
                  </span>
                  <span className="text-slate-400 mx-2">-</span>
                  <span className={game.final_score_them > game.final_score_us ? 'text-red-600' : 'text-slate-600'}>
                    {game.final_score_them || 0}
                  </span>
                </div>
              )}
              {game.status === 'in_progress' && (
                <div className="text-sm font-semibold text-amber-600">In Progress</div>
              )}
              {game.status === 'scheduled' && (
                <div className="text-sm font-semibold text-slate-500">Scheduled</div>
              )}
            </div>
          </div>

          {game.home_away && (
            <div className="text-sm text-muted-foreground">
              {game.home_away === 'home' ? '🏠 Home Game' : '✈️ Away Game'}
            </div>
          )}
        </div>
      </CardHeader>

      {isCompleted && (
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded p-4">
              <div className="text-sm text-slate-600 mb-1">Hits</div>
              <div className="text-2xl font-bold">{game.hits || 0}</div>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <div className="text-sm text-blue-600 mb-1">Errors</div>
              <div className="text-2xl font-bold">{game.errors || 0}</div>
            </div>
            <div className="bg-green-50 rounded p-4">
              <div className="text-sm text-green-600 mb-1">Duration</div>
              <div className="text-2xl font-bold">{game.duration || 'N/A'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onShare && (
              <Button onClick={onShare} variant="outline" size="sm" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>

          {game.notes && (
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm font-medium mb-2">Notes</div>
              <div className="text-sm text-slate-600">{game.notes}</div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
