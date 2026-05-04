'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateTeamStats } from '@/lib/stats-calculator'
import { Trophy, Zap, BarChart3 } from 'lucide-react'

interface TeamStatsCardProps {
  teamName: string
  games: any[]
  level?: string
}

export function TeamStatsCard({ teamName, games, level }: TeamStatsCardProps) {
  const stats = calculateTeamStats(games, [])
  const completedGames = games.filter(g => g.status === 'completed')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">{teamName}</div>
            {level && <CardDescription className="text-xs mt-1 capitalize">{level}</CardDescription>}
          </div>
          <Trophy className="h-5 w-5 text-amber-600" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded p-3">
              <div className="text-2xl font-bold text-slate-900">{stats.wins}-{stats.losses}</div>
              <div className="text-xs text-slate-600">Record</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-700">{stats.winPercentage}%</div>
              <div className="text-xs text-green-600">Win %</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-lg font-bold text-blue-700">{stats.runsPerGame}</div>
              <div className="text-xs text-blue-600">Runs/Game</div>
            </div>
            <div className="bg-purple-50 rounded p-3">
              <div className="text-lg font-bold text-purple-700">{stats.gamesPlayed}</div>
              <div className="text-xs text-purple-600">Games Played</div>
            </div>
          </div>

          {completedGames.length === 0 && (
            <div className="text-xs text-slate-500 italic mt-4">
              No completed games yet. Track games to see statistics.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
